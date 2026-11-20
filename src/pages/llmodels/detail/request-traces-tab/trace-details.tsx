import {
  CardWrapper,
  GSDrawer,
  OverlayScroller,
  SectionTitle,
  StatusDot
} from '@gpustack/core-ui';
import {
  Alert,
  Button,
  Col,
  Descriptions,
  Flex,
  Row,
  Skeleton,
  Tooltip,
  Typography
} from 'antd';
import type { ResourceSnapshot } from '../services/scoped-resource';
import {
  formatTraceDate,
  formatTraceId,
  formatTraceTokens,
  formatTraceValue,
  traceDurationLabel,
  traceRecordKey,
  type TraceMessage
} from './presentation';
import type { TraceDetail, TraceRecord } from './requests';
import SpanTimeline from './span-timeline';
import styles from './trace-details.module.less';

const statusTone = {
  success: 'success',
  error: 'error',
  cancelled: 'warning',
  unknown: 'inactive'
} as const;

export const RequestTraceStatus = ({
  row,
  t,
  statusCodeInTooltip = false
}: {
  row: TraceRecord;
  t: TraceMessage;
  statusCodeInTooltip?: boolean;
}) => {
  const code = row.status_code;
  const label = t(row.outcome);
  const text = code == null || statusCodeInTooltip ? label : `${label} ${code}`;
  const status = (
    <StatusDot statusValue={{ status: statusTone[row.outcome], text }} />
  );

  return statusCodeInTooltip && code != null ? (
    <Tooltip title={`HTTP ${code}`} trigger={['hover', 'focus']}>
      <span tabIndex={0}>{status}</span>
    </Tooltip>
  ) : (
    status
  );
};

const RequestSummary = ({
  observation,
  instanceName,
  locale,
  t
}: {
  observation: TraceRecord;
  instanceName: (id: number | null) => string;
  locale: string;
  t: TraceMessage;
}) => {
  const requestId = observation.request_id;
  const information = [
    {
      key: 'request',
      label: 'Request ID',
      children: (
        <Typography.Text
          code
          copyable={!!requestId}
          className={styles.identifier}
        >
          {requestId ?? '—'}
        </Typography.Text>
      )
    },
    {
      key: 'trace',
      label: 'Trace ID',
      children: (
        <Typography.Text code copyable className={styles.identifier}>
          {formatTraceId(observation.trace_id)}
        </Typography.Text>
      )
    },
    {
      key: 'time',
      label: t('startedAt'),
      children: formatTraceDate(observation.started_at_ms, locale)
    },
    {
      key: 'instance',
      label: t('instanceColumn'),
      children:
        observation.instance_name ?? instanceName(observation.instance_id)
    }
  ];
  const metrics = [
    {
      key: 'duration',
      label: traceDurationLabel(observation, t),
      children: formatTraceValue(observation.duration_ms / 1000, 's')
    },
    {
      key: 'ttft',
      label: t('ttft'),
      children: formatTraceValue(observation.request_metrics?.ttft_ms, 'ms')
    },
    {
      key: 'tokens',
      label: t('tokens'),
      children: formatTraceTokens(observation.request_metrics)
    }
  ];
  const attributes = [
    {
      key: 'method',
      label: t('endpoint'),
      children: observation.path ?? '—'
    },
    {
      key: 'status',
      label: 'HTTP',
      children: observation.status_code ?? '—'
    },
    {
      key: 'stream',
      label: 'stream',
      children: observation.stream == null ? '—' : String(observation.stream)
    }
  ];
  return (
    <Row gutter={[12, 12]} className={styles.requestSummary}>
      <Col xs={24} lg={16}>
        <CardWrapper style={{ height: '100%', boxSizing: 'border-box' }}>
          <SectionTitle>{t('requestInfo')}</SectionTitle>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={15}>
              <Descriptions column={1} size="small" items={information} />
            </Col>
            <Col xs={24} md={9}>
              <Descriptions column={1} size="small" items={attributes} />
            </Col>
          </Row>
        </CardWrapper>
      </Col>
      <Col xs={24} lg={8}>
        <CardWrapper style={{ height: '100%', boxSizing: 'border-box' }}>
          <SectionTitle>{t('requestMetrics')}</SectionTitle>
          <Descriptions column={1} size="small" items={metrics} />
        </CardWrapper>
      </Col>
    </Row>
  );
};

export default function TraceDetails({
  row,
  state,
  instanceName,
  locale,
  t,
  onClose,
  onRetry
}: {
  row: TraceRecord | null;
  state: ResourceSnapshot<TraceDetail>;
  instanceName: (id: number | null) => string;
  locale: string;
  t: TraceMessage;
  onClose: () => void;
  onRetry: () => void;
}) {
  const detail = state.data;
  const observation = detail?.request ?? row;
  const notFound =
    (state.error as { response?: { status?: number } } | null)?.response
      ?.status === 404;

  return (
    <GSDrawer
      open={!!row}
      onClose={onClose}
      styles={{
        wrapper: { width: 'min(1120px, 100vw)' },
        body: { paddingBlock: 0, paddingInline: 0, overflowY: 'hidden' }
      }}
      destroyOnHidden
      title={
        <Flex gap={12} align="center">
          {t('requestDetail')}
          {observation && <RequestTraceStatus row={observation} t={t} />}
        </Flex>
      }
    >
      {observation && (
        <OverlayScroller
          maxHeight="100%"
          style={{ height: '100%', paddingInline: 0 }}
          scrollbars={{ autoHide: 'leave' }}
        >
          <Flex vertical gap={16} className={styles.drawerContent}>
            <RequestSummary
              observation={observation}
              instanceName={instanceName}
              locale={locale}
              t={t}
            />
            {state.loading && <Skeleton active />}
            {state.error != null && (
              <Alert
                showIcon
                type={notFound ? 'info' : 'error'}
                title={t(notFound ? 'traceNotFound' : 'queryFailed')}
                action={<Button onClick={onRetry}>{t('retry')}</Button>}
              />
            )}
            {detail && (
              <SpanTimeline
                key={traceRecordKey(observation)}
                detail={detail}
                t={t}
              />
            )}
          </Flex>
        </OverlayScroller>
      )}
    </GSDrawer>
  );
}
