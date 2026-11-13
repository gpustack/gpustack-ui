import { getTenantHeaders } from '@/request.extensions';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { queryModelDetail, queryModelInstancesList } from '../../apis';
import type { ListItem, ModelInstanceListItem } from '../../config/types';
import type {
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
  const requestKey = (params: object) => JSON.stringify([tenant, id, params]);
  const isCurrent = () => activeRef.current && tenantKey() === tenant;
  const loadRuntime = (next: MonitoringScope) =>
    stores.runtime.load(
      requestKey(runtimeParams(next)),
      (signal) => queryRuntimeMetrics(id, next, signal),
      isCurrent
    );
  const loadResources = (next: MonitoringScope) =>
    stores.resources.load(
      requestKey(resourceParams(next)),
      (signal) => queryResourceMetrics(id, next, signal),
      isCurrent
    );
  const refreshData = () => {
    if (!activeRef.current) return;
    void stores.model.load(
      requestKey({ kind: 'model' }),
      () => queryModelDetail(id),
      isCurrent
    );
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
    refreshData();
    void stores.capabilities.load(
      requestKey({ kind: 'capabilities' }),
      (signal) => queryMonitoringCapabilities(id, signal),
      isCurrent
    );
  };
  const changeScope = (patch: Partial<MonitoringScope>) => {
    const next = applyMonitoringScopePatch(scopeRef.current, patch);
    const runtimeChanged =
      JSON.stringify(runtimeParams(next)) !==
      JSON.stringify(runtimeParams(scopeRef.current));
    const hardwareChanged =
      JSON.stringify(resourceParams(next)) !==
      JSON.stringify(resourceParams(scopeRef.current));
    scopeRef.current = next;
    setScope(next);
    if (runtimeChanged) void loadRuntime(next);
    if (hardwareChanged) void loadResources(next);
  };
  useEffect(() => {
    activeRef.current = true;
    refresh();
    const timer = setInterval(() => {
      if (tenantKey() !== tenant) {
        Object.values(stores).forEach((store) => store.reset());
        return;
      }
      refreshData();
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
    refresh
  };
};
export type MonitoringData = ReturnType<typeof useMonitoringData>;
