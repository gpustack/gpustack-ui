import { useIntl } from '@umijs/max';
import { Descriptions } from 'antd';
import { createStyles } from 'antd-style';
import { DescriptionsItemType } from 'antd/es/descriptions';
import { round } from 'lodash';
import React from 'react';
import {
  DatasetValueMap,
  loadAxisLabelId,
  loadTypeOptions,
  loadValueDecimals
} from '../../config';
import { useDetailContext } from '../../config/detail-context';

const useStyles = createStyles(({ css }) => ({
  wrapper: css`
    display: flex;
    flex-direction: column;
    gap: 20px;
    .group + .group {
      border-top: 1px solid var(--ant-color-border-secondary);
      padding-top: 18px;
    }
    .group-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--ant-color-text-tertiary);
      margin-bottom: 14px;
    }
  `,
  // A plain 3-column grid rather than a Table component: this is N rows of three
  // numbers sitting inside a Descriptions cell, so a table would bring header /
  // scroll / sort machinery none of it uses. Grid (not flex) because the columns
  // have to line up across rows.
  stageTable: css`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, max-content));
    column-gap: 32px;
    row-gap: 4px;
    .head {
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
      padding-bottom: 2px;
    }
    /* Equal-width digits, so the caps read as a column of numbers instead of a
       ragged edge — 300 above 5120 above 320. */
    .num {
      font-variant-numeric: tabular-nums;
    }
  `
}));

/**
 * One row of a group, declared rather than pushed.
 *
 * `value` doubles as the row's gate: a row that declares one is dropped when it
 * is empty, so a group shrinks to what the run actually configured. `children`
 * only overrides how that value renders — keeping the gate on the raw field is
 * what stops a formatted row (a joined stage list, a rendered pair) from
 * surviving the field it was built from being absent. Rows with no `value` are
 * unconditional; their `children` is already the finished text.
 */
interface Row {
  key: string;
  labelId: string;
  value?: unknown;
  children?: React.ReactNode;
  // Columns this row spans in the group's 3-column Descriptions. Only the
  // per-stage table needs it: it is a block, not a value.
  span?: number;
}

/**
 * Warmup / cooldown are stored in guidellm's scalar convention: below 1 is a
 * FRACTION of the stage's requests, 1 and above is an absolute count. The form
 * only offers the percent range, so render a fraction as the percent that was
 * typed -- showing a bare "0.1" against a field labelled "%" reads as 0.1%.
 *
 * Max error rate shares this: it is a fraction too, and the form now asks for
 * it in percent alongside the other two. Its stored value is always inside the
 * open interval (0, 1), so it never reaches the count branch.
 */
const asPercentOrCount = (v?: number | null) =>
  v === undefined || v === null
    ? v
    : v < 1
      ? `${Math.round(v * 1000) / 10}%`
      : v;

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

