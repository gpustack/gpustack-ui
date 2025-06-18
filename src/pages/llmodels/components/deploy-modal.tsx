import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { PageActionType } from '@/config/types';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import _ from 'lodash';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  backendOptionsMap,
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
import OllamaTips from './ollama-tips';
import SearchModel from './search-model';
import Separator from './separator';
import TitleWrapper from './title-wrapper';

const resetFieldsByModel = [
  'cpu_offloading',
  'distributed_inference_across_workers',
  'backend_version',
  'backend_parameters',
  'env'
];

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
    handleEvaluateOnChange,
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
  const evaluateStateRef = useRef<{ state: EvaluateProccessType }>({
    state: 'form'
  });
  const requestModelIdRef = useRef<number>(0);

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
  const setEvaluteState = (state: EvaluateProccessType) => {
    evaluateStateRef.current.state = state;
  };

  const handleOnValuesChange = (data: {
    changedValues: any;
    allValues: any;
    source: SourceType;
  }) => {
    setEvaluteState(EvaluateProccess.form);
    handleOnValuesChangeBefore(data);
  };

  const getDefaultSpec = (item: any) => {
    const defaultSpec = item.evaluateResult?.default_spec || {};
    return _.omit(defaultSpec, [
      'cpu_offloading',
      'distributed_inference_across_workers'
    ]);
  };

  const getCategory = (item: any) => {
    const categories = item.evaluateResult?.default_spec?.categories || [];
    if (Array.isArray(categories)) {
      return categories?.[0] || null;
    }
    return categories || null;
  };

  const handleSelectModelFile = async (item: any) => {
    form.current?.form?.resetFields(resetFieldsByFile);
    const modelInfo = onSelectModel(selectedModel, props.source);

    form.current?.setFieldsValue?.({
      ...modelInfo,
      file_name: item.fakeName,
      categories: getCategory(item)
    });

    console.log('handleSelectModelFile', item);

    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 0);
    });

    // evaluate the form data when select a model file
    if (item.fakeName) {
      unlockWarningStatus();
      const currentModelId = updateRequestModelId();
      setEvaluteState(EvaluateProccess.file);

      const evaluateRes = await handleEvaluateOnChange?.({
        changedValues: {},
        allValues: form.current?.form?.getFieldsValue?.(),
        source: props.source
      });

      if (currentModelId !== requestModelIdRef.current) {
        // if the request model id has changed, do not update the form
        return;
      }

      const defaultSpec = getDefaultSpec({
        evaluateResult: evaluateRes
      });

      /**
       * do not reset backend_parameters when select a model file
       */
      const formBackendParameters =
        form.current?.getFieldValue?.('backend_parameters') || [];

      form.current?.setFieldsValue?.({
        ...defaultSpec,
        ...modelInfo,
        file_name: item.fakeName,
        backend_parameters:
          formBackendParameters.length > 0
            ? formBackendParameters
            : defaultSpec.backend_parameters || [],
        categories: getCategory(item)
      });
    }
  };

  const handleOnSelectModel = async (item: any) => {
    // If the item is empty or the same as the selected model, do nothing
    console.log('handleOnSelectModel', item, selectedModel);
    if (
      _.isEmpty(item) ||
      (item.isGGUF === selectedModel.isGGUF && item.name === selectedModel.name)
    ) {
      return;
    }
    setIsGGUF(item.isGGUF);
    clearCahceFormValues();
    unlockWarningStatus();
    setEvaluteState(EvaluateProccess.model);
    setSelectedModel(item);

    form.current?.form?.resetFields(resetFieldsByModel);
    const modelInfo = onSelectModel(item, props.source);
    form.current?.setFieldsValue?.({
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

    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 0);
    });

    if (item.isGGUF) {
      modelFileRef.current?.fetchModelFiles?.();
    }
  };

  const handleOnSelectModelAfterEvaluate = (item: any) => {
    console.log('handleOnSelectModelAfterEvaluate', item);
    if (item.isGGUF) {
      return;
    }
    const modelInfo = onSelectModel(item, props.source);
    if (
      evaluateStateRef.current.state === EvaluateProccess.model &&
      item.evaluateResult
    ) {
      handleShowCompatibleAlert(item.evaluateResult);
      form.current?.setFieldsValue?.({
        ...getDefaultSpec(item),
        ...modelInfo,
        categories: getCategory(item)
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

      if (source === modelSourceMap.ollama_library_value) {
        backend = backendOptionsMap.llamaBox;
      }
      form.current?.setFieldValue?.('backend', backend);
      setIsGGUF(source === modelSourceMap.ollama_library_value);
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
                    unlockWarningStatus={unlockWarningStatus}
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
                {source === modelSourceMap.ollama_library_value && (
                  <OllamaTips></OllamaTips>
                )}
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
