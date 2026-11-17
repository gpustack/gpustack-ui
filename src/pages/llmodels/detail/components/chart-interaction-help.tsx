import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import type { ReactNode } from 'react';
import HelpTooltip from './help-tooltip';

const ChartInteractionHelp = ({
  contextNote,
  legendValuesNote,
  additionalContent
}: {
  contextNote?: string;
  legendValuesNote?: string;
  additionalContent?: ReactNode;
}) => {
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
            'valuesHelp',
            'chartInspectionHelp'
          ].map((key) => (
            <span key={key}>
              {key === 'legendValuesHelp' && legendValuesNote
                ? legendValuesNote
                : t(key)}
            </span>
          ))}
          {contextNote && <span>{contextNote}</span>}
          {additionalContent}
        </Flex>
      }
    />
  );
};

export default ChartInteractionHelp;
