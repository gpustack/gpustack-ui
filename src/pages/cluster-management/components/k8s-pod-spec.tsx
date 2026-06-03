import { PageActionType } from '@/config/types';
import { Input as CInput, LabelSelector, SwitchCard } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import styled from 'styled-components';
import ImageCredential from './image-credential';
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

const NodeSelectorForm: React.FC = () => {
  const intl = useIntl();

  return (
    <SectionWrap>
      <Form.Item name={['k8s_options', 'nodeSelector']}>
        <LabelSelector
          label={intl.formatMessage({ id: 'clusters.nodeSelector.title' })}
          description={intl.formatMessage({ id: 'clusters.nodeSelector.tip' })}
        ></LabelSelector>
      </Form.Item>
    </SectionWrap>
  );
};

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

const GpuInstanceOptionsForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  // The presence of `gpuInstanceOptions` on `k8s_options` is the source of
  // truth for whether GPU instances are enabled. Derive the toggle directly
  // from the watched form value rather than mirroring it into local state, so
  // it stays in sync when the form loads async values (EDIT) or resets.
  const gpuInstanceOptions = Form.useWatch(
    ['k8s_options', 'gpuInstanceOptions'],
    form
  );
  const enabled = !!gpuInstanceOptions;

  const handleToggle = (checked: boolean) => {
    if (!form) return;
    // The presence of `gpuInstanceOptions` is what signals "GPU instances
    // enabled" to the backend — when on, ensure the object exists (defaulting
    // to {} so it survives even when the static address is left blank); when
    // off, remove it entirely.
    const path = ['k8s_options', 'gpuInstanceOptions'];
    if (checked) {
      form.setFieldValue(path, form.getFieldValue(path) ?? {});
    } else {
      form.setFieldValue(path, undefined);
    }
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
}> = ({ action }) => {
  return (
    <>
      <GpuInstanceOptionsForm />
      <NamespaceForm />
      <K8SVolumeMount action={action}></K8SVolumeMount>
      <ImageCredential />
      <NodeSelectorForm />
      <OperatorImageForm />
    </>
  );
};

export default K8sPodSpec;
