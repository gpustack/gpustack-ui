import useSetChunkFetch from '@/hooks/use-chunk-fetch';
import { Spin } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { replaceLineRegex } from './config';
import LogsList from './logs-list';
import LogsPagination from './logs-pagination';
import './styles/index.less';
import useLogsPagination from './use-logs-pagination';

interface LogsViewerProps {
  height: number;
  content?: string;
  url: string;
  params?: object;
  ref?: any;
  tail?: number;
  enableScorllLoad?: boolean;
  diffHeight?: number;
}
const LogsViewer: React.FC<LogsViewerProps> = forwardRef((props, ref) => {
  const { diffHeight, url, tail: defaultTail, enableScorllLoad = true } = props;
  const { pageSize, page, setPage, setTotalPage, totalPage } =
    useLogsPagination();
  const { setChunkFetch } = useSetChunkFetch();
  const chunkRequedtRef = useRef<any>(null);
  const cacheDataRef = useRef<any>('');
  const [logs, setLogs] = useState<any[]>([]);
  const logParseWorker = useRef<any>(null);
  const tail = useRef<any>(pageSize - 1);
  const [loading, setLoading] = useState(false);
  const [isAtTop, setIsAtTop] = useState(false);
  const [scrollPos, setScrollPos] = useState<any[]>([]);
  const logListRef = useRef<any>(null);
  const loadMoreDone = useRef(false);
  const pageRef = useRef<any>(page);
  const totalPageRef = useRef<any>(totalPage);
  const isLoadingMoreRef = useRef(false);
  const [currentData, setCurrentData] = useState<any[]>([]);
  const scrollPosRef = useRef<any>({
    pos: 'bottom',
    page: 1
  });
  const lineCountRef = useRef(0);

  useImperativeHandle(ref, () => ({
    abort() {
      chunkRequedtRef.current?.current?.abort?.();
      logParseWorker.current?.terminate?.();
    }
  }));

  const debounceLoading = _.debounce(() => {
    setLoading(false);
    isLoadingMoreRef.current = false;
  }, 200);

  const getCurrent = useCallback(() => {
    if (pageRef.current < 1) {
      pageRef.current = 1;
    }
    const start = (pageRef.current - 1) * pageSize;
    const end = pageRef.current * pageSize;
    const currentLogs = logs.slice(start, end);
    setPage(pageRef.current);
    setCurrentData(currentLogs);
  }, [logs, pageSize]);

  const getPrePage = useCallback(() => {
    pageRef.current = pageRef.current - 1;

    getCurrent();

    setScrollPos(['bottom', pageRef.current]);
    scrollPosRef.current = {
      pos: 'bottom',
      page: pageRef.current
    };
  }, [getCurrent]);

  const getNextPage = useCallback(() => {
    pageRef.current = pageRef.current + 1;

    getCurrent();

    setScrollPos(['top', pageRef.current]);
    scrollPosRef.current = {
      pos: 'top',
      page: pageRef.current
    };
  }, [getCurrent]);

  const handleonBackend = useCallback(() => {
    pageRef.current = totalPageRef.current;
    getCurrent();
    setPage(pageRef.current);
    console.log('pageRef.current', pageRef.current);
    setScrollPos(['bottom', pageRef.current]);
    scrollPosRef.current = {
      pos: 'bottom',
      page: pageRef.current
    };
  }, [getCurrent]);

  const updateContent = (inputStr: string) => {
    const data = inputStr.replace(replaceLineRegex, '\n');
    cacheDataRef.current = data;
    if (isLoadingMoreRef.current) {
      setLoading(true);
    }
    logParseWorker.current.postMessage({
      inputStr: data
    });
  };

  const createChunkConnection = async () => {
    chunkRequedtRef.current?.current?.abort?.();

    chunkRequedtRef.current = setChunkFetch({
      url,
      params: {
        ...props.params,
        tail: tail.current,
        watch: true
      },
      contentType: 'text',
      handler: updateContent
    });
  };

  const handleOnScroll = useCallback(
    async (data: { isTop: boolean; isBottom: boolean }) => {
      const { isTop, isBottom } = data;
      setIsAtTop(isTop);
      console.log('scroll========', {
        isTop,
        isBottom,
        loadMoreDone: loadMoreDone.current,
        loading: loading,
        lineCount: lineCountRef.current
      });
      if (isBottom) {
        scrollPosRef.current = {
          pos: 'bottom',
          page: page
        };
      } else if (isTop) {
        scrollPosRef.current = {
          pos: 'top',
          page: page
        };
      } else {
        scrollPosRef.current = {
          pos: 'middle',
          page: page
        };
      }
      if (
        loading ||
        (logs.length > 0 &&
          lineCountRef.current < pageSize - 1 &&
          !loadMoreDone.current) ||
        !enableScorllLoad
      ) {
        return;
      }

      if (isTop && !loadMoreDone.current) {
        tail.current = undefined;
        createChunkConnection();
        loadMoreDone.current = true;
        isLoadingMoreRef.current = true;
      } else if (isTop && page <= totalPage && page > 1) {
        // getPrePage();
      } else if (isBottom && page < totalPage) {
        // getNextPage();
      }
    },
    [
      loading,
      logs.length,
      pageSize,
      enableScorllLoad,
      page,
      totalPage,
      setScrollPos,
      createChunkConnection
    ]
  );

  const debouncedScroll = useCallback(
    _.debounce(() => {
      if (scrollPos[0] === 'top' && scrollPosRef.current.pos === 'top') {
        logListRef.current?.scrollToTop();
      }
      if (scrollPosRef.current.pos === 'bottom') {
        logListRef.current?.scrollToBottom();
      }
    }, 150),
    [scrollPos]
  );

  useEffect(() => {
    createChunkConnection();
    return () => {
      chunkRequedtRef.current?.current?.abort?.();
    };
  }, [url, props.params]);

  useEffect(() => {
    debouncedScroll();
  }, [scrollPos]);

  useEffect(() => {
    logParseWorker.current?.terminate?.();

    logParseWorker.current = new Worker(
      // @ts-ignore
      new URL('./parse-worker.ts', import.meta.url),
      {
        type: 'module'
      }
    );

    logParseWorker.current.onmessage = (event: any) => {
      const { result, lines } = event.data;
      lineCountRef.current = lines;

      if (pageRef.current < 1) {
        pageRef.current = 1;
      }
      const start = (pageRef.current - 1) * pageSize;
      const end = pageRef.current * pageSize;
      const currentLogs = result.slice(start, end);
      totalPageRef.current = Math.ceil(result.length / pageSize);

      console.log(
        'lineCountRef.current+++++++++++',
        lineCountRef.current,
        result.length
      );
      setLogs(result);
      setTotalPage(totalPageRef.current);
      if (isLoadingMoreRef.current) {
        setPage(totalPageRef.current);
        pageRef.current = totalPageRef.current;
      } else {
        setPage(pageRef.current);
      }
      setCurrentData(currentLogs);
      debounceLoading();
    };

    return () => {
      if (logParseWorker.current) {
        logParseWorker.current.terminate();
      }
    };
  }, []);

  return (
    <div className="logs-viewer-wrap-w2">
      <div className="wrap">
        <div>
          <LogsList
            ref={logListRef}
            dataList={currentData}
            diffHeight={diffHeight}
            onScroll={handleOnScroll}
          ></LogsList>
        </div>
        <Spin
          spinning={loading}
          className={classNames({
            loading: loading
          })}
        ></Spin>
        {totalPage > 1 && (
          <div className="pg">
            <div
              className={classNames('pg-inner', {
                'at-top': isAtTop
              })}
            >
              <LogsPagination
                page={page}
                total={totalPage}
                pageSize={pageSize}
                onNext={getNextPage}
                onPrev={getPrePage}
                onBackend={handleonBackend}
              ></LogsPagination>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default memo(LogsViewer);
