import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import React from 'react';
import { BenchmarkStatusValueMap } from '../../config';
import { useDetailContext } from '../../config/detail-context';

// A live "still running" hint on the detail page: the header's progress bar shows
// how far along it is, but not that results are streaming in point by point. This
// makes the in-progress state explicit and tells the user the page self-updates,
// so a sparse curve mid-run doesn't read as "finished with little data".
const RunningHint: React.FC<{ points: number }> = ({ points }) => {
  const intl = useIntl();
  const { detailData } = useDetailContext();
  const state = (detailData as { state?: string } | undefined)?.state;
  if (state !== BenchmarkStatusValueMap.Running) {
    return null;
  }
  const progress = Math.round(
    (detailData as { progress?: number } | undefined)?.progress ?? 0
  );
  // At 100% the container is done but the worker is still aggregating/uploading
  // the final results, which can take a moment — say so instead of "0 left".
  const finalizing = progress >= 100;
  return (
    <Alert
      type="info"
      showIcon
      message={intl.formatMessage(
        {
          id: finalizing
            ? 'benchmark.detail.running.finalizing'
            : 'benchmark.detail.running.hint'
        },
        { progress, points }
      )}
    />
  );
};

export default RunningHint;
