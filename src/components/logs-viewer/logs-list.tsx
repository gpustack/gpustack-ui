import useOverlayScroller from '@/hooks/use-overlay-scroller';
import classNames from 'classnames';
import _, { throttle } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './styles/logs-list.less';

interface LogsListProps {
  dataList: any[];
  height?: number;
  onScroll?: (isTop: boolean) => void;
  diffHeight?: number;
}
const LogsList: React.FC<LogsListProps> = (props) => {
  const { dataList, height, onScroll, diffHeight = 96 } = props;
  const {
    initialize,
    updateScrollerPosition,
    generateInstance,
    scrollEventElement,
    instance,
    initialized
  } = useOverlayScroller({
    theme: 'os-theme-light'
  });
  const viewportHeight = window.innerHeight;
  const viewHeight = viewportHeight - diffHeight;
  const [innerHieght, setInnerHeight] = useState(viewHeight);
  const scroller = useRef<any>({});
  const stopScroll = useRef(false);

  const debounceResetStopScroll = _.debounce(() => {
    stopScroll.current = false;
  }, 30000);

  const handleOnWheel = useCallback(
    (e: any) => {
      const scrollTop = scrollEventElement?.scrollTop;
      const scrollHeight = scrollEventElement?.scrollHeight;
      const clientHeight = scrollEventElement?.clientHeight;
      // is scroll to bottom
      stopScroll.current = scrollTop + clientHeight <= scrollHeight;
      // is scroll to top
      if (scrollTop === 0) {
        onScroll?.(true);
      } else {
        onScroll?.(false);
      }
      debounceResetStopScroll();
    },
    [debounceResetStopScroll, scrollEventElement]
  );

  const debounceUpdateScrollerPosition = _.debounce(() => {
    generateInstance();
    updateScrollerPosition(0);
  }, 200);

  useEffect(() => {
    const handleResize = throttle(() => {
      const viewportHeight = window.innerHeight;
      const viewHeight = viewportHeight - diffHeight;
      setInnerHeight(viewHeight);
    }, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [diffHeight]);

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [scroller.current, initialize]);

  useEffect(() => {
    if (dataList.length && !stopScroll.current && instance) {
      updateScrollerPosition(0);
    } else if (dataList.length && !stopScroll.current && scroller.current) {
      if (!initialized) {
        initialize(scroller.current);
      }
      if (!instance) {
        debounceUpdateScrollerPosition();
      } else {
        updateScrollerPosition(0);
      }
    }
  }, [dataList, stopScroll.current, instance, scroller.current]);

  return (
    <div
      className="logs-wrap"
      style={{ height: innerHieght }}
      ref={scroller}
      onWheel={handleOnWheel}
    >
      <div className={classNames('content')}>
        {_.map(dataList, (item: any, index: number) => {
          return (
            <div key={item.uid} className="text">
              {item.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(LogsList);
