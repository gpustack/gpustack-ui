import { useIntl } from '@umijs/max';
import { round } from 'lodash';
import React, { useMemo } from 'react';
import { loadValueDecimals } from '../../config';
import { useDetailContext } from '../../config/detail-context';
import { StagePoint, isSloCapacityPoint } from './metrics';
import MetricsResult from './metrics-result';
import { LoadChip, Panel, SectionTitle, StatusTag, statusLabelId } from './ui';

interface SelectedStageProps {
  point: StagePoint | null;
}

// Drill-down for the selected row. The header restates WHICH stage this is (load
// value + its verdict) because the section sits far below the table on a long
// page — without it the reader has to scroll back up to know what they are
// looking at.
const SelectedStage: React.FC<SelectedStageProps> = ({ point }) => {
  const intl = useIntl();
  const { detailData } = useDetailContext();

  // The detail reader accepts a report-shaped dump of this measured stage.
  const shaped = useMemo(() => {
    if (!point) return null;
    return {
      ...point.raw,
      total_requests: point.total,
      raw_metrics: { benchmarks: [point.raw.raw_metrics] }
    };
  }, [point]);

  if (!shaped || !point) {
    return null;
  }

  return (
    <Panel>
      <div className="panel-head divided">
        <SectionTitle style={{ marginBottom: 0 }}>
          {intl.formatMessage({ id: 'benchmark.detail.summary.stageDetail' })}
        </SectionTitle>
        <LoadChip>
          {point.raw.rate == null ? (
            intl.formatMessage({
              id: 'benchmark.detail.stage.saturationProbe'
            })
          ) : (
            <>
              {round(point.load, loadValueDecimals(detailData))}{' '}
              {intl.formatMessage({
                id:
                  loadValueDecimals(detailData) === 0
                    ? 'benchmark.table.best.unit.concurrency'
                    : 'benchmark.table.best.unit.rate'
              })}
            </>
          )}
        </LoadChip>
        {isSloCapacityPoint(point) && (
          <StatusTag
            kind="recommended"
            label={intl.formatMessage({ id: statusLabelId.recommended })}
          />
        )}
        {point.isPeak && (
          <StatusTag
            kind="peak"
            label={intl.formatMessage({ id: statusLabelId.peak })}
          />
        )}
        {point.isOverloaded && (
          <StatusTag
            kind="overloaded"
            label={intl.formatMessage({ id: statusLabelId.overloaded })}
          />
        )}
      </div>
      <div className="panel-body" style={{ paddingTop: 16 }}>
        <MetricsResult data={shaped} />
      </div>
    </Panel>
  );
};

export default SelectedStage;
