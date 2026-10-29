import { useIntl } from '@umijs/max';
import { Alert, Button, Tooltip } from 'antd';
import React from 'react';
import { useDetailContext } from '../../config/detail-context';
import { getValidityWarningPresentation } from '../../utils/validity-warning';

const ValidityAlert: React.FC = () => {
  const intl = useIntl();
  const { detailData } = useDetailContext();
  const validity = detailData?.validity;
  if (validity?.in_progress || !validity?.warnings?.length) return null;
  const t = (id: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id }, values);
  const number = (value: number) =>
    value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const warnings = validity.warnings.map((warning, index) => {
    const { messageId, params, evidence } = getValidityWarningPresentation(
      warning,
      validity
    );
    return (
      <li key={index}>
        {t(messageId, params as Record<string, string | number>)}
        {evidence && (
          <Tooltip
            trigger={['hover', 'focus']}
            title={
              <div>
                <div>
                  {t('benchmark.detail.validity.declineEvidence.peak', {
                    tps: number(evidence.peak_total_tps)
                  })}
                </div>
                {evidence.points.map((point, i) => (
                  <div key={i}>
                    {t(
                      detailData.load_type === 'concurrency'
                        ? 'benchmark.detail.validity.declineEvidence.concurrency'
                        : 'benchmark.detail.validity.declineEvidence.rate',
                      {
                        rate: number(point.rate),
                        tps: number(point.total_tps),
                        drop: number(point.drop_percent)
                      }
                    )}
                  </div>
                ))}
              </div>
            }
          >
            <Button
              type="link"
              size="small"
              style={{ paddingBlock: 0, height: 'auto' }}
              aria-label={t(
                'benchmark.detail.validity.declineEvidence.details'
              )}
            >
              {t('benchmark.detail.validity.declineEvidence.details')}
            </Button>
          </Tooltip>
        )}
      </li>
    );
  });
  return (
    <Alert
      type="warning"
      showIcon
      title={t(
        validity.coverage_applicable === false
          ? 'benchmark.detail.summary.results'
          : 'benchmark.detail.validity.title'
      )}
      description={<ul style={{ margin: 0, paddingLeft: 18 }}>{warnings}</ul>}
    />
  );
};

export default ValidityAlert;
