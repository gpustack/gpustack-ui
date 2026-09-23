import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { ProviderValueMap } from '@/pages/cluster-management/config';
import {
  CollapsePanel,
  IconFont,
  ScrollSpyTabs,
  useWrapperContext
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo
} from 'react';
import {
  DeployFormKeyMap,
  DO_NOT_NOTIFY_RECREATE,
  DO_NOT_TRIGGER_CHECK_COMPATIBILITY,
  ManualGPUModeMap,
  modelSourceMap,
  PD_ELIGIBLE_BACKENDS,
  PD_MODE_CUSTOM,
  ScheduleValueMap
} from '../config';
import { FormContext } from '../config/form-context';
import {
  BackendOption,
  ClusterOption,
  DeployFormKey,
  FormData,
  LoraListItem,
  SourceType
} from '../config/types';
import { backendOptionsMap } from '../constants/backend-parameters';
import { useGenerateGPUOptions } from '../hooks/use-form-initial-values';
import useQueryBackends from '../hooks/use-query-backends';
import { useQueryContextLength } from '../services/use-query-context-length';
import { derivesNativeAnthropicApi, generateGPUIds } from '../utils';
import AdvanceConfig from './advance-config';
import BasicForm from './basic';
import PDDisaggregation, { PDEffects } from './pd-disaggregation';
import Performance from './performance';
import Roles from './roles';
import { rolesFormToPayload } from './roles/transform';
import ScheduleTypeForm from './schedule-type';
import ScheduledScalingForm from './scheduled-scaling';

const baseRequiredFields = ['name', 'source'];

const advancedRequiredFields = ['backend', 'image_name', 'run_command'];

const scheduleRequiredFields = [
  'gpu_selector',
  'gpu_type_selector',
  'scaling_schedule'
];

const performanceRequiredFields = ['speculative_config'];

interface DataFormProps {
  initialValues?: FormData;
  ref?: any;
  source: SourceType;
  action: PageActionType;
  realAction?: PageActionType;
  isGGUF: boolean;
  formKey: DeployFormKey;
  sourceDisable?: boolean;
  sourceList?: Global.BaseOption<string>[];
  clusterList: ClusterOption[];
  fields?: string[]; // control some fields to show in the form
  clearCacheFormValues?: () => void;
  onValuesChange?: (changedValues: any, allValues: any) => void;
  onSourceChange?: (value: string) => void;
  onOk: (values: FormData) => void;
  onBackendChange?: (value: string) => void;
  onClusterChange?: (value: number) => void;
  onFinishFailed?: (errorInfo: any) => void;
}

const TABKeysMap = {
  BASIC: 'basic',
  // Covers the switch and the roles both. `ROLES` was a second key for the
  // second half of one topic; it went when the two sections merged.
  PD: 'pd',
  SCHEDULING: 'scheduling',
  PERFORMANCE: 'performance',
  // PD only: the fields a role cannot override, gathered where the fact is
  // stated rather than scattered through sections that imply per-deployment
  // scope. See ui-design.md §2.0b.
  ADVANCED: 'advanced'
};

