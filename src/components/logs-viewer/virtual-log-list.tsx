import useSetChunkFetch from '@/hooks/use-chunk-fetch';
import useSetChunkRequest from '@/hooks/use-chunk-request';
import { Spin } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { controlSeqRegex, replaceLineRegex } from './config';
import LogsInner from './logs-inner';
import LogsPagination from './logs-pagination';
import './styles/index.less';
import useLogsPagination from './use-logs-pagination';

interface LogsViewerProps {
  height: number;
  content?: string;
  url: string;
  params?: object;
  diffHeight?: number;
}
const LogsViewer: React.FC<LogsViewerProps> = (props) => {
  const { diffHeight, url } = props;
  const { pageSize, page, setPage, setTotalPage, totalPage } =
    useLogsPagination();
  const { setChunkRequest } = useSetChunkRequest();
  const { setChunkFetch } = useSetChunkFetch();
  const chunkRequedtRef = useRef<any>(null);
  const cacheDataRef = useRef<any>('');
  const [logs, setLogs] = useState<any[]>([]);
  const logParseWorker = useRef<any>(null);
  const tail = useRef<any>(pageSize);
  const isLoadend = useRef<any>(false);
  const [loading, setLoading] = useState(false);
  const [isAtTop, setIsAtTop] = useState(false);

  useEffect(() => {
    logParseWorker.current?.terminate?.();

    logParseWorker.current = new Worker(
      new URL('./parse-worker.ts', import.meta.url)
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
  }, 100);

  const isClean = useCallback((input: string) => {
    let match = controlSeqRegex.exec(input) || [];
    const command = match?.[3];
    const n = parseInt(match?.[1], 10) || 1;
    return command === 'J' && n === 2;
  }, []);

  const getLastPage = useCallback(
    (data: string) => {
      const list = _.split(data, '\n');
      isLoadend.current = list.length < pageSize;
      console.log('isLoadend.current===', isLoadend.current, list.length);
      if (list.length <= pageSize) {
        setTotalPage(1);
        return data;
      }

      setLoading(true);
      const totalPage = Math.ceil(list.length / pageSize);
      setTotalPage(totalPage);
      setPage(totalPage);
      const lastPage = list.slice(-pageSize).join('\n');
      debounceLoading();
      return lastPage;
    },
    [pageSize, setTotalPage, setPage, debounceLoading]
  );

  const getPrePage = useCallback(() => {
    const list = _.split(cacheDataRef.current, '\n');
    let newPage = page - 1;
    if (newPage < 1) {
      newPage = 1;
    }
    const start = (newPage - 1) * pageSize;
    const end = newPage * pageSize;
    const prePage = list.slice(start, end).join('\n');
    setPage(newPage);
    logParseWorker.current.postMessage({
      inputStr: prePage
    });
  }, [page, pageSize]);

  const getNextPage = useCallback(() => {
    const list = _.split(cacheDataRef.current, '\n');
    let newPage = page + 1;
    if (newPage > totalPage) {
      newPage = totalPage;
    }
    const start = (newPage - 1) * pageSize;
    const end = newPage * pageSize;
    const nextPage = list.slice(start, end).join('\n');
    setPage(newPage);
    logParseWorker.current.postMessage({
      inputStr: nextPage
    });
  }, [totalPage, page, pageSize]);

  const updateContent = useCallback(
    (inputStr: string) => {
      console.log('data========', inputStr);
      const data = inputStr.replace(replaceLineRegex, '\n');
      if (isClean(data)) {
        cacheDataRef.current = data;
      } else {
        cacheDataRef.current += data;
      }

      logParseWorker.current.postMessage({
        inputStr: getLastPage(cacheDataRef.current)
      });
    },
    [getLastPage]
  );

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
    (isTop: boolean) => {
      setIsAtTop(isTop && isLoadend.current);
      if (loading || isLoadend.current) {
        return;
      }
      if (isTop && !isLoadend.current) {
        tail.current = undefined;
        createChunkConnection();
      }
    },
    [loading, isLoadend.current]
  );

  useEffect(() => {
    createChunkConnection();
    return () => {
      chunkRequedtRef.current?.current?.abort?.();
    };
  }, [url, props.params]);

  return (
    <div className="logs-viewer-wrap-w2">
      <div className="wrap">
        <div className={classNames('content')}>
          <LogsInner
            data={logs}
            diffHeight={diffHeight}
            onScroll={handleOnScroll}
          ></LogsInner>
        </div>
        <Spin
          spinning={loading && isAtTop}
          className={classNames({
            loading: loading && isAtTop
          })}
        ></Spin>
        {totalPage > 1 && isAtTop && (
          <div className="pg">
            <LogsPagination
              page={page}
              total={totalPage}
              onNext={getNextPage}
              onPrev={getPrePage}
            ></LogsPagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(LogsViewer);
