import useOverlayScroller from '@/hooks/use-overlay-scroller';
import classNames from 'classnames';
import _, { throttle } from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import './styles/logs-list.less';

interface LogsListProps {
  dataList: any[];
  height?: number;
  onScroll?: (data: { isTop: boolean; isBottom: boolean }) => void;
  diffHeight?: number;
  showNum?: boolean;
  ref?: any;
}
const LogsList: React.FC<LogsListProps> = forwardRef((props, ref) => {
  const { dataList, height, showNum, onScroll, diffHeight = 96 } = props;
  const {
    initialize,
    updateScrollerPosition,
    updateScrollerPositionToTop,
    generateInstance,
    scrollEventElement,
    instance,
    initialized
  } = useOverlayScroller({
    options: {
      scrollbars: {
        theme: 'os-theme-light'
      }
    }
  });
  const [innerHieght, setInnerHeight] = useState(
    window.innerHeight - diffHeight
  );
  const scroller = useRef<any>({});
  const stopScroll = useRef(false);

  const scrollToBottom = useCallback(() => {
    updateScrollerPosition(0);
  }, [updateScrollerPosition]);

  const debounceResetStopScroll = _.debounce(() => {
    stopScroll.current = false;
  }, 30000);

  const scrollToTop = useCallback(() => {
    stopScroll.current = true;
    updateScrollerPositionToTop();
    debounceResetStopScroll();
  }, [updateScrollerPositionToTop]);

  useImperativeHandle(ref, () => ({
    scrollToBottom,
    scrollToTop,
    scroller: scroller.current
  }));

  const handleOnWheel = useCallback(
    (e: any) => {
      const scrollTop = scrollEventElement?.scrollTop;
      const scrollHeight = scrollEventElement?.scrollHeight;
      const clientHeight = scrollEventElement?.clientHeight;

      stopScroll.current = scrollTop + clientHeight <= scrollHeight;

      const isBottom = scrollTop + clientHeight + 150 >= scrollHeight;
      // is scroll to top
      if (scrollTop <= 10) {
        onScroll?.({
          isTop: true,
          isBottom: false
        });
      } else if (isBottom) {
        onScroll?.({
          isTop: false,
          isBottom: true
        });
        stopScroll.current = false;
      } else {
        onScroll?.({
          isTop: false,
          isBottom: false
        });
      }
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
  }, [initialize]);

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
            <div
              key={item.uid}
              className={classNames('text')}
              data-uid={item.uid}
            >
              {item.content}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default React.memo(LogsList);
