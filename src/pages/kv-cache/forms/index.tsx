import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { ClusterListItem } from '@/pages/cluster-management/config/types';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import { WorkerStatusMap } from '@/pages/resources/config';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { useQueryWorkerList } from '@/pages/resources/services/use-query-worker-list';
import { localize } from '@/utils/localize';
import {
  CheckboxField,
  Input as CInput,
  CollapsePanel,
  InputNumber,
  LabelSelector,
  LabelSelectorProvider,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { Form } from 'antd';
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
import { queryCacheServiceInstances } from '../apis';
import {
  CacheProviderField,
  CacheServiceInstanceItem,
  FormData,
  ListItem
} from '../config/types';
import useCacheProviders from '../hooks/use-cache-providers';
import usePlacementCheck, {
  checkWorkerReadiness,
  ResourceCheckStatus
} from '../hooks/use-placement-check';
import ComponentParameters from './component-parameters';
import L2Storages from './l2-storages';
import { OptionWithIcon } from './styled';
import {
  buildWorkerLabelOptions,
  clusterFrameworksOf,
  componentEnabled,
  humanizeFieldName,
  NO_RECREATE_FIELDS,
  pickDefaultWorker,
  pickInitialVersion,
  placementConfig,
  resolveFieldValue,
  stripUnset,
  versionRunsHere
} from './utils';

export type { ResourceCheckStatus };

const isGpuServiceCluster = (cluster: ClusterListItem) =>
  Boolean(cluster.k8s_options?.gpuInstanceOptions);

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
  const { providers, providerOptions, getProvider } = useCacheProviders({
    // The catalog can arrive after workers or a user edit. Wait for its
    // state and any provider defaults to commit before reading the form.
    onLoaded: () => schedulePlacementCheck()
  });
  // The shared query hooks cancel requests when a replacement fetch starts;
  // the worker effect also guards the debounce window before it starts.
  const { clusterList: clusterOptions, fetchClusterList } =
    useQueryClusterList();
  const { fetchData: fetchWorkerList } = useQueryWorkerList();
  const [workerRead, setWorkerRead] = useState<{
    clusterId?: number;
    status: 'loading' | 'loaded' | 'error';
    workers: WorkerListItem[];
  }>({ status: 'loading', workers: [] });
  const { workers } = workerRead;
  const workersLoading = workerRead.status === 'loading';
  // Offline hardware cannot choose a new service's runtime or defaults.
  // Keep the full list for options and the existing edit behavior.
  const hardwareWorkers = useMemo(
    () =>
      action === PageAction.CREATE
        ? workers.filter((worker) => worker.state === WorkerStatusMap.ready)
        : workers,
    [workers, action]
  );
  const workerOptions = useMemo(
    () =>
      workers.map((item) => ({
        label: item.name,
        value: item.id,
        disabled:
          action === PageAction.CREATE && item.state !== WorkerStatusMap.ready
      })),
    [workers, action]
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
  const placementEdited = useRef(false);
  const lastPlacementConfig = useRef<ReturnType<typeof placementConfig> | null>(
    null
  );
  const [instanceRead, setInstanceRead] = useState<{
    serviceId?: number;
    status: 'loading' | 'loaded' | 'error';
    items?: CacheServiceInstanceItem[];
  }>({ status: 'loading' });
  // set once the user picks a version themselves, which is what stops the
  // hardware-decided pick below from overriding it
  const versionPinned = useRef(false);
  const [advancedKeys, setAdvancedKeys] = useState<string[]>([]);

  // the declaration the whole form reads from, as a value: it arrives
  // with the catalog, after the first render of an edited service
  const selectedProvider = useMemo(
    () => getProvider(providerName),
    [getProvider, providerName]
  );
  // per_node providers run one instance on every worker of the cluster;
  // there is no single worker to pick and worker_id must not be submitted
  const isPerNode = selectedProvider?.topology === 'per_node';
  // multi-component providers state capacity through their own
  // declared fields; the built-in RAM Size is not theirs
  const hasComponents =
    Object.keys(selectedProvider?.components || {}).length > 0;

  const fieldValues = Form.useWatch(['config', 'fields'], form);
  const { checkPlacement, resetPlacementCheck } =
    usePlacementCheck(onCheckStatusChange);
  const clearPlacementCheck = useMemoizedFn(() => {
    const hadEdit = placementEdited.current;
    placementEdited.current = false;
    cancelPlacementCheck();
    resetPlacementCheck();
    if (hadEdit) {
      onCheckStatusChange?.({ show: false, message: '' });
    }
  });
  const placementChanged = useMemoizedFn(
    (values: FormData) =>
      !_.isEqual(
        placementConfig(values, getProvider(values.provider_name)),
        placementConfig(
          currentData || {},
          getProvider(currentData?.provider_name || '')
        )
      )
  );
  const createWorkerError = useMemoizedFn((clusterId?: number) => {
    if (action !== PageAction.CREATE || !clusterId) {
      return undefined;
    }
    if (workerRead.clusterId !== clusterId || workersLoading) {
      return intl.formatMessage({ id: 'kvCache.check.workersLoading' });
    }
    if (workerRead.status === 'error') {
      return intl.formatMessage({ id: 'kvCache.check.workersUnavailable' });
    }
    return checkWorkerReadiness(
      {
        workers,
        workerId: form.getFieldValue('worker_id'),
        workerSelector: form.getFieldValue('worker_selector')
      },
      intl
    )?.message;
  });
  const checkCurrentPlacement = useMemoizedFn(() => {
    const values = form.getFieldsValue(true) as FormData;
    lastPlacementConfig.current = placementConfig(
      values,
      getProvider(values.provider_name)
    );
    if (action === PageAction.CREATE) {
      if (
        !values.cluster_id ||
        workerRead.clusterId !== values.cluster_id ||
        workersLoading
      ) {
        resetPlacementCheck();
        onCheckStatusChange?.({ show: false, message: '' });
        return;
      }
      if (workerRead.status === 'error') {
        resetPlacementCheck();
        onCheckStatusChange?.({
          show: true,
          type: 'danger',
          message: createWorkerError(values.cluster_id)!
        });
        return;
      }
    }
    if (action === PageAction.EDIT) {
      // Late data cannot opt an unchanged edit into checks or restore a
      // warning after the user has reverted the relevant fields.
      if (!placementEdited.current || !placementChanged(values)) {
        clearPlacementCheck();
        return;
      }
      if (
        !getProvider(values.provider_name) ||
        workersLoading ||
        instanceRead.serviceId !== currentData?.id ||
        instanceRead.status === 'loading'
      ) {
        return;
      }
    }
    checkPlacement({
      provider: getProvider(values.provider_name),
      providerVersion: values.provider_version,
      fieldValues: values.config?.fields,
      workers,
      workerId: values.worker_id,
      workerSelector: values.worker_selector,
      mode: action === PageAction.CREATE ? 'create' : 'recreate',
      replacingInstances:
        instanceRead.status === 'loaded' ? instanceRead.items : undefined
    });
  });
  // Every trigger joins the same queue. Read the store and fetched context
  // after field/default cascades commit, then skip identical input snapshots.
  const { run: schedulePlacementCheck, cancel: cancelPlacementCheck } =
    useDebounceFn(checkCurrentPlacement, { wait: 100 });

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
  const handleFormValuesChange = (changed: any, allValues: FormData) => {
    if (action === PageAction.CREATE && 'cluster_id' in changed) {
      resetPlacementCheck();
      onCheckStatusChange?.({ show: false, message: '' });
    }
    Object.keys(changed?.config?.fields || {}).forEach((name) =>
      pinnedFields.current.add(name)
    );
    const values = allValues;
    const snapshot = placementConfig(values, getProvider(values.provider_name));
    if (action === PageAction.EDIT && !placementChanged(values)) {
      clearPlacementCheck();
    } else if (!_.isEqual(snapshot, lastPlacementConfig.current)) {
      placementEdited.current = true;
      schedulePlacementCheck();
    }
    lastPlacementConfig.current = _.cloneDeep(snapshot);
    handleValuesChange();
  };

  // The support-matrix keys this cluster's workers are read against; the
  // version list is the only thing that needs them as a set.
  const clusterFrameworks = useMemo(
    () => clusterFrameworksOf(hardwareWorkers),
    [hardwareWorkers]
  );

  const versionOptions = useMemo(() => {
    const declared = Object.keys(selectedProvider?.versions || {});
    // A version no worker here could start is left out rather than listed and
    // explained: every instance of it would be refused at start, and the
    // placement check below says why for whatever is picked. Unless none of
    // them runs here, where the list stays whole — an empty picker states
    // nothing at all.
    const runnable = declared.filter((version) =>
      versionRunsHere(selectedProvider?.versions?.[version], clusterFrameworks)
    );
    const listed = runnable.length ? runnable : declared;
    // What the service already pins stays on the list even where it cannot
    // run, so opening one does not quietly offer to move it elsewhere.
    const shown =
      providerVersion &&
      declared.includes(providerVersion) &&
      !listed.includes(providerVersion)
        ? [...listed, providerVersion]
        : listed;
    const options = shown.map((version) => ({
      label: version,
      value: version
    }));
    // managed services may run a user-supplied image under the reserved
    // "custom" version
    if (selectedProvider?.custom_version) {
      options.push({
        label: intl.formatMessage({ id: 'kvCache.form.version.custom' }),
        value: 'custom'
      });
    }
    return options;
  }, [selectedProvider, providerVersion, clusterFrameworks, intl]);

  // a provider whose image is not published declares no release line at
  // all: there is no version to pick, and the service names its image
  // under the reserved "custom" version instead
  const hasDeclaredVersions = useMemo(() => {
    return Boolean(Object.keys(selectedProvider?.versions || {}).length);
  }, [selectedProvider]);

  // one of the provider's own images doubles as a format hint for the
  // custom image input. A version reading its release line off the runner
  // images names them per accelerator and carries no plain one, so the
  // hint comes from whichever the matrix holds.
  const defaultImage = useMemo(() => {
    const version = selectedProvider?.default_version
      ? selectedProvider.versions?.[selectedProvider.default_version]
      : undefined;
    if (!version) {
      return undefined;
    }
    return (
      // `||`, not `??`: an empty string is what the matrix fallback is here
      // for, and `??` would short-circuit on it and leave the hint blank.
      version.image ||
      Object.values(version.runtime_images || {})
        .flatMap((images) => Object.values(images))
        .at(0)
    );
  }, [selectedProvider]);

  const asHints = (flags?: string[]) =>
    (flags || []).map((value) => ({ label: value, value }));

  // One parameters editor per component the configuration turns on: the
  // flags reach that component's launch command alone. A provider
  // without components has the single unnamed one. Completion hints
  // follow the same split — a component declaring its own offers those,
  // and the provider-level list, which describes the binary engines
  // attach to, belongs to the component they attach to.
  const parameterComponents = useMemo(() => {
    const providerHints = asHints(selectedProvider?.common_parameters);
    const components = Object.entries(selectedProvider?.components || {});
    if (!components.length) {
      return [{ name: '', hints: providerHints }];
    }
    return components
      .filter(([, component]) =>
        componentEnabled(component, selectedProvider?.fields, fieldValues)
      )
      .map(([name, component]) => ({
        name,
        hints: component.common_parameters?.length
          ? asHints(component.common_parameters)
          : component.attach_endpoint
            ? providerHints
            : []
      }));
  }, [selectedProvider, fieldValues]);

  // The one accelerator the cluster's workers agree on, if they do. A
  // field whose value the hardware decides (a transport that is the
  // accelerator's own on NPU) defaults by it rather than leaving a
  // choice that only fails once an engine attaches.
  const clusterFramework = useMemo(() => {
    const frameworks = new Set(
      hardwareWorkers
        .map((worker) => worker.status?.gpu_devices?.[0]?.type)
        .filter(Boolean) as string[]
    );
    return frameworks.size === 1 ? [...frameworks][0] : undefined;
  }, [hardwareWorkers]);

  const fieldDefault = useCallback(
    (field: CacheProviderField) =>
      (clusterFramework && field.framework_defaults?.[clusterFramework]) ??
      field.default,
    [clusterFramework]
  );

  const l2Backends = useMemo(() => {
    return selectedProvider?.l2_backends || {};
  }, [selectedProvider]);

  // The workers decide the version, and they arrive on their own request —
  // whichever of the two lands second re-takes it. Only on create, and only
  // while the user has not picked one themselves.
  const reseedVersionFor = useMemoizedFn((items: WorkerListItem[]) => {
    if (action !== PageAction.CREATE || versionPinned.current) {
      return;
    }
    if (form.getFieldValue('provider_version') === 'custom') {
      return;
    }
    const provider = getProvider(form.getFieldValue('provider_name'));
    form.setFieldValue('provider_version', pickInitialVersion(provider, items));
  });

  // shared by the select's onChange and the create-time default so a
  // provider set either way carries its default version and a clean L2 config
  const applyProviderSelection = (value: string) => {
    const provider = getProvider(value);
    // a version carried over from the provider just replaced is not a
    // pick the user made about this one
    versionPinned.current = false;
    form.setFieldValue(
      'provider_version',
      pickInitialVersion(provider, hardwareWorkers)
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
    schedulePlacementCheck();
  };

  const handleProviderChange = (value: string) => {
    applyProviderSelection(value);
  };

  // config.image only accompanies the reserved "custom" version; drop
  // it as soon as another version is picked
  const handleVersionChange = (value: string) => {
    versionPinned.current = true;
    if (value !== 'custom') {
      form.setFieldValue(['config', 'image'], undefined);
    }
  };

  // provider-declared configuration knobs promoted to structured advanced
  // fields; a matching flag in free-form Parameters still overrides them
  const providerFields = useMemo(() => {
    return selectedProvider?.fields || [];
  }, [selectedProvider]);

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
    schedulePlacementCheck();
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
    const value = resolveFieldValue(
      field.visible_by,
      providerFields,
      fieldValues
    );
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

  const handleFinish = async (values: FormData) => {
    const error = createWorkerError(values.cluster_id);
    if (error) {
      // Worker availability belongs to the placement alert, not field
      // validation. Check again here so loading or dismissed alerts cannot
      // allow a service with no Ready target through.
      onCheckStatusChange?.({
        show: true,
        type:
          workerRead.clusterId !== values.cluster_id || workersLoading
            ? 'transition'
            : 'danger',
        message: error
      });
      onFinishFailed?.({ values, errorFields: [], outOfDate: false });
      return;
    }
    await onFinish(values);
  };

  useImperativeHandle(ref, () => ({
    form,
    submit: () => {
      form.submit();
    },
    resetFields: () => {
      placementEdited.current = false;
      lastPlacementConfig.current = null;
      cancelPlacementCheck();
      resetPlacementCheck();
      onCheckStatusChange?.({ show: false, message: '' });
      pinnedFields.current.clear();
      // The same concept, reset where that one is: a version the user picked
      // belongs to the form being discarded, and leaving it set would keep
      // the hardware-decided pick off for the rest of the session.
      versionPinned.current = false;
      form.resetFields();
    }
  }));

  useEffect(() => {
    if (action === PageAction.EDIT && currentData) {
      clearPlacementCheck();
      lastPlacementConfig.current = placementConfig(
        currentData,
        getProvider(currentData.provider_name)
      );
      cancelPlacementCheck();
      resetPlacementCheck();
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

  // Load frozen instance reservations when the edit opens. A service's saved
  // config may already differ from its running instances; never infer their
  // reclaimable RAM from the form. Ignore replies from another edit session.
  useEffect(() => {
    if (action !== PageAction.EDIT || !currentData?.id) {
      return;
    }
    let active = true;
    const serviceId = currentData.id;
    setInstanceRead({ serviceId, status: 'loading' });
    queryCacheServiceInstances(serviceId, { skipErrorHandler: true }).then(
      (response) => {
        if (active) {
          setInstanceRead({
            serviceId,
            status: 'loaded',
            items: response.items || []
          });
          schedulePlacementCheck();
        }
      },
      () => {
        if (active) {
          setInstanceRead({ serviceId, status: 'error' });
          schedulePlacementCheck();
        }
      }
    );
    return () => {
      active = false;
    };
  }, [action, currentData?.id]);

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
    if (!selectedProvider?.custom_version) {
      return;
    }
    form.setFieldValue('provider_version', 'custom');
    schedulePlacementCheck();
  }, [form, hasDeclaredVersions, providerVersion, selectedProvider]);

  // Seed new services with the default cluster, or the only available one.
  // A provider switch resets the form, so it also needs the initial selection.
  useEffect(() => {
    if (
      action !== PageAction.CREATE ||
      form.getFieldValue('cluster_id') != null
    ) {
      return;
    }
    const availableClusters = clusterOptions.filter(
      (item) => !isGpuServiceCluster(item)
    );
    const initialCluster =
      availableClusters.find((item) => item.is_default) ??
      (availableClusters.length === 1 ? availableClusters[0] : undefined);
    if (initialCluster) {
      form.setFieldValue('cluster_id', initialCluster.value);
    }
  }, [clusterOptions, provider, action]);

  useEffect(() => {
    fetchClusterList({ page: -1 }).catch(() => {
      // canceled or failed; the select just stays empty
    });
  }, []);

  useEffect(() => {
    let active = true;
    // cluster workers feed the singleton Worker select and the per_node
    // label-selector autocomplete
    const fetchWorkers = async () => {
      if (!clusterId) {
        setWorkerRead({ status: 'loaded', workers: [] });
        schedulePlacementCheck();
        return;
      }
      setWorkerRead({ clusterId, status: 'loading', workers: [] });
      schedulePlacementCheck();
      try {
        const items = (await fetchWorkerList({
          cluster_id: clusterId,
          page: -1
        })) as WorkerListItem[];
        // The next fetch is debounced, so the previous HTTP request can
        // finish before it is canceled, including for this same cluster.
        if (!active || form.getFieldValue('cluster_id') !== clusterId) {
          return;
        }
        const readyWorkers = (items || []).filter(
          (worker) => worker.state === WorkerStatusMap.ready
        );
        setWorkerRead({ clusterId, status: 'loaded', workers: items || [] });
        reseedVersionFor(readyWorkers);
        // nothing to seed where the form offers no Worker select
        if (isPerNode || hasComponents) {
          schedulePlacementCheck();
          return;
        }
        // seed an empty selection with the least-loaded worker
        if (
          action === PageAction.CREATE &&
          readyWorkers.length &&
          form.getFieldValue('worker_id') == null
        ) {
          form.setFieldValue('worker_id', pickDefaultWorker(readyWorkers).id);
        }
        schedulePlacementCheck();
      } catch (error) {
        // Only the still-active effect may clear workers on failure.
        if (active && form.getFieldValue('cluster_id') === clusterId) {
          setWorkerRead({ clusterId, status: 'error', workers: [] });
          reseedVersionFor([]);
          schedulePlacementCheck();
        }
      }
    };
    fetchWorkers();
    return () => {
      active = false;
    };
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
      onFinish={handleFinish}
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
          // A declared release line has to be named. The field is empty
          // only while the cluster's workers are still arriving, and a
          // submit landing in that window would otherwise store nothing
          // and leave the server to resolve the provider default — which
          // is the version this pick exists to move off.
          rules={
            hasDeclaredVersions
              ? [
                  {
                    required: true,
                    message: getRuleMessage('select', 'kvCache.form.version')
                  }
                ]
              : []
          }
        >
          <SealSelect
            required={hasDeclaredVersions}
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
          options={clusterOptions.map((item) => ({
            ...item,
            disabled: isGpuServiceCluster(item)
          }))}
          label={intl.formatMessage({ id: 'clusters.title' })}
          description={intl.formatMessage({
            id: 'kvCache.form.cluster.tips'
          })}
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
          {/* entries belong to the provider that declared the backends,
              and so does which of them is open: remount with it */}
          <L2Storages key={providerName} form={form} l2Backends={l2Backends} />
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
                    {(selectedProvider?.management_url ||
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
