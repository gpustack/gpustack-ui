import { clusterListAtom, workerListAtom } from '@/atoms/models';
import { queryModelFilesList } from '@/pages/resources/apis';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { convertFileSize } from '@/utils';
import { createAxiosToken } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useAtomValue } from 'jotai';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { evaluationsModelSpec } from '../apis';
import { modelSourceMap, modelTaskMap, RoleLabelMap } from '../config';
import {
  EvaluateResult,
  FormData,
  RoleResourceClaim,
  RoleResourceDemand
} from '../config/types';
import {
  backendOptionsMap,
  BuiltInBackendOptions
} from '../constants/backend-parameters';
import { rolesFormToPayload } from '../forms/roles/transform';
import { derivesNativeAnthropicApi, generateGPUIds } from '../utils';
import useCheckBackend from './use-check-backend';
import useRecognizeAudio from './use-recognize-audio';

export type MessageStatus = {
  show: boolean;
  title?: string;
  type?: Global.MessageType;
  isHtml?: boolean;
  isDefault?: boolean;
  message: string | string[];
  evaluateResult?: EvaluateResult;
};

export interface ModelFileOption {
  label: string;
  value: number;
  labels?: Record<string, string>;
  parent: boolean;
  repoId?: string;
  fileName?: string;
  [key: string]: any;
  children?: ModelFileOption[];
}

export type WarningStausOptions = {
  lockAfterUpdate?: boolean;
  override?: boolean;
};

export const useGenerateWorkersModelFileOptions = () => {
  const [modelFileOptions, setModelFileOptions] = useState<ModelFileOption[]>(
    []
  );

  const getModelFileList = async () => {
    try {
      const res = await queryModelFilesList({ page: -1 });
      const list = res.items || [];
      return list;
    } catch (error) {
      console.error('Error fetching model file list:', error);
      return [];
    }
  };

  const generateWorkersModelFileOptions = (list: any[], workerList: any[]) => {
    const workerFields = new Set(['name', 'id', 'ip', 'status']);
    const workersMap = new Map<number, WorkerListItem>();

    for (const item of workerList) {
      if (!workersMap.has(item.id)) {
        workersMap.set(item.id, item);
      }
    }

    const result = Array.from(workersMap.values()).map((worker) => ({
      label: worker.name,
      value: worker.id,
      labels: worker.labels,
      parent: true,
      children: list
        .filter(
          (item) =>
            item.worker_id === worker.id && !!item.resolved_paths?.length
        )
        .map((item) => {
          return {
            label: item.resolved_paths[0] || '',
            value: item.resolved_paths[0] || '',
            parent: false,
            repoId: item.huggingface_repo_id || item.model_scope_model_id || '',
            fileName:
              item.huggingface_filename ||
              item.model_scope_file_path ||
              item.local_path ||
              '',
            ...item
          };
        }),
      ...Object.fromEntries(
        Object.entries(worker).filter(([key]) => workerFields.has(key))
      )
    }));

    const childrenList = result.reduce((acc: any[], cur) => {
      if (cur.children) {
        const list = cur.children.map((child: any) => ({
          ...child,
          label: `${cur.label}${child.label}`,
          value: child.value
        }));
        acc.push(...list);
      }
      return acc;
    }, []);

    setModelFileOptions(result);

    return childrenList;
  };

  return {
    getModelFileList,
    modelFileOptions,
    generateWorkersModelFileOptions
  };
};

