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
            <Label>Custom Versions</Label>
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
                <Form.Item name={[name, 'run_command']} {...restField} noStyle>
                  <SealInput.TextArea label="Execution Command"></SealInput.TextArea>
                </Form.Item>
                <ActionWrapper>
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
                  <div className="flex-center gap-16">
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
                </ActionWrapper>
                <Divider
                  className="divider"
                  style={{ borderTop: '1px  dashed var(--ant-color-border)' }}
                />
              </ItemWrapper>
            ))}
            <Button
              onClick={() => add()}
              block
              variant="filled"
              color="default"
            >
              <PlusOutlined /> Add Version
            </Button>
          </div>
        );
      }}
    </Form.List>
  );
};

export default VersionsForm;
