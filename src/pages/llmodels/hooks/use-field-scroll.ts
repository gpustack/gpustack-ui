import { useCallback } from 'react';

interface ScrollOptions {
  wait?: number;
  behavior?: 'smooth' | 'auto';
  block?: 'start' | 'end' | 'center';
  offsetTop?: number;
}

export default function useScrollAfterExpand({
  form,
  activeKey,
  setActiveKey,
  segmentOptions,
  defaultWait = 300
}: {
  form: any;
  activeKey: string[];
  setActiveKey: React.Dispatch<React.SetStateAction<string[]>>;
  segmentOptions: { value: string; field: string }[];
  defaultWait?: number;
}) {
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

  const scrollToSegment = useCallback(
    async (val: string, options?: ScrollOptions) => {
      if (!activeKey.includes(val)) {
        setActiveKey((prev) => [...prev, val]);
        await new Promise((r) => {
          setTimeout(r, options?.wait ?? defaultWait);
        });
      }

      await new Promise(requestAnimationFrame);

      const current = segmentOptions.find((item) => item.value === val);
      if (!current?.field) return;

      const el = document.querySelector(
        `[data-field="${current.field}"]`
      ) as HTMLElement | null;

      if (el) scrollToElement(el, options);
    },
    [activeKey, setActiveKey, segmentOptions, defaultWait, scrollToElement]
  );

  return { scrollToSegment };
}
