import { QuestionCircleOutlined } from '@ant-design/icons';
import { Table as SealTable } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import {
  StageStatistic,
  stageLatencyValue,
  stageRateValue,
  stageTokenValue
} from '../../utils/stage-detail-metrics';

type StatisticsKind = 'load' | 'latency' | 'tokens';

const STATISTICS: Array<{ key: StageStatistic; labelId: string }> = [
  { key: 'mean', labelId: 'benchmark.table.avg' },
  { key: 'min', labelId: 'benchmark.form.dist.min' },
  { key: 'max', labelId: 'benchmark.form.dist.max' },
  { key: 'p25', labelId: 'benchmark.detail.statistics.p25' },
  { key: 'p50', labelId: 'benchmark.detail.statistics.p50' },
  { key: 'p75', labelId: 'benchmark.detail.statistics.p75' },
  { key: 'p90', labelId: 'benchmark.detail.statistics.p90' },
  { key: 'p95', labelId: 'benchmark.form.slo.agg.p95' },
  { key: 'p99', labelId: 'benchmark.form.slo.agg.p99' }
];

const HEADER_STYLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--ant-color-text-secondary)',
  minHeight: 36,
  padding: 'var(--ant-padding-xxs, 4px) var(--ant-padding-xs, 8px)'
};

const useStyles = createStyles(({ css }) => ({
  table: css`
    min-width: 0;
    width: 100%;
    font-variant-numeric: tabular-nums;
    --seal-table-row-min-height: var(--ant-control-height, 32px);
    .header-row-wrapper {
      background: transparent;
      border-bottom: 1px solid var(--ant-color-border-secondary);
    }
    .cell {
      padding: var(--ant-padding-xxs, 4px) var(--ant-padding-xs, 8px);
      font-size: 13px;
      color: var(--ant-color-text);
    }
    .row-wrapper,
    .row-wrapper:hover {
      background: transparent;
      border-bottom: none;
    }
    .seal-table-row {
      cursor: default;
    }
    .statistic-name,
    .statistic-unit {
      color: var(--ant-color-text-secondary);
    }
    .statistic-unit {
      font-size: 11px;
    }
    .statistic-value {
      white-space: nowrap;
    }
    .statistic-help {
      padding: 0;
      height: auto;
      color: inherit;
      font: inherit;
    }
    .statistic-help:hover {
      color: var(--ant-color-text);
    }
  `
}));

const StageStatisticsTable: React.FC<{ kind: StatisticsKind; data?: any }> = ({
  kind,
  data
}) => {
  const intl = useIntl();
  const { styles, cx } = useStyles();
  const t = (id: string) => intl.formatMessage({ id });
  const statistics = kind === 'load' ? STATISTICS.slice(0, 3) : STATISTICS;
  const title = t(`benchmark.detail.statistics.${kind}`);
  const definitions =
    kind === 'load'
      ? [
          {
            key: 'requests',
            label: t('benchmark.detail.statistics.requestRate'),
            unit: 'req/s',
            fixedMean: true
          },
          {
            key: 'concurrency',
            label: t('benchmark.detail.statistics.concurrency'),
            unit: t('benchmark.detail.statistics.requestsUnit'),
            fixedMean: true
          },
          {
            key: 'total',
            label: t('benchmark.detail.throughput.totalToken'),
            unit: 'tok/s'
          },
          {
            key: 'input',
            label: t('benchmark.detail.percentile.input'),
            unit: 'tok/s'
          },
          {
            key: 'output',
            label: t('benchmark.detail.percentile.output'),
            unit: 'tok/s'
          }
        ]
      : kind === 'latency'
        ? [
            { key: 'ttft', label: 'TTFT', unit: 'ms' },
            { key: 'tpot', label: 'TPOT', unit: 'ms' },
            { key: 'itl', label: 'ITL', unit: 'ms' },
            {
              key: 'latency',
              label: t('benchmark.detail.latency.endToEnd'),
              unit: 's'
            }
          ]
        : [
            {
              key: 'input',
              label: t('benchmark.detail.percentile.inputTokens'),
              unit: t('benchmark.detail.statistics.tokensUnit')
            },
            {
              key: 'output',
              label: t('benchmark.detail.percentile.outputTokens'),
              unit: t('benchmark.detail.statistics.tokensUnit')
            }
          ];
  const rows = definitions.map((definition) => ({
    ...definition,
    fixedMean: 'fixedMean' in definition && definition.fixedMean,
    ...Object.fromEntries(
      statistics.map(({ key }) => [
        key,
        kind === 'load'
          ? stageRateValue(
              data,
              definition.key as Parameters<typeof stageRateValue>[1],
              key as 'mean' | 'min' | 'max'
            )
          : kind === 'latency'
            ? stageLatencyValue(
                data,
                definition.key as Parameters<typeof stageLatencyValue>[1],
                key
              )
            : stageTokenValue(data, definition.key as 'input' | 'output', key)
      ])
    )
  }));
  const columns = [
    {
      title: t('benchmark.detail.latency.metric'),
      dataIndex: 'label',
      minWidth: kind === 'tokens' ? 180 : kind === 'load' ? 144 : 128,
      headerStyle: HEADER_STYLE,
      render: (_value: unknown, row: (typeof rows)[number]) => (
        <span className="statistic-name">
          {row.label} <span className="statistic-unit">({row.unit})</span>
        </span>
      )
    },
    ...statistics.map(({ key, labelId }) => ({
      title:
        key === 'min' || key === 'max' ? (
          <Tooltip
            trigger={['hover', 'focus']}
            title={t(`benchmark.detail.statistics.${kind}.${key}.tip`)}
          >
            <Button
              type="text"
              size="small"
              className="statistic-help"
              aria-label={`${t(labelId)} ${title}`}
            >
              {t(labelId)}
              <QuestionCircleOutlined />
            </Button>
          </Tooltip>
        ) : (
          t(labelId)
        ),
      dataIndex: key,
      minWidth: kind === 'load' && key === 'max' ? 120 : 88,
      headerStyle: HEADER_STYLE,
      align: 'right' as const,
      render: (value: number | null, row: (typeof rows)[number]) => (
        <span className="statistic-value">
          {value == null
            ? '-'
            : value.toLocaleString(undefined, {
                minimumFractionDigits: key === 'mean' && row.fixedMean ? 2 : 0,
                maximumFractionDigits: 2
              })}
        </span>
      )
    }))
  ];

  return (
    <div
      className={cx(styles.table, `${kind}-table`)}
      role="region"
      aria-label={title}
    >
      <SealTable
        columns={columns}
        dataSource={rows}
        rowKey="key"
        loading={false}
        scroll={{ x: true }}
      />
    </div>
  );
};

export default StageStatisticsTable;
