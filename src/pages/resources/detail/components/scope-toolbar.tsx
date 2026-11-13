import { TimeRangeControl } from '@/pages/_components/monitoring';
import useGrafanaLink from '@/pages/resources/hooks/use-grafana-link';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, Flex, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { useResource } from '../config/context';
import { useResourceIntl } from '../hooks/use-resource-intl';
import { resourceGrafanaHref } from '../services/requests';
import styles from './detail.module.less';

export default function ScopeToolbar() {
  const { target, scope, changeScope, capabilities, refresh, metrics } =
    useResource();
  const t = useResourceIntl();
  const { showMonitoring } = useGrafanaLink({ type: 'worker' });
  return (
    <Flex
      gap={12}
      align="center"
      wrap
      justify="space-between"
      className={styles.toolbar}
    >
      <TimeRangeControl
        scope={scope}
        changeScope={changeScope}
        capabilities={capabilities}
        historyNote={t('inventoryHelp')}
      />
      <Flex gap={8} align="center" wrap>
        {metrics.data && (
          <Typography.Text className={styles.timestamp}>
            {t(metrics.stale ? 'lastSuccess' : 'updatedAt')}{' '}
            {dayjs(metrics.data.last_refreshed_at * 1000).format('HH:mm:ss')}
          </Typography.Text>
        )}
        <Tooltip title={t('refreshHelp')}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void refresh()}
            aria-label={t('refresh')}
            loading={metrics.loading}
          />
        </Tooltip>
        {showMonitoring && (
          <Button
            href={resourceGrafanaHref(target, scope)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('grafana')}
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
