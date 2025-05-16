import breakpoints from '@/config/breakpoints';
import useWindowResize from '@/hooks/use-window-resize';
import { useEffect } from 'react';

export default function useCollapseLayout(options: {
  handler: () => void;
  triggeredRef: {
    collapse: boolean;
  };
}) {
  const { size } = useWindowResize();

  useEffect(() => {
    if (size.width < breakpoints.lg) {
      if (!options.triggeredRef?.collapse) {
        options.handler();
      }
    }
  }, [size.width]);
}
