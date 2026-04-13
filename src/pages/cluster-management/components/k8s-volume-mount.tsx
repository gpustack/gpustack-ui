import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Input as CInput,
  CollapseContainer,
  Checkbox as SealCheckbox,
  Select as SealSelect,
  Switch as SealSwitch,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Form } from 'antd';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { hostTypeOptions, sourceTypeOptions } from '../config';

const Label = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ant-color-text-secondary);
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--ant-color-bg-container);
  font-weight: 500;
  font-size: 14px;
  padding-top: 0px;
  padding-bottom: 8px;
`;

const VolumeMountsForm: React.FC<{ action: PageActionType }> = ({ action }) => {
  const form = Form.useFormInstance();
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const k8sVolumeMounts = Form.useWatch('k8s_volume_mounts', form);

  const [collapseKey, setCollapseKey] = useState<Set<number | string>>(
    new Set([0])
  );

  const volumeList = [
    {
      name: 'volume-1',
      mountPath: '',
      readOnly: false,
      sourceType: 'hostPath',
      volumeSource: {
        hostPath: {
          path: '',
          type: 'DirectoryOrCreate'
        }
      }
    }
  ];

  useEffect(() => {
    if (action === PageAction.CREATE) {
      form.setFieldValue('k8s_volume_mounts', []);
    }
  }, [action]);

  const onToggle = (open: boolean, key: number) => {
    setCollapseKey(open ? new Set([key]) : new Set());
  };

  const handleAdd = async () => {
    try {
      await form.validateFields(['k8s_volume_mounts'], {
        recursive: true
      });

      const list = form.getFieldValue('k8s_volume_mounts') || [];

      form.setFieldValue('k8s_volume_mounts', [
        ...list,
        {
          name: `volume-${list.length + 1}`,
          mountPath: '',
          readOnly: false,
          sourceType: 'hostPath',
          volumeSource: {
            hostPath: {
              path: '',
              type: 'DirectoryOrCreate'
            }
          }
        }
      ]);

      setTimeout(() => {
        setCollapseKey(new Set([list.length]));
      }, 100);
    } catch (e: any) {
      const errorIndex = e?.errorFields?.[0]?.name?.[1];
      if (typeof errorIndex === 'number') {
        setCollapseKey(new Set([errorIndex]));
      }
    }
  };

  const handleSourceChange = (value: string, index: number) => {
    let volumeSource: any = {};

    if (value === 'hostPath') {
      volumeSource = {
        hostPath: { path: '', type: 'DirectoryOrCreate' }
      };
    } else if (value === 'persistentVolumeClaim') {
      volumeSource = {
        persistentVolumeClaim: { claimName: '', readOnly: false }
      };
    } else if (value === 'configMap') {
      volumeSource = {
        configMap: { name: '', optional: false }
      };
    }

    form.setFieldValue(
      ['k8s_volume_mounts', index, 'volumeSource'],
      volumeSource
    );
  };

  return (
    <>
      <Title>
        <div className="flex-center gap-8">
          <span>{intl.formatMessage({ id: 'clusters.volume.title' })}</span>
          <Button type="link" onClick={handleAdd}>
            <PlusOutlined /> {intl.formatMessage({ id: 'clusters.volume.add' })}
          </Button>
        </div>
      </Title>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '8px'
        }}
      >
        <Form.List name="k8s_volume_mounts">
          {(fields, { remove }) => {
            const list = form.getFieldValue('k8s_volume_mounts') || [];

            return fields.map(({ name }) => {
              const item = list[name] || {};

              return (
                <div
                  key={name}
                  style={{
                    border: '1px solid var(--ant-color-split)',
                    borderRadius: 'var(--ant-border-radius-lg)'
                  }}
                >
                  <CollapseContainer
                    collapsible={true}
                    showExpandIcon={true}
                    open={collapseKey.has(name)}
                    onToggle={(open: boolean) => onToggle(open, name)}
                    styles={{
                      body: collapseKey.has(name) ? { padding: 16 } : {},
                      content: { paddingTop: 0 },
                      header: {
                        backgroundColor: 'unset'
                      }
                    }}
                    title={
                      <Label>
                        <span>
                          {intl.formatMessage({ id: 'clusters.volume.name' })}:
                        </span>
                        <span>{item.name}</span>
                      </Label>
                    }
                    right={
                      <>
                        {name > 0 && (
                          <Button
                            size="small"
                            shape="circle"
                            onClick={() => remove(name)}
                          >
                            <MinusOutlined />
                          </Button>
                        )}
                      </>
                    }
                  >
                    <Form.Item
                      name={[name, 'name']}
                      rules={[
                        {
                          required: true,
                          message: getRuleMessage(
                            'input',
                            'clusters.volume.name'
                          )
                        }
                      ]}
                    >
                      <CInput.Input
                        label={intl.formatMessage({
                          id: 'clusters.volume.name'
                        })}
                        required
                      ></CInput.Input>
                    </Form.Item>
                    <Flex style={{ gap: 16, width: '100%' }}>
                      {/* Mount Path */}
                      <div style={{ flex: 1 }}>
                        <Form.Item
                          name={[name, 'mountPath']}
                          rules={[
                            {
                              required: true,
                              message: getRuleMessage(
                                'input',
                                'clusters.volume.mountPath'
                              )
                            },
                            {
                              pattern: /^\//,
                              message: intl.formatMessage({
                                id: 'clusters.volume.mountPath.format'
                              })
                            }
                          ]}
                        >
                          <CInput.Input
                            required
                            disabled={name === 0}
                            placeholder={intl.formatMessage({
                              id: 'clusters.volume.mountPath.format'
                            })}
                            label={intl.formatMessage({
                              id: 'clusters.volume.mountPath'
                            })}
                          ></CInput.Input>
                        </Form.Item>
                      </div>

                      {/* ReadOnly */}
                      <Form.Item
                        style={{ width: 240 }}
                        name={[name, 'readOnly']}
                        valuePropName="checked"
                      >
                        <SealSwitch
                          disabled={name === 0}
                          label={intl.formatMessage({
                            id: 'clusters.volume.readOnly'
                          })}
                        />
                      </Form.Item>
                    </Flex>

                    {/* Source Type */}
                    <Form.Item
                      name={[name, 'sourceType']}
                      rules={[
                        {
                          required: true,
                          message: getRuleMessage(
                            'select',
                            'clusters.volume.sourceType'
                          )
                        }
                      ]}
                    >
                      <SealSelect
                        required
                        disabled={name === 0}
                        label={intl.formatMessage({
                          id: 'clusters.volume.sourceType'
                        })}
                        onChange={(value) => handleSourceChange(value, name)}
                        options={sourceTypeOptions}
                        value={item.sourceType}
                      ></SealSelect>
                    </Form.Item>

                    {/* Dynamic Source Form */}
                    {item.sourceType === 'hostPath' && (
                      <Flex style={{ gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <Form.Item
                            name={[name, 'volumeSource', 'hostPath', 'path']}
                            rules={[
                              {
                                required: true,
                                message: getRuleMessage(
                                  'input',
                                  'clusters.volume.hostPath.path'
                                )
                              },
                              {
                                pattern: /^\//,
                                message: intl.formatMessage({
                                  id: 'clusters.volume.mountPath.format'
                                })
                              }
                            ]}
                          >
                            <CInput.Input
                              required
                              placeholder={intl.formatMessage({
                                id: 'clusters.volume.mountPath.format'
                              })}
                              label={intl.formatMessage({
                                id: 'clusters.volume.sourceType.hostPath'
                              })}
                            ></CInput.Input>
                          </Form.Item>
                        </div>

                        <Form.Item
                          style={{ width: 240 }}
                          name={[name, 'volumeSource', 'hostPath', 'type']}
                          rules={[
                            {
                              required: true,
                              message: getRuleMessage(
                                'select',
                                'clusters.volume.hostPath.type'
                              )
                            }
                          ]}
                        >
                          <SealSelect
                            required
                            disabled={name === 0}
                            options={hostTypeOptions}
                            label={intl.formatMessage({
                              id: 'clusters.volume.hostPath.type'
                            })}
                          ></SealSelect>
                        </Form.Item>
                      </Flex>
                    )}

                    {item.sourceType === 'persistentVolumeClaim' && (
                      <Flex style={{ gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <Form.Item
                            name={[
                              name,
                              'volumeSource',
                              'persistentVolumeClaim',
                              'claimName'
                            ]}
                            rules={[
                              {
                                required: true,
                                message: getRuleMessage(
                                  'input',
                                  'clusters.volume.pvc.claimName'
                                )
                              }
                            ]}
                          >
                            <CInput.Input
                              label={intl.formatMessage({
                                id: 'clusters.volume.pvc.claimName'
                              })}
                              required
                            />
                          </Form.Item>
                        </div>
                      </Flex>
                    )}

                    {item.sourceType === 'configMap' && (
                      <Flex style={{ gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <Form.Item
                            name={[name, 'volumeSource', 'configMap', 'name']}
                            rules={[
                              {
                                required: true,
                                message: getRuleMessage(
                                  'input',
                                  'clusters.volume.configMap.name'
                                )
                              }
                            ]}
                          >
                            <CInput.Input
                              label={intl.formatMessage({
                                id: 'clusters.volume.configMap.name'
                              })}
                              required
                            />
                          </Form.Item>
                        </div>

                        <Form.Item
                          style={{ width: 240 }}
                          name={[name, 'volumeSource', 'configMap', 'optional']}
                          valuePropName="checked"
                        >
                          <SealCheckbox
                            label={intl.formatMessage({
                              id: 'clusters.volume.configMap.optional'
                            })}
                          />
                        </Form.Item>
                      </Flex>
                    )}
                  </CollapseContainer>
                </div>
              );
            });
          }}
        </Form.List>
      </div>
    </>
  );
};

export default VolumeMountsForm;
