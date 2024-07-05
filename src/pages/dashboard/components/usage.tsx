import breakpoints from '@/config/breakpoints';
import useWindowResize from '@/hooks/use-window-resize';
import { useEffect, useState } from 'react';
import UserInner from './usage-inner';

const Usage = () => {
  const {
    size: { width }
  } = useWindowResize();
  const [paddingRight, setPaddingRight] = useState<string>('20px');

  useEffect(() => {
    if (width < breakpoints.xl) {
      setPaddingRight('0');
    } else {
      setPaddingRight('20px');
    }
  }, [width]);

  return <UserInner paddingRight={paddingRight}></UserInner>;
};

export default Usage;