const DataForm: React.FC<DataFormProps> = forwardRef((props, ref) => {
  const {
    action,
    isGGUF,
    formKey,
    source,
    realAction,
    initialValues,
    sourceDisable = true,
    sourceList,
    clusterList = [],
    clearCacheFormValues,
    onBackendChange,
    onSourceChange,
    onValuesChange,
    onClusterChange,
    onFinishFailed,
    onOk
  } = props;
  const { getScrollElementScrollableHeight } = useWrapperContext();
  const { backendOptions, flatBackendOptions, getBackendOptions } =
    useQueryBackends();
  const { getGPUOptionList, gpuOptions, workerLabelOptions } =
    useGenerateGPUOptions();
  const [form] = Form.useForm();
  const intl = useIntl();
  const [activeKey, setActiveKey] = React.useState<string[]>([]);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const { modelContextData, fetchContextLength } = useQueryContextLength();
  const localPath = Form.useWatch('local_path', form);
  const modelScopeModelId = Form.useWatch('model_scope_model_id', form);
  const huggingfaceRepoId = Form.useWatch('huggingface_repo_id', form);
  const scrollTabsRef = React.useRef<any>(null);
  // Reported by the PD block, applied here: the effects land on sections the
  // block does not own (`replicas`, `scaling_schedule`, `extended_kv_cache`),
  // so it names them and this owner writes them.
  //
  // 🔴 Seeded from `initialValues`, not hardcoded to off. `enabled` is what
  // decides the SHAPE of this form — which tabs exist, whether the replica
  // field renders — and starting it at `false` meant an edit drawer on an
  // existing group painted the whole non-PD layout first, then repainted as
  // PD the moment `PDDisaggregation`'s mount effect reported back. One
  // visible flash on every edit.
  //
  // `PDDisaggregation` already derives this correctly on its own first render
  // (it reads the store synchronously, because `useWatch` answers `undefined`
  // there); the gap was that the parent had no way to know until the child
  // told it. This reads the same two facts from the same place.
  //
  // ⚠️ Initializer only — `useState` runs it once. Deriving `enabled` from
  // `initialValues` on every render is a documented trap: `initialValues`
  // never changes, so it would answer "still on" however thoroughly the user
  // turned PD off, and the switch would snap back. See the note above
  // `active` in `pd-disaggregation.tsx`.
  const [pdEffects, setPDEffects] = React.useState<PDEffects>(() => {
    const mode = initialValues?.disaggregation?.mode ?? null;
    return {
      enabled: !!initialValues?.roles?.length || !!mode,
      mode,
      isCustomMode: mode === PD_MODE_CUSTOM,
      replicasLocked: false,
      scalingDisabled: false,
      clearModelKVCache: false
    };
  });

  /**
   * Whether this engine can be disaggregated at all — the whole PD section
   * hangs off it, nav entry included.
   *
   * ⚠️ Falls back to `initialValues`, never to "not eligible". `useWatch`
   * answers `undefined` on its first render, and one frame of "ineligible"
   * unmounts `PDDisaggregation` — whose mount effect then publishes
   * `enabled: false` when it comes back, turning PD off on an edit drawer
   * that had it on. That is the trap the note above `pdEffects` describes,
   * reached from the other side: there the parent painted the wrong shape,
   * here it removes the child that owns the state.
   *
   * Unmounting on a real backend change is fine, and is the point:
   * `handleBackendChange` has already put `pdEffects` back to off by then, so
   * there is no PD state left for the remount to contradict.
   *
   * 🔴 An already-enabled group keeps its section whatever its engine, the
   * same way `blocked` stopped un-setting the displayed state in
   * `pd-disaggregation.tsx`: «你不能打开它» and «它没有打开» are different
   * things, and only the second one may hide PD config. A deployment created
   * before this gate existed would otherwise open with its roles invisible
   * and unreachable — and still be submitted, since `handleOk` reads
   * `pdEffects.enabled` rather than what is on screen. Shown, so the user can
   * see what they have and turn it off themselves.
   */
  const backend = Form.useWatch('backend', form) ?? initialValues?.backend;
  const pdEligible =
    PD_ELIGIBLE_BACKENDS.includes(backend as string) || pdEffects.enabled;

  /**
   * What the model-level fields held before PD cleared them.
   *
   * 🔴 Turning PD on is destructive by design — the clears below are what make
   * «this no longer applies» visible rather than hiding a value that still
   * projects onto every role. Turning it back OFF was not the mirror of that:
   * `clearModelScheduling` is only ever published on the way in, so switching
   * off left the fields empty and the cards that reappeared blank. A user who
   * opened the switch on an existing deployment to look at it, then closed it
   * again, silently lost its parameters, env, LoRA list and selectors — with
   * nothing on screen saying anything had gone.
   *
   * So the clear stashes, and switching off puts it back. Captured on the
   * FIRST enable only: a later notification while PD is still on must not
   * overwrite the stash with the emptiness it just created.
   *
   * A ref, not state — nothing renders from it, and re-rendering on capture
   * would be a render triggered by a field write.
   */
  const preservedModelFields = React.useRef<Record<string, any> | null>(null);

  // `clearModelKVCache` is a one-shot instruction, so consume it where it
  // arrives rather than letting it sit true and re-clear on every render.
  const handlePDEffectsChange = (next: PDEffects) => {
    setPDEffects(next);
    if (next.enabled && !preservedModelFields.current) {
      // Every field any branch below clears, read before any of them run.
      preservedModelFields.current = {
        gpu_selector: form.getFieldValue('gpu_selector'),
        gpu_type_selector: form.getFieldValue('gpu_type_selector'),
        worker_selector: form.getFieldValue('worker_selector'),
        placement_strategy: form.getFieldValue('placement_strategy'),
        extended_kv_cache: form.getFieldValue('extended_kv_cache'),
        backend_parameters: form.getFieldValue('backend_parameters'),
        env: form.getFieldValue('env'),
        lora_list: form.getFieldValue('lora_list')
      };
    }
    if (next.clearModelScheduling) {
      // Cleared, not just hidden. `role_effective_model` projects the model's
      // value onto any role that has none, so a leftover selector would keep
      // constraining every member with nothing on screen saying so.
      form.setFieldsValue({
        gpu_selector: null,
        gpu_type_selector: null,
        worker_selector: {},
        placement_strategy: undefined
      } as any);
    }
    if (next.clearModelKVCache) {
      form.setFieldValue('extended_kv_cache', { enabled: false });
    }
    if (next.clearModelParams) {
      // Same reason as `clearModelScheduling`: hidden-but-set would keep
      // projecting onto every role through `role_effective_model`.
      form.setFieldsValue({
        backend_parameters: [],
        env: {}
      } as any);
    }
    if (next.clearModelLora) {
      // Not a projection problem — an admission one. LoRA does not serve under
      // PD at all (the router's registry is keyed by served-model name, the
      // members register the base name), so the backend refuses `lora_list`
      // together with `roles`. The field is unmounted while PD is on, and an
      // unmounted field is already absent from what `onFinish` hands over —
      // this clears the store as well, so nothing reads a value the user can
      // no longer see (`getFieldsValue(true)`, the copy path, a later switch
      // back to a form that would show it again as if it were still deployed).
      form.setFieldValue('lora_list', []);
    }
    // PD off again: give the model-level fields back. Guarded on the stash
    // rather than on a transition flag, which is what keeps it to the one
    // notification that matters — the ref is non-null only after an enable.
    if (!next.enabled && preservedModelFields.current) {
      form.setFieldsValue(preservedModelFields.current as any);
      preservedModelFields.current = null;
    }
    // Only when it actually differs. An unconditional write fires the form's
    // onValuesChange on every notification, and that is what drives the
    // compatibility check — so writing the value it already holds turns each
    // mode change into a round trip.
    if (next.replicasLocked && form.getFieldValue('replicas') !== 1) {
      form.setFieldValue('replicas', 1);
    }
  };

  const segmentOptions = [
    {
      value: TABKeysMap.BASIC,
      label: intl.formatMessage({ id: 'common.title.basicInfo' }),
      icon: <IconFont type="icon-basic" />,
      field: 'name'
    },
    // One entry, because there is one section now. A separate Roles tab that
    // appeared only once PD was on advertised a second destination for what
    // has always been one topic — and the switch it depended on lived under
    // the *other* tab.
    //
    // Gone entirely on an engine PD does not apply to, rather than left
    // pointing at a disabled switch: the section would be one control whose
    // only state is off, and a nav entry leading to it reads as a feature the
    // user failed to find rather than one their engine does not have.
    ...(pdEligible
      ? [
          {
            value: TABKeysMap.PD,
            label: intl.formatMessage({ id: 'models.form.pd.section' }),
            icon: <IconFont type="icon-model" />,
            field: pdEffects.enabled ? 'roles' : 'pdMode'
          }
        ]
      : []),
    // Performance is model-level, and under PD both of its fields have moved
    // down to the roles: the KV cache because prefill and decode want
    // different answers, speculative decoding because the NIXL handshake
    // hashes the model and a draft head is part of it (F17). An empty section
    // with a familiar name is worse than no section -- it reads as "nothing
    // to tune here".
    ...(pdEffects.enabled
      ? []
      : [
          {
            value: TABKeysMap.PERFORMANCE,
            label: intl.formatMessage({ id: 'models.form.performance' }),
            icon: <IconFont type="icon-speed" />,
            field: 'extended_kv_cache.enabled'
          }
        ]),
    // Same reason Performance is excluded: the section itself is gone under PD
    // (every GPU-bearing role carries its own "Resources and scheduling"), so
    // a nav entry that survives it scrolls to nothing — the tab looks dead
    // rather than absent.
    ...(pdEffects.enabled
      ? []
      : [
          {
            value: TABKeysMap.SCHEDULING,
            label: intl.formatMessage({ id: 'models.form.scheduling' }),
            icon: <IconFont type="icon-model" />,
            field: 'scheduleType'
          }
        ]),
    {
      value: TABKeysMap.ADVANCED,
      label: intl.formatMessage({ id: 'resources.form.advanced' }),
      icon: <IconFont type="icon-settings" />,
      field: 'categories'
    }
  ];

  const segmentedTop = useMemo(() => {
    if (
      modelSourceMap.local_path_value === source ||
      action === PageAction.EDIT ||
      formKey === DeployFormKeyMap.CATALOG
    ) {
      return {
        top: 0,
        offsetTop: 96
      };
    }

    return {
      top: 50,
      offsetTop: 146
    };
  }, [source, formKey, action]);

  const handleSumit = () => {
    form.submit();
  };

  // voxbox is not support multi gpu
  const updateGPUSelector = (backend: string) => {
    const gpuids = form.getFieldValue(['gpu_selector', 'gpu_ids']) || [];

    if (backend === backendOptionsMap.voxBox && gpuids.length > 0) {
      return {
        gpu_selector: {
          gpu_ids: [gpuids[0]],
          gpus_per_replica: null
        }
      };
    }
    return {
      gpu_selector: { gpu_ids: gpuids }
    };
  };

  const updateFieldsOnGGUF = () => {
    // when isGGUF is true, set distributed_inference_across_workers and cpu_offloading to true
    return {
      distributed_inference_across_workers: true,
      cpu_offloading: true
    };
  };

  // `option` is absent when the backend was picked for the user rather than
  // from the dropdown: local-path-source forces one on a .gguf path and looks
  // it up in the loaded options, which come up empty for a cluster that does
  // not offer it. Absent reads as not-built-in throughout, which is the safe
  // answer for every switch below.
  const updateKVCacheConfig = (backend: string, option?: BackendOption) => {
    if (
      !option?.isBuiltIn ||
      ![backendOptionsMap.SGLang, backendOptionsMap.vllm].includes(backend)
    ) {
      return {
        extended_kv_cache: {
          enabled: false
        },
        speculative_config: {
          enabled: false
        }
      };
    }
    // both vLLM and SGLang attach to shared cache services; a saved
    // shared selection survives switching between them (availability is
    // re-checked by the KV cache form's own options sync)
    return {};
  };

  const handleBackendChange = async (val: string, option?: BackendOption) => {
    /**
     * The stash belongs to the engine it was taken from, so a new engine
     * voids it.
     *
     * 🔴 Unconditional, and before anything below runs. The reset further down
     * only fires for an engine PD does NOT apply to, and the damaging path is
     * the one where it does: vLLM and SGLang are both eligible, so switching
     * between them leaves PD on and the stash intact — holding vLLM's
     * parameters, GPU selector and cache config, which are exactly three of
     * the fields the write below is replacing with SGLang's defaults. Turning
     * PD off afterwards would put the vLLM values back over them, and the
     * deployment would save an SGLang engine configured as a vLLM one, with
     * nothing on screen saying so.
     *
     * Nulling it means turning PD off now leaves the new engine's defaults
     * standing, which is what the user is looking at and what they last chose.
     * Switching back and forth does not resurrect the original values either,
     * and must not: this write has already replaced them in the store, so the
     * stash was their last copy and restoring it would bring back values the
     * user watched being overwritten.
     */
    preservedModelFields.current = null;
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    form.setFieldsValue({
      backend_version: null, // don't set default version here, let the user select it
      backend_parameters: option?.default_backend_param || [],
      // Switching away from vLLM clears it: carrying the declaration to, say,
      // SGLang would have the gateway forward a request the new image cannot
      // answer, where translating it would have worked.
      native_anthropic_api: derivesNativeAnthropicApi(val, option),
      ...updateKVCacheConfig(val, option),
      ...updateGPUSelector(val)
    });

    // Switching to an engine PD does not apply to takes the section away, so
    // the state it published has to go with it. Turned off HERE rather than
    // left to the unmount: `pdEffects.enabled` is what decides the rest of the
    // form's shape — whether Performance and Scheduling exist, whether
    // `replicas` is locked — and `handleOk` reads it to decide between sending
    // `roles` and sending `null`. A group left enabled behind a section that
    // is no longer on screen would submit roles the new engine cannot run,
    // with nothing visible saying so.
    if (!PD_ELIGIBLE_BACKENDS.includes(val)) {
      setPDEffects({
        enabled: false,
        mode: null,
        isCustomMode: false,
        replicasLocked: false,
        scalingDisabled: false,
        clearModelKVCache: false
      });
    }

    onBackendChange?.(val);
  };

  // generate the data is available for the backend including the gpu_ids
  const handleOk = async (formdata: FormData) => {
    const data = _.cloneDeep(formdata);
    data.categories = data.categories ? [data.categories] : [];
    if (data.lora_list && data.lora_list.length > 0) {
      data.lora_list = data.lora_list.map((item: LoraListItem) => ({
        ...item,
        huggingface_filename: data.huggingface_filename || '',
        model_scope_file_path: data.model_scope_file_path || '',
        local_path: data.local_path || ''
      }));
    }
    const gpuSelector = generateGPUIds(data);
    const allValues = {
      // `pdMode` joins the UI-only pair: it says which Segmented state is
      // selected, while `disaggregation` is what carries the intent.
      ..._.omit(data, ['scheduleType', 'manualGpuMode', 'pdMode']),
      ...gpuSelector
    };
    // A group left on "same as model" submits its fields as null, which is the
    // wire's word for inherit — so the transform is what makes the form's shape
    // and the payload's shape the same. `null` rather than `[]` for no roles:
    // an empty array is a group with no members, while null is the plain
    // single-role deployment every model is today.
    if (pdEffects.enabled) {
      // 🔴 `form.getFieldValue`, not `data.roles`. `data` is what `onFinish`
      // hands over, and antd builds that from REGISTERED fields only — a value
      // written with `setFieldValue` under a path that has no `Form.Item` is
      // simply absent from it. `roles[i].__injected` is exactly that: the
      // snapshot of what the PD recipe seeded into the role's parameter list,
      // written by `role-form` / `router-form` and read by
      // `stripUntouchedInjection` to take those rows back off.
      //
      // Reading it off `data` therefore made the strip a no-op, and every new
      // PD deployment submitted the recipe's own rows as if the user had typed
      // them — including the `{{...}}` placeholders, which only the worker can
      // resolve. Observed as a launch failure: «A configuration value reached
      // the engine unrendered ... Unrendered: {{kv_lease_duration}}», with the
      // JSON further mangled by `flatten_to_argv` re-tokenizing it.
      //
      // `data` stays as the model-level half: those fields ARE registered, and
      // it is the shape the rest of this function already works from.
      allValues.roles = rolesFormToPayload(form.getFieldValue('roles'), data);
    } else {
      allValues.roles = null;
      allValues.disaggregation = null;
    }
    // Don't persist a disabled schedule — send null so the model carries no
    // scaling config unless the user explicitly enabled it.
    if (!allValues.scaling_schedule?.enabled) {
      allValues.scaling_schedule = null;
    } else {
      // The top "Replicas" input IS the baseline while scheduling is on. Copy
      // it into the schedule; `replicas` stays as this value and the backend
      // drives it to the effective count.
      allValues.scaling_schedule.baseline_replicas = allValues.replicas ?? 0;
    }
    console.log('submit form data:', allValues);
    onOk(allValues);
  };

  // Shared work when the target cluster changes: refetch the GPU/backend
  // options for the new cluster and reset the per-cluster GPU selections.
  // The schedule mode itself is kept: switching cluster must not kick a
  // vGPU-mode form back to Auto (the auto-seed fires exactly on that path).
  // The manual mode's GPU source is the exception — a Docker cluster publishes
  // no InstanceTypes, so vGPU slicing has nothing to select there and the
  // source falls back to whole cards (schedule-type hides the switch to match).
  const applyClusterScopedOptions = (value: number) => {
    getGPUOptionList({ clusterId: value });
    getBackendOptions({ cluster_id: value });
    const isDocker =
      clusterList.find((item) => item.value === value)?.provider ===
      ProviderValueMap.Docker;
    form.setFieldsValue({
      gpu_selector: null,
      gpu_type_selector: null,
      ...(isDocker ? { manualGpuMode: ManualGPUModeMap.FullGPU } : {})
    });
  };

  // User explicitly picked a cluster: refresh scoped options and re-evaluate.
  const handleClusterChange = async (value: number) => {
    await onClusterChange?.(value);
    applyClusterScopedOptions(value);
    await new Promise((resolve) => {
      setTimeout(resolve, 150);
    });
    onValuesChange?.({}, withRoles(form.getFieldsValue()));
  };

  // The basic form seeds a default cluster on open, before a model is picked.
  // Refresh scoped options for it but don't fire the evaluate request — there
  // is no model to evaluate yet.
  const handleClusterSeed = async (value: number) => {
    await onClusterChange?.(value);
    applyClusterScopedOptions(value);
  };

  /**
   * What a role contributes to the evaluation, and nothing else.
   *
   * The replica count is the x and the y of xPyD, and the card selection
   * decides what one member lands on — those two are the whole of what changes
   * the group's footprint or whether it fits. A role's engine parameters are
   * deliberately out, exactly as the model-level `backend_parameters` are:
   * they are typed through, and each keystroke would otherwise cost a full
   * group solve.
   */
  const rolesEvaluationSignature = (roles?: any[] | null) =>
    JSON.stringify(
      (roles || []).map((role: any) => [
        role?.name,
        role?.replicas,
        role?.gpu_selector,
        role?.gpu_type_selector,
        role?.resources
      ])
    );

  const rolesSignatureRef = React.useRef<string>(
    rolesEvaluationSignature(initialValues?.roles)
  );

  /**
   * The form's values with the roles read off the store rather than off what
   * antd handed over.
   *
   * 🔴 The same trap `handleOk` documents: antd builds `allValues` from
   * REGISTERED fields only, and `roles[i].__injected` — the snapshot of what
   * the PD recipe seeded into a role's parameter list — is written with
   * `setFieldValue` under a path that has no `Form.Item`. Evaluating the
   * version without it means `stripUntouchedInjection` has nothing to strip,
   * so the recipe's own rows (including `{{...}}` placeholders only the worker
   * can resolve) are sent as if the user had typed them.
   */
  const withRoles = (values: Record<string, any>) => {
    const roles = form.getFieldValue('roles');
    return roles ? { ...values, roles } : values;
  };

  const getFieldPaths = (obj: Record<string, any>, prefix = ''): string => {
    const result = Object.entries(obj).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
        ? getFieldPaths(value, path)
        : [path];
    });

    return result[0] || '';
  };

  /**
   * auto check compatibility or notify recreate when certain fields change
   * @param changedValues
   * @param allValues
   * @returns
   */
  const handleOnValuesChange = async (changedValues: any, allValues: any) => {
    const fieldName = getFieldPaths(changedValues);

    if (
      DO_NOT_TRIGGER_CHECK_COMPATIBILITY.includes(fieldName) ||
      (DO_NOT_NOTIFY_RECREATE.includes(fieldName) && action === PageAction.EDIT)
    ) {
      return;
    }
    // A role edit only moves the answer when it moves the group's SIZE or the
    // cards its members want; everything else in a role is typed through
    // character by character, and evaluating a group is a whole solve over the
    // cluster. `roles` used to sit in DO_NOT_TRIGGER_CHECK_COMPATIBILITY for
    // that reason, which also meant changing 1P1D to 4P4D never re-evaluated.
    if (fieldName === 'roles') {
      const signature = rolesEvaluationSignature(form.getFieldValue('roles'));
      if (signature === rolesSignatureRef.current) {
        return;
      }
      rolesSignatureRef.current = signature;
    }
    onValuesChange?.(changedValues, withRoles(allValues));
  };

  const handleOnCollapseChange = (keys: string | string[]) => {
    setActiveKey(Array.isArray(keys) ? keys : [keys]);
  };

  const handleOnFinishFailed = (errorInfo: any) => {
    setSubmitAttempted(true);
    onFinishFailed?.(errorInfo);
    console.log('Failed:', errorInfo);
    const { errorFields } = errorInfo;
    if (errorFields && errorFields.length > 0) {
      const collapseKeys: string[] = [];
      const names = errorFields.map((item: any) => item.name[0]);
      const isAdvancedRequired = names.some((name: string) =>
        advancedRequiredFields.includes(name)
      );

      const isPerformanceRequired = names.some((name: string) =>
        performanceRequiredFields.includes(name)
      );

      const isScheduleRequired = names.some((name: string) =>
        scheduleRequiredFields.includes(name)
      );

      const isBaseRequired = names.some((name: string) =>
        baseRequiredFields.includes(name)
      );

      if (isScheduleRequired) {
        collapseKeys.push(TABKeysMap.SCHEDULING);
      }

      if (isPerformanceRequired) {
        collapseKeys.push(TABKeysMap.PERFORMANCE);
      }

      if (isAdvancedRequired) {
        collapseKeys.push(TABKeysMap.ADVANCED);
      }

      if (isBaseRequired) {
        scrollTabsRef.current?.handleTargetChange(TABKeysMap.BASIC);
      } else if (isScheduleRequired) {
        scrollTabsRef.current?.handleTargetChange(TABKeysMap.SCHEDULING);
      } else if (isPerformanceRequired) {
        scrollTabsRef.current?.handleTargetChange(TABKeysMap.PERFORMANCE);
      } else if (isAdvancedRequired && formKey === DeployFormKeyMap.CATALOG) {
        scrollTabsRef.current?.handleTargetChange(TABKeysMap.ADVANCED);
      } else if (
        isAdvancedRequired &&
        formKey === DeployFormKeyMap.DEPLOYMENT
      ) {
        scrollTabsRef.current?.handleTargetChange(TABKeysMap.BASIC);
      }

      setActiveKey((prev: string[]) => [
        ...new Set([...prev, ...collapseKeys])
      ]);
    }
  };

  useImperativeHandle(ref, () => {
    return {
      form: form,
      submit: handleSumit,
      resetFields: (fields: any[]) => {
        form.resetFields(fields);
      },
      setFieldsValue: (values: FormData) => {
        form.setFieldsValue(values);
      },
      setFieldValue: (name: string, value: any) => {
        form.setFieldValue(name, value);
      },
      getFieldValue: (name: string) => {
        return form.getFieldValue(name);
      },
      getFieldsValue: () => {
        return form.getFieldsValue();
      },
      getGPUOptionList: async (params: { clusterId: number }) => {
        return await getGPUOptionList(params);
      },
      getBackendOptions: async (params?: { cluster_id: number }) => {
        return await getBackendOptions(params);
      }
    };
  });

  useEffect(() => {
    if (isGGUF || (!localPath && !modelScopeModelId && !huggingfaceRepoId)) {
      return;
    }
    let params = {};
    if (source === modelSourceMap.local_path_value) {
      params = { local_path: localPath };
    } else if (source === modelSourceMap.modelscope_value) {
      params = { model_scope_model_id: modelScopeModelId };
    } else if (source === modelSourceMap.huggingface_value) {
      params = { huggingface_repo_id: huggingfaceRepoId };
    }

    // TODO
    // fetchContextLength({ ...params, source });
  }, [isGGUF, source, localPath, modelScopeModelId, huggingfaceRepoId]);

  const handleActiveChange = (key: string[]) => {
    setActiveKey(key);
  };

  return (
    <FormContext.Provider
      value={{
        isGGUF: isGGUF,
        formKey: formKey,
        source: props.source,
        action: action,
        realAction: realAction,
        gpuOptions: gpuOptions,
        clusterList: clusterList,
        backendOptions: backendOptions,
        flatBackendOptions: flatBackendOptions,
        workerLabelOptions: workerLabelOptions,
        initialValues: initialValues,
        modelContextData: modelContextData,
        submitAttempted: submitAttempted,
        clearCacheFormValues: clearCacheFormValues,
        /**
         * The WRAPPED handler, not the raw prop.
         *
         * 🔴 Sections that re-evaluate after writing the store by hand call
         * this as `onValuesChange?.({}, form.getFieldsValue())`, and antd
         * builds that object from REGISTERED paths only. `roles[i].__injected`
         * — the snapshot of what the PD recipe seeded into a role's parameter
         * list — is written with `setFieldValue` under a path that has no
         * `Form.Item`, so it is always missing from it. Handed the raw prop,
         * every one of those calls evaluated a group whose recipe rows still
         * carried `{{ports.kv_port}}`: `stripUntouchedInjection` had no
         * snapshot to strip against, so the compatibility answer described a
         * deployment nobody would ever get.
         *
         * `handleOnValuesChange` is where `withRoles` puts the store's own
         * `roles` back — the same fix `handleOk` documents on the submit path —
         * and it carries the DO_NOT_TRIGGER filters with it, so every consumer
         * gets both by doing nothing.
         */
        onValuesChange: handleOnValuesChange,
        onBackendChange: handleBackendChange
      }}
    >
      <ScrollSpyTabs
        ref={scrollTabsRef}
        defaultTarget="basic"
        segmentOptions={segmentOptions}
        activeKey={activeKey}
        setActiveKey={handleActiveChange}
        segmentedTop={segmentedTop}
        getScrollElementScrollableHeight={getScrollElementScrollableHeight}
      >
        <Form
          name="deployModel"
          form={form}
          onFinish={handleOk}
          preserve={false}
          clearOnDestroy={true}
          onValuesChange={handleOnValuesChange}
          onFinishFailed={handleOnFinishFailed}
          scrollToFirstError={true}
          initialValues={{
            // `replicas` is set below (baseline-aware) after ...initialValues so
            // it wins; no plain default here or it'd be a duplicate key.
            scaling_schedule: { enabled: false, rules: [] },
            source: props.source,
            placement_strategy: 'spread',
            scheduleType: ScheduleValueMap.Auto,
            manualGpuMode: ManualGPUModeMap.FullGPU,
            categories: null,
            native_anthropic_api: false,
            restart_on_error: true,
            distributed_inference_across_workers: true,
            mode: 'throughput',
            enable_model_route: true,
            generic_proxy: false,
            extended_kv_cache: {
              enabled: false,
              mode: 'local',
              cache_service_id: null,
              chunk_size: null,
              ram_ratio: 1.2,
              ram_size: null
            },
            speculative_config: {
              enabled: false,
              algorithm: '',
              draft_model: null,
              num_draft_tokens:
                initialValues?.speculative_config?.num_draft_tokens || 4,
              ngram_min_match_length:
                initialValues?.speculative_config?.ngram_min_match_length || 1,
              ngram_max_match_length:
                initialValues?.speculative_config?.ngram_max_match_length || 10
            },
            ...initialValues,
            // When editing a model that already has scheduled scaling on, the
            // stored `replicas` is the scheduler-driven live value. Seed the
            // Replicas field with the baseline instead, so it stays the single
            // source of truth for the idle count (it's copied back to
            // baseline_replicas on submit).
            replicas: initialValues?.scaling_schedule?.enabled
              ? (initialValues.scaling_schedule.baseline_replicas ??
                initialValues.replicas ??
                1)
              : (initialValues?.replicas ?? 1),
            backend_version: initialValues?.backend_version || null,
            max_context_len: initialValues?.max_context_len || 2048
          }}
        >
          <BasicForm
            pdActive={pdEffects.enabled}
            sourceList={sourceList}
            clusterList={clusterList}
            sourceDisable={sourceDisable}
            handleClusterChange={handleClusterChange}
            onClusterSeed={handleClusterSeed}
            onSourceChange={onSourceChange}
          ></BasicForm>
          <CollapsePanel
            activeKey={activeKey}
            accordion={false}
            onChange={handleOnCollapseChange}
            items={[
              // One section for the whole topic: the switch that turns PD on
              // and everything that only exists once it is on. It used to be
              // two places a scroll apart — the switch on a row in Basic Info,
              // the roles in a «角色配置» panel that appeared out of nowhere
              // when you flipped it.
              //
              // ⚠️ The item does NOT react to anything PD itself publishes,
              // and that is load-bearing rather than tidy. `PDDisaggregation
              // variant="toggle"` must never unmount while the section is on
              // screen: its mount effect publishes `enabled` from a first
              // render whose `roles` watch has not resolved — i.e. `false` —
              // so a switch that remounts on every flip turns PD back off the
              // moment you turn it on. Paired with `forceRender`, which keeps
              // the children mounted while the panel is collapsed, that makes
              // this the one place the toggle can live. `forceRender` is
              // separately necessary for the roles: without it their fields
              // register only once the panel is opened, and a group submitted
              // without opening it would carry no roles at all.
              //
              // The engine is the ONE thing it may disappear for, and that
              // remount is harmless in the same way the flip's was not:
              // `handleBackendChange` turns PD off before the engine changes,
              // so `enabled: false` is what the section is coming back to
              // anyway. See `pdEligible`.
              ...(pdEligible
                ? [
                    {
                      key: TABKeysMap.PD,
                      label: intl.formatMessage({
                        id: 'models.form.pd.section'
                      }),
                      forceRender: true,
                      children: (
                        <>
                          <PDDisaggregation
                            variant="toggle"
                            onEffectsChange={handlePDEffectsChange}
                          ></PDDisaggregation>
                          {pdEffects.enabled && (
                            <Roles
                              enabled={pdEffects.enabled}
                              mode={pdEffects.modeData}
                              modeName={pdEffects.mode}
                              // The PD block's body, mounted inside the
                              // group-settings card so «哪条通道 / 最紧到哪一档»
                              // read as one group-wide topic instead of two
                              // sections a scroll apart.
                              pdBody={
                                <PDDisaggregation
                                  variant="body"
                                  // What the switch discarded on the way in.
                                  // Produced by the other instance's handler
                                  // and rendered by this one, so it travels
                                  // through here rather than through state
                                  // neither of them shares.
                                  cacheCleared={pdEffects.cacheCleared}
                                  modeCleared={pdEffects.modeCleared}
                                  // The transport picker is in here, so the
                                  // choice is made here — but the switch above
                                  // owns `enabled`. Only the choice comes back,
                                  // patched onto what the switch published.
                                  onModeChange={(mode, data) =>
                                    setPDEffects((prev) => ({
                                      ...prev,
                                      mode,
                                      modeData: data,
                                      isCustomMode: mode === PD_MODE_CUSTOM,
                                      // Picking one answers the notice.
                                      modeCleared: false
                                    }))
                                  }
                                ></PDDisaggregation>
                              }
                            ></Roles>
                          )}
                        </>
                      )
                    }
                  ]
                : []),
              ...(pdEffects.enabled
                ? []
                : [
                    {
                      key: TABKeysMap.PERFORMANCE,
                      label: intl.formatMessage({
                        id: 'models.form.performance'
                      }),
                      forceRender: true,
                      children: <Performance></Performance>
                    }
                  ]),
              // Gone entirely under PD: every GPU-bearing role carries its own
              // "Resources and scheduling" override, so this card showed the
              // same two fields again and the role card's "Same as model"
              // pointed back at it. The fields are cleared on enable (see
              // `clearModelScheduling`), so "Same as model" now means the
              // defaults — Auto, no selector.
              ...(pdEffects.enabled
                ? []
                : [
                    {
                      key: TABKeysMap.SCHEDULING,
                      label: intl.formatMessage({
                        id: 'models.form.scheduling'
                      }),
                      forceRender: true,
                      children: (
                        <>
                          <ScheduleTypeForm></ScheduleTypeForm>
                          <ScheduledScalingForm></ScheduledScalingForm>
                        </>
                      )
                    }
                  ]),
              {
                key: TABKeysMap.ADVANCED,
                label: intl.formatMessage({ id: 'resources.form.advanced' }),
                forceRender: true,
                children: <AdvanceConfig pdActive={pdEffects.enabled} />
              }
            ]}
          ></CollapsePanel>
        </Form>
      </ScrollSpyTabs>
    </FormContext.Provider>
  );
});

export default DataForm;
