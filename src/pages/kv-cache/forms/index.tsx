import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { useQueryWorkerList } from '@/pages/resources/services/use-query-worker-list';
import { localize } from '@/utils/localize';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  MinusOutlined,
  PlusOutlined
} from '@ant-design/icons';
import {
  CheckboxField,
  Input as CInput,
  CollapseContainer,
  CollapsePanel,
  IconFont,
  InputNumber,
  LabelSelector,
  LabelSelectorProvider,
  ListInput,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { Button, Flex, Form } from 'antd';
import { createStyles } from 'antd-style';
import _ from 'lodash';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import { profileRamGib } from '../config';
import {
  CacheProviderField,
  CacheProviderL2Backend,
  CacheProviderL2Field,
  FormData,
  L2StorageConfig,
  ListItem
} from '../config/types';
import useCacheProviders from '../hooks/use-cache-providers';

const GroupTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-block: 16px 12px;
`;

const GroupTips = styled.div`
  font-size: 12px;
  color: var(--ant-color-text-tertiary);
  margin-block: -6px 12px;
`;

// stands in for the Worker select of per_node providers, matching the
// vertical rhythm of the surrounding form items
// workers of a cluster may share label keys with different values; group
// values under their key so the selector can autocomplete both levels
const buildWorkerLabelOptions = (workers: WorkerListItem[]) => {
  const labelMap = new Map<string, Set<string>>();
  workers.forEach((worker) => {
    Object.entries(worker.labels || {}).forEach(([key, value]) => {
      if (!labelMap.has(key)) {
        labelMap.set(key, new Set());
      }
      labelMap.get(key)!.add(value);
    });
  });
  return Array.from(labelMap.entries()).map(([key, values]) => ({
    label: key,
    value: key,
    children: Array.from(values).map((value) => ({
      label: value,
      value: value
    }))
  }));
};

const EntryTitle = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ant-color-text-secondary);
`;

// provider-declared L2 field names are technical keys like "base_path";
// turn them into "Base Path" when the declaration carries no label
const humanizeFieldName = (name: string) =>
  name
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const GiB = 1024 * 1024 * 1024;

// fields the controller applies to running instances directly; everything
// else only lands when an instance is deleted and recreated
const NO_RECREATE_FIELDS = ['name', 'restart_on_error'];

// null, undefined, '' and empty containers are interchangeable spellings
// of "unset" between the form state and the API payload
const isUnset = (value: any) =>
  value === null ||
  value === undefined ||
  value === '' ||
  ((Array.isArray(value) || _.isPlainObject(value)) && _.isEmpty(value));

// drops unset object entries so a field the user never touched compares
// equal whether it is missing, null or an empty container
const stripUnset = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(stripUnset);
  }
  if (_.isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, entry]) => [key, stripUnset(entry)])
        .filter(([, entry]) => !isUnset(entry))
    );
  }
  return value;
};

const getTotalMemory = (worker: WorkerListItem) =>
  worker.status?.memory?.total || undefined;

// a worker matches when every selector pair is present in its labels
const matchesSelector = (
  worker: WorkerListItem,
  selector?: Record<string, string> | null
) => {
  if (!selector || !Object.keys(selector).length) {
    return true;
  }
  return Object.entries(selector).every(
    ([key, value]) => worker.labels?.[key] === value
  );
};

const getFreeMemory = (worker: WorkerListItem) => {
  const memory = worker.status?.memory;
  if (!memory?.total) {
    return undefined;
  }
  return memory.total - (memory.used ?? memory.allocated ?? 0);
};

// prefer the worker with the most free RAM; fall back to the first
// one when the list carries no memory status
const pickDefaultWorker = (workers: WorkerListItem[]) => {
  let best: WorkerListItem | undefined;
  let bestFree = -Infinity;
  workers.forEach((worker) => {
    const free = getFreeMemory(worker);
    if (free !== undefined && free > bestFree) {
      best = worker;
      bestFree = free;
    }
  });
  return best ?? workers[0];
};

const OptionWithIcon: React.FC<{
  icon?: string;
  fallbackGlyph: string;
  label: React.ReactNode;
}> = ({ icon, fallbackGlyph, label }) => (
  <span className="flex-center gap-8">
    {icon ? (
      <img src={icon} alt="" style={{ width: 16, height: 16 }} />
    ) : (
      <IconFont type={fallbackGlyph} />
    )}
    <span>{label}</span>
  </span>
);

export interface ResourceCheckStatus {
  show: boolean;
  type?: Global.MessageType;
  message: string;
}

// The frame the per-component editors share, so several roles read as
// one Parameters field rather than as a stack of separate ones: the
// outer frame is the one a single editor draws for itself, and each role
// inside carries the entry card the L2 backend list uses.
const useParametersStyles = createStyles(({ token, css }) => ({
  group: css`
    position: relative;
    width: 100%;
    padding: 16px;
    // room for the label the frame carries in its top-left corner
    padding-top: 36px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;
  `,
  groupLabel: css`
    position: absolute;
    left: 16px;
    top: 12px;
    line-height: 1;
    color: ${token.colorTextTertiary};
  `,
  entry: css`
    padding: 12px 16px 16px;
    border: 1px solid ${token.colorSplit};
    border-radius: ${token.borderRadiusLG}px;
  `,
  entryTitle: css`
    margin-bottom: 10px;
  `
}));

