import { getDocumentationUrl } from '@/utils/documentation';
import { ReloadOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  BaseSelect,
  CopyButton,
  NoResult,
  Table as SealTable
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import {
  Alert,
  Button,
  Empty,
  Flex,
  Form,
  Input,
  Skeleton,
  Typography
} from 'antd';
import { useRef, useState } from 'react';
import { useDetail } from '../config/context';
import {
  formatTraceDate,
  formatTraceId,
  formatTraceTokens,
  traceDurationLabel,
  traceRecordKey,
  type TraceMessage
} from './presentation';
import RequestDurationCell from './request-duration-cell';
import { tracePageSize, type TraceFilters, type TraceRecord } from './requests';
import TraceDetails, { RequestTraceStatus } from './trace-details';
import styles from './trace-filters.module.less';
import TraceTimeRangeControl from './trace-time-range';
import { defaultFilters, useTraceData } from './use-trace-data';

const outcomes = ['success', 'error', 'cancelled', 'unknown'] as const;

export default function RequestTracesTab({
  modelId,
  tenant
}: {
  modelId: number;
  tenant: string;
}) {
  const intl = useIntl();
  const { instances } = useDetail();
  const t: TraceMessage = (key, values) =>
    intl.formatMessage({ id: `requestTracing.${key}` }, values);
  const [filtersForm] = Form.useForm<TraceFilters>();
  const activeFilters = useRef(defaultFilters);
  const pageCursors = useRef<string[]>([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<TraceRecord | null>(null);
  const trace = useTraceData(modelId, tenant);
  const capabilities = trace.capabilities.data;
  const tracingEnabled = !!capabilities?.tracing_enabled;
  const listAvailable =
    tracingEnabled && !!capabilities?.trace_query_configured;
  const instanceOptions = (instances.data ?? []).map((instance) => ({
    label: instance.name,
    value: instance.id
  }));
  const instanceName = (id: number | null) =>
    id == null
      ? '—'
      : (instanceOptions.find((instance) => instance.value === id)?.label ??
        `#${id}`);
  const rows = trace.rows.data?.items ?? [];
  const nextCursor = trace.rows.data?.next_cursor;

  const closeDetails = () => {
    setSelected(null);
    trace.closeDetail();
  };
  const apply = (values: TraceFilters) => {
    activeFilters.current = { ...values, q: values.q || undefined };
    pageCursors.current = [];
    setPage(1);
    closeDetails();
    void trace.loadRows(activeFilters.current);
  };
  const refresh = () => {
    closeDetails();
    pageCursors.current = [];
    setPage(1);
    void trace.refresh(activeFilters.current);
  };
  const changePage = (nextPage: number) => {
    if (trace.rows.loading || nextPage === page) return;
    const cursor =
      nextPage === page + 1 ? nextCursor : pageCursors.current[nextPage - 1];
    if (!cursor) return;
    if (trace.rows.data) pageCursors.current[page - 1] = trace.rows.data.cursor;
    closeDetails();
    setPage(nextPage);
    void trace.loadRows(activeFilters.current, cursor);
  };
  const openDetails = (row: TraceRecord) => {
    setSelected(row);
    void trace.loadDetail(row);
  };

  if (!capabilities && !trace.capabilities.error) return <Skeleton active />;

  const columns = [
    {
      dataIndex: 'request_id',
      title: t('request'),
      minWidth: 238,
      maxWidth: 420,
      render: (_: unknown, row: TraceRecord) => {
        const identifier = row.request_id ?? formatTraceId(row.trace_id);
        const instance = row.instance_name ?? instanceName(row.instance_id);
        return (
          <Flex vertical gap={2} style={{ minWidth: 0 }}>
            <Flex align="center" gap={4}>
              <Button
                type="link"
                size="small"
                onClick={() => openDetails(row)}
                style={{ paddingInline: 0, minWidth: 0 }}
              >
                <AutoTooltip ghost>{identifier}</AutoTooltip>
              </Button>
              <CopyButton
                text={identifier}
                type="link"
                btnStyle={{ flexShrink: 0 }}
              />
            </Flex>
            <Flex
              align="center"
              gap={4}
              style={{ color: 'var(--ant-color-text-description)' }}
            >
              <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                {formatTraceDate(row.started_at_ms, intl.locale)}
                {instance !== '—' && ' ·'}
              </span>
              {instance !== '—' && (
                <AutoTooltip ghost style={{ minWidth: 0 }}>
                  {instance}
                </AutoTooltip>
              )}
            </Flex>
          </Flex>
        );
      }
    },
    {
      dataIndex: 'path',
      title: t('endpoint'),
      minWidth: 146,
      span: 1.2,
      render: (_: unknown, row: TraceRecord) => (
        <AutoTooltip ghost>{row.path ?? '—'}</AutoTooltip>
      )
    },
    {
      dataIndex: 'outcome',
      title: t('state'),
      minWidth: 126,
      span: 0.8,
      render: (_: unknown, row: TraceRecord) => (
        <RequestTraceStatus row={row} t={t} statusCodeInTooltip />
      )
    },
    {
      dataIndex: 'duration_ms',
      title: t('elapsed'),
      minWidth: 176,
      render: (_: unknown, row: TraceRecord) => (
        <RequestDurationCell
          label={traceDurationLabel(row, t)}
          durationMs={row.duration_ms}
          firstResponseMs={row.request_metrics?.ttft_ms}
          t={t}
        />
      )
    },
    {
      dataIndex: 'tokens',
      title: t('tokens'),
      minWidth: 128,
      maxWidth: 166,
      render: (_: unknown, row: TraceRecord) =>
        formatTraceTokens(row.request_metrics)
    }
  ];

  const error = trace.capabilities.error ?? trace.rows.error;
  const loading = trace.capabilities.loading || trace.rows.loading;
  const documentationLink = (
    <Button
      type="link"
      href={getDocumentationUrl(
        'user-guide/observability/#inference-logs-and-traces',
        intl.locale
      )}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t('configuration')}
    </Button>
  );
  return (
    <Flex vertical gap={16}>
      {error != null && (
        <Alert
          type="error"
          showIcon
          title={t('queryFailed')}
          action={
            <Button size="small" onClick={refresh}>
              {t('retry')}
            </Button>
          }
        />
      )}
      {capabilities && !tracingEnabled && (
        <NoResult
          loadend
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          title={t('tracingDisabled')}
          subTitle={
            <>
              {t('tracingDisabledDetail')}
              <br />
              {documentationLink}
            </>
          }
        />
      )}
      {tracingEnabled && !listAvailable && (
        <Alert
          showIcon
          type="warning"
          title={t('traceQueryMissing')}
          action={documentationLink}
        />
      )}

      {listAvailable && (
        <>
          <Form
            form={filtersForm}
            initialValues={defaultFilters}
            layout="horizontal"
            colon={false}
            labelAlign="left"
            className={styles.filterForm}
            onFinish={apply}
          >
            <Flex gap={12} align="start" wrap="wrap">
              <Form.Item
                className={styles.identifier}
                name="q"
                label={t('identifier')}
              >
                <Input allowClear placeholder={t('identifierPlaceholder')} />
              </Form.Item>
              <Form.Item className={styles.range} name="range">
                <TraceTimeRangeControl />
              </Form.Item>
              <Form.Item
                className={styles.outcome}
                name="outcome"
                label={t('state')}
              >
                <BaseSelect
                  allowClear
                  placeholder={t('allStates')}
                  options={outcomes.map((value) => ({
                    value,
                    label: t(value)
                  }))}
                />
              </Form.Item>
              <Form.Item
                className={styles.instance}
                name="instance_id"
                label={t('instance')}
              >
                <BaseSelect
                  allowClear
                  placeholder={t('allInstances')}
                  options={instanceOptions}
                />
              </Form.Item>
              <Flex gap={8} align="center">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={trace.rows.loading}
                >
                  {t('search')}
                </Button>
                <Button
                  type="link"
                  onClick={() => {
                    filtersForm.resetFields();
                    apply(defaultFilters);
                  }}
                >
                  {t('reset')}
                </Button>
              </Flex>
            </Flex>
          </Form>
          <Flex align="center" gap={12} wrap="wrap" justify="space-between">
            <Typography.Text strong>{t('recentRecords')}</Typography.Text>
            <Flex align="center" gap={8}>
              <Button
                icon={<ReloadOutlined />}
                loading={loading}
                onClick={refresh}
                aria-label={t('refresh')}
              />
            </Flex>
          </Flex>
          {loading || rows.length || page > 1 ? (
            <SealTable
              rowKey="key"
              columns={columns}
              loading={loading}
              dataSource={rows.map((row) => ({
                ...row,
                key: traceRecordKey(row)
              }))}
              empty={<Empty description={t('noRecords')} />}
              pagination={
                page > 1 || nextCursor
                  ? {
                      current: page,
                      pageSize: tracePageSize,
                      // The next cursor makes one additional page reachable.
                      total: page * tracePageSize + (nextCursor ? 1 : 0),
                      disabled: loading,
                      showLessItems: true,
                      showSizeChanger: false,
                      onChange: changePage
                    }
                  : undefined
              }
              scroll={{ x: true }}
            />
          ) : error == null ? (
            <Empty description={t('noRecords')} />
          ) : null}
          <TraceDetails
            row={selected}
            state={trace.detail}
            instanceName={instanceName}
            locale={intl.locale}
            t={t}
            onClose={closeDetails}
            onRetry={() => {
              if (selected) void trace.loadDetail(selected);
            }}
          />
        </>
      )}
    </Flex>
  );
}
