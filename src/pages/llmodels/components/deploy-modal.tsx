import ModalFooter from '@/components/modal-footer';
import { PageActionType } from '@/config/types';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Drawer } from 'antd';
import _, { debounce } from 'lodash';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  backendOptionsMap,
  getSourceRepoConfigValue,
  modelSourceMap
} from '../config';
import { FormContext } from '../config/form-context';
import { FormData, SourceType } from '../config/types';
import { useCheckCompatibility } from '../hooks';
import ColumnWrapper from './column-wrapper';
import CompatibilityAlert from './compatible-alert';
import DataForm from './data-form';
import HFModelFile from './hf-model-file';
import ModelCard from './model-card';
import SearchModel from './search-model';
import Separator from './separator';
import TitleWrapper from './title-wrapper';

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
    handleUpdateWarning,
    setWarningStatus,
    handleEvaluate,
    handleOnValuesChange,
    checkTokenRef,
    warningStatus
  } = useCheckCompatibility();
  const form = useRef<any>({});
  const intl = useIntl();
  const [selectedModel, setSelectedModel] = useState<any>({});
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isGGUF, setIsGGUF] = useState<boolean>(props.isGGUF || false);
  const modelFileRef = useRef<any>(null);
  const submitAnyway = useRef<boolean>(false);

  const handleSelectModelFile = useCallback((item: any) => {
    form.current?.setFieldsValue?.({
      file_name: item.fakeName,
      backend: backendOptionsMap.llamaBox,
      ...item.evaluateResult?.default_spec
    });
    if (item.fakeName) {
      handleShowCompatibleAlert(item.evaluateResult);
    }
  }, []);

  const handleOnSelectModel = (item: any, isgguf?: boolean) => {
    setSelectedModel(item);
    form.current?.handleOnSelectModel?.(item);
    if (!isgguf) {
      handleShowCompatibleAlert(item.evaluateResult);
      form.current?.setFieldsValue?.({
        ...item.evaluateResult?.default_spec
      });
    }
  };

  const handleOnOk = async (allValues: FormData) => {
    const result = getSourceRepoConfigValue(props.source, allValues).values;
    if (submitAnyway.current) {
      onOk(result);
      return;
    }

    const evalutionData = await handleEvaluate(result);
    handleShowCompatibleAlert?.(evalutionData);
    if (evalutionData?.compatible) {
      onOk(result);
    }
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

  // trigger from local_path change or backend change
  const handleBackendChangeHook = async () => {
    const localPath = form.current.form.getFieldValue?.('local_path');
    const backend = form.current.form.getFieldValue?.('backend');

    const res = handleUpdateWarning?.({
      backend,
      localPath: localPath,
      source: props.source
    });

    if (!res.show) {
      const values = form.current.form.getFieldsValue?.();
      const data = getSourceRepoConfigValue(props.source, values);
      const evalutionData = await handleEvaluate(
        _.omit(data.values, [
          'cpu_offloading',
          'distributed_inference_across_workers'
        ])
      );
      handleShowCompatibleAlert?.(evalutionData);
    } else {
      setWarningStatus?.(res);
    }
  };

  const handleBackendChange = async (backend: string) => {
    handleBackendChangeHook();
    if (backend === backendOptionsMap.vllm) {
      setIsGGUF(false);
    }

    if (backend === backendOptionsMap.llamaBox) {
      setIsGGUF(true);
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

  useEffect(() => {
    if (!open) {
      return;
    }
    if (props.deploymentType === 'modelFiles') {
      form.current?.form?.setFieldsValue({
        ...props.initialValues
      });
      setIsGGUF(props.isGGUF || false);
    } else {
      const backend =
        source === modelSourceMap.ollama_library_value
          ? backendOptionsMap.llamaBox
          : backendOptionsMap.vllm;
      form.current?.setFieldValue?.('backend', backend);
      setIsGGUF(backend === backendOptionsMap.llamaBox);
    }

    return () => {
      setSelectedModel({});
      setWarningStatus({
        show: false,
        title: '',
        message: []
      });
      checkTokenRef.current?.cancel();
    };
  }, [open, props.isGGUF, source, props.initialValues, props.deploymentType]);

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
            modelFileOptions: props.modelFileOptions
          }}
        >
          <FormWrapper>
            <ColumnWrapper
              paddingBottom={
                warningStatus.show
                  ? Array.isArray(warningStatus.message)
                    ? 150
                    : 125
                  : 50
              }
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
                    showOkBtn={!warningStatus.show}
                    extra={
                      warningStatus.show && (
                        <Button
                          type="primary"
                          onClick={handleSubmitAnyway}
                          style={{ width: '130px' }}
                        >
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
    </Drawer>
  );
};

export default AddModal;
