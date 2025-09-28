import SealInput from '@/components/seal-form/seal-input';
import { PageActionType } from '@/config/types';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Divider, Form, Radio } from 'antd';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { ListItem } from '../config/types';

const Box = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
  align-items: center;
`;

const ItemWrapper = styled.div``;

type AddModalProps = {
  action: PageActionType;
  currentData?: ListItem;
};
const VersionsForm: React.FC<AddModalProps> = ({ action, currentData }) => {
  const form = Form.useFormInstance();
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
              border: '1px solid var(--ant-color-border)',
              borderRadius: 'var(--border-radius-base)',
              padding: '14px'
            }}
          >
            {fields.map(({ key, name, ...restField }, index) => (
              <ItemWrapper key={key}>
                <Box>
                  <Form.Item
                    {...restField}
                    name={[name, 'version_no']}
                    rules={[{ required: true, message: 'Version is required' }]}
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
                <Form.Item name={[name, 'run_command']} {...restField}>
                  <SealInput.TextArea label="Execution Command"></SealInput.TextArea>
                </Form.Item>
                <Form.Item name={[name, 'isBuiltin']} {...restField} hidden>
                  <Checkbox></Checkbox>
                </Form.Item>
                <div className="flex justify-between items-center">
                  <span className="flex-center">
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
                          Set as Default Version
                        </Radio>
                      </Form.Item>
                    )}
                  </span>
                  {
                    <div className="flex-center gap-16">
                      {fields.length > 1 && (
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
                </div>
                <Divider
                  className="divider"
                  style={{ borderTop: '1px  dashed var(--ant-color-border)' }}
                />
                {index === fields.length - 1 && (
                  <Button
                    onClick={() => add()}
                    block
                    variant="filled"
                    color="default"
                  >
                    <PlusOutlined /> Add Version
                  </Button>
                )}
              </ItemWrapper>
            ))}
          </div>
        );
      }}
    </Form.List>
  );
};

export default VersionsForm;
