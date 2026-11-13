import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import HelpTooltip from './help-tooltip';

const ChartInteractionHelp = ({ contextNote }: { contextNote?: string }) => {
  const intl = useIntl();
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  return (
    <HelpTooltip
      label={t('chartInteractionHelp')}
      content={
        <Flex vertical gap={8}>
          <strong>{t('chartInteractionHelp')}</strong>
          {[
            'legendInteractionHelp',
            'legendMultiSelectionHelp',
            'legendValuesHelp',
            'chartInspectionHelp'
          ].map((key) => (
            <span key={key}>{t(key)}</span>
          ))}
          {contextNote && <span>{contextNote}</span>}
        </Flex>
      }
    />
  );
};

export default ChartInteractionHelp;
