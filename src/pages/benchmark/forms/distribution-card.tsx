import { PageAction } from '@/config';
import { InputNumber as CInputNumber } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import DistributionChart from '../components/distribution-chart';
import SectionCard from '../components/section-card';
import { useFormContext } from '../config/form-context';

const useStyles = createStyles(({ css }) => ({
  // Three equal columns for a length-distribution row (Spread / Min / Max),
  // sitting above the full-width histogram.
  distGrid: css`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  `,
  // Sub-heading above each of the two distributions (Input / Output).
  distHeading: css`
    font-weight: 500;
    font-size: 14px;
    color: var(--ant-color-text-secondary);
    margin: 4px 0 8px;
  `
}));

const hasVal = (...vs: any[]) => vs.some((v) => v != null && v !== '');

// Data distribution is opt-in, and input / output share one toggle. The inputs
// appear once it is on (or, in EDIT, when any of the values already exists). The
// means come from Input/Output Token Length, which live in the parent form.
const DistributionCard: React.FC = () => {
  const { styles } = useStyles();
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { action } = useFormContext();
  const disabled = action === PageAction.EDIT;

  // The two means are registered by the parent form, so a plain watch is fine.
  const inputTokens = Form.useWatch('dataset_input_tokens', form);
  const outputTokens = Form.useWatch('dataset_output_tokens', form);
  // `preserve: true` is REQUIRED for these six, not a tweak: it makes useWatch
  // read getFieldsValue(true) — the raw store — instead of getFieldsValue(),
  // which only carries REGISTERED fields. Their Form.Items live in SectionCard's
  // open-gated children, so a plain watch would read undefined while the card is
  // closed, `showDist` would stay false, and the card could never open from
  // prefilled data. Circular.
  const preserved = { form, preserve: true } as const;
  const inStdev = Form.useWatch('dataset_input_stdev', preserved);
  const inMin = Form.useWatch('dataset_input_min', preserved);
  const inMax = Form.useWatch('dataset_input_max', preserved);
  const outStdev = Form.useWatch('dataset_output_stdev', preserved);
  const outMin = Form.useWatch('dataset_output_min', preserved);
  const outMax = Form.useWatch('dataset_output_max', preserved);

  // null = the user has not touched the switch, so derive from the store.
  // Deriving from `currentData` instead would re-open a card the user explicitly
  // collapsed: collapsing nulls the six fields, but that prefill snapshot still
  // holds the original ones, so every remount (switching the dataset away from
  // Random and back) would resurrect it.
  const [distToggle, setDistToggle] = useState<boolean | null>(null);
  const showDist =
    distToggle ?? hasVal(inStdev, inMin, inMax, outStdev, outMin, outMax);
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

  return (
    <SectionCard
      title={intl.formatMessage({ id: 'benchmark.form.group.distribution' })}
      tip={intl.formatMessage({ id: 'benchmark.form.distribution.intro' })}
      open={showDist}
      onOpenChange={handleDistToggle}
      disabled={disabled}
    >
      {/* Each length distribution: the three knobs on one row (a 3-col grid of
          card fields), the histogram full-width below — matches the design
          (fields never crowd the chart). */}
      <div className={styles.distHeading}>
        {intl.formatMessage({
          id: 'benchmark.form.group.distribution.input'
        })}
      </div>
      <div className={styles.distGrid}>
        <Form.Item name="dataset_input_stdev" style={{ marginBottom: 0 }}>
          <CInputNumber
            min={0}
            disabled={disabled}
            style={{ width: '100%' }}
            label={intl.formatMessage({ id: 'benchmark.form.dist.spread' })}
            description={intl.formatMessage({
              id: 'benchmark.form.dist.spread.tip'
            })}
          ></CInputNumber>
        </Form.Item>
        <Form.Item name="dataset_input_min" style={{ marginBottom: 0 }}>
          <CInputNumber
            min={0}
            disabled={disabled}
            style={{ width: '100%' }}
            label={intl.formatMessage({ id: 'benchmark.form.dist.min' })}
          ></CInputNumber>
        </Form.Item>
        <Form.Item name="dataset_input_max" style={{ marginBottom: 0 }}>
          <CInputNumber
            min={0}
            disabled={disabled}
            style={{ width: '100%' }}
            label={intl.formatMessage({ id: 'benchmark.form.dist.max' })}
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
      <div className={styles.distHeading}>
        {intl.formatMessage({
          id: 'benchmark.form.group.distribution.output'
        })}
      </div>
      <div className={styles.distGrid}>
        <Form.Item name="dataset_output_stdev" style={{ marginBottom: 0 }}>
          <CInputNumber
            min={0}
            disabled={disabled}
            style={{ width: '100%' }}
            label={intl.formatMessage({ id: 'benchmark.form.dist.spread' })}
            description={intl.formatMessage({
              id: 'benchmark.form.dist.spread.tip'
            })}
          ></CInputNumber>
        </Form.Item>
        <Form.Item name="dataset_output_min" style={{ marginBottom: 0 }}>
          <CInputNumber
            min={0}
            disabled={disabled}
            style={{ width: '100%' }}
            label={intl.formatMessage({ id: 'benchmark.form.dist.min' })}
          ></CInputNumber>
        </Form.Item>
        <Form.Item name="dataset_output_max" style={{ marginBottom: 0 }}>
          <CInputNumber
            min={0}
            disabled={disabled}
            style={{ width: '100%' }}
            label={intl.formatMessage({ id: 'benchmark.form.dist.max' })}
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
    </SectionCard>
  );
};

export default DistributionCard;
