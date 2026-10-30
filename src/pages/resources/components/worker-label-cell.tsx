import { AutoTooltip } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import { isFilterableLabelKey } from '../utils/worker-labels';
import styles from './worker-label-cell.module.less';

interface WorkerLabelCellProps {
  labels: Record<string, string>;
  onFilter: (label: string) => void;
}

export default function WorkerLabelCell({
  labels,
  onFilter
}: WorkerLabelCellProps) {
  const intl = useIntl();

  return (
    <Flex gap={6} wrap>
      {Object.entries(labels || {}).map(([key, value]) => {
        const pair = `${key}=${value}`;
        const text = `${key}: ${value}`;
        const filterable = isFilterableLabelKey(key);
        return (
          <AutoTooltip
            key={key}
            maxWidth={155}
            title={text}
            className={filterable ? styles.label : undefined}
            role={filterable ? 'button' : undefined}
            tabIndex={filterable ? 0 : undefined}
            aria-label={
              filterable
                ? intl.formatMessage(
                    { id: 'resources.filter.label.action' },
                    { label: text }
                  )
                : undefined
            }
            onClick={
              filterable
                ? (event) => {
                    event.stopPropagation();
                    onFilter(pair);
                  }
                : undefined
            }
            onKeyDown={
              filterable
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      onFilter(pair);
                    }
                  }
                : undefined
            }
          >
            {text}
          </AutoTooltip>
        );
      })}
    </Flex>
  );
}
