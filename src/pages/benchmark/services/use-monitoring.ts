import { useEffect, useRef, useState } from 'react';
import {
  queryBenchmarkMetrics,
  queryBenchmarkMonitoring,
  queryBenchmarkResourceMetrics
} from '../apis';
import type {
  BenchmarkMonitoring,
  BenchmarkMonitoringData,
  BenchmarkMonitoringQuery,
  BenchmarkObservationMetadata
} from '../config/monitoring-types';
import {
  archiveCapturePending,
  archiveContentChanged,
  checkObservationStorage,
  exactRange,
  hasUnavailableRunIdentity,
  monitoringPopulationKey,
  observationQuery,
  savedObservation
} from '../utils/monitoring';
import {
  combineBenchmarkComparison,
  monitoringComparison,
  type ComparisonPhaseIds
} from '../utils/monitoring-comparison';

type MonitoringLoadQuery = BenchmarkMonitoringQuery & {
  comparisonPhaseIds?: ComparisonPhaseIds;
};
type MonitoringView = 'runtime' | 'instances' | 'resources';

const empty = (): BenchmarkMonitoringData => ({
  context: null,
  runtime: null,
  instances: null,
  resources: null,
  loading: false,
  window: null,
  errors: {}
});

export default function useMonitoring(
  id: number,
  refreshToken = 0,
  onContext?: (context: BenchmarkMonitoring | null) => void,
  resolveQuery?: (
    context: BenchmarkMonitoring,
    query: MonitoringLoadQuery
  ) => MonitoringLoadQuery,
  options: {
    deferInactive?: boolean;
    runId?: string | null;
    reportRunId?: string | null;
  } = {}
) {
  const runChanged =
    !!options.runId &&
    !!options.reportRunId &&
    options.runId !== options.reportRunId;
  const changedRun = () => ({
    ...empty(),
    errors: { context: { code: 'benchmark_run_changed' } }
  });
  const contextListener = useRef(onContext);
  contextListener.current = onContext;
  const queryResolver = useRef(resolveQuery);
  queryResolver.current = resolveQuery;
  const [data, setData] = useState<BenchmarkMonitoringData>(empty);
  const snapshot = useRef<BenchmarkMonitoringData>(data);
  const publish = (
    next:
      | BenchmarkMonitoringData
      | ((previous: BenchmarkMonitoringData) => BenchmarkMonitoringData)
  ) => {
    snapshot.current =
      typeof next === 'function' ? next(snapshot.current) : next;
    setData(snapshot.current);
  };
  const active = useRef<AbortController | null>(null);
  const latest = useRef(0);
  const lifecycle = useRef(0);
  const query = useRef<MonitoringLoadQuery>({ view: 'aggregate' });
  const observation = useRef<BenchmarkObservationMetadata | null>(null);
  const hardwareRequested = useRef(false);
  type Views = Pick<
    BenchmarkMonitoringData,
    'runtime' | 'instances' | 'resources'
  >;
  const cached = useRef(new Map<string, Views>());
  const cacheIdentity = useRef<string | null>(null);
  const loadedKey = useRef<string | null>(null);
  const fresh = useRef<Promise<void> | null>(null);
  const cacheable = (response: Views[keyof Views]) =>
    !!response &&
    !['query_failed', 'prometheus_unavailable'].includes(
      response.reason || ''
    ) &&
    !Object.values(response.metrics || {}).some(
      (metric) => metric.status === 'query_error'
    );
  const remember = (key: string | null, data: Views) => {
    if (!key) return;
    const views: Views = { runtime: null, instances: null, resources: null };
    for (const kind of ['runtime', 'instances', 'resources'] as const)
      if (cacheable(data[kind])) (views as any)[kind] = data[kind];
    cached.current.delete(key);
    cached.current.set(key, views);
    while (cached.current.size > 8)
      cached.current.delete(cached.current.keys().next().value!);
  };
  const auxiliary = useRef(
    new Map<string, { controller: AbortController; promise: Promise<void> }>()
  );

  const settled = useRef<{
    id: number;
    key: string;
    population: string;
  } | null>(null);
  const flight = useRef<{
    id: number;
    key: string;
    promise: Promise<void>;
    trailing: boolean;
  } | null>(null);
  const scopeKey = (params: MonitoringLoadQuery) =>
    JSON.stringify(
      Object.entries(params)
        .filter(([key, value]) => key !== 'view' && value != null)
        .sort(([a], [b]) => a.localeCompare(b))
    );
  const queryView = async (
    key: MonitoringView,
    scope: MonitoringLoadQuery,
    context: BenchmarkMonitoring,
    signal: AbortSignal,
    comparison = monitoringComparison(context, scope.comparisonPhaseIds)
  ) => {
    const { comparisonPhaseIds: _comparisonPhaseIds, ...params } = scope;
    const request = (range?: BenchmarkMonitoringQuery) => {
      const options = { ...params, ...range, ...observationQuery(context) };
      return (
        key === 'resources'
          ? queryBenchmarkResourceMetrics(id, options, signal)
          : queryBenchmarkMetrics(
              id,
              {
                ...options,
                view: key === 'instances' ? 'instances' : 'aggregate'
              },
              signal
            )
      ).then((response) => checkObservationStorage(response, context));
    };
    if (!comparison) return request();
    if (comparison.ranges.length === 1) return request(comparison.ranges[0]);
    const responses = await Promise.all(comparison.ranges.map(request));
    return combineBenchmarkComparison(
      responses,
      comparison.window,
      comparison.ranges
    );
  };
  const load = (
    next = query.current,
    retryOnContentChange = true
  ): Promise<void> => {
    if (runChanged) {
      cached.current.clear();
      settled.current = null;
      contextListener.current?.(null);
      publish(changedRun());
      return Promise.resolve();
    }
    query.current = next;
    const key = scopeKey(next);
    if (flight.current?.id === id && flight.current.key === key) {
      flight.current.trailing = true;
      return flight.current.promise;
    }
    let retain = settled.current?.id === id && settled.current.key === key;
    active.current?.abort();
    auxiliary.current.forEach((entry) => entry.controller.abort());
    auxiliary.current.clear();
    const controller = new AbortController();
    active.current = controller;
    const generation = ++latest.current;
    // A watch tick refreshes an existing observation, not its scope. Keep that
    // coherent window visible until replacement data arrives; explicit scope
    // changes clear it immediately.
    publish((previous) =>
      retain ? { ...previous, loading: true } : { ...empty(), loading: true }
    );
    const promise = (async () => {
      let context;
      try {
        const runId =
          options.runId || observation.current?.observation_storage?.run_id;
        context = await queryBenchmarkMonitoring(id, controller.signal, {
          ...(runId ? { run_id: runId } : {})
        });
        if (runId && context.observation_storage?.run_id !== runId)
          throw new Error(
            'The monitoring response does not match the current Benchmark execution'
          );
      } catch (error) {
        if (!controller.signal.aborted && generation === latest.current) {
          if (retryOnContentChange && archiveContentChanged(error)) {
            flight.current = null;
            await load(query.current, false);
            return;
          }
          const status = (error as any)?.response?.status;
          const preserve = retain && ![401, 403, 404].includes(status);
          if ([401, 403, 404].includes(status)) {
            cached.current.clear();
            loadedKey.current = null;
            contextListener.current?.(null);
          }
          if (!preserve) settled.current = null;
          publish((previous) => ({
            ...(preserve ? previous : empty()),
            loading: false,
            errors: { context: error }
          }));
        }
        return;
      }
      if (controller.signal.aborted || generation !== latest.current) return;
      const population = monitoringPopulationKey(context);
      const identity =
        savedObservation(context) &&
        context.observation_storage?.content_version
          ? JSON.stringify([
              id,
              context.observation_storage?.run_id,
              context.observation_storage?.content_version,
              population
            ])
          : null;
      if (cacheIdentity.current !== identity) cached.current.clear();
      cacheIdentity.current = identity;
      if (retain && population !== settled.current?.population) retain = false;
      observation.current = context;
      contextListener.current?.(context);
      if (hasUnavailableRunIdentity(context)) {
        settled.current = { id, key, population };
        publish({ ...empty(), context, window: context.run_window });
        return;
      }
      // Resolve a restored inspection only after the server identifies this run,
      // before issuing any metric requests for its phase or window.
      next = queryResolver.current?.(context, next) || next;
      const resolvedKey = scopeKey(next);
      if (retain && resolvedKey !== key) retain = false;
      const run = context.run_window;
      const maximum = context.capabilities.max_query_seconds;
      const comparison = monitoringComparison(context, next.comparisonPhaseIds);
      if (next.comparisonPhaseIds && !comparison) {
        // A saved run supplies both stages through its normal replay scope.
        next = { view: next.view, role: next.role };
      }
      const bounded =
        !comparison &&
        !(
          context.observation_storage?.source === 'archive' &&
          context.query_capabilities?.run_replay
        ) &&
        run &&
        maximum > 0 &&
        run.end - run.start > maximum
          ? {
              ...next,
              start: next.start ?? run.start,
              end:
                next.end ??
                Math.min(run.end, (next.start ?? run.start) + maximum)
            }
          : next;
      query.current = bounded;
      if (flight.current?.id === id) flight.current.key = scopeKey(bounded);
      const window =
        comparison?.window ??
        (typeof bounded.start === 'number' && typeof bounded.end === 'number'
          ? { start: bounded.start, end: bounded.end }
          : bounded.phase_id
            ? exactRange(
                context.stages.find((phase) => phase.id === bounded.phase_id)
              )
            : run);
      if (!window && archiveCapturePending(context)) {
        settled.current = { id, key: scopeKey(bounded), population };
        publish({ ...empty(), context, window: null });
        return;
      }
      const cacheKey = identity
        ? JSON.stringify([identity, scopeKey(bounded)])
        : null;
      loadedKey.current = cacheKey;
      const views = cacheKey ? cached.current.get(cacheKey) : undefined;
      if (!retain)
        publish({ ...empty(), ...views, context, window, loading: true });
      const keys: MonitoringView[] = options.deferInactive
        ? [
            bounded.view === 'instances' ? 'instances' : 'runtime',
            ...(hardwareRequested.current ? ['resources' as const] : [])
          ]
        : ['runtime', 'instances', 'resources'];
      const results = await Promise.allSettled(
        keys
          .filter((key) => !views?.[key])
          .map((key) =>
            queryView(key, bounded, context, controller.signal, comparison)
          )
      );
      if (controller.signal.aborted || generation !== latest.current) return;
      if (
        retryOnContentChange &&
        results.some(
          (result) =>
            result.status === 'rejected' && archiveContentChanged(result.reason)
        )
      ) {
        flight.current = null;
        await load(query.current, false);
        return;
      }
      const nextData = { ...empty(), ...views, context, window };
      const requested = keys.filter((key) => !views?.[key]);
      results.forEach((result, index) => {
        const key = requested[index];
        if (result.status === 'fulfilled')
          (nextData as any)[key] = result.value;
        else nextData.errors[key] = result.reason;
      });
      settled.current = { id, key: scopeKey(bounded), population };
      remember(cacheKey, nextData);
      publish(nextData);
    })().finally(() => {
      if (generation === latest.current) {
        const trailing = flight.current?.trailing;
        flight.current = null;
        if (trailing && !savedObservation(observation.current))
          void load(query.current);
      }
    });
    flight.current = { id, key, promise, trailing: false };
    return promise;
  };

  useEffect(() => {
    lifecycle.current++;
    fresh.current = null;
    settled.current = null;
    observation.current = null;
    hardwareRequested.current = false;
    cached.current.clear();
    cacheIdentity.current = null;
    loadedKey.current = null;
    query.current = { view: 'aggregate' };
    if (id) void load(query.current);
    return () => {
      lifecycle.current++;
      active.current?.abort();
      auxiliary.current.forEach((entry) => entry.controller.abort());
      auxiliary.current.clear();
      flight.current = null;
      latest.current++;
    };
  }, [id, options.runId, options.reportRunId]);
  useEffect(() => {
    if (id && refreshToken && !savedObservation(observation.current))
      void load();
  }, [refreshToken]);
  const refresh = () => {
    if (fresh.current) return fresh.current;
    const generation = lifecycle.current;
    const promise = (async () => {
      if (flight.current) await flight.current.promise;
      if (generation !== lifecycle.current) return;
      await load();
    })().finally(() => {
      if (fresh.current === promise) fresh.current = null;
    });
    fresh.current = promise;
    return promise;
  };
  const ensure = async (key: MonitoringView): Promise<void> => {
    const lifetime = lifecycle.current;
    if (flight.current) await flight.current.promise;
    if (lifetime !== lifecycle.current) return;
    const current = snapshot.current;
    if (
      !current.context ||
      runChanged ||
      hasUnavailableRunIdentity(current.context) ||
      cacheable(current[key])
    )
      return;
    if (!current.window && archiveCapturePending(current.context)) return;
    const pending = auxiliary.current.get(key);
    if (pending) return pending.promise;
    const controller = new AbortController();
    const generation = latest.current;
    const context = current.context;
    publish((previous) => ({ ...previous, loading: true }));
    const promise = (async () => {
      try {
        const response = await queryView(
          key,
          query.current,
          context,
          controller.signal
        );
        if (controller.signal.aborted || generation !== latest.current) return;
        publish((previous) => ({
          ...previous,
          [key]: response,
          errors: { ...previous.errors, [key]: undefined }
        }));
        remember(loadedKey.current, snapshot.current);
      } catch (error) {
        if (!controller.signal.aborted && generation === latest.current) {
          if (archiveContentChanged(error)) {
            await refresh();
            return;
          }
          publish((previous) => ({
            ...previous,
            errors: { ...previous.errors, [key]: error }
          }));
        }
      } finally {
        if (auxiliary.current.get(key)?.controller === controller)
          auxiliary.current.delete(key);
        if (!controller.signal.aborted && generation === latest.current)
          publish((previous) => ({
            ...previous,
            loading: auxiliary.current.size > 0
          }));
      }
    })();
    auxiliary.current.set(key, { controller, promise });
    return promise;
  };
  const ensureView = (view: 'aggregate' | 'instances') => {
    query.current = { ...query.current, view };
    return ensure(view === 'instances' ? 'instances' : 'runtime');
  };
  const ensureResources = () => {
    hardwareRequested.current = true;
    return ensure('resources');
  };
  return {
    ...(runChanged ? changedRun() : data),
    load,
    refresh,
    ensureView,
    ensureResources
  };
}
