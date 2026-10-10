import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  AutoComplete,
  Input as CoreInput,
  Select as CoreSelect,
  MetadataList,
  Textarea
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Form, Tooltip } from 'antd';
import { useState } from 'react';
import type { FormData } from '../../config/types';
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

const DecisionServiceEditor = ({
  getTargetModelNames
}: DecisionServiceFieldsProps) => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const enabled = Form.useWatch(
    ['plugins', 'decision-service', 'enabled'],
    form
  );
  const providerId = Form.useWatch(
    ['plugins', 'decision-service', 'providerId'],
    form
  );
  const { providerOptions, decisionModelOptions } =
    useDecisionServiceProviders(providerId);
  // Keep input edits synchronous with writes to the form store.
  const [criteria, setCriteria] = useState<CriteriaFormItem[]>(
    () => form.getFieldValue(DECISION_CRITERIA_PATH) || []
  );

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

  // Required only while the plugin is enabled. Reject whitespace-only
  // strings too: buildPluginsPayload trims them before serializing.
  const requiredWhenEnabled = (messageId: string) => [
    {
      validator(_rule: any, value: any) {
        if (!enabled) {
          return Promise.resolve();
        }
        if (value == null || String(value).trim() === '') {
          return Promise.reject(
            new Error(intl.formatMessage({ id: messageId }))
          );
        }
        return Promise.resolve();
      }
    }
  ];

  return (
    <>
      <Form.Item
        name={['plugins', 'decision-service', 'providerId']}
        rules={requiredWhenEnabled('routes.lb.systemone.provider.required')}
      >
        <CoreSelect
          allowClear
          options={providerOptions}
          required
          onChange={() => {
            // The decision engine must exist in the newly selected
            // provider's cache — a stale alias would pass required
            // validation but render the route rule inert.
            form.setFieldValue(
              ['plugins', 'decision-service', 'decisionModel'],
              undefined
            );
          }}
          label={
            <LabelWithHelp
              labelId="routes.lb.systemone.provider"
              tipsId="routes.lb.systemone.provider.tips"
            />
          }
        />
      </Form.Item>
      {/* Required while the plugin is enabled — without an explicit decision
          model the server silently falls back and skips JEV-based routing
          (gpustack/gpustack#6353); see buildPluginsPayload for the payload. */}
      <Form.Item
        name={['plugins', 'decision-service', 'decisionModel']}
        rules={requiredWhenEnabled(
          'routes.lb.systemone.decisionModel.required'
        )}
      >
        <AutoComplete
          options={decisionModelOptions}
          allowClear
          required
          label={
            <LabelWithHelp
              labelId="routes.lb.systemone.decisionModel"
              tipsId="routes.lb.systemone.decisionModel.tips"
            />
          }
        />
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
          <Form.ErrorList errors={form.getFieldError(DECISION_CRITERIA_PATH)} />
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
