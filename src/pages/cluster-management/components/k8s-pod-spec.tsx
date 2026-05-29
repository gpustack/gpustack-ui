import { PageActionType } from '@/config/types';
import {
  MinusOutlined,
  PlusOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { Input as CInput, LabelSelector, useAppUtils } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Form, Switch, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
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
      >
        <CInput.Input
          label={intl.formatMessage({ id: 'clusters.operatorImage.title' })}
          description={intl.formatMessage({ id: 'clusters.operatorImage.tip' })}
        ></CInput.Input>
      </Form.Item>
    </SectionWrap>
  );
};

// GPU-instance support. The backend treats the mere presence of
// `gpuInstanceOptions` as the enable flag, so the switch toggles the whole
// object in/out of the form rather than setting a boolean field; the static
// address (optional even when enabled) is nested underneath.
//
// We drive the toggle from local state (not Form.useWatch) because the
// gpuInstanceOptions path has no registered Form.Item of its own — useWatch
// doesn't reliably re-render on setFieldValue for such paths, which left the
// switch unresponsive. Local state owns the visible state and we mirror it
// into the form via setFieldValue so submit still collects it.
const GpuInstanceOptionsForm: React.FC<{
  initialValue?: GpuInstanceOptions;
}> = ({ initialValue }) => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const [enabled, setEnabled] = useState<boolean>(!!initialValue);
  const [address, setAddress] = useState<string>(
    initialValue?.gpuInstancesAccessStaticAddress || ''
  );
  const initializedRef = useRef<boolean>(!!initialValue);

  const writeForm = (en: boolean, addr: string) => {
    form.setFieldValue(
      ['k8s_options', 'gpuInstanceOptions'],
      en ? { gpuInstancesAccessStaticAddress: addr } : undefined
    );
  };

  // Mirror a seeded initial value into the form on mount so submit collects it.
  useEffect(() => {
    if (initialValue) {
      writeForm(true, initialValue.gpuInstancesAccessStaticAddress || '');
    }
  }, []);

  // Adopt currentData arriving after mount (async edit load), once. After the
  // user has interacted (`initializedRef`), local state owns the section.
  useEffect(() => {
    if (initializedRef.current) return;
    if (initialValue) {
      setEnabled(true);
      setAddress(initialValue.gpuInstancesAccessStaticAddress || '');
      writeForm(true, initialValue.gpuInstancesAccessStaticAddress || '');
      initializedRef.current = true;
    }
  }, [initialValue]);

  const handleToggle = (checked: boolean) => {
    initializedRef.current = true;
    setEnabled(checked);
    if (!checked) {
      setAddress('');
    }
    writeForm(checked, checked ? address : '');
  };

  const handleAddressChange = (e: any) => {
    const next = typeof e === 'string' ? e : (e?.target?.value ?? '');
    setAddress(next);
    writeForm(true, next);
  };

  return (
    <SectionWrap>
      <Title>
        <div className="flex-center gap-8">
          <span className="flex-center gap-4">
            <span>
              {intl.formatMessage({ id: 'clusters.gpuInstances.title' })}
            </span>
            <Tooltip
              title={intl.formatMessage({ id: 'clusters.gpuInstances.tip' })}
            >
              <QuestionCircleOutlined
                style={{ color: 'var(--ant-color-text-secondary)' }}
              />
            </Tooltip>
          </span>
          <Switch checked={enabled} onChange={handleToggle} />
        </div>
      </Title>
      {enabled && (
        <CInput.Input
          isInFormItems={false}
          value={address}
          onChange={handleAddressChange}
          label={intl.formatMessage({
            id: 'clusters.gpuInstances.staticAddress'
          })}
          description={intl.formatMessage({
            id: 'clusters.gpuInstances.staticAddress.tip'
          })}
        ></CInput.Input>
      )}
    </SectionWrap>
  );
};

const K8sPodSpec: React.FC<{
  action: PageActionType;
  initialGpuInstanceOptions?: GpuInstanceOptions;
}> = ({ action, initialGpuInstanceOptions }) => {
  return (
    <>
      <NamespaceForm />
      <K8SVolumeMount action={action}></K8SVolumeMount>
      <ImageCredentialsForm />
      <NodeSelectorForm />
      <OperatorImageForm />
      <GpuInstanceOptionsForm initialValue={initialGpuInstanceOptions} />
    </>
  );
};

export default K8sPodSpec;
