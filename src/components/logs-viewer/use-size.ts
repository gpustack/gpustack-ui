import { useEffect, useState } from 'react';

export const useResizeObserver = (ref: React.RefObject<HTMLElement>) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setSize((prev) => {
        if (prev.width === rect.width && prev.height === rect.height)
          return prev;
        return { width: rect.width, height: rect.height };
      });
    };

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(element);
    updateSize();

    return () => {
      observer.disconnect();
    };
  }, [ref.current]);

  return size;
};

export default useResizeObserver;
