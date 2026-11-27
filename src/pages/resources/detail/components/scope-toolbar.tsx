import { HelpTooltip, TimeRangeControl } from '@/pages/_components/monitoring';
import useGrafanaLink from '@/pages/resources/hooks/use-grafana-link';
import { ReloadOutlined } from '@ant-design/icons';
import { GrafanaIcon } from '@gpustack/core-ui';
import { Button, ConfigProvider, Flex, Space, Tooltip, Typography } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { useResource } from '../config/context';
import { useResourceIntl } from '../hooks/use-resource-intl';
import { resourceGrafanaHref } from '../services/requests';
import styles from './detail.module.less';

export default function ScopeToolbar({
  embedded = false,
  extra
}: {
  embedded?: boolean;
  extra?: ReactNode;
}) {
  const { target, scope, changeScope, capabilities, refresh, metrics } =
    useResource();
  const t = useResourceIntl();
  const { showMonitoring } = useGrafanaLink({ type: 'worker' });
  const toolbar = (
    <Flex
      gap="var(--ant-padding)"
      align="center"
      wrap
      justify="space-between"
      className={classNames(styles.toolbar, embedded && styles.embeddedToolbar)}
    >
      <Flex gap="var(--ant-padding)" align="center" wrap>
        <TimeRangeControl
          variant="presets"
          scope={scope}
          changeScope={changeScope}
          capabilities={capabilities}
          historyNote={t('inventoryHelp')}
        />
        {metrics.data && (
          <Flex gap={4} align="center">
            <Typography.Text className={styles.timestamp}>
              {t('queryStep', { seconds: metrics.data.step })}
            </Typography.Text>
            <HelpTooltip
              label={t('queryStep', { seconds: metrics.data.step })}
              content={t('queryStepHelp')}
            />
          </Flex>
        )}
      </Flex>
      <Space wrap align="center" size={8} style={{ marginInlineStart: 'auto' }}>
        {metrics.data ? (
          <Flex align="center" className={styles.refreshGroup}>
            <Typography.Text className={styles.refreshTimestamp}>
              {t(metrics.stale ? 'lastSuccess' : 'updatedAt')}{' '}
              {dayjs(metrics.data.last_refreshed_at * 1000).format('HH:mm:ss')}
            </Typography.Text>
            <Tooltip title={t('refreshHelp')} trigger={['hover', 'focus']}>
              <Button
                type="text"
                className={styles.refreshButton}
                icon={<ReloadOutlined />}
                onClick={() => void refresh()}
                aria-label={t('refresh')}
                loading={metrics.loading}
              />
            </Tooltip>
          </Flex>
        ) : (
          <Tooltip title={t('refreshHelp')} trigger={['hover', 'focus']}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => void refresh()}
              aria-label={t('refresh')}
              loading={metrics.loading}
            />
          </Tooltip>
        )}
        {showMonitoring && (
          <Button
            icon={
              <Flex component="span" align="center" aria-hidden>
                <GrafanaIcon style={{ width: 16, height: 16 }} />
              </Flex>
            }
            href={resourceGrafanaHref(target, scope)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('grafana')}
          </Button>
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
}
