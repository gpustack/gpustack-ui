import ModalFooter from '@/components/modal-footer';
import { PageActionType } from '@/config/types';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Drawer } from 'antd';
import { debounce } from 'lodash';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { backendOptionsMap, modelSourceMap } from '../config';
import { FormData } from '../config/types';
import { useCheckCompatibility } from '../hooks';
import ColumnWrapper from './column-wrapper';
import CompatibilityAlert from './compatible-alert';
import DataForm from './data-form';
import HFModelFile from './hf-model-file';
import ModelCard from './model-card';
import SearchModel from './search-model';
import Separator from './separator';
import TitleWrapper from './title-wrapper';

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
  action: PageActionType;
  open: boolean;
  source: string;
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

  const { handleShowCompatibleAlert, handleUpdateWarning, warningStatus } =
    useCheckCompatibility();
  const form = useRef<any>({});
  const intl = useIntl();
  const [selectedModel, setSelectedModel] = useState<any>({});
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isGGUF, setIsGGUF] = useState<boolean>(props.isGGUF || false);
  const modelFileRef = useRef<any>(null);

  const handleSelectModelFile = useCallback((item: any) => {
    form.current?.setFieldsValue?.({
      file_name: item.fakeName,
      backend: backendOptionsMap.llamaBox
    });
    if (item.fakeName) {
      handleShowCompatibleAlert(item.evaluateResult);
    }
  }, []);

  const handleOnSelectModel = (item: any) => {
    setSelectedModel(item);
    form.current?.handleOnSelectModel?.(item);
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
    } else {
      handleShowCompatibleAlert(selectedModel.evaluateResult);
    }
  };

  const handleBackendChange = async (backend: string) => {
    if (backend === backendOptionsMap.vllm) {
      setIsGGUF(false);
    }

    if (backend === backendOptionsMap.llamaBox) {
      setIsGGUF(true);
    }
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
      form.current?.setFieldValue?.('backend', backendOptionsMap.vllm);
      setIsGGUF(false);
    }

    return () => {
      setSelectedModel({});
    };
  }, [open, props.isGGUF, props.initialValues, props.deploymentType]);

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
        <FormWrapper>
          <ColumnWrapper
            paddingBottom={warningStatus.show ? 125 : 50}
            footer={
              <>
                <CompatibilityAlert
                  warningStatus={warningStatus}
                ></CompatibilityAlert>
                <ModalFooter
                  onCancel={handleCancel}
                  onOk={handleSumit}
                  style={{
                    padding: '16px 24px',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}
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
                onOk={onOk}
                ref={form}
                isGGUF={isGGUF}
                gpuOptions={props.gpuOptions}
                modelFileOptions={props.modelFileOptions}
                handleShowCompatibleAlert={handleShowCompatibleAlert}
                handleUpdateWarning={handleUpdateWarning}
                onBackendChange={handleBackendChange}
              ></DataForm>
            </>
          </ColumnWrapper>
        </FormWrapper>
      </div>
    </Drawer>
  );
};

export default AddModal;
