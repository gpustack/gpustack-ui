import ProviderLogo from '@/pages/maas-provider/components/provider-logo';
import { ProviderEnum } from '@/pages/maas-provider/config/providers';
import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  Input as CoreInput,
  MetadataList,
  Cascader as SealCascader,
  Textarea
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Form, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import type { FormData } from '../../config/types';
import type { DecisionCascaderOption } from '../../hooks/use-decision-service-providers';
import useDecisionServiceProviders from '../../hooks/use-decision-service-providers';
import type { CriteriaFormItem } from '../../utils/lb-plugins';
import PolicyPluginSection from './policy-plugin-section';
import PolicyWeightField from './policy-weight-field';

interface DecisionServiceFieldsProps {
  getTargetModelNames: () => string[];
}

// Register object-array values without forwarding them to a DOM input.
const FieldRegistrar = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

const DECISION_CRITERIA_PATH: [
  'plugins',
  'decision-service',
  'modelSelection',
  'criteria'
] = ['plugins', 'decision-service', 'modelSelection', 'criteria'];

const DECISION_PROVIDER_PATH: ['plugins', 'decision-service', 'providerId'] = [
  'plugins',
  'decision-service',
  'providerId'
];

const DECISION_MODEL_ID_PATH: ['plugins', 'decision-service', 'modelId'] = [
  'plugins',
  'decision-service',
  'modelId'
];

const DECISION_MODEL_FIELD_PATH: [
  'plugins',
  'decision-service',
  'decisionModel'
] = ['plugins', 'decision-service', 'decisionModel'];

// Label + "(?)" tooltip: the field's explanation lives on the label, not as
// an `extra` hint line, per the systemone card's compact layout.
const LabelWithHelp = ({
  labelId,
  tipsId
}: {
  labelId: string;
  tipsId: string;
}) => {
  const intl = useIntl();
  return (
    <span>
      {intl.formatMessage({ id: labelId })}
      <Tooltip title={intl.formatMessage({ id: tipsId })}>
        <QuestionCircleOutlined
          style={{
            marginLeft: 4,
            fontSize: 12,
            color: 'var(--ant-color-text-tertiary)',
            cursor: 'help'
          }}
        />
      </Tooltip>
    </span>
  );
};

// Selected row: provider logo + "group / engine", mirroring the route-target
// picker's collapsed display (targets.tsx displayRender).
const renderSelectedSource = (labels: any[], option: any) => {
  const text = labels.join(' / ');
  return (
    <Flex component="span" align="center" gap={8}>
      <ProviderLogo provider={option?.[0]?.providerType as string} />
      <AutoTooltip ghost maxWidth={300} title={<span>{text}</span>}>
        <span>{text}</span>
      </AutoTooltip>
    </Flex>
  );
};

// Dropdown rows: groups carry the provider logo, engines a plain tooltip'd
// label — same rows as the target cascader's dropdown (targets.tsx
// optionRender). `data` is the raw cascader option here, not its payload.
const renderSourceOption = ({ data }: { data: DecisionCascaderOption }) => {
  if (data.isParent) {
    return (
      <Flex component="span" align="center" gap={8}>
        <ProviderLogo provider={data.providerType as string} />
        <AutoTooltip ghost maxWidth={105}>
          <span>{data.label}</span>
        </AutoTooltip>
      </Flex>
    );
  }
  return (
    <AutoTooltip ghost>
      <span>{data.label}</span>
    </AutoTooltip>
  );
};

