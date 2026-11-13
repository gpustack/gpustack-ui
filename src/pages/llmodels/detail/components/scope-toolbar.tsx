import useGrafanaLink from '@/pages/resources/hooks/use-grafana-link';
import { ReloadOutlined } from '@ant-design/icons';
import { BaseSelect, GrafanaIcon } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Segmented, Space, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { useId, type ReactNode } from 'react';
import { isPDModel } from '../../config';
import { useDetail } from '../config/context';
import TimeRangeFilter from './time-range-filter';
const ScopeToolbar = ({ extra }: { extra?: ReactNode }) => {
  const intl = useIntl();
  const fieldId = useId();
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
  const refreshed = tab === 'gpu' ? resources : runtime;
  const refreshing = [model, instances, runtime, resources].some(
    (state) => state.loading
  );
  return (
    <Flex gap={16} align="flex-start" wrap role="group" aria-label={t('scope')}>
      <TimeRangeFilter />
      <Flex
        gap={8}
        align="center"
        style={{ flex: '1 1 240px', minWidth: 0, maxWidth: 360 }}
      >
        <label
          htmlFor={`${fieldId}-instance`}
          style={{
            color: 'var(--ant-color-text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          {t('instance')}
        </label>
        <BaseSelect
          id={`${fieldId}-instance`}
          aria-label={t('instance')}
          showSearch={{ optionFilterProp: 'label' }}
          allowClear
          mode="multiple"
          maxTagCount={1}
          maxTagTextLength={24}
          maxCount={32}
          placeholder={t('allInstances')}
          value={scope.instanceIds}
          onChange={(instanceIds: number[] | undefined) =>
            changeScope({ instanceIds: instanceIds || [] })
          }
          options={(instances.data || []).map((instance) => ({
            label: instance.name,
            value: instance.id
          }))}
          loading={instances.loading}
          style={{ flex: 1, minWidth: 140 }}
        />
        {!!scope.instanceIds.length && (
          <Button
            type="link"
            size="small"
            aria-label={t('clearInstances')}
            onClick={() => changeScope({ instanceIds: [] })}
            style={{ paddingInline: 0 }}
          >
            {t('allInstances')}
          </Button>
        )}
      </Flex>
      {isPDModel(model.data || {}) && (
        <Flex gap={8} align="center">
          <label
            htmlFor={`${fieldId}-role`}
            style={{
              color: 'var(--ant-color-text-secondary)',
              whiteSpace: 'nowrap'
            }}
          >
            {t('role')}
          </label>
          <BaseSelect
            id={`${fieldId}-role`}
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
        </Flex>
      )}
      {tab === 'monitoring' && (
        <Flex gap={8} align="center">
          <Typography.Text
            id={`${fieldId}-view`}
            type="secondary"
            style={{ whiteSpace: 'nowrap' }}
          >
            {t('viewMode')}
          </Typography.Text>
          <Segmented
            aria-label={t('viewMode')}
            aria-labelledby={`${fieldId}-view`}
            value={scope.view}
            options={[
              { label: t('aggregate'), value: 'aggregate' },
              { label: t('byInstance'), value: 'instances' }
            ]}
            onChange={(view) =>
              changeScope({ view: view as 'aggregate' | 'instances' })
            }
          />
        </Flex>
      )}
      <Space wrap size={8} style={{ marginInlineStart: 'auto' }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t(refreshed.stale ? 'lastSuccess' : 'lastRefreshed')}{' '}
          {refreshed.data?.last_refreshed_at
            ? dayjs(refreshed.data!.last_refreshed_at * 1000).format('HH:mm:ss')
            : '—'}
        </Typography.Text>
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
        {showMonitoring && model.data && (
          <Tooltip
            title={
              isPDModel(model.data) && scope.instanceIds.length
                ? t('pdGrafanaScope')
                : undefined
            }
          >
            <Button
              icon={<GrafanaIcon />}
              onClick={() =>
                goToModelMonitoringGrafana(
                  { id: model.data!.id },
                  {
                    window: scope.window,
                    ...(scope.start != null && scope.end != null
                      ? { start: scope.start, end: scope.end }
                      : {}),
                    instanceIds: scope.instanceIds,
                    role: scope.role
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
};
export default ScopeToolbar;
