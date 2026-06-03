import { PageActionType } from '@/config/types';
import { Input as CInput, LabelSelector, SwitchCard } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import styled from 'styled-components';
import ImageCredential from './image-credential';
import K8SVolumeMount from './k8s-volume-mount';

const SectionWrap = styled.div`
  margin-bottom: 16px;
`;

// SwitchCard always renders a content <div> while the switch is on (it's meant
// to wrap expandable children). We render no children here, so that div is
// empty — but the card is a flex column with an 8px gap, so the empty div still
// adds height and makes the card jump as the switch toggles. Hide it.
const SwitchCardWrap = styled.div`
  & > div > div:empty {
    display: none;
  }
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

export const OperatorImageForm: React.FC = () => {
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

// The presence of `gpuInstanceOptions` on `k8s_options` is the source of truth
// for whether GPU instances are enabled. Both the switch (rendered up top) and
// the static-address field (rendered in the advanced section) watch this same
// path so they stay in sync without sharing local state.
const GPU_INSTANCE_OPTIONS_PATH = ['k8s_options', 'gpuInstanceOptions'];

// Standalone switch shown directly under the cluster description. Toggling it
// only flips the presence of `gpuInstanceOptions` on the form; the related
// inputs live in the advanced section.
export const GpuInstanceServiceSwitch: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  // `preserve: true` makes useWatch read the full form store rather than only
  // registered fields — required here because `gpuInstanceOptions` is set via
  // setFieldValue and has no mounted Form.Item of its own while the switch is
  // off, so a default watch would never see it flip on.
  const gpuInstanceOptions = Form.useWatch(GPU_INSTANCE_OPTIONS_PATH, {
    form,
    preserve: true
  });
  const enabled = !!gpuInstanceOptions;

  const handleToggle = (checked: boolean) => {
    if (!form) return;
    // When on, ensure the object exists (defaulting to {} so it survives even
    // when the static address is left blank); when off, remove it entirely.
    if (checked) {
      form.setFieldValue(
        GPU_INSTANCE_OPTIONS_PATH,
        form.getFieldValue(GPU_INSTANCE_OPTIONS_PATH) ?? {}
      );
    } else {
      form.setFieldValue(GPU_INSTANCE_OPTIONS_PATH, undefined);
    }
  };

  return (
    <SwitchCardWrap>
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
      />
    </SwitchCardWrap>
  );
};

// Static access address for GPU instances. Only shown while the GPU instance
// service switch is on, mirroring the previous in-card behaviour. Rendered in
// the advanced section, between the default container registry and the worker
// config (节点配置).
export const GpuInstancesStaticAddressForm: React.FC = () => {
  const intl = useIntl();
  // See note in GpuInstanceServiceSwitch: watch the full store so this field's
  // visibility tracks the switch even before it has mounted its own Form.Item.
  const enabled = !!Form.useWatch(GPU_INSTANCE_OPTIONS_PATH, {
    preserve: true
  });

  if (!enabled) {
    return null;
  }

  return (
    <SectionWrap>
      <Form.Item
        name={[
          'k8s_options',
          'gpuInstanceOptions',
          'gpuInstancesAccessStaticAddress'
        ]}
        style={{ marginBottom: 0 }}
        normalize={(value) => value || null}
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
    </SectionWrap>
  );
};

// Kubernetes-specific options that live inside the cluster's advanced section.
const K8sAdvancedOptions: React.FC<{
  action: PageActionType;
}> = ({ action }) => {
  return (
    <>
      <NamespaceForm />
      <K8SVolumeMount action={action}></K8SVolumeMount>
      <ImageCredential />
      <NodeSelectorForm />
    </>
  );
};

export default K8sAdvancedOptions;
