import { StatusMaps } from '@/config';
import { AutoTooltip, Table as SealTable, StatusDot } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Space, Typography } from 'antd';
import type { ModelMetric } from '../config/types';
import { canOmitMetric } from '../utils/metric-state';
import { routerMemberRows } from '../utils/router-members';
import HelpTooltip from './help-tooltip';
import { MetricNotice, MetricState } from './metric-state';
import type { PDInstance } from './pd-monitoring-content';

interface Props {
  metric?: ModelMetric;
  instances: PDInstance[];
  omitUnavailable?: boolean;
}

// Router member health describes the upstream observed by a router instance.
// It is independent of deployment readiness and the router's own role.
export default function PDRouterMembers({
  metric,
  instances,
  omitUnavailable = false
}: Props) {
  const intl = useIntl();
  const m = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.pd.${key}` });
  const members = routerMemberRows(metric, instances, m('unresolvedMember'));
  const roleLabel = (role: string | null) =>
    !role
      ? m('unknown')
      : role === 'inference'
        ? m('inference')
        : (
            {
              prefill: 'Prefill',
              decode: 'Decode',
              router: 'Router'
            } as Record<string, string>
          )[role] || role;
  if (omitUnavailable && canOmitMetric(metric)) return null;
  return (
    <Flex vertical gap={8} data-router-members>
      <Space size={4}>
        <Typography.Text strong>{m('routerMembers')}</Typography.Text>
        <HelpTooltip label={m('routerMembers')} content={t('rolePoolHelp')} />
      </Space>
      <MetricNotice metric={metric} />
      {!members.length ? (
        <MetricState metric={metric} compact={omitUnavailable} />
      ) : (
        <SealTable
          rowKey="id"
          dataSource={members}
          columns={[
            {
              dataIndex: 'instance',
              title: m('instance'),
              minWidth: 180,
              render: (value: string) => (
                <AutoTooltip ghost>{value}</AutoTooltip>
              )
            },
            {
              dataIndex: 'role',
              title: m('role'),
              minWidth: 100,
              render: roleLabel
            },
            {
              dataIndex: 'observer',
              title: m('observedBy'),
              minWidth: 180,
              render: (value: string) => (
                <AutoTooltip ghost>{value}</AutoTooltip>
              )
            },
            {
              dataIndex: 'value',
              title: m('routerHealth'),
              minWidth: 120,
              render: (value: number | null) => (
                <StatusDot
                  statusValue={{
                    status:
                      value === 1
                        ? StatusMaps.success
                        : value === 0
                          ? StatusMaps.error
                          : StatusMaps.inactive,
                    text: m(
                      value === 1
                        ? 'healthy'
                        : value === 0
                          ? 'unhealthy'
                          : value === -1
                            ? 'removed'
                            : 'unknown'
                    )
                  }}
                />
              )
            }
          ]}
          scroll={{ x: true }}
        />
      )}
    </Flex>
  );
}
