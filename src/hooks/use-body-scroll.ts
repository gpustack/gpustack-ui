import React from 'react';

export default function useBodyScroll() {
  const scrollHeight = React.useRef(0);
  const scrollerState = React.useRef<any>({});

  const bodyScroller = React.useRef<any>(null);

  const instanceRef = React.useRef<any>(null);

  const int = () => {
    bodyScroller.current =
      window.__GPUSTACK_BODY_SCROLLER__?.elements()?.scrollEventElement;

    instanceRef.current = window.__GPUSTACK_BODY_SCROLLER__;
  };

  const saveScrollHeight = React.useCallback(() => {
    scrollerState.current = instanceRef.current?.state();

    console.log('saveScrollHeight', scrollerState.current?.overflowAmount?.y);

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
    console.log('saveScrollHeight++++++++++', scrollHeight.current);

    bodyScroller.current?.scrollTo?.({
      top: scrollHeight.current,
      behavior: 'smooth'
    });

    instanceRef.current?.options?.({
      overflow: {
        x: 'hidden',
        y: 'scroll'
      }
    });

    instanceRef.current?.update?.();
  }, []);

  React.useEffect(() => {
    int();
    return () => {
      bodyScroller.current = null;
      instanceRef.current = null;
    };
  }, []);

  return { saveScrollHeight, restoreScrollHeight };
}