// Flags belong to the binary a role runs, so they are edited and stored
// per component rather than once for the service. Every enabled role is
// laid out at once: what one of them carries is configuration of the
// same service, and hiding it behind a switch is how it gets forgotten.
const ComponentParameters: React.FC<{
  value?: Record<string, string[]>;
  onChange?: (value: Record<string, string[]>) => void;
  components: { name: string; hints: boolean }[];
  hints: { label: string; value: string }[];
  btnText: string;
  label: string;
}> = ({ value, onChange, components, hints, btnText, label }) => {
  const { styles } = useParametersStyles();
  const editor = (component: { name: string; hints: boolean }) => (
    <ListInput
      value={value?.[component.name] || []}
      onChange={(next: string[]) =>
        onChange?.({ ...(value || {}), [component.name]: next })
      }
      placeholder="--max-workers=8"
      options={component.hints ? hints : []}
      btnText={btnText}
      label={components.length > 1 ? undefined : label}
      styles={
        components.length > 1
          ? { wrapper: { border: 'none', borderRadius: 0, padding: 0 } }
          : undefined
      }
    ></ListInput>
  );

  if (components.length <= 1) {
    return editor(components[0] || { name: '', hints: true });
  }
  return (
    <Flex vertical gap={12} className={styles.group}>
      <span className={styles.groupLabel}>{label}</span>
      {components.map((component) => (
        <div className={styles.entry} key={component.name}>
          <EntryTitle className={styles.entryTitle}>
            {component.name}
          </EntryTitle>
          {editor(component)}
        </div>
      ))}
    </Flex>
  );
};

interface ServiceFormProps {
  ref?: any;
  action: PageActionType;
  provider?: string; // provider chosen from the catalog cards on CREATE
  currentData?: ListItem; // Used when action is EDIT
  onFinish: (values: FormData) => Promise<void>;
  onFinishFailed?: (errorInfo: any) => void;
  onCheckStatusChange?: (status: ResourceCheckStatus) => void;
  // fires with true while an edit holds config the instances do not run yet
  onConfigChanged?: (changed: boolean) => void;
}

