import { getRequestId } from '@/atoms/models';
import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { PageActionType } from '@/config/types';
import useDeferredRequest from '@/hooks/use-deferred-request';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import _ from 'lodash';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  backendOptionsMap,
  defaultFormValues,
  getSourceRepoConfigValue,
  modelSourceMap
} from '../config';
import { FormContext } from '../config/form-context';
import { FormData, SourceType } from '../config/types';
import {
  MessageStatus,
  WarningStausOptions,
  checkOnlyAscendNPU,
  useCheckCompatibility,
  useSelectModel
} from '../hooks';
import ColumnWrapper from './column-wrapper';
import CompatibilityAlert from './compatible-alert';
import DataForm from './data-form';
import HFModelFile from './hf-model-file';
import ModelCard from './model-card';
import SearchModel from './search-model';
import Separator from './separator';
import TitleWrapper from './title-wrapper';

const resetFieldsByModel = ['backend_version', 'backend_parameters', 'env'];
const pickFieldsFromSpec = ['backend_version', 'backend_parameters', 'env'];
const dropFieldsFromForm = ['name', 'file_name', 'repo_id', 'backend'];
const resetFields = ['worker_selector', 'env'];

const resetFieldsByFile = [
  'cpu_offloading',
  'distributed_inference_across_workers'
];

const ModalFooterStyle = {
  padding: '16px 24px',
  display: 'flex',
  justifyContent: 'flex-end'
};

