import { useMemoizedFn } from 'ahooks';
import { useCallback, useRef, useState } from 'react';

interface ScrollOptions {
  wait?: number;
  behavior?: 'smooth' | 'auto';
  block?: 'start' | 'end' | 'center';
  offsetTop?: number;
}

export default function useScrollAfterExpand({
  activeKey,
  setActiveKey,
  segmentOptions,
  defaultWait = 300,
  segmentedTop = { top: 0, offsetTop: 96 },
  getScrollElementScrollableHeight
}: {
  activeKey: string[];
  setActiveKey: (keys: string[]) => void;
  segmentOptions: { value: string; field: string }[];
  getScrollElementScrollableHeight?: () => {
    scrollHeight: number;
    scrollTop: number;
  };
  defaultWait?: number;
  segmentedTop: {
    top: number; // The top offset for the sticky header
    offsetTop: number; // The offset top for the target
  };
}) {
  const [holderHeight, setHolderHeight] = useState<number>(0);
  const boxHeightRef = useRef<number>(0);

  const scrollToElement = useCallback(
    (
      el: HTMLElement,
      { behavior = 'smooth', offsetTop = 0 }: ScrollOptions = {}
    ) => {
      // find the nearest scrollable parent
      const scrollParent = (() => {
        let node: HTMLElement | null = el;
        while (node) {
          const { overflowY } = getComputedStyle(node);
          if (overflowY === 'auto' || overflowY === 'scroll') return node;
          node = node.parentElement;
        }
        return document.scrollingElement || document.documentElement;
      })();

      const parentRect = scrollParent.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const top =
        elRect.top - parentRect.top + scrollParent.scrollTop - offsetTop;

      scrollParent.scrollTo({ top, behavior });
    },
    []
  );

  /**
   * due to the scrollheight changes after expanding the segment and including the holder height.
   *
   */
  const scrollToSegment = useMemoizedFn(
    async (val: string, options?: ScrollOptions) => {
      if (!activeKey.includes(val)) {
        setActiveKey([...activeKey, val]);
        await new Promise((r) => {
          setTimeout(r, options?.wait ?? defaultWait);
        });
      }

      const current = segmentOptions.find((item) => item.value === val);
      if (!current?.field) return;

      await new Promise(requestAnimationFrame);

      const el: HTMLElement | null = document.querySelector(
        `[data-field="${current.field}"]`
      ) as HTMLElement | null;

      const targetRectTop = el?.getBoundingClientRect().top || 0;

      const scroller = getScrollElementScrollableHeight?.() || {
        scrollHeight: 0,
        scrollTop: 0
      };

      // remaining scroll height
      const remainingScrollHeight = scroller.scrollHeight - scroller.scrollTop;

      // total distance from the top of the scroller to the target element
      const offsetDistance =
        targetRectTop - segmentedTop.offsetTop - segmentedTop.top;

      let boxHeight = 0;

      // verify boxHeight is correct, if setting the boxHeight causes the element to be hidden, use the previous boxHeight
      if (offsetDistance <= 0) {
        boxHeight = boxHeightRef.current;
      } else {
        boxHeight =
          offsetDistance - remainingScrollHeight + boxHeightRef.current;
      }

      // update boxHeightRef
      boxHeightRef.current = boxHeight;

      setHolderHeight(boxHeight);
      await new Promise(requestAnimationFrame);

      if (el) scrollToElement(el, options);
    }
  );

  return { scrollToSegment, holderHeight };
}
