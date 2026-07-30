import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import { round } from 'lodash';
import React, { useMemo, useState } from 'react';
import { loadValueDecimals } from '../../config';
import { useDetailContext } from '../../config/detail-context';
import { StagePoint } from './metrics';
import MetricsResult from './metrics-result';
import PercentileResult from './percentile-result';
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
  // Percentiles are rarely read on first open — collapsed to keep the page short.
  const [showPct, setShowPct] = useState(false);

  // MetricsResult / PercentileResult were written for the single-point view, which
  // reads the whole report; feed them this stage's dump in that shape.
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

  const kind = point.isBest
    ? 'recommended'
    : point.isPeak
      ? 'peak'
      : point.isOverloaded
        ? 'overloaded'
        : null;

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
        {kind && (
          <StatusTag
            kind={kind}
            label={intl.formatMessage({ id: statusLabelId[kind] })}
          />
        )}
        <span className="spacer" />
        <Button
          type="link"
          size="small"
          style={{ padding: 0 }}
          icon={showPct ? <DownOutlined /> : <RightOutlined />}
          onClick={() => setShowPct((v) => !v)}
        >
          {intl.formatMessage({
            id: showPct
              ? 'benchmark.detail.hidePercentiles'
              : 'benchmark.detail.showPercentiles'
          })}
        </Button>
      </div>
      <div className="panel-body" style={{ paddingTop: 16 }}>
        <MetricsResult data={shaped} />
        {showPct && (
          /* The 8-column percentile table can outgrow the page — let it scroll
             horizontally rather than stretch the layout. */
          <div style={{ overflowX: 'auto', marginTop: 18 }}>
            <PercentileResult data={shaped} />
          </div>
        )}
      </div>
    </Panel>
  );
};

export default SelectedStage;
