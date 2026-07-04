import useWindowResize from '@/hooks/use-window-resize';
import { useEffect, useRef } from 'react';

export default function useCollapseLayout(handler: () => void) {
  const { isMobile } = useWindowResize();
  const wasMobileRef = useRef(isMobile);

  useEffect(() => {
    if (isMobile && !wasMobileRef.current) {
      handler();
    }
    wasMobileRef.current = isMobile;
  }, [isMobile, handler]);
}
