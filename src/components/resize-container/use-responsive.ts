import breakpoints from '@/config/breakpoints';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import { useState } from 'react';

const useResponsive = ({ defaultSpan = 8 }: { defaultSpan?: number }) => {
  const [span, setSpan] = useState(defaultSpan);

  const getSpanByWidth = (width: number) => {
    if (width < breakpoints.md) return 24;
    if (width < breakpoints.lg) return 12;
    return 8;
  };

  const handleResize = useMemoizedFn(
    _.throttle((size: { width: number; height: number }) => {
      setSpan(getSpanByWidth(size.width));
    }, 100)
  );
  return { span, handleResize };
};

export default useResponsive;
