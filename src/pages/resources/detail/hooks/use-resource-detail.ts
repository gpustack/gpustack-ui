import type { MonitoringCapabilities } from '@/pages/llmodels/detail/config/types';
import { tenantKey } from '@/pages/llmodels/detail/hooks/use-monitoring-data';
import { ScopedResource } from '@/pages/llmodels/detail/services/scoped-resource';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type {
  ResourceDetail,
  ResourceMetrics,
  ResourceTarget,
  TimeScope
} from '../config/types';
import {
  queryHardwareMetrics,
  queryResourceCapabilities,
  queryResourceDetail
} from '../services/requests';

export const resourceIdentity = (data: ResourceDetail) =>
  JSON.stringify([
    data.worker.id,
    data.worker.owner_principal_id,
    data.worker.cluster_id,
    data.selected_device_id,
    data.devices.map((d) => d.id).sort()
  ]);
export const isAuthorizationError = (error: any) =>
  [401, 403, 404].includes(error?.response?.status);

export const useResourceDetail = (
  target: ResourceTarget,
  tenant: string,
  initialScope: TimeScope
) => {
  const [stores] = useState(() => ({
    detail: new ScopedResource<ResourceDetail>(),
    metrics: new ScopedResource<ResourceMetrics>(),
    capabilities: new ScopedResource<MonitoringCapabilities>()
  }));
  const detail = useSyncExternalStore(
    stores.detail.subscribe,
    () => stores.detail.snapshot
  );
  const metrics = useSyncExternalStore(
    stores.metrics.subscribe,
    () => stores.metrics.snapshot
  );
  const capabilities = useSyncExternalStore(
    stores.capabilities.subscribe,
    () => stores.capabilities.snapshot
  );
  const [scope, setScope] = useState(initialScope);
  const scopeRef = useRef(scope),
    active = useRef(true),
    generation = useRef(0);
  const current = () => active.current && tenantKey() === tenant;
  const key = (part: unknown) => JSON.stringify([tenant, target, part]);
  const loadMetrics = (next: TimeScope, data: ResourceDetail) =>
    stores.metrics.load(
      key([resourceIdentity(data), next]),
      async (signal) => {
        const result = await queryHardwareMetrics(target, next, signal);
        if (
          result.worker_id !== data.worker.id ||
          result.selected_device_id !== data.selected_device_id ||
          result.devices.some(
            (device) => !data.devices.some((known) => known.id === device.id)
          )
        ) {
          throw new Error('Resource identity changed during collection');
        }
        return result;
      },
      () =>
        current() &&
        !!stores.detail.snapshot.data &&
        resourceIdentity(stores.detail.snapshot.data) === resourceIdentity(data)
    );
  const refresh = async () => {
    const run = ++generation.current;
    const before = stores.detail.snapshot.data;
    await stores.detail.load(
      key('detail'),
      (signal) => queryResourceDetail(target, signal),
      current
    );
    if (!current() || run !== generation.current) return;
    const data = stores.detail.snapshot.data;
    if (!data) {
      stores.metrics.reset();
      stores.capabilities.reset();
      return;
    }
    if (before && resourceIdentity(before) !== resourceIdentity(data))
      stores.metrics.reset();
    void loadMetrics(scopeRef.current, data);
    void stores.capabilities.load(
      key(resourceIdentity(data)),
      (signal) => queryResourceCapabilities(target, signal),
      current
    );
  };
  const changeScope = (patch: Partial<TimeScope>) => {
    const next = { ...scopeRef.current, ...patch };
    if ('window' in patch) {
      next.start = undefined;
      next.end = undefined;
    }
    scopeRef.current = next;
    setScope(next);
    const data = stores.detail.snapshot.data;
    if (data) void loadMetrics(next, data);
  };
  useEffect(() => {
    active.current = true;
    void refresh();
    const timer = setInterval(() => {
      if (current()) void refresh();
      else Object.values(stores).forEach((store) => store.reset());
    }, 60000);
    return () => {
      active.current = false;
      generation.current++;
      clearInterval(timer);
      Object.values(stores).forEach((store) => store.reset());
    };
  }, []);
  const identity = detail.data ? resourceIdentity(detail.data) : null;
  const scopedMetrics =
    identity && metrics.key === key([identity, scope])
      ? metrics
      : {
          ...metrics,
          data: null,
          error: null,
          stale: false,
          loading: !!detail.data
        };
  const scopedCapabilities =
    identity && capabilities.key === key(identity)
      ? capabilities
      : { ...capabilities, data: null, error: null, stale: false };
  return {
    detail,
    metrics: scopedMetrics,
    capabilities: scopedCapabilities,
    scope,
    changeScope,
    refresh,
    target
  };
};
export type ResourceDetailData = ReturnType<typeof useResourceDetail>;
