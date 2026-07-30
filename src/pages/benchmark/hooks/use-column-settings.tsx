import { tableSorter } from '@/config/settings';
import { AutoTooltip, ColumnSettings, InfoColumn } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import _, { round } from 'lodash';
import React from 'react';
import BenchmarkStateTag from '../components/benchmark-state-tag';
import {
  LoadTypeValueMap,
  VALIDITY_MESSAGE_KEY,
  loadTypeOptions,
  loadValueDecimals
} from '../config';
import { BenchmarkListItem as ListItem } from '../config/types';
// sort by this order
const allFields = [
  'cluster_id',
  'model_name',
  'load_type',
  'profile',
  'dataset_name',
  'gpu_summary',
  'state',
  'recommended_rate',
  'validity',
  'request_rate',
  'request_latency_mean',
  'tokens_per_second_mean',
  'time_to_first_token_mean',
  'inter_token_latency_mean',
  'requests_per_second_mean',
  'input_tokens_per_second_mean',
  'output_tokens_per_second_mean',
  'total_requests',
  'request_successful',
  'request_errored',
  'request_incomplete',
  'request_concurrency_mean',
  'request_concurrency_max',
  'created_at'
];

const fieldSortPos: Record<string, number> = Object.fromEntries(
  allFields.map((field, index) => [field, index + 1])
);

const defaultColumns: string[] = [
  'model_name',
  'profile',
  'load_type',
  'gpu_summary',
  'state',
  'tokens_per_second_mean',
  'time_to_first_token_mean',
  'inter_token_latency_mean',
  'recommended_rate',
  'validity'
];
const fixedColumns: string[] = [];

