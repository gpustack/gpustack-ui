import { PageActionType } from '@/config/types';
import {
  MinusOutlined,
  PlusOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import {
  Input as CInput,
  LabelSelector,
  SwitchCard,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Form, Tooltip } from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';
import { GpuInstanceOptions } from '../config/types';
import K8SVolumeMount from './k8s-volume-mount';

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: transparent;
  font-weight: 500;
  font-size: 14px;
  padding-top: 0px;
  padding-bottom: 8px;
`;

const SectionWrap = styled.div`
  margin-bottom: 16px;
`;

const ImageCredentialsForm: React.FC = () => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();

  return (
    <SectionWrap>
      <Form.List name={['k8s_options', 'imageCredentials']}>
        {(fields, { add, remove }) => (
          <>
            <Title>
              <div className="flex-center gap-8">
                <span>
                  {intl.formatMessage({
                    id: 'clusters.imageCredentials.title'
                  })}
                </span>
                <Button
                  type="link"
                  onClick={() =>
                    add({ registry: '', username: '', password: '' })
                  }
                >
                  <PlusOutlined />{' '}
                  {intl.formatMessage({
                    id: 'clusters.imageCredentials.add'
                  })}
                </Button>
              </div>
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {fields.map(({ key, name }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: 12,
                    border: '1px solid var(--ant-color-split)',
                    borderRadius: 'var(--ant-border-radius-lg)'
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}
                  >
                    <Form.Item
                      name={[name, 'registry']}
                      rules={[
                        {
                          required: true,
                          message: getRuleMessage(
                            'input',
                            'clusters.imageCredentials.registry'
                          )
                        }
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <CInput.Input
                        required
                        label={intl.formatMessage({
                          id: 'clusters.imageCredentials.registry'
                        })}
                      ></CInput.Input>
                    </Form.Item>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Form.Item
                          name={[name, 'username']}
                          style={{ marginBottom: 0 }}
                        >
                          <CInput.Input
                            label={intl.formatMessage({
                              id: 'clusters.imageCredentials.username'
                            })}
                          ></CInput.Input>
                        </Form.Item>
                      </div>
                      <div style={{ flex: 1 }}>
                        <Form.Item
                          name={[name, 'password']}
                          style={{ marginBottom: 0 }}
                        >
                          <CInput.Password
                            label={intl.formatMessage({
                              id: 'clusters.imageCredentials.password'
                            })}
                          ></CInput.Password>
                        </Form.Item>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="small"
                    shape="circle"
                    style={{ marginTop: 8 }}
                    onClick={() => remove(name)}
                  >
                    <MinusOutlined />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </Form.List>
    </SectionWrap>
  );
};

const NodeSelectorForm: React.FC = () => {
  const intl = useIntl();

  return (
    <SectionWrap>
      <Title>
        <span className="flex-center gap-4">
          <span>
            {intl.formatMessage({ id: 'clusters.nodeSelector.title' })}
          </span>
          <Tooltip
            title={intl.formatMessage({ id: 'clusters.nodeSelector.tip' })}
          >
            <QuestionCircleOutlined
              style={{ color: 'var(--ant-color-text-secondary)' }}
            />
          </Tooltip>
        </span>
      </Title>
      <Form.Item name={['k8s_options', 'nodeSelector']}>
        <LabelSelector
          label={intl.formatMessage({ id: 'clusters.nodeSelector.title' })}
        ></LabelSelector>
      </Form.Item>
    </SectionWrap>
  );
};

// Render namespace. Kept as the first field of the section so the most
// fundamental K8s deployment knob is set before the rest.
const NamespaceForm: React.FC = () => {
  const intl = useIntl();

  return (
    <SectionWrap>
      <Form.Item
        name={['k8s_options', 'namespace']}
        style={{ marginBottom: 0 }}
        normalize={(value) => value || null}
      >
        <CInput.Input
          label={intl.formatMessage({ id: 'clusters.namespace.title' })}
          description={intl.formatMessage({ id: 'clusters.namespace.tip' })}
          placeholder="gpustack-system"
        ></CInput.Input>
      </Form.Item>
    </SectionWrap>
  );
};

// Operator-image override. A plain string knob that used to ride along inside
// worker_config; it now lives directly on k8s_options.
const OperatorImageForm: React.FC = () => {
  const intl = useIntl();

  return (
    <SectionWrap>
      <Form.Item
        name={['k8s_options', 'operatorImage']}
        style={{ marginBottom: 0 }}
        normalize={(value) => value || null}
      >
        <CInput.Input
          label={intl.formatMessage({ id: 'clusters.operatorImage.title' })}
          description={intl.formatMessage({ id: 'clusters.operatorImage.tip' })}
        ></CInput.Input>
      </Form.Item>
    </SectionWrap>
  );
};

const GpuInstanceOptionsForm: React.FC<{
  initialValue?: GpuInstanceOptions;
}> = ({ initialValue }) => {
  const intl = useIntl();
  const [enabled, setEnabled] = useState<boolean>(!!initialValue);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
  };

  return (
    <SwitchCard
      styles={{
        wrapper: {
          borderRadius: 'var(--ant-border-radius-lg)',
          paddingInline: 14,
          marginBottom: 24
        }
      }}
      value={enabled}
      onChange={handleToggle}
      label={intl.formatMessage({ id: 'clusters.gpuInstances.title' })}
      description={intl.formatMessage({ id: 'clusters.gpuInstances.tip' })}
    >
      <Form.Item
        name={[
          'k8s_options',
          'gpuInstanceOptions',
          'gpuInstancesAccessStaticAddress'
        ]}
        normalize={(value) => value || null}
        noStyle
      >
        <CInput.Input
          label={intl.formatMessage({
            id: 'clusters.gpuInstances.staticAddress'
          })}
          description={intl.formatMessage({
            id: 'clusters.gpuInstances.staticAddress.tip'
          })}
        ></CInput.Input>
      </Form.Item>
    </SwitchCard>
  );
};

const K8sPodSpec: React.FC<{
  action: PageActionType;
  initialGpuInstanceOptions?: GpuInstanceOptions;
}> = ({ action, initialGpuInstanceOptions }) => {
  return (
    <>
      <GpuInstanceOptionsForm initialValue={initialGpuInstanceOptions} />
      <NamespaceForm />
      <K8SVolumeMount action={action}></K8SVolumeMount>
      <ImageCredentialsForm />
      <NodeSelectorForm />
      <OperatorImageForm />
    </>
  );
};

export default K8sPodSpec;
