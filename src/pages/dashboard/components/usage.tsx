import breakpoints from '@/config/breakpoints';
import useWindowResize from '@/hooks/use-window-resize';
import { useEffect, useState } from 'react';
import UserInner from './usage-inner';

const Usage = () => {
  const {
    size: { width }
  } = useWindowResize();
  const [maxWdith, setMaxWidth] = useState<number>(breakpoints.xl);
  useEffect(() => {
    setMaxWidth(width);
  }, [width]);

  return <UserInner maxWidth={maxWdith}></UserInner>;
};

export default Usage;