export const useCheckCompatibility = () => {
  const intl = useIntl();
  const cacheFormValuesRef = useRef<any>({});
  const checkTokenRef = useRef<any>(null);
  const submitAnyway = useRef<boolean>(false);
  const requestIdRef = useRef(0);
  const updateStatusTimer = useRef<any>(null);
  const isLockWarningStatus = useRef<boolean>(false);
  const clusterList = useAtomValue(clusterListAtom);
  const workerList = useAtomValue(workerListAtom);
  const [warningStatus, setWarningStatus] = useState<MessageStatus>({
    show: false,
    title: '',
    message: []
  });

  const updateRequestId = () => {
    requestIdRef.current += 1;
    return requestIdRef.current;
  };

  const lockWarningStatus = () => {
    isLockWarningStatus.current = true;
  };

  const unlockWarningStatus = () => {
    isLockWarningStatus.current = false;
  };

  const updateWarningStatus = (
    params: MessageStatus,
    options?: WarningStausOptions
  ) => {
    const { lockAfterUpdate = false, override = false } = options || {};
    setWarningStatus((prev: MessageStatus) => {
      if (isLockWarningStatus.current && !override) {
        return prev;
      }

      if (lockAfterUpdate) {
        lockWarningStatus();
      }

      return params;
    });
  };

  // A slice request is only valid as a pair, and the API is specific about
  // which halves it accepts (GPUTypeSelector.normalize_slice_percentages):
  // memory must be 1-100, while cores may be absent — it defaults to 100 —
  // but not an explicit 0. Anything else is not a smaller request, it is an
  // unparseable one. So leave a request the API would accept (or a partition
  // profile) untouched, and reduce the rest to the whole-card pair it
  // normalizes an all-zero selector to, which costs a half-typed selector
  // nothing. Leaving an absent cores percentage absent matters: forcing it to
  // a pair here would evaluate a whole card for a request the API reads as
  // memory% / 100%.
  const normalizeSelectorForEvaluate = (selector: any) => {
    if (selector.accelerator_partitioned_profile) {
      return selector;
    }
    const cores = selector.accelerator_sliced_cores_percentage;
    const coresSet = cores !== null && cores !== undefined && cores !== '';
    const memorySliced =
      _.toNumber(selector.accelerator_sliced_memory_percentage) > 0;
    if (memorySliced && (!coresSet || _.toNumber(cores) > 0)) {
      return selector;
    }
    return {
      ...selector,
      accelerator_sliced_memory_percentage: 0,
      accelerator_sliced_cores_percentage: 0
    };
  };

  const handleEvaluate = async (data: any) => {
    try {
      // when no cluster selected, show warning and prompt user to add cluster first
      console.log('handleEvaluate', data);

      if (!data.cluster_id || workerList.length === 0) {
        setWarningStatus({
          show: true,
          title: '',
          type: 'warning',
          message: !data.cluster_id
            ? intl.formatMessage({ id: 'noresult.resources.cluster' })
            : intl.formatMessage({ id: 'noresult.resources.worker' })
        });
        return;
      }
      checkTokenRef.current?.cancel();
      checkTokenRef.current = createAxiosToken();
      setWarningStatus({
        show: true,
        title: '',
        type: 'transition',
        message: intl.formatMessage({ id: 'models.form.evaluating' })
      });
      const evalution = await evaluationsModelSpec(
        {
          cluster_id: data.cluster_id,
          model_specs: [
            {
              // scaling_schedule has no bearing on resource/compatibility
              // evaluation; drop it so in-progress (possibly incomplete) rules
              // never fail the evaluate request.
              ..._.omit(data, [
                'scheduleType',
                'manualGpuMode',
                'scaling_schedule',
                // Assembled below instead of passed through: a role is held in
                // FORM shape — the override switches, the router's managed
                // flag, and GPU ids still in the cascader's [worker, gpu]
                // pairs — which the API's `List[str]` rejects outright, so
                // sending it raw 422s the whole evaluation.
                'roles'
              ]),
              // 🔴 The roles are what make this a PD evaluation, and they used
              // to be dropped here along with the form-only keys above. With
              // them gone the server had no way to know it was pricing a
              // group, so it answered for ONE instance of the model-level spec
              // — no per-role overrides, no x+y replicas, no router, and no
              // check that prefill and decode fit together. A 4P4D deployment
              // therefore read like a single replica.
              //
              // `rolesFormToPayload` is the same transform submit runs, so
              // what is evaluated is what would be deployed. `data` is passed
              // as the model-level values because the transform demotes a role
              // whose every field still equals the model's back to inheriting.
              //
              // `disaggregation` travels with them and is nulled without
              // them: it is already in wire shape, but a form that had PD
              // turned back off still carries the last recipe, and sending
              // that alone would have the server narrow the eligible
              // accelerators for a deployment that is no longer a group.
              //
              // 🔴 And nulled while it has no `mode`, which is a state the
              // form passes through every single time PD is switched on: the
              // roles are seeded synchronously and the recipe is resolved by
              // a request, so between the two there is a `disaggregation` of
              // `{}`. `mode` is required on the wire, so sending that empty
              // object 422s the whole evaluation — the panel reads "评估失败"
              // at the very moment the user turned the feature on.
              //
              // Null is not a workaround here, it is the honest answer: with
              // no recipe there is nothing to narrow the placement by, and
              // the roles alone are enough to price the group. The next
              // evaluation — the resolution itself triggers one — carries the
              // recipe.
              ...(data.roles?.length
                ? {
                    roles: rolesFormToPayload(data.roles, data),
                    disaggregation: data.disaggregation?.mode
                      ? data.disaggregation
                      : null
                  }
                : { roles: null, disaggregation: null }),
              // Same reasoning for the vGPU selector, which the form walks
              // through an incomplete state on every GPU-type switch: the new
              // type's capacity may not admit the percentage the previous one
              // carried, leaving a cores percentage without a memory one,
              // which the API rejects outright (GpuTypeSelector rejects a
              // sliced request whose memory percentage is not 1-100). The
              // whole evaluation would 422 on a half-typed request and surface
              // as an error toast, so evaluate the equivalent whole-card
              // request instead.
              ...(data.gpu_type_selector
                ? {
                    gpu_type_selector: normalizeSelectorForEvaluate(
                      data.gpu_type_selector
                    )
                  }
                : {}),
              categories: Array.isArray(data.categories)
                ? data.categories
                : data.categories
                  ? [data.categories]
                  : []
            }
          ]
        },
        {
          token: checkTokenRef.current.token
        }
      );
      return evalution.results?.[0];
    } catch (error) {
      return null;
    }
  };

  const getAvailableClusters = (ids: string[]) => {
    const clusterNames: string[] = [];
    clusterList.forEach?.((item: { value: number; label: string }) => {
      if (ids.includes(item.value.toString())) {
        clusterNames.push(item.label);
      }
    });
    return clusterNames.join(', ');
  };

  /**
   * One line of a PD group's breakdown.
   *
   * Three shapes, and the difference between them is what the number means:
   * a role whose members all size the same reports what ONE costs (the useful
   * figure when you are deciding a replica count), a role whose members differ
   * — two accelerator types under one role — can only report the total, and a
   * role that holds no weights reports memory because it claims no card.
   */
  const formatRoleClaim = (claim: RoleResourceClaim) => {
    // A role the UI has no label for is shown under the name the API used —
    // phase two opens up encoder / draft, and an unlabelled role must still
    // appear in the breakdown rather than as an empty line.
    const labelId = RoleLabelMap[claim.role as keyof typeof RoleLabelMap];
    const values = {
      role: labelId ? intl.formatMessage({ id: labelId }) : claim.role,
      replicas: claim.replicas
    };

    if (!claim.vram) {
      return intl.formatMessage(
        { id: 'models.form.check.claims.role.ram' },
        { ...values, ram: convertFileSize(claim.ram || 0, 2) }
      );
    }
    return claim.per_replica
      ? intl.formatMessage(
          { id: 'models.form.check.claims.role' },
          { ...values, vram: convertFileSize(claim.per_replica.vram, 2) }
        )
      : intl.formatMessage(
          { id: 'models.form.check.claims.role.total' },
          { ...values, vram: convertFileSize(claim.vram, 2) }
        );
  };

  /**
   * A refused group's breakdown, in English whatever the form's locale.
   *
   * 🔴 Deliberately not `intl.formatMessage`, and this is the one place in
   * the form where that is right.
   *
   * These lines are prepended to the scheduler's own account, and that account
   * is English prose assembled server-side — `group_solver`'s verdict, the
   * worker filters' "Matched n workers by …", each selector's dashed list —
   * none of which this form can translate. Localizing only the lines we happen
   * to own produced one block in two languages, which reads worse than a block
   * in one language the reader may not speak: a refusal is diagnostic text
   * that gets pasted into an issue, and half-translating it breaks both the
   * reading and the search.
   *
   * So they match their neighbours instead. The day the server sends a code
   * and parameters the way `PDModeUnresolvedCode` already does for the
   * transport picker, the whole block becomes translatable at once and these
   * move into the message catalog with the rest of it — not before, because
   * until then every translated line here is a line out of step.
   */
  const roleName = (role: string) =>
    role ? role.charAt(0).toUpperCase() + role.slice(1) : role;

  /**
   * One line of a refused group's breakdown.
   *
   * Three shapes, for the same reason `formatRoleClaim` has three: a priced
   * role reports what ONE member costs, a role that holds no weights reports
   * memory because it claims no card, and a role no selector ever priced —
   * no worker was eligible, so none ran — reports the count alone. A
   * fabricated "0 GiB" there would read as a role that costs nothing.
   *
   * The count is per role and measured with nothing else of the group standing
   * in, so roles that each fit alone and do not fit together all read as
   * satisfied. That is the finding rather than a flaw in it, and the
   * scheduler's own lines below say which role the search stopped on.
   */
  const formatRoleDemand = (demand: RoleResourceDemand) => {
    const head = `${roleName(demand.role)} × ${demand.replicas}`;
    const room = `the cluster has room for ${demand.placeable}, measured on its own`;
    if (!demand.per_replica) {
      return `${head}: ${room}`;
    }
    if (!demand.vram) {
      return `${head}: approximately ${convertFileSize(demand.ram || 0, 2)} RAM in total; ${room}`;
    }
    return `${head}: approximately ${convertFileSize(demand.per_replica.vram, 2)} VRAM each; ${room}`;
  };

  /**
   * The group's own total, above its breakdown.
   *
   * Summed here rather than sent as a field of its own: it is the breakdown's
   * total by definition, and a second number from a second source is a second
   * thing that can disagree with it.
   */
  const formatGroupDemand = (demands: RoleResourceDemand[]) => {
    const ramBytes = demands.reduce(
      (sum, demand) => sum + (demand.ram || 0),
      0
    );
    const vramBytes = demands.reduce(
      (sum, demand) => sum + (demand.vram || 0),
      0
    );
    const ram = convertFileSize(ramBytes, 2);
    const vram = convertFileSize(vramBytes, 2);
    if (!ram && !vram) {
      return '';
    }
    if (!ram) {
      return `The group needs approximately ${vram} VRAM in total.`;
    }
    if (!vram) {
      return `The group needs approximately ${ram} RAM in total.`;
    }
    return `The group needs approximately ${vram} VRAM and ${ram} RAM in total.`;
  };

  const handleCheckCompatibility = (
    evaluateResult: EvaluateResult | null
  ): MessageStatus => {
    console.log('handleCheckCompatibility', clusterList, evaluateResult);
    if (!evaluateResult) {
      return {
        show: false,
        message: ''
      };
    }

    const {
      compatible,
      compatibility_messages = [],
      scheduling_messages = [],
      resource_claim_by_cluster_id,
      role_resource_claims_by_cluster_id,
      role_resource_demands_by_cluster_id,
      cluster_id,
      error,
      error_message
    } = evaluateResult || {};

    // error message
    if (error) {
      return {
        show: true,
        type: 'danger',
        message: `${intl.formatMessage({ id: 'models.search.evaluate.error' })}${error_message}`
      };
    }

    const resourceClaimMap = new Map(
      Object.entries(resource_claim_by_cluster_id || {})
    );

    // current cluster resource claim: {ram: number, vram: number}
    const resource_claim = resourceClaimMap.get(`${cluster_id}`);

    const hasClaim = resourceClaimMap.has(`${cluster_id}`);

    let compatibilityMessage = compatibility_messages.join(' ');

    compatibilityMessage = compatibilityMessage.startsWith(
      `The model file path you specified does not exist on the GPUStack server. It's recommended`
    )
      ? intl.formatMessage({ id: 'models.form.modelfile.notfound' })
      : compatibilityMessage;

    /**
     * What the group asked for, above the scheduler's account of why it could
     * not have it.
     *
     * The order is the one an approval reads in — total, then role by role —
     * so the two outcomes of one question look alike. Below it the scheduler
     * says which role the search stopped on and what stood in the way, and
     * these lines are what give those numbers a subject: "the largest worker
     * has 67 GiB" means nothing until something has said a decode member wants
     * 43 of them.
     *
     * English, like everything under it — see `formatRoleDemand`.
     */
    const roleDemands = role_resource_demands_by_cluster_id?.[cluster_id!];
    const demandMessages = roleDemands?.length
      ? [formatGroupDemand(roleDemands), ...roleDemands.map(formatRoleDemand)]
      : [];

    let msgData = {
      title: scheduling_messages?.length > 0 ? compatibilityMessage : '',
      message:
        scheduling_messages?.length > 0
          ? [...demandMessages.filter(Boolean), ...scheduling_messages]
          : compatibilityMessage
    };

    let noResourceClaim = false;

    if (hasClaim) {
      const ram = convertFileSize(resource_claim?.ram || 0, 2);
      const vram = convertFileSize(resource_claim?.vram || 0, 2);
      let messageId = 'models.form.check.claims';
      // when no ram and no vram
      noResourceClaim = !ram && !vram;

      if (!ram) {
        messageId = 'models.form.check.claims2';
      }
      if (!vram) {
        messageId = 'models.form.check.claims3';
      }

      // A PD deployment's claim is the WHOLE group's — every replica of every
      // role plus the router — so it is said differently and broken down by
      // role. Without the breakdown the total is unreadable: "1.25 TiB" tells
      // nobody which role is asking for it, and that is the first question
      // when the group does not fit.
      const roleClaims = role_resource_claims_by_cluster_id?.[cluster_id!];
      msgData = roleClaims?.length
        ? {
            title: intl.formatMessage({ id: 'models.form.check.passed' }),
            message: [
              intl.formatMessage(
                { id: 'models.form.check.claims.group' },
                { ram, vram }
              ),
              ...roleClaims.map(formatRoleClaim)
            ]
          }
        : {
            title: intl.formatMessage({ id: 'models.form.check.passed' }),
            message: intl.formatMessage({ id: messageId }, { ram, vram })
          };
    }

    return {
      show: noResourceClaim ? false : !compatible || hasClaim,
      type: !compatible ? 'warning' : 'success',
      ...msgData
    };
  };

  const handleShowCompatibleAlert = (
    evaluateResult: EvaluateResult | null,
    options?: WarningStausOptions
  ) => {
    const result = handleCheckCompatibility(evaluateResult);
    if (updateStatusTimer.current) {
      clearTimeout(updateStatusTimer.current);
    }
    updateStatusTimer.current = setTimeout(() => {
      updateWarningStatus(result, options);
    }, 300);
  };

  const checkIsGGUFFileOrNotSupport = (localPath: string, allValues?: any) => {
    const isBlobFile = localPath?.split('/').pop()?.includes('sha256');
    const isOllamaModel = localPath?.includes('ollama');
    const isGGUFFile = localPath?.endsWith?.('.gguf');

    const isOllamaModelFile = isBlobFile || isOllamaModel;
    return (
      isGGUFFile ||
      isOllamaModelFile ||
      allValues?.huggingface_filename?.endsWith?.('.gguf') ||
      allValues?.model_scope_file_path?.endsWith?.('.gguf')
    );
  };

  const clearCacheFormValues = () => {
    cacheFormValuesRef.current = {};
  };

  const updateShowWarning = (params: {
    backend: string;
    localPath: string;
    source: string;
  }) => {
    const { backend, localPath, source } = params;
    if (source !== modelSourceMap.local_path_value || !localPath) {
      return {
        show: false,
        message: ''
      };
    }

    const isGGUFFile = checkIsGGUFFileOrNotSupport(localPath);

    let warningMessage = '';
    if (isGGUFFile && BuiltInBackendOptions.includes(backend)) {
      warningMessage = intl.formatMessage({
        id: 'models.form.backend.warning'
      });
    } else if (isGGUFFile && !BuiltInBackendOptions.includes(backend)) {
      warningMessage = '';
    }
    clearCacheFormValues();
    return {
      show: !!warningMessage,
      isHtml: true,
      message: warningMessage
    };
  };

  const handleUpdateWarning = (params: {
    backend: string;
    localPath: string;
    source: string;
  }) => {
    const warningMessage = updateShowWarning(params);
    return warningMessage;
  };

  const handleDoEvalute = async (formData: FormData) => {
    const currentRequestId = updateRequestId();
    const evalutionData = await handleEvaluate(formData);
    if (currentRequestId === requestIdRef.current && evalutionData) {
      handleShowCompatibleAlert?.(evalutionData);
      return evalutionData;
    }
    return null;
  };

  const noLocalPathValue = (allValues: any) => {
    return (
      allValues.source === modelSourceMap.local_path_value &&
      !allValues.local_path
    );
  };

  // Evaluation needs a model reference. The basic form seeds a default cluster
  // on open, which can fire onValuesChange before the user has picked a model —
  // skip evaluation until the current source's model field is filled.
  const noModelSelected = (allValues: any) => {
    switch (allValues.source) {
      case modelSourceMap.huggingface_value:
        return !allValues.huggingface_repo_id;
      case modelSourceMap.modelscope_value:
        return !allValues.model_scope_model_id;
      case modelSourceMap.ollama_library_value:
        return !allValues.ollama_library_model_name;
      case modelSourceMap.local_path_value:
        return !allValues.local_path;
      default:
        return false;
    }
  };

  const handleOnValuesChange = async (params: {
    changedValues: any;
    allValues: any;
    source: string;
  }) => {
    const { allValues, source } = params;
    if (
      _.isEqual(cacheFormValuesRef.current, allValues) ||
      noLocalPathValue(allValues) ||
      noModelSelected(allValues) ||
      !allValues.replicas
    ) {
      console.log('No changes detected, skipping evaluation.');
      return;
    }

    // when custom backend, and no run_command or image_name, skip evaluate
    if (
      backendOptionsMap.custom === allValues.backend &&
      (!allValues.run_command || !allValues.image_name)
    ) {
      setWarningStatus({
        show: false,
        type: 'warning',
        isHtml: true,
        message: ''
      });
      return;
    }

    // check gguf: for online and local path
    if (
      checkIsGGUFFileOrNotSupport(allValues.local_path, allValues) &&
      BuiltInBackendOptions.includes(allValues.backend)
    ) {
      clearCacheFormValues();
      setWarningStatus({
        show: true,
        type: 'warning',
        isHtml: true,
        message: intl.formatMessage({
          id: 'models.form.backend.warning'
        })
      });

      return;
    }

    cacheFormValuesRef.current = _.cloneDeep(allValues);
    const gpuSelector = generateGPUIds(allValues);
    return await handleDoEvalute({
      ...allValues,
      ...gpuSelector,
      replicas: allValues.replicas || 0
    });
  };

  // trigger from local_path change or backend change
  const handleBackendChangeBefore = (params: {
    local_path: string;
    backend: string;
    source: string;
  }) => {
    const { local_path, backend, source } = params;

    const res = handleUpdateWarning?.({
      backend,
      localPath: local_path,
      source: source
    });

    setWarningStatus?.(res);
    return res;
  };

  const cancelEvaluate = () => {
    // update the requestId to cancel the current evaluation
    updateRequestId();
    checkTokenRef.current?.cancel();
    checkTokenRef.current = null;
  };

  useEffect(() => {
    return () => {
      cancelEvaluate();
      clearCacheFormValues();
    };
  }, []);

  return {
    handleShowCompatibleAlert,
    handleUpdateWarning,
    handleDoEvalute,
    handleEvaluate,
    setWarningStatus: updateWarningStatus,
    unlockWarningStatus,
    cancelEvaluate,
    handleBackendChangeBefore,
    handleOnValuesChange: handleOnValuesChange,
    handleEvaluateOnChange: handleOnValuesChange,
    clearCacheFormValues,
    warningStatus,
    checkTokenRef,
    submitAnyway
  };
};

