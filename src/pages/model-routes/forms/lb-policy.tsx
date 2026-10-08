import { queryMaasProviders } from '@/pages/maas-provider/apis';
import { isDecisionServiceType } from '@/pages/maas-provider/config/providers';
import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  AutoComplete,
  Input as CoreInput,
  Select as CoreSelect,
  IconFont,
  MetadataList,
  Slider,
  Textarea
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Form, Segmented, Switch, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import { LB_FORM_MODE, SESSION_KEY_SOURCE } from '../config';
import { FormData } from '../config/types';
import { CriteriaFormItem, SessionKeyFormItem } from '../utils/lb-plugins';

// Opt-in plugin card, mirroring the benchmark form's Data Distribution
// section: bordered rounded panel, title with a "?" help tooltip on the left
// and a small Switch on the right; the body reveals only when enabled.
const useStyles = createStyles(({ css }) => ({
  // Section heading outside the cards — same typography as the Route Targets
  // heading (see targets.tsx).
  sectionTitle: css`
    font-size: 14px;
    font-weight: 600;
  `,
  // Full-row dashed "Advanced" toggle, same affordance as the targets form.
  // margin-top matches the core-ui Slider's own top margin (16px) so the gap
  // above the seam and above a revealed slider is identical.
  advancedToggle: css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 24px;
    margin-top: 16px;
    font-size: 12px;
    color: var(--ant-color-text-tertiary);
  `,
  sectionCard: css`
    border: 1px solid var(--ant-color-border);
    border-radius: 6px;
    padding: 14px 10px 12px;
    margin-bottom: 12px;
    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      color: var(--ant-color-text);
    }
    .title-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--ant-color-text-tertiary);
    }
    .title-help {
      color: var(--ant-color-text-tertiary);
      cursor: help;
    }
  `
}));

const SESSION_KEYS_PATH = ['plugins', 'session-affinity', 'sessionKeys'];

// Session key chain edited as a MetadataList (object-array convention):
// each row is a source Select + key Input; every action updates the local
// input values and the form store together.
// Form.Item clones its single child with value/onChange; a native <input>
// would surface an array value as an unknown-attribute warning, so register
// the array field through this pass-through component instead.
const FieldRegistrar = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

const SessionKeysEditor = ({ disabled }: { disabled: boolean }) => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const enabled = Form.useWatch(
    ['plugins', 'session-affinity', 'enabled'],
    form
  );
  // Input values must update synchronously; useWatch notifies in a later task.
  const [sessionKeys, setSessionKeys] = useState<SessionKeyFormItem[]>(
    () => form.getFieldValue(SESSION_KEYS_PATH as any) || []
  );

  const updateKeys = (keys: SessionKeyFormItem[]) => {
    setSessionKeys(keys);
    form.setFieldValue(SESSION_KEYS_PATH as any, keys);
    // setFieldValue does not trigger validation, so a submit error on this
    // field would otherwise linger until the next submit even after the user
    // fixed the keys. Re-run it while an error is showing.
    if (form.getFieldError(SESSION_KEYS_PATH as any).length) {
      form.validateFields([SESSION_KEYS_PATH as any]).catch(() => {});
    }
  };

  const sourceOptions = [
    {
      value: SESSION_KEY_SOURCE.header,
      label: intl.formatMessage({ id: 'routes.lb.sessionKeys.source.header' })
    },
    {
      value: SESSION_KEY_SOURCE.bodyKey,
      label: intl.formatMessage({ id: 'routes.lb.sessionKeys.source.bodyKey' })
    }
  ];

  return (
    <>
      {/* Register the list field (rows are rendered by MetadataList, not
          Form.List) so submit values and validation still see it. */}
      <Form.Item
        name={SESSION_KEYS_PATH}
        hidden
        noStyle
        rules={[
          {
            validator(rule, value) {
              if (!enabled || disabled) {
                return Promise.resolve();
              }
              if (!value?.length) {
                return Promise.reject(
                  intl.formatMessage({ id: 'routes.lb.sessionKeys.required' })
                );
              }
              // Match the submit gate (toServerSessionKeys filters empty
              // keys): an all-blank chain must fail here too, or saving
              // would silently delete the stored session-affinity config.
              if (
                value.some((item: SessionKeyFormItem) => !item?.key?.trim())
              ) {
                return Promise.reject(
                  intl.formatMessage({
                    id: 'routes.lb.sessionKeys.keyRequired'
                  })
                );
              }
              return Promise.resolve();
            }
          }
        ]}
      >
        <FieldRegistrar />
      </Form.Item>
      <MetadataList
        label={intl.formatMessage({ id: 'routes.lb.sessionKeys' })}
        btnText={intl.formatMessage({ id: 'routes.lb.sessionKeys.add' })}
        dataList={sessionKeys}
        styles={{
          // The wrapper is `width: 100%` + padding 14 + border 1 but not
          // box-sizing: border-box (styled-components ships no reset), so its
          // 100% resolves against the content box and overflows the plugin
          // card by 30px. border-box folds the padding/border into the 100%.
          // No bottom margin: the Advanced toggle below owns the gap (16px,
          // symmetric between collapsed and revealed states).
          wrapper: { boxSizing: 'border-box' }
        }}
        onAdd={() =>
          updateKeys([
            ...sessionKeys,
            { type: SESSION_KEY_SOURCE.header, key: '' }
          ])
        }
        onDelete={(index) =>
          updateKeys(sessionKeys.filter((_k, i) => i !== index))
        }
      >
        {(item: SessionKeyFormItem, index: number) => (
          // minWidth: 0 on both levels lets the row actually shrink to the
          // MetadataList slot — flex items otherwise refuse to go below
          // their intrinsic (Input ≈ 20ch) width and overflow the drawer.
          <Flex gap={10} align="center" style={{ flex: 1, minWidth: 0 }}>
            <Flex style={{ width: 140, flex: 'none' }}>
              <CoreSelect
                disabled={disabled}
                options={sourceOptions}
                style={{ width: '100%' }}
                value={item?.type || SESSION_KEY_SOURCE.header}
                onChange={(type) =>
                  updateKeys(
                    sessionKeys.map((k, i) =>
                      i === index ? { ...k, type } : k
                    )
                  )
                }
              />
            </Flex>
            <CoreInput.Input
              trim={false}
              disabled={disabled}
              value={item?.key ?? ''}
              placeholder={intl.formatMessage({
                id: 'routes.lb.sessionKeys.keyPlaceholder'
              })}
              style={{ flex: 1, minWidth: 0 }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateKeys(
                  sessionKeys.map((k, i) =>
                    i === index ? { ...k, key: e.target.value } : k
                  )
                )
              }
            />
          </Flex>
        )}
      </MetadataList>
      {/* The field itself is registered hidden (FieldRegistrar above), so its
          validation errors have nowhere to render — surface them here or a
          submit with all keys deleted is blocked silently. */}
      <Form.Item noStyle shouldUpdate={() => true}>
        {() => (
          <Form.ErrorList
            errors={form.getFieldError(SESSION_KEYS_PATH as any)}
          />
        )}
      </Form.Item>
    </>
  );
};

// The systemone (Jev decision service) plugin card body: decision-service
// provider select, decision engine model, instructions and the criteria list
// (model name -> capability description, edited as rows like session keys,
// with a skeleton generator fed by the route's targets), plus the optional
// decision weight (wasm rankWeight, default 10).
const SYSTEMONE_CRITERIA_PATH = [
  'plugins',
  'decision-service',
  'modelSelection',
  'criteria'
];

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

const SystemoneEditor = ({
  disabled,
  getTargetModelNames
}: {
  disabled: boolean;
  getTargetModelNames: () => string[];
}) => {
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
  // Decision-service provider items (single type gpustack-lb-typesafe — an
  // empty custom base url means the TypeSafe managed default): the
  // decisionModel dropdown reads the engines cached in the selected
  // provider's models list (no live fetch — an intranet endpoint is
  // unreachable from the browser anyway).
  const [providers, setProviders] = useState<any[]>([]);
  // Input values must update synchronously; useWatch notifies in a later task.
  const [criteria, setCriteria] = useState<CriteriaFormItem[]>(
    () => form.getFieldValue(SYSTEMONE_CRITERIA_PATH as any) || []
  );

  const providerOptions = providers.map((item) => ({
    label: item.name,
    value: item.id
  }));
  const decisionModelOptions = (
    providers.find((item) => item.id === providerId)?.models || []
  )
    .filter((model: any) => model?.name)
    .map((model: any) => ({ label: model.name, value: model.name }));

  // Fetch the decision-service provider options when the form opens (this
  // editor mounts with the route form; the list is small and static).
  useEffect(() => {
    let cancelled = false;
    queryMaasProviders({ page: -1 })
      .then((res) => {
        if (cancelled) {
          return;
        }
        setProviders(
          (res?.items || []).filter((item: any) =>
            isDecisionServiceType(item.config?.type)
          )
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const updateCriteria = (items: CriteriaFormItem[]) => {
    setCriteria(items);
    form.setFieldValue(SYSTEMONE_CRITERIA_PATH as any, items);
    if (form.getFieldError(SYSTEMONE_CRITERIA_PATH as any).length) {
      form.validateFields([SYSTEMONE_CRITERIA_PATH as any]).catch(() => {});
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

  // Required only while the card is enabled (disabled = the card sits in
  // weighted LB mode, where nothing is editable).
  const requiredWhenEnabled = (messageId: string) => [
    {
      validator(_rule: any, value: any) {
        if (!enabled || disabled) {
          return Promise.resolve();
        }
        if (value == null || value === '') {
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
      {/* The backend allows omitting decisionModel — the provider's config
          or the service's own default engine is used then. Optional here,
          and an empty value is not sent on PUT (see buildPluginsPayload). */}
      <Form.Item name={['plugins', 'decision-service', 'decisionModel']}>
        <AutoComplete
          options={decisionModelOptions}
          allowClear
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
        name={SYSTEMONE_CRITERIA_PATH}
        hidden
        noStyle
        rules={[
          {
            validator(rule, value) {
              if (!enabled || disabled) {
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
          wrapper: { boxSizing: 'border-box' }
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
              disabled={disabled}
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
              disabled={disabled}
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
          <Form.ErrorList
            errors={form.getFieldError(SYSTEMONE_CRITERIA_PATH as any)}
          />
        )}
      </Form.Item>
      {/* Same Advanced seam and plain "Weight" label as the other plugin
          cards: the rankWeight is rarely touched (default 10), and the slider
          shows the (0, 20] scale unlike the influence sliders' (0, 2]. */}
      <InfluenceAdvanced
        name={['plugins', 'decision-service', 'weight']}
        min={1}
        max={SYSTEMONE_WEIGHT_MAX}
        step={1}
        seed={10}
        transform={toSystemoneWeight}
      />
    </>
  );
};

// The policy weight is always a number in the store, whatever the raw
// input emits (antd may hand back a string mid-edit).
const toWeightNumber = (value: any): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const num = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(num) ? num : undefined;
};

// A plugin's scoring influence lives in (0, 2]: 1 is neutral (the plugin's
// built-in default), 0 is meaningless — opting out is the card's Switch, not
// a zero influence. core-ui's Slider renders the slider + input combo but
// does not forward min/max to the embedded InputNumber, so the clamp rides
// on getValueFromEvent: whatever either control emits is folded back into
// the range before it reaches the store.
const INFLUENCE_MIN = 0.1;
const INFLUENCE_MAX = 2;
const INFLUENCE_STEP = 0.1;

const toInfluence = (value: any): number => {
  const num = toWeightNumber(value);
  if (num == null) {
    return INFLUENCE_MIN;
  }
  // Let 0 through: it is the transient first keystroke of "0.5" and clamping
  // it here would rewrite the field to 0.1 mid-typing. The (0, 2] bound is
  // enforced at payload time (toServerWeight in utils/lb-plugins).
  if (num === 0) {
    return 0;
  }
  return Math.min(INFLUENCE_MAX, Math.max(INFLUENCE_MIN, num));
};

// The systemone rankWeight transform: whole numbers on the (0, 20] scale
// (no 0.1-style steps). 0 passes through as the transient first keystroke of
// "10"; the positive bound is enforced at payload time.
const SYSTEMONE_WEIGHT_MAX = 20;
const toSystemoneWeight = (value: any): number => {
  const num = toWeightNumber(value);
  if (num == null) {
    return 1;
  }
  if (num === 0) {
    return 0;
  }
  return Math.min(SYSTEMONE_WEIGHT_MAX, Math.max(1, Math.round(num)));
};

// One capability plugin as an opt-in card (benchmark Data Distribution
// style): the header switch enables the plugin and reveals the body.
const PluginCard = ({
  titleId,
  tipsId,
  switchName,
  disabled,
  onSwitchChange,
  children
}: {
  titleId: string;
  tipsId: string;
  switchName: (string | number)[];
  disabled: boolean;
  onSwitchChange?: (checked: boolean) => void;
  children: React.ReactNode;
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const form = Form.useFormInstance<FormData>();
  const enabled = !!Form.useWatch(switchName as any, form);

  return (
    <div className={styles.sectionCard}>
      <div className="section-title" style={{ marginBottom: enabled ? 16 : 0 }}>
        <span className="title-label">
          {intl.formatMessage({ id: titleId })}
          <Tooltip title={intl.formatMessage({ id: tipsId })}>
            <QuestionCircleOutlined className="title-help" />
          </Tooltip>
        </span>
        <Form.Item name={switchName} valuePropName="checked" noStyle>
          <Switch
            size="small"
            disabled={disabled}
            onChange={(checked) => onSwitchChange?.(checked)}
          />
        </Form.Item>
      </div>
      {enabled && children}
    </div>
  );
};

// Default session-key chain seeded the first time Session Affinity is
// enabled with no keys yet (create flow, or an edit that never configured
// them). Header sources are free (no body buffering); body sources buffer
// one copy of the body — prompt_cache_key is OpenAI's cache routing key,
// i.e. the client asking for prefix affinity, which is exactly the plugin's
// job. Ordered: first match wins.
const DEFAULT_SESSION_KEYS: SessionKeyFormItem[] = [
  { type: SESSION_KEY_SOURCE.header, key: 'session-id' },
  { type: SESSION_KEY_SOURCE.header, key: 'x-client-request-id' },
  { type: SESSION_KEY_SOURCE.bodyKey, key: 'prompt_cache_key' }
];

// A plugin's advanced fields, hidden behind a full-row "Advanced" toggle —
// the same dashed one-shot affordance the targets form uses for its advanced
// fields. Most users never touch it (the default is the plugin's built-in).
// Parameterized for the two weight scales: the influence sliders (0, 2],
// default 1, and the systemone rankWeight (0, N], default 10.
const InfluenceAdvanced = ({
  name,
  min = INFLUENCE_MIN,
  max = INFLUENCE_MAX,
  step = INFLUENCE_STEP,
  labelId = 'routes.lb.influence',
  seed = 1,
  tipsId,
  transform = toInfluence
}: {
  name: (string | number)[];
  min?: number;
  max?: number;
  step?: number;
  labelId?: string;
  seed?: number;
  tipsId?: string;
  transform?: (value: any) => number;
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const form = Form.useFormInstance<FormData>();
  // Seed open from the store: an edit that arrives with a configured weight
  // shows the value instead of hiding it behind a collapsed seam (mirrors the
  // targets form seeding its advanced keys from max_running_requests).
  const [open, setOpen] = useState(
    () => form.getFieldValue(name as any) != null
  );
  return (
    // 16px top gap either way: the seam's margin-top when collapsed, the
    // container's margin-top when revealed. NOTE: core-ui Slider's
    // `inputnumber` combo currently lets the numeric input escape its
    // `.slider-label` box (it is not flexed), so the revealed row may sit
    // close to the content above — to be fixed in core-ui, after which this
    // spacing works as intended.
    <div style={{ marginTop: open ? 16 : 0 }}>
      {!open && (
        <Button
          type="dashed"
          size="small"
          block
          className={styles.advancedToggle}
          onClick={() => {
            setOpen(true);
            // Seed the default at reveal time, not at mount: seeding
            // earlier would defeat the seam itself (open is seeded from
            // value != null), and an untouched plugin keeps weight unset so
            // the server applies its built-in default on submit.
            if (form.getFieldValue(name as any) == null) {
              form.setFieldValue(name as any, seed);
            }
          }}
        >
          {intl.formatMessage({ id: 'routes.form.target.advanced' })}
          <IconFont type="icon-down" style={{ fontSize: 12 }} />
        </Button>
      )}
      {open && (
        <Form.Item name={name} noStyle getValueFromEvent={transform}>
          <Slider
            label={
              tipsId ? (
                <LabelWithHelp labelId={labelId} tipsId={tipsId} />
              ) : (
                intl.formatMessage({ id: labelId })
              )
            }
            inputnumber
            min={min}
            max={max}
            step={step}
          />
        </Form.Item>
      )}
    </div>
  );
};

// Rendered above the route-targets panel: a tab-based mode selector
// (Weight / Policy); the capability-plugin cards appear below it only in
// Policy mode. Policy with no capability enabled is what used to be the
// separate Round Robin choice — the gateway falls back to round-robin on
// its own, so the mode did not need a tab of its own.
const LbPolicySection = ({
  onModeChange,
  getTargetModelNames
}: {
  onModeChange: (mode: string) => void;
  getTargetModelNames: () => string[];
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const form = Form.useFormInstance<FormData>();
  const lbMode = Form.useWatch('lb_policy_mode', form);
  const isPolicy = lbMode === LB_FORM_MODE.policy;

  // No plugin influence pre-seeding here: the influence slider lives behind the
  // Advanced seam, and InfluenceAdvanced seeds `open` from
  // `getFieldValue(weight) != null`. A pre-seeded default of 1 would defeat
  // the seam on every create (the slider would mount already revealed). An
  // untouched weight stays undefined and the submit side (toServerWeight in
  // utils/lb-plugins) omits it so the server applies the plugin's built-in
  // default — only a stored weight (edit flow) auto-reveals the slider.
  // First enable of Session Affinity with an empty key chain gets the
  // recommended defaults; an existing chain (edit flow) is never touched.
  // (No influence seeding — see the note above.)
  const handleSessionAffinitySwitch = (checked: boolean) => {
    if (!checked) {
      return;
    }
    const keys = form.getFieldValue(SESSION_KEYS_PATH as any);
    if (!keys || keys.length === 0) {
      form.setFieldValue(
        SESSION_KEYS_PATH as any,
        DEFAULT_SESSION_KEYS.map((item) => ({ ...item }))
      );
    }
  };

  return (
    <>
      {/* Section heading outside the box, same typography and rhythm as the
          Route Targets heading below (Flex row + sectionTitle). */}
      <Flex
        justify="space-between"
        align="center"
        style={{ minHeight: 40, marginBottom: 10, paddingInline: 5 }}
      >
        <span className={styles.sectionTitle}>
          {intl.formatMessage({ id: 'routes.lb.routeBy' })}
        </span>
      </Flex>
      <div className={styles.sectionCard}>
        {/* Register the mode field (no visible control) so initialValues,
            useWatch and submit values all see it reliably. */}
        <Form.Item name="lb_policy_mode" hidden noStyle>
          <input />
        </Form.Item>
        <Segmented
          block
          value={lbMode}
          onChange={(value) => onModeChange(value as string)}
          options={[
            {
              value: LB_FORM_MODE.weighted,
              label: (
                <Tooltip
                  title={intl.formatMessage({
                    id: 'routes.lb.form.mode.weighted.tips'
                  })}
                >
                  <span style={{ fontSize: 14 }}>
                    {intl.formatMessage({ id: 'routes.lb.form.mode.weighted' })}
                  </span>
                </Tooltip>
              )
            },
            {
              value: LB_FORM_MODE.policy,
              label: (
                <Tooltip
                  title={intl.formatMessage({
                    id: 'routes.lb.form.mode.policy.tips'
                  })}
                >
                  <span style={{ fontSize: 14 }}>
                    {intl.formatMessage({ id: 'routes.lb.form.mode.policy' })}
                  </span>
                </Tooltip>
              )
            }
          ]}
        />
      </div>
      {isPolicy && (
        <>
          <PluginCard
            titleId="routes.lb.sessionAffinity"
            tipsId="routes.lb.sessionAffinity.tips"
            switchName={['plugins', 'session-affinity', 'enabled']}
            disabled={!isPolicy}
            onSwitchChange={handleSessionAffinitySwitch}
          >
            <SessionKeysEditor disabled={!isPolicy} />
            <InfluenceAdvanced
              name={['plugins', 'session-affinity', 'weight']}
            />
          </PluginCard>
          <PluginCard
            titleId="routes.lb.leastLoad"
            tipsId="routes.lb.leastLoad.tips"
            switchName={['plugins', 'least-load', 'enabled']}
            disabled={!isPolicy}
          >
            <InfluenceAdvanced name={['plugins', 'least-load', 'weight']} />
          </PluginCard>
          <PluginCard
            titleId="routes.lb.systemone"
            tipsId="routes.lb.systemone.tips"
            switchName={['plugins', 'decision-service', 'enabled']}
            disabled={!isPolicy}
          >
            <SystemoneEditor
              disabled={!isPolicy}
              getTargetModelNames={getTargetModelNames}
            />
          </PluginCard>
        </>
      )}
    </>
  );
};

export default LbPolicySection;
