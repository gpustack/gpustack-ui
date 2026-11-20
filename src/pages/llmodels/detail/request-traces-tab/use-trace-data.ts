import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { tenantKey } from '../hooks/use-monitoring-data';
import { ScopedResource } from '../services/scoped-resource';
import { traceRecordKey } from './presentation';
import {
  getTraceCapabilities,
  getTraceDetail,
  getTraceRecords,
  type TraceCapabilities,
  type TraceDetail,
  type TraceFilters,
  type TracePage,
  type TraceRecord
} from './requests';

export const defaultTraceWindow = '24h';
export const defaultFilters: TraceFilters = {
  range: { window: defaultTraceWindow }
};

function useSnapshot<T>(store: ScopedResource<T>) {
  return useSyncExternalStore(store.subscribe, () => store.snapshot);
}

export function useTraceData(modelId: number, tenant: string) {
  const [stores] = useState(() => ({
    capabilities: new ScopedResource<TraceCapabilities>(),
    rows: new ScopedResource<TracePage>(),
    detail: new ScopedResource<TraceDetail>()
  }));
  const capabilities = useSnapshot(stores.capabilities);
  const rows = useSnapshot(stores.rows);
  const detail = useSnapshot(stores.detail);
  const isCurrent = useCallback(() => tenantKey() === tenant, [tenant]);
  const loadRows = useCallback(
    (filters: TraceFilters, cursor?: string) =>
      stores.rows.load(
        JSON.stringify([filters, cursor]),
        (signal) => getTraceRecords(modelId, filters, signal, cursor),
        isCurrent
      ),
    [modelId, stores.rows, isCurrent]
  );
  const refresh = useCallback(
    async (filters: TraceFilters) => {
      await stores.capabilities.load(
        `${tenant}:${modelId}`,
        (signal) => getTraceCapabilities(modelId, signal),
        isCurrent
      );
      const state = stores.capabilities.snapshot;
      if (
        !state.error &&
        state.data?.tracing_enabled &&
        state.data.trace_query_configured
      ) {
        await loadRows(filters);
      } else {
        stores.rows.reset();
        stores.detail.reset();
      }
    },
    [modelId, tenant, stores, isCurrent, loadRows]
  );
  useEffect(() => {
    void refresh(defaultFilters);
    return () => Object.values(stores).forEach((store) => store.reset());
  }, [refresh, stores]);

  const loadDetail = (row: TraceRecord) =>
    stores.detail.load(
      traceRecordKey(row),
      (signal) => getTraceDetail(modelId, row, signal),
      isCurrent
    );

  return {
    capabilities,
    rows,
    detail,
    refresh,
    loadRows,
    loadDetail,
    closeDetail: stores.detail.reset
  };
}
