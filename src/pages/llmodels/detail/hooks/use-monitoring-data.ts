import { getTenantHeaders } from '@/request.extensions';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { queryModelDetail, queryModelInstancesList } from '../../apis';
import { isPDModel } from '../../config';
import type { ListItem, ModelInstanceListItem } from '../../config/types';
import type {
  DetailTab,
  ModelMetrics,
  ModelResourceMetrics,
  MonitoringCapabilities,
  MonitoringScope
} from '../config/types';
import {
  queryMonitoringCapabilities,
  queryResourceMetrics,
  queryRuntimeMetrics,
  resourceParams,
  runtimeParams
} from '../services/requests';
import { ScopedResource } from '../services/scoped-resource';
import { applyMonitoringScopePatch } from '../utils/time-range';

const defaultScope: MonitoringScope = {
  latencyMetric: 'tpot',
  window: '1h',
  instanceIds: [],
  role: 'all',
  view: 'aggregate'
};
export const tenantKey = () =>
  JSON.stringify(Object.entries(getTenantHeaders('GET')).sort());
const subscribeTenant = (listener: () => void) => {
  // Host extensions own the tenant headers; observing their value also covers
  // same-tab switches, which do not emit the browser storage event.
  const timer = setInterval(listener, 250);
  window.addEventListener('storage', listener);
  window.addEventListener('focus', listener);
  return () => {
    clearInterval(timer);
    window.removeEventListener('storage', listener);
    window.removeEventListener('focus', listener);
  };
};
export const useMonitoringTenant = () =>
  useSyncExternalStore(subscribeTenant, tenantKey, () => '');

export const useMonitoringData = (id: number, tenant: string) => {
  const [stores] = useState(() => ({
    model: new ScopedResource<ListItem>(),
    instances: new ScopedResource<ModelInstanceListItem[]>(),
    runtime: new ScopedResource<ModelMetrics>(),
    resources: new ScopedResource<ModelResourceMetrics>(),
    capabilities: new ScopedResource<MonitoringCapabilities>()
  }));
  const model = useSyncExternalStore(
    stores.model.subscribe,
    () => stores.model.snapshot
  );
  const instances = useSyncExternalStore(
    stores.instances.subscribe,
    () => stores.instances.snapshot
  );
  const runtime = useSyncExternalStore(
    stores.runtime.subscribe,
    () => stores.runtime.snapshot
  );
  const resources = useSyncExternalStore(
    stores.resources.subscribe,
    () => stores.resources.snapshot
  );
  const capabilities = useSyncExternalStore(
    stores.capabilities.subscribe,
    () => stores.capabilities.snapshot
  );
  const [scope, setScope] = useState<MonitoringScope>(defaultScope);
  const scopeRef = useRef(scope);
  const activeRef = useRef(true);
  const tabRef = useRef<DetailTab>('overview');
  const effectiveScope = (next: MonitoringScope, tab = tabRef.current) =>
    tab === 'monitoring' ||
    (tab === 'overview' && isPDModel(stores.model.snapshot.data || {}))
      ? { ...next, role: 'all' as const, instanceIds: [] }
      : next;
  const requestKey = (params: object) => JSON.stringify([tenant, id, params]);
  const isCurrent = () => activeRef.current && tenantKey() === tenant;
  const loadRuntime = (next: MonitoringScope) => {
    const requestScope = effectiveScope(next);
    return stores.runtime.load(
      requestKey(runtimeParams(requestScope)),
      (signal) => queryRuntimeMetrics(id, requestScope, signal),
      isCurrent
    );
  };
  const loadResources = (next: MonitoringScope) => {
    const requestScope = effectiveScope(next);
    return stores.resources.load(
      requestKey(resourceParams(requestScope)),
      (signal) => queryResourceMetrics(id, requestScope, signal),
      isCurrent
    );
  };
  const refreshData = async () => {
    if (!activeRef.current) return;
    await stores.model.load(
      requestKey({ kind: 'model' }),
      () => queryModelDetail(id),
      isCurrent
    );
    if (!isCurrent()) return;
    if (!stores.model.snapshot.data) {
      stores.runtime.reset();
      stores.resources.reset();
      stores.instances.reset();
      return;
    }
    void stores.instances.load(
      requestKey({ kind: 'instances' }),
      async () => (await queryModelInstancesList({ id, page: -1 })).items || [],
      isCurrent
    );
    void loadRuntime(scopeRef.current);
    void loadResources(scopeRef.current);
  };
  const refresh = () => {
    if (!activeRef.current) return;
    void refreshData();
    void stores.capabilities.load(
      requestKey({ kind: 'capabilities' }),
      (signal) => queryMonitoringCapabilities(id, signal),
      isCurrent
    );
  };
  const changeScope = (patch: Partial<MonitoringScope>) => {
    const next = applyMonitoringScopePatch(scopeRef.current, patch);
    const runtimeChanged =
      JSON.stringify(runtimeParams(effectiveScope(next))) !==
      JSON.stringify(runtimeParams(effectiveScope(scopeRef.current)));
    const hardwareChanged =
      JSON.stringify(resourceParams(effectiveScope(next))) !==
      JSON.stringify(resourceParams(effectiveScope(scopeRef.current)));
    scopeRef.current = next;
    setScope(next);
    if (stores.model.snapshot.data) {
      if (runtimeChanged) void loadRuntime(next);
      if (hardwareChanged) void loadResources(next);
    }
  };
  const changeTabScope = (tab: DetailTab) => {
    const previous = effectiveScope(scopeRef.current);
    tabRef.current = tab;
    const next = effectiveScope(scopeRef.current);
    if (!stores.model.snapshot.data) return;
    if (
      JSON.stringify(runtimeParams(previous)) !==
      JSON.stringify(runtimeParams(next))
    )
      void loadRuntime(scopeRef.current);
    if (
      JSON.stringify(resourceParams(previous)) !==
      JSON.stringify(resourceParams(next))
    )
      void loadResources(scopeRef.current);
  };
  useEffect(() => {
    activeRef.current = true;
    refresh();
    const timer = setInterval(() => {
      if (tenantKey() !== tenant) {
        Object.values(stores).forEach((store) => store.reset());
        return;
      }
      void refreshData();
    }, 60000);
    return () => {
      activeRef.current = false;
      clearInterval(timer);
      Object.values(stores).forEach((store) => store.reset());
    };
  }, []);
  return {
    id,
    model,
    instances,
    runtime,
    resources,
    capabilities,
    scope,
    changeScope,
    changeTabScope,
    refresh
  };
};
export type MonitoringData = ReturnType<typeof useMonitoringData>;
