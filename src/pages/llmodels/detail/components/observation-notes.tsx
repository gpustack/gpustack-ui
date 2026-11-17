import { InfoCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Flex, Popover, Typography } from 'antd';
import { useState, type KeyboardEvent } from 'react';
import type { ModelMetric } from '../config/types';
import { canOmitMetric, metricStateMessageId } from '../utils/metric-state';

export default function ObservationNotes({
  metrics,
  groups,
  ingressContext
}: {
  metrics: Record<string, ModelMetric>;
  groups: Record<string, string[]>;
  ingressContext?: { notApplicable: boolean; reason: string };
}) {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const dismiss = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpen(false);
      event.stopPropagation();
    }
  };

  const m = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const labels: Record<string, string> = {
    pd_kv_completion: 'pd.completionDuration',
    pd_kv_throughput: 'pd.transferThroughput',
    pd_kv_transfer_failures: 'pd.transferFailures',
    pd_kv_bootstrap_failures: 'pd.bootstrapFailures',
    pd_kv_expired: 'pd.expiredKV',
    ingress_ttft: 'pd.ingressTTFT',
    ingress_e2e: 'pd.ingressE2E',
    pd_kv_transfer: 'pd.transferDuration',
    pd_kv_transfer_post: 'pd.transferPost',
    pd_kv_allocation: 'pd.allocation',
    pd_kv_transfer_bytes: 'pd.transferSize',
    pd_kv_transfer_speed: 'pd.transferSpeed',
    pd_prefill_bootstrap_queue: 'pd.bootstrapQueue',
    pd_prefill_inflight_queue: 'pd.inflightQueue',
    pd_decode_prealloc_queue: 'pd.preallocQueue',
    pd_decode_transfer_queue: 'pd.transferQueue',
    router_requests: 'pd.routerRequests',
    router_request_duration: 'pd.routerDuration',
    router_health: 'routerMembers'
  };
  const keys = [...new Set(Object.values(groups).flat())].filter((key) =>
    canOmitMetric(metrics[key])
  );
  const absentIngress = ['ingress_ttft', 'ingress_e2e'].every((key) =>
    keys.includes(key)
  );
  const entries = keys
    .filter((key) => !absentIngress || !key.startsWith('ingress_'))
    .map((key) => ({
      key,
      title: m(labels[key] || `metric.${key}`),
      status: m(
        metrics[key].status === 'not_applicable'
          ? 'observationNotApplicable'
          : 'observationUnsupported'
      ),
      reason: intl.formatMessage({ id: metricStateMessageId(metrics[key]) })
    }));
  if (absentIngress)
    entries.unshift({
      key: 'ingress',
      title: m('pd.serviceExperience'),
      status: m(
        ingressContext?.notApplicable ||
          ['ingress_ttft', 'ingress_e2e'].every(
            (key) => metrics[key]?.status === 'not_applicable'
          )
          ? 'observationNotApplicable'
          : 'observationUnsupported'
      ),
      reason: ingressContext?.reason || m('pd.ingressUnavailable')
    });
  if (!entries.length) return null;
  return (
    <Popover
      data-observation-notes
      placement="bottomRight"
      align={{
        overflow: { adjustX: true, adjustY: true, shiftX: true, shiftY: true }
      }}
      getPopupContainer={(trigger) => trigger.ownerDocument.body}
      open={open}
      onOpenChange={setOpen}
      trigger={['click', 'hover', 'focus']}
      content={
        <Flex
          vertical
          gap={12}
          onKeyDown={dismiss}
          role="region"
          aria-label={m('observationNotes')}
          tabIndex={0}
          style={{
            width: 'min(420px, calc(100vw - 48px))',
            maxHeight: 'min(360px, calc(100vh - 96px))',
            overflowY: 'auto'
          }}
        >
          {entries.map((entry) => (
            <Flex key={entry.key} vertical gap={4}>
              <Flex align="baseline" gap={8} wrap>
                <Typography.Text strong>{entry.title}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {entry.status}
                </Typography.Text>
              </Flex>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {entry.reason}
              </Typography.Text>
            </Flex>
          ))}
        </Flex>
      }
    >
      <Button
        size="small"
        type="text"
        icon={<InfoCircleOutlined />}
        data-observation-notes-trigger
        aria-expanded={open}
        onKeyDown={dismiss}
        style={{ color: 'var(--ant-color-text-secondary)' }}
      >
        {m('observationNotes')}
      </Button>
    </Popover>
  );
}
