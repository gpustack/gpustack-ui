import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ListItem } from '../../config/types';
import {
  deploymentCacheBindings,
  queryDeploymentMetadata,
  type DeploymentMetadata
} from '../services/deployment-metadata';
import { ScopedResource } from '../services/scoped-resource';
import { tenantKey, useMonitoringTenant } from './use-monitoring-data';

// Page-local lookups never share cache data across tenants or deployments.
export default function useDeploymentMetadata(model: ListItem | null) {
  const tenant = useMonitoringTenant();
  const [store] = useState(() => new ScopedResource<DeploymentMetadata>());
  const snapshot = useSyncExternalStore(store.subscribe, () => store.snapshot);
  const key = JSON.stringify([
    tenant,
    model?.id,
    model?.cluster_id,
    model?.owner_principal_id,
    model ? deploymentCacheBindings(model) : []
  ]);
  const currentKey = useRef(key);
  currentKey.current = key;
  const currentModel = useRef(model);
  currentModel.current = model;
  useEffect(() => {
    let active = true;
    const isCurrent = () =>
      active && currentKey.current === key && tenantKey() === tenant;
    const load = () => {
      if (!currentModel.current || !isCurrent()) return;
      void store.load(
        key,
        (signal) => queryDeploymentMetadata(currentModel.current!, signal),
        isCurrent
      );
    };
    load();
    const timer = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(timer);
      store.reset();
    };
  }, [key, store, tenant]);
  return snapshot.key === key && tenantKey() === tenant
    ? snapshot
    : { key, data: null, loading: !!model, stale: false, error: null };
}
