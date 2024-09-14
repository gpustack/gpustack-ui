import useResizeObserver from '@react-hook/resize-observer';
import React from 'react';

export default function useSize(target: any) {
  const [size, setSize] = React.useState();

  React.useLayoutEffect(() => {
    setSize(target.current.getBoundingClientRect());
  }, [target]);

  useResizeObserver(target, (entry: any) => setSize(entry?.contentRect));
  return size;
}
