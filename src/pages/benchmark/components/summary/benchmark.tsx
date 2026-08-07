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
}

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
        children: row.children ?? (row.value as React.ReactNode)
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

  const slaRows: Row[] = [
    {
      key: 'slaTtft',
      labelId: 'benchmark.form.sla.ttft',
      value: detailData?.sla_avg_ttft_ms
    },
    {
      key: 'slaP95Ttft',
      labelId: 'benchmark.form.sla.p95Ttft',
      value: detailData?.sla_p95_ttft_ms
    },
    {
      key: 'slaP99Ttft',
      labelId: 'benchmark.form.sla.p99Ttft',
      value: detailData?.sla_p99_ttft_ms
    },
    {
      key: 'slaTpot',
      labelId: 'benchmark.form.sla.tpot',
      value: detailData?.sla_avg_tpot_ms
    },
    {
      key: 'slaP95Tpot',
      labelId: 'benchmark.form.sla.p95Tpot',
      value: detailData?.sla_p95_tpot_ms
    },
    {
      key: 'slaP99Tpot',
      labelId: 'benchmark.form.sla.p99Tpot',
      value: detailData?.sla_p99_tpot_ms
    },
    {
      key: 'slaAvgLat',
      labelId: 'benchmark.form.sla.avgLatency',
      value: detailData?.sla_avg_latency_ms
    },
    {
      key: 'slaP95Lat',
      labelId: 'benchmark.form.sla.p95Latency',
      value: detailData?.sla_p95_latency_ms
    },
    {
      key: 'slaP99Lat',
      labelId: 'benchmark.form.sla.p99Latency',
      value: detailData?.sla_p99_latency_ms
    }
  ];

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
          {
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
      value: detailData?.max_error_rate
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
      value: detailData?.warmup
    },
    {
      key: 'cooldown',
      labelId: 'benchmark.form.cooldown',
      value: detailData?.cooldown
    }
  ];

  const groups = [
    { labelId: 'benchmark.form.group.dataset', rows: datasetRows },
    { labelId: 'benchmark.form.group.sla', rows: slaRows },
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
