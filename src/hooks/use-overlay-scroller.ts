import { userSettingsHelperAtom } from '@/atoms/settings';
import { useAtom } from 'jotai';
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

export default function useOverlayScroller(data?: {
  options?: any;
  events?: any;
  defer?: boolean;
}) {
  const [useSettings] = useAtom(userSettingsHelperAtom);
  const { options, events, defer = true } = data || {};
  const scrollEventElement = React.useRef<any>(null);
  const instanceRef = React.useRef<any>(null);
  const initialized = React.useRef(false);
  console.log('useSettings-----------', options?.theme, useSettings);
  const [initialize, instance] = useOverlayScrollbars({
    options: {
      update: {
        debounce: 0
      },
      overflow: {
        x: 'hidden'
      },
      scrollbars: {
        theme:
          options?.theme || useSettings.theme === 'light'
            ? 'os-theme-dark'
            : 'os-theme-light',
        autoHide: 'scroll',
        autoHideDelay: 600,
        clickScroll: 'instant'
      }
    },
    events: {
      ...events
    },
    defer: defer
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
        return instanceRef.current;
      }
      if (el) {
        initialize(el);
        initialized.current = true;
        instanceRef.current = instance?.();
        scrollEventElement.current =
          instanceRef.current?.elements()?.scrollEventElement;
      }
      return instanceRef.current;
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
