import { useIntl } from '@umijs/max';
import { Button, Flex, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { useId } from 'react';
import { useLatencyStatistics } from '../config/latency-statistics-context';
import { INTERVAL_STATISTICS } from '../utils/metrics';
import HelpTooltip from './help-tooltip';

const useStyles = createStyles(({ css }) => ({
  choices: css`
    --latency-control-height: var(--ant-control-height-sm);
    --latency-control-radius: var(--ant-border-radius-sm);
    --latency-choice-radius: var(--ant-border-radius-sm);
    --latency-choice-width: 42px;
    &[data-size='middle'] {
      --latency-control-height: var(--ant-control-height);
      --latency-control-radius: var(--ant-border-radius);
    }
    &[data-size='large'] {
      --latency-control-height: var(--ant-control-height-lg);
      --latency-control-radius: var(--ant-border-radius-lg);
      --latency-choice-radius: var(--ant-border-radius);
      --latency-choice-width: 44px;
    }
    height: var(--latency-control-height);
    padding: 2px;
    border-radius: var(--latency-control-radius);
    background: var(--ant-color-bg-layout);
    flex-shrink: 0;
    .ant-btn {
      height: calc(var(--latency-control-height) - 4px);
      width: var(--latency-choice-width);
      min-width: 0;
      padding-inline: 0;
      font-size: var(--ant-font-size);
      border-radius: var(--latency-choice-radius);
    }
    .ant-btn[aria-pressed='true'] {
      color: var(--ant-color-primary);
      background: var(--ant-color-bg-container);
      box-shadow: var(--ant-box-shadow-tertiary);
    }
  `
}));

export function LatencyStatisticsControl({
  size = 'small'
}: {
  size?: 'small' | 'middle' | 'large';
}) {
  const context = useLatencyStatistics();
  const intl = useIntl();
  const { styles } = useStyles();
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
      <Typography.Text
        id={id}
        type="secondary"
        style={{ whiteSpace: 'nowrap' }}
      >
        {title}
      </Typography.Text>
      <Flex gap={8} align="center">
        <Flex
          className={styles.choices}
          data-size={size}
          gap={0}
          role="group"
          aria-labelledby={id}
        >
          {INTERVAL_STATISTICS.map((statistic) => {
            const selected = context.statistics.includes(statistic);
            return (
              <Button
                key={statistic}
                size={size}
                type="text"
                aria-pressed={selected}
                onClick={() => {
                  if (selected && context.statistics.length === 1) return;
                  context.onChange(
                    selected
                      ? context.statistics.filter((item) => item !== statistic)
                      : [...context.statistics, statistic]
                  );
                }}
              >
                {statistic === 'avg' ? 'Avg' : statistic.toUpperCase()}
              </Button>
            );
          })}
        </Flex>
        <HelpTooltip
          label={title}
          content={intl.formatMessage({
            id: 'modelMonitoring.latencyStatisticsHelp'
          })}
        />
      </Flex>
    </Flex>
  );
}
