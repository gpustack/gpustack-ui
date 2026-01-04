import { getRequestId } from '@/atoms/models';
import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { PageActionType } from '@/config/types';
import useDeferredRequest from '@/hooks/use-deferred-request';
import { ClusterStatusValueMap } from '@/pages/cluster-management/config';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Button } from 'antd';
import _ from 'lodash';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import ColumnWrapper from '../../_components/column-wrapper';
import { defaultFormValues, DeployFormKeyMap, modelSourceMap } from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { FormData, SourceType } from '../config/types';
import DataForm from '../forms';
import {
  MessageStatus,
  useCheckCompatibility,
  useSelectModel,
  WarningStausOptions
} from '../hooks';
import useCheckBackend from '../hooks/use-check-backend';
import CompatibilityAlert from './compatible-alert';
import HFModelFile from './hf-model-file';
import ModelCard from './model-card';
import SearchModel from './search-model';
import Separator from './separator';
import TitleWrapper from './title-wrapper';

const pickFieldsFromSpec = ['backend_version', 'backend_parameters', 'env'];
const dropFieldsFromForm = [
  'name',
  'huggingface_filename',
  'model_scope_file_path',
  'model_scope_model_id',
  'huggingface_repo_id',
  'backend'
];
const resetFields = ['worker_selector', 'env'];

const ModalFooterStyle = {
  padding: '16px 24px 8px',
  display: 'flex',
  justifyContent: 'flex-end'
};

const Container = styled.div`
  display: flex;
  height: 100%;
`;

const ColWrapper = styled.div`
  display: flex;
  flex: 1;
  max-width: 33.33%;
`;

const FormWrapper = styled.div`
  display: flex;
  flex: 1;
  maxwidth: 100%;
`;