const ColWrapper = styled.div`
  display: flex;
  flex: 1;
  maxwidth: 33.33%;
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
  gpuOptions: any[];
  modelFileOptions: any[];
  initialValues?: any;
  deploymentType?: 'modelList' | 'modelFiles';
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
    initialValues
  } = props || {};
  const SEARCH_SOURCE = [
    modelSourceMap.huggingface_value,
    modelSourceMap.modelscope_value
  ];

  const {
    handleShowCompatibleAlert,
    setWarningStatus,
    handleBackendChangeBefore,
    cancelEvaluate,
    unlockWarningStatus,
    handleOnValuesChange: handleOnValuesChangeBefore,
    clearCahceFormValues,
    warningStatus,
    submitAnyway
  } = useCheckCompatibility();
  const { onSelectModel } = useSelectModel({ gpuOptions: props.gpuOptions });
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

  const updateEvaluateState = (state: EvaluateProccessType) => {
    const currentRequestModelId = evaluateStateRef.current.requestModelId;
    setEvaluteState({
      ...evaluateStateRef.current,
      state
    });
    return currentRequestModelId;
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
        file_name: item.fakeName,
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
    console.log('handleSelectModelFile:', item, selectedModel);

    const modelInfo = onSelectModel(selectedModel, props.source);

    form.current?.setFieldsValue?.({
      ..._.omit(modelInfo, ['name']),
      file_name: item.fakeName,
      categories: getCategory(item)
    });

    // evaluate the form data when select a model file
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
    console.log('isgguf==================> select 1', item.isGGUF);
    console.log('handleOnSelectModel:', item, selectedModel);
    setIsGGUF(item.isGGUF);
    clearCahceFormValues();
    unlockWarningStatus();
    setEvaluteState({
      state: EvaluateProccess.model,
      requestModelId: updateRequestModelId()
    });
    updateSelectedModel(item);

    // TODO
    form.current?.resetFields(resetFields);
    const modelInfo = onSelectModel(item, props.source);
    form.current?.setFieldsValue?.({
      ...defaultFormValues,
      ...modelInfo,
      categories: getCategory(item)
    });

    setWarningStatus(
      {
        show: true,
        title: '',
        type: 'transition',
        message: intl.formatMessage({ id: 'models.form.evaluating' })
      },
      {
        override: true
      }
    );

    if (item.isGGUF) {
      fetchModelFiles();
    }
  };

  const handleOnSelectModelAfterEvaluate = (item: any, manual?: boolean) => {
    if (currentModelDuringEvaluate(item)) {
      return;
    }

    if (manual) {
      form.current?.resetFields(resetFields);
    }
    console.log('isgguf==================> select 2', item.isGGUF);
    // If the item is empty
    setIsGGUF(item.isGGUF);
    updateSelectedModel(item);
    setEvaluteState({
      state: EvaluateProccess.model,
      requestModelId: updateRequestModelId()
    });
    handleCancelFiles();
    const modelInfo = onSelectModel(item, props.source);

    if (
      evaluateStateRef.current.state === EvaluateProccess.model &&
      item.evaluated
    ) {
      handleShowCompatibleAlert(item.evaluateResult);

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

      console.log('newFormValues:', newFormValues);

      form.current?.form?.setFieldsValue?.(newFormValues);

      handleOnValuesChangeBefore({
        changedValues: {},
        allValues: newFormValues,
        source: props.source
      });
    }
  };

  const handleOnOk = async (allValues: FormData) => {
    const result = getSourceRepoConfigValue(props.source, allValues).values;
    onOk(result);
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
    if (backend === backendOptionsMap.llamaBox) {
      setIsGGUF(true);
    } else {
      setIsGGUF(false);
    }

    const data = form.current.form.getFieldsValue?.();
    const res = handleBackendChangeBefore(data);
    if (res.show) {
      return;
    }
    if (data.local_path || props.source !== modelSourceMap.local_path_value) {
      handleOnValuesChange?.({
        changedValues: {},
        allValues:
          backend === backendOptionsMap.llamaBox
            ? data
            : _.omit(data, [
                'cpu_offloading',
                'distributed_inference_across_workers'
              ]),
        source: props.source
      });
    }
  };

  const onValuesChange = async (changedValues: any, allValues: any) => {
    handleOnValuesChange?.({
      changedValues,
      allValues,
      source: props.source
    });
  };

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleOnOpen = () => {
    if (props.deploymentType === 'modelFiles') {
      form.current?.form?.setFieldsValue({
        ...props.initialValues
      });
      handleOnValuesChange?.({
        changedValues: {},
        allValues: props.initialValues,
        source: source
      });
    } else {
      let backend = checkOnlyAscendNPU(props.gpuOptions)
        ? backendOptionsMap.ascendMindie
        : backendOptionsMap.vllm;

      form.current?.setFieldValue?.('backend', backend);
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
      clearCahceFormValues();
    }
    return () => {
      setSelectedModel({});
      setWarningStatus({
        show: false,
        title: '',
        message: []
      });
    };
  }, [open, props.gpuOptions.length]);

  return (
    <GSDrawer
      title={
        <div className="flex-between flex-center">
          <span>{title}</span>
          <Button type="text" size="small" onClick={handleCancel}>
            <CloseOutlined></CloseOutlined>
          </Button>
        </div>
      }
      open={open}
      onClose={handleCancel}
      destroyOnClose={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      zIndex={2000}
      styles={{
        body: {
          height: 'calc(100vh - 57px)',
          padding: '16px 0',
          overflowX: 'hidden'
        },
        content: {
          borderRadius: '6px 0 0 6px'
        }
      }}
      width={width}
      footer={false}
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {SEARCH_SOURCE.includes(props.source) &&
          deploymentType === 'modelList' && (
            <>
              <ColWrapper>
                <ColumnWrapper>
                  <SearchModel
                    hasLinuxWorker={hasLinuxWorker}
                    modelSource={props.source}
                    onSelectModel={handleOnSelectModel}
                    onSelectModelAfterEvaluate={
                      handleOnSelectModelAfterEvaluate
                    }
                    displayEvaluateStatus={displayEvaluateStatus}
                    gpuOptions={props.gpuOptions}
                  ></SearchModel>
                </ColumnWrapper>
                <Separator></Separator>
              </ColWrapper>
              <ColWrapper>
                <ColumnWrapper>
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
                      gpuOptions={props.gpuOptions}
                    ></HFModelFile>
                  )}
                </ColumnWrapper>
                <Separator></Separator>
              </ColWrapper>
            </>
          )}

        <FormContext.Provider
          value={{
            isGGUF: isGGUF,
            pageAction: action,
            modelFileOptions: props.modelFileOptions,
            onValuesChange: onValuesChange
          }}
        >
          <FormWrapper>
            <ColumnWrapper
              paddingBottom={warningStatus.show ? 170 : 50}
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
                    contentStyle={{ paddingInline: 0 }}
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
                  initialValues={initialValues}
                  source={source}
                  action={action}
                  selectedModel={selectedModel}
                  onOk={handleOnOk}
                  ref={form}
                  isGGUF={isGGUF}
                  gpuOptions={props.gpuOptions}
                  modelFileOptions={props.modelFileOptions}
                  onBackendChange={handleBackendChange}
                  onValuesChange={onValuesChange}
                ></DataForm>
              </>
            </ColumnWrapper>
          </FormWrapper>
        </FormContext.Provider>
      </div>
    </GSDrawer>
  );
};

export default AddModal;
