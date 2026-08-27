import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useQueryWorkerList } from '@/pages/resources/services/use-query-worker-list';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
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
import { Button, Form } from 'antd';
import _ from 'lodash';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import TestConnection from '../components/test-connection';
import { ServiceModeValueMap } from '../config';
import {
  CacheProviderExternalField,
  CacheProviderField,
  CacheProviderL2Field,
  FormData,
  L2StorageConfig,
  ListItem,
  ServiceMode
} from '../config/types';
import useCacheProviders from '../hooks/use-cache-providers';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';

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

interface ServiceFormProps {
  ref?: any;
  action: PageActionType;
  mode: ServiceMode;
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
    mode,
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
  const {
    providers,
    managedProviderOptions,
    externalProviderOptions,
    getProvider
  } = useCacheProviders();
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
  const [advancedKeys, setAdvancedKeys] = useState<string[]>([]);
  const [l2CollapseKeys, setL2CollapseKeys] = useState<Set<number>>(new Set());

  const isManaged = mode === ServiceModeValueMap.Managed;

  // per_node providers run one instance on every worker of the cluster;
  // there is no single worker to pick and worker_id must not be submitted
  const isPerNode = getProvider(providerName)?.topology === 'per_node';

  const ramSize = Form.useWatch(['config', 'ram_size'], form);
  const workerId = Form.useWatch('worker_id', form);
  const workerSelector = Form.useWatch('worker_selector', form);

