import CollapsibleContainer from '@/components/collapse-container';
import BaseSelect from '@/components/seal-form/base/select';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Form, Tag } from 'antd';
import React, { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { frameworks } from '../config';
import { ListItem } from '../config/types';

// version must be endwith '-custom'

const Box = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
`;

const Label = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ant-color-text-secondary);
`;

const DefaultTag = styled(Tag)`
  font-weight: 500;
  margin-left: 8px;
  color: var(--ant-color-text);
`;

const Title = styled.div`
  position: sticky;
  top: -16px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--ant-color-bg-container);
  font-weight: 600;
  padding-top: 8px;
  padding-bottom: 8px;
`;

type AddModalProps = {
  action: PageActionType;
  currentData?: ListItem;
  activeKey?: Array<string | number>;
};
const VersionsForm: React.FC<AddModalProps> = ({
  action,
  currentData,
  activeKey
}) => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const [defaultVersion, setDefaultVersion] = React.useState<string | null>(
    null
  );
  const defaultCollapseKey =
    action === 'edit' ? new Set<number>() : new Set([0]);
  const form = Form.useFormInstance();
  const version_configs = Form.useWatch('version_configs', form);
  const [collapseKey, setCollapseKey] =
    React.useState<Set<number | string>>(defaultCollapseKey);
  const versionList = [
    {
      version_no: '',
      image_name: '',
      run_command: '',
      isBuiltin: false,
      is_default: false
    }
  ];

  const validVersions = useMemo(() => {
    return (version_configs || [])
      .filter((v: any) => v.version_no)
      ?.map((v: any) => {
        return {
          label: v.version_no,
          value: v.version_no
        };
      });
  }, [version_configs]);

  const onToggle = (open: boolean, key: number) => {
    setCollapseKey(open ? new Set([key]) : new Set());
  };

  const add = () => {
    const versions = form.getFieldValue('version_configs') || [];
    const newVersion = {
      version_no: '',
      image_name: '',
      run_command: '',
      isBuiltin: false,
      is_default: false
    };
    form.setFieldValue('version_configs', [...versions, newVersion]);
  };

  const handleAdd = async () => {
    try {
      const isValid = await form.validateFields(['version_configs'], {
        recursive: true
      });
      if (isValid) {
        add();
        setTimeout(() => {
          setCollapseKey(new Set([version_configs?.length]));
        }, 100);
      }
    } catch (error) {
      const errorKey = (error as any).errorFields?.[0]?.name?.[1];
      if (typeof errorKey === 'number') {
        setCollapseKey(new Set([errorKey]));
      }
    }
  };

  const handleDefaultChange = (value: string) => {
    const versions = form.getFieldValue('version_configs') || [];
    const updatedVersions = versions.map((version: any, idx: number) => ({
      ...version,
      is_default: version.version_no === value
    }));
    form.setFieldValue('version_configs', updatedVersions);
    setDefaultVersion(value);
  };

  useEffect(() => {
    const versions = form.getFieldValue('version_configs') || [];

    if (Array.isArray(versions) && versions.length === 0) {
      form.setFieldValue('version_configs', versionList);
    }
  }, []);

  useEffect(() => {
    if (activeKey && activeKey.length > 0) {
      setCollapseKey(new Set(activeKey));
    }
  }, [activeKey]);

  useEffect(() => {
    if (currentData?.default_version) {
      setDefaultVersion(currentData.default_version);
    }
  }, [currentData?.default_version]);

  const handleVersionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Version changed:', e.target.value);
  };

  return (
    <>
      <Title>
        <span className="flex-center gap-8">
          <span>
            {intl.formatMessage({ id: 'backend.form.versionConfig' })}
          </span>
          <Button onClick={handleAdd} type="link">
            <PlusOutlined /> {intl.formatMessage({ id: 'backend.addVersion' })}
          </Button>
        </span>
        {!currentData?.is_built_in && (
          <BaseSelect
            prefix={
              <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
                {intl.formatMessage({ id: 'backend.isDefault' })}:
              </span>
            }
            value={defaultVersion}
            notFoundContent={
              <div
                className="justify-center"
                style={{ paddingBlock: '8px 7px' }}
              >
                {intl.formatMessage({
                  id: 'backend.form.noVersion'
                })}
              </div>
            }
            placeholder={intl.formatMessage({ id: 'backend.version' })}
            options={validVersions}
            style={{ width: 200, fontWeight: 400 }}
            allowClear
            onChange={handleDefaultChange}
          />
        )}
      </Title>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <Form.List name="version_configs">
          {(
            fields: Array<{ key: React.Key; name: number }>,
            { add, remove }
          ) => {
            const versionConfigs = form.getFieldValue('version_configs');
            return fields?.map(({ key, name }) => (
              <div
                key={name}
                style={{
                  borderRadius: 'var(--ant-border-radius)',
                  border: '1px solid var(--ant-color-split)'
                }}
              >
                <CollapsibleContainer
                  collapsible={true}
                  showExpandIcon={true}
                  key={name}
                  defaultOpen
                  styles={{
                    body: collapseKey.has(name) ? { padding: 16 } : {},
                    content: { paddingTop: 0 },
                    header: {
                      backgroundColor: 'unset'
                    }
                  }}
                  open={collapseKey.has(name)}
                  title={
                    <Label>
                      <span>
                        {intl.formatMessage({ id: 'backend.version' })}:
                      </span>
                      <span>{versionConfigs[name]?.version_no}</span>
                      {versionConfigs[name]?.is_default && (
                        <DefaultTag>
                          {intl.formatMessage({ id: 'backend.isDefault' })}
                        </DefaultTag>
                      )}
                    </Label>
                  }
                  onToggle={(open) => onToggle(open, name)}
                  deleteBtn={false}
                  right={
                    <div className="flex-center gap-8">
                      <span
                        className="flex-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!currentData?.is_built_in && (
                          <Form.Item
                            name={[name, 'is_default']}
                            valuePropName="checked"
                            initialValue={false}
                            noStyle
                          ></Form.Item>
                        )}
                      </span>
                      {(fields.length > 1 || currentData?.is_built_in) && (
                        <Button
                          size="small"
                          shape="circle"
                          onClick={(e: any) => remove(name)}
                        >
                          <MinusOutlined />
                        </Button>
                      )}
                    </div>
                  }
                >
                  <Box>
                    <Form.Item
                      name={[name, 'version_no']}
                      rules={[
                        {
                          required: true,
                          message: getRuleMessage(`input`, 'backend.version')
                        }
                      ]}
                    >
                      <SealInput.Input
                        trim
                        addAfter="-custom"
                        onChange={handleVersionChange}
                        label={intl.formatMessage({ id: 'backend.version' })}
                        required
                      ></SealInput.Input>
                    </Form.Item>
                    <Form.Item
                      name={[name, 'image_name']}
                      rules={[
                        {
                          required: true,
                          message: getRuleMessage(`input`, 'backend.imageName')
                        }
                      ]}
                    >
                      <SealInput.Input
                        trim
                        label={intl.formatMessage({ id: 'backend.imageName' })}
                        required
                      ></SealInput.Input>
                    </Form.Item>
                  </Box>
                  <Form.Item
                    name={[name, 'custom_framework']}
                    rules={[
                      {
                        required: true,
                        message: getRuleMessage('select', 'backend.framework')
                      }
                    ]}
                  >
                    <SealSelect
                      label={intl.formatMessage({ id: 'backend.framework' })}
                      options={frameworks}
                      required
                    />
                  </Form.Item>
                  <Form.Item
                    name={[name, 'run_command']}
                    style={{ marginBottom: 0 }}
                  >
                    <SealInput.TextArea
                      allowClear
                      label={intl.formatMessage({ id: 'backend.runCommand' })}
                    ></SealInput.TextArea>
                  </Form.Item>
                </CollapsibleContainer>
              </div>
            ));
          }}
        </Form.List>
      </div>
    </>
  );
};

export default VersionsForm;
