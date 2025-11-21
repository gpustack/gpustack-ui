import { useMemoizedFn } from 'ahooks';
import { throttle } from 'lodash';
import { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

export interface UseInfiniteScrollOptions {
  total: number;
  current: number;
  loading: boolean;
  refresh: (nextPage: number) => void;
  onBottom?: () => void;
  throttleDelay?: number;
}

export function useInfiniteScroll({
  total,
  current,
  loading,
  refresh,
  onBottom,
  throttleDelay = 300
}: UseInfiniteScrollOptions) {
  const { ref: observerRef, inView } = useInView({
    threshold: 0.2
  });
  const isInitialLoad = useRef(true);

  const throttledLoadMore = useMemoizedFn(
    throttle(() => {
      if (loading) return;
      if (current >= total) return;

      onBottom?.();
      refresh(current + 1);
    }, throttleDelay)
  );

  useEffect(() => {
    if (inView) {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }
      throttledLoadMore();
    }
  }, [inView, throttledLoadMore]);

  return { observerRef, throttledLoadMore };
}
