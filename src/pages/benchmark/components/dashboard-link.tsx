import { systemConfigAtom } from '@/atoms/system';
import { GPUSTACK_API_BASE_URL } from '@/config/settings';
import { GrafanaIcon } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import { useAtomValue } from 'jotai';
import React from 'react';

/**
 * The monitoring for what a run measured, over the interval it ran.
 *
 * The client-side numbers on this page say a run was slow; they cannot say
 * where the time went. Under PD that is three separate places — the prefill
 * queue, the decode queue and the KV transfer between them — so the server
 * sends a group to the PD dashboard rather than the model one, whose request
 * counters double for it, and pins the time range to the run instead of the
 * dashboard's default last-six-hours (a report read a day later would open on
 * an idle deployment).
 *
 * Which dashboard and which window are the server's to decide, which is why
 * this opens the redirect rather than building a Grafana URL here.
 */
const DashboardLink: React.FC<{ id?: number }> = ({ id }) => {
  const intl = useIntl();
  const systemConfig = useAtomValue(systemConfigAtom);

  if (!systemConfig?.showMonitoring || !id) {
    return null;
  }

  const handleClick = () => {
    // `noopener` matters more than usual here: the tab lands on whatever
    // Grafana the server redirects to, and without it that page keeps a handle
    // on this one and can navigate it away.
    window.open(
      `/${GPUSTACK_API_BASE_URL}/benchmarks/${id}/dashboard`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <Tooltip
      title={intl.formatMessage({ id: 'benchmark.detail.monitoring.tips' })}
    >
      <Button
        onClick={handleClick}
        icon={<GrafanaIcon style={{ width: 16, height: 16 }}></GrafanaIcon>}
      >
        {intl.formatMessage({ id: 'benchmark.detail.monitoring' })}
      </Button>
    </Tooltip>
  );
};

export default DashboardLink;
