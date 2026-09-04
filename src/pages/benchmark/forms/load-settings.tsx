import { PageAction } from '@/config';
import { ControlOutlined, ThunderboltOutlined } from '@ant-design/icons';
import {
  InputNumber as CInputNumber,
  MetadataList,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form, Segmented, Switch, Tag } from 'antd';
import React, { useState } from 'react';
import SectionCard from '../components/section-card';
import {
  AUTO_TUNE_DEFAULTS,
  LoadTypeValueMap,
  ProfileValueMap,
  loadTypeOptions
} from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

// ---- Group: Load (how to drive traffic) ----
// Load Type (the axis) applies to BOTH modes — it also labels the manual stage
// rows — so it stays a top-level field. Everything about *which* load points get
// measured lives in one "Stages" card: Auto-tune (the adaptive ramp finds them,
// plus its search range / budget) or Manual (you list them yourself). One stage =
// one measured point either way, which is exactly how the detail page reports
// results ("Results by stage"), so config and read-back use the same word.
//
// The mode is a Segmented, not a Switch: the two are alternatives rather than a
// feature you enable, and an "off" switch here would have to mean "a table
// appears" — the opposite of the Distribution / Shared Prefix cards, where off
// means nothing shows.
const LoadSettingsForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { action } = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const disabled = action === PageAction.EDIT;

  // Field visibility derives from `load_type` (the axis) + `auto_tune` (how the
  // measured load points — the stages — are chosen). Both are always shown so the
  // config is transparent, but locked (read-only) for named presets: only Custom
  // lets you change them.
  const profile = Form.useWatch('profile', form);
  const loadType = Form.useWatch('load_type', form);
  const autoTune = Form.useWatch('auto_tune', form);
  const isCustom = profile === ProfileValueMap.Custom;
  const presetLocked = !isCustom;
  const isFixedRate = loadType === LoadTypeValueMap.FixedRate;
  // Named presets are ALWAYS auto-tune (the ramp is the whole point); only Custom
  // can switch to manual stages. Derive from that so the section renders correctly
  // even if the auto_tune field value lags/is missing.
  const effectiveAutoTune = isCustom ? !!autoTune : true;

  const rateLabel = isFixedRate
    ? intl.formatMessage({ id: 'benchmark.form.rate' })
    : intl.formatMessage({ id: 'benchmark.form.concurrency' });

  // Manual stages use the same controlled MetadataList pattern as the bucket
  // list / Image Credentials. `stagesValidated` highlights empty required
  // fields after the first failed submit.
  const stages = Form.useWatch('stages', form);
  const [stagesValidated, setStagesValidated] = useState(false);
  const revalidateStages = () => {
    if (stagesValidated) form.validateFields(['stages']).catch(() => {});
  };
  // setFieldValue resolves to setFields([{ …, errors: [], warnings: [] }]), so
  // it WIPES the field's error. Every write goes through here so a list that is
  // still invalid can't silently lose its message — adding a row in particular
  // appends one with no rate, which is exactly what the validator rejects.
  const writeStages = (next: Record<string, any>[]) => {
    form.setFieldValue('stages', next);
    revalidateStages();
  };
  const handleStageAdd = () => {
    writeStages([...(stages || []), { rate: undefined }]);
  };
  const handleStageDelete = (index: number) => {
    const next = [...(stages || [])];
    next.splice(index, 1);
    writeStages(next);
  };
  const handleStageChange = (index: number, partial: Record<string, any>) => {
    const next = [...(stages || [])];
    next[index] = { ...next[index], ...partial };
    writeStages(next);
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

  return (
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

      <SectionCard
        title={intl.formatMessage({ id: 'benchmark.form.stages' })}
        tip={intl.formatMessage({
          id: isFixedRate
            ? 'benchmark.form.autoTune.rate.tip'
            : 'benchmark.form.autoTune.concurrency.tip'
        })}
        extra={
          /* Named presets are auto-tune by definition and can't switch to
             manual, so show a locked "Auto-tune" pill instead of a disabled
             Segmented. Custom keeps the auto/manual toggle. */
          presetLocked ? (
            <Tag
              icon={<ThunderboltOutlined />}
              color="geekblue"
              variant="outlined"
            >
              {intl.formatMessage({ id: 'benchmark.form.autoTune' })}
            </Tag>
          ) : (
            <Segmented
              style={{ fontSize: 13 }}
              size="middle"
              value={stagesMode}
              disabled={disabled}
              options={stagesModeOptions}
              onChange={handleStagesModeChange}
            />
          )
        }
      >
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
                  <Flex gap={12}>
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
                  </Flex>
                </div>
              )}
            </MetadataList>
          </Form.Item>
        )}
      </SectionCard>
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
};

export default LoadSettingsForm;
