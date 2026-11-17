import { StatusDot } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Tooltip, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import {
  queryBenchmarkMonitoringArchive,
  retryBenchmarkMonitoringArchive
} from '../../apis';
import type {
  BenchmarkMonitoring,
  BenchmarkMonitoringData,
  BenchmarkObservationStorage
} from '../../config/monitoring-types';
import { archiveSamplingDetails } from '../../utils/archive-sampling';
import { formatCapacityBytes } from '../../utils/artifact-capacity';

export default function MonitoringArchiveStatus({
  id,
  context,
  errors,
  samplingData,
  onRefresh
}: {
  id: number;
  context: BenchmarkMonitoring | null;
  errors?: BenchmarkMonitoringData['errors'];
  samplingData?: Pick<
    BenchmarkMonitoringData,
    'runtime' | 'instances' | 'resources' | 'window'
  >;
  onRefresh: () => Promise<void>;
}) {
  const intl = useIntl();
  const busy = useRef(false);
  const [request, setRequest] = useState<{
    run: string;
    from: string;
    busy: boolean;
    state?: string;
    retryable?: boolean;
    last_error?: string | null;
    error?: unknown;
  } | null>(null);
  const [polled, setPolled] = useState<{
    base: BenchmarkObservationStorage | null | undefined;
    state: string;
    compressed_bytes?: number | null;
    captured_until?: number | null;
    retryable?: boolean;
    last_error?: string | null;
  } | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const refreshListener = useRef(onRefresh);
  refreshListener.current = onRefresh;
  const storage = context?.observation_storage;
  const storageRef = useRef(storage);
  storageRef.current = storage;
  const current =
    storage &&
    request?.run === storage.run_id &&
    (request.from === storage.archive_state ||
      request.state === storage.archive_state)
      ? request
      : null;
  const run = storage?.run_id;
  const identity = `${id}:${run || ''}`;
  const currentIdentity = useRef(identity);
  currentIdentity.current = identity;
  useEffect(() => {
    currentIdentity.current = identity;
    busy.current = false;
    return () => {
      currentIdentity.current = '';
    };
  }, [identity]);
  const currentStatus = polled?.base === storage ? polled : null;
  const state =
    currentStatus?.state || current?.state || storage?.archive_state || '';
  const pending = ['pending', 'capturing', 'finalizing'].includes(state);
  const compressedBytes = currentStatus
    ? currentStatus.compressed_bytes
    : storage?.compressed_bytes;
  const capturedUntil =
    currentStatus?.captured_until ?? storage?.captured_until;
  const retryable =
    currentStatus?.retryable ??
    current?.retryable ??
    storage?.retryable ??
    false;
  const lastError = currentStatus
    ? currentStatus.last_error
    : current?.state
      ? current.last_error
      : storage?.last_error;
  const capacityWaiting =
    state === 'failed' && lastError === 'storage_capacity_exceeded';
  const polling = !!run && (pending || capacityWaiting) && blocked !== identity;
  useEffect(() => {
    if (!polling || !run) return;
    let stopped = false;
    let inFlight = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    let previousState = state;
    let previousContent = storage?.content_version ?? null;
    const saved = storage?.source === 'archive';
    let previousError = lastError;
    const hidden = () => document.visibilityState === 'hidden';
    const schedule = () => {
      clearTimeout(timer);
      if (!stopped && !inFlight && !hidden())
        timer = setTimeout(
          () => void poll(),
          previousError === 'storage_capacity_exceeded' ? 15000 : 3000
        );
    };
    const poll = async () => {
      if (stopped || inFlight || hidden()) return;
      inFlight = true;
      let terminal = false;
      const base = storageRef.current;
      try {
        const result = await queryBenchmarkMonitoringArchive(
          id,
          { run_id: run },
          controller.signal
        );
        if (
          stopped ||
          controller.signal.aborted ||
          hidden() ||
          result.run_id !== run
        )
          return;
        const nextState = result.state;
        const nextContent = result.content_version ?? null;
        const nextError = result.last_error;
        const changed =
          nextState !== previousState ||
          (saved && nextContent !== previousContent) ||
          nextError !== previousError;
        previousState = nextState;
        previousContent = nextContent;
        previousError = nextError;
        terminal =
          !['pending', 'capturing', 'finalizing'].includes(nextState) &&
          !(
            nextState === 'failed' && nextError === 'storage_capacity_exceeded'
          );
        setPolled({
          base,
          state: nextState,
          compressed_bytes: result.compressed_bytes,
          captured_until: result.captured_until,
          retryable: result.retryable,
          last_error: nextError
        });
        if (changed) await refreshListener.current();
      } catch (error) {
        if (stopped || controller.signal.aborted) return;
        if ([401, 403, 404].includes((error as any)?.response?.status)) {
          terminal = true;
          setBlocked(identity);
          await refreshListener.current().catch(() => {});
        }
      } finally {
        inFlight = false;
        if (!terminal) schedule();
      }
    };
    document.addEventListener('visibilitychange', schedule);
    schedule();
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', schedule);
    };
  }, [id, run, polling, storage?.source]);
  if (!storage) return null;
  const readError =
    storage.source === 'archive' && Object.values(errors || {}).find(Boolean);
  const status = ((current?.error || readError) as any)?.response?.status;
  const denied = [401, 403].includes(status);
  const key = denied
    ? 'permission'
    : current?.error
      ? 'retryFailed'
      : readError
        ? 'unavailable'
        : capacityWaiting
          ? 'capacityFull'
          : state === 'ready' &&
              storage.source === 'archive' &&
              storage.capture_complete &&
              storage.data_coverage === 'partial'
            ? 'partialSamples'
            : [
                  'ready',
                  'partial',
                  'failed',
                  'expired',
                  'no_data',
                  'not_archived',
                  'pending',
                  'capturing',
                  'finalizing'
                ].includes(state)
              ? state
              : 'unavailable';
  const t = (value: string) =>
    intl.formatMessage({ id: `benchmark.monitoring.archive.${value}` });
  const sampling =
    key === 'partialSamples' && storage.source === 'archive' && context
      ? archiveSamplingDetails(context, samplingData)
      : null;
  const retry = async () => {
    if (busy.current) return;
    busy.current = true;
    setPolled(null);
    setBlocked(null);
    const run = storage.run_id;
    const from = storage.archive_state;
    setRequest({ run, from, busy: true });
    try {
      const result = await retryBenchmarkMonitoringArchive(id, run);
      if (currentIdentity.current !== identity) return;
      setRequest({
        run,
        from,
        busy: false,
        state: result.state,
        last_error: result.last_error,
        retryable: result.retryable
      });
      await refreshListener.current();
    } catch (error) {
      if (currentIdentity.current === identity)
        setRequest({ run, from, busy: false, error });
    } finally {
      if (currentIdentity.current === identity) busy.current = false;
    }
  };
  return (
    <Flex align="center" gap="small" data-benchmark-archive-status>
      <Tooltip
        trigger={['hover', 'focus']}
        title={
          <Flex vertical gap="small">
            <span>{t('help')}</span>
            {key === 'partialSamples' && (
              <>
                <span>{t('partialSamplesHelp')}</span>
                <span>{t('partialSamplesBoundary')}</span>
                {sampling?.coverage && (
                  <span>
                    {intl.formatMessage(
                      { id: 'benchmark.monitoring.archive.sampleCoverage' },
                      {
                        observed: sampling.coverage.observed,
                        expected: sampling.coverage.expected,
                        percent: sampling.coverage.percent.toFixed(1)
                      }
                    )}
                  </span>
                )}
                {!!sampling?.shortPhases && (
                  <span>
                    {intl.formatMessage(
                      { id: 'benchmark.monitoring.archive.shortPhaseCoverage' },
                      {
                        count: sampling.shortPhases,
                        total: sampling.phaseCount,
                        seconds: sampling.rateWindow!
                      }
                    )}
                  </span>
                )}
              </>
            )}
            {capacityWaiting && <span>{t('capacityHelp')}</span>}
            {!denied &&
              context?.resource_status !== 'restricted' &&
              typeof compressedBytes === 'number' &&
              Number.isSafeInteger(compressedBytes) &&
              compressedBytes > 0 && (
                <span>
                  {intl.formatMessage(
                    {
                      id: `benchmark.monitoring.archive.${
                        pending ? 'checkpointSize' : 'size'
                      }`
                    },
                    { size: formatCapacityBytes(compressedBytes) }
                  )}
                </span>
              )}
            {capturedUntil != null && (
              <span>
                {t('capturedUntil')}:{' '}
                {new Date(capturedUntil * 1000).toLocaleString()}
              </span>
            )}
            {storage.expires_at != null && (
              <span>
                {t('expiresAt')}:{' '}
                {new Date(storage.expires_at * 1000).toLocaleString()}
              </span>
            )}
          </Flex>
        }
      >
        <Typography.Text type="secondary" aria-live="polite" tabIndex={0}>
          <StatusDot
            statusValue={{
              status:
                denied ||
                current?.error ||
                readError ||
                (state === 'failed' && !capacityWaiting)
                  ? 'error'
                  : capacityWaiting || key === 'partial'
                    ? 'warning'
                    : pending || current?.busy
                      ? 'transitioning'
                      : key === 'ready' || key === 'partialSamples'
                        ? 'success'
                        : 'inactive',
              text: t(key)
            }}
          />
        </Typography.Text>
      </Tooltip>
      {!!readError && !denied && (
        <Button type="link" size="small" onClick={() => void onRefresh()}>
          {intl.formatMessage({ id: 'benchmark.monitoring.refreshMonitoring' })}
        </Button>
      )}
      {!denied && !readError && !capacityWaiting && !pending && retryable && (
        <Button
          type="link"
          size="small"
          loading={!!current?.busy}
          onClick={() => void retry()}
        >
          {t('retry')}
        </Button>
      )}
    </Flex>
  );
}
