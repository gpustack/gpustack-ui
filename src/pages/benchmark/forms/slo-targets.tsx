import { PageAction } from '@/config';
import {
  InputNumber as CInputNumber,
  Select as CSelect,
  MetadataList,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form } from 'antd';
import React, { useState } from 'react';
import {
  SLO_AGGS,
  SLO_METRICS,
  type SloAgg,
  type SloMetric,
  type SloTarget,
  sloTargetKey
} from '../config';
import { useFormContext } from '../config/form-context';

// The Latency SLO group of the benchmark form, rendered by random-settings when
// the profile allows it (profileAllowsSlo).
//
// Optional "<= (ms)" targets — the benchmark's GOAL (auto-tune finds the max
// concurrency that stays within them). A point meets the SLO when every SET
// threshold holds (AND) + success >= 95%.
//
// A LIST rather than one row per metric, so a metric can carry several
// aggregations ("TTFT avg <= 500 AND TTFT p99 <= 2000"). Same MetadataList UX
// as Shared Prefix / manual stages. Empty list = no SLO, which is what makes
// the whole latency-SLO analysis opt-in.
//
// The row shape and the list <-> flat-field mapping (SLO_METRICS / SLO_AGGS /
// sloTargetsFromFields) live in config/index.ts, since the detail page and the
// preset prefill need the same mapping.
const SloTargetsForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { action } = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const disabled = action === PageAction.EDIT;

  // Same controlled MetadataList pattern as the bucket / stage lists.
  // `slo_targets` is the ONLY SLO field this form registers; the 9 flat
  // `slo_*_ms` fields the API takes are derived from it at submit time (see
  // handleModalOk in ../index). Writing them here with setFieldsValue would be
  // pointless — antd's onFinish only carries registered fields, so a value in
  // the store with no Form.Item never reaches the request.
  // `sloValidated` flips on the first failed submit so empty required fields
  // highlight.
  const sloTargets: SloTarget[] = Form.useWatch('slo_targets', form) || [];
  const [sloValidated, setSloValidated] = useState(false);
  const revalidateSlo = () => {
    if (sloValidated) form.validateFields(['slo_targets']).catch(() => {});
  };
  // setFieldValue resolves to setFields([{ …, errors: [], warnings: [] }]), so it
  // WIPES the field's error. Every caller must re-run the validator afterwards or
  // a still-invalid list would silently lose its message.
  const writeSloTargets = (next: SloTarget[]) => {
    form.setFieldValue('slo_targets', next);
    revalidateSlo();
  };
  // (metric, agg) pairs claimed by the OTHER rows. Used to disable them in this
  // row's selectors, so a duplicate threshold is impossible to build rather than
  // something the user has to be told about after submitting.
  const sloTakenByOthers = (index: number) =>
    new Set(
      sloTargets
        .filter((_, i) => i !== index)
        .map((t) => sloTargetKey(t.metric, t.agg))
    );
  const handleSloAdd = () => {
    // Default the new row to the first (metric, agg) pair still free.
    const taken = new Set(sloTargets.map((t) => sloTargetKey(t.metric, t.agg)));
    const free = SLO_METRICS.flatMap((m) =>
      SLO_AGGS.map((a) => ({ metric: m.value, agg: a.value }))
    ).find((c) => !taken.has(sloTargetKey(c.metric, c.agg)));
    writeSloTargets([...sloTargets, { ...(free || {}), value: null }]);
  };
  const handleSloDelete = (index: number) => {
    const next = [...sloTargets];
    next.splice(index, 1);
    writeSloTargets(next);
  };
  const handleSloChange = (index: number, partial: Partial<SloTarget>) => {
    const next = [...sloTargets];
    let row = { ...next[index], ...partial };
    // Switching metric can collide with another row that already holds this
    // aggregation; move to the first free one for the new metric instead of
    // leaving a duplicate the validator would then have to reject.
    if (partial.metric) {
      const taken = sloTakenByOthers(index);
      if (taken.has(sloTargetKey(row.metric, row.agg))) {
        const freeAgg = SLO_AGGS.find(
          (a) => !taken.has(sloTargetKey(row.metric, a.value))
        );
        row = { ...row, agg: freeAgg?.value };
      }
    }
    next[index] = row;
    writeSloTargets(next);
  };

  return (
    <Form.Item
      name="slo_targets"
      rules={[
        {
          validator: async (_r, value: SloTarget[]) => {
            if (!value?.length) return;
            if (value.some((t) => !t?.metric || !t?.agg || t?.value == null)) {
              setSloValidated(true);
              throw new Error(
                getRuleMessage('input', 'benchmark.form.slo.threshold')
              );
            }
          }
        }
      ]}
    >
      <MetadataList
        label={null}
        dataList={sloTargets}
        disabled={disabled}
        btnText={intl.formatMessage({ id: 'benchmark.form.slo.add' })}
        onAdd={handleSloAdd}
        onDelete={handleSloDelete}
        styles={{
          // Keep MetadataList's own border (unlike the Shared Prefix list, which
          // strips it because its SectionCard already draws one). Without a box
          // the full-width grey "Add SLO Target" button butts straight up against
          // the equally grey "Load" group header below it and the two read as one
          // control. Only the top padding is overridden: the component reserves
          // 34px there for an absolutely-positioned label we don't render.
          wrapper: { paddingTop: 14 }
        }}
      >
        {(item: SloTarget, index: number) => {
          const taken = sloTakenByOthers(index);
          return (
            <div style={{ flex: 1, minWidth: 0 }}>
              {index !== 0 && <div style={{ height: 12 }} />}
              <Flex gap={12}>
                <div style={{ flex: 1.2, minWidth: 0 }}>
                  <CSelect
                    disabled={disabled}
                    value={item.metric}
                    onChange={(v: SloMetric) =>
                      handleSloChange(index, { metric: v })
                    }
                    label={intl.formatMessage({
                      id: 'benchmark.form.slo.metric'
                    })}
                    options={SLO_METRICS.map((m) => ({
                      label: intl.formatMessage({ id: m.label }),
                      value: m.value,
                      // A metric whose every aggregation is already claimed has
                      // nothing left to offer this row.
                      disabled: SLO_AGGS.every((a) =>
                        taken.has(sloTargetKey(m.value, a.value))
                      )
                    }))}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <CSelect
                    disabled={disabled}
                    value={item.agg}
                    onChange={(v: SloAgg) => handleSloChange(index, { agg: v })}
                    label={intl.formatMessage({
                      id: 'benchmark.form.slo.aggregation'
                    })}
                    options={SLO_AGGS.map((a) => ({
                      label: intl.formatMessage({ id: a.label }),
                      value: a.value,
                      disabled: taken.has(sloTargetKey(item.metric, a.value))
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
                      handleSloChange(index, {
                        value: v == null || v === '' ? null : Number(v)
                      })
                    }
                    checkStatus={
                      sloValidated && item.value == null ? 'error' : 'success'
                    }
                    label={intl.formatMessage({
                      id: 'benchmark.form.slo.threshold'
                    })}
                    style={{ width: '100%' }}
                  ></CInputNumber>
                </div>
              </Flex>
            </div>
          );
        }}
      </MetadataList>
    </Form.Item>
  );
};

export default SloTargetsForm;
