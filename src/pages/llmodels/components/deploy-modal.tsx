import AlertBlockInfo from '@/components/alert-info/block';
import ModalFooter from '@/components/modal-footer';
import { PageActionType } from '@/config/types';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Drawer } from 'antd';
import { debounce } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { backendOptionsMap, modelSourceMap } from '../config';
import { FormData } from '../config/types';
import ColumnWrapper from './column-wrapper';
import DataForm from './data-form';
import HFModelFile from './hf-model-file';
import ModelCard from './model-card';
import SearchModel from './search-model';
import Separator from './separator';
import TitleWrapper from './title-wrapper';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  source: string;
  width?: string | number;
  gpuOptions: any[];
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const AddModal: React.FC<AddModalProps> = (props) => {
  const {
    title,
    open,
    onOk,
    onCancel,
    source,
    action,
    width = 600
  } = props || {};
  const SEARCH_SOURCE = [
    modelSourceMap.huggingface_value,
    modelSourceMap.modelscope_value
  ];

  const form = useRef<any>({});
  const intl = useIntl();
  const [selectedModel, setSelectedModel] = useState<any>({});
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isGGUF, setIsGGUF] = useState<boolean>(false);
  const modelFileRef = useRef<any>(null);
  const [warningStatus, setWarningStatus] = useState<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: ''
  });

  const handleSelectModelFile = useCallback((item: any) => {
    form.current?.setFieldValue?.('file_name', item.fakeName);
  }, []);

  const handleOnSelectModel = (item: any) => {
    setSelectedModel(item);
  };

  const handleSumit = () => {
    form.current?.submit?.();
  };

  const debounceFetchModelFiles = debounce(() => {
    modelFileRef.current?.fetchModelFiles?.();
  }, 300);

  const handleSetIsGGUF = (flag: boolean) => {
    setIsGGUF(flag);
    if (flag) {
      debounceFetchModelFiles();
    }
  };

  const updateShowWarning = (backend: string) => {
    const localPath = form.current?.getFieldValue?.('local_path');
    const isBlobFile = localPath?.split('/').pop()?.includes('sha256');

    if (isBlobFile) {
      setWarningStatus({
        show: false,
        message: ''
      });
      return;
    }

    if (source !== modelSourceMap.local_path_value || !localPath) {
      return;
    }

    if (localPath.endsWith('.gguf') && backend !== backendOptionsMap.llamaBox) {
      setWarningStatus({
        show: true,
        message: 'models.form.backend.warning'
      });
    } else if (
      !localPath.endsWith('.gguf') &&
      backend === backendOptionsMap.llamaBox
    ) {
      setWarningStatus({
        show: true,
        message: 'models.form.backend.warning.llamabox'
      });
    } else {
      setWarningStatus({
        show: false,
        message: ''
      });
    }
  };

  const handleBackendChange = (backend: string) => {
    if (backend === backendOptionsMap.vllm) {
      setIsGGUF(false);
    }

    if (backend === backendOptionsMap.llamaBox) {
      setIsGGUF(true);
    }
    updateShowWarning(backend);
  };

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    handleSelectModelFile({ fakeName: '' });
  }, [selectedModel]);

  useEffect(() => {
    if (!open) {
      setIsGGUF(false);
      setWarningStatus({
        show: false,
        message: ''
      });
      form.current?.setFieldValue?.('backend', backendOptionsMap.vllm);
    } else if (source === modelSourceMap.ollama_library_value) {
      form.current?.setFieldValue?.('backend', backendOptionsMap.llamaBox);
      setIsGGUF(true);
    }

    return () => {
      setSelectedModel({});
    };
  }, [open, source]);

  return (
    <Drawer
      title={
        <div className="flex-between flex-center">
          <span
            style={{
              color: 'var(--ant-color-text)',
              fontWeight: 'var(--font-weight-medium)',
              fontSize: 'var(--font-size-middle)'
            }}
          >
            {title}
          </span>
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
        {SEARCH_SOURCE.includes(props.source) && (
          <>
            <div
              style={{
                display: 'flex',
                flex: 1,
                maxWidth: '33.33%'
              }}
            >
              <ColumnWrapper>
                <SearchModel
                  modelSource={props.source}
                  onSelectModel={handleOnSelectModel}
                ></SearchModel>
              </ColumnWrapper>
              <Separator></Separator>
            </div>
            <div
              style={{
                display: 'flex',
                flex: 1,
                maxWidth: '33.33%'
              }}
            >
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
            </div>
          </>
        )}
        <div style={{ display: 'flex', flex: 1, maxWidth: '100%' }}>
          <ColumnWrapper
            paddingBottom={warningStatus.show ? 155 : 50}
            footer={
              <>
                {warningStatus.show && (
                  <AlertBlockInfo
                    ellipsis={false}
                    message={
                      <span
                        dangerouslySetInnerHTML={{
                          __html: intl.formatMessage({
                            id: warningStatus.message
                          })
                        }}
                      ></span>
                    }
                    title={intl.formatMessage({
                      id: 'common.text.tips'
                    })}
                    type="warning"
                  ></AlertBlockInfo>
                )}
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
              {SEARCH_SOURCE.includes(source) && (
                <TitleWrapper>
                  {intl.formatMessage({ id: 'models.form.configurations' })}
                  <span style={{ display: 'flex', height: 24 }}></span>
                </TitleWrapper>
              )}
              <DataForm
                source={source}
                action={action}
                selectedModel={selectedModel}
                onOk={onOk}
                ref={form}
                isGGUF={isGGUF}
                gpuOptions={props.gpuOptions}
                onBackendChange={handleBackendChange}
              ></DataForm>
            </>
          </ColumnWrapper>
        </div>
      </div>
    </Drawer>
  );
};

export default AddModal;
