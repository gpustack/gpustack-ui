import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { Input as CInput, LabelSelector, SwitchCard } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { ClusterListItem as ListItem } from '../config/types';
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

// Strip UI-only / undefined-valued noise so two k8s_options snapshots compare
// on real content. `sourceType` is derived from `volumeSource` purely for the
// volume-mount UI (see cluster-form init), and the JSON round-trip drops
// undefined-valued keys so a missing key and `key: undefined` compare equal.
const cleanK8sOptions = (opts: any) => {
  const cloned = _.cloneDeep(opts || {});
  if (Array.isArray(cloned.volumeMounts)) {
    cloned.volumeMounts = cloned.volumeMounts.map(
      ({ sourceType, ...rest }: any) => rest
    );
  }
  // The edit form always seeds k8s_options.volumeMounts to [] even when the
  // saved cluster had no value, so an absent field would otherwise read as a
  // change the moment the drawer opens. Drop empty top-level arrays on both
  // sides: "absent" and "empty list" both mean nothing configured. A
  // non-empty -> empty edit is still detected, since only the empty side drops.
  Object.keys(cloned).forEach((key) => {
    if (Array.isArray(cloned[key]) && cloned[key].length === 0) {
      delete cloned[key];
    }
  });
  return JSON.parse(JSON.stringify(cloned));
};

// Headless watcher: in EDIT mode it reports (via onChange) whether the user has
// changed any k8s_options field from the cluster's saved values. It renders
// nothing — the notice itself is shown in the form footer, above Save/Cancel
// (see cluster-create.tsx), mirroring the model edit interaction. Must be
// mounted inside the cluster <Form> so the watch reads the form store.
export const K8sOptionsChangeWatcher: React.FC<{
  action: PageActionType;
  currentData?: ListItem;
  onChange: (changed: boolean) => void;
}> = ({ action, currentData, onChange }) => {
  // `preserve: true` so the watch tracks the full store, including
  // gpuInstanceOptions which is toggled via setFieldValue without a mounted
  // Form.Item (mirrors GpuInstanceServiceSwitch).
  const k8sOptions = Form.useWatch(['k8s_options'], { preserve: true });

  const changed =
    action === PageAction.EDIT &&
    !_.isEqual(
      cleanK8sOptions(currentData?.k8s_options),
      cleanK8sOptions(k8sOptions)
    );

  useEffect(() => {
    onChange(changed);
  }, [changed, onChange]);

  // Clear the footer notice when this form unmounts (e.g. switching steps or
  // provider) so a stale warning never lingers over the buttons.
  useEffect(() => {
    return () => onChange(false);
  }, [onChange]);

  return null;
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
