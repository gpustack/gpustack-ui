import { QuestionCircleOutlined } from '@ant-design/icons';
import { IconFont, MetadataList, Slider } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import {
  Button,
  Flex,
  Form,
  Input,
  Segmented,
  Select,
  Switch,
  Tooltip
} from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { LB_FORM_MODE, SESSION_KEY_SOURCE } from '../config';
import { FormData } from '../config/types';
import { SessionKeyFormItem } from '../utils/lb-plugins';

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
// each row is a source Select + key Input; rows live in the form store and
// every action writes straight back to it.
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
  const sessionKeys: SessionKeyFormItem[] =
    Form.useWatch(SESSION_KEYS_PATH as any, form) || [];

  const updateKeys = (keys: SessionKeyFormItem[]) => {
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
          item: { marginBottom: 16 },
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
          <Flex gap={8} align="center" style={{ flex: 1, minWidth: 0 }}>
            <Select
              disabled={disabled}
              options={sourceOptions}
              style={{ width: 140, flex: 'none' }}
              value={item?.type || SESSION_KEY_SOURCE.header}
              onChange={(type) =>
                updateKeys(
                  sessionKeys.map((k, i) => (i === index ? { ...k, type } : k))
                )
              }
            />
            <Input
              disabled={disabled}
              value={item?.key ?? ''}
              placeholder={intl.formatMessage({
                id: 'routes.lb.sessionKeys.keyPlaceholder'
              })}
              style={{ flex: 1, minWidth: 0 }}
              onChange={(e) =>
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
// fields. Most users never touch it (the default of 1 is the plugin's
// built-in).
const InfluenceAdvanced = ({ name }: { name: (string | number)[] }) => {
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
    <div style={{ marginTop: open ? 16 : 0, marginBottom: 16 }}>
      {!open && (
        <Button
          type="dashed"
          size="small"
          block
          className={styles.advancedToggle}
          onClick={() => {
            setOpen(true);
            // Seed the default (1) at reveal time, not at mount: seeding
            // earlier would defeat the seam itself (open is seeded from
            // value != null), and an untouched plugin keeps weight unset so
            // the server applies its built-in default on submit.
            if (form.getFieldValue(name as any) == null) {
              form.setFieldValue(name as any, 1);
            }
          }}
        >
          {intl.formatMessage({ id: 'routes.form.target.advanced' })}
          <IconFont type="icon-down" style={{ fontSize: 12 }} />
        </Button>
      )}
      {open && (
        <Form.Item name={name} noStyle getValueFromEvent={toInfluence}>
          <Slider
            label={intl.formatMessage({ id: 'routes.lb.influence' })}
            inputnumber
            min={INFLUENCE_MIN}
            max={INFLUENCE_MAX}
            step={INFLUENCE_STEP}
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
const LbPolicySection = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const form = Form.useFormInstance<FormData>();
  const lbMode = Form.useWatch('lb_policy_mode', form);
  const isPolicy = lbMode === LB_FORM_MODE.policy;

  // No weight pre-seeding here: the influence slider lives behind the
  // Advanced seam, and InfluenceAdvanced seeds `open` from
  // `getFieldValue(weight) != null`. A pre-seeded default of 1 would defeat
  // the seam on every create (the slider would mount already revealed). An
  // untouched weight stays undefined and the submit side (toServerWeight in
  // utils/lb-plugins) omits it so the server applies the plugin's built-in
  // default — only a stored weight (edit flow) auto-reveals the slider.
  const handleModeChange = (mode: string) => {
    form.setFieldValue('lb_policy_mode', mode);
  };

  // First enable of Session Affinity with an empty key chain gets the
  // recommended defaults; an existing chain (edit flow) is never touched.
  // (No weight seeding — see the note on handleModeChange above.)
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
          onChange={(value) => handleModeChange(value as string)}
          options={[
            {
              value: LB_FORM_MODE.weighted,
              label: (
                <Tooltip
                  title={intl.formatMessage({
                    id: 'routes.lb.form.mode.weighted.tips'
                  })}
                >
                  <span>
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
                  <span>
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
        </>
      )}
    </>
  );
};

export default LbPolicySection;
