import AutoTooltip from '@/components/auto-tooltip';
import CollapsibleContainer from '@/components/collapse-container';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageActionType } from '@/config/types';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Form, Radio } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { frameworks } from '../config';
import { ListItem } from '../config/types';
import { VersionItem } from './built-in-versions';

const Box = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 16px;
  align-items: center;
`;

const Label = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ant-color-text-secondary);
`;

const ImageInner = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 20px;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 8px;
`;

const VersionItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px 16px;
  border-radius: var(--ant-border-radius);
  background-color: var(--ant-color-fill-quaternary);
  width: 100%;
`;

type AddModalProps = {
  action: PageActionType;
  currentData?: ListItem;
  activeKey?: number[];
};
const VersionsForm: React.FC<AddModalProps> = ({
  action,
  currentData,
  activeKey
}) => {
  const defaultCollapseKey =
    action === 'edit' ? new Set<number>() : new Set([0]);
  const form = Form.useFormInstance();
  const version_configs = Form.useWatch('version_configs', form);
  const buildInVersionConfigs = Form.useWatch('build_in_version_configs', form);
  const [collapseKey, setCollapseKey] =
    React.useState<Set<number>>(defaultCollapseKey);
  const versionList = [
    {
      version_no: '',
      image_name: '',
      run_command: '',
      isBuiltin: false,
      is_default: true
    }
  ];

  const handleSetDefaultVersion = (e: any, index: number) => {
    const versions = form.getFieldValue('version_configs') || [];
    const updatedVersions = versions.map((version: any, idx: number) => ({
      ...version,
      is_default: idx === index
    }));
    form.setFieldValue('version_configs', updatedVersions);
  };

  const handleVersionOnBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    index: number
  ) => {
    const inputValue = e.target.value.trim() || '';
    const versions = form.getFieldValue('version_configs') || [];
    console.log('inputValue:', version_configs, currentData);
    const isDuplicate =
      _.get(currentData, ['build_in_version_configs', inputValue]) ||
      versions.some(
        (version: any, idx: number) =>
          version?.version_no === inputValue && idx !== index
      );
    if (isDuplicate) {
      const updatedVersions = [...versions];
      updatedVersions[index].version_no = '';
      form.setFieldValue('version_configs', updatedVersions);
    }
  };

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

  const remove = (versions: any[], index: number) => {
    const updatedVersions = versions.filter(
      (_: any, idx: number) => idx !== index
    );
    // If the removed version was the default, set the first version as default
    if (versions[index].is_default && updatedVersions.length > 0) {
      updatedVersions[0].is_default = true;
    }
    form.setFieldValue('version_configs', updatedVersions);
  };

  const handleAdd = async () => {
    try {
      const isValid = await form.validateFields(['version_configs'], {
        recursive: true
      });
      console.log('isValid:', isValid, version_configs);
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

  return (
    <>
      <Form.Item name="version_configs" hidden></Form.Item>
      <Form.Item name="build_in_version_configs" hidden></Form.Item>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '24px'
        }}
      >
        <Title>
          <span>Versions Config</span>
          <Button onClick={handleAdd} variant="filled" color="default">
            <PlusOutlined /> Add Version
          </Button>
        </Title>
        {buildInVersionConfigs?.map((item: any, index: number) => (
          <>
            <VersionItemWrapper>
              <VersionItem data={item} />
            </VersionItemWrapper>
            <Divider
              className="divider"
              style={{
                borderTop: '1px  dashed var(--ant-color-border)'
              }}
            />
          </>
        ))}
        {version_configs?.map((item: any, index: number) => (
          <>
            <CollapsibleContainer
              collapsible={true}
              showExpandIcon={true}
              key={index}
              defaultOpen
              open={collapseKey.has(index)}
              title={
                <Label>
                  <span>Version:</span>
                  <span>{item.version_no}</span>
                </Label>
              }
              subtitle={
                item.image_name && (
                  <ImageInner>
                    <span>Image:</span>
                    <AutoTooltip ghost maxWidth={280}>
                      {item.image_name}
                    </AutoTooltip>
                  </ImageInner>
                )
              }
              onToggle={(open) => onToggle(open, index)}
              deleteBtn={false}
              right={
                <div className="flex-center gap-8">
                  <span
                    className="flex-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!currentData?.is_build_in && (
                      <Form.Item
                        name={['version_configs', index, 'is_default']}
                        valuePropName="checked"
                        initialValue={false}
                        noStyle
                      >
                        <Radio
                          onChange={(e: any) =>
                            handleSetDefaultVersion(e, index)
                          }
                        >
                          Default Version
                        </Radio>
                      </Form.Item>
                    )}
                  </span>
                  {(version_configs.length > 1 || currentData?.is_build_in) && (
                    <Button
                      size="small"
                      shape="circle"
                      onClick={() => remove(version_configs, index)}
                    >
                      <MinusOutlined />
                    </Button>
                  )}
                </div>
              }
            >
              <Box>
                <Form.Item
                  name={['version_configs', index, 'version_no']}
                  rules={[{ required: true, message: 'Version is required' }]}
                >
                  <SealInput.Input
                    trim
                    label="Version"
                    required
                  ></SealInput.Input>
                </Form.Item>
                <Form.Item
                  name={['version_configs', index, 'image_name']}
                  rules={[
                    { required: true, message: 'Image Name is required' }
                  ]}
                >
                  <SealInput.Input
                    trim
                    label="Image Name"
                    required
                  ></SealInput.Input>
                </Form.Item>
              </Box>
              <Form.Item name={['version_configs', index, 'run_command']}>
                <SealInput.TextArea label="Execution Command"></SealInput.TextArea>
              </Form.Item>
              <Form.Item
                name={['version_configs', index, 'custom_framework']}
                style={{ marginBottom: 0 }}
              >
                <SealSelect label="Framework" options={frameworks} />
              </Form.Item>
            </CollapsibleContainer>
            {index < version_configs.length - 1 && (
              <Divider
                className="divider"
                style={{
                  borderTop: '1px  dashed var(--ant-color-border)'
                }}
              />
            )}
          </>
        ))}
      </div>
    </>
  );
};

export default VersionsForm;
