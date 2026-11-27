import { SimpleSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Typography } from 'antd';
import { useId } from 'react';
import { useLatencyStatistics } from '../config/latency-statistics-context';
import type { LatencyStatistic } from '../utils/latency-statistics';
import { INTERVAL_STATISTICS } from '../utils/metrics';
import HelpTooltip from './help-tooltip';

const options = INTERVAL_STATISTICS.map((statistic) => ({
  label: statistic === 'avg' ? 'Avg' : statistic.toUpperCase(),
  value: statistic
}));

export function LatencyStatisticsControl({
  size = 'small'
}: {
  size?: 'small' | 'middle' | 'large';
}) {
  const context = useLatencyStatistics();
  const intl = useIntl();
  const id = useId();
  if (!context) return null;
  const title = intl.formatMessage({ id: 'modelMonitoring.latencyStatistics' });
  return (
    <Flex
      gap={8}
      align="center"
      wrap
      style={{ minWidth: 0, maxWidth: '100%' }}
      data-latency-statistics-control
    >
      <Flex gap={4} align="center">
        <Typography.Text
          id={id}
          type="secondary"
          style={{ whiteSpace: 'nowrap' }}
        >
          {title}
        </Typography.Text>
        <HelpTooltip
          label={title}
          content={intl.formatMessage({
            id: 'modelMonitoring.latencyStatisticsHelp'
          })}
        />
      </Flex>
      <SimpleSelect
        aria-labelledby={id}
        size={size}
        mode="multiple"
        showSearch={false}
        maxTagCount="responsive"
        options={options}
        value={context.statistics}
        onChange={(statistics: LatencyStatistic[]) => {
          if (statistics.length) context.onChange(statistics);
        }}
        styles={{
          wrapper: {
            width: 180,
            flex: '0 1 180px',
            minWidth: 0,
            maxWidth: '100%'
          },
          select: {
            minHeight:
              size === 'large'
                ? 'var(--ant-control-height-lg)'
                : size === 'small'
                  ? 'var(--ant-control-height-sm)'
                  : 'var(--ant-control-height)',
            alignItems: 'center'
          }
        }}
      />
    </Flex>
  );
}
