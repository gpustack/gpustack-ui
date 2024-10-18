import useSetChunkFetch from '@/hooks/use-chunk-fetch';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import classNames from 'classnames';
import _ from 'lodash';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import './index.less';
import parseAnsi from './parse-ansi';

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
  const { setChunkFetch } = useSetChunkFetch();
  const chunkRequedtRef = useRef<any>(null);
  const scroller = useRef<any>({});
  const termRef = useRef<any>({});
  const termwrapRef = useRef<any>({});
  const fitAddonRef = useRef<any>({});
  const cacheDataRef = useRef<any>('');
  const uidRef = useRef<any>(0);
  const [logs, setLogs] = useState<any[]>([]);

  const setId = () => {
    uidRef.current += 1;
    return uidRef.current;
  };

  const clearScreen = () => {
    cacheDataRef.current = '';
  };

  const updateContent = useCallback(
    (data: string) => {
      cacheDataRef.current += data;
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

  const initTerm = useCallback(() => {
    termRef.current?.clear?.();
    termRef.current?.dispose?.();
    termRef.current = new Terminal({
      lineHeight: 1.2,
      fontSize: 13,
      fontFamily:
        "monospace,Menlo,Courier,'Courier New',Consolas,Monaco, 'Liberation Mono'",
      disableStdin: true,
      convertEol: true,
      theme: {
        background: '#1e1e1e',
        foreground: 'rgba(255,255,255,0.8)'
      },
      cursorInactiveStyle: 'none',
      smoothScrollDuration: 0
    });
    fitAddonRef.current = new FitAddon();
    termRef.current.loadAddon(fitAddonRef.current);
    termRef.current.open(termwrapRef.current);
  }, [termwrapRef.current]);

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
    if (logs) {
      updateScrollerPosition();
    }
  }, [logs]);

  return (
    <div className="logs-viewer-wrap-w2">
      <div className="wrap" style={{ height: height }} ref={scroller}>
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
