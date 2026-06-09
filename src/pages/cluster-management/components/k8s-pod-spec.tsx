import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { Input as CInput, LabelSelector } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, { useEffect, useId, useMemo } from 'react';
import styled from 'styled-components';
import { ClusterListItem as ListItem } from '../config/types';
import ImageCredential from './image-credential';
import K8SVolumeMount from './k8s-volume-mount';

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
// for whether GPU instances are enabled. Both the cluster-type selector
// (rendered up top) and the static-address field (rendered in the advanced
// section) watch this same path so they stay in sync without sharing local
// state.
const GPU_INSTANCE_OPTIONS_PATH = ['k8s_options', 'gpuInstanceOptions'];

// Visual parity with @gpustack/core-ui's SwitchCard so the selector blends
// in with surrounding form fields: same border, radius, padding, and
// typography. The only differences are the two-column grid layout and an
// active state (blue border + tinted background) to mark the selection.
const ClusterTypeWrap = styled.div`
  margin-bottom: 24px;
`;

const ClusterTypeLabel = styled.div`
  color: var(--ant-color-text);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  .required {
    color: var(--ant-color-error);
    margin-left: 4px;
  }
`;

const ClusterTypeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const ClusterTypeCard = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--ant-border-radius-lg);
  border: 1px solid
    ${(p) =>
      p.$active ? 'var(--ant-color-primary)' : 'var(--ant-color-border)'};
  background: ${(p) =>
    p.$active ? 'var(--ant-color-primary-bg)' : 'transparent'};
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s;
  &:hover,
  &:focus-visible {
    border-color: var(--ant-color-primary);
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--ant-control-outline);
  }
  .body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .title {
    color: var(--ant-color-text);
    font-size: 14px;
    font-weight: 500;
  }
  .description {
    color: var(--ant-color-text-secondary);
  }
`;

const RadioDot = styled.span<{ $active: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 3px;
  border-radius: 50%;
  border: 1.5px solid
    ${(p) =>
      p.$active ? 'var(--ant-color-primary)' : 'var(--ant-color-border)'};
  background: ${(p) =>
    p.$active ? 'var(--ant-color-primary)' : 'transparent'};
  transition: all 0.2s;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    margin: auto;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
    opacity: ${(p) => (p.$active ? 1 : 0)};
    transition: opacity 0.2s;
  }
`;

// Card-based selector for cluster type. The two options are mutually exclusive
// and the choice maps directly to the presence/absence of `gpuInstanceOptions`
// on the form — "model" clears it, "gpu" seeds it to {} (preserving any
// already-entered static address). No standalone form field is registered;
// state is read via useWatch with `preserve: true` so it tracks updates made
// through setFieldValue.
export const ClusterTypeSelector: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const labelId = useId();
  const gpuInstanceOptions = Form.useWatch(GPU_INSTANCE_OPTIONS_PATH, {
    form,
    preserve: true
  });
  const value: 'model' | 'gpu' = gpuInstanceOptions ? 'gpu' : 'model';

  const handleSelect = (next: 'model' | 'gpu') => {
    if (!form || next === value) return;
    if (next === 'gpu') {
      form.setFieldValue(
        GPU_INSTANCE_OPTIONS_PATH,
        form.getFieldValue(GPU_INSTANCE_OPTIONS_PATH) ?? {}
      );
    } else {
      form.setFieldValue(GPU_INSTANCE_OPTIONS_PATH, undefined);
    }
  };

  const options: {
    key: 'model' | 'gpu';
    title: string;
    description: string;
  }[] = [
    {
      key: 'model',
      title: intl.formatMessage({ id: 'clusters.modelService.title' }),
      description: intl.formatMessage({ id: 'clusters.modelService.tip' })
    },
    {
      key: 'gpu',
      title: intl.formatMessage({ id: 'clusters.gpuInstances.title' }),
      description: intl.formatMessage({ id: 'clusters.gpuInstances.tip' })
    }
  ];

  return (
    <ClusterTypeWrap>
      <ClusterTypeLabel id={labelId}>
        {intl.formatMessage({ id: 'clusters.clusterType.title' })}
        <span className="required">*</span>
      </ClusterTypeLabel>
      <ClusterTypeGrid role="radiogroup" aria-labelledby={labelId}>
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <ClusterTypeCard
              key={opt.key}
              $active={active}
              role="radio"
              aria-checked={active}
              tabIndex={0}
              onClick={() => handleSelect(opt.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(opt.key);
                }
              }}
            >
              <RadioDot $active={active} />
              <div className="body">
                <div className="title">{opt.title}</div>
                <div className="description">{opt.description}</div>
              </div>
            </ClusterTypeCard>
          );
        })}
      </ClusterTypeGrid>
    </ClusterTypeWrap>
  );
};

