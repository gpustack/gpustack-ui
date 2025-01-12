import _, { throttle } from 'lodash';
import List from 'rc-virtual-list';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import './styles/logs-list.less';

interface LogsInnerProps {
  ref?: any;
  data: { content: string; uid: number }[];
  onScroll?: (data: { isTop: boolean; isBottom: boolean }) => void;
  diffHeight?: number;
}

const LogsInner: React.FC<LogsInnerProps> = forwardRef((props, ref) => {
  const { data, diffHeight = 96, onScroll } = props;
  const viewportHeight = window.innerHeight;
  const viewHeight = viewportHeight - diffHeight;
  const [innerHieght, setInnerHeight] = useState(viewHeight);
  const scroller = useRef<any>(null);
  const stopScroll = useRef(false);
  const logsWrapper = useRef<any>(null);

  const RC_VIRTUAL_LIST_HOLDER_CLASS = '.rc-virtual-list-holder';

  const updataPositionToBottom = useCallback(
    throttle(() => {
      if (!stopScroll.current && data.length > 0) {
        scroller.current?.scrollTo?.({
          index: data.length - 1,
          align: 'bottom'
        });
      }
    }, 200),
    [data, scroller.current, stopScroll.current]
  );

  const updataPositionToTop = useCallback(
    throttle(() => {
      if (!stopScroll.current && data.length > 0) {
        scroller.current?.scrollTo?.({
          index: 0,
          align: 'bottom'
        });
      }
    }, 200),
    [data, scroller.current, stopScroll.current]
  );

  const updatePositionToTop = useCallback(
    _.throttle((data: { isTop: boolean; isBottom: boolean }) => {
      props.onScroll?.(data);
    }, 200),
    [props.onScroll]
  );

  const isScrollBottom = useCallback((root: HTMLElement) => {
    const virtualList = root.querySelector(RC_VIRTUAL_LIST_HOLDER_CLASS);
    if (!virtualList) {
      return false;
    }
    return (
      virtualList.scrollTop >=
      virtualList.scrollHeight - virtualList.clientHeight
    );
  }, []);

  const isScrollTop = useCallback((root: HTMLElement) => {
    const virtualList = root.querySelector(RC_VIRTUAL_LIST_HOLDER_CLASS);
    if (!virtualList) {
      return false;
    }
    return virtualList.scrollTop <= 0;
  }, []);

  const handleOnScroll = useCallback((e: any) => {
    const isBottom = isScrollBottom(logsWrapper.current);
    const isTop = isScrollTop(logsWrapper.current);
    if (isBottom) {
      stopScroll.current = false;
    } else {
      stopScroll.current = true;
    }
    updatePositionToTop({
      isTop,
      isBottom
    });
  }, []);

  useImperativeHandle(ref, () => ({
    scrollToBottom() {
      updataPositionToBottom();
    },
    scrollToTop() {
      updataPositionToTop();
    }
  }));

  useEffect(() => {
    updataPositionToBottom();
  }, [updataPositionToBottom]);

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
  return (
    <div ref={logsWrapper} className="logs-wrap" style={{ height: '100%' }}>
      <List
        ref={scroller}
        onScroll={handleOnScroll}
        data={data}
        itemHeight={22}
        height={innerHieght}
        itemKey="uid"
        className="content"
        styles={{
          verticalScrollBar: {
            width: 'var(--scrollbar-size)'
          },
          verticalScrollBarThumb: {
            borderRadius: '4px',
            backgroundColor: 'var(--scrollbar-handle-light-bg)'
          }
        }}
      >
        {(item: any, index: number) => (
          <div key={item.uid} className="text">
            {item.content}
          </div>
        )}
      </List>
    </div>
  );
});

export default React.memo(LogsInner);