type AddModalProps = {
  title: string;
  hasLinuxWorker?: boolean;
  action: PageActionType;
  open: boolean;
  source: SourceType;
  isGGUF?: boolean;
  width?: string | number;
  initialValues?: any;
  deploymentType?: 'modelList' | 'modelFiles';
  clusterList: Global.BaseOption<
    number,
    { provider: string; state: string | number; is_default: boolean }
  >[];
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

type EvaluateProccessType = 'model' | 'file' | 'form';

const EvaluateProccess: Record<string, EvaluateProccessType> = {
  model: 'model',
  file: 'file',
  form: 'form'
};

const AddModal: FC<AddModalProps> = (props) => {
  const {
    title,
    open,
    onOk,
    onCancel,
    hasLinuxWorker,
    source,
    action,
    width = 600,
    deploymentType = 'modelList',
    initialValues,
    clusterList
  } = props || {};
  const SEARCH_SOURCE = [
    modelSourceMap.huggingface_value,
    modelSourceMap.modelscope_value
  ];

  const { checkOnlyAscendNPU } = useCheckBackend();
  const {
    setWarningStatus,
    handleBackendChangeBefore,
    cancelEvaluate,
    unlockWarningStatus,
    handleOnValuesChange: handleOnValuesChangeBefore,
    clearCacheFormValues,
    warningStatus,
    submitAnyway
  } = useCheckCompatibility();
  const { onSelectModel } = useSelectModel({ gpuOptions: [] });
  const form = useRef<any>({});
  const intl = useIntl();
  const [selectedModel, setSelectedModel] = useState<any>({});
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isGGUF, setIsGGUF] = useState<boolean>(false);
  const modelFileRef = useRef<any>(null);
  const evaluateStateRef = useRef<{
    state: EvaluateProccessType;
    requestModelId: number;
  }>({
    state: 'form',
    requestModelId: 0
  });
  const requestModelIdRef = useRef<number>(0);
  const currentSelectedModel = useRef<any>({});

  const { run: fetchModelFiles } = useDeferredRequest(
    () => modelFileRef.current?.fetchModelFiles?.(),
    100
  );

  const updateSelectedModel = (model: any) => {
    currentSelectedModel.current = model;
    setSelectedModel(model);
  };

  /**
   * Update the request model id to distinguish
   * the evaluate request.
   */
  const updateRequestModelId = () => {
    requestModelIdRef.current += 1;
    return requestModelIdRef.current;
  };

  /**
   *
   * @param state target to distinguish the evaluate state, current evaluate state
   *              can be 'model', 'file' or 'form'.
   */
  const setEvaluteState = (state: {
    state: EvaluateProccessType;
    requestModelId: number;
  }) => {
    evaluateStateRef.current = state;
  };

  const handleOnValuesChange = (data: {
    changedValues: any;
    allValues: any;
    source: SourceType;
  }) => {
    setEvaluteState({
      state: EvaluateProccess.form,
      requestModelId: updateRequestModelId()
    });
    handleOnValuesChangeBefore(data);
  };

  const getDefaultSpec = (item: any) => {
    const defaultSpec = _.pick(
      item.evaluateResult?.default_spec,
      pickFieldsFromSpec
    );

    return defaultSpec;
  };

  const getCategory = (item: any) => {
    const categories = item.evaluateResult?.default_spec?.categories || [];
    if (Array.isArray(categories)) {
      return categories?.[0] || null;
    }
    return categories || null;
  };

  const { run: onClickModel } = useDeferredRequest(async () => {
    const allValues = form.current?.form?.getFieldsValue?.();

    handleOnValuesChangeBefore({
      changedValues: {},
      allValues: allValues,
      source: props.source
    });
  }, 100);

  const { run: onSelectFile } = useDeferredRequest(
    async (item: any, modelInfo: any, manual?: boolean) => {
      unlockWarningStatus();

      const evaluateRes = await handleOnValuesChangeBefore?.({
        changedValues: {},
        allValues: form.current?.form?.getFieldsValue?.(),
        source: props.source
      });
      console.log('onSelectFile:', item, modelInfo, evaluateRes);

      // for cancel evaluate request case
      if (!evaluateRes) {
        return;
      }

      const defaultSpec = getDefaultSpec({
        evaluateResult: evaluateRes
      });

      /**
       * do not reset backend_parameters when select a model file
       */
      const formValues = form.current?.getFieldsValue?.(pickFieldsFromSpec);

      form.current?.setFieldsValue?.({
        ..._.omit(modelInfo, ['name']),
        huggingface_filename: item.fakeName,
        model_scope_file_path: item.fakeName,
        backend_parameters:
          formValues.backend_parameters?.length > 0
            ? formValues.backend_parameters
            : defaultSpec.backend_parameters || [],
        backend_version:
          formValues.backend_version || defaultSpec.backend_version,
        env: formValues.env || defaultSpec.env,
        categories: getCategory(item)
      });
    },
    100
  );

  const handleSelectModelFile = async (
    item: any,
    options: { requestModelId: number; manual?: boolean }
  ) => {
    const { requestModelId, manual } = options || {};
    if (requestModelId !== getRequestId()) {
      return;
    }

    const modelInfo = onSelectModel(selectedModel, {
      source: props.source,
      defaultBackend: form.current?.getFieldValue?.('backend')
    });

    form.current?.setFieldsValue?.({
      ..._.omit(modelInfo, ['name']),
      huggingface_filename: item.fakeName,
      model_scope_file_path: item.fakeName,
      backend_parameters: [],
      backend_version: '',
      backend: modelInfo.backend,
      env: {},
      categories: getCategory(item)
    });

    // evaluate the form data when select a model file
    // TODO: reset backend related fields when select a GGUF file
    if (item.fakeName) {
      onSelectFile(item, modelInfo, manual);
    }
  };

  const handleCancelFiles = () => {
    cancelEvaluate();
    modelFileRef.current?.cancelRequest();
  };

  const generateNameValue = (
    item: any,
    modelName: string,
    manual?: boolean
  ) => {
    if (item.name === currentSelectedModel.current.name) {
      return manual ? modelName : form.current?.getFieldValue?.('name');
    }
    return modelName;
  };

  const currentModelDuringEvaluate = (item: any) => {
    return (
      evaluateStateRef.current.state === EvaluateProccess.form &&
      item.name === currentSelectedModel.current.name
    );
  };

  const handleOnSelectModel = async (item: any, manual?: boolean) => {
    // If the item is empty or the same as the selected model, do nothing

    handleCancelFiles();
    if (
      _.isEmpty(item) ||
      (item.isGGUF === selectedModel.isGGUF && item.name === selectedModel.name)
    ) {
      return;
    }
    console.log('handleOnSelectModel:', item, selectedModel);
    setIsGGUF(item.isGGUF);
    clearCacheFormValues();
    unlockWarningStatus();
    setEvaluteState({
      state: EvaluateProccess.model,
      requestModelId: updateRequestModelId()
    });
    updateSelectedModel(item);

    // TODO
    form.current?.resetFields(resetFields);
    const modelInfo = onSelectModel(item, {
      source: props.source
    });
    form.current?.setFieldsValue?.({
      ...defaultFormValues,
      ...modelInfo,
      categories: getCategory(item)
    });

    console.log('modelInfo:', modelInfo);

    let warningStatus: MessageStatus = {
      show: true,
      title: '',
      type: 'transition',
      message: intl.formatMessage({ id: 'models.form.evaluating' })
    };

    if (item.isGGUF) {
      fetchModelFiles();
    }
    setWarningStatus(warningStatus, { override: true });
  };

  const handleOnSelectModelAfterEvaluate = (item: any, manual?: boolean) => {
    if (currentModelDuringEvaluate(item)) {
      return;
    }

    if (manual) {
      form.current?.resetFields(resetFields);
    }
    // If the item is empty
    setIsGGUF(item.isGGUF);
    updateSelectedModel(item);
    setEvaluteState({
      state: EvaluateProccess.model,
      requestModelId: updateRequestModelId()
    });
    handleCancelFiles();
    const modelInfo = onSelectModel(item, {
      source: props.source
    });

    if (
      evaluateStateRef.current.state === EvaluateProccess.model &&
      item.evaluated
    ) {
      const newFormValues = {
        ...(manual
          ? { ...defaultFormValues }
          : _.omit(form.current?.form?.getFieldsValue?.(), [
              ...dropFieldsFromForm
            ])),
        ...getDefaultSpec(item),
        ...modelInfo,
        name: generateNameValue(item, modelInfo.name, manual),
        categories: getCategory(item)
      };

      form.current?.form?.setFieldsValue?.(newFormValues);

      onClickModel();
    }
  };

  const handleOnOk = async (allValues: FormData) => {
    onOk(allValues);
  };

  const handleSubmitAnyway = async () => {
    submitAnyway.current = true;
    form.current?.submit?.();
  };

  const handleSumit = () => {
    form.current?.submit?.();
  };

  const handleSetIsGGUF = async (flag: boolean) => {
    console.log('isgguf==================>', flag);
    setIsGGUF(flag);
  };

  const handleBackendChange = async (backend: string) => {
    console.log('handleBackendChange:', backend);
    const data = form.current.form.getFieldsValue?.();
    const res = handleBackendChangeBefore(data);
    if (res.show) {
      return;
    }

    // TODO: confirm gguf change backend behavior
    handleOnValuesChange?.({
      changedValues: {},
      allValues: data,
      source: props.source
    });
  };

  const onValuesChange = async (changedValues: any, allValues: any) => {
    handleOnValuesChange?.({
      changedValues,
      allValues,
      source: props.source
    });
  };

  const handleCancel = useMemoizedFn(() => {
    onCancel?.();
  });

  const initClusterId = () => {
    if (initialValues?.cluster_id) {
      return initialValues.cluster_id;
    }
    // Find default cluster
    const defaultCluster = clusterList?.find((item) => item.is_default);
    if (defaultCluster) {
      return defaultCluster.value;
    }

    const cluster_id =
      clusterList?.find((item) => item.state === ClusterStatusValueMap.Ready)
        ?.value || clusterList?.[0]?.value;

    return cluster_id;
  };

  const handleOnOpen = async () => {
    const [backendOptions, gpuOptions] = await Promise.all([
      form.current?.getBackendOptions?.({
        cluster_id: initClusterId()
      }),
      form.current?.getGPUOptionList?.({
        clusterId: initClusterId()
      })
    ]);

    if (props.deploymentType === 'modelFiles') {
      form.current?.form?.setFieldsValue({
        ...props.initialValues
      });
      handleOnValuesChange?.({
        changedValues: {},
        allValues: form.current?.form?.getFieldsValue(),
        source: source
      });
    } else {
      let backend = checkOnlyAscendNPU(gpuOptions)
        ? backendOptionsMap.ascendMindie
        : backendOptionsMap.vllm;

      const currentDefaultBackend = backendOptions?.find(
        (item: {
          value: string;
          label: string;
          default_backend_param: string[];
          default_version: string;
          versions: { label: string; value: string }[];
        }) => item.value === backend
      );
      form.current?.setFieldsValue?.({
        backend,
        default_version: currentDefaultBackend?.default_version,
        backend_parameters: currentDefaultBackend?.default_backend_param || [],
        cluster_id: initClusterId()
      });
    }
  };

  const showExtraButton = useMemo(() => {
    return warningStatus.show && warningStatus.type !== 'success';
  }, [warningStatus.show, warningStatus.type]);

  // This is only a placeholder for querying the model or file during the transition period.
  const displayEvaluateStatus = (
    params: MessageStatus,
    options?: WarningStausOptions
  ) => {
    setWarningStatus(
      {
        show: params.show,
        title: '',
        type: 'transition',
        message: intl.formatMessage({ id: 'models.form.evaluating' })
      },
      options
    );
  };

  useEffect(() => {
    if (open) {
      handleOnOpen();
    } else {
      cancelEvaluate();
      clearCacheFormValues();
    }
    return () => {
      setSelectedModel({});
      setWarningStatus({
        show: false,
        title: '',
        message: []
      });
    };
  }, [open, clusterList, initialValues?.cluster_id]);

  return (
    <GSDrawer
      title={title}
      open={open}
      onClose={handleCancel}
      destroyOnHidden={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      styles={{
        wrapper: { width: width }
      }}
      footer={false}
    >
      <Container>
        {SEARCH_SOURCE.includes(props.source) &&
          deploymentType === 'modelList' && (
            <>
              <ColWrapper>
                <SearchModel
                  hasLinuxWorker={hasLinuxWorker}
                  modelSource={props.source}
                  onSelectModel={handleOnSelectModel}
                  onSelectModelAfterEvaluate={handleOnSelectModelAfterEvaluate}
                  clusterId={
                    form.current?.getFieldValue?.('cluster_id') ||
                    initClusterId()
                  }
                  displayEvaluateStatus={displayEvaluateStatus}
                  gpuOptions={[]}
                ></SearchModel>
                <Separator></Separator>
              </ColWrapper>
              <ColWrapper>
                <ColumnWrapper styles={{ container: { padding: 0 } }}>
                  <ModelCard
                    selectedModel={selectedModel}
                    onCollapse={setCollapsed}
                    collapsed={collapsed}
                    modelSource={props.source}
                    setIsGGUF={handleSetIsGGUF}
                  ></ModelCard>
                  {isGGUF && (
                    <HFModelFile
                      ref={modelFileRef}
                      selectedModel={selectedModel}
                      modelSource={props.source}
                      onSelectFile={handleSelectModelFile}
                      collapsed={collapsed}
                    ></HFModelFile>
                  )}
                </ColumnWrapper>
                <Separator></Separator>
              </ColWrapper>
            </>
          )}
        <FormWrapper>
          <ColumnWrapper
            styles={{
              container: { paddingBlock: 0 }
            }}
            footer={
              <>
                <CompatibilityAlert
                  showClose={true}
                  onClose={() => {
                    setWarningStatus({
                      show: false,
                      message: ''
                    });
                  }}
                  warningStatus={warningStatus}
                  contentStyle={{ paddingInline: '0 6px' }}
                ></CompatibilityAlert>
                <ModalFooter
                  onCancel={handleCancel}
                  onOk={handleSumit}
                  showOkBtn={!showExtraButton}
                  extra={
                    showExtraButton && (
                      <Button type="primary" onClick={handleSubmitAnyway}>
                        {intl.formatMessage({
                          id: 'models.form.submit.anyway'
                        })}
                      </Button>
                    )
                  }
                  style={ModalFooterStyle}
                ></ModalFooter>
              </>
            }
          >
            <>
              {SEARCH_SOURCE.includes(source) &&
                deploymentType === 'modelList' && (
                  <TitleWrapper>
                    {intl.formatMessage({ id: 'models.form.configurations' })}
                  </TitleWrapper>
                )}
              <DataForm
                formKey={DeployFormKeyMap.DEPLOYMENT}
                initialValues={initialValues}
                source={source}
                action={action}
                clusterList={clusterList}
                onOk={handleOnOk}
                ref={form}
                isGGUF={isGGUF}
                onBackendChange={handleBackendChange}
                onValuesChange={onValuesChange}
                clearCacheFormValues={clearCacheFormValues}
              ></DataForm>
            </>
          </ColumnWrapper>
        </FormWrapper>
      </Container>
    </GSDrawer>
  );
};

export default AddModal;