// Static access address for GPU instances. Only shown when "GPU 服务" is
// the selected cluster type. Rendered in the advanced section, between the
// default container registry and the worker config (节点配置).
export const GpuInstancesStaticAddressForm: React.FC = () => {
  const intl = useIntl();
  // See note in ClusterTypeSelector: watch the full store so this field's
  // visibility tracks the selector even before it has mounted its own
  // Form.Item.
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

// Strip UI-only noise so two k8s_options snapshots compare on real content.
// `sourceType` is derived from `volumeSource` purely for the volume-mount UI
// (see cluster-form init).
const cleanK8sOptions = (opts: any) => {
  const cloned = _.cloneDeep(opts || {});
  if (Array.isArray(cloned.volumeMounts)) {
    cloned.volumeMounts = cloned.volumeMounts.map(
      ({ sourceType, ...rest }: any) => rest
    );
  }
  return cloned;
};

// Custom comparator for isEqualWith: treats null, undefined, empty strings,
// empty arrays, and empty objects as equivalent. Form normalize converts empty
// inputs to null while the API may omit absent keys (read as undefined when
// accessed on the object). This lets "user clears field back to original"
// compare as unchanged without needing to recursively strip nullish values.
const nullishCustomizer = (val1: any, val2: any) => {
  if (
    (val1 == null && val2 === '') ||
    (val1 === '' && val2 == null) ||
    (_.isEmpty(val1) && val2 == null) ||
    (val1 == null && _.isEmpty(val2))
  ) {
    return true;
  }
  return undefined;
};

// Headless watcher: in EDIT mode it reports (via onChange) whether the user has
// changed any k8s_options field or the top-level system_default_container_registry
// from the cluster's saved values. It renders nothing — the notice itself is shown
// in the form footer, above Save/Cancel (see cluster-create.tsx), mirroring the
// model edit interaction. Must be mounted inside the cluster <Form> so the watch
// reads the form store.
export const K8sOptionsChangeWatcher: React.FC<{
  action: PageActionType;
  currentData?: ListItem;
  onChange: (changed: boolean) => void;
}> = ({ action, currentData, onChange }) => {
  // `preserve: true` so the watch tracks the full store, including
  // gpuInstanceOptions which is toggled via setFieldValue without a mounted
  // Form.Item (mirrors ClusterTypeSelector).
  const k8sOptions = Form.useWatch(['k8s_options'], { preserve: true });
  const containerRegistry = Form.useWatch('system_default_container_registry', {
    preserve: true
  });

  // currentData?.k8s_options is static for the form's lifetime — memoize the
  // cleaned version to avoid redundant deep-clone on every render
  // (Form.useWatch triggers re-render on each keystroke).
  const currentK8sOptionsCleaned = useMemo(
    () => cleanK8sOptions(currentData?.k8s_options),
    [currentData?.k8s_options]
  );

  const k8sOptionsChanged = !_.isEqualWith(
    currentK8sOptionsCleaned,
    cleanK8sOptions(k8sOptions),
    nullishCustomizer
  );
  const registryChanged = !_.isEqualWith(
    currentData?.system_default_container_registry,
    containerRegistry,
    nullishCustomizer
  );

  const changed =
    action === PageAction.EDIT && (k8sOptionsChanged || registryChanged);

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
