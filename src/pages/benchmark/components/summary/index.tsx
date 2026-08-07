import { Divider } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useMemo, useState } from 'react';
import { queryBenchmarkResults } from '../../apis';
import { loadAxisLabelId } from '../../config';
import { useDetailContext } from '../../config/detail-context';
import { BenchmarkResultItem } from '../../config/types';
import BestPoints from './best-points';
import ConfigSummary from './config-summary';
import { buildProbePoints, buildStagePoints } from './metrics';
import MetricsResult from './metrics-result';
import Overview from './overview';
import PercentileResult from './percentile-result';
import RunningHint from './running-hint';
import SelectedStage from './selected-stage';
import ValidityAlert from './validity-alert';

const useStyles = createStyles(({ css }) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
  `
}));

const Summary: React.FC = () => {
  const { styles } = useStyles();
  const { id, detailData, refreshToken } = useDetailContext();
  const [results, setResults] = useState<BenchmarkResultItem[]>([]);
  const [selected, setSelected] = useState<BenchmarkResultItem | null>(null);

  // Re-pull whenever the watch stream signals a row change (refreshToken): while
  // the run is in progress the per-point grid grows point by point, so the curve
  // and best-point cards fill in live instead of only at completion.
  //
  // Guarded because the trigger is a stream, not a click: a burst of signals puts
  // several fetches in flight at once, and an earlier one resolving last would
  // roll the grid back to fewer points than are already on screen.
  useEffect(() => {
    if (!id) {
      return;
    }
    let cancelled = false;
    queryBenchmarkResults(id)
      .then((data) => {
        if (!cancelled) {
          setResults(data || []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, refreshToken]);

  // Every rendered number comes from these normalized points — one derivation,
  // so the hero band, the curves, the table and the stage detail cannot disagree.
  const points = useMemo(
    () =>
      buildStagePoints(results, {
        recommendedRate: detailData?.recommended_rate,
        peakRate: detailData?.peak_rate,
        isConcurrency:
          loadAxisLabelId(detailData) === 'benchmark.form.concurrency',
        // The record carries the nine sla_* thresholds as flat fields.
        slaTargets: detailData as unknown as Record<string, unknown> | undefined
      }),
    [results, detailData]
  );
  // The auto-tune saturation probe has no load value: kept in the table as a
  // measurement, excluded from every chart (a point with no x coordinate).
  // The saturation probe (rate == null) as a StagePoint: kept out of the charts
  // (no load value) but shown in the table + totals + stage detail like any stage.
  const probes = useMemo(
    () => buildProbePoints(results.filter((r) => r.rate == null)),
    [results]
  );

  const isMulti = points.length > 1;
  const measuredPoints = points.length;

  // Default selection = recommended → peak → first.
  useEffect(() => {
    if (!isMulti) {
      setSelected(null);
      return;
    }
    const best = points.find((p) => p.isBest);
    const peak = points.reduce(
      (b, p) => (!b || (p.tps ?? 0) > (b.tps ?? 0) ? p : b),
      points[0]
    );
    setSelected((best || peak).raw);
  }, [points, isMulti]);

  const resultsView = useMemo(() => {
    if (isMulti) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Overview
            points={points}
            probes={probes}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            bestPoints={
              <BestPoints
                points={points}
                onSelect={(p) => setSelected(p.raw)}
              />
            }
          />
          <SelectedStage
            point={
              [...points, ...probes].find((p) => p.id === selected?.id) ?? null
            }
          />
        </div>
      );
    }
    // Single point (or legacy data): the existing single-result view.
    return (
      <>
        <MetricsResult />
        <Divider />
        <PercentileResult />
      </>
    );
  }, [isMulti, points, probes, selected]);

  return (
    <div className={styles.container}>
      <RunningHint points={measuredPoints} />
      <ConfigSummary />
      {/* Coverage warnings apply to the run as a whole, so they sit above both
          the multi-point overview and the single-point view. */}
      <ValidityAlert />
      {resultsView}
    </div>
  );
};

export default Summary;
