import { WorkerStatusMap } from '@/pages/resources/config';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import { useRef } from 'react';
import { CPU_BACKEND, matrixServesFamily, profileRamGib } from '../config';
import { CacheProviderItem, CacheServiceInstanceItem } from '../config/types';
import {
  GiB,
  componentEnabled,
  getFreeMemory,
  getTotalMemory,
  matchesSelector,
  resolveFieldValue
} from '../forms/utils';
import { planRecreation, recreationAvailableRam } from './placement-resources';

export interface ResourceCheckStatus {
  show: boolean;
  type?: Global.MessageType;
  message: string;
}

// Everything the pre-flight reads, supplied by the action that runs it.
export interface PlacementInputs {
  provider?: CacheProviderItem;
  providerVersion?: string;
  fieldValues?: Record<string, any> | null;
  workers: WorkerListItem[];
  workerId?: number;
  workerSelector?: Record<string, string> | null;
  mode?: 'create' | 'recreate';
  replacingInstances?: CacheServiceInstanceItem[];
  // A single-instance replacement reclaims only this instance's claim.
  recreateInstance?: CacheServiceInstanceItem;
  // The current siblings determine sticky placement after a single delete.
  existingInstances?: CacheServiceInstanceItem[];
}

const hidden: ResourceCheckStatus = { show: false, message: '' };

type Formatter = ReturnType<typeof useIntl>;

export const checkWorkerReadiness = (
  {
    workers,
    workerId,
    workerSelector
  }: Pick<PlacementInputs, 'workers' | 'workerId' | 'workerSelector'>,
  intl: Formatter
): ResourceCheckStatus | undefined => {
  const ready = workers.filter(
    (worker) => worker.state === WorkerStatusMap.ready
  );
  let messageId: string | undefined;
  if (!ready.length) {
    messageId = 'kvCache.check.noReadyWorkers';
  } else if (
    !ready.some(
      (worker) =>
        (workerId == null || worker.id === workerId) &&
        matchesSelector(worker, workerSelector)
    )
  ) {
    messageId = 'kvCache.check.noReadyTargets';
  }
  return messageId
    ? {
        show: true,
        type: 'danger',
        message: intl.formatMessage({ id: messageId })
      }
    : undefined;
};

const checkVersionCompatibility = (
  targets: WorkerListItem[],
  provider: CacheProviderItem | undefined,
  providerVersion: string | undefined,
  intl: Formatter
): ResourceCheckStatus | undefined => {
  // A worker whose accelerator the version has no image for cannot run the
  // cache server — the worker refuses such an instance at start with this
  // same reason, and saying it here is what keeps that off the instance.
  //
  // Mirrors the rule the worker applies, including for a worker with no
  // accelerator: it asks under the CPU key like any other node, and the
  // plain image answers where the matrix has none — for that node and for
  // nothing else.
  const versionConfig =
    providerVersion && providerVersion !== 'custom'
      ? provider?.versions?.[providerVersion]
      : undefined;
  const runtimeImages = versionConfig?.runtime_images || {};
  // A worker with no device asks under the CPU key; one whose device has not
  // reported its family yet says nothing, and is left out of the judgement
  // rather than read as having none — it has an accelerator, and taking it
  // for a CPU node would pass it on the plain image the matrix has no build
  // of for whatever it turns out to be.
  const acceleratorOf = (worker: WorkerListItem) =>
    worker.status?.gpu_devices?.length
      ? worker.status.gpu_devices[0]?.type
      : CPU_BACKEND;
  const unsupported = Object.keys(runtimeImages).length
    ? targets.filter((worker) => {
        const family = acceleratorOf(worker);
        if (!family || matrixServesFamily(runtimeImages, family)) {
          return false;
        }
        return !(family === CPU_BACKEND && Boolean(versionConfig?.image));
      })
    : [];
  // Two ways to be unserved, and they read as different sentences: a worker
  // whose accelerator this version has no build for, and one with no
  // accelerator where it has nothing to run without a device. A cluster
  // holding both is reported on the accelerators — the answer there is a
  // version or a selector, while the CPU side of it follows.
  const unsupportedAccel = unsupported.filter(
    (worker) => acceleratorOf(worker) !== CPU_BACKEND
  );
  if (unsupportedAccel.length) {
    return {
      show: true,
      type: 'warning',
      message: intl.formatMessage(
        { id: 'kvCache.check.unsupportedAccel' },
        {
          count: unsupportedAccel.length,
          total: targets.length,
          backends: Array.from(
            new Set(unsupportedAccel.map(acceleratorOf))
          ).join(', ')
        }
      )
    };
  }
  if (unsupported.length) {
    return {
      show: true,
      type: 'warning',
      message: intl.formatMessage(
        { id: 'kvCache.check.noCpuImage' },
        { count: unsupported.length, total: targets.length }
      )
    };
  }
  return undefined;
};

