import ModalFooter from '@/components/modal-footer';
import { PageActionType } from '@/config/types';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Drawer } from 'antd';
import _, { debounce } from 'lodash';
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

const resetFields = [
  'cpu_offloading',
  'distributed_inference_across_workers',
  'backend_version',
  'backend_parameters',
  'env'
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
    handleOnValuesChange,
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
  const isHolderRef = useRef<{
    model: boolean;
    file: boolean;
  }>({
    model: false,
    file: false
  });

  const setIsHolderRef = (flag: Record<string, boolean>) => {
    isHolderRef.current = {
      ...isHolderRef.current,
      ...flag
    };
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

  const handleSelectModelFile = (item: any, evaluate?: boolean) => {
    form.current?.form?.resetFields(resetFields);
    const modelInfo = onSelectModel(selectedModel, props.source);
    form.current?.setFieldsValue?.({
      file_name: item.fakeName,
      ...getDefaultSpec(item),
      ...modelInfo,
      categories: getCategory(item)
    });

    if (
      item.fakeName &&
      !isHolderRef.current.model &&
      !isHolderRef.current.file
    ) {
      handleShowCompatibleAlert(item.evaluateResult);
    }
  };

  const handleOnSelectModel = (item: any, evaluate?: boolean) => {
    setSelectedModel(item);
    if (!item.isGGUF) {
      setIsGGUF(false);
      form.current?.form?.resetFields(resetFields);
      const modelInfo = onSelectModel(item, props.source);
      if (!isHolderRef.current.model) {
        handleShowCompatibleAlert(item.evaluateResult);
      }
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

  const debounceFetchModelFiles = debounce(() => {
    modelFileRef.current?.fetchModelFiles?.();
  }, 100);

  const handleSetIsGGUF = (flag: boolean) => {
    setIsGGUF(flag);
    if (flag) {
      debounceFetchModelFiles();
    }
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

  const displayEvaluateStatus = (data: {
    show?: boolean;
    flag: Record<string, boolean>;
  }) => {
    setIsHolderRef(data.flag);
    setWarningStatus({
      show: isHolderRef.current.model || isHolderRef.current.file,
      title: '',
      type: 'transition',
      message: intl.formatMessage({ id: 'models.form.evaluating' })
    });
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
    <Drawer
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
                      displayEvaluateStatus={displayEvaluateStatus}
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
    </Drawer>
  );
};

export default AddModal;