const useColumnSettings = (options: {
  contentHeight: number;
  profileOptions: Global.BaseOption<string>[];
  clusterList: Global.BaseOption<number>[];
}) => {
  const intl = useIntl();
  const { contentHeight, clusterList, profileOptions } = options;

  const [selectedColumns, setSelectedColumns] =
    React.useState<string[]>(defaultColumns);

  const renderTitle = (
    title: React.ReactNode,
    options?: { subTitle?: React.ReactNode }
  ): React.ReactNode => {
    return (
      <span>
        <AutoTooltip
          ghost
          minWidth={20}
          title={`${title} ${options?.subTitle || ''}`}
        >
          {title}
        </AutoTooltip>
        {options?.subTitle && (
          <span className="sub-title">
            <AutoTooltip
              ghost
              minWidth={20}
              title={`${title} ${options?.subTitle || ''}`}
            >
              {options.subTitle}
            </AutoTooltip>
          </span>
        )}
      </span>
    );
  };

  const fieldList = [
    {
      label: 'benchmark.detail.throughput.inputToken',
      key: 'input_tokens_per_second_mean',
      locale: true,
      render: (val: any) => round(val, 2)
    },
    {
      label: 'benchmark.detail.throughput.outputToken',
      key: 'output_tokens_per_second_mean',
      locale: true,
      render: (val: any) => round(val, 2)
    }
  ];

  const resultColumns = [
    {
      title: renderTitle(
        `${intl.formatMessage({ id: 'benchmark.detail.summary.latency' })}`,
        {
          subTitle: `${intl.formatMessage({ id: 'benchmark.table.avg' })} (s)`
        }
      ),
      dataIndex: 'request_latency_mean',
      path: 'request_latency_mean',
      unit: 'ms',
      sorter: tableSorter(1),
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 2)}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle('TTFT', {
        subTitle: `${intl.formatMessage({ id: 'benchmark.table.avg' })} (ms)`
      }),
      sorter: tableSorter(1),
      dataIndex: 'time_to_first_token_mean',
      path: 'time_to_first_token_mean',
      unit: 'ms',
      render: (text: number) => (
        <AutoTooltip ghost minWidth={20}>
          {_.round(text, 2) || '-'}
        </AutoTooltip>
      )
    },
    {
      // TPOT reads `inter_token_latency_mean`, which is guidellm's name for the
      // decode-only per-token time that the rest of the field calls TPOT. There
      // used to be a second column ("ITL") for exactly this field next to a
      // "TPOT" column fed by `time_per_output_token_mean` — that one includes
      // TTFT, so the pair was one metric shown twice under swapped names.
      title: renderTitle('TPOT', {
        subTitle: `${intl.formatMessage({ id: 'benchmark.table.avg' })} (ms)`
      }),
      sorter: tableSorter(1),
      dataIndex: 'inter_token_latency_mean',
      path: 'inter_token_latency_mean',
      unit: 'ms',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 2) || '-'}
        </AutoTooltip>
      )
    },
    {
      title: 'RPS',
      dataIndex: 'requests_per_second_mean',
      sorter: tableSorter(1),
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {_.round(text, 2) || '-'}
        </AutoTooltip>
      )
    },
    {
      // Total token throughput. Abbreviated to "TPS" (tokens/s) to match the
      // sibling acronym columns (TTFT / TPOT / ITL / RPS) and fit the header.
      title: renderTitle('TPS', {
        subTitle: '(Tokens/s)'
      }),
      dataIndex: 'tokens_per_second_mean',
      path: 'tokens_per_second_mean',
      unit: 'Tokens/s',
      sorter: tableSorter(1),
      render: (text: number, record: any) => (
        <AutoTooltip
          ghost
          minWidth={20}
          maxWidth={'max-content'}
          showTitle={text > 0}
          title={<InfoColumn fieldList={fieldList} data={record}></InfoColumn>}
        >
          {_.round(text, 2) || '-'}
        </AutoTooltip>
      )
    },
    {
      // Input token throughput, abbreviated to "In TPS" to match TPS / RPS.
      title: renderTitle('In TPS', {
        subTitle: '(Tokens/s)'
      }),
      dataIndex: 'input_tokens_per_second_mean',
      path: 'input_tokens_per_second_mean',
      unit: 'Tokens/s',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 2) || 0}
        </AutoTooltip>
      )
    },
    {
      // Output token throughput, abbreviated to "Out TPS" to match TPS / RPS.
      title: renderTitle('Out TPS', {
        subTitle: '(Tokens/s)'
      }),
      dataIndex: 'output_tokens_per_second_mean',
      path: 'output_tokens_per_second_mean',
      unit: 'Tokens/s',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 2) || 0}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.detail.requests.total' })
      ),
      dataIndex: 'total_requests',
      path: 'total_requests',
      precision: 0,
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 0) || 0}
        </AutoTooltip>
      ),
      unit: ''
    },
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.detail.requests.success' })
      ),
      dataIndex: 'request_successful',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 0) || 0}
        </AutoTooltip>
      ),
      precision: 0,
      color: 'var(--ant-color-success)',
      unit: ''
    },
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.detail.requests.failed' })
      ),
      dataIndex: 'request_errored',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 0) || 0}
        </AutoTooltip>
      ),
      precision: 0,
      color: 'var(--ant-color-error)',
      unit: ''
    },
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.detail.requests.incomplete' })
      ),
      dataIndex: 'request_incomplete',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 0) || 0}
        </AutoTooltip>
      ),
      precision: 0,
      color: 'var(--ant-color-error)',
      unit: ''
    },
    {
      title: renderTitle(
        intl.formatMessage({
          id: 'benchmark.detail.requests.concurrency'
        })
      ),
      dataIndex: 'request_concurrency_mean',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 0) || 0}
        </AutoTooltip>
      ),
      precision: 0,
      unit: ''
    },
    {
      title: renderTitle(
        intl.formatMessage({
          id: 'benchmark.detail.requests.concurrency.max'
        })
      ),
      dataIndex: 'request_concurrency_max',
      render: (value: number) => (
        <AutoTooltip ghost minWidth={20}>
          {round(value, 0) || 0}
        </AutoTooltip>
      ),
      precision: 0,
      unit: ''
    }
  ];

  const metadataColumns = [
    {
      title: (
        <Typography.Text
          ellipsis={{ tooltip: true }}
          style={{ color: 'var(--color-text-table-header)' }}
        >
          {intl.formatMessage({ id: 'clusters.title' })}
        </Typography.Text>
      ),
      dataIndex: 'cluster_id',
      render: (text: number) => (
        <AutoTooltip ghost minWidth={20}>
          {clusterList?.find((item) => item.value === text)?.label || text}
        </AutoTooltip>
      )
    },
    {
      title: (
        <Typography.Text
          ellipsis={{ tooltip: true }}
          style={{ color: 'var(--color-text-table-header)' }}
        >
          {intl.formatMessage({ id: 'benchmark.detail.modelName' })}
        </Typography.Text>
      ),
      dataIndex: 'model_name',
      sorter: tableSorter(1),
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: (
        <Typography.Text
          ellipsis={{ tooltip: true }}
          style={{ color: 'var(--color-text-table-header)' }}
        >
          {intl.formatMessage({ id: 'benchmark.form.loadType' })}
        </Typography.Text>
      ),
      dataIndex: 'load_type',
      // Load Type (traffic shape) is the single load axis (there is no Mode).
      render: (_text: string, record: ListItem) => {
        const value = record.load_type;
        const option = loadTypeOptions.find((item) => item.value === value);
        return (
          <AutoTooltip ghost minWidth={20}>
            {option ? intl.formatMessage({ id: option.label }) : value || '-'}
          </AutoTooltip>
        );
      }
    },
    {
      title: (
        <Typography.Text
          ellipsis={{ tooltip: true }}
          style={{ color: 'var(--color-text-table-header)' }}
        >
          {intl.formatMessage({ id: 'benchmark.form.profile' })}
        </Typography.Text>
      ),
      dataIndex: 'profile',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {profileOptions.find((option) => option.value === text)?.label ||
            text}
        </AutoTooltip>
      )
    },
    {
      // Best @ — the recommended operating point (peak / max-within-SLA). The
      // value lives on the load axis, so we spell out its unit (concurrency vs
      // request rate) instead of a bare number.
      title: renderTitle(intl.formatMessage({ id: 'benchmark.table.best' })),
      dataIndex: 'recommended_rate',
      render: (_text: number, record: ListItem) => {
        const rate = record.recommended_rate ?? record.peak_rate;
        if (rate == null) {
          return (
            <AutoTooltip ghost minWidth={20}>
              -
            </AutoTooltip>
          );
        }
        const unit = intl.formatMessage({
          id:
            record.load_type === LoadTypeValueMap.Concurrency
              ? 'benchmark.table.best.unit.concurrency'
              : 'benchmark.table.best.unit.rate'
        });
        return (
          <AutoTooltip ghost minWidth={20}>
            {`${round(rate, loadValueDecimals(record))} ${unit}`}
          </AutoTooltip>
        );
      }
    },
    {
      // Test coverage: green OK when the sweep explored enough; amber
      // "Insufficient" text with a tooltip listing the specific warnings
      // otherwise; "-" when not yet computed.
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.table.coverage' })
      ),
      dataIndex: 'validity',
      width: 140,
      render: (v: ListItem['validity']) => {
        // "-" both when nothing is computed yet and while the sweep is still
        // running: green "OK" and amber "Insufficient" are both VERDICTS, and
        // mid-climb neither is earned. (The worker also withholds the coverage
        // codes from partial syncs, so an empty list here does not mean clean.)
        if (!v || v.in_progress) {
          return (
            <span style={{ color: 'var(--ant-color-text-tertiary)' }}>-</span>
          );
        }
        const warnings = v.warnings || [];
        if (warnings.length === 0) {
          return (
            <Tag color="success" bordered={false}>
              {intl.formatMessage({ id: 'benchmark.detail.validity.ok' })}
            </Tag>
          );
        }
        const msgs = warnings.map((w) =>
          intl.formatMessage(
            { id: VALIDITY_MESSAGE_KEY[w.code] || w.code },
            (w.params || {}) as Record<string, string | number>
          )
        );
        return (
          <Tooltip
            title={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {msgs.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            }
          >
            <Tag color="warning" bordered={false}>
              {`⚠ ${intl.formatMessage({ id: 'benchmark.table.coverage.insufficient' })}`}
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: renderTitle(intl.formatMessage({ id: 'benchmark.table.dataset' })),
      dataIndex: 'dataset_name',
      render: (text: string, record: ListItem) => (
        <AutoTooltip ghost minWidth={20}>
          {record.dataset_name}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(intl.formatMessage({ id: 'benchmark.table.gpu' })),
      dataIndex: 'gpu_summary',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(intl.formatMessage({ id: 'common.table.status' })),
      width: 120,
      dataIndex: 'state',
      render: (value: number, record: ListItem) => (
        <BenchmarkStateTag data={record} />
      )
    },
    {
      title: renderTitle(
        intl.formatMessage({ id: 'benchmark.table.requestRate' })
      ),
      dataIndex: 'request_rate',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: renderTitle(intl.formatMessage({ id: 'common.table.createTime' })),
      dataIndex: 'created_at',
      sorter: tableSorter(6),
      render: (value: string) => (
        <AutoTooltip ghost minWidth={20}>
          {dayjs(value).format('YYYY-MM-DD HH:mm:ss')}
        </AutoTooltip>
      )
    }
  ];

  const handleOnChange = (columns: string[]) => {
    setSelectedColumns(columns);
    console.log('selected columns:', columns);
  };

  const handleOnReset = () => {
    setSelectedColumns(defaultColumns);
  };

  const columns = React.useMemo(() => {
    const allColumns = [...metadataColumns, ...resultColumns];
    const selected = allColumns.filter((col) =>
      selectedColumns.includes(col.dataIndex as string)
    );
    // Sort by pos
    selected.sort(
      (a, b) =>
        (fieldSortPos[a.dataIndex] || 0) - (fieldSortPos[b.dataIndex] || 0)
    );
    return selected;
  }, [selectedColumns, clusterList, intl, profileOptions]);

  const SettingsButton = (
    <ColumnSettings
      tableName="benchmark"
      contentHeight={contentHeight}
      defaultSelectedColumns={defaultColumns}
      selectedColumns={selectedColumns}
      onChange={handleOnChange}
      onReset={handleOnReset}
      fixedColumns={fixedColumns}
      grouped={true}
      columns={[
        {
          title: intl.formatMessage({ id: 'benchmark.detail.summary.results' }),
          children: resultColumns
        },
        {
          title: intl.formatMessage({
            id: 'benchmark.detail.summary.metadata'
          }),
          children: metadataColumns
        }
      ]}
    ></ColumnSettings>
  );

  return {
    SettingsButton,
    columns
  };
};

export default useColumnSettings;
