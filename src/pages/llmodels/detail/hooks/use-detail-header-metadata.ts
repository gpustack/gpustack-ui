import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ListItem } from '../../config/types';
import {
  queryHeaderMetadata,
  type HeaderMetadata
} from '../services/header-metadata';
import { ScopedResource } from '../services/scoped-resource';
import { tenantKey } from './use-monitoring-data';

// The header is keyed by tenant, model, cluster and owner. Both the initial
// lookup and a user action recheck that boundary before publishing a result.
const useDetailHeaderMetadata = (model: ListItem, tenant: string) => {
  const [store] = useState(() => new ScopedResource<HeaderMetadata>());
  const active = useRef(true);
  const metadata = useSyncExternalStore(store.subscribe, () => store.snapshot);
  const isCurrent = () => active.current && tenantKey() === tenant;
  const key = JSON.stringify([
    tenant,
    model.id,
    model.cluster_id,
    model.owner_principal_id
  ]);
  const reload = async () => {
    if (!isCurrent()) return null;
    await store.load(
      key,
      (signal) => queryHeaderMetadata(model, signal),
      isCurrent
    );
    return isCurrent() && !store.snapshot.loading && !store.snapshot.error
      ? store.snapshot.data
      : null;
  };
  useEffect(() => {
    active.current = true;
    void reload();
    const timer = setInterval(() => void reload(), 60000);
    return () => {
      active.current = false;
      clearInterval(timer);
      store.reset();
    };
  }, []);
  return { metadata, reload, isCurrent };
};

export default useDetailHeaderMetadata;
