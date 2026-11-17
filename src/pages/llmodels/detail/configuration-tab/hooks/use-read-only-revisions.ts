import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type {
  ModelRevisionDetail,
  RevisionPage
} from '../../../components/deployment/revisions/config/types';
import type { ListItem } from '../../../config/types';
import {
  tenantKey,
  useMonitoringTenant
} from '../../hooks/use-monitoring-data';
import { ScopedResource } from '../../services/scoped-resource';
import {
  queryReadOnlyRevision,
  queryReadOnlyRevisions
} from '../services/read-only-revisions';

const accessRevoked = (error: unknown) =>
  [401, 403, 404].includes((error as any)?.response?.status);

export default function useReadOnlyRevisions(model: ListItem) {
  const tenant = useMonitoringTenant();
  const [stores] = useState(() => ({
    list: new ScopedResource<RevisionPage>(),
    detail: new ScopedResource<ModelRevisionDetail>()
  }));
  const list = useSyncExternalStore(
    stores.list.subscribe,
    () => stores.list.snapshot
  );
  const detail = useSyncExternalStore(
    stores.detail.subscribe,
    () => stores.detail.snapshot
  );
  const key = JSON.stringify([tenant, model.id, model.owner_principal_id]);
  const currentKey = useRef(key);
  currentKey.current = key;
  const active = useRef(false);
  const [selection, setSelection] = useState<{
    key: string;
    revision: number;
  } | null>(null);
  const currentSelection = useRef(selection);
  currentSelection.current = selection;
  const clear = () => {
    stores.detail.reset();
    currentSelection.current = null;
    setSelection(null);
  };
  const isCurrent = () =>
    active.current && currentKey.current === key && tenantKey() === tenant;
  const reload = async () => {
    if (!isCurrent()) return;
    await stores.list.load(
      key,
      async (signal) => {
        try {
          const result = await queryReadOnlyRevisions(model.id, signal);
          const selected = currentSelection.current;
          if (
            !signal.aborted &&
            isCurrent() &&
            selected?.key === key &&
            !result.items.some((item) => item.revision === selected.revision)
          )
            clear();
          return result;
        } catch (error) {
          if (!signal.aborted && isCurrent() && accessRevoked(error)) {
            // Forget the snapshot before publishing the revoked list. Resetting
            // also invalidates any in-flight detail response for this selection.
            clear();
          }
          throw error;
        }
      },
      isCurrent
    );
  };
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      stores.list.reset();
      stores.detail.reset();
    };
    // A primitive identity marks lifecycle entry; requests do not follow callback identities.
  }, [key]);
  useEffect(() => {
    // Revalidate when the authorized deployment changes, preserving an open
    // immutable snapshot only while its revision remains in the loaded list.
    void reload();
  }, [key, model.updated_at]);
  const visibleList = list.key === key && tenantKey() === tenant ? list : null;
  const selected =
    selection?.key === key &&
    !accessRevoked(visibleList?.error) &&
    visibleList?.data?.items.some(
      (item) => item.revision === selection.revision
    )
      ? selection.revision
      : null;
  const detailKey = `${key}:${selected}`;
  const visibleDetail =
    selected != null && detail.key === detailKey && tenantKey() === tenant
      ? detail
      : null;
  const select = (revision: number) => {
    const authorizedList = stores.list.snapshot;
    if (
      !isCurrent() ||
      authorizedList.key !== key ||
      accessRevoked(authorizedList.error) ||
      !authorizedList.data?.items.some((item) => item.revision === revision)
    )
      return;
    currentSelection.current = { key, revision };
    setSelection(currentSelection.current);
    void stores.detail.load(
      `${key}:${revision}`,
      (signal) => queryReadOnlyRevision(model.id, revision, signal),
      isCurrent
    );
  };
  return {
    list: visibleList,
    detail: visibleDetail,
    selected,
    select,
    clear,
    reload
  };
}
