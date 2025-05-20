import { throttle } from 'lodash';
import {
  UseOverlayScrollbarsParams,
  useOverlayScrollbars
} from 'overlayscrollbars-react';
import React, { useEffect } from 'react';
import useUserSettings from './use-user-settings';

type OverflowBehavior =
  | 'hidden'
  | 'scroll'
  | 'visible'
  | 'visible-hidden'
  | 'visible-scroll';
export interface OverlayScrollerOptions {
  oppositeTheme?: boolean;
  overflow?: {
    x?: OverflowBehavior;
    y?: OverflowBehavior;
  };
  scrollbars?: {
    theme?: 'os-theme-light' | 'os-theme-dark';
    autoHide?: 'never' | 'scroll' | 'leave' | 'move';
    autoHideDelay?: number;
    clickScroll?: boolean | 'instant';
  };
}

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

const RESETSCROLLDELAY = 5000;

/**
 *
 * @param options.theme: if set theme, it will fix the theme
 * @returns
 */
export default function useOverlayScroller(data?: {
  options?: OverlayScrollerOptions;
  events?: any;
  defer?: boolean;
}) {
  const { userSettings } = useUserSettings();
  const { options, events, defer = true } = data || {};
  const { scrollbars, overflow, oppositeTheme } = options || {};
  const scrollEventElement = React.useRef<any>(null);
  const instanceRef = React.useRef<any>(null);
  const initialized = React.useRef(false);
  const scrollElementRef = React.useRef<any>(null);
  const stopUpdatePosition = React.useRef(false);
  const timerRef = React.useRef<any>(null);
  const [initialize, instance] = useOverlayScrollbars({
    options: {
      update: {
        debounce: 0
      },
      overflow: {
        x: 'hidden',
        ...overflow
      },
      scrollbars: {
        autoHide: 'scroll',
        autoHideDelay: 600,
        clickScroll: 'instant',
        ...scrollbars,
        theme:
          scrollbars?.theme ||
          (userSettings.theme === 'light' ? 'os-theme-dark' : 'os-theme-light')
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

  const handleOnScroll = () => {
    const scrollTop = scrollEventElement.current?.scrollTop;
    const scrollHeight = scrollEventElement.current?.scrollHeight;
    const clientHeight = scrollEventElement.current?.clientHeight;

    const isBottom = scrollTop + clientHeight + 20 >= scrollHeight;

    if (isBottom) {
      stopUpdatePosition.current = false;
    } else {
      stopUpdatePosition.current = true;
    }
  };

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
      if (stopUpdatePosition.current) {
        return;
      }
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

  const handleWheelCallback = React.useCallback((e: any) => {
    handleOnScroll();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      stopUpdatePosition.current = false;
    }, RESETSCROLLDELAY);
  }, []);

  // add  wheel event
  const handleWheelEvent = () => {
    scrollElementRef.current?.addEventListener?.('wheel', handleWheelCallback);
  };

  // remove wheel event
  const removeWheelEvent = () => {
    scrollElementRef.current?.removeEventListener?.(
      'wheel',
      handleWheelCallback
    );
  };

  const createInstance = React.useCallback(
    (el: any) => {
      if (instanceRef.current) {
        return instanceRef.current;
      }
      if (el) {
        initialize(el);
        scrollElementRef.current = el;
        initialized.current = true;
        instanceRef.current = instance?.();
        scrollEventElement.current =
          instanceRef.current?.elements()?.scrollEventElement;
        handleWheelEvent();
      }
      return instanceRef.current;
    },
    [initialize, instance]
  );

  useEffect(() => {
    return () => {
      instanceRef.current?.destroy?.();
      removeWheelEvent();
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
