import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import React from 'react';
import { VALIDITY_MESSAGE_KEY } from '../../config';
import { useDetailContext } from '../../config/detail-context';

// Run findings are computed on the backend; here we localize the codes + params.
//
// Rendered by Summary rather than by Overview so it shows in the single-point
// view as well. `slo_never_met` in particular can ONLY occur with one measured
// point — its trigger is "the very first point already breached the SLO, stop" —
// so hanging the banner off the multi-point view hid the one conclusion that run
// had to report.
const ValidityAlert: React.FC = () => {
  const intl = useIntl();
  const { detailData } = useDetailContext();

  // Nothing while the run is still going. Search coverage is provisional until
  // the run ends; point-level facts already appear in the results table.
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
      title={intl.formatMessage({
        id:
          detailData?.validity?.coverage_applicable === false
            ? 'benchmark.detail.summary.results'
            : 'benchmark.detail.validity.title'
      })}
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
