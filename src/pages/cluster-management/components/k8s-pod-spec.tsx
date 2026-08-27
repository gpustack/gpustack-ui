import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import {
  CardRadioGroup,
  Input as CInput,
  Select as CSelect,
  LabelSelector,
  type CardRadioOption
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Form } from 'antd';
import _ from 'lodash';
import React, { useEffect, useId, useMemo } from 'react';
import styled from 'styled-components';
import { useFormContext } from '../config/form-context';
import { useStepsContext } from '../config/steps-context';
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

// The badge's own look; its corner placement comes from CardRadioGroup's
// `badge` slot (see the styles override below).
const experimentalBadgeStyle: React.CSSProperties = {
  padding: '2px 4px',
  borderRadius: 2,
  fontSize: 10,
  fontWeight: 400,
  lineHeight: 1,
  backgroundColor: 'var(--ant-blue-1)'
};

// Card-based selector for cluster type. The two options are mutually exclusive
// and the choice maps directly to the presence/absence of `gpuInstanceOptions`
// on the submitted payload. No standalone form field is registered; the click
// only updates the shared `clusterType` state (see FormContext) — the payload's
// `gpuInstanceOptions` shape is derived from it at submit (see cluster-form's
// normalizeOutgoing), and the GPU Service settings mount/unmount off it.
export const ClusterTypeSelector: React.FC = () => {
  const intl = useIntl();
  const { presetClusterType } = useStepsContext();
  const labelId = useId();
  // Cluster type is shared, explicit state (see FormContext): the click is the
  // source of truth. This replaced a Form.useWatch on an unregistered path that
  // did not re-render reliably when cleared to undefined.
  const { clusterType, setClusterType } = useFormContext();
  const value: 'model' | 'gpu' = clusterType ?? 'model';

  const handleSelect = useMemoizedFn((next: 'model' | 'gpu') => {
    if (next === value) return;
    setClusterType?.(next);
  });

  const options: CardRadioOption<'model' | 'gpu'>[] = [
    {
      value: 'model',
      label: intl.formatMessage({ id: 'clusters.modelService.title' }),
      description: intl.formatMessage({ id: 'clusters.modelService.tip' })
    },
    {
      value: 'gpu',
      label: intl.formatMessage({ id: 'clusters.gpuInstances.title' }),
      description: intl.formatMessage({ id: 'clusters.gpuInstances.tip' }),
      badge: (
        <span style={experimentalBadgeStyle}>
          {intl.formatMessage({ id: 'common.tag.experimental' })}
        </span>
      )
    }
  ];

  useEffect(() => {
    if (presetClusterType) {
      handleSelect(presetClusterType);
    }
  }, [presetClusterType]);

  return (
    // CardRadioGroup renders the radiogroup role itself but takes no aria
    // props, so the visible label is associated from this wrapper.
    <ClusterTypeWrap role="group" aria-labelledby={labelId}>
      <ClusterTypeLabel id={labelId}>
        {intl.formatMessage({ id: 'clusters.clusterType.title' })}
        <span className="required">*</span>
      </ClusterTypeLabel>
      <CardRadioGroup<'model' | 'gpu'>
        value={value}
        onChange={handleSelect}
        options={options}
        columns={2}
        ghost
        styles={{ badge: { top: 2, right: 2 } }}
      />
    </ClusterTypeWrap>
  );
};

// The two boolean operator settings are tri-state on the wire: absent/null
// means GPUStack does not manage the setting and the cluster keeps its own
// value, which is a different instruction from an explicit off — the settings
// reconciler only ever writes a knob that is set. The form offers Enabled and
// Disabled only; it never produces the unmanaged state, because an operator
// default nobody chose is not a meaningful thing to ask an administrator
// about.
//
// The options carry sentinel strings rather than booleans so the mapping to
// and from the wire values stays on the Form.Item rather than in the Select.
const SETTING_TRUE = 'true';
const SETTING_FALSE = 'false';

// Only an explicit value maps to an option; an unmanaged knob maps to none, so
// the Select falls back to its placeholder. Showing Enabled there would be a
// claim the form cannot support: Enabled is the operator's default, but a
// cluster whose own setting was turned off by kubectl is Disabled, and an
// unmanaged knob is exactly the case where GPUStack does not know which. Picking
// a display value is also not free — it is the one an administrator would then
// leave in place and save, turning "not managed" into an instruction.
const toSettingOption = (value?: boolean | null) => {
  if (value === true) return SETTING_TRUE;
  if (value === false) return SETTING_FALSE;
  return undefined;
};

