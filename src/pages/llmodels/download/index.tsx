import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { ProviderValueMap } from '@/pages/cluster-management/config';
import { useIntl } from '@umijs/max';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import ColumnWrapper from '../../_components/column-wrapper';
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
  workerOptions: any[];
  workersList?: any[];
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

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

const DownloadModel: React.FC<AddModalProps> = (props) => {
  const {
    title,
    open,
    onOk,
    onCancel,
    hasLinuxWorker,
    source,
    width = 600,
    workerOptions,
    workersList
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
  const [loading, setLoading] = useState<boolean>(false);

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

  const handleOnSelectModel = (item: any) => {
    setSelectedModel(item);
    setFileName('');
  };

  const handleOk = async (values: any) => {
    setLoading(true);
    await onOk({
      ...values,
      source: source,
      ...generateModelInfo()
    });
    setLoading(false);
  };

  const handleSumit = () => {
    if (loading) {
      return;
    }
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
  const handleSelectModelFile = useCallback((item: any) => {
    setFileName(item.fakeName);
  }, []);

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
      (item) => item.provider === ProviderValueMap.Docker
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
      destroyOnHidden={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      zIndex={2000}
      styles={{
        wrapper: { width: width }
      }}
      footer={false}
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {SEARCH_SOURCE.includes(props.source) && (
          <>
            <ColWrapper>
              <SearchModel
                hasLinuxWorker={hasLinuxWorker}
                modelSource={props.source}
                onSelectModel={handleOnSelectModel}
                isDownload={true}
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
                    isDownload={true}
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
                <ModalFooter
                  onCancel={handleCancel}
                  onOk={handleSumit}
                  okBtnProps={{
                    loading: loading
                  }}
                  style={{
                    padding: '16px 24px 8px',
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
                selectedModel={selectedModel}
                fileName={fileName}
                workersList={workersList}
                workerOptions={workerOptions}
              ></TargetForm>
            </>
          </ColumnWrapper>
        </FormWrapper>
      </div>
    </GSDrawer>
  );
};

export default DownloadModel;
