import { PageAction } from '@/config';
import {
  ControlOutlined,
  LockOutlined,
  MinusOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import {
  InputNumber as CInputNumber,
  Select as CSelect,
  CollapsePanel,
  MetadataList,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import {
  Button,
  Checkbox,
  Flex,
  Form,
  InputNumber,
  Segmented,
  Switch,
  Tooltip
} from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import DistributionChart from '../components/distribution-chart';
import {
  AUTO_TUNE_DEFAULTS,
  DATASET_SEED_MAX,
  DATASET_SEED_MIN,
  DatasetValueMap,
  LoadTypeValueMap,
  SLA_AGGS,
  SLA_METRICS,
  type SlaAgg,
  type SlaMetric,
  type SlaTarget,
  genDatasetSeed,
  loadTypeOptions,
  profileAllowsSla,
  slaFieldsFromTargets,
  slaTargetKey
} from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const useStyles = createStyles(({ token, css }) => ({
  // Opt-in sub-feature card (Data Distribution / Shared Prefix): a bordered
  // rounded panel whose title carries a "?" help tooltip on the left and a small
  // Switch on the right; the body reveals below only when enabled. Mirrors the
  // model form's "Scheduled Scaling" section for a consistent look.
  sectionCard: css`
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadius}px;
    padding: 14px 10px 12px;
    margin-bottom: 24px;
    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      color: ${token.colorText};
    }
    .title-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .title-help {
      color: ${token.colorTextTertiary};
      cursor: help;
    }
    /* Label attached to a switch in the card header (Seed's "Random Seed"): a
       control label, not a second title, so it stays a step back from the card
       title on the left. */
    .row-switch {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: ${token.colorTextSecondary};
    }
    /* "managed by profile" next to a locked control in the card header. */
    .title-hint {
      font-size: 12px;
      color: ${token.colorTextTertiary};
    }
  `,
  // Three equal columns for a length-distribution row (Spread / Min / Max),
  // sitting above the full-width histogram.
  distGrid: css`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  `,
  // Locked-state badge shown instead of the auto/manual Segmented when the mode
  // is fixed by a named preset: a preset is auto-tune by definition and can't be
  // switched, so a lock pill reads clearer than a disabled toggle.
  autoTunePill: css`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding: 0 16px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    background: linear-gradient(
      180deg,
      ${token.colorPrimary} 0%,
      ${token.colorPrimaryHover} 100%
    );
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
    .anticon {
      font-size: 13px;
    }
  `,
  // Auto-tune / Manual toggle: refined neutral pill — a soft grey track, a crisp
  // white active tab lifted with a two-layer shadow + hairline ring, bold active
  // label. Deliberately understated (no heavy color) but sharper than the flat
  // default Segmented.
  modeSwitch: css`
    &.ant-segmented {
      background: ${token.colorFillTertiary};
      padding: 2px;
      border-radius: 9px;
      .ant-segmented-item {
        border-radius: 6px;
        color: ${token.colorTextQuaternary};
        font-size: 14px;
        font-weight: 400;
        transition: color 0.2s ease;
      }
      .ant-segmented-item:hover:not(.ant-segmented-item-selected) {
        color: ${token.colorTextSecondary};
      }
      .ant-segmented-item-selected {
        color: ${token.colorText};
        font-weight: 600;
      }
      /* Both the resting selected item and the sliding thumb share the lift so
         the animation looks consistent end to end. */
      .ant-segmented-item-selected,
      .ant-segmented-thumb {
        background: ${token.colorBgContainer};
        border-radius: 6px;
        box-shadow:
          0 1px 2px rgba(0, 0, 0, 0.08),
          0 2px 4px rgba(0, 0, 0, 0.04);
      }
      /* Label font matches the input boxes (14px); only the active tab is
         weighted, so an unselected tab reads as plain text. */
      .ant-segmented-item-label {
        min-height: 28px;
        line-height: 28px;
        padding: 0 12px;
      }
      .ant-segmented-item-icon {
        font-size: 13px;
        margin-inline-end: 6px;
        opacity: 0.85;
      }
    }
  `
}));

// SLA target rows live in config/index.ts (SLA_METRICS / SLA_AGGS + the
// list <-> flat-field mapping), since the detail page and the preset prefill
// need the same mapping.

const RandomSettingsForm: React.FC<{
  datasetList: Global.BaseOption<number | string>[];
}> = (props) => {
  const { datasetList } = props;
  const { styles } = useStyles();
  const intl = useIntl();
  const { action, currentData, profilesOptions } = useFormContext();
  const form = Form.useFormInstance();
  const profile = Form.useWatch('profile', form);
  const loadType = Form.useWatch('load_type', form);
  const datasetName = Form.useWatch('dataset_name', form);
  const { getRuleMessage } = useAppUtils();

  const disabled = action === PageAction.EDIT;

  // Field visibility derives from `load_type` (the axis) + `auto_tune` (how the
  // measured load points — the stages — are chosen). Both are always shown so the
  // config is transparent, but locked (read-only) for named presets: only Custom
  // lets you change them.
  const autoTune = Form.useWatch('auto_tune', form);
  const isCustom = profile === 'Custom';
  const presetLocked = !isCustom;
  const isFixedRate = loadType === LoadTypeValueMap.FixedRate;
  // Named presets are ALWAYS auto-tune (the ramp is the whole point); only Custom
  // can switch to manual stages. Derive from that so the section renders correctly
  // even if the auto_tune field value lags/is missing.
  const effectiveAutoTune = isCustom ? !!autoTune : true;
  // SLA is gated by TARGET, not by axis: setting a threshold switches the delivered
  // answer from "peak throughput" to "max load meeting the SLA", so it is available
  // on BOTH axes (asking for req/s under a TTFT budget is the more common capacity
  // question) and hidden only for a preset whose answer IS the peak. See
  // profileAllowsSla; keep in sync with the nav's copy in forms/index.tsx.
  const showSLA = profileAllowsSla(profile, profilesOptions as any[]);
  const isRandom = datasetName === DatasetValueMap.Random;
  // Random seed is the default; only an explicit false means the user pinned one.
  const randomSeed = Form.useWatch('dataset_seed_random', form) !== false;

  // Re-roll when switched on so the seed the run will use is visible right away
  // (the switch value itself is already stored by the Form.Item). Switching off
  // keeps the current number as the starting point for the user to edit.
  const handleRandomSeedChange = (checked: boolean) => {
    if (checked) {
      // Random on => a fresh seed, and each stage uses a different one by default.
      form.setFieldValue('dataset_seed', genDatasetSeed());
      form.setFieldValue('dataset_seed_increment', true);
    }
  };
  // Manual re-roll button next to the seed value (mirrors the design): mint a
  // fresh seed on demand whether Random Seed is on or off.
  const handleReroll = () => {
    form.setFieldValue('dataset_seed', genDatasetSeed());
  };

  const rateLabel = isFixedRate
    ? intl.formatMessage({ id: 'benchmark.form.rate' })
    : intl.formatMessage({ id: 'benchmark.form.concurrency' });

  // Data distribution is opt-in, and input / output toggle independently. Each
  // section's inputs appear once its toggle is on (or, in EDIT, when any of its
  // values already exists). The means come from Input/Output Token Length.
  const inputTokens = Form.useWatch('dataset_input_tokens', form);
  const outputTokens = Form.useWatch('dataset_output_tokens', form);
  const inStdev = Form.useWatch('dataset_input_stdev', form);
  const inMin = Form.useWatch('dataset_input_min', form);
  const inMax = Form.useWatch('dataset_input_max', form);
  const outStdev = Form.useWatch('dataset_output_stdev', form);
  const outMin = Form.useWatch('dataset_output_min', form);
  const outMax = Form.useWatch('dataset_output_max', form);

  const hasVal = (...vs: any[]) => vs.some((v) => v != null && v !== '');
  // Initialize the disclosure from the prefilled config (clone / edit) — useWatch
  // can't see the still-unmounted distribution fields, so seed from currentData.
  const [distToggle, setDistToggle] = useState(() =>
    hasVal(
      currentData?.dataset_input_stdev,
      currentData?.dataset_input_min,
      currentData?.dataset_input_max,
      currentData?.dataset_output_stdev,
      currentData?.dataset_output_min,
      currentData?.dataset_output_max
    )
  );
  const showDist =
    distToggle || hasVal(inStdev, inMin, inMax, outStdev, outMin, outMax);
  const handleDistToggle = (checked: boolean) => {
    setDistToggle(checked);
    if (!checked) {
      form.setFieldsValue({
        dataset_input_stdev: null,
        dataset_input_min: null,
        dataset_input_max: null,
        dataset_output_stdev: null,
        dataset_output_min: null,
        dataset_output_max: null
      });
    }
  };

  // Shared prefix is opt-in too: the bucket list only appears once enabled (or,
  // in EDIT, when buckets already exist).
  const prefixBuckets = Form.useWatch('prefix_buckets', form);
  const [prefixToggle, setPrefixToggle] = useState(
    () =>
      Array.isArray(currentData?.prefix_buckets) &&
      currentData!.prefix_buckets.length > 0
  );
  const showPrefix =
    prefixToggle || (Array.isArray(prefixBuckets) && prefixBuckets.length > 0);
  const handlePrefixToggle = (checked: boolean) => {
    setPrefixToggle(checked);
    if (!checked) {
      form.setFieldValue('prefix_buckets', []);
    } else if (!prefixBuckets?.length) {
      form.setFieldValue('prefix_buckets', [
        { prefix_count: 1, bucket_weight: 100 }
      ]);
    }
  };
  // Multi-turn (synthetic-only `turns`): shapes what each request IS (a running
  // conversation), so it's an opt-in card in Workload alongside the other
  // data-shape cards. On => turns >= 2; off => cleared (backend treats absent as
  // single-turn). turns == 1 (legacy) reads as off.
  const turns = Form.useWatch('turns', form);
  const multiTurnOn = !!turns && turns > 1;
  const handleMultiTurnToggle = (checked: boolean) => {
    form.setFieldValue('turns', checked ? 2 : null);
  };
  // The −/+ stepper only runs while multi-turn is on; the switch owns on/off
  // (clamping the floor to 2, since 1 turn == single-turn == off).
  const handleTurnUp = () =>
    form.setFieldValue('turns', Math.min(64, (Number(turns) || 1) + 1));
  const handleTurnDown = () =>
    form.setFieldValue('turns', Math.max(2, (Number(turns) || 2) - 1));

  // The bucket list is controlled the same way Add Cluster's Image Credentials
  // are (MetadataList + a form array): add / delete / per-field edits all
  // rewrite prefix_buckets on the form. `prefixValidated` flips on the first
  // failed submit so empty required fields highlight (no submitAttempted here).
  const [prefixValidated, setPrefixValidated] = useState(false);
  const revalidatePrefix = () => {
    if (prefixValidated)
      form.validateFields(['prefix_buckets']).catch(() => {});
  };
  const handlePrefixAdd = () => {
    form.setFieldValue('prefix_buckets', [
      ...(prefixBuckets || []),
      { prefix_count: 1, bucket_weight: 100 }
    ]);
  };
  const handlePrefixDelete = (index: number) => {
    const next = [...(prefixBuckets || [])];
    next.splice(index, 1);
    form.setFieldValue('prefix_buckets', next);
    revalidatePrefix();
  };
  const handlePrefixItemChange = (
    index: number,
    partial: Record<string, any>
  ) => {
    const next = [...(prefixBuckets || [])];
    next[index] = { ...next[index], ...partial };
    form.setFieldValue('prefix_buckets', next);
    revalidatePrefix();
  };

  // Manual stages use the same controlled MetadataList pattern as the bucket
  // list / Image Credentials. `stagesValidated` highlights empty required
  // fields after the first failed submit.
  const stages = Form.useWatch('stages', form);
  const [stagesValidated, setStagesValidated] = useState(false);
  const revalidateStages = () => {
    if (stagesValidated) form.validateFields(['stages']).catch(() => {});
  };
  const handleStageAdd = () => {
    form.setFieldValue('stages', [...(stages || []), { rate: undefined }]);
  };
  const handleStageDelete = (index: number) => {
    const next = [...(stages || [])];
    next.splice(index, 1);
    form.setFieldValue('stages', next);
    revalidateStages();
  };
  const handleStageChange = (index: number, partial: Record<string, any>) => {
    const next = [...(stages || [])];
    next[index] = { ...next[index], ...partial };
    form.setFieldValue('stages', next);
    revalidateStages();
  };

  // Auto <-> Manual are two ways of producing the same thing (the stages), and the
  // backend reads only one side per `auto_tune`. Clear the side being left so the
  // saved row — and anything cloned from it — carries no values that never ran.
  // Switching to Manual seeds one empty row so the table isn't just an Add button.
  const handleStagesModeChange = (mode: 'auto' | 'manual') => {
    if (mode === 'auto') {
      form.setFieldsValue({
        auto_tune: true,
        stages: [],
        lower_bound: AUTO_TUNE_DEFAULTS.lower_bound,
        upper_bound: AUTO_TUNE_DEFAULTS.upper_bound,
        max_points: AUTO_TUNE_DEFAULTS.max_points,
        max_total_seconds: AUTO_TUNE_DEFAULTS.max_total_seconds
      });
      setStagesValidated(false);
    } else {
      form.setFieldsValue({
        auto_tune: false,
        lower_bound: null,
        upper_bound: null,
        max_points: null,
        max_total_seconds: null,
        stages: stages?.length ? stages : [{ rate: undefined }]
      });
    }
  };

  // SLA targets: same controlled MetadataList pattern as the bucket / stage
  // lists. `sla_targets` is form-only — every mutation writes through to the 9
  // flat `sla_*_ms` fields the API actually takes (unused ones nulled), and the
  // page strips `sla_targets` before the request.
  const slaTargets: SlaTarget[] = Form.useWatch('sla_targets', form) || [];
  const [slaValidated, setSlaValidated] = useState(false);
  const revalidateSla = () => {
    if (slaValidated) form.validateFields(['sla_targets']).catch(() => {});
  };
  const writeSlaTargets = (next: SlaTarget[]) => {
    form.setFieldsValue({
      sla_targets: next,
      ...slaFieldsFromTargets(next)
    } as any);
  };
  // (metric, agg) pairs claimed by the OTHER rows. Used to disable them in this
  // row's selectors, so a duplicate threshold is impossible to build rather than
  // something the user has to be told about after submitting.
  const slaTakenByOthers = (index: number) =>
    new Set(
      slaTargets
        .filter((_, i) => i !== index)
        .map((t) => slaTargetKey(t.metric, t.agg))
    );
  const handleSlaAdd = () => {
    // Default the new row to the first (metric, agg) pair still free.
    const taken = new Set(slaTargets.map((t) => slaTargetKey(t.metric, t.agg)));
    const free = SLA_METRICS.flatMap((m) =>
      SLA_AGGS.map((a) => ({ metric: m.value, agg: a.value }))
    ).find((c) => !taken.has(slaTargetKey(c.metric, c.agg)));
    writeSlaTargets([...slaTargets, { ...(free || {}), value: null }]);
  };
  const handleSlaDelete = (index: number) => {
    const next = [...slaTargets];
    next.splice(index, 1);
    writeSlaTargets(next);
    revalidateSla();
  };
  const handleSlaChange = (index: number, partial: Partial<SlaTarget>) => {
    const next = [...slaTargets];
    let row = { ...next[index], ...partial };
    // Switching metric can collide with another row that already holds this
    // aggregation; move to the first free one for the new metric instead of
    // leaving a duplicate the validator would then have to reject.
    if (partial.metric) {
      const taken = slaTakenByOthers(index);
      if (taken.has(slaTargetKey(row.metric, row.agg))) {
        const freeAgg = SLA_AGGS.find(
          (a) => !taken.has(slaTargetKey(row.metric, a.value))
        );
        row = { ...row, agg: freeAgg?.value };
      }
    }
    next[index] = row;
    writeSlaTargets(next);
    revalidateSla();
  };

  // Collapsible field groups, all open by default: Workload / SLA / Load / Stop
  // Conditions. Every field now has a real home (no "Advanced" catch-all), so
  // there is nothing left to hide behind a collapsed section. Uses the app's
  // CollapsePanel for a style consistent with the model form & Configuration.
  const [groupKeys, setGroupKeys] = useState<string[]>([
    'dataset',
    'sla',
    'load',
    'execution'
  ]);
  const handleGroupChange = (keys: string | string[]) =>
    setGroupKeys(Array.isArray(keys) ? keys : [keys]);

  // ---- Group 1: Dataset (what data to send) ----
  const datasetContent = (
    <>
      <Form.Item<FormData>
        name="dataset_name"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'benchmark.table.dataset')
          }
        ]}
      >
        <SealSelect
          disabled={disabled}
          options={datasetList?.map((item) => ({
            ...item,
            label: item.label,
            value: item.label
          }))}
          label={intl.formatMessage({ id: 'benchmark.table.dataset' })}
          required
        ></SealSelect>
      </Form.Item>
      {isRandom && (
        <>
          <Form.Item<FormData>
            name="dataset_input_tokens"
            rules={[
              {
                required: true,
                message: getRuleMessage(
                  'input',
                  'benchmark.table.inputTokenLength'
                )
              }
            ]}
          >
            <CInputNumber
              min={0}
              disabled={disabled}
              label={intl.formatMessage({
                id: 'benchmark.table.inputTokenLength'
              })}
              required
            ></CInputNumber>
          </Form.Item>
          <Form.Item<FormData>
            name="dataset_output_tokens"
            rules={[
              {
                required: true,
                message: getRuleMessage(
                  'input',
                  'benchmark.table.outputTokenLength'
                )
              }
            ]}
          >
            <CInputNumber
              min={0}
              disabled={disabled}
              label={intl.formatMessage({
                id: 'benchmark.table.outputTokenLength'
              })}
              required
            ></CInputNumber>
          </Form.Item>
          {/* Seed card. Header = the "Random Seed" toggle. On (default): the
              seed is generated per benchmark and each stage uses a different one
              (see the tooltip) — nothing to fill, so both fields are submitted
              hidden rather than relying on an unmounted field. Off: the user pins
              a seed and chooses whether stages differ. */}
          <div className={styles.sectionCard}>
            <div
              className="section-title"
              style={{ marginBottom: randomSeed ? 0 : 16 }}
            >
              <span className="title-label">
                {intl.formatMessage({ id: 'benchmark.form.randomSeed' })}
                <Tooltip
                  title={intl.formatMessage({
                    id: 'benchmark.form.randomSeed.tips'
                  })}
                >
                  <QuestionCircleOutlined className="title-help" />
                </Tooltip>
              </span>
              <Form.Item<FormData>
                name="dataset_seed_random"
                valuePropName="checked"
                noStyle
              >
                <Switch
                  size="small"
                  disabled={disabled}
                  onChange={handleRandomSeedChange}
                />
              </Form.Item>
            </div>
            {randomSeed ? (
              <>
                <Form.Item<FormData>
                  name="dataset_seed"
                  getValueProps={(value) => ({ value: value || null })}
                  hidden
                >
                  <CInputNumber />
                </Form.Item>
                <Form.Item<FormData>
                  name="dataset_seed_increment"
                  valuePropName="checked"
                  hidden
                >
                  <Switch />
                </Form.Item>
              </>
            ) : (
              <>
                <Flex align="center" gap={10}>
                  {/* Card-style field; the reroll button mints a fresh seed. */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Form.Item<FormData>
                      name="dataset_seed"
                      getValueProps={(value) => ({ value: value || null })}
                      noStyle
                    >
                      <CInputNumber
                        required
                        min={DATASET_SEED_MIN}
                        max={DATASET_SEED_MAX}
                        disabled={disabled}
                        label={intl.formatMessage({
                          id: 'playground.image.params.seed'
                        })}
                        style={{ width: '100%' }}
                      ></CInputNumber>
                    </Form.Item>
                  </div>
                  <Button
                    icon={<ReloadOutlined />}
                    disabled={disabled}
                    onClick={handleReroll}
                    style={{ height: 48, width: 48, flex: 'none' }}
                  />
                </Flex>
                {/* Per-stage seed policy, only when the seed is pinned; when Random
                    is on it is implicitly on (see the tooltip). */}
                <Form.Item<FormData>
                  name="dataset_seed_increment"
                  valuePropName="checked"
                  noStyle
                >
                  <Checkbox disabled={disabled} style={{ marginTop: 12 }}>
                    <span className="row-switch">
                      {intl.formatMessage({
                        id: 'benchmark.form.seedIncrement'
                      })}
                      <Tooltip
                        title={intl.formatMessage({
                          id: 'benchmark.form.seedIncrement.tips'
                        })}
                      >
                        <QuestionCircleOutlined className="title-help" />
                      </Tooltip>
                    </span>
                  </Checkbox>
                </Form.Item>
              </>
            )}
          </div>
          {/* data distribution + shared prefix: each an opt-in card whose title
              carries the "?" help and a header Switch, body revealed only when
              on (mirrors the model form's Scheduled Scaling section). */}
          <>
            <div className={styles.sectionCard}>
              <div
                className="section-title"
                style={{ marginBottom: showDist ? 16 : 0 }}
              >
                <span className="title-label">
                  {intl.formatMessage({
                    id: 'benchmark.form.group.distribution'
                  })}
                  <Tooltip
                    title={intl.formatMessage({
                      id: 'benchmark.form.distribution.intro'
                    })}
                  >
                    <QuestionCircleOutlined className="title-help" />
                  </Tooltip>
                </span>
                <Switch
                  size="small"
                  checked={showDist}
                  disabled={disabled}
                  onChange={handleDistToggle}
                />
              </div>
              {showDist && (
                <>
                  {/* Each length distribution: the three knobs on one row (a
                      3-col grid of card fields), the histogram full-width below —
                      matches the design (fields never crowd the chart). */}
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'var(--ant-color-text-secondary)',
                      margin: '4px 0 8px'
                    }}
                  >
                    {intl.formatMessage({
                      id: 'benchmark.form.group.distribution.input'
                    })}
                  </div>
                  <div className={styles.distGrid}>
                    <Form.Item
                      name="dataset_input_stdev"
                      style={{ marginBottom: 0 }}
                    >
                      <CInputNumber
                        min={0}
                        disabled={disabled}
                        style={{ width: '100%' }}
                        label={intl.formatMessage({
                          id: 'benchmark.form.dist.spread'
                        })}
                        description={intl.formatMessage({
                          id: 'benchmark.form.dist.spread.tip'
                        })}
                      ></CInputNumber>
                    </Form.Item>
                    <Form.Item
                      name="dataset_input_min"
                      style={{ marginBottom: 0 }}
                    >
                      <CInputNumber
                        min={0}
                        disabled={disabled}
                        style={{ width: '100%' }}
                        label={intl.formatMessage({
                          id: 'benchmark.form.dist.min'
                        })}
                      ></CInputNumber>
                    </Form.Item>
                    <Form.Item
                      name="dataset_input_max"
                      style={{ marginBottom: 0 }}
                    >
                      <CInputNumber
                        min={0}
                        disabled={disabled}
                        style={{ width: '100%' }}
                        label={intl.formatMessage({
                          id: 'benchmark.form.dist.max'
                        })}
                      ></CInputNumber>
                    </Form.Item>
                  </div>
                  <div style={{ margin: '10px 0 16px' }}>
                    <DistributionChart
                      mean={inputTokens}
                      stdev={inStdev}
                      min={inMin}
                      max={inMax}
                    />
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'var(--ant-color-text-secondary)',
                      margin: '4px 0 8px'
                    }}
                  >
                    {intl.formatMessage({
                      id: 'benchmark.form.group.distribution.output'
                    })}
                  </div>
                  <div className={styles.distGrid}>
                    <Form.Item
                      name="dataset_output_stdev"
                      style={{ marginBottom: 0 }}
                    >
                      <CInputNumber
                        min={0}
                        disabled={disabled}
                        style={{ width: '100%' }}
                        label={intl.formatMessage({
                          id: 'benchmark.form.dist.spread'
                        })}
                        description={intl.formatMessage({
                          id: 'benchmark.form.dist.spread.tip'
                        })}
                      ></CInputNumber>
                    </Form.Item>
                    <Form.Item
                      name="dataset_output_min"
                      style={{ marginBottom: 0 }}
                    >
                      <CInputNumber
                        min={0}
                        disabled={disabled}
                        style={{ width: '100%' }}
                        label={intl.formatMessage({
                          id: 'benchmark.form.dist.min'
                        })}
                      ></CInputNumber>
                    </Form.Item>
                    <Form.Item
                      name="dataset_output_max"
                      style={{ marginBottom: 0 }}
                    >
                      <CInputNumber
                        min={0}
                        disabled={disabled}
                        style={{ width: '100%' }}
                        label={intl.formatMessage({
                          id: 'benchmark.form.dist.max'
                        })}
                      ></CInputNumber>
                    </Form.Item>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <DistributionChart
                      mean={outputTokens}
                      stdev={outStdev}
                      min={outMin}
                      max={outMax}
                    />
                  </div>
                </>
              )}
            </div>
            <div className={styles.sectionCard}>
              <div
                className="section-title"
                style={{ marginBottom: showPrefix ? 16 : 0 }}
              >
                <span className="title-label">
                  {intl.formatMessage({ id: 'benchmark.form.sharedPrefix' })}
                  <Tooltip
                    title={intl.formatMessage({
                      id: 'benchmark.form.prefix.tip'
                    })}
                  >
                    <QuestionCircleOutlined className="title-help" />
                  </Tooltip>
                </span>
                <Switch
                  size="small"
                  checked={showPrefix}
                  disabled={disabled}
                  onChange={handlePrefixToggle}
                />
              </div>
              {showPrefix && (
                <Form.Item
                  name="prefix_buckets"
                  style={{ marginBottom: 0 }}
                  rules={[
                    {
                      validator: async (_r, value: any[]) => {
                        if (!value?.length) return;
                        if (value.some((b) => b?.prefix_tokens == null)) {
                          setPrefixValidated(true);
                          throw new Error(
                            getRuleMessage(
                              'input',
                              'benchmark.form.prefix.length'
                            )
                          );
                        }
                      }
                    }
                  ]}
                >
                  {/* Same list UX as Add Cluster's Image Credentials: a
                      MetadataList (bordered card stripped here since the section
                      is already a card) with a block "Add" button and a circular
                      per-row delete button. */}
                  <MetadataList
                    label={null}
                    dataList={prefixBuckets || []}
                    disabled={disabled}
                    btnText={intl.formatMessage({
                      id: 'benchmark.form.prefix.add'
                    })}
                    onAdd={handlePrefixAdd}
                    onDelete={handlePrefixDelete}
                    styles={{
                      wrapper: {
                        border: 'none',
                        borderRadius: 0,
                        padding: 0
                      }
                    }}
                  >
                    {(item: any, index: number) => (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {index !== 0 && <div style={{ height: 12 }} />}
                        <div style={{ display: 'flex', gap: 12 }}>
                          <CInputNumber
                            required
                            min={1}
                            disabled={disabled}
                            value={item.prefix_tokens}
                            onChange={(v) =>
                              handlePrefixItemChange(index, {
                                prefix_tokens: v
                              })
                            }
                            checkStatus={
                              prefixValidated && item.prefix_tokens == null
                                ? 'error'
                                : 'success'
                            }
                            label={intl.formatMessage({
                              id: 'benchmark.form.prefix.length'
                            })}
                            style={{ width: '100%' }}
                          ></CInputNumber>
                          <CInputNumber
                            min={1}
                            disabled={disabled}
                            value={item.prefix_count}
                            onChange={(v) =>
                              handlePrefixItemChange(index, {
                                prefix_count: v
                              })
                            }
                            label={intl.formatMessage({
                              id: 'benchmark.form.prefix.count'
                            })}
                            style={{ width: '100%' }}
                          ></CInputNumber>
                          <CInputNumber
                            min={1}
                            disabled={disabled}
                            value={item.bucket_weight}
                            onChange={(v) =>
                              handlePrefixItemChange(index, {
                                bucket_weight: v
                              })
                            }
                            label={intl.formatMessage({
                              id: 'benchmark.form.prefix.weight'
                            })}
                            style={{ width: '100%' }}
                          ></CInputNumber>
                        </div>
                      </div>
                    )}
                  </MetadataList>
                </Form.Item>
              )}
            </div>
            {/* Multi-turn: synthetic `turns`. A data-shape knob (each request
                becomes a running conversation), so it belongs with the other
                Workload cards, not a generic "advanced" bucket. One-row card —
                the turns stepper + enable switch both sit in the header. */}
            <div className={styles.sectionCard}>
              <div className="section-title" style={{ marginBottom: 0 }}>
                <span className="title-label">
                  {intl.formatMessage({ id: 'benchmark.form.multiTurn' })}
                  <Tooltip
                    title={intl.formatMessage({
                      id: 'benchmark.form.multiTurn.tips'
                    })}
                  >
                    <QuestionCircleOutlined className="title-help" />
                  </Tooltip>
                </span>
                <Flex align="center" gap={8}>
                  {/* "turns" label + −/+ stepper in one bordered pill (dimmed
                      when off), then the enable switch — mirrors the design. The
                      stepper is small so the row stays as short as a plain switch
                      card rather than towering over it. */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      border: '1px solid var(--ant-color-border)',
                      borderRadius: 8,
                      background: 'var(--ant-color-fill-quaternary)',
                      padding: '0 2px 0 8px',
                      opacity: multiTurnOn ? 1 : 0.5
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--ant-color-text-tertiary)'
                      }}
                    >
                      {intl.formatMessage({ id: 'benchmark.form.turns.unit' })}
                    </span>
                    <Button
                      type="text"
                      size="small"
                      icon={<MinusOutlined />}
                      disabled={disabled || !multiTurnOn}
                      onClick={handleTurnDown}
                    />
                    <Form.Item<FormData>
                      name="turns"
                      getValueProps={(value) => ({ value: value ?? 1 })}
                      noStyle
                    >
                      <InputNumber
                        // When off the field shows a disabled "1"; keep min at 1
                        // then so antd doesn't flag it out-of-range (red). On =>
                        // floor is 2 (1 turn == single-turn == off).
                        min={multiTurnOn ? 2 : 1}
                        size="small"
                        controls={false}
                        variant="borderless"
                        disabled={disabled || !multiTurnOn}
                        style={{ width: 36, textAlign: 'center' }}
                      />
                    </Form.Item>
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusOutlined />}
                      disabled={disabled || !multiTurnOn}
                      onClick={handleTurnUp}
                    />
                  </div>
                  <Switch
                    size="small"
                    checked={multiTurnOn}
                    disabled={disabled}
                    onChange={handleMultiTurnToggle}
                  />
                </Flex>
              </div>
            </div>
          </>
        </>
      )}
    </>
  );

  // ---- Group 2: Load (how to drive traffic) ----
  // Load Type (the axis) applies to BOTH modes — it also labels the manual stage
  // rows — so it stays a top-level field. Everything about *which* load points get
  // measured lives in one "Stages" card: Auto-tune (the adaptive ramp finds them,
  // plus its search range / budget) or Manual (you list them yourself). One stage =
  // one measured point either way, which is exactly how the detail page reports
  // results ("Results by stage"), so config and read-back use the same word.
  //
  // The mode is a Segmented, not a Switch: the two are alternatives rather than a
  // feature you enable, and an "off" switch here would have to mean "a table
  // appears" — the opposite of the Distribution / Shared Prefix cards above, where
  // off means nothing shows.
  const stagesMode = effectiveAutoTune ? 'auto' : 'manual';
  const stagesModeOptions = [
    {
      label: intl.formatMessage({ id: 'benchmark.form.autoTune' }),
      value: 'auto' as const,
      icon: <ThunderboltOutlined />
    },
    {
      label: intl.formatMessage({ id: 'benchmark.form.stages.mode.manual' }),
      value: 'manual' as const,
      icon: <ControlOutlined />
    }
  ];
  const loadContent = (
    <>
      {/* Load Type (axis). Locked for named presets — the value then reads
          "… (managed by profile)" to make the read-only nature explicit. */}
      <Form.Item<FormData> name="load_type">
        <SealSelect
          disabled={disabled || presetLocked}
          label={intl.formatMessage({ id: 'benchmark.form.loadType' })}
          options={loadTypeOptions.map((o) => ({
            label:
              intl.formatMessage({ id: o.label }) +
              (presetLocked
                ? ` (${intl.formatMessage({
                    id: 'benchmark.form.load.managedByProfile'
                  })})`
                : ''),
            value: o.value
          }))}
        ></SealSelect>
      </Form.Item>

      {/* The mode is driven by the Segmented below, but `auto_tune` MUST stay
          registered as a field — an unmounted field isn't submitted, which would
          save auto_tune=false and make the runner do a manual `constant` run. */}
      <Form.Item<FormData> name="auto_tune" valuePropName="checked" hidden>
        <Switch />
      </Form.Item>

      <div className={styles.sectionCard}>
        <div className="section-title" style={{ marginBottom: 16 }}>
          <span className="title-label">
            {intl.formatMessage({ id: 'benchmark.form.stages' })}
            <Tooltip
              title={intl.formatMessage({
                id: isFixedRate
                  ? 'benchmark.form.autoTune.rate.tip'
                  : 'benchmark.form.autoTune.concurrency.tip'
              })}
            >
              <QuestionCircleOutlined className="title-help" />
            </Tooltip>
          </span>
          {/* Named presets are auto-tune by definition and can't switch to manual,
              so show a locked "Auto-tune" pill instead of a disabled Segmented.
              Custom keeps the auto/manual toggle. */}
          {presetLocked ? (
            <span className={styles.autoTunePill}>
              <LockOutlined />
              {intl.formatMessage({ id: 'benchmark.form.autoTune' })}
            </span>
          ) : (
            <Segmented
              className={styles.modeSwitch}
              value={stagesMode}
              disabled={disabled}
              options={stagesModeOptions}
              onChange={handleStagesModeChange}
            />
          )}
        </div>

        {/* Auto-tune: the search range on one row (lower_bound = ramp start, where
            the geometric doubling begins; upper_bound = ceiling) framed by a shared
            label + "?" as one [min ~ max] range, then the budget — how many points
            to sample and the overall time cap. multiplier / min_requests stay
            internal defaults (not exposed). */}
        {effectiveAutoTune ? (
          /* Flat field-cards (matches the design): a bold sub-heading, then the
             search range as From / To labeled fields (not a "~" range), then the
             two budgets side by side. Each field is a card whose own label names
             it — no extra nested card wrapper. */
          <Flex vertical gap={12}>
            <Flex gap={12}>
              <Form.Item<FormData>
                name="lower_bound"
                style={{ flex: 1, marginBottom: 0 }}
              >
                <CInputNumber
                  min={1}
                  disabled={disabled}
                  style={{ width: '100%' }}
                  label={intl.formatMessage({
                    id: isFixedRate
                      ? 'benchmark.form.autoTune.rateFrom'
                      : 'benchmark.form.autoTune.concFrom'
                  })}
                ></CInputNumber>
              </Form.Item>
              <Form.Item<FormData>
                name="upper_bound"
                style={{ flex: 1, marginBottom: 0 }}
              >
                <CInputNumber
                  min={1}
                  disabled={disabled}
                  style={{ width: '100%' }}
                  label={intl.formatMessage({
                    id: isFixedRate
                      ? 'benchmark.form.autoTune.rateTo'
                      : 'benchmark.form.autoTune.concTo'
                  })}
                ></CInputNumber>
              </Form.Item>
            </Flex>
            <Flex gap={12}>
              <Form.Item<FormData>
                name="max_points"
                style={{ flex: 1, marginBottom: 0 }}
              >
                <CInputNumber
                  min={2}
                  disabled={disabled}
                  style={{ width: '100%' }}
                  label={intl.formatMessage({
                    id: 'benchmark.form.autoTune.maxPoints'
                  })}
                ></CInputNumber>
              </Form.Item>
              <Form.Item<FormData>
                name="max_total_seconds"
                style={{ flex: 1, marginBottom: 0 }}
              >
                <CInputNumber
                  min={1}
                  disabled={disabled}
                  style={{ width: '100%' }}
                  label={intl.formatMessage({
                    id: 'benchmark.form.autoTune.maxTotalSeconds'
                  })}
                ></CInputNumber>
              </Form.Item>
            </Flex>
          </Flex>
        ) : (
          /* Manual: one row per load level + its per-stage Requests / Max Seconds.
             Same list UX as Add Cluster's Image Credentials (MetadataList with a
             block "Add" button and a circular per-row delete); the card border is
             stripped since this card already provides one. */
          <Form.Item
            name="stages"
            style={{ marginBottom: 0 }}
            rules={[
              {
                validator: async (_r, value: any[]) => {
                  if (!value || value.length === 0) {
                    setStagesValidated(true);
                    throw new Error(
                      getRuleMessage('input', 'benchmark.form.stages')
                    );
                  }
                  if (value.some((s) => s?.rate == null)) {
                    setStagesValidated(true);
                    throw new Error(
                      getRuleMessage('input', 'benchmark.form.rate')
                    );
                  }
                  if (
                    value.some(
                      (s) => s?.max_requests == null && s?.max_seconds == null
                    )
                  ) {
                    setStagesValidated(true);
                    throw new Error(
                      intl.formatMessage({
                        id: 'benchmark.form.requestsOrSeconds'
                      })
                    );
                  }
                }
              }
            ]}
          >
            <MetadataList
              label={null}
              dataList={stages || []}
              disabled={disabled}
              btnText={intl.formatMessage({ id: 'benchmark.form.addStage' })}
              onAdd={handleStageAdd}
              onDelete={handleStageDelete}
              styles={{
                wrapper: { border: 'none', borderRadius: 0, padding: 0 }
              }}
            >
              {(item: any, index: number) => (
                <div style={{ flex: 1, minWidth: 0 }}>
                  {index !== 0 && <div style={{ height: 12 }} />}
                  <div style={{ display: 'flex', gap: 12 }}>
                    {/* Wrap each field in a flex div (Rate wider — its label is
                      the longest); the SealInputNumber's own `style` is passed
                      to the inner input, so the column width must live on the
                      wrapper. */}
                    <div style={{ flex: 1.7, minWidth: 0 }}>
                      <CInputNumber
                        required
                        min={1}
                        disabled={disabled}
                        value={item.rate}
                        onChange={(v) => handleStageChange(index, { rate: v })}
                        checkStatus={
                          stagesValidated && item.rate == null
                            ? 'error'
                            : 'success'
                        }
                        label={rateLabel}
                        style={{ width: '100%' }}
                      ></CInputNumber>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <CInputNumber
                        min={1}
                        disabled={disabled}
                        value={item.max_requests}
                        onChange={(v) =>
                          handleStageChange(index, { max_requests: v })
                        }
                        checkStatus={
                          stagesValidated &&
                          item.max_requests == null &&
                          item.max_seconds == null
                            ? 'error'
                            : 'success'
                        }
                        label={intl.formatMessage({
                          id: 'benchmark.form.requests'
                        })}
                        style={{ width: '100%' }}
                      ></CInputNumber>
                    </div>
                    <div style={{ flex: 1.2, minWidth: 0 }}>
                      <CInputNumber
                        min={1}
                        disabled={disabled}
                        value={item.max_seconds}
                        onChange={(v) =>
                          handleStageChange(index, { max_seconds: v })
                        }
                        label={intl.formatMessage({
                          id: 'benchmark.form.maxSeconds'
                        })}
                        style={{ width: '100%' }}
                      ></CInputNumber>
                    </div>
                  </div>
                </div>
              )}
            </MetadataList>
          </Form.Item>
        )}
      </div>
      {/* Warmup / Cooldown trim the first / last slice of each stage's requests
          from the measured window — they shape the stage's load profile, so they
          sit with Load, right under the stages. Keep the default Form.Item bottom
          margin (no marginBottom:0) so the tall floating-label fields don't crowd
          / overlap the next collapse group's header. */}
      <Flex gap={12}>
        <Form.Item<FormData> name="warmup" style={{ flex: 1 }}>
          <CInputNumber
            min={0}
            disabled={disabled}
            label={intl.formatMessage({ id: 'benchmark.form.warmup' })}
            style={{ width: '100%' }}
          ></CInputNumber>
        </Form.Item>
        <Form.Item<FormData> name="cooldown" style={{ flex: 1 }}>
          <CInputNumber
            min={0}
            disabled={disabled}
            label={intl.formatMessage({ id: 'benchmark.form.cooldown' })}
            style={{ width: '100%' }}
          ></CInputNumber>
        </Form.Item>
      </Flex>
    </>
  );

  // ---- Group: Latency SLA (concurrency axis only) ----
  // Optional "<= (ms)" targets — the benchmark's GOAL (auto-tune finds the max
  // concurrency that stays within them). A point meets the SLA when every SET
  // threshold holds (AND) + success >= 95%.
  //
  // A LIST rather than one row per metric, so a metric can carry several
  // aggregations ("TTFT avg <= 500 AND TTFT p99 <= 2000"). Same MetadataList UX
  // as Shared Prefix / manual stages. Empty list = no SLA, which is what makes
  // the whole latency-SLA analysis opt-in.
  const slaContent = (
    <Form.Item
      name="sla_targets"
      rules={[
        {
          validator: async (_r, value: SlaTarget[]) => {
            if (!value?.length) return;
            if (value.some((t) => !t?.metric || !t?.agg || t?.value == null)) {
              setSlaValidated(true);
              throw new Error(
                getRuleMessage('input', 'benchmark.form.sla.threshold')
              );
            }
          }
        }
      ]}
    >
      <MetadataList
        label={null}
        dataList={slaTargets}
        disabled={disabled}
        btnText={intl.formatMessage({ id: 'benchmark.form.sla.add' })}
        onAdd={handleSlaAdd}
        onDelete={handleSlaDelete}
        styles={{
          // Keep MetadataList's own border (unlike the Shared Prefix list, which
          // strips it because its sectionCard already draws one). Without a box
          // the full-width grey "Add SLA Target" button butts straight up against
          // the equally grey "Load" group header below it and the two read as one
          // control. Only the top padding is overridden: the component reserves
          // 34px there for an absolutely-positioned label we don't render.
          wrapper: { paddingTop: 14 }
        }}
      >
        {(item: SlaTarget, index: number) => {
          const taken = slaTakenByOthers(index);
          return (
            <div style={{ flex: 1, minWidth: 0 }}>
              {index !== 0 && <div style={{ height: 12 }} />}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1.2, minWidth: 0 }}>
                  <CSelect
                    disabled={disabled}
                    value={item.metric}
                    onChange={(v: SlaMetric) =>
                      handleSlaChange(index, { metric: v })
                    }
                    label={intl.formatMessage({
                      id: 'benchmark.form.sla.metric'
                    })}
                    options={SLA_METRICS.map((m) => ({
                      label: intl.formatMessage({ id: m.label }),
                      value: m.value,
                      // A metric whose every aggregation is already claimed has
                      // nothing left to offer this row.
                      disabled: SLA_AGGS.every((a) =>
                        taken.has(slaTargetKey(m.value, a.value))
                      )
                    }))}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <CSelect
                    disabled={disabled}
                    value={item.agg}
                    onChange={(v: SlaAgg) => handleSlaChange(index, { agg: v })}
                    label={intl.formatMessage({
                      id: 'benchmark.form.sla.aggregation'
                    })}
                    options={SLA_AGGS.map((a) => ({
                      label: intl.formatMessage({ id: a.label }),
                      value: a.value,
                      disabled: taken.has(slaTargetKey(item.metric, a.value))
                    }))}
                  />
                </div>
                <div style={{ flex: 1.3, minWidth: 0 }}>
                  <CInputNumber
                    required
                    min={0}
                    disabled={disabled}
                    value={item.value}
                    onChange={(v) =>
                      handleSlaChange(index, {
                        value: v == null || v === '' ? null : Number(v)
                      })
                    }
                    checkStatus={
                      slaValidated && item.value == null ? 'error' : 'success'
                    }
                    label={intl.formatMessage({
                      id: 'benchmark.form.sla.threshold'
                    })}
                    style={{ width: '100%' }}
                  ></CInputNumber>
                </div>
              </div>
            </div>
          );
        }}
      </MetadataList>
    </Form.Item>
  );

  // ---- Group: Stop Conditions (when the benchmark stops) ----
  // General runtime caps that apply to ANY mode (the auto-tune budget lives in
  // the Load / Stages card). Every field here now has a real home, so there is no
  // longer an "Advanced" catch-all: turns → Workload, warmup/cooldown → Load,
  // per-stage seed → the Seed card.
  const executionLimitsContent = (
    <>
      {/* Max Errors + Max Error Rate are a natural pair, so they share a row.
          Default bottom margin (no marginBottom:0) so the row doesn't overlap the
          Stop-on-Saturation card below it. */}
      <Flex gap={12}>
        <Form.Item<FormData> name="max_errors" style={{ flex: 1 }}>
          <CInputNumber
            min={0}
            disabled={disabled}
            label={intl.formatMessage({ id: 'benchmark.form.maxErrors' })}
            style={{ width: '100%' }}
          ></CInputNumber>
        </Form.Item>
        <Form.Item<FormData> name="max_error_rate" style={{ flex: 1 }}>
          <CInputNumber
            // A FRACTION in the open interval (0, 1): guidellm's constraint
            // rejects both endpoints, so the form must not be able to produce
            // them. "Tolerate everything" is expressed by leaving this empty,
            // not by entering 1.
            min={0.01}
            max={0.99}
            step={0.01}
            disabled={disabled}
            label={
              <>
                {intl.formatMessage({ id: 'benchmark.form.maxErrorRate' })}
                <Tooltip
                  title={intl.formatMessage({
                    id: 'benchmark.form.maxErrorRate.tips'
                  })}
                >
                  <QuestionCircleOutlined className="title-help" />
                </Tooltip>
              </>
            }
            style={{ width: '100%' }}
          ></CInputNumber>
        </Form.Item>
      </Flex>
      {/* Stop-on-saturation maps to guidellm's native OverSaturationConstraint
          (stop once throughput saturates). A general cap (not auto-tune only),
          rendered as an opt-in card to match the Workload cards' look. */}
      <div className={styles.sectionCard}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          <span className="title-label">
            {intl.formatMessage({ id: 'benchmark.form.stopOnSaturation' })}
            <Tooltip
              title={intl.formatMessage({
                id: 'benchmark.form.stopOnSaturation.tips'
              })}
            >
              <QuestionCircleOutlined className="title-help" />
            </Tooltip>
          </span>
          <Form.Item<FormData>
            name="stop_on_saturation"
            valuePropName="checked"
            noStyle
          >
            <Switch size="small" disabled={disabled} />
          </Form.Item>
        </div>
      </div>
    </>
  );

  // Top-level collapsible groups (order = the user's flow: what data → the goal
  // → how to drive → when to stop). SLA is the goal, so it sits right after
  // Workload and before Load. The header carries a data-field anchor so the top
  // scroll-spy nav can jump to each section (see segmentOptions in ./index).
  const groupLabel = (field: string, id: string) => (
    <span data-field={field} style={{ scrollMarginTop: 160 }}>
      {intl.formatMessage({ id })}
    </span>
  );
  return (
    <CollapsePanel
      activeKey={groupKeys}
      accordion={false}
      onChange={handleGroupChange}
      items={[
        {
          key: 'dataset',
          label: groupLabel('dataset', 'benchmark.form.group.dataset'),
          forceRender: true,
          children: datasetContent
        },
        ...(showSLA
          ? [
              {
                key: 'sla',
                label: groupLabel('sla', 'benchmark.form.group.sla'),
                forceRender: true,
                children: slaContent
              }
            ]
          : []),
        {
          key: 'load',
          label: groupLabel('load', 'benchmark.form.group.load'),
          forceRender: true,
          children: loadContent
        },
        {
          key: 'execution',
          label: groupLabel('execution', 'benchmark.form.group.execution'),
          forceRender: true,
          children: executionLimitsContent
        }
      ]}
    ></CollapsePanel>
  );
};

export default RandomSettingsForm;
