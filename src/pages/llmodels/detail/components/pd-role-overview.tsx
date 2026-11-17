import { ArrowRightOutlined } from '@ant-design/icons';
import { Table as SealTable, SectionTitle } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Col, Flex, Row, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { Fragment } from 'react';
import { useDetail } from '../config/context';
import { displayMetricValue } from '../utils/metrics';
import { pdMetricValue, pdRoleMetric } from '../utils/pd-metrics';
import HelpTooltip from './help-tooltip';

const ROLE_NAMES = ['router', 'prefill', 'decode'] as const;
const roleName = (role: string) => role[0].toUpperCase() + role.slice(1);

const useStyles = createStyles(({ css }) => ({
  strip: css`
    border-block: 1px solid var(--ant-color-border-secondary);
    padding-block: var(--ant-padding);
  `,
  node: css`
    min-width: 0;
    height: 100%;
  `,
  detail: css`
    font-size: var(--ant-font-size-sm);
    overflow-wrap: anywhere;
  `,
  transfer: css`
    height: 100%;
    text-align: center;
    color: var(--ant-color-text-tertiary);
    font-size: var(--ant-font-size-sm);
  `
}));

const PDRoleOverview = ({
  variant = 'overview'
}: {
  variant?: 'overview' | 'monitoring' | 'table';
}) => {
  const { styles } = useStyles();
  const { model, instances, runtime, resources, setTab } = useDetail();
  const intl = useIntl();
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const metrics = runtime.data?.metrics || {};
  const rows = ROLE_NAMES.filter(
    (role) =>
      model.data?.roles?.some((item) => item.name === role) ||
      instances.data?.some((instance) => instance.role === role)
  ).map((role) => {
    const members = (instances.data || []).filter(
      (instance) => instance.role === role
    );
    const status = model.data?.role_status?.[role];
    const declaration = model.data?.roles?.find((item) => item.name === role);
    const devices = (resources.data?.devices || []).filter((device) =>
      device.model_instance_ids.some((id) =>
        members.some((member) => member.id === id)
      )
    );
    const workers = [
      ...new Set([
        ...devices.map((device) => device.worker_name),
        ...members.map((member) => member.worker_name).filter(Boolean)
      ])
    ];
    const ready = status?.ready;
    const desired = status?.desired ?? declaration?.replicas;
    return {
      role,
      ready: `${ready ?? '—'} / ${desired ?? '—'}`,
      members,
      resources:
        [
          workers.join(', '),
          devices.length ? `${devices.length} GPU` : undefined
        ]
          .filter(Boolean)
          .join(' · ') || '—',
      responsibility: t(`pd.${role}Responsibility`),
      waiting: pdMetricValue(
        pdRoleMetric(metrics.waiting_requests, role),
        'sum'
      ),
      kv: pdMetricValue(pdRoleMetric(metrics.kv_usage, role), 'max')
    };
  });
  const hasRouter = rows.some((row) => row.role === 'router');
  const title = t('pd.roleInstances');
  return variant === 'table' ? (
    <Flex vertical gap={12} data-pd-role-table>
      <Flex align="center" justify="space-between" wrap gap={8}>
        <SectionTitle>{title}</SectionTitle>
        <Button type="link" size="small" onClick={() => setTab('gpu')}>
          {t('viewResources')} →
        </Button>
      </Flex>
      <SealTable
        rowKey="role"
        dataSource={rows}
        loading={!!instances.loading || !!resources.loading}
        columns={[
          {
            dataIndex: 'role',
            title: t('role'),
            minWidth: 300,
            render: (role: string, row: (typeof rows)[number]) => (
              <Flex vertical gap={4}>
                <Typography.Text strong>{roleName(role)}</Typography.Text>
                <Button
                  type="link"
                  size="small"
                  style={{
                    height: 'auto',
                    padding: 0,
                    whiteSpace: 'normal',
                    textAlign: 'start'
                  }}
                  onClick={() => setTab('instances')}
                >
                  {row.members.map((member) => member.name).join(', ') || '—'}
                </Button>
              </Flex>
            )
          },
          { dataIndex: 'ready', title: t('ready'), minWidth: 110 },
          {
            dataIndex: 'resources',
            title: t('pd.roleResources'),
            minWidth: 180
          },
          {
            dataIndex: 'responsibility',
            title: t('pd.roleResponsibilities'),
            minWidth: 180
          }
        ]}
        scroll={{ x: true }}
      />
    </Flex>
  ) : (
    <Flex vertical className={styles.strip} data-pd-role-overview>
      <Row gutter={[24, 16]} align="stretch">
        {rows.map((row) => (
          <Fragment key={row.role}>
            {row.role === 'decode' && (
              <Col xs={0} lg={{ span: 24, flex: '120px' }}>
                <Flex
                  align="center"
                  justify="center"
                  gap={8}
                  className={styles.transfer}
                  data-pd-handoff
                >
                  <span>{model.data?.disaggregation?.mode || 'KV'}</span>
                  <ArrowRightOutlined style={{ fontSize: 20, flexShrink: 0 }} />
                </Flex>
              </Col>
            )}
            <Col
              xs={24}
              sm={hasRouter ? 8 : 12}
              lg={{ span: 24, flex: '1 1 0px' }}
              data-pd-role={row.role}
            >
              <Flex vertical gap={8} className={styles.node}>
                <Flex align="center" gap={8} wrap>
                  <Flex align="center" gap={4}>
                    <Typography.Text strong>
                      {roleName(row.role)}
                    </Typography.Text>
                    <HelpTooltip
                      label={`${roleName(row.role)} · ${t('pd.roleResponsibilities')}`}
                      content={row.responsibility}
                    />
                  </Flex>
                  <Typography.Text type="secondary" className={styles.detail}>
                    {row.ready} {t('ready')}
                  </Typography.Text>
                </Flex>
                <Typography.Text
                  type="secondary"
                  className={styles.detail}
                  ellipsis={{ tooltip: row.resources }}
                  data-pd-role-resources
                >
                  {row.resources}
                </Typography.Text>
                {row.role !== 'router' && (
                  <Flex gap={12} wrap>
                    <Typography.Text className={styles.detail}>
                      {t('metric.waiting_requests')}{' '}
                      <strong>
                        {displayMetricValue(row.waiting, 'requests')}
                      </strong>
                    </Typography.Text>
                    <Typography.Text className={styles.detail}>
                      {t('metric.kvMaximum')}{' '}
                      <strong>{displayMetricValue(row.kv, 'percent')}</strong>
                    </Typography.Text>
                  </Flex>
                )}
              </Flex>
            </Col>
          </Fragment>
        ))}
      </Row>
    </Flex>
  );
};

export default PDRoleOverview;
