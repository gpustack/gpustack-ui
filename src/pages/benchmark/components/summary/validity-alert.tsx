import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import React from 'react';
import { VALIDITY_MESSAGE_KEY } from '../../config';
import { useDetailContext } from '../../config/detail-context';

// Test-coverage warnings for the whole run. Computed on the backend (single
// source of truth); here we only localize the codes + params.
//
// Rendered by Summary rather than by Overview so it shows in the single-point
// view as well. `sla_never_met` in particular can ONLY occur with one measured
// point — its trigger is "the very first point already breached the SLA, stop" —
// so hanging the banner off the multi-point view hid the one conclusion that run
// had to report.
const ValidityAlert: React.FC = () => {
  const intl = useIntl();
  const { detailData } = useDetailContext();

  // Nothing while the run is still going. Coverage codes all say "we never
  // observed X" (the curve never turned over, too few points, the best point sits
  // at an edge), which is trivially true mid-climb — a run at 55% was showing
  // "raise the search range and re-run", i.e. telling the user to abandon a run
  // that was about to answer the question. The worker now withholds those codes
  // from partial syncs too; this guard also covers a backend that predates it.
  // Point-level facts are not lost: an overloaded point is already flagged red in
  // the results table while it runs.
  if (detailData?.validity?.in_progress) {
    return null;
  }

  const warnings = (detailData?.validity?.warnings || []).map((w) =>
    intl.formatMessage(
      { id: VALIDITY_MESSAGE_KEY[w.code] || w.code },
      (w.params || {}) as Record<string, string | number>
    )
  );

  if (!warnings.length) {
    return null;
  }

  return (
    <Alert
      type="warning"
      showIcon
      message={intl.formatMessage({ id: 'benchmark.detail.validity.title' })}
      description={
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      }
    />
  );
};

export default ValidityAlert;
