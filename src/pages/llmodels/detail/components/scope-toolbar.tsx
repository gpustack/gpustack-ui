import useGrafanaLink from '@/pages/resources/hooks/use-grafana-link';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { BaseSelect, GrafanaIcon, SimpleSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, ConfigProvider, Flex, Space, Tooltip, Typography } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import { useMemo, type ReactNode } from 'react';
import { isPDModel } from '../../config';
import { useDetail } from '../config/context';
import { LatencyStatisticsControl } from './latency-statistics';
import MonitoringViewControl from './monitoring-view-control';
import TimeRangeFilter from './time-range-filter';

const MAX_SELECTED_INSTANCES = 32;

const useStyles = createStyles(({ css }) => ({
  embedded: css`
    padding: var(--ant-padding-sm) var(--ant-padding);
  `,
  refreshGroup: css`
    height: var(--ant-control-height);
    border: 1px solid var(--ant-color-border);
    border-radius: var(--ant-border-radius);
    background: var(--ant-color-bg-container);
    overflow: hidden;
  `,
  refreshTimestamp: css`
    padding-inline: var(--ant-padding-sm);
    font-size: var(--font-size-caption);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  `,
  refreshButton: css`
    height: 100%;
    border-radius: 0;
    border-inline-start: 1px solid var(--ant-color-border);
  `
}));

const ScopeToolbar = ({
  extra,
  onViewChange,
  embedded = false,
  showViewControl = !embedded
}: {
  extra?: ReactNode;
  onViewChange?: (view: 'aggregate' | 'instances') => void;
  embedded?: boolean;
  showViewControl?: boolean;
}) => {
  const { styles } = useStyles();
  const intl = useIntl();
  const { componentSize } = ConfigProvider.useConfig();
  const { goToModelMonitoringGrafana, showMonitoring } = useGrafanaLink({
    type: 'model'
  });
  const {
    model,
    instances,
    scope,
    changeScope,
    runtime,
    resources,
    tab,
    refresh
  } = useDetail();
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const pairedPools =
    isPDModel(model.data || {}) && (tab === 'overview' || tab === 'monitoring');
  const wholeModel = tab === 'monitoring' || pairedPools;
  const refreshed = tab === 'gpu' ? resources : runtime;
  const refreshing = [model, instances, runtime, resources].some(
    (state) => state.loading
  );
  const instanceOptions = useMemo(
    () =>
      (instances.data || []).map((instance) => ({
        label: instance.name,
        value: instance.id
      })),
    [instances.data]
  );
  const effectiveSize = embedded
    ? 'middle'
    : componentSize === 'large' || componentSize === 'small'
      ? componentSize
      : 'middle';
  const toolbar = (
    <Flex
      align="center"
      wrap
      role="group"
      aria-label={t('scope')}
      className={embedded ? styles.embedded : undefined}
      gap={
        tab === 'monitoring' || tab === 'gpu'
          ? 'var(--ant-padding)'
          : 'var(--ant-padding-sm) var(--ant-padding-lg)'
      }
    >
      {tab !== 'instances' && <TimeRangeFilter />}
      {!wholeModel && (
        <SimpleSelect
          aria-label={t('instance')}
          showSearch
          allowClear
          mode="multiple"
          maxTagCount="responsive"
          maxTagTextLength={24}
          maxCount={MAX_SELECTED_INSTANCES}
          placeholder={t('allInstances')}
          value={scope.instanceIds}
          onChange={(instanceIds: number[] | undefined) => {
            const limit = Math.max(
              MAX_SELECTED_INSTANCES,
              scope.instanceIds.length
            );
            changeScope({
              instanceIds: instanceIds?.slice(0, limit) ?? []
            });
          }}
          options={instanceOptions}
          loading={instances.loading}
          suffixIcon={
            <SearchOutlined
              style={{ color: 'var(--ant-color-text-placeholder)' }}
            />
          }
          styles={{
            wrapper: { flex: '1 1 240px', minWidth: 0, maxWidth: 360 }
          }}
        />
      )}
      {isPDModel(model.data || {}) && !wholeModel && (
        <BaseSelect
          aria-label={t('role')}
          value={scope.role}
          options={['all', 'prefill', 'decode', 'router'].map((value) => ({
            value,
            label:
              value === 'all'
                ? t('allRoles')
                : value === 'prefill'
                  ? 'Prefill'
                  : value === 'decode'
                    ? 'Decode'
                    : 'Router'
          }))}
          onChange={(role) => changeScope({ role })}
          style={{ minWidth: 110 }}
        />
      )}
      {tab === 'monitoring' && showViewControl && (
        <MonitoringViewControl onChange={onViewChange} />
      )}
      {tab === 'monitoring' && (
        <LatencyStatisticsControl size={effectiveSize} />
      )}
      <Space wrap align="center" size={8} style={{ marginInlineStart: 'auto' }}>
        {tab !== 'instances' ? (
          <Flex align="center" className={styles.refreshGroup}>
            <Typography.Text
              type="secondary"
              className={styles.refreshTimestamp}
            >
              {t(refreshed.stale ? 'lastSuccess' : 'lastRefreshed')}{' '}
              {refreshed.data?.last_refreshed_at
                ? dayjs(refreshed.data!.last_refreshed_at * 1000).format(
                    'HH:mm:ss'
                  )
                : '—'}
            </Typography.Text>
            <Tooltip
              title={`${t('refresh')} · ${t('refreshInterval')}`}
              trigger={['hover', 'focus']}
            >
              <Button
                type="text"
                className={styles.refreshButton}
                icon={<ReloadOutlined />}
                aria-label={t('refresh')}
                onClick={refresh}
                loading={refreshing}
              />
            </Tooltip>
          </Flex>
        ) : (
          <Tooltip
            title={`${t('refresh')} · ${t('refreshInterval')}`}
            trigger={['hover', 'focus']}
          >
            <Button
              icon={<ReloadOutlined />}
              aria-label={t('refresh')}
              onClick={refresh}
              loading={refreshing}
            />
          </Tooltip>
        )}
        {showMonitoring && model.data && (
          <Tooltip
            title={
              isPDModel(model.data) && !wholeModel && scope.instanceIds.length
                ? t('pdGrafanaScope')
                : undefined
            }
          >
            <Button
              icon={
                <Flex component="span" align="center" aria-hidden>
                  <GrafanaIcon style={{ width: 16, height: 16 }} />
                </Flex>
              }
              onClick={() =>
                goToModelMonitoringGrafana(
                  { id: model.data!.id },
                  {
                    window: scope.window,
                    ...(scope.start != null && scope.end != null
                      ? { start: scope.start, end: scope.end }
                      : {}),
                    instanceIds: wholeModel ? [] : scope.instanceIds,
                    role: wholeModel ? 'all' : scope.role
                  }
                )
              }
            >
              {t('viewInGrafana')}
            </Button>
          </Tooltip>
        )}
        {extra}
      </Space>
    </Flex>
  );
  return embedded ? (
    <ConfigProvider componentSize="middle">{toolbar}</ConfigProvider>
  ) : (
    toolbar
  );
};
export default ScopeToolbar;
