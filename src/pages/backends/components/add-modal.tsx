import IconFont from '@/components/icon-font';
import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Segmented, Tabs } from 'antd';
import _ from 'lodash';
import React, { useEffect, useId, useRef, useState } from 'react';
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
  const uid = useId();
  const formRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const intl = useIntl();
  const [activeKey, setActiveKey] = useState<string>('form');
  const [yamlContent, setYamlContent] = useState<string>('');
  const [formContent, setFormContent] = useState<FormData>({} as FormData);

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
    const versionConfigs = values.version_configs?.reduce(
      (acc: Record<string, any>, curr) => {
        if (curr.version_no) {
          acc[curr.version_no] = {
            custom_framework: curr.custom_framework,
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

  useEffect(() => {
    const iniFormContent = (values: any) => {
      const versionConfigs = Object.keys(values.version_configs || {}).map(
        (key) => ({
          version_no: key,
          image_name: values.version_configs?.[key]?.image_name,
          run_command: values.version_configs?.[key]?.run_command,
          custom_framework: values.version_configs?.[key]?.custom_framework,
          is_default: key === values.default_version
        })
      );

      const builtInVersions = Object.keys(
        values.build_in_version_configs || {}
      ).map((key) => ({
        version_no: key,
        image_name: values.build_in_version_configs?.[key]?.image_name,
        run_command: values.build_in_version_configs?.[key]?.run_command,
        is_default: key === values.default_version,
        build_in_frameworks:
          values.build_in_version_configs?.[key]?.build_in_frameworks || [],
        is_built_in: true
      }));

      return {
        ...values,
        version_configs: versionConfigs,
        build_in_version_configs: builtInVersions
      };
    };

    // built-in backend does not allow to edit default_version
    const initYamlContent = (values: any) => {
      if (currentData?.is_built_in) {
        return json2Yaml(_.pick(values, backendFields));
      }
      return json2Yaml(_.pick(values, [...backendFields, 'default_version']));
    };

    if (action === PageAction.EDIT && open) {
      const yaml = initYamlContent(currentData || {});
      const formData = iniFormContent(currentData || {});
      setYamlContent(yaml);
      setFormContent(formData);
      formRef.current?.setFieldsValue?.(formData);
      editorRef.current?.setContent?.(yaml);
    }

    if (!open) {
      formRef.current?.resetFields?.();
      editorRef.current?.setContent?.('');
      setFormContent({} as FormData);
      setYamlContent('');
      setActiveKey('form');
    }
  }, [action, currentData, open]);

  return (
    <GSDrawer
      title={title}
      open={open}
      key={uid}
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
          onChange={(value) => setActiveKey(value as string)}
          options={[
            {
              label: intl.formatMessage({ id: 'backend.mode.form' }),
              value: 'form',
              icon: <IconFont type="icon-edit-content" />
            },
            {
              label: intl.formatMessage({ id: 'backend.mode.yaml' }),
              value: 'yaml',
              icon: <IconFont type="icon-code_block" />
            }
          ]}
          size="middle"
          style={{ width: '100%' }}
        />
      </SegmentedHeader>
      <ColumnWrapper
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
              label: intl.formatMessage({ id: 'backend.mode.form' }),
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
              label: intl.formatMessage({ id: 'backend.mode.yaml' }),
              children: (
                <ImportYAML
                  actionStatus={{
                    action: action,
                    isBuiltIn: currentData?.is_built_in || false
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