export const useSelectModel = (data: { gpuOptions: any[] }) => {
  const { checkCurrentbackend } = useCheckBackend();
  const { recognizeAudioModel } = useRecognizeAudio();

  // just for setting the model name or repo_id, and the backend, Since the model type is fixed.
  const { gpuOptions } = data;

  const onSelectModel = (
    selectModel: any,
    options: {
      source: string;
      defaultBackend?: string;
      flatBackendOptions?: any[];
    }
  ) => {
    const { source, defaultBackend, flatBackendOptions } = options;
    let name = _.split(selectModel.name, '/').slice(-1)[0];
    const reg = /(-gguf)$/i;
    name = _.toLower(name).replace(reg, '');

    const modelTaskData = recognizeAudioModel(selectModel, source);

    const backend = checkCurrentbackend({
      defaultBackend: defaultBackend || backendOptionsMap.vllm,
      isAudio: modelTaskData.type === modelTaskMap.audio,
      isGGUF: selectModel.isGGUF,
      gpuOptions: gpuOptions
    });

    const selectedBackend = flatBackendOptions?.find(
      (item) => item.value === backend
    );
    console.log('selectedBackend=========', selectedBackend);
    return {
      ...(source === modelSourceMap.huggingface_value
        ? { huggingface_repo_id: selectModel.name }
        : {}),
      ...(source === modelSourceMap.modelscope_value
        ? { model_scope_model_id: selectModel.name }
        : {}),
      ...modelTaskData,
      env: {
        ...(selectedBackend?.default_env || {})
      },
      backend_parameters: [...(selectedBackend?.default_backend_param || [])],
      // Derived here as well as in the backend dropdown's handler: this path
      // writes `backend` straight into the form, so without it the same
      // deployment would answer differently depending on whether the user
      // happened to touch the dropdown.
      native_anthropic_api: derivesNativeAnthropicApi(backend, selectedBackend),
      name: name,
      source: source,
      backend: backend
    };
  };

  return {
    onSelectModel
  };
};
