import { useIntl } from '@umijs/max';
import { Flex, Tooltip } from 'antd';
import React from 'react';
import { STOP_REASON_LABEL } from '../../config';
import { useDetailContext } from '../../config/detail-context';
import { recordedThroughputGainEvidence } from '../../utils/throughput-gain-evidence';

const StopReason: React.FC = () => {
  const intl = useIntl();
  const { detailData } = useDetailContext();
  const validity = detailData?.validity;
  if (validity?.in_progress) return null;
  const reason = validity?.stop_reason;
  const label = STOP_REASON_LABEL[reason ?? ''];
  if (!label) return null;
  const t = (id: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id }, values);
  const evidence =
    reason === 'throughput_gain_converged'
      ? recordedThroughputGainEvidence(validity?.throughput_gain_evidence)
      : undefined;
  const value = <b>{t(label)}</b>;
  const unit = t(
    detailData?.load_type === 'concurrency'
      ? 'benchmark.table.best.unit.concurrency'
      : 'benchmark.table.best.unit.rate'
  );
  const number = (value: number) =>
    value.toLocaleString(undefined, { maximumFractionDigits: 6 });
  const prefix = 'benchmark.detail.stopReason.throughputGainConverged';
  const title = evidence ? (
    <Flex vertical gap={4}>
      <span>
        {t(`${prefix}.detail`, {
          points: evidence.window_points,
          gain: evidence.gain_percent.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
          }),
          threshold: number(evidence.threshold_percent)
        })}
      </span>
      <span>
        {t(`${prefix}.baseline`, {
          load: number(evidence.baseline_rate),
          throughput: number(evidence.baseline_total_tps),
          unit
        })}
      </span>
      <span>
        {t(`${prefix}.best`, {
          load: number(evidence.best_rate),
          throughput: number(evidence.best_total_tps),
          unit
        })}
      </span>
      <span>
        {t(`${prefix}.range`, {
          lower: number(evidence.lower_rate),
          upper: number(evidence.upper_rate),
          unit
        })}
      </span>
      {evidence.points.map((point, index) => (
        <span key={index}>
          {t(`${prefix}.point`, {
            point: index + 1,
            load: number(point.rate),
            throughput: number(point.total_tps),
            best: number(point.best_total_tps),
            unit
          })}
        </span>
      ))}
    </Flex>
  ) : null;

  return (
    <span className="stop-reason">
      {t('benchmark.detail.stopReason.label')}
      {title ? (
        <Tooltip title={title} trigger={['hover', 'focus']}>
          <b tabIndex={0}>{t(label)}</b>
        </Tooltip>
      ) : (
        value
      )}
    </span>
  );
};

export default StopReason;
