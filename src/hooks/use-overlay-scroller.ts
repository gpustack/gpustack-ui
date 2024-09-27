import { throttle } from 'lodash';
import {
  useOverlayScrollbars,
  UseOverlayScrollbarsParams
} from 'overlayscrollbars-react';
import React from 'react';

export const overlaySollerOptions: UseOverlayScrollbarsParams = {
  options: {
    update: {
      debounce: 0
    },
    overflow: {
      x: 'hidden'
    },
    scrollbars: {
      autoHide: 'scroll',
      autoHideDelay: 600,
      clickScroll: 'instant'
    }
  },
  defer: true
};

export default function useOverlayScroller() {
  const scrollEventElement = React.useRef<any>(null);
  const instanceRef = React.useRef<any>(null);
  const [initialize, instance] = useOverlayScrollbars({
    ...overlaySollerOptions
  });
  instanceRef.current = instance?.();
  scrollEventElement.current =
    instanceRef.current?.elements()?.scrollEventElement;

  const throttledScroll = React.useMemo(
    () =>
      throttle(() => {
        scrollEventElement.current?.scrollTo?.({
          top: scrollEventElement.current.scrollHeight,
          behavior: 'smooth'
        });
        instanceRef.current?.update?.();
      }, 300),
    [scrollEventElement, instanceRef]
  );

  const throttledUpdateScrollerPosition = React.useCallback(() => {
    throttledScroll();
  }, [throttledScroll]);

  // const createInstance = React.useCallback((el: any) => {
  //   if (el) {
  //     instanceRef.current?.destroy?.();
  //     initialize(el);
  //     instanceRef.current = instance?.();
  //     scrollEventElement.current =
  //       instanceRef.current?.elements()?.scrollEventElement;
  //   }
  // }, []);

  React.useEffect(() => {
    return () => {
      instanceRef.current?.destroy?.();
    };
  }, []);

  return {
    initialize,
    instance: instanceRef.current,
    updateScrollerPosition: throttledUpdateScrollerPosition
  };
}
