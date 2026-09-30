import { useMemoizedFn } from 'ahooks';
import { useLayoutEffect, useRef, useState } from 'react';
import { getVisibleFilterCount } from '../utils/filter-overflow';

interface FilterOverflowOptions {
  widths: readonly number[];
  locked: boolean;
}

/** Measures the allocated row, independently of the controls it contains. */
const useFilterOverflow = ({ widths, locked }: FilterOverflowOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reservedRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(widths.length);
  const visibleCountRef = useRef(widths.length);
  const widthsKey = widths.join(',');

  const measure = useMemoizedFn(() => {
    const container = containerRef.current;
    const reserved = reservedRef.current;
    if (!container || !reserved || locked) return;

    const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
    const nextCount = getVisibleFilterCount({
      widths,
      availableWidth: container.getBoundingClientRect().width,
      reservedWidth: reserved.getBoundingClientRect().width,
      gap,
      visibleCount: visibleCountRef.current
    });

    if (nextCount !== visibleCountRef.current) {
      visibleCountRef.current = nextCount;
      setVisibleCount(nextCount);
    }
  });

  useLayoutEffect(() => {
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    if (reservedRef.current) observer.observe(reservedRef.current);
    return () => observer.disconnect();
  }, [measure]);

  // Unlocking applies the latest width after the current edit has finished.
  useLayoutEffect(() => {
    measure();
  }, [widthsKey, locked, measure]);

  return { containerRef, reservedRef, visibleCount };
};

export default useFilterOverflow;
