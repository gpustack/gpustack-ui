import IconFont from '@/components/icon-font';
import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Segmented, Tabs } from 'antd';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import ColumnWrapper from '../../_components/column-wrapper';
import { backendFields, json2Yaml } from '../config';
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
  onSubmitYaml: (values: { content: string }) => void;
  open: boolean;
  title?: string;
}

const AddModal: React.FC<AddModalProps> = (props) => {
  const { action, currentData, onClose, onSubmit, onSubmitYaml, open, title } =
    props;
  const formRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const intl = useIntl();
  const [activeKey, setActiveKey] = useState<string>('form');
  const [yamlContent, setYamlContent] = useState<string>('');
  const [formContent, setFormContent] = useState<FormData>({} as FormData);
  const tabsRef = useRef<any>(null);

  const onOk = () => {
    if (activeKey === 'yaml') {
      const content = editorRef.current?.getContent();
      const valid = editorRef.current?.validate();
      if (valid) {
        onSubmitYaml({ content: content });
      }
    } else {
      formRef.current?.submit();
    }
  };

  const onFinish = (values: FormData) => {
    console.log('Form values:', values);
    const versionConfigs = values.version_configs?.reduce(
      (acc: Record<string, any>, curr) => {
        if (curr.version_no) {
          acc[curr.version_no] = {
            image_name: curr.image_name,
            run_command: curr.run_command
          };
        }
        return acc;
      },
      {}
    );

    const defaultVersion = values.version_configs?.find((v) => v.is_default);

    onSubmit({
      ...values,
      default_version: defaultVersion?.version_no || '',
      // @ts-ignore
      version_configs: versionConfigs
    });
  };

  const iniFormContent = (values: any) => {
    const versionConfigs = Object.keys(values.version_configs || {}).map(
      (key) => ({
        version_no: key,
        image_name: values.version_configs[key].image_name,
        run_command: values.version_configs[key].run_command,
        is_default: key === values.default_version,
        isBuiltin: true
      })
    );
    return {
      ...values,
      version_configs: versionConfigs
    };
  };

  const initYamlContent = (values: any) => {
    if (currentData?.is_build_in) {
      return json2Yaml(_.pick(values, backendFields));
    }
    return json2Yaml(_.pick(values, [...backendFields, 'default_version']));
  };

  useEffect(() => {
    if (action === PageAction.EDIT) {
      const yaml = initYamlContent(currentData || {});
      const formData = iniFormContent(currentData || {});
      setYamlContent(yaml);
      setFormContent(formData);
      formRef.current?.setFieldsValue?.(formData);
      editorRef.current?.setValue?.(yaml);
    }
  }, [action, currentData]);

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
          renderTabBar={(agrs, tab) => <></>}
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
                  currentData={formContent as ListItem}
                  ref={formRef}
                />
              )
            },
            {
              key: 'yaml',
              label: 'YAML',
              children: (
                <ImportYAML
                  actionStatus={{
                    action: action,
                    isBuiltIn: currentData?.is_build_in || false
                  }}
                  ref={editorRef}
                  content={yamlContent}
                />
              )
            }
          ]}
        ></Tabs>
      </ColumnWrapper>
    </GSDrawer>
  );
};

export default AddModal;
