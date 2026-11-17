import { useEffect, useRef, useState } from 'react';
import { queryBenchmarkPhaseObservations } from '../apis';
import type {
  BenchmarkMonitoring,
  BenchmarkMonitoringData,
  BenchmarkPhase,
  BenchmarkTimeRange
} from '../config/monitoring-types';
import {
  ArchiveContentChanged,
  archiveContentChanged,
  checkObservationStorage,
  exactRange,
  hasUnavailableRunIdentity,
  monitoringPopulationKey,
  observationQuery,
  savedObservation
} from '../utils/monitoring';

type PhaseObservation = Pick<
  BenchmarkMonitoringData,
  'runtime' | 'instances' | 'resources' | 'errors' | 'loading' | 'window'
>;
const empty = (): PhaseObservation => ({
  runtime: null,
  instances: null,
  resources: null,
  errors: {},
  loading: false,
  window: null
});
interface PendingObservation {
  phase: BenchmarkPhase;
  range: BenchmarkTimeRange;
  promise: Promise<void>;
  resolve: () => void;
  controller: AbortController;
  settled: boolean;
  successful?: boolean;
}
const BATCH_SIZE = 50;

// Tables and comparisons use exact, native phase summaries. Curves are loaded
// separately by useMonitoring only when the user changes the chart scope.
export default function usePhaseObservations(
  id: number,
  refreshToken = 0,
  onArchiveContentChanged?: () => void
) {
  const [snapshots, setSnapshots] = useState<Record<string, PhaseObservation>>(
    {}
  );
  const pending = useRef(new Map<string, PendingObservation>());
  const queued = useRef(new Map<string, PendingObservation>());
  const controllers = useRef(new Set<AbortController>());
  const generation = useRef(0);
  const population = useRef<string | null>(null);
  const context = useRef<BenchmarkMonitoring | null>(null);
  const refreshedContent = useRef<string | null>(null);
  const reset = () => {
    generation.current++;
    controllers.current.forEach((controller) => controller.abort());
    controllers.current.clear();
    pending.current.forEach((entry) => entry.resolve());
    pending.current.clear();
    queued.current.clear();
    setSnapshots({});
  };
  const updateContext = (next: BenchmarkMonitoring | null) => {
    const key = monitoringPopulationKey(next);
    if (population.current !== null && population.current !== key) reset();
    population.current = key;
    context.current = next;
    if (!next || hasUnavailableRunIdentity(next)) reset();
  };
  useEffect(() => {
    population.current = null;
    context.current = null;
    refreshedContent.current = null;
    reset();
    return () => {
      generation.current++;
      controllers.current.forEach((controller) => controller.abort());
      pending.current.forEach((entry) => entry.resolve());
    };
  }, [id]);
  useEffect(() => {
    if (savedObservation(context.current)) return;
    for (const [key, entry] of pending.current) {
      if (entry.settled) pending.current.delete(key);
    }
  }, [refreshToken]);

  const flush = async () => {
    const entries = [...queued.current.values()];
    queued.current.clear();
    const current = generation.current;
    const observedContext = context.current;
    const pin = observationQuery(observedContext);
    const checkRange = <
      T extends {
        available: boolean;
        start: number | null;
        end: number | null;
      }
    >(
      response: T,
      entry: PendingObservation
    ): T => {
      if (
        response.available &&
        (response.start !== entry.range.start ||
          response.end !== entry.range.end)
      )
        throw new Error(
          'The backend did not honor the measured phase interval'
        );
      return response;
    };
    const store = (entry: PendingObservation, next: PhaseObservation) => {
      if (!entry.controller.signal.aborted && generation.current === current)
        setSnapshots((previous) => ({ ...previous, [entry.phase.id]: next }));
      entry.settled = true;
      entry.successful =
        !!(next.runtime || next.resources) &&
        !Object.keys(next.errors).length &&
        [next.runtime, next.resources].every(
          (response) =>
            !Object.values(response?.metrics || {}).some(
              (metric) => metric.status === 'query_error'
            )
        );
      controllers.current.delete(entry.controller);
      entry.resolve();
    };
    for (let offset = 0; offset < entries.length; offset += BATCH_SIZE) {
      if (generation.current !== current) return;
      const batch = entries
        .slice(offset, offset + BATCH_SIZE)
        .filter((entry) => !entry.controller.signal.aborted);
      if (!batch.length) continue;
      const controller = new AbortController();
      controllers.current.add(controller);
      try {
        const response = await queryBenchmarkPhaseObservations(
          id,
          {
            phase_ids: batch.map((entry) => entry.phase.id).join(','),
            ...pin
          },
          controller.signal
        );
        if (pin.run_id && response.run_id !== pin.run_id)
          throw new Error('The phase summaries do not match the selected run');
        const version = response.content_version ?? null;
        if (pin.run_id && (pin.content_version ?? null) !== version)
          throw new ArchiveContentChanged();
        for (const entry of batch) {
          const next = { ...empty(), window: entry.range };
          try {
            const item = response.phases[entry.phase.id];
            if (!item)
              throw new Error('The requested phase summary was not returned');
            next.runtime = next.instances = checkRange(item.runtime, entry);
            next.resources = item.resources
              ? checkRange(item.resources, entry)
              : null;
            checkObservationStorage(item.runtime, observedContext);
            if (item.resources)
              checkObservationStorage(item.resources, observedContext);
          } catch (error) {
            next.runtime = next.instances = next.resources = null;
            next.errors = {
              runtime: error,
              instances: error,
              resources: error
            };
          }
          store(entry, next);
        }
      } catch (error) {
        if (controller.signal.aborted || generation.current !== current) return;
        for (const entry of batch)
          store(entry, {
            ...empty(),
            window: entry.range,
            errors: { runtime: error, instances: error, resources: error }
          });
        const identity = JSON.stringify([pin.run_id, pin.content_version]);
        if (
          pin.run_id &&
          refreshedContent.current !== identity &&
          archiveContentChanged(error)
        ) {
          refreshedContent.current = identity;
          onArchiveContentChanged?.();
        }
      } finally {
        controllers.current.delete(controller);
      }
    }
  };
  const load = (phase?: BenchmarkPhase): Promise<void> => {
    const range = exactRange(phase);
    if (!phase || !range || hasUnavailableRunIdentity(context.current))
      return Promise.resolve();
    const existing = pending.current.get(phase.id);
    if (
      existing?.range.start === range.start &&
      existing.range.end === range.end &&
      (!existing.settled || existing.successful)
    )
      return existing.promise;
    existing?.controller.abort();
    existing?.resolve();
    const controller = new AbortController();
    controllers.current.add(controller);
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
      resolve = done;
    });
    const entry = {
      phase,
      range,
      promise,
      resolve,
      controller,
      settled: false
    };
    pending.current.set(phase.id, entry);
    setSnapshots((previous) => ({
      ...previous,
      [phase.id]: {
        ...(previous[phase.id]?.window?.start === range.start &&
        previous[phase.id].window?.end === range.end
          ? previous[phase.id]
          : empty()),
        window: range,
        loading: true
      }
    }));
    const scheduled = queued.current.size > 0;
    queued.current.set(phase.id, entry);
    if (!scheduled) void Promise.resolve().then(flush);
    return promise;
  };
  const get = (
    phase: BenchmarkPhase | undefined,
    data: BenchmarkMonitoringData
  ): BenchmarkMonitoringData => ({
    ...data,
    ...empty(),
    ...(!hasUnavailableRunIdentity(data.context) &&
    (population.current === null ||
      population.current === monitoringPopulationKey(data.context)) &&
    phase &&
    snapshots[phase.id]?.window?.start === phase.start &&
    snapshots[phase.id]?.window?.end === phase.end
      ? snapshots[phase.id]
      : {}),
    context: data.context
  });
  const loadAll = async (phases: BenchmarkPhase[]) => {
    await Promise.all(phases.map(load));
  };
  return { load, get, loadAll, reset, updateContext };
}