// Only the two sentinels map to a boolean. The Select cannot currently emit
// anything else — it has no allowClear — but mapping an absent value to `true`
// would turn "not managed" into an explicit instruction the moment it could.
const fromSettingOption = (value?: string) => {
  if (value === SETTING_TRUE) return true;
  if (value === SETTING_FALSE) return false;
  return undefined;
};

const OperatorFlagForm: React.FC<{
  name: string;
  labelId: string;
  descriptionId: string;
  // Seed the store with `true` when the form is registering a new cluster, so
  // "Enabled" is a value GPUStack actually persists rather than only a label.
  // Never on edit: the whole block mounts with the Advanced panel's
  // `forceRender`, so an initialValue there would land on any cluster whose
  // knob is unmanaged and turn an untouched save into an explicit `true` —
  // which the reconciler would then write over the cluster's own value.
  seed: boolean;
}> = ({ name, labelId, descriptionId, seed }) => {
  const intl = useIntl();

  const options = useMemo(
    () => [
      {
        value: SETTING_TRUE,
        label: intl.formatMessage({
          id: 'clusters.gpuInstances.setting.enabled'
        })
      },
      {
        value: SETTING_FALSE,
        label: intl.formatMessage({
          id: 'clusters.gpuInstances.setting.disabled'
        })
      }
    ],
    [intl]
  );

  return (
    <SectionWrap>
      <Form.Item
        name={['k8s_options', 'gpuInstanceOptions', name]}
        style={{ marginBottom: 0 }}
        initialValue={seed ? true : undefined}
        // getValueProps runs on every render — including after the edit form's
        // setFieldsValue, which normalize would not see — so the two sentinels
        // and the unmanaged placeholder stay in sync with the stored value.
        getValueProps={(value) => ({ value: toSettingOption(value) })}
        normalize={fromSettingOption}
      >
        <CSelect
          label={intl.formatMessage({ id: labelId })}
          description={intl.formatMessage({ id: descriptionId })}
          placeholder={intl.formatMessage({
            id: 'clusters.gpuInstances.setting.unmanaged'
          })}
          options={options}
        ></CSelect>
      </Form.Item>
    </SectionWrap>
  );
};

// The three GPUStack Operator settings that define a GPU Service cluster. Only
// shown when "GPU 服务" is the selected cluster type. Rendered in the advanced
// section, between the operator image and the worker config (节点配置).
export const GpuServiceSettingsForm: React.FC = () => {
  const intl = useIntl();
  // Visibility tracks the shared cluster-type state (see FormContext), so these
  // fields mount/unmount deterministically with the selector. Their Form.Items
  // are the only thing keeping gpuInstanceOptions alive, so unmounting them
  // here (with the form's preserve={false}) also clears that path from the
  // store — and its presence is what marks the cluster as GPU Service.
  const { clusterType, action } = useFormContext();

  if (clusterType !== 'gpu') {
    return null;
  }

  // Seeded for a registration, never for an edit. Read from `action` rather
  // than from `currentData`: the wizard passes each step back its own
  // previously-entered values, so on a registration where the user stepped away
  // and returned `currentData` is populated and `!currentData` would stop
  // seeding — the same registration then persisting a different thing depending
  // on which way the user walked through it.
  const seed = action !== PageAction.EDIT;

  return (
    <>
      <OperatorFlagForm
        name="gpuInstanceTypeDerivedFromNode"
        labelId="clusters.gpuInstances.derivedFromNode"
        descriptionId="clusters.gpuInstances.derivedFromNode.tip"
        seed={seed}
      />
      <OperatorFlagForm
        name="gpuInstanceTypeMixedOnNode"
        labelId="clusters.gpuInstances.mixedOnNode"
        descriptionId="clusters.gpuInstances.mixedOnNode.tip"
        seed={seed}
      />
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
    </>
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
  return _.pickBy(cloned, (value: any) => !_.isNil(value));
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
    (val1 == null && _.isEmpty(val2)) ||
    (_.isNil(val1) && _.isNil(val2))
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
const K8sAdvancedOptions: React.FC = () => {
  return (
    <>
      <NamespaceForm />
      <K8SVolumeMount />
      <ImageCredential />
      <NodeSelectorForm />
    </>
  );
};

export default K8sAdvancedOptions;
