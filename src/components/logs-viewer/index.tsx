import useSetChunkFetch from '@/hooks/use-chunk-fetch';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import '@xterm/xterm/css/xterm.css';
import classNames from 'classnames';
import _ from 'lodash';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import './index.less';
import useParseAnsi from './parse-ansi';

interface LogsViewerProps {
  height: number;
  content?: string;
  url: string;
  params?: object;
}
const LogsViewer: React.FC<LogsViewerProps> = (props) => {
  const { height, url } = props;
  const { initialize, updateScrollerPosition } = useOverlayScroller({
    theme: 'os-theme-light'
  });
  const { isClean, parseAnsi } = useParseAnsi();
  const { setChunkFetch } = useSetChunkFetch();
  const chunkRequedtRef = useRef<any>(null);
  const scroller = useRef<any>({});
  const cacheDataRef = useRef<any>('');
  const uidRef = useRef<any>(0);
  const [logs, setLogs] = useState<any[]>([]);
  const autoScroll = useRef(true);
  const stopScroll = useRef(false);

  const setId = () => {
    uidRef.current += 1;
    return uidRef.current;
  };

  const clearScreen = () => {
    cacheDataRef.current = '';
  };

  const updateContent = useCallback(
    (data: string) => {
      if (isClean(data)) {
        cacheDataRef.current = data;
      } else {
        cacheDataRef.current += data;
      }
      const res = parseAnsi(cacheDataRef.current, setId, clearScreen);
      setLogs(res);
    },
    [setLogs, setId]
  );

  const createChunkConnection = async () => {
    chunkRequedtRef.current?.current?.abort?.();
    chunkRequedtRef.current = setChunkFetch({
      url,
      params: {
        ...props.params,
        watch: true
      },
      contentType: 'text',
      handler: updateContent
    });
  };

  const debounceResetStopScroll = _.debounce(() => {
    stopScroll.current = false;
  }, 3000);
  const handleOnWheel = useCallback(
    (e: any) => {
      stopScroll.current = true;
      debounceResetStopScroll();
    },
    [debounceResetStopScroll]
  );

  useEffect(() => {
    createChunkConnection();
    return () => {
      chunkRequedtRef.current?.current?.abort?.();
    };
  }, [url, props.params]);

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [scroller.current, initialize]);

  useEffect(() => {
    if (logs.length && !stopScroll.current) {
      updateScrollerPosition(0);
    }
  }, [logs, autoScroll.current, stopScroll.current]);

  return (
    <div className="logs-viewer-wrap-w2">
      <div
        className="wrap"
        style={{ height: height }}
        ref={scroller}
        onWheel={handleOnWheel}
      >
        <div className={classNames('content')}>
          {_.map(logs, (item: any, index: number) => {
            return (
              <div key={item.uid} className="text">
                {item.content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default memo(LogsViewer);