const Benchmark: React.FC = () => {
  const { styles } = useStyles();
  const intl = useIntl();
  const { detailData, profilesOptions } = useDetailContext();
  const t = (id?: string) => (id ? intl.formatMessage({ id }) : '');

  const toItems = (rows: Row[]): DescriptionsItemType[] =>
    rows
      .filter((row) => !('value' in row) || !isEmpty(row.value))
      .map((row) => ({
        key: row.key,
        label: t(row.labelId),
        children: row.children ?? (row.value as React.ReactNode),
        ...(row.span ? { span: row.span } : {})
      }));

  const isShareGPT = detailData?.dataset_name === DatasetValueMap.ShareGPT;
  const loadDecimals = loadValueDecimals(detailData);
  // Stages = the measured load points, mirroring the config form's "Stages" card:
  // the mode first, then either the auto-tune search range + budget or the manual
  // list. Legacy rows (no auto_tune, no stages — a single fixed rate) predate the
  // stage model, so they skip the mode row and keep the plain Request Rate below.
  const isAutoTune = !!detailData?.auto_tune;
  const hasStages = (detailData?.stages?.length ?? 0) > 0;
  const loadTypeLabel = loadTypeOptions.find(
    (option) => option.value === detailData?.load_type
  )?.label;

  const datasetRows: Row[] = [
    {
      key: 'dataset',
      labelId: 'benchmark.table.dataset',
      children: detailData?.dataset_name || '-'
    },
    ...(isShareGPT
      ? []
      : [
          {
            key: 'tokenLen',
            labelId: 'benchmark.detail.inputOutputTokenLength',
            children: (
              <span>
                {detailData?.dataset_input_tokens || '-'} /{' '}
                {detailData?.dataset_output_tokens || '-'}
              </span>
            )
          }
        ]),
    {
      key: 'inStdev',
      labelId: 'benchmark.form.inputStdev',
      value: detailData?.dataset_input_stdev
    },
    {
      key: 'inMin',
      labelId: 'benchmark.form.inputMin',
      value: detailData?.dataset_input_min
    },
    {
      key: 'inMax',
      labelId: 'benchmark.form.inputMax',
      value: detailData?.dataset_input_max
    },
    {
      key: 'outStdev',
      labelId: 'benchmark.form.outputStdev',
      value: detailData?.dataset_output_stdev
    },
    {
      key: 'outMin',
      labelId: 'benchmark.form.outputMin',
      value: detailData?.dataset_output_min
    },
    {
      key: 'outMax',
      labelId: 'benchmark.form.outputMax',
      value: detailData?.dataset_output_max
    },
    {
      key: 'prefix',
      labelId: 'benchmark.form.sharedPrefix',
      value: detailData?.prefix_buckets,
      children: (detailData?.prefix_buckets || [])
        .map(
          (bucket) =>
            `${bucket.prefix_tokens} tok${
              bucket.prefix_count ? ` ×${bucket.prefix_count}` : ''
            }`
        )
        .join(', ')
    },
    ...(isShareGPT
      ? []
      : [
          {
            key: 'seed',
            labelId: 'playground.image.params.seed',
            value: detailData?.dataset_seed
          }
        ])
  ];

  const sloRows: Row[] = [
    {
      key: 'sloTtft',
      labelId: 'benchmark.form.slo.ttft',
      value: detailData?.slo_avg_ttft_ms
    },
    {
      key: 'sloP95Ttft',
      labelId: 'benchmark.form.slo.p95Ttft',
      value: detailData?.slo_p95_ttft_ms
    },
    {
      key: 'sloP99Ttft',
      labelId: 'benchmark.form.slo.p99Ttft',
      value: detailData?.slo_p99_ttft_ms
    },
    {
      key: 'sloTpot',
      labelId: 'benchmark.form.slo.tpot',
      value: detailData?.slo_avg_tpot_ms
    },
    {
      key: 'sloP95Tpot',
      labelId: 'benchmark.form.slo.p95Tpot',
      value: detailData?.slo_p95_tpot_ms
    },
    {
      key: 'sloP99Tpot',
      labelId: 'benchmark.form.slo.p99Tpot',
      value: detailData?.slo_p99_tpot_ms
    },
    {
      key: 'sloAvgLat',
      labelId: 'benchmark.form.slo.avgLatency',
      value: detailData?.slo_avg_latency_ms
    },
    {
      key: 'sloP95Lat',
      labelId: 'benchmark.form.slo.p95Latency',
      value: detailData?.slo_p95_latency_ms
    },
    {
      key: 'sloP99Lat',
      labelId: 'benchmark.form.slo.p99Latency',
      value: detailData?.slo_p99_latency_ms
    }
  ];

  // Manual stages carry their own caps, and the caps differ stage by stage: a
  // real run has 300 requests at C=1 but 5120 at C=512, and 1800s on the first
  // three stages against 900s on the rest. The bare rate list ("1, 4, 16, …")
  // showed none of it, so how much each stage actually runs was invisible on the
  // page whose job is to state the configuration. One summary line can't carry
  // it either — hence a row per stage.
  //
  // Only when some stage declares a cap. A stage list that is pure rates has
  // nothing to tabulate, and a one-column table reads worse than the inline list
  // it would replace.
  const stagesHaveCaps = (detailData?.stages || []).some(
    (stage) => stage.max_requests != null || stage.max_seconds != null
  );

  // Both caps hold simultaneously — guidellm stops the stage at whichever comes
  // first — so a stage missing one of them is genuinely uncapped on that axis,
  // not zero. "—" says that; a blank cell would read as a rendering gap.
  const stageTable = (
    <div className={styles.stageTable}>
      <span className="head">{t(loadAxisLabelId(detailData))}</span>
      <span className="head">{t('benchmark.form.maxRequests')}</span>
      <span className="head">{t('benchmark.form.maxSeconds')}</span>
      {(detailData?.stages || []).map((stage, index) => (
        <React.Fragment key={`${stage.rate}-${index}`}>
          <span className="num">{round(stage.rate ?? 0, loadDecimals)}</span>
          <span className="num">{stage.max_requests ?? '—'}</span>
          <span className="num">
            {stage.max_seconds != null ? `${stage.max_seconds} s` : '—'}
          </span>
        </React.Fragment>
      ))}
    </div>
  );

  const loadRows: Row[] = [
    {
      key: 'profile',
      labelId: 'benchmark.form.profile',
      children:
        profilesOptions.find((option) => option.value === detailData?.profile)
          ?.label ||
        detailData?.profile ||
        '-'
    },
    {
      key: 'load_type',
      labelId: 'benchmark.form.loadType',
      value: detailData?.load_type,
      children: loadTypeLabel ? t(loadTypeLabel) : detailData?.load_type
    },
    ...(isAutoTune || hasStages
      ? [
          {
            key: 'stages',
            labelId: 'benchmark.form.stages',
            children: t(
              isAutoTune
                ? 'benchmark.form.autoTune'
                : 'benchmark.form.stages.mode.manual'
            )
          }
        ]
      : []),
    ...(isAutoTune
      ? [
          {
            key: 'range',
            labelId:
              detailData?.load_type === 'concurrency'
                ? 'benchmark.form.autoTune.rangeConcurrency'
                : 'benchmark.form.autoTune.rangeRate',
            value: detailData?.upper_bound,
            children: `${detailData?.lower_bound ?? 1} ~ ${detailData?.upper_bound}`
          },
          {
            key: 'maxPoints',
            labelId: 'benchmark.form.autoTune.maxPoints',
            value: detailData?.max_points
          },
          {
            key: 'maxTotal',
            labelId: 'benchmark.form.autoTune.maxTotalSeconds',
            value: detailData?.max_total_seconds
          }
        ]
      : [
          stagesHaveCaps
            ? {
                key: 'stagePlan',
                labelId: 'benchmark.detail.stageLimits',
                span: 3,
                value: detailData?.stages,
                children: stageTable
              }
            : {
                key: 'stageList',
                labelId: loadAxisLabelId(detailData),
                value: hasStages ? detailData?.stages : null,
                children: (detailData?.stages || [])
                  .map((stage) => round(stage.rate ?? 0, loadDecimals))
                  .join(', ')
              },
          {
            key: 'rate',
            labelId: 'benchmark.table.requestRate',
            value: hasStages ? null : detailData?.request_rate
          }
        ])
  ];

  // The auto-tune budget (max points / max total duration) sits with Stages above,
  // the same place the config form puts it; this group keeps the caps that apply in
  // any mode.
  const executionRows: Row[] = [
    {
      key: 'total',
      labelId: 'benchmark.form.totalRequests',
      value: detailData?.total_requests
    },
    {
      key: 'maxSeconds',
      labelId: 'benchmark.form.maxSeconds',
      value: detailData?.max_seconds,
      children: `${detailData?.max_seconds} s`
    },
    {
      key: 'maxErrors',
      labelId: 'benchmark.form.maxErrors',
      value: detailData?.max_errors
    },
    {
      key: 'maxErrorRate',
      labelId: 'benchmark.form.maxErrorRate',
      value: asPercentOrCount(detailData?.max_error_rate)
    },
    ...(detailData?.stop_on_saturation
      ? [
          {
            key: 'stopSat',
            labelId: 'benchmark.form.stopOnSaturation',
            children: '✓'
          }
        ]
      : [])
  ];

  const advancedRows: Row[] = [
    { key: 'turns', labelId: 'benchmark.form.turns', value: detailData?.turns },
    {
      key: 'warmup',
      labelId: 'benchmark.form.warmup',
      value: asPercentOrCount(detailData?.warmup)
    },
    {
      key: 'cooldown',
      labelId: 'benchmark.form.cooldown',
      value: asPercentOrCount(detailData?.cooldown)
    }
  ];

  const groups = [
    { labelId: 'benchmark.form.group.dataset', rows: datasetRows },
    { labelId: 'benchmark.form.group.slo', rows: sloRows },
    { labelId: 'benchmark.form.group.load', rows: loadRows },
    { labelId: 'benchmark.form.group.execution', rows: executionRows },
    { labelId: 'benchmark.form.group.advanced', rows: advancedRows }
  ]
    .map((group) => ({ labelId: group.labelId, items: toItems(group.rows) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className={styles.wrapper}>
      {groups.map((group) => (
        <div className="group" key={group.labelId}>
          <div className="group-label">{t(group.labelId)}</div>
          <Descriptions
            items={group.items}
            colon={false}
            column={3}
            styles={{ content: { justifyContent: 'flex-start' } }}
          />
        </div>
      ))}
    </div>
  );
};

export default Benchmark;
