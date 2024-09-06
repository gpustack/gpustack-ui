import ModalFooter from '@/components/modal-footer';
import { PageActionType } from '@/config/types';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Drawer } from 'antd';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { modelSourceMap } from '../config';
import { FormData, ListItem } from '../config/types';
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
  data?: ListItem;
  source: string;
  width?: string | number;
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const AddModal: React.FC<AddModalProps> = (props) => {
  console.log('addmodel====');
  const {
    title,
    open,
    onOk,
    onCancel,
    source,
    action,
    width = 600
  } = props || {};
  const form = useRef<any>({});
  const intl = useIntl();
  const [huggingfaceRepoId, setHuggingfaceRepoId] = useState<string>('');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [loadingModel, setLoadingModel] = useState<boolean>(false);

  const handleSelectModelFile = useCallback((item: any) => {
    form.current?.setFieldValue?.('huggingface_filename', item.fakeName);
  }, []);

  const handleOnSelectModel = (item: any) => {
    setHuggingfaceRepoId(item.name);
  };

  const handleSumit = () => {
    form.current?.submit?.();
  };

  useEffect(() => {
    return () => {
      setHuggingfaceRepoId('');
    };
  }, [open]);

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
          <Button type="text" size="small" onClick={onCancel}>
            <CloseOutlined></CloseOutlined>
          </Button>
        </div>
      }
      open={open}
      onClose={onCancel}
      destroyOnClose={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      styles={{
        body: {
          height: 'calc(100vh - 57px)',
          padding: '16px 0',
          overflowX: 'hidden'
        },
        content: {
          borderRadius: '8px 0 0 8px'
        }
      }}
      width={width}
      footer={false}
    >
      <div style={{ display: 'flex' }}>
        {props.source === modelSourceMap.huggingface_value && (
          <div style={{ display: 'flex', flex: 1 }}>
            <ColumnWrapper>
              <SearchModel
                modelSource={props.source}
                onSelectModel={handleOnSelectModel}
                setLoadingModel={setLoadingModel}
              ></SearchModel>
            </ColumnWrapper>
            <Separator></Separator>
          </div>
        )}
        {props.source === modelSourceMap.huggingface_value && (
          <div style={{ display: 'flex', flex: 1 }}>
            <ColumnWrapper>
              <ModelCard
                repo={huggingfaceRepoId}
                onCollapse={setCollapsed}
                collapsed={collapsed}
              ></ModelCard>
              <HFModelFile
                repo={huggingfaceRepoId}
                onSelectFile={handleSelectModelFile}
                collapsed={collapsed}
              ></HFModelFile>
            </ColumnWrapper>
            <Separator></Separator>
          </div>
        )}
        <ColumnWrapper
          footer={
            <ModalFooter
              onCancel={onCancel}
              onOk={handleSumit}
              style={{
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            ></ModalFooter>
          }
        >
          <>
            {source === modelSourceMap.huggingface_value && (
              <TitleWrapper>
                {intl.formatMessage({ id: 'models.form.configurations' })}
                <span style={{ display: 'flex', height: 24 }}></span>
              </TitleWrapper>
            )}
            <DataForm
              source={source}
              action={action}
              repo={huggingfaceRepoId}
              onOk={onOk}
              ref={form}
            ></DataForm>
          </>
        </ColumnWrapper>
      </div>
    </Drawer>
  );
};

export default memo(AddModal);
