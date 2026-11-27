import { useIntl } from '@umijs/max';
import { Flex, Segmented, Typography } from 'antd';
import { useId } from 'react';
import { useDetail } from '../config/context';

interface MonitoringViewControlProps {
  compact?: boolean;
  onChange?: (view: 'aggregate' | 'instances') => void;
}

const MonitoringViewControl = ({
  compact = false,
  onChange
}: MonitoringViewControlProps) => {
  const intl = useIntl();
  const fieldId = useId();
  const { scope, changeScope } = useDetail();
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });

  return (
    <Flex gap={8} align="center">
      <Typography.Text
        id={`${fieldId}-view`}
        type="secondary"
        style={{
          fontSize: compact ? 'var(--font-size-small)' : 'var(--ant-font-size)',
          whiteSpace: 'nowrap'
        }}
      >
        {t('viewMode')}
      </Typography.Text>
      <Segmented
        size={compact ? 'small' : undefined}
        aria-label={t('viewMode')}
        aria-labelledby={`${fieldId}-view`}
        value={scope.view}
        styles={{
          label: compact
            ? {
                fontSize: 'var(--font-size-small)',
                minHeight: 24,
                lineHeight: '24px'
              }
            : { fontSize: 'var(--ant-font-size)' }
        }}
        options={[
          { label: t('aggregate'), value: 'aggregate' },
          { label: t('byInstance'), value: 'instances' }
        ]}
        onChange={(view) =>
          onChange
            ? onChange(view as 'aggregate' | 'instances')
            : changeScope({ view: view as 'aggregate' | 'instances' })
        }
      />
    </Flex>
  );
};

export default MonitoringViewControl;