const evaluateRecreation = (
  inputs: PlacementInputs,
  intl: Formatter
): ResourceCheckStatus => {
  const unavailable = (): ResourceCheckStatus => ({
    show: true,
    type: 'warning',
    message: intl.formatMessage({ id: 'kvCache.check.recreate.unavailable' })
  });
  if (!inputs.provider) {
    return unavailable();
  }
  const plan = planRecreation({ ...inputs, provider: inputs.provider });
  if (!plan.hasDeployments && !plan.unavailable) {
    return hidden;
  }
  if (!inputs.workers.length) {
    return unavailable();
  }
  if (plan.insufficientWorkers) {
    return {
      show: true,
      type: 'warning',
      message: intl.formatMessage(
        { id: 'kvCache.check.store.insufficientWorkers' },
        plan.insufficientWorkers
      )
    };
  }
  if (!plan.targets.length) {
    return plan.unavailable
      ? unavailable()
      : {
          show: true,
          type: 'warning',
          message: intl.formatMessage({ id: 'kvCache.check.noWorkers' })
        };
  }
  const compatibility = checkVersionCompatibility(
    plan.targets,
    inputs.provider,
    inputs.providerVersion,
    intl
  );
  if (compatibility) {
    return compatibility;
  }
  const replacing = inputs.recreateInstance
    ? [inputs.recreateInstance]
    : inputs.replacingInstances;
  let incomplete = plan.unavailable || false;
  for (const worker of plan.targets) {
    const required = plan.required.get(worker.id) || 0;
    if (!required) {
      continue;
    }
    const available = recreationAvailableRam(worker, replacing);
    if (available === undefined) {
      incomplete = true;
    } else if (required > available) {
      return {
        show: true,
        type: 'warning',
        message: intl.formatMessage(
          { id: 'kvCache.check.recreate.insufficientRam' },
          {
            worker: worker.name,
            required: _.round(required / GiB, 2),
            available: _.round(available / GiB, 2)
          }
        )
      };
    }
  }
  // A passing reservation check does not promise physical free RAM or
  // future placement; preserve the form's existing recreate-to-apply notice.
  return incomplete ? unavailable() : hidden;
};

