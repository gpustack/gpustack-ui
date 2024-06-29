import breakpoints from '@/config/breakpoints';
import { useEffect, useState } from 'react';

export default function useWindowResize() {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [currentPoint, setCurrentPoint] = useState<string>('');

  const checkBreakpoint = (width: number) => {
    if (width < breakpoints.sm) {
      setIsMobile(true);
      setIsTablet(false);
      setIsDesktop(false);
      setCurrentPoint('sm');
      return;
    }
    if (width < breakpoints.md) {
      setIsMobile(false);
      setIsTablet(true);
      setIsDesktop(false);
      setCurrentPoint('md');
      return;
    }
    if (width < breakpoints.lg) {
      setIsMobile(false);
      setIsTablet(false);
      setIsDesktop(true);
      setCurrentPoint('lg');
      return;
    }
    setIsMobile(false);
    setIsTablet(false);
    setIsDesktop(true);
    setCurrentPoint('xl');
  };

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    checkBreakpoint(size.width);
  }, [size.width]);

  return { size, isMobile, isTablet, isDesktop, currentPoint };
}