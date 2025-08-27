import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { ProviderValueMap } from '@/pages/cluster-management/config';
import { useIntl } from '@umijs/max';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ColumnWrapper from '../components/column-wrapper';
import CompatibilityAlert from '../components/compatible-alert';
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
  workerOptions: any[];
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const DownloadModel: React.FC<AddModalProps> = (props) => {
  const {
    title,
    open,
    onOk,
    onCancel,
    hasLinuxWorker,
    source,
    width = 600,
    workerOptions
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

  const generateModelInfo = () => {
    if (source === modelSourceMap.huggingface_value) {
      const huggingFaceModel = {
        huggingface_repo_id: selectedModel.name,
        huggingface_filename: null
      };
      return huggingFaceModel;
    }

    if (source === modelSourceMap.modelscope_value) {
      const modelScopeModel = {
        model_scope_model_id: selectedModel.name,
        model_scope_file_path: null
      };
      return modelScopeModel;
    }
    return {};
  };

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

  const initDefaultWorker = () => {
    if (!workerOptions || workerOptions.length === 0) {
      form.current?.form?.setFieldValue('worker_id', []);
      return;
    }
    const getWorkerId = (worker: any) => [
      worker?.value ?? '',
      worker?.children?.[0]?.value ?? ''
    ];

    const customWorker = workerOptions.find(
      (item) => item.provider === ProviderValueMap.Custom
    );

    const worker_id = getWorkerId(customWorker || workerOptions[0]);
    form.current?.form?.setFieldValue('worker_id', worker_id);
  };

  useEffect(() => {
    if (!open) {
      setIsGGUF(false);
    }
    if (open) {
      initDefaultWorker();
    }

    return () => {
      setSelectedModel({});
    };
  }, [open, source]);

  return (
    <GSDrawer
      title={title}
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
                <CompatibilityAlert
                  showClose={false}
                  warningStatus={{
                    show: isGGUF,
                    type: 'danger',
                    message: 'GGUF is not supported'
                  }}
                  contentStyle={{ paddingInline: 0 }}
                ></CompatibilityAlert>
                <ModalFooter
                  onCancel={handleCancel}
                  onOk={handleSumit}
                  okBtnProps={{
                    disabled: isGGUF
                  }}
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
                workerOptions={workerOptions}
              ></TargetForm>
            </>
          </ColumnWrapper>
        </div>
      </div>
    </GSDrawer>
  );
};

export default DownloadModel;
