import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { useIntl } from '@umijs/max';
import { useEffect } from 'react';
import { profileRamGib } from '../config';
import { CacheProviderItem } from '../config/types';
import {
  GiB,
  componentEnabled,
  getFreeMemory,
  getTotalMemory,
  matchesSelector,
  resolveFieldValue
} from '../forms/utils';

export interface ResourceCheckStatus {
  show: boolean;
  type?: Global.MessageType;
  message: string;
}

// everything the pre-flight reads. It answers for the configuration as
// it stands, so the caller passes values rather than accessors: a
// catalog or worker list arriving late changes the answer, and a
// function identity would let that change pass unnoticed.
export interface PlacementInputs {
  provider?: CacheProviderItem;
  providerVersion?: string;
  fieldValues?: Record<string, any> | null;
  workers: WorkerListItem[];
  workerId?: number;
  workerSelector?: Record<string, string> | null;
}

const hidden: ResourceCheckStatus = { show: false, message: '' };

type Formatter = ReturnType<typeof useIntl>;

// deployment-style resource pre-flight: success when every target worker
// can hold the L1, warning (advisory, closable) when free memory falls
// short or the capacity cannot fit. Pure in its inputs, so the answer is
// the same whether a change arrives from an edit or from a late fetch.
export const evaluatePlacement = (
  inputs: PlacementInputs,
  intl: Formatter
): ResourceCheckStatus => {
  const {
    provider,
    providerVersion,
    fieldValues,
    workers,
    workerId,
    workerSelector
  } = inputs;
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
    const fitting = matched.filter(
      (worker) =>
        getFreeMemory(worker) !== undefined &&
        getFreeMemory(worker)! > size * GiB
    );
    return fitting.length >= replicas
      ? {
          show: true,
          type: 'success',
          message: intl.formatMessage(
            { id: 'kvCache.check.ok.store' },
            { replicas, size }
          )
        }
      : {
          show: true,
          type: 'warning',
          message: intl.formatMessage(
            { id: 'kvCache.check.store.exceedsFree' },
            { count: fitting.length, replicas, size }
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
  // a worker whose accelerator has no runtime image cannot run the
  // cache server (the worker fails such instances fast with the same
  // reason); accelerator-less workers run the plain image CPU-only
  const versionConfig =
    providerVersion && providerVersion !== 'custom'
      ? provider?.versions?.[providerVersion]
      : undefined;
  const runtimeImages = versionConfig?.runtime_images || {};
  const acceleratorOf = (worker: WorkerListItem) =>
    worker.status?.gpu_devices?.[0]?.type;
  const unsupported = Object.keys(runtimeImages).length
    ? targets.filter((worker) => {
        const backend = acceleratorOf(worker);
        return Boolean(backend) && !(backend! in runtimeImages);
      })
    : [];
  if (unsupported.length) {
    return {
      show: true,
      type: 'warning',
      message: intl.formatMessage(
        { id: 'kvCache.check.unsupportedAccel' },
        {
          count: unsupported.length,
          total: targets.length,
          backends: Array.from(new Set(unsupported.map(acceleratorOf))).join(
            ', '
          )
        }
      )
    };
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

// reports the pre-flight for the configuration as it stands, re-running
// whenever any of it changes — including the catalog and the worker
// list, which land after the form first renders
const usePlacementCheck = (
  inputs: PlacementInputs,
  onCheckStatusChange?: (status: ResourceCheckStatus) => void
) => {
  const intl = useIntl();
  const {
    provider,
    providerVersion,
    fieldValues,
    workers,
    workerId,
    workerSelector
  } = inputs;

  useEffect(() => {
    if (!onCheckStatusChange) {
      return;
    }
    onCheckStatusChange(
      evaluatePlacement(
        {
          provider,
          providerVersion,
          fieldValues,
          workers,
          workerId,
          workerSelector
        },
        intl
      )
    );
  }, [
    onCheckStatusChange,
    provider,
    providerVersion,
    fieldValues,
    workers,
    workerId,
    workerSelector,
    intl
  ]);
};

export default usePlacementCheck;
