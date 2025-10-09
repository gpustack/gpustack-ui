import CollapsibleContainer from '@/components/collapse-container';
import SealInput from '@/components/seal-form/seal-input';
import { PageActionType } from '@/config/types';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Form, Radio } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { ListItem } from '../config/types';

const Box = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
  align-items: center;
`;

const ActionWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 8px;
`;

const Label = styled.div`
  line-height: 1;
  color: var(--ant-color-text-tertiary);
  margin-bottom: 20px;
  font-size: var(--font-size-base);
`;

const ItemWrapper = styled.div``;

type AddModalProps = {
  action: PageActionType;
  currentData?: ListItem;
};
const VersionsForm: React.FC<AddModalProps> = ({ action, currentData }) => {
  const form = Form.useFormInstance();
  const version_configs = Form.useWatch('version_configs', form);
  const [collapseKey, setCollapseKey] = React.useState<string[]>(['0']);
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

  const onToggle = (open: boolean, key: string) => {
    setCollapseKey(open ? [key] : []);
  };

  const handleAdd = async (add: (defaultValue?: any) => void) => {
    try {
      const isValid = await form.validateFields(['version_configs'], {
        recursive: true
      });
      console.log('isValid:', isValid);
      if (isValid) {
        add();
      }
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  useEffect(() => {
    const versions = form.getFieldValue('version_configs') || [];
    console.log('versions:', versions);
    if (Array.isArray(versions) && versions.length === 0) {
      form.setFieldValue('version_configs', versionList);
    }
  }, []);

  return (
    <Form.List name="version_configs">
      {(fields, { add, remove }) => {
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '24px'
            }}
          >
            <Title>
              <span>Version Configurations</span>
              <Button
                onClick={() => handleAdd(add)}
                variant="filled"
                color="default"
              >
                <PlusOutlined /> Add Version
              </Button>
            </Title>
            {fields.map(({ key, name, ...restField }, index) => (
              <>
                <CollapsibleContainer
                  collapsible={true}
                  key={key}
                  defaultOpen
                  open={collapseKey.includes(String(key))}
                  title={<span>{version_configs[name]?.version_no}</span>}
                  subtitle={
                    version_configs[name]?.image_name && (
                      <span style={{ marginLeft: 20 }}>
                        {version_configs[name]?.image_name}
                      </span>
                    )
                  }
                  onToggle={(open) => onToggle(open, key + '')}
                  deleteBtn={false}
                  right={
                    <div className="flex-center gap-8">
                      <span
                        className="flex-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!currentData?.is_build_in && (
                          <Form.Item
                            {...restField}
                            name={[name, 'is_default']}
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
                      {(fields.length > 1 || currentData?.is_build_in) && (
                        <Button
                          size="small"
                          onClick={() => remove(name)}
                          shape="circle"
                        >
                          <MinusOutlined />
                        </Button>
                      )}
                    </div>
                  }
                >
                  <Box>
                    <Form.Item
                      {...restField}
                      name={[name, 'version_no']}
                      rules={[
                        { required: true, message: 'Version is required' }
                      ]}
                    >
                      <SealInput.Input
                        trim
                        label="Version"
                        required
                      ></SealInput.Input>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'image_name']}
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
                  <Form.Item
                    name={[name, 'run_command']}
                    {...restField}
                    noStyle
                  >
                    <SealInput.TextArea label="Execution Command"></SealInput.TextArea>
                  </Form.Item>
                </CollapsibleContainer>
                {index < fields.length - 1 && (
                  <Divider
                    className="divider"
                    style={{ borderTop: '1px  dashed var(--ant-color-border)' }}
                  />
                )}
              </>
            ))}
          </div>
        );
      }}
    </Form.List>
  );
};

export default VersionsForm;