const ServiceForm: React.FC<ServiceFormProps> = forwardRef((props, ref) => {
  const {
    action,
    provider,
    currentData,
    onFinish,
    onFinishFailed,
    onCheckStatusChange,
    onConfigChanged
  } = props;
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const [form] = Form.useForm();
  const { providers, providerOptions, getProvider } = useCacheProviders();
  // the form needs only the cluster options and this cluster's workers;
  // the shared query hooks carry request cancellation, so a fetch
  // superseded by a cluster switch (or unmount) aborts instead of
  // landing stale state
  const { clusterList: clusterOptions, fetchClusterList } =
    useQueryClusterList();
  const { fetchData: fetchWorkerList } = useQueryWorkerList();
  const [workers, setWorkers] = useState<WorkerListItem[]>([]);
  const workerOptions = useMemo(
    () =>
      workers.map((item) => ({
        label: item.name,
        value: item.id
      })),
    [workers]
  );
  const workerLabelOptions = useMemo(
    () => buildWorkerLabelOptions(workers),
    [workers]
  );
  const providerName = Form.useWatch('provider_name', form);
  const providerVersion = Form.useWatch('provider_version', form);
  const clusterId = Form.useWatch('cluster_id', form);
  const prevClusterRef = useRef<number | undefined>(undefined);
  const pinnedFields = useRef<Set<string>>(new Set());
  const [advancedKeys, setAdvancedKeys] = useState<string[]>([]);
  const [l2CollapseKeys, setL2CollapseKeys] = useState<Set<number>>(new Set());

  // per_node providers run one instance on every worker of the cluster;
  // there is no single worker to pick and worker_id must not be submitted
  const isPerNode = getProvider(providerName)?.topology === 'per_node';
  // multi-component providers state capacity through their own
  // declared fields; the built-in RAM Size is not theirs
  const hasComponents =
    Object.keys(getProvider(providerName)?.components || {}).length > 0;

  const fieldValues = Form.useWatch(['config', 'fields'], form);
  const workerId = Form.useWatch('worker_id', form);
  const workerSelector = Form.useWatch('worker_selector', form);

  // deployment-style resource pre-flight: green when every target worker
  // can hold the L1, yellow (advisory, closable) when free memory falls
  // short or the capacity cannot fit
  useEffect(() => {
    if (!onCheckStatusChange) {
      return;
    }
    const provider = getProvider(providerName);
    const managedFields = provider?.fields || [];
    const resolveField = (name?: string) => {
      if (!name) {
        return undefined;
      }
      const declared = managedFields.find((field) => field.name === name);
      return fieldValues?.[name] ?? declared?.default;
    };
    // The component claiming RAM through its resource_profile is the
    // only placement the service form can check — engine-side
    // consumption follows the deployments. What to check depends on how
    // that component is placed, not on how many components there are: a
    // replicas pool needs enough workers that fit, while a per_node
    // component lands on every matching worker, so the tightest one
    // decides (which is the path below).
    const claiming = Object.values(provider?.components || {}).find(
      (component) => {
        if (!component.resource_profile?.ram_gib) {
          return false;
        }
        if (!component.enabled_by) {
          return true;
        }
        const gate = resolveField(component.enabled_by);
        return component.enabled_when != null
          ? gate === component.enabled_when
          : Boolean(gate);
      }
    );
    if (claiming && claiming.topology !== 'per_node') {
      const size = profileRamGib(
        claiming.resource_profile,
        managedFields,
        fieldValues
      );
      const replicas = claiming.replicas_by
        ? Number(resolveField(claiming.replicas_by)) || 1
        : (claiming.replicas ?? 1);
      if (!size || !workers.length) {
        onCheckStatusChange({ show: false, message: '' });
        return;
      }
      const matched = workers.filter((worker) =>
        matchesSelector(worker, workerSelector)
      );
      if (matched.length < replicas) {
        onCheckStatusChange({
          show: true,
          type: 'warning',
          message: intl.formatMessage(
            { id: 'kvCache.check.store.insufficientWorkers' },
            { count: matched.length, replicas }
          )
        });
        return;
      }
      const fitting = matched.filter(
        (worker) =>
          getFreeMemory(worker) !== undefined &&
          getFreeMemory(worker)! > size * GiB
      );
      onCheckStatusChange(
        fitting.length >= replicas
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
            }
      );
      return;
    }
    const instanceGib = profileRamGib(
      claiming?.resource_profile ?? provider?.resource_profile,
      managedFields,
      fieldValues
    );
    if (!instanceGib || !workers.length) {
      onCheckStatusChange({ show: false, message: '' });
      return;
    }
    const targets = isPerNode
      ? workers.filter((worker) => matchesSelector(worker, workerSelector))
      : workers.filter((worker) => worker.id === workerId);
    if (!targets.length) {
      onCheckStatusChange(
        isPerNode
          ? {
              show: true,
              type: 'warning',
              message: intl.formatMessage({ id: 'kvCache.check.noWorkers' })
            }
          : { show: false, message: '' }
      );
      return;
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
      onCheckStatusChange({
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
      });
      return;
    }
    const constrained = targets
      .filter((worker) => getTotalMemory(worker) !== undefined)
      .sort((a, b) => getTotalMemory(a)! - getTotalMemory(b)!)[0];
    if (constrained && instanceGib * GiB >= getTotalMemory(constrained)!) {
      onCheckStatusChange({
        show: true,
        type: 'warning',
        message: intl.formatMessage(
          { id: 'kvCache.form.ramSize.exceedsTotal' },
          {
            worker: constrained.name,
            total: Math.floor(getTotalMemory(constrained)! / GiB)
          }
        )
      });
      return;
    }
    const tightest = targets
      .filter((worker) => getFreeMemory(worker) !== undefined)
      .sort((a, b) => getFreeMemory(a)! - getFreeMemory(b)!)[0];
    if (tightest && instanceGib * GiB > getFreeMemory(tightest)!) {
      onCheckStatusChange({
        show: true,
        type: 'warning',
        message: intl.formatMessage(
          { id: 'kvCache.form.ramSize.exceedsFree' },
          {
            worker: tightest.name,
            free: Math.floor(getFreeMemory(tightest)! / GiB)
          }
        )
      });
      return;
    }
    onCheckStatusChange({
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
    });
  }, [
    onCheckStatusChange,
    isPerNode,
    hasComponents,
    fieldValues,
    workerId,
    workerSelector,
    workers,
    providerName,
    providerVersion,
    intl
  ]);

  // deployment-style edit notice: config changes only land on the next
  // instance recreation, so flag any drift from the saved service
  const compareWithSaved = useMemoizedFn(() => {
    if (action !== PageAction.EDIT || !currentData) {
      return;
    }
    const values = form.getFieldsValue();
    const saved = _.pick(currentData, Object.keys(values));
    onConfigChanged?.(
      !_.isEqual(
        stripUnset(_.omit(values, NO_RECREATE_FIELDS)),
        stripUnset(_.omit(saved, NO_RECREATE_FIELDS))
      )
    );
  });

  // waits out the programmatic field cascades that follow a user change
  // (e.g. a provider switch reseeding the version and L2 entries);
  // useDebounceFn cancels the pending call on unmount
  const { run: handleValuesChange } = useDebounceFn(compareWithSaved, {
    wait: 100
  });

  // declared fields the user has decided for themselves. antd's touched
  // flag also trips on the form's own seeding, while onValuesChange fires
  // for user edits alone — which is what a hardware-decided default must
  // yield to.
  const handleFormValuesChange = (changed: any) => {
    Object.keys(changed?.config?.fields || {}).forEach((name) =>
      pinnedFields.current.add(name)
    );
    handleValuesChange();
  };

  const versionOptions = useMemo(() => {
    const provider = providers.find((item) => item.name === providerName);
    const options = Object.keys(provider?.versions || {}).map((version) => ({
      label: version,
      value: version
    }));
    // managed services may run a user-supplied image under the reserved
    // "custom" version
    if (provider?.custom_version) {
      options.push({
        label: intl.formatMessage({ id: 'kvCache.form.version.custom' }),
        value: 'custom'
      });
    }
    return options;
  }, [providers, providerName, intl]);

  // a provider whose image is not published declares no release line at
  // all: there is no version to pick, and the service names its image
  // under the reserved "custom" version instead
  const hasDeclaredVersions = useMemo(() => {
    return Boolean(
      Object.keys(getProvider(providerName)?.versions || {}).length
    );
  }, [getProvider, providerName]);

  // the provider's pinned default image doubles as a format hint for
  // the custom image input
  const defaultImage = useMemo(() => {
    const provider = getProvider(providerName);
    return provider?.default_version
      ? provider.versions?.[provider.default_version]?.image
      : undefined;
  }, [getProvider, providerName]);

  const l2Storages: L2StorageConfig[] | undefined = Form.useWatch(
    ['config', 'l2_storages'],
    form
  );

  // completion hints for the extra-parameters editor, declared by the
  // provider (flags GPUStack injects itself are excluded declaration-side)
  const parameterHints = useMemo(() => {
    return (getProvider(providerName)?.common_parameters || []).map(
      (value) => ({
        label: value,
        value
      })
    );
  }, [getProvider, providerName]);

  // One parameters editor per component the configuration turns on: the
  // flags reach that component's launch command alone. A provider
  // without components has the single unnamed one. Completion hints are
  // the provider's, which describe the binary engines attach to, so they
  // are offered on that component only.
  const parameterComponents = useMemo(() => {
    const provider = getProvider(providerName);
    const components = Object.entries(provider?.components || {});
    if (!components.length) {
      return [{ name: '', hints: true }];
    }
    const resolveField = (name?: string) => {
      if (!name) {
        return undefined;
      }
      const declared = (provider?.fields || []).find(
        (field) => field.name === name
      );
      return fieldValues?.[name] ?? declared?.default;
    };
    return components
      .filter(([, component]) => {
        if (!component.enabled_by) {
          return true;
        }
        const gate = resolveField(component.enabled_by);
        return component.enabled_when != null
          ? gate === component.enabled_when
          : Boolean(gate);
      })
      .map(([name, component]) => ({
        name,
        hints: Boolean(component.attach_endpoint)
      }));
  }, [getProvider, providerName, fieldValues]);

  // The one accelerator the cluster's workers agree on, if they do. A
  // field whose value the hardware decides (a transport that is the
  // accelerator's own on NPU) defaults by it rather than leaving a
  // choice that only fails once an engine attaches.
  const clusterFramework = useMemo(() => {
    const frameworks = new Set(
      workers
        .map((worker) => worker.status?.gpu_devices?.[0]?.type)
        .filter(Boolean) as string[]
    );
    return frameworks.size === 1 ? [...frameworks][0] : undefined;
  }, [workers]);

  const fieldDefault = useCallback(
    (field: CacheProviderField) =>
      (clusterFramework && field.framework_defaults?.[clusterFramework]) ??
      field.default,
    [clusterFramework]
  );

  const l2Backends = useMemo(() => {
    return getProvider(providerName)?.l2_backends || {};
  }, [getProvider, providerName]);

  const l2BackendOptions = useMemo(() => {
    return Object.entries(l2Backends).map(([key, backend]) => ({
      label: localize(backend.display_name) || key,
      value: key,
      icon: backend.icon
    }));
  }, [l2Backends]);

  // shared by the select's onChange and the create-time default so a
  // provider set either way carries its default version and a clean L2 config
  const applyProviderSelection = (value: string) => {
    const provider = getProvider(value);
    // with no declared version to fall back to, the service runs its own
    // image under the reserved "custom" version
    form.setFieldValue(
      'provider_version',
      provider?.default_version ??
        (provider?.custom_version ? 'custom' : undefined)
    );
    // config.image only accompanies the reserved "custom" version, and
    // the version just reset to the provider default
    form.setFieldValue(['config', 'image'], undefined);
    // A provider that offers no Worker picker must not carry a worker_id
    // into the payload: per_node instances follow the cluster's workers,
    // and a multi-component provider places each role on its own terms.
    // The label selector scopes every managed topology and stays.
    if (
      provider?.topology === 'per_node' ||
      Object.keys(provider?.components || {}).length > 0
    ) {
      form.setFieldValue('worker_id', undefined);
    }
    // declared fields are provider-specific; reseed from the newly
    // selected provider's declared defaults, including the ones the
    // cluster's accelerator decides. The values the user pinned belong
    // to the provider they were entered for.
    pinnedFields.current.clear();
    const fieldValues: Record<string, any> = {};
    provider?.fields?.forEach((field) => {
      const value = fieldDefault(field);
      if (value !== undefined) {
        fieldValues[field.name] = value;
      }
    });
    form.setFieldValue(['config', 'fields'], fieldValues);
    // L2 backends are provider-specific; drop the stale entries
    // (an empty list is normalized to null server-side)
    form.setFieldValue(['config', 'l2_storages'], []);
    setL2CollapseKeys(new Set());
  };

  const handleProviderChange = (value: string) => {
    applyProviderSelection(value);
  };

  // config.image only accompanies the reserved "custom" version; drop
  // it as soon as another version is picked
  const handleVersionChange = (value: string) => {
    if (value !== 'custom') {
      form.setFieldValue(['config', 'image'], undefined);
    }
  };

  const handleL2Toggle = (open: boolean, key: number) => {
    setL2CollapseKeys(open ? new Set([key]) : new Set());
  };

  // the switch position a backend starts on, and the one the cache server
  // runs with while an entry leaves the state unset (saved by the API, or
  // before the backend declared the switch)
  const l2ConfigDefault = (spec?: CacheProviderL2Backend) =>
    spec?.adapter_flag_default !== false;

  // a backend's declared starting state: its field defaults, plus the
  // initial position of the switch when configuring it is optional
  const seedL2Entry = (backend: string) => {
    const spec = l2Backends[backend];
    const params: Record<string, any> = {};
    spec?.fields?.forEach((field) => {
      if (field.default !== undefined) {
        params[field.name] = field.default;
      }
    });
    return {
      params,
      adapter_flag_enabled: spec?.adapter_flag_optional
        ? l2ConfigDefault(spec)
        : undefined
    };
  };

  const handleAddL2Storage = async () => {
    try {
      await form.validateFields([['config', 'l2_storages']], {
        recursive: true
      });
      const list = form.getFieldValue(['config', 'l2_storages']) || [];
      // a provider declaring a single backend leaves nothing to choose:
      // the new entry opens on it, seeded as a manual pick would be
      const backendKeys = Object.keys(l2Backends);
      const entry =
        backendKeys.length === 1
          ? { backend: backendKeys[0], ...seedL2Entry(backendKeys[0]) }
          : { backend: undefined, params: {} };
      form.setFieldValue(['config', 'l2_storages'], [...list, entry]);
      setTimeout(() => {
        setL2CollapseKeys(new Set([list.length]));
      }, 100);
    } catch (error: any) {
      const errorIndex = error?.errorFields?.[0]?.name?.[2];
      if (typeof errorIndex === 'number') {
        setL2CollapseKeys(new Set([errorIndex]));
      }
    }
  };

  // adjacent moves are index swaps; keep the open panel attached
  // to the entry it was opened for
  const handleMoveL2Storage = (
    move: (from: number, to: number) => void,
    from: number,
    to: number
  ) => {
    move(from, to);
    setL2CollapseKeys((prev) => {
      const next = new Set<number>();
      prev.forEach((key) => {
        next.add(key === from ? to : key === to ? from : key);
      });
      return next;
    });
  };

  const handleRemoveL2Storage = (
    remove: (index: number) => void,
    index: number
  ) => {
    remove(index);
    setL2CollapseKeys((prev) => {
      const next = new Set<number>();
      prev.forEach((key) => {
        if (key < index) {
          next.add(key);
        } else if (key > index) {
          next.add(key - 1);
        }
      });
      return next;
    });
  };

  const handleL2BackendChange = (index: number, value: string) => {
    // params and the switch are backend-specific; reseed this entry from
    // the newly selected backend's declared defaults
    const { params, adapter_flag_enabled } = seedL2Entry(value);
    form.setFieldValue(['config', 'l2_storages', index, 'params'], params);
    form.setFieldValue(
      ['config', 'l2_storages', index, 'adapter_flag_enabled'],
      adapter_flag_enabled
    );
  };

  // provider-declared configuration knobs promoted to structured advanced
  // fields; a matching flag in free-form Parameters still overrides them
  const providerFields = useMemo(() => {
    return getProvider(providerName)?.fields || [];
  }, [getProvider, providerName]);

  // The cluster's workers arrive after the form seeds its defaults, so a
  // field the hardware decides re-takes its default once they do — and
  // again whenever the cluster changes. Only the user's own edit pins it;
  // an edited service keeps what it was saved with.
  useEffect(() => {
    if (action !== PageAction.CREATE) {
      return;
    }
    providerFields.forEach((field) => {
      if (!field.framework_defaults || pinnedFields.current.has(field.name)) {
        return;
      }
      form.setFieldValue(['config', 'fields', field.name], fieldDefault(field));
    });
  }, [providerFields, fieldDefault, form, action]);

  // chunk size is a reserved placeholder some providers never consume
  // (one chunking by the engine's own block hashes has no use for it);
  // offering it there would suggest an effect it cannot have
  // a field may follow another one's value (e.g. the RDMA device only
  // matters on the rdma protocol); hidden fields keep their values —
  // the declared defaults still render server-side
  // gates chain: a field behind a switch that is itself behind a mode is
  // gone with the mode, whatever the switch was left on
  const fieldVisible = (field: CacheProviderField, seen?: Set<string>) => {
    if (!field.visible_by) {
      return true;
    }
    const gate = providerFields.find((item) => item.name === field.visible_by);
    const visited = seen || new Set<string>();
    if (gate && !visited.has(gate.name)) {
      visited.add(gate.name);
      if (!fieldVisible(gate, visited)) {
        return false;
      }
    }
    const value = fieldValues?.[field.visible_by] ?? gate?.default;
    return value === field.visible_when;
  };

  const renderProviderFieldControl = (
    field: CacheProviderField,
    label: string,
    required?: boolean
  ) => {
    const description = localize(field.description);
    if (field.options?.length) {
      return (
        <SealSelect
          required={required}
          label={label}
          description={description}
          options={field.options.map((option) =>
            typeof option === 'string'
              ? { label: option, value: option }
              : {
                  label: localize(option.label) || option.value,
                  value: option.value,
                  description: localize(option.description)
                }
          )}
          optionRender={(option: any) => (
            <div style={{ whiteSpace: 'normal' }}>
              <div>{option.label}</div>
              {option.data?.description && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--ant-color-text-tertiary)',
                    lineHeight: 1.4
                  }}
                >
                  {option.data.description}
                </div>
              )}
            </div>
          )}
        />
      );
    }
    switch (field.type) {
      case 'number':
        return (
          <InputNumber
            required={required}
            label={label}
            description={description}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
      case 'boolean':
        return <CheckboxField label={label} description={description} />;
      default:
        return (
          <CInput.Input
            required={required}
            label={label}
            description={description}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const renderL2FieldControl = (field: CacheProviderL2Field, label: string) => {
    // the backend's own description covers its field set; a field
    // carrying one explains the knob its label cannot
    const description = localize(field.description);
    switch (field.type) {
      case 'number':
        return (
          <InputNumber
            required={field.required}
            label={label}
            description={description}
          />
        );
      case 'boolean':
        return <CheckboxField label={label} description={description} />;
      case 'password':
        return (
          <CInput.Password
            required={field.required}
            label={label}
            description={description}
          />
        );
      default:
        return (
          <CInput.Input
            required={field.required}
            label={label}
            description={description}
          />
        );
    }
  };

  const renderProviderOption = (option: any) => (
    <OptionWithIcon
      icon={option.data?.icon}
      fallbackGlyph="icon-storage-outlined"
      label={option.label}
    />
  );

  // labelRender mirrors optionRender so the closed select shows the
  // same icon as the dropdown entries
  const renderProviderLabel = (data: any) => (
    <OptionWithIcon
      icon={getProvider(data.value)?.icon}
      fallbackGlyph="icon-storage-outlined"
      label={data.label}
    />
  );

  const renderL2BackendOption = (option: any) => (
    <OptionWithIcon
      icon={option.data?.icon}
      fallbackGlyph="icon-hard-disk"
      label={option.label}
    />
  );

  const renderL2BackendLabel = (data: any) => (
    <OptionWithIcon
      icon={l2Backends[data.value]?.icon}
      fallbackGlyph="icon-hard-disk"
      label={data.label}
    />
  );

  useImperativeHandle(ref, () => ({
    form,
    submit: () => {
      form.submit();
    },
    resetFields: () => {
      pinnedFields.current.clear();
      form.resetFields();
    }
  }));

  useEffect(() => {
    if (action === PageAction.EDIT && currentData) {
      form.setFieldsValue({ ...currentData });
      // surface the advanced section when it already holds configuration
      if (
        Object.values(currentData.config?.parameters || {}).some(
          (flags) => flags?.length
        ) ||
        Object.keys(currentData.config?.env || {}).length ||
        currentData.config?.management_url ||
        currentData.restart_on_error === false
      ) {
        setAdvancedKeys(['advanced']);
      }
    }
  }, [form, currentData, action]);

  // default to the caller-chosen provider (falling back to the first
  // mode-appropriate one) once the list arrives, leaving a user's (or
  // edit's) choice untouched
  useEffect(() => {
    if (action !== PageAction.CREATE || !providerOptions.length) {
      return;
    }
    if (form.getFieldValue('provider_name')) {
      return;
    }
    const preset =
      provider && providerOptions.some((item) => item.value === provider)
        ? provider
        : providerOptions[0].value;
    form.setFieldValue('provider_name', preset);
    applyProviderSelection(preset);
  }, [providerOptions, action, provider]);

  // a provider with no declared release line only ever runs the custom
  // version, so any other value the form holds — an existing service
  // pinned to a version the catalog has since dropped, or a creation that
  // never reached the provider defaults — leaves it with neither a
  // version to pick nor the image field that replaces it
  useEffect(() => {
    if (hasDeclaredVersions || providerVersion === 'custom') {
      return;
    }
    if (!getProvider(providerName)?.custom_version) {
      return;
    }
    form.setFieldValue('provider_version', 'custom');
  }, [form, hasDeclaredVersions, providerVersion, providerName, getProvider]);

  // with a single cluster there is nothing to choose; preselect it
  // re-runs on a provider switch too: stepping back and picking a
  // different card resets the form, which empties cluster_id
  useEffect(() => {
    if (clusterOptions.length !== 1) {
      return;
    }
    if (form.getFieldValue('cluster_id') != null) {
      return;
    }
    form.setFieldValue('cluster_id', clusterOptions[0].value);
  }, [clusterOptions, provider]);

  useEffect(() => {
    fetchClusterList({ page: -1 }).catch(() => {
      // canceled or failed; the select just stays empty
    });
  }, []);

  useEffect(() => {
    // cluster workers feed the singleton Worker select and the per_node
    // label-selector autocomplete
    const fetchWorkers = async () => {
      if (!clusterId) {
        setWorkers([]);
        return;
      }
      try {
        const items = (await fetchWorkerList({
          cluster_id: clusterId,
          page: -1
        })) as WorkerListItem[];
        // a superseded request rejects through its cancel token, so a
        // stale response cannot normally land here; the guard stays as
        // a belt against any non-canceling caller
        if (form.getFieldValue('cluster_id') !== clusterId) {
          return;
        }
        setWorkers(items || []);
        // nothing to seed where the form offers no Worker select
        if (isPerNode || hasComponents) {
          return;
        }
        // seed an empty selection with the least-loaded worker
        if (items?.length && form.getFieldValue('worker_id') == null) {
          form.setFieldValue('worker_id', pickDefaultWorker(items).id);
        }
      } catch (error) {
        // canceled (a newer fetch owns the state) or failed for the
        // still-current cluster — only the latter clears the list
        if (form.getFieldValue('cluster_id') === clusterId) {
          setWorkers([]);
        }
      }
    };
    fetchWorkers();
  }, [clusterId, isPerNode, hasComponents]);

  // On a genuine cluster change, drop the now-out-of-scope worker selection.
  useEffect(() => {
    if (prevClusterRef.current === undefined) {
      prevClusterRef.current = clusterId;
      return;
    }
    if (prevClusterRef.current === clusterId) {
      return;
    }
    prevClusterRef.current = clusterId;
    form.setFieldValue('worker_id', undefined);
  }, [clusterId]);

  return (
    <Form
      form={form}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      onValuesChange={handleFormValuesChange}
    >
      <Form.Item<FormData>
        name="name"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'common.table.name')
          }
        ]}
      >
        <CInput.Input
          required
          label={intl.formatMessage({ id: 'common.table.name' })}
        />
      </Form.Item>
      <Form.Item<FormData>
        name="provider_name"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'kvCache.form.provider')
          }
        ]}
      >
        {/* read-only context: creation picks the provider on the catalog
            step (go Previous to change it), and an existing service's
            provider is its identity */}
        <SealSelect
          required
          disabled
          options={providerOptions}
          optionRender={renderProviderOption}
          labelRender={renderProviderLabel}
          onChange={handleProviderChange}
          label={intl.formatMessage({ id: 'kvCache.form.provider' })}
        />
      </Form.Item>
      {
        // A provider with no declared release line has no version to pick,
        // but the field stays registered: an unmounted one is absent from
        // both the watched values and the submit payload, and the image
        // field below keys on it.
        <Form.Item<FormData>
          name="provider_version"
          hidden={!hasDeclaredVersions}
        >
          <SealSelect
            options={versionOptions}
            onChange={handleVersionChange}
            label={intl.formatMessage({ id: 'kvCache.form.version' })}
          />
        </Form.Item>
      }
      {providerVersion === 'custom' && (
        <Form.Item<FormData>
          name={['config', 'image']}
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'kvCache.form.image')
            }
          ]}
        >
          <CInput.Input
            required
            label={intl.formatMessage({ id: 'kvCache.form.image' })}
            placeholder={defaultImage}
          />
        </Form.Item>
      )}
      <Form.Item<FormData>
        name="cluster_id"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'clusters.title')
          }
        ]}
      >
        <SealSelect
          required
          disabled={action === PageAction.EDIT}
          options={clusterOptions}
          label={intl.formatMessage({ id: 'clusters.title' })}
        />
      </Form.Item>
      {
        <>
          {!isPerNode && !hasComponents && (
            <Form.Item<FormData> name="worker_id">
              <SealSelect
                allowClear
                options={workerOptions}
                label={intl.formatMessage({ id: 'kvCache.table.worker' })}
                description={intl.formatMessage({
                  id: 'kvCache.form.worker.autoTips'
                })}
              />
            </Form.Item>
          )}
          {
            <LabelSelectorProvider value={{ options: workerLabelOptions }}>
              <Form.Item<FormData>
                name="worker_selector"
                rules={[
                  {
                    validator(rule, value) {
                      // a key without a value can never match a worker
                      if (
                        value &&
                        Object.keys(value).some((key) => !value[key])
                      ) {
                        return Promise.reject(
                          intl.formatMessage(
                            { id: 'common.validate.value' },
                            {
                              name: intl.formatMessage({
                                id: 'kvCache.form.workerSelector'
                              })
                            }
                          )
                        );
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <LabelSelector
                  isAutoComplete
                  label={intl.formatMessage({
                    id: 'kvCache.form.workerSelector'
                  })}
                  description={intl.formatMessage({
                    // replicas-topology providers use the selector to
                    // scope placement, not to fan out per node
                    id: isPerNode
                      ? 'kvCache.form.workerSelector.tips'
                      : 'kvCache.form.workerSelector.scopeTips'
                  })}
                ></LabelSelector>
              </Form.Item>
            </LabelSelectorProvider>
          }
          {providerFields.map((field) => {
            // A hidden Form.Item still validates, so a required field
            // behind a gate would block submission with a message nobody
            // can see; it is required only while it is offered.
            const required = !!field.required && fieldVisible(field);
            return (
              <Form.Item
                key={field.name}
                name={['config', 'fields', field.name]}
                initialValue={fieldDefault(field)}
                valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
                hidden={!fieldVisible(field)}
                rules={
                  required
                    ? [
                        {
                          required: true,
                          message: getRuleMessage(
                            field.options ? 'select' : 'input',
                            localize(field.label) ||
                              humanizeFieldName(field.name),
                            false
                          )
                        }
                      ]
                    : undefined
                }
              >
                {renderProviderFieldControl(
                  field,
                  localize(field.label) || humanizeFieldName(field.name),
                  required
                )}
              </Form.Item>
            );
          })}
          {l2BackendOptions.length > 0 && (
            <>
              <GroupTitle>
                <span className="flex-center gap-8">
                  <span>
                    {intl.formatMessage({ id: 'kvCache.form.l2Backend' })}
                  </span>
                  <Button type="link" onClick={handleAddL2Storage}>
                    <PlusOutlined />
                    {intl.formatMessage({ id: 'kvCache.form.l2Backend.add' })}
                  </Button>
                </span>
              </GroupTitle>
              <GroupTips>
                {intl.formatMessage({ id: 'kvCache.form.l2Backend.tips' })}
              </GroupTips>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  marginBottom: '16px'
                }}
              >
                <Form.List name={['config', 'l2_storages']}>
                  {(fields, { remove, move }) =>
                    fields.map(({ key, name }) => {
                      const entryBackendName = l2Storages?.[name]?.backend;
                      const entryBackend = entryBackendName
                        ? l2Backends[entryBackendName]
                        : undefined;
                      return (
                        <div
                          key={key}
                          style={{
                            border: '1px solid var(--ant-color-split)',
                            borderRadius: 'var(--ant-border-radius-lg)'
                          }}
                        >
                          <CollapseContainer
                            collapsible={true}
                            showExpandIcon={true}
                            open={l2CollapseKeys.has(name)}
                            onToggle={(open: boolean) =>
                              handleL2Toggle(open, name)
                            }
                            styles={{
                              body: l2CollapseKeys.has(name)
                                ? { paddingBlock: '16px 0', paddingInline: 16 }
                                : {},
                              content: { paddingTop: 0 },
                              header: {
                                backgroundColor: 'unset'
                              }
                            }}
                            title={
                              <EntryTitle>
                                <span>
                                  {localize(entryBackend?.display_name) ||
                                    entryBackendName ||
                                    intl.formatMessage({
                                      id: 'kvCache.form.l2Backend.backend'
                                    })}
                                </span>
                              </EntryTitle>
                            }
                            right={
                              <span
                                className="flex-center gap-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Cascade order is read priority; the
                                    controls only appear once there is an
                                    order to change. */}
                                {fields.length > 1 && (
                                  <>
                                    <Button
                                      size="small"
                                      shape="circle"
                                      disabled={name === 0}
                                      onClick={() =>
                                        handleMoveL2Storage(
                                          move,
                                          name,
                                          name - 1
                                        )
                                      }
                                    >
                                      <ArrowUpOutlined />
                                    </Button>
                                    <Button
                                      size="small"
                                      shape="circle"
                                      disabled={name === fields.length - 1}
                                      onClick={() =>
                                        handleMoveL2Storage(
                                          move,
                                          name,
                                          name + 1
                                        )
                                      }
                                    >
                                      <ArrowDownOutlined />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="small"
                                  shape="circle"
                                  onClick={() =>
                                    handleRemoveL2Storage(remove, name)
                                  }
                                >
                                  <MinusOutlined />
                                </Button>
                              </span>
                            }
                          >
                            <Form.Item
                              name={[name, 'backend']}
                              rules={[
                                {
                                  required: true,
                                  message: getRuleMessage(
                                    'select',
                                    'kvCache.form.l2Backend.type'
                                  )
                                }
                              ]}
                            >
                              <SealSelect
                                required
                                options={l2BackendOptions}
                                optionRender={renderL2BackendOption}
                                labelRender={renderL2BackendLabel}
                                onChange={(value: string) =>
                                  handleL2BackendChange(name, value)
                                }
                                label={intl.formatMessage({
                                  id: 'kvCache.form.l2Backend.type'
                                })}
                                description={localize(
                                  entryBackend?.description
                                )}
                              />
                            </Form.Item>
                            {entryBackend?.adapter_flag_optional && (
                              <Form.Item
                                // remount per backend: the switch belongs
                                // to the backend that declared it
                                key={`${entryBackendName}-adapter-flag`}
                                name={[name, 'adapter_flag_enabled']}
                                valuePropName="checked"
                                getValueProps={(value) => ({
                                  checked:
                                    value ?? l2ConfigDefault(entryBackend)
                                })}
                              >
                                <CheckboxField
                                  label={
                                    localize(entryBackend.adapter_flag_label) ||
                                    intl.formatMessage({
                                      id: 'kvCache.form.l2Backend.customOptions'
                                    })
                                  }
                                />
                              </Form.Item>
                            )}
                            {/* the backend carries a working configuration
                                of its own while the switch is off, and the
                                fields have nothing to apply to */}
                            {(!entryBackend?.adapter_flag_optional ||
                              (l2Storages?.[name]?.adapter_flag_enabled ??
                                l2ConfigDefault(entryBackend))) &&
                              entryBackend?.fields?.map((field) => {
                                const label =
                                  localize(field.label) ||
                                  humanizeFieldName(field.name);
                                const isBoolean = field.type === 'boolean';
                                return (
                                  <Form.Item
                                    // remount per backend so same-named params never leak across backends
                                    key={`${entryBackendName}-${field.name}`}
                                    name={[name, 'params', field.name]}
                                    valuePropName={
                                      isBoolean ? 'checked' : 'value'
                                    }
                                    rules={
                                      field.required && !isBoolean
                                        ? [
                                            {
                                              required: true,
                                              message: getRuleMessage(
                                                'input',
                                                label,
                                                false
                                              )
                                            }
                                          ]
                                        : []
                                    }
                                  >
                                    {renderL2FieldControl(field, label)}
                                  </Form.Item>
                                );
                              })}
                          </CollapseContainer>
                        </div>
                      );
                    })
                  }
                </Form.List>
              </div>
            </>
          )}
          <CollapsePanel
            activeKey={advancedKeys}
            accordion={false}
            onChange={(keys) =>
              setAdvancedKeys(Array.isArray(keys) ? keys : [keys])
            }
            items={[
              {
                key: 'advanced',
                label: intl.formatMessage({ id: 'kvCache.form.advanced' }),
                children: (
                  <>
                    {(getProvider(providerName)?.management_url ||
                      currentData?.config?.management_url) && (
                      <Form.Item<FormData>
                        name={['config', 'management_url']}
                        rules={[
                          {
                            pattern: /^https?:\/\/\S+$/i,
                            message: intl.formatMessage({
                              id: 'kvCache.form.managementUrl.invalid'
                            })
                          }
                        ]}
                      >
                        <CInput.Input
                          label={intl.formatMessage({
                            id: 'kvCache.form.managementUrl'
                          })}
                          description={intl.formatMessage({
                            id: 'kvCache.form.managementUrl.tips'
                          })}
                        />
                      </Form.Item>
                    )}
                    <Form.Item<FormData> name={['config', 'parameters']}>
                      <ComponentParameters
                        components={parameterComponents}
                        hints={parameterHints}
                        btnText={intl.formatMessage({
                          id: 'common.button.addParams'
                        })}
                        label={intl.formatMessage({
                          id: 'kvCache.form.parameters'
                        })}
                      ></ComponentParameters>
                    </Form.Item>
                    <Form.Item<FormData> name={['config', 'env']}>
                      <LabelSelector
                        label={intl.formatMessage({ id: 'kvCache.form.env' })}
                        btnText={intl.formatMessage({
                          id: 'common.button.vars'
                        })}
                        description={
                          hasComponents
                            ? intl.formatMessage({
                                id: 'kvCache.form.env.componentTips'
                              })
                            : undefined
                        }
                      ></LabelSelector>
                    </Form.Item>
                    <Form.Item<FormData>
                      name="restart_on_error"
                      valuePropName="checked"
                      initialValue={true}
                      style={{ marginBottom: 8 }}
                    >
                      <CheckboxField
                        label={intl.formatMessage({
                          id: 'models.form.restart.onerror'
                        })}
                        description={intl.formatMessage({
                          id: 'models.form.restart.onerror.tips'
                        })}
                      ></CheckboxField>
                    </Form.Item>
                  </>
                )
              }
            ]}
          ></CollapsePanel>
        </>
      }
    </Form>
  );
});

export default ServiceForm;
