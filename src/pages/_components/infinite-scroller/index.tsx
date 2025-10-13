import React from 'react';

import {
  useInfiniteScroll,
  UseInfiniteScrollOptions
} from './use-infinite-scroll';

const InfiniteScroller: React.FC<
  UseInfiniteScrollOptions & { children: React.ReactNode }
> = (props) => {
  const { children, ...restProps } = props;
  const { observerRef } = useInfiniteScroll(restProps);

  return (
    <div>
      {children}
      <div ref={observerRef} style={{ height: 1 }}>
        <span></span>
      </div>
    </div>
  );
};

export default InfiniteScroller;
