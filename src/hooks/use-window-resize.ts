import { getResponsiveLayout } from '@gpustack/core-ui/utils';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

export { useResponsiveLayout } from '@gpustack/core-ui';
export { getResponsiveLayout } from '@gpustack/core-ui/utils';

export default function useWindowResize() {
  const [size, setSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  }));

  const layout = useMemo(() => getResponsiveLayout(size.width), [size.width]);

  const syncSize = useCallback(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  const handleResize = useCallback(_.throttle(syncSize, 200), [syncSize]);

  useEffect(() => {
    syncSize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel?.();
    };
  }, [handleResize, syncSize]);

  return { ...layout, size };
}