  // deployment-style resource pre-flight: green when every target worker
  // can hold the L1, yellow (advisory, closable) when free memory falls
  // short or the capacity cannot fit
  useEffect(() => {
    if (!onCheckStatusChange) {
      return;
    }
    if (!isManaged || !ramSize || !workers.length) {
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
        ? getProvider(providerName)?.versions?.[providerVersion]
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
    if (constrained && ramSize * GiB >= getTotalMemory(constrained)!) {
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
    if (tightest && ramSize * GiB > getFreeMemory(tightest)!) {
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
    isManaged,
    isPerNode,
    ramSize,
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
    if (action !== PageAction.EDIT || !isManaged || !currentData) {
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

  const providerOptions = isManaged
    ? managedProviderOptions
    : externalProviderOptions;

  const versionOptions = useMemo(() => {
    const provider = providers.find((item) => item.name === providerName);
    const options = Object.keys(provider?.versions || {}).map((version) => ({
      label: version,
      value: version
    }));
    // managed services may run a user-supplied image under the reserved
    // "custom" version; external services always name a real release
    if (isManaged && provider?.custom_version) {
      options.push({
        label: intl.formatMessage({ id: 'kvCache.form.version.custom' }),
        value: 'custom'
      });
    }
    return options;
  }, [providers, providerName, isManaged, intl]);

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

  const l2Backends = useMemo(() => {
    return getProvider(providerName)?.l2_backends || {};
  }, [getProvider, providerName]);

  const l2BackendOptions = useMemo(() => {
    return Object.entries(l2Backends).map(([key, backend]) => ({
      label: backend.display_name || key,
      value: key,
      icon: backend.icon
    }));
  }, [l2Backends]);

  // shared by the select's onChange and the create-time default so a
  // provider set either way carries its default version and a clean L2 config
  const applyProviderSelection = (value: string) => {
    const provider = getProvider(value);
    form.setFieldValue('provider_version', provider?.default_version);
    // config.image only accompanies the reserved "custom" version, and
    // the version just reset to the provider default
    form.setFieldValue(['config', 'image'], undefined);
    // per_node services reject worker_id and singleton ones reject
    // worker_selector; drop the counterpart so the hidden field never
    // reaches the submit payload
    if (provider?.topology === 'per_node') {
      form.setFieldValue('worker_id', undefined);
    } else {
      form.setFieldValue('worker_selector', undefined);
    }
    if (isManaged) {
      // declared fields are provider-specific; reseed from the newly
      // selected provider's declared defaults
      const fieldValues: Record<string, any> = {};
      provider?.managed_fields?.forEach((field) => {
        if (field.default !== undefined) {
          fieldValues[field.name] = field.default;
        }
      });
      form.setFieldValue(['config', 'fields'], fieldValues);
      // L2 backends are provider-specific; drop the stale entries
      // (an empty list is normalized to null server-side)
      form.setFieldValue(['config', 'l2_storages'], []);
      setL2CollapseKeys(new Set());
    } else {
      // external connection fields are provider-specific; reseed from the
      // newly selected provider's declared defaults
      const params: Record<string, any> = {};
      provider?.external_fields?.forEach((field) => {
        if (field.default !== undefined) {
          params[field.name] = field.default;
        }
      });
      form.setFieldValue(['endpoint', 'params'], params);
      // the engine's conventional metrics port (e.g. the Mooncake
      // master's 9003) seeds the field; the user overrides as needed
      form.setFieldValue(
        ['endpoint', 'metrics_port'],
        provider?.default_metrics?.default_port
      );
    }
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

  const handleAddL2Storage = async () => {
    try {
      await form.validateFields([['config', 'l2_storages']], {
        recursive: true
      });
      const list = form.getFieldValue(['config', 'l2_storages']) || [];
      form.setFieldValue(
        ['config', 'l2_storages'],
        [...list, { backend: undefined, params: {} }]
      );
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
    // params are backend-specific; reseed this entry from the newly
    // selected backend's declared defaults
    const params: Record<string, any> = {};
    l2Backends[value]?.fields?.forEach((field) => {
      if (field.default !== undefined) {
        params[field.name] = field.default;
      }
    });
    form.setFieldValue(['config', 'l2_storages', index, 'params'], params);
  };

  // provider-declared configuration knobs promoted to structured advanced
  // fields; a matching flag in free-form Parameters still overrides them
  const providerFields = useMemo(() => {
    return getProvider(providerName)?.managed_fields || [];
  }, [getProvider, providerName]);

  const renderProviderFieldControl = (
    field: CacheProviderField,
    label: string
  ) => {
    const description = field.description;
    if (field.options?.length) {
      return (
        <SealSelect
          label={label}
          description={description}
          options={field.options.map((value) => ({ label: value, value }))}
        />
      );
    }
    switch (field.type) {
      case 'number':
        return (
          <InputNumber
            label={label}
            description={description}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
      case 'boolean':
        return <CheckboxField label={label} description={description} />;
      default:
        return <CInput.Input label={label} description={description} />;
    }
  };

  const renderL2FieldControl = (field: CacheProviderL2Field, label: string) => {
    switch (field.type) {
      case 'number':
        return <InputNumber required={field.required} label={label} />;
      case 'boolean':
        return <CheckboxField label={label} />;
      case 'password':
        return <CInput.Password required={field.required} label={label} />;
      default:
        return <CInput.Input required={field.required} label={label} />;
    }
  };

  // external connection parameters the provider declares for its external
  // mode (e.g. Mooncake's metadata_server, protocol)
  const externalFields = useMemo(() => {
    return getProvider(providerName)?.external_fields || [];
  }, [getProvider, providerName]);

  const renderExternalFieldControl = (
    field: CacheProviderExternalField,
    label: string
  ) => {
    const description = field.description;
    if (field.options?.length) {
      return (
        <SealSelect
          required={field.required}
          label={label}
          description={description}
          options={field.options.map((value) => ({ label: value, value }))}
        />
      );
    }
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
      form.resetFields();
    }
  }));

  useEffect(() => {
    if (action === PageAction.EDIT && currentData) {
      form.setFieldsValue({ ...currentData });
      // surface the advanced section when it already holds configuration
      if (
        currentData.config?.parameters?.length ||
        Object.keys(currentData.config?.env || {}).length ||
        currentData.config?.chunk_size != null ||
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
    if (!isManaged) {
      return;
    }
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
        // per_node services have no Worker select to seed
        if (isPerNode) {
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
  }, [clusterId, isManaged, isPerNode]);

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
      onValuesChange={handleValuesChange}
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
      {isManaged && (
        <Form.Item<FormData> name="provider_version">
          <SealSelect
            options={versionOptions}
            onChange={handleVersionChange}
            label={intl.formatMessage({ id: 'kvCache.form.version' })}
          />
        </Form.Item>
      )}
      {isManaged && providerVersion === 'custom' && (
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
      {isManaged && (
        <>
          {!isPerNode && (
            <Form.Item<FormData>
              name="worker_id"
              rules={[
                {
                  required: true,
                  message: getRuleMessage('select', 'kvCache.table.worker')
                }
              ]}
            >
              <SealSelect
                required
                options={workerOptions}
                label={intl.formatMessage({ id: 'kvCache.table.worker' })}
              />
            </Form.Item>
          )}
          {isPerNode && (
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
                    id: 'kvCache.form.workerSelector.tips'
                  })}
                ></LabelSelector>
              </Form.Item>
            </LabelSelectorProvider>
          )}
          <Form.Item<FormData>
            name={['config', 'ram_size']}
            initialValue={20}
            rules={[
              {
                required: true,
                type: 'number',
                min: 1,
                message: getRuleMessage('input', 'kvCache.form.ramSize')
              }
            ]}
          >
            <InputNumber
              required
              min={1}
              label={intl.formatMessage({ id: 'kvCache.form.ramSize' })}
              description={
                isPerNode
                  ? intl.formatMessage({
                      id: 'kvCache.form.ramSize.perInstance'
                    })
                  : undefined
              }
            />
          </Form.Item>
          {providerFields.map((field) => (
            <Form.Item
              key={field.name}
              name={['config', 'fields', field.name]}
              initialValue={field.default}
              valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
            >
              {renderProviderFieldControl(
                field,
                field.label || humanizeFieldName(field.name)
              )}
            </Form.Item>
          ))}
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
                                  {entryBackend?.display_name ||
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
                                description={entryBackend?.description}
                              />
                            </Form.Item>
                            {entryBackend?.fields?.map((field) => {
                              const label =
                                field.label || humanizeFieldName(field.name);
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
                    <Form.Item<FormData> name={['config', 'chunk_size']}>
                      <InputNumber
                        min={1}
                        label={intl.formatMessage({
                          id: 'kvCache.form.chunkSize'
                        })}
                        description={intl.formatMessage({
                          id: 'kvCache.form.chunkSize.tips'
                        })}
                      />
                    </Form.Item>
                    <Form.Item<FormData> name={['config', 'parameters']}>
                      <ListInput
                        placeholder="--max-workers=8"
                        options={parameterHints}
                        btnText={intl.formatMessage({
                          id: 'common.button.addParams'
                        })}
                        label={intl.formatMessage({
                          id: 'kvCache.form.parameters'
                        })}
                      ></ListInput>
                    </Form.Item>
                    <Form.Item<FormData> name={['config', 'env']}>
                      <LabelSelector
                        label={intl.formatMessage({ id: 'kvCache.form.env' })}
                        btnText={intl.formatMessage({
                          id: 'common.button.vars'
                        })}
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
      )}
      {!isManaged && (
        <>
          <Form.Item<FormData>
            name={['endpoint', 'host']}
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'kvCache.form.host')
              }
            ]}
          >
            <CInput.Input
              required
              label={intl.formatMessage({ id: 'kvCache.form.host' })}
            />
          </Form.Item>
          <Form.Item<FormData>
            name={['endpoint', 'port']}
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'kvCache.form.port')
              },
              {
                type: 'number',
                min: 1,
                max: 65535,
                message: getRuleMessage('input', 'kvCache.form.port')
              }
            ]}
          >
            <InputNumber
              required
              min={1}
              max={65535}
              label={intl.formatMessage({ id: 'kvCache.form.port' })}
            />
          </Form.Item>
          <Form.Item<FormData>
            name={['endpoint', 'metrics_port']}
            rules={[
              {
                type: 'number',
                min: 1,
                max: 65535,
                message: getRuleMessage('input', 'kvCache.form.metricsPort')
              }
            ]}
          >
            <InputNumber
              min={1}
              max={65535}
              label={intl.formatMessage({ id: 'kvCache.form.metricsPort' })}
              description={intl.formatMessage({
                id: 'kvCache.form.metricsPort.tips'
              })}
            />
          </Form.Item>
          {externalFields.map((field) => {
            const label = field.label || humanizeFieldName(field.name);
            const isBoolean = field.type === 'boolean';
            return (
              <Form.Item
                // remount per provider so same-named fields never leak across providers
                key={`${providerName}-${field.name}`}
                name={['endpoint', 'params', field.name]}
                valuePropName={isBoolean ? 'checked' : 'value'}
                rules={
                  field.required && !isBoolean
                    ? [
                        {
                          required: true,
                          message: getRuleMessage('input', label, false)
                        }
                      ]
                    : []
                }
              >
                {renderExternalFieldControl(field, label)}
              </Form.Item>
            );
          })}
          <TestConnection />
        </>
      )}
    </Form>
  );
});

export default ServiceForm;
