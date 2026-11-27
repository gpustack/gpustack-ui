import { NS_STORE_NAME } from '@gpustack/core-ui/utils';
import localForage from 'localforage';

export interface CurrentVideoTask {
  video_id: string;
  params: Record<string, unknown>;
}

// One slot per user. IndexedDB preserves uploaded media without JSON encoding.
const storage = localForage.createInstance({
  name: NS_STORE_NAME,
  storeName: 'video_current_task'
});
const key = (userId: string) => `v1:${userId}`;

export async function readCurrentVideoTask(userId: string) {
  const value = await storage.getItem<CurrentVideoTask>(key(userId));
  return value &&
    typeof value.video_id === 'string' &&
    value.video_id.trim() &&
    value.params &&
    typeof value.params === 'object' &&
    !Array.isArray(value.params)
    ? value
    : undefined;
}

export const writeCurrentVideoTask = (userId: string, task: CurrentVideoTask) =>
  storage.setItem(key(userId), task);
export const clearCurrentVideoTask = (userId: string) =>
  storage.removeItem(key(userId));
