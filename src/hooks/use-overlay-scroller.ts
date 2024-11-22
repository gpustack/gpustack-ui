import { throttle } from 'lodash';
import {
  UseOverlayScrollbarsParams,
  useOverlayScrollbars
} from 'overlayscrollbars-react';
import React, { useEffect } from 'react';

export const overlaySollerOptions: UseOverlayScrollbarsParams = {
  options: {
    update: {
      debounce: 0
    },
    overflow: {
      x: 'hidden'
    },
    scrollbars: {
      theme: 'os-theme-light',
      autoHide: 'scroll',
      autoHideDelay: 600,
      clickScroll: 'instant'
    }
  },
  defer: true
};

export default function useOverlayScroller(options?: any) {
  const scrollEventElement = React.useRef<any>(null);
  const instanceRef = React.useRef<any>(null);
  const initialized = React.useRef(false);
  const [initialize, instance] = useOverlayScrollbars({
    options: {
      update: {
        debounce: 0
      },
      overflow: {
        x: 'hidden'
      },
      scrollbars: {
        theme: options?.theme || 'os-theme-dark',
        autoHide: 'scroll',
        autoHideDelay: 600,
        clickScroll: 'instant'
      }
    },
    defer: true
  });

  instanceRef.current = instance?.();
  scrollEventElement.current =
    instanceRef.current?.elements()?.scrollEventElement;

  const throttledScroll = React.useCallback(
    throttle(() => {
      scrollEventElement.current?.scrollTo?.({
        top: scrollEventElement.current?.scrollHeight,
        behavior: 'smooth'
      });
      instanceRef.current?.update?.();
    }, 100),
    [(scrollEventElement.current, instanceRef.current)]
  );

  const scrollauto = React.useCallback(() => {
    scrollEventElement.current?.scrollTo?.({
      top: scrollEventElement.current.scrollHeight,
      behavior: 'auto'
    });
    instanceRef.current?.update?.();
  }, [scrollEventElement.current, instanceRef.current]);

  // scroll to bottom
  const throttledUpdateScrollerPosition = React.useCallback(
    (delay?: number) => {
      if (delay === 0) {
        scrollauto();
      } else {
        throttledScroll();
      }
    },
    [throttledScroll, scrollauto]
  );

  // scroll to top
  const updateScrollerPositionToTop = React.useCallback(() => {
    scrollEventElement.current?.scrollTo?.({
      top: 0,
      behavior: 'auto'
    });
    instanceRef.current?.update?.();
  }, [scrollEventElement.current, instanceRef.current]);

  const generateInstance = () => {
    instanceRef.current = instance?.();
    scrollEventElement.current =
      instanceRef.current?.elements()?.scrollEventElement;
  };

  const createInstance = React.useCallback(
    (el: any) => {
      if (instanceRef.current) {
        return;
      }
      if (el) {
        initialize(el);
        initialized.current = true;
        instanceRef.current = instance?.();
        scrollEventElement.current =
          instanceRef.current?.elements()?.scrollEventElement;
      }
    },
    [initialize, instance]
  );

  useEffect(() => {
    return () => {
      instanceRef.current?.destroy?.();
    };
  }, [instance]);

  return {
    initialize: createInstance,
    instance: instanceRef.current,
    scrollEventElement: scrollEventElement.current,
    initialized: initialized.current,
    generateInstance,
    updateScrollerPosition: throttledUpdateScrollerPosition,
    updateScrollerPositionToTop: updateScrollerPositionToTop
  };
}
