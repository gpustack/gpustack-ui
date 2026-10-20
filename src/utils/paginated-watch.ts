import { WatchEventType } from '@/config';
import _ from 'lodash';

type Events = readonly string[];
export type WatchChanges<T> = Map<number, T | null>;

const eventItems = (event: any) =>
  (event.collection || []).filter((item: any) => item?.id != null);

export function recordWatchChanges<T>(
  changes: WatchChanges<T> | null,
  list: any[],
  events: Events
) {
  if (!changes) return;
  for (const event of list) {
    if (event.type === WatchEventType.DELETE && events.includes('DELETE')) {
      for (const id of event.ids || []) changes.set(id, null);
    } else if (
      (event.type === WatchEventType.CREATE && events.includes('CREATE')) ||
      (event.type === WatchEventType.UPDATE && events.includes('UPDATE'))
    ) {
      for (const item of eventItems(event)) changes.set(item.id, item);
    }
  }
}

// Preserve REST membership/order, but never resurrect a deletion or replace a
// watch update received while the request was pending with its older snapshot.
export function applyWatchChanges<T>(items: T[], changes: WatchChanges<T>) {
  return items.flatMap((item: any) => {
    const updated = changes.has(item.id) ? changes.get(item.id) : item;
    return updated == null ? [] : [updated];
  }) as T[];
}

const sortValue = (item: any, field: string) =>
  field === 'gpus' ? item.status?.gpu_devices?.length : _.get(item, field);

const changedSortField = (changes: Record<string, any>, field: string) => {
  const root = field === 'gpus' ? 'status' : field.split('.')[0];
  if (!Object.hasOwn(changes, root)) return false;
  const values = changes[root];
  if (root === field || !Array.isArray(values) || values.length !== 2) {
    return true;
  }
  return !_.isEqual(
    sortValue({ [root]: values[0] }, field),
    sortValue({ [root]: values[1] }, field)
  );
};

export function reconcileWatchPage<T>(
  dataList: T[],
  list: any[],
  options: { events: Events; sortBy: string }
) {
  let needsRefresh = false;
  const deletedIds: number[] = [];
  const sortFields = (options.sortBy || '-created_at')
    .split(',')
    .map((key) => key.replace(/^[-+]/, ''));
  for (const event of list) {
    if (
      event.type === WatchEventType.DELETE &&
      options.events.includes('DELETE')
    ) {
      const ids = new Set<number>(event.ids || []);
      dataList = dataList.filter((item: any) => !ids.has(item.id));
      deletedIds.push(...ids);
      // Off-page deletions also change totals and page bounds.
      needsRefresh ||= ids.size > 0;
    } else if (
      (event.type === WatchEventType.CREATE &&
        options.events.includes('CREATE')) ||
      (event.type === WatchEventType.UPDATE &&
        options.events.includes('UPDATE'))
    ) {
      const current = new Map(dataList.map((item: any) => [item.id, item]));
      const items = new Map<any, any>();
      for (const item of eventItems(event)) {
        const previous = current.get(item.id);
        items.set(item.id, item);
        if (previous) {
          needsRefresh ||= sortFields.some(
            (field) =>
              !_.isEqual(sortValue(previous, field), sortValue(item, field))
          );
        } else {
          // Without the old row, changed_fields can rule out unrelated updates.
          // Missing metadata requires a query: the row may enter this page.
          needsRefresh ||=
            event.type === WatchEventType.CREATE ||
            !event.changed_fields ||
            Object.keys(event.changed_fields).length === 0 ||
            sortFields.some((field) =>
              changedSortField(event.changed_fields, field)
            );
        }
      }
      if (dataList.some((item: any) => items.has(item.id))) {
        dataList = dataList.map((item: any) => items.get(item.id) || item);
      }
    }
  }
  return { dataList, needsRefresh, deletedIds };
}

// core-ui's JSON handler drops heartbeats, including an empty replay. Its text
// mode exposes them while retaining shared cancellation and reconnect backoff.
// Parse only new, complete lines; JSON strings escape their own newlines.
export function createPaginatedWatchStream(
  onEvents: (list: any[]) => void,
  onReconnect: () => void
) {
  let offset = 0;
  let remainder = '';
  let reconnecting = false;
  return {
    contentType: 'text' as const,
    beforeReconnect() {
      offset = 0;
      remainder = '';
      reconnecting = true;
    },
    handler(response: string) {
      if (reconnecting) {
        reconnecting = false;
        // Reconcile after transport resumes, not before its retry delay: rows
        // can be deleted during that gap, even if no CREATED events follow.
        onReconnect();
      }
      const lines = (remainder + response.slice(offset)).split('\n');
      offset = response.length;
      remainder = lines.pop() || '';
      const list: any[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (!event || typeof event !== 'object') continue;
          list.push({
            ...event,
            collection: event.data ? [event.data] : [],
            ids:
              event.type === WatchEventType.DELETE && event.data?.id != null
                ? [event.data.id]
                : []
          });
        } catch {
          // A malformed frame must not prevent later frames from being applied.
        }
      }
      if (list.length) onEvents(list);
    }
  };
}
