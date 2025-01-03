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
import { controlSeqRegex, replaceLineRegex } from './config';
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
  const tail = useRef<any>(defaultTail);
  const [isLoadend, setIsLoadend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAtTop, setIsAtTop] = useState(false);
  const [scrollPos, setScrollPos] = useState<any[]>([]);
  const logListRef = useRef<any>(null);
  const loadMoreDone = useRef(false);
  const pageRef = useRef<any>(page);
  const totalPageRef = useRef<any>(totalPage);

  useImperativeHandle(ref, () => ({
    abort() {
      chunkRequedtRef.current?.current?.abort?.();
    }
  }));

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
      const res = event.data;
      setLogs(res);
    };

    return () => {
      if (logParseWorker.current) {
        logParseWorker.current.terminate();
      }
    };
  }, [setLogs, logParseWorker.current]);

  const debounceLoading = _.debounce(() => {
    setLoading(false);
  }, 200);

  const isClean = useCallback((input: string) => {
    let match = controlSeqRegex.exec(input) || [];
    const command = match?.[3];
    const n = parseInt(match?.[1], 10) || 1;
    return command === 'J' && n === 2;
  }, []);

  const getLastPage = (data: string) => {
    const list = _.split(data.trim(), '\n');

    if (!enableScorllLoad) {
      return list.join('\n');
    }

    if (list.length <= pageSize) {
      setTotalPage(1);
      return data;
    }

    setLoading(true);
    const totalPage = Math.ceil(list.length / pageSize);
    setTotalPage(totalPage);
    setPage(() => totalPage);
    pageRef.current = totalPage;
    totalPageRef.current = totalPage;
    const lastPage = list.slice(-pageSize).join('\n');
    console.log('list.length===', list.length, totalPage, page);
    debounceLoading();
    return lastPage;
  };

  const getCurrentPage = () => {
    const list = _.split(cacheDataRef.current.trim(), '\n');
    let newPage = page;
    if (newPage < 1) {
      newPage = 1;
    }
    console.log('currentpage===', newPage);
    const start = (newPage - 1) * pageSize;
    const end = newPage * pageSize;
    const currentPage = list.slice(start, end).join('\n');
    setPage(() => newPage);
    setScrollPos(['bottom', newPage]);
    pageRef.current = newPage;
    logParseWorker.current.postMessage({
      inputStr: currentPage
    });
  };

  const getPrePage = useCallback(() => {
    const list = _.split(cacheDataRef.current.trim(), '\n');
    let newPage = page - 1;
    if (newPage < 1) {
      newPage = 1;
    }
    const start = (newPage - 1) * pageSize;
    const end = newPage * pageSize;
    const prePage = list.slice(start, end).join('\n');
    console.log('prePage===', newPage);
    setPage(() => newPage);
    setScrollPos(['bottom', newPage]);
    pageRef.current = newPage;
    logParseWorker.current.postMessage({
      inputStr: prePage
    });
  }, [page, pageSize]);

  const getNextPage = useCallback(() => {
    const list = _.split(cacheDataRef.current.trim(), '\n');
    let newPage = page + 1;
    if (newPage > totalPage) {
      newPage = totalPage;
    }
    const start = (newPage - 1) * pageSize;
    const end = newPage * pageSize;
    const nextPage = list.slice(start, end).join('\n');
    console.log('nextPage===', newPage);
    setPage(() => newPage);
    setScrollPos(['top', newPage]);
    pageRef.current = newPage;
    logParseWorker.current.postMessage({
      inputStr: nextPage
    });
  }, [totalPage, page, pageSize]);

  const debounceParseData = _.debounce(() => {
    if (pageRef.current === totalPageRef.current) {
      logParseWorker.current.postMessage({
        inputStr: getLastPage(cacheDataRef.current)
      });
    } else {
      getCurrentPage();
    }
  }, 100);

  const updateContent = (inputStr: string) => {
    console.log('inputStr===', inputStr);
    const data = inputStr.replace(replaceLineRegex, '\n');
    if (isClean(data)) {
      cacheDataRef.current = data;
    } else {
      cacheDataRef.current += data;
    }
    console.log('page===', pageRef.current, totalPageRef.current);
    debounceParseData();
  };

  const createChunkConnection = async () => {
    cacheDataRef.current = '';
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
      if (
        loading ||
        (logs.length > 0 && logs.length < pageSize && !loadMoreDone.current) ||
        !enableScorllLoad
      ) {
        return;
      }

      if (isTop && !loadMoreDone.current) {
        tail.current = undefined;
        createChunkConnection();
        loadMoreDone.current = true;
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
      createChunkConnection
    ]
  );

  const debouncedScroll = useCallback(
    _.debounce(() => {
      if (scrollPos[0] === 'top') {
        logListRef.current?.scrollToTop();
      }
      if (scrollPos[0] === 'bottom') {
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

  return (
    <div className="logs-viewer-wrap-w2">
      <div className="wrap">
        <div className={classNames('content')}>
          <LogsList
            ref={logListRef}
            dataList={logs}
            diffHeight={diffHeight}
            onScroll={handleOnScroll}
          ></LogsList>
        </div>
        <Spin
          spinning={loading && isAtTop}
          className={classNames({
            loading: loading && isAtTop
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
              ></LogsPagination>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default memo(LogsViewer);
