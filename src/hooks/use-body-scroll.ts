import React from 'react';

export default function useBodyScroll() {
  const scrollHeight = React.useRef(0);
  const scrollerState = React.useRef<any>({});

  const bodyScroller = React.useRef<any>(null);

  const instanceRef = React.useRef<any>(null);
  const timer = React.useRef<any>(null);

  const init = () => {
    bodyScroller.current =
      window.__GPUSTACK_BODY_SCROLLER__?.elements()?.scrollEventElement;

    instanceRef.current = window.__GPUSTACK_BODY_SCROLLER__;
  };

  const saveScrollHeight = React.useCallback(() => {
    if (!bodyScroller.current) {
      init();
    }
    scrollerState.current = instanceRef.current?.state();

    const scrollTop = scrollerState.current?.overflowAmount?.y;
    scrollHeight.current = scrollTop;
    instanceRef.current?.options?.({
      overflow: {
        x: 'hidden',
        y: 'visible'
      }
    });
  }, []);

  const restoreScrollHeight = React.useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      instanceRef.current?.options?.({
        overflow: {
          x: 'hidden',
          y: 'scroll'
        }
      });
    }, 650);
  }, []);

  React.useEffect(() => {
    init();
    return () => {
      bodyScroller.current = null;
      instanceRef.current = null;
    };
  }, []);

  return {
    saveScrollHeight,
    restoreScrollHeight,
    bodyScroller: bodyScroller.current
  };
}
