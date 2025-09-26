import IconFont from '@/components/icon-font';
import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Segmented, Tabs } from 'antd';
import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import ColumnWrapper from '../../_components/column-wrapper';
import { FormData, ListItem } from '../config/types';
import BackendForm from '../forms';
import ImportYAML from './import-yaml';

const ModalFooterStyle = {
  padding: '16px 24px',
  display: 'flex',
  justifyContent: 'flex-end'
};

const SegmentedInner = styled(Segmented)`
  width: 100%;
  border-radius: 0;
  .ant-segmented-item {
    flex: 1;
  }
`;

const SegmentedHeader = styled.div`
  margin-top: 16px;
  padding: 0 24px;
`;

interface AddModalProps {
  action: PageActionType;
  currentData?: ListItem; // Used when action is EDIT
  onClose: () => void;
  onSubmit: (values: FormData) => void;
  open: boolean;
  title?: string;
}

const AddModal: React.FC<AddModalProps> = (props) => {
  const { action, currentData, onClose, onSubmit, open, title } = props;
  const formRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const intl = useIntl();
  const [activeKey, setActiveKey] = useState<string>('form');

  const onOk = () => {
    if (activeKey === 'yaml') {
      const content = editorRef.current?.getContent();
      const valid = editorRef.current?.validate();
      if (valid) {
        onSubmit({ content: content });
      }
    } else {
      formRef.current?.submit();
    }
  };

  const onFinish = (values: FormData) => {
    onSubmit(values);
  };

  return (
    <GSDrawer
      title={title}
      open={open}
      onClose={onClose}
      destroyOnHidden={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      styles={{
        body: {
          padding: '0 0 16px',
          overflowX: 'hidden'
        },
        content: {
          borderRadius: '6px 0 0 6px'
        }
      }}
      width={600}
      footer={false}
    >
      <SegmentedHeader>
        <SegmentedInner
          shape="round"
          onChange={(value) => setActiveKey(value as string)}
          options={[
            {
              label: 'Form',
              value: 'form',
              icon: <IconFont type="icon-edit-content" />
            },
            {
              label: 'YAML',
              value: 'yaml',
              icon: <IconFont type="icon-code_block" />
            }
          ]}
          size="middle"
          style={{ width: '100%' }}
        />
      </SegmentedHeader>
      <ColumnWrapper
        style={{ flex: 1 }}
        maxHeight={'calc(100vh - 123px)'}
        footer={
          <ModalFooter
            onCancel={onClose}
            onOk={onOk}
            style={ModalFooterStyle}
          ></ModalFooter>
        }
      >
        <Tabs
          renderTabBar={() => <></>}
          activeKey={activeKey}
          defaultActiveKey={activeKey}
          items={[
            {
              key: 'form',
              label: 'Form',
              children: (
                <BackendForm
                  onFinish={onFinish}
                  action={action}
                  currentData={currentData}
                  ref={formRef}
                />
              )
            },
            {
              key: 'yaml',
              label: 'YAML',
              children: (
                <ImportYAML action={action} ref={editorRef}></ImportYAML>
              )
            }
          ]}
        ></Tabs>
      </ColumnWrapper>
    </GSDrawer>
  );
};

export default AddModal;