// Creation retains the free-RAM advisory. Recreation uses the scheduler's
// reservation budget and reclaims only the instances being replaced.
export const evaluatePlacement = (
  inputs: PlacementInputs,
  intl: Formatter
): ResourceCheckStatus => {
  if (inputs.mode === 'recreate') {
    return evaluateRecreation(inputs, intl);
  }
  if (!inputs.provider) {
    return hidden;
  }
  const readiness = checkWorkerReadiness(inputs, intl);
  if (readiness) {
    return readiness;
  }
  const { provider, providerVersion, fieldValues, workerId, workerSelector } =
    inputs;
  const workers = inputs.workers.filter(
    (worker) => worker.state === WorkerStatusMap.ready
  );
  const managedFields = provider?.fields || [];
  const isPerNode = provider?.topology === 'per_node';
  // The component claiming RAM through its resource_profile is the
  // only placement the service form can check — engine-side
  // consumption follows the deployments. What to check depends on how
  // that component is placed, not on how many components there are: a
  // replicas pool needs enough workers that fit, while a per_node
  // component lands on every matching worker, so the tightest one
  // decides (which is the path below).
  const claiming = Object.values(provider?.components || {}).find(
    (component) =>
      Boolean(component.resource_profile?.ram_gib) &&
      componentEnabled(component, managedFields, fieldValues)
  );
  if (claiming && claiming.topology !== 'per_node') {
    const size = profileRamGib(
      claiming.resource_profile,
      managedFields,
      fieldValues
    );
    const replicas = claiming.replicas_by
      ? Number(
          resolveFieldValue(claiming.replicas_by, managedFields, fieldValues)
        ) || 1
      : (claiming.replicas ?? 1);
    if (!size || !workers.length) {
      return hidden;
    }
    const matched = workers.filter((worker) =>
      matchesSelector(worker, workerSelector)
    );
    if (matched.length < replicas) {
      return {
        show: true,
        type: 'warning',
        message: intl.formatMessage(
          { id: 'kvCache.check.store.insufficientWorkers' },
          { count: matched.length, replicas }
        )
      };
    }
    const fitting = matched.filter((worker) => {
      const memory = getFreeMemory(worker);
      return memory !== undefined && memory > size * GiB;
    });
    if (fitting.length < replicas) {
      return {
        show: true,
        type: 'warning',
        message: intl.formatMessage(
          {
            id: 'kvCache.check.store.exceedsFree'
          },
          { count: fitting.length, replicas, size }
        )
      };
    }
    return {
      show: true,
      type: 'success',
      message: intl.formatMessage(
        { id: 'kvCache.check.ok.store' },
        { replicas, size }
      )
    };
  }
  const instanceGib = profileRamGib(
    claiming?.resource_profile ?? provider?.resource_profile,
    managedFields,
    fieldValues
  );
  if (!instanceGib || !workers.length) {
    return hidden;
  }
  const targets = isPerNode
    ? workers.filter((worker) => matchesSelector(worker, workerSelector))
    : workers.filter((worker) => worker.id === workerId);
  if (!targets.length) {
    return isPerNode
      ? {
          show: true,
          type: 'warning',
          message: intl.formatMessage({ id: 'kvCache.check.noWorkers' })
        }
      : hidden;
  }
  const compatibility = checkVersionCompatibility(
    targets,
    provider,
    providerVersion,
    intl
  );
  if (compatibility) {
    return compatibility;
  }
  const constrained = targets
    .filter((worker) => getTotalMemory(worker) !== undefined)
    .sort((a, b) => getTotalMemory(a)! - getTotalMemory(b)!)[0];
  if (constrained && instanceGib * GiB >= getTotalMemory(constrained)!) {
    return {
      show: true,
      type: 'warning',
      message: intl.formatMessage(
        { id: 'kvCache.form.ramSize.exceedsTotal' },
        {
          worker: constrained.name,
          total: Math.floor(getTotalMemory(constrained)! / GiB)
        }
      )
    };
  }
  const tightest = targets
    .filter((worker) => getFreeMemory(worker) !== undefined)
    .sort((a, b) => getFreeMemory(a)! - getFreeMemory(b)!)[0];
  if (tightest && instanceGib * GiB > getFreeMemory(tightest)!) {
    return {
      show: true,
      type: 'warning',
      message: intl.formatMessage(
        { id: 'kvCache.form.ramSize.exceedsFree' },
        {
          worker: tightest.name,
          free: Math.floor(getFreeMemory(tightest)! / GiB)
        }
      )
    };
  }
  return {
    show: true,
    type: 'success',
    message: isPerNode
      ? intl.formatMessage(
          { id: 'kvCache.check.ok.perNode' },
          { count: targets.length }
        )
      : intl.formatMessage(
          { id: 'kvCache.check.ok.singleton' },
          { worker: targets[0].name }
        )
  };
};

const usePlacementCheck = (
  onCheckStatusChange?: (status: ResourceCheckStatus) => void
) => {
  const intl = useIntl();
  const lastInputs = useRef<PlacementInputs | null>(null);

  const checkPlacement = useMemoizedFn((inputs: PlacementInputs) => {
    if (_.isEqual(lastInputs.current, inputs)) {
      return;
    }
    // Include fetched context, and copy mutable form values: the same form
    // configuration may need checking once its workers or catalog arrive.
    lastInputs.current = _.cloneDeep(inputs);
    onCheckStatusChange?.(evaluatePlacement(inputs, intl));
  });

  const resetPlacementCheck = () => {
    lastInputs.current = null;
  };

  return { checkPlacement, resetPlacementCheck };
};

export default usePlacementCheck;
