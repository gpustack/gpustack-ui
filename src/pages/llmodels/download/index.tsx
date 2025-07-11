import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ColumnWrapper from '../components/column-wrapper';
import HFModelFile from '../components/hf-model-file';
import ModelCard from '../components/model-card';
import SearchModel from '../components/search-model';
import Separator from '../components/separator';
import TitleWrapper from '../components/title-wrapper';
import { modelSourceMap } from '../config';
import { FormData } from '../config/types';
import TargetForm from './target-form';

type AddModalProps = {
  title: string;
  open: boolean;
  source: string;
  width?: string | number;
  hasLinuxWorker?: boolean;
  workersList: Global.BaseOption<number>[];
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const DownloadModel: React.FC<AddModalProps> = (props) => {
  const {
    title,
    workersList,
    open,
    onOk,
    onCancel,
    hasLinuxWorker,
    source,
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
  const [fileName, setFileName] = useState<string>('');
  const modelFileRef = useRef<any>(null);

  const generateModelInfo = () => {
    if (source === modelSourceMap.huggingface_value) {
      const huggingFaceModel = {
        huggingface_repo_id: selectedModel.name,
        huggingface_filename: fileName || null
      };
      return huggingFaceModel;
    }

    if (source === modelSourceMap.modelscope_value) {
      const modelScopeModel = {
        model_scope_model_id: selectedModel.name,
        model_scope_file_path: fileName || null
      };
      return modelScopeModel;
    }
    return {};
  };
  const handleSelectModelFile = useCallback((item: any) => {
    setFileName(item.fakeName);
  }, []);

  const handleOnSelectModel = (item: any) => {
    setSelectedModel(item);
  };

  const handleOk = (values: any) => {
    onOk({
      ...values,
      source: source,
      ...generateModelInfo()
    });
  };

  const handleSumit = () => {
    form.current?.form?.submit?.();
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

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    handleSelectModelFile({ fakeName: '' });
  }, [selectedModel]);

  useEffect(() => {
    if (!open) {
      setIsGGUF(false);
    } else if (source === modelSourceMap.ollama_library_value) {
      setIsGGUF(true);
    }
    if (open) {
      form.current?.form?.setFieldValue(
        'worker_id',
        workersList[0]?.value || ''
      );
    }

    return () => {
      setSelectedModel({});
    };
  }, [open, source]);

  return (
    <GSDrawer
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
                  hasLinuxWorker={hasLinuxWorker}
                  modelSource={props.source}
                  onSelectModel={handleOnSelectModel}
                  isDownload={true}
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
                    isDownload={true}
                  ></HFModelFile>
                )}
              </ColumnWrapper>
              <Separator></Separator>
            </div>
          </>
        )}
        <div style={{ display: 'flex', flex: 1, maxWidth: '100%' }}>
          <ColumnWrapper
            paddingBottom={50}
            footer={
              <>
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
                  {intl.formatMessage({
                    id: 'resources.modelfiles.selecttarget'
                  })}
                  <span style={{ display: 'flex', height: 24 }}></span>
                </TitleWrapper>
              )}
              <TargetForm
                ref={form}
                onOk={handleOk}
                source={source}
                workersList={workersList}
              ></TargetForm>
            </>
          </ColumnWrapper>
        </div>
      </div>
    </GSDrawer>
  );
};

export default DownloadModel;
