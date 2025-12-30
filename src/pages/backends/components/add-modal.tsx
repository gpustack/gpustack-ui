import IconFont from '@/components/icon-font';
import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import SegmentLine from '@/components/segment-line';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Tabs } from 'antd';
import _ from 'lodash';
import React, { useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import ColumnWrapper from '../../_components/column-wrapper';
import {
  builtInBackendFields,
  customBackendFields,
  json2Yaml
} from '../config';
import { FormData, ListItem } from '../config/types';
import BackendForm from '../forms';
import ImportYAML from './import-yaml';

const ModalFooterStyle = {
  padding: '16px 24px 8px',
  display: 'flex',
  justifyContent: 'flex-end'
};

const SegmentedHeader = styled.div`
  margin: 16px 24px;
  border-bottom: 1px solid var(--ant-color-split);
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

  const versionFields = [
    'image_name',
    'run_command',
    'custom_framework',
    'entrypoint'
  ];

  // remove '-custom' suffix from version_no in currentData, when action is EDIT
  const genertateCurrentVersionData = (values: ListItem): ListItem => {
    const data = { ...values };
    data.version_configs = Object.entries(data.version_configs || {}).reduce(
      (acc, [key, value]) => {
        const version = key.replace(/-custom$/, '');
        acc[version] = { ...value };
        return acc;
      },
      {} as any
    );

    return data;
  };

  const onOk = () => {
    if (activeKey === 'yaml') {
      const content = editorRef.current?.getContent();
      if (content) {
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
            ..._.pick(curr, versionFields)
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
    const iniFormContent = (data: ListItem) => {
      const values: any = genertateCurrentVersionData(data);

      // custom versions
      const versionConfigs = Object.keys(values.version_configs || {}).map(
        (key: string) => ({
          version_no: key,
          is_default: key === values.default_version,
          ..._.pick(values.version_configs?.[key], versionFields)
        })
      );

      // built-in versions
      const builtInVersions = Object.keys(
        values.built_in_version_configs || {}
      ).map((key) => ({
        version_no: key,
        is_default: key === values.default_version,
        built_in_frameworks:
          values.built_in_version_configs?.[key]?.built_in_frameworks || [],
        is_built_in: true,
        ..._.pick(values.built_in_version_configs?.[key], [
          'image_name',
          'run_command',
          'entrypoint'
        ])
      }));

      return {
        ...values,
        backend_name: values.backend_name.replace(/-custom$/, ''),
        version_configs: versionConfigs,
        built_in_version_configs: builtInVersions
      };
    };

    // built-in backend does not allow to edit default_version
    const initYamlContent = (values: any) => {
      const copyValues = structuredClone(values);
      copyValues.version_configs = _.mapValues(
        copyValues.version_configs || {},
        (v: any) => {
          return _.omit(v, ['built_in_frameworks']);
        }
      );

      if (currentData?.is_built_in) {
        return json2Yaml(_.pick(copyValues, builtInBackendFields));
      }
      return json2Yaml(
        _.pick(copyValues, [...customBackendFields, 'default_version'])
      );
    };

    if (action === PageAction.EDIT && open) {
      const yaml = initYamlContent(currentData || {});
      const formData = iniFormContent(currentData || ({} as ListItem));
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
        section: {
          borderRadius: '6px 0 0 6px'
        },
        wrapper: {
          width: 600
        }
      }}
      footer={false}
    >
      <SegmentedHeader>
        <SegmentLine
          theme="light"
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
        maxHeight={'calc(100vh - 140px)'}
        styles={{
          container: {
            paddingBlock: 0
          }
        }}
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
