import { DoubleRightOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React from 'react';

import {
  useInfiniteScroll,
  UseInfiniteScrollOptions
} from './use-infinite-scroll';

const InfiniteScroller: React.FC<
  UseInfiniteScrollOptions & { children: React.ReactNode }
> = (props) => {
  const { children, ...restProps } = props;
  const intl = useIntl();
  const { observerRef, throttledLoadMore } = useInfiniteScroll(restProps);

  return (
    <div>
      {children}
      <div
        ref={observerRef}
        style={{
          height: 1
        }}
      >
        {restProps.current < restProps.total && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 24
            }}
          >
            <Button
              onClick={throttledLoadMore}
              type="text"
              size="small"
              disabled={restProps.loading}
            >
              {intl.formatMessage({ id: 'common.button.more' })}
              <DoubleRightOutlined rotate={90} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfiniteScroller;
