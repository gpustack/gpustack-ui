import { StatusTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import React from 'react';
import {
  BenchmarkStatus,
  BenchmarkStatusLabelMap,
  BenchmarkStatusValueMap
} from '../config';

// The run's state as a StatusTag — shared by the list's Status column and the
// detail page header so both read identically.
//
// Only a RUNNING run gets the progress bar. A stopped run is terminal — it can't
// be resumed — so a frozen bar (which reads as "still going / can continue") is
// misleading. Render it as a plain "Stopped" pill like Completed/Error, and move
// how-far-it-got into the hover tooltip so the label stays clean.
const BenchmarkStateTag: React.FC<{
  data?: {
    state?: string;
    progress?: number;
    state_message?: string;
  } | null;
}> = ({ data }) => {
  const intl = useIntl();
  if (!data?.state) {
    return null;
  }
  const isRunning = data.state === BenchmarkStatusValueMap.Running;
  const isStopped = data.state === BenchmarkStatusValueMap.Stopped;
  const runningDone = isRunning && data.progress === 100;

  let message = runningDone ? '' : data.state_message;
  if (isStopped && data.progress) {
    const reached = intl.formatMessage(
      { id: 'benchmark.state.stoppedAt' },
      { percent: Math.round(data.progress) }
    );
    message = data.state_message
      ? `${reached} · ${data.state_message}`
      : reached;
  }

  return (
    <StatusTag
      download={isRunning ? { percent: data.progress || 0 } : undefined}
      statusValue={{
        status: runningDone
          ? BenchmarkStatus[BenchmarkStatusValueMap.Completed]
          : BenchmarkStatus[data.state],
        text: BenchmarkStatusLabelMap[data.state],
        message
      }}
    />
  );
};

export default BenchmarkStateTag;
