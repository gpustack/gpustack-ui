import useWindowResize from '@/hooks/use-window-resize';
import { ProviderValueMap } from '@/pages/cluster-management/config';
import { getDrawerWidth } from '@/utils/drawer-width';
import { ColumnWrapper, GSDrawer } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { modelSourceMap } from '../../config';
import { FormData } from '../../config/types';
import HFModelFile from '../model-source/hf-model-file';
import ModelCard from '../model-source/model-card';
import OnlineModelLayout from '../model-source/online-model-layout';
import OnlineModelModalFooter from '../model-source/online-model-modal-footer';
import SearchModel from '../model-source/search-model';
import TitleWrapper from '../title-wrapper';
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

  const form = useRef<any>(null);
  const intl = useIntl();
  const { size } = useWindowResize();
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
      setFileName('');
    };
  }, [open, source]);

  const showOnlinePanels = SEARCH_SOURCE.includes(props.source);
  const drawerWidth = getDrawerWidth(size.width, width);
  const hasSelectedModel = !!selectedModel?.name;
  const canProceedFromDetail = hasSelectedModel && (!isGGUF || !!fileName);

  return (
    <GSDrawer
      title={title}
      open={open}
      onClose={handleCancel}
      destroyOnHidden={true}
      closeIcon={false}
      mask={{
        closable: false
      }}
      keyboard={false}
      zIndex={2000}
      styles={{
        wrapper: { width: drawerWidth }
      }}
      footer={false}
    >
      <OnlineModelLayout
        open={open}
        showOnlinePanels={showOnlinePanels}
        hasSelectedModel={hasSelectedModel}
        canProceedFromDetail={canProceedFromDetail}
        searchPanel={
          <SearchModel
            hasLinuxWorker={hasLinuxWorker}
            modelSource={props.source}
            onSelectModel={handleOnSelectModel}
            isDownload={true}
          />
        }
        detailPanel={
          <ColumnWrapper styles={{ container: { padding: 0 } }}>
            <ModelCard
              selectedModel={selectedModel}
              onCollapse={setCollapsed}
              collapsed={collapsed}
              modelSource={props.source}
              isGGUF={isGGUF}
              setIsGGUF={handleSetIsGGUF}
            />
            {isGGUF && (
              <HFModelFile
                ref={modelFileRef}
                selectedModel={selectedModel}
                modelSource={props.source}
                onSelectFile={handleSelectModelFile}
                collapsed={collapsed}
                isDownload={true}
              />
            )}
          </ColumnWrapper>
        }
        formPanel={
          <ColumnWrapper
            styles={{
              container: { paddingBlock: 0 }
            }}
            footer={
              <OnlineModelModalFooter
                onCancel={handleCancel}
                onOk={handleSumit}
                loading={loading}
              />
            }
          >
            <>
              {showOnlinePanels && (
                <TitleWrapper>
                  {intl.formatMessage({
                    id: 'resources.modelfiles.selecttarget'
                  })}
                  <span style={{ display: 'flex', height: 24 }} />
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
              />
            </>
          </ColumnWrapper>
        }
      />
    </GSDrawer>
  );
};

export default DownloadModel;
