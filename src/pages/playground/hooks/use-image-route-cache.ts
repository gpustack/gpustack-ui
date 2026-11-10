import { setRouteCache } from '@/atoms/route-cache';
import routeCachekey from '@/config/route-cachekey';
import { useMemoizedFn } from 'ahooks';
import { useEffect, useRef } from 'react';

const runningOwners = new Set<symbol>();

export default function useImageRouteCache() {
  const owner = useRef(Symbol('image-run'));
  const setRunning = useMemoizedFn((running: boolean) => {
    if (running) runningOwners.add(owner.current);
    else runningOwners.delete(owner.current);
    setRouteCache(
      routeCachekey['/playground/text-to-image'],
      runningOwners.size > 0
    );
  });

  useEffect(() => () => setRunning(false), [setRunning]);
  return setRunning;
}