const DecisionServiceEditor = ({
  getTargetModelNames
}: DecisionServiceFieldsProps) => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const enabled = Form.useWatch(
    ['plugins', 'decision-service', 'enabled'],
    form
  );
  const providerId = Form.useWatch(DECISION_PROVIDER_PATH, form);
  const modelId = Form.useWatch(DECISION_MODEL_ID_PATH, form);
  const decisionModel = Form.useWatch(DECISION_MODEL_FIELD_PATH, form);
  const { sourceOptions } = useDecisionServiceProviders();
  // Keep input edits synchronous with writes to the form store.
  const [criteria, setCriteria] = useState<CriteriaFormItem[]>(
    () => form.getFieldValue(DECISION_CRITERIA_PATH) || []
  );

  // One picker over two sources, using the same two-level cascader as the
  // route-target selection: a local-deployments group (servable decision
  // models) and one group per TypeSafe provider (its cached decision
  // engines). The [parent, child] path decomposes on change into
  // providerId XOR modelId — the server rejects a config carrying both —
  // and the engine alias (`decisionModel`) is derived from the same child
  // row, so picking the source is the whole interaction: no manual model
  // name input.
  const sourceValue: (string | number)[] =
    modelId != null
      ? ['deployments', modelId]
      : providerId != null && decisionModel
        ? [providerId, decisionModel]
        : [];

  // The stored selection must always resolve against the options tree:
  // while the sources load, a stand-in branch keeps it visible instead of
  // flashing raw ids; once loaded, a stored alias no longer among the
  // provider's cached engine names is re-added as an extra child so the
  // row still shows. Stand-in rows carry the same payload a real row
  // would, so re-picking them writes identical form values.
  const buildPickerOptions = (): DecisionCascaderOption[] => {
    const [parentValue, childValue] = sourceValue;
    if (parentValue == null || childValue == null) {
      return sourceOptions;
    }
    const isDeployments = parentValue === 'deployments';
    const makeChild = (): DecisionCascaderOption => ({
      label: String(childValue),
      value: childValue,
      parent: false,
      data: isDeployments
        ? { model_id: Number(childValue) }
        : {
            provider_id: Number(parentValue),
            decision_model: String(childValue)
          }
    });
    const groups = sourceOptions.some((group) => group.value === parentValue)
      ? sourceOptions.map((group) => ({
          ...group,
          children: [...(group.children || [])]
        }))
      : [
          {
            label: isDeployments
              ? intl.formatMessage({
                  id: 'routes.lb.systemone.provider.group.local'
                })
              : String(parentValue),
            value: parentValue,
            providerType: isDeployments ? 'deployments' : ProviderEnum.TYPESAFE,
            parent: false,
            isParent: true,
            children: [makeChild()]
          },
          ...sourceOptions
        ];
    const group = groups.find((item) => item.value === parentValue)!;
    if (!group.children?.some((child) => child.value === childValue)) {
      group.children?.push(makeChild());
    }
    return groups;
  };
  const pickerOptions = buildPickerOptions();

  const handleSourceChange = (value: any[], selectedOptions: any[]) => {
    const selected =
      selectedOptions?.find?.((option) => option.value === value?.[1]) || {};
    const data = selected.data || {};
    if (data.model_id != null) {
      // A local decision deployment: local engines accept any alias — the
      // decision model is the deployment's name (design §6.2).
      form.setFieldValue(DECISION_MODEL_ID_PATH, data.model_id);
      form.setFieldValue(DECISION_PROVIDER_PATH, undefined);
      form.setFieldValue(DECISION_MODEL_FIELD_PATH, selected.label);
    } else if (data.provider_id != null) {
      // The picked engine is the provider's decision model alias.
      form.setFieldValue(DECISION_PROVIDER_PATH, data.provider_id);
      form.setFieldValue(DECISION_MODEL_ID_PATH, undefined);
      form.setFieldValue(DECISION_MODEL_FIELD_PATH, data.decision_model);
    } else {
      // Cleared (allowClear): no source selected anymore.
      form.setFieldValue(DECISION_MODEL_ID_PATH, undefined);
      form.setFieldValue(DECISION_PROVIDER_PATH, undefined);
      form.setFieldValue(DECISION_MODEL_FIELD_PATH, undefined);
    }
    if (form.getFieldError(DECISION_PROVIDER_PATH).length) {
      form.validateFields([DECISION_PROVIDER_PATH]).catch(() => {});
    }
  };

  const updateCriteria = (items: CriteriaFormItem[]) => {
    setCriteria(items);
    form.setFieldValue(DECISION_CRITERIA_PATH, items);
    if (form.getFieldError(DECISION_CRITERIA_PATH).length) {
      form.validateFields([DECISION_CRITERIA_PATH]).catch(() => {});
    }
  };

  // Regenerate the criteria skeleton from the route's targets, keeping the
  // descriptions already entered for rows that survive. Manual rows not
  // matching any target are dropped — the skeleton IS the current target
  // set (the server treats unmatched keys as inert anyway).
  const handleGenerateCriteria = () => {
    const names = getTargetModelNames?.() || [];
    updateCriteria(
      names.map((name) => ({
        name,
        description:
          criteria.find((item) => item.name === name)?.description || ''
      }))
    );
  };

  // Required only while the plugin is enabled: the decision-service source,
  // and the pick must be complete — one of providerId (external TypeSafe
  // provider) or modelId (local decision deployment), mirroring the server's
  // exactly-one rule, PLUS the derived engine alias. A persisted id without
  // its alias would otherwise pass, omit decisionModel from the payload, and
  // the route would save while silently skipping JEV routing
  // (gpustack/gpustack#6353); a persisted BOTH-ids state would serialize
  // both and 422 on resubmit. Either way the source error makes the user
  // re-pick the child row, which writes all three values atomically.
  // Registered on the hidden providerId field; its error is surfaced
  // explicitly below the source cascader.
  const requiredWhenEitherSelected = [
    {
      validator(_rule: any, value: any) {
        if (!enabled) {
          return Promise.resolve();
        }
        const modelIdValue = form.getFieldValue(DECISION_MODEL_ID_PATH);
        if (
          // No source picked at all…
          (value == null && modelIdValue == null) ||
          // …or a persisted both-ids state the server's exactly-one rule
          // rejects…
          (value != null && modelIdValue != null) ||
          // …or the pick is incomplete (an id without its derived alias).
          !form.getFieldValue(DECISION_MODEL_FIELD_PATH)
        ) {
          return Promise.reject(
            new Error(
              intl.formatMessage({
                id: 'routes.lb.systemone.provider.required'
              })
            )
          );
        }
        return Promise.resolve();
      }
    }
  ];

  return (
    <>
      {/* The backing form fields stay registered (hidden) so validation
          fires on submit: required = one of providerId / modelId, mirroring
          the server's exactly-one rule. The composite cascader below is the
          only editor for the pair. */}
      <Form.Item
        name={DECISION_PROVIDER_PATH}
        hidden
        noStyle
        rules={requiredWhenEitherSelected}
      >
        <FieldRegistrar />
      </Form.Item>
      <Form.Item name={DECISION_MODEL_ID_PATH} hidden noStyle>
        <FieldRegistrar />
      </Form.Item>
      {/* The engine alias is derived from the picked child row (see
          handleSourceChange) — registered hidden so it stays in the form
          store for buildPluginsPayload, never edited by hand. */}
      <Form.Item name={DECISION_MODEL_FIELD_PATH} hidden noStyle>
        <FieldRegistrar />
      </Form.Item>
      {/* Layout-only Form.Item (no name): the composite source cascader is
          controlled — its backing fields are the hidden registrar items
          above — but a bare Cascader gets neither antd's
          `ant-select-in-form-item` width:100% (antd cascaders reuse the
          select classes) nor the standard item margin, leaving a
          content-width box flush against the decision model field below.
          Same wrapper as the flavor select in the instance-type forms. */}
      <Form.Item>
        <SealCascader
          allowClear
          required
          showSearch
          expandTrigger="hover"
          multiple={false}
          alwaysFocus
          maxTagCount={1}
          showCheckedStrategy="SHOW_CHILD"
          placeholder={intl.formatMessage({
            id: 'routes.lb.systemone.provider.required'
          })}
          options={pickerOptions}
          value={sourceValue}
          onChange={handleSourceChange}
          displayRender={renderSelectedSource}
          optionNode={renderSourceOption}
          label={
            <LabelWithHelp
              labelId="routes.lb.systemone.provider"
              tipsId="routes.lb.systemone.provider.tips"
            />
          }
          // Floating popup, not the pinned `.cascader-popup-wrapper`: the LB
          // card renders with overflow hidden and the decision-service section
          // sits at its bottom, so a popup parented to the trigger would be
          // clipped — it goes to document.body and antd positions it. The
          // pinned variant's `inset: 53px` would land a body-rendered popup
          // at the top-left of the page.
          classNames={{
            popup: { root: 'cascader-popup-floating gpu-selector' }
          }}
          styles={{
            popup: {
              listItem: {
                padding: '5px 10px',
                width: '100%',
                maxWidth: 'none',
                boxSizing: 'border-box'
              }
            }
          }}
        />
        {/* The providerId field is registered hidden (FieldRegistrar above),
            so its validation error has nowhere to render — surface it here or
            a submit with no source selected is blocked silently. Kept inside
            the layout Form.Item so the error hugs the select and the item's
            own margin still separates the next field. */}
        <Form.Item noStyle shouldUpdate={() => true}>
          {() => (
            <Typography.Paragraph type="danger" style={{ marginBottom: 0 }}>
              <Form.ErrorList
                errors={form.getFieldError(DECISION_PROVIDER_PATH)}
              />
            </Typography.Paragraph>
          )}
        </Form.Item>
      </Form.Item>
      {/* The backend schema treats instructions as optional — a valid
          section may contain only criteria, so no required rule here. */}
      <Form.Item
        name={['plugins', 'decision-service', 'modelSelection', 'instructions']}
      >
        <Textarea
          scaleSize
          label={
            <LabelWithHelp
              labelId="routes.lb.systemone.instructions"
              tipsId="routes.lb.systemone.instructions.tips"
            />
          }
        />
      </Form.Item>
      <Form.Item
        name={DECISION_CRITERIA_PATH}
        hidden
        noStyle
        rules={[
          {
            validator(rule, value) {
              if (!enabled) {
                return Promise.resolve();
              }
              const rows: CriteriaFormItem[] = value || [];
              if (rows.length === 0) {
                return Promise.reject(
                  intl.formatMessage({
                    id: 'routes.lb.systemone.criteria.required'
                  })
                );
              }
              if (rows.some((item) => !item?.name?.trim())) {
                return Promise.reject(
                  intl.formatMessage({
                    id: 'routes.lb.systemone.criteria.nameRequired'
                  })
                );
              }
              if (rows.some((item) => !item?.description?.trim())) {
                return Promise.reject(
                  intl.formatMessage({
                    id: 'routes.lb.systemone.criteria.valueRequired'
                  })
                );
              }
              // toServerCriteria folds rows into a map keyed by name — a
              // later duplicate would silently overwrite the earlier one.
              const seen = new Set<string>();
              for (const row of rows) {
                const key = row.name.trim();
                if (seen.has(key)) {
                  return Promise.reject(
                    intl.formatMessage({
                      id: 'routes.lb.systemone.criteria.duplicate'
                    })
                  );
                }
                seen.add(key);
              }
              return Promise.resolve();
            }
          }
        ]}
      >
        <FieldRegistrar />
      </Form.Item>
      <MetadataList
        styles={{
          wrapper: {
            boxSizing: 'border-box'
          }
        }}
        label={
          // Plain inline content only (no Button): the MetadataList label is
          // absolutely positioned over a 34px padding-top, and a 24px-tall
          // button inside it would overlap the first row — session keys keep
          // a plain-text label for the same reason.
          <span>
            {intl.formatMessage({ id: 'routes.lb.systemone.criteria' })}
            <Tooltip
              title={intl.formatMessage({
                id: 'routes.lb.systemone.criteria.tips'
              })}
            >
              <QuestionCircleOutlined
                style={{
                  marginLeft: 4,
                  fontSize: 12,
                  color: 'var(--ant-color-text-tertiary)',
                  cursor: 'help'
                }}
              />
            </Tooltip>
            <Button
              type="link"
              onClick={handleGenerateCriteria}
              style={{
                marginLeft: 8,
                padding: 0,
                height: 'auto',
                fontSize: 12,
                lineHeight: 1
              }}
            >
              {intl.formatMessage({
                id: 'routes.lb.systemone.criteria.generate'
              })}
            </Button>
          </span>
        }
        btnText={intl.formatMessage({
          id: 'routes.lb.systemone.criteria.add'
        })}
        dataList={criteria}
        onAdd={() =>
          updateCriteria([...criteria, { name: '', description: '' }])
        }
        onDelete={(index) =>
          updateCriteria(criteria.filter((_item, i) => i !== index))
        }
      >
        {(item: CriteriaFormItem, index: number) => (
          // Same proportions as a session-key row: narrow fixed key (140,
          // like the source Select) + flexible value input.
          <Flex gap={10} align="center" style={{ flex: 1, minWidth: 0 }}>
            <CoreInput.Input
              trim={false}
              value={item?.name ?? ''}
              placeholder={intl.formatMessage({
                id: 'routes.lb.systemone.criteria.modelPlaceholder'
              })}
              style={{ width: 140, flex: 'none' }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateCriteria(
                  criteria.map((row, i) =>
                    i === index ? { ...row, name: e.target.value } : row
                  )
                )
              }
            />
            <CoreInput.Input
              trim={false}
              value={item?.description ?? ''}
              placeholder={intl.formatMessage({
                id: 'routes.lb.systemone.criteria.descPlaceholder'
              })}
              style={{ flex: 1, minWidth: 0 }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateCriteria(
                  criteria.map((row, i) =>
                    i === index ? { ...row, description: e.target.value } : row
                  )
                )
              }
            />
          </Flex>
        )}
      </MetadataList>
      {/* The field itself is registered hidden (FieldRegistrar above), so its
          validation errors have nowhere to render — surface them here or a
          submit with all rows deleted is blocked silently. */}
      <Form.Item noStyle shouldUpdate={() => true}>
        {() => (
          <Typography.Paragraph type="danger" style={{ marginBottom: 0 }}>
            <Form.ErrorList
              errors={form.getFieldError(DECISION_CRITERIA_PATH)}
            />
          </Typography.Paragraph>
        )}
      </Form.Item>
      {/* Same Advanced seam and plain "Weight" label as the other plugin
          cards: the rankWeight is rarely touched (default 10), and the slider
          shows the (0, 20] scale unlike the influence sliders' (0, 2]. */}
      <PolicyWeightField plugin="decision-service" />
    </>
  );
};

const DecisionServiceFields = ({
  getTargetModelNames
}: DecisionServiceFieldsProps) => (
  <PolicyPluginSection plugin="decision-service">
    <DecisionServiceEditor getTargetModelNames={getTargetModelNames} />
  </PolicyPluginSection>
);

export default DecisionServiceFields;
