import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { exportModels } from '../../../apis';
import type { ListItem } from '../../../config/types';
import {
  tenantKey,
  useMonitoringTenant
} from '../../hooks/use-monitoring-data';
import { ScopedResource } from '../../services/scoped-resource';

export default function useDeploymentYaml(model: ListItem) {
  const tenant = useMonitoringTenant();
  const key = JSON.stringify([
    tenant,
    model.id,
    model.owner_principal_id,
    model.updated_at
  ]);
  const currentKey = useRef(key);
  currentKey.current = key;
  const active = useRef(false);
  const [store] = useState(() => new ScopedResource<string>());
  const snapshot = useSyncExternalStore(store.subscribe, () => store.snapshot);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const isCurrent = () =>
    active.current && currentKey.current === key && tenantKey() === tenant;
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      store.reset();
    };
  }, [key]);
  const load = () => {
    if (!isCurrent()) return;
    // Display the export response verbatim, including its envelope and ordering.
    void store.load(
      key,
      async (signal) => {
        const response = await exportModels({ ids: [model.id] }, { signal });
        return response.data.text();
      },
      isCurrent
    );
  };
  return {
    open: openKey === key && tenantKey() === tenant,
    state: snapshot.key === key && tenantKey() === tenant ? snapshot : null,
    show: () => {
      if (!isCurrent()) return;
      setOpenKey(key);
      load();
    },
    refresh: load,
    close: () => {
      setOpenKey(null);
      store.reset();
    }
  };
}
