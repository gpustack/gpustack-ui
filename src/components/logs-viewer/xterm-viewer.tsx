import useSetChunkRequest from '@/hooks/use-chunk-request';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import classNames from 'classnames';
import _ from 'lodash';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { replaceLineRegex } from './config';
import './styles/xterm-viewer.less';
import useSize from './use-size';

interface LogsViewerProps {
  height: number;
  content?: string;
  url: string;
  ref?: any;
  params?: object;
}
const LogsViewer: React.FC<LogsViewerProps> = forwardRef((props, ref) => {
  const { height, content, url } = props;
  const { setChunkRequest } = useSetChunkRequest();
  const chunkRequedtRef = useRef<any>(null);
  const scroller = useRef<any>({});
  const termRef = useRef<any>({});
  const termwrapRef = useRef<any>({});
  const fitAddonRef = useRef<any>({});
  const cacheDataRef = useRef<any>(null);
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const size = useSize(scroller);
  const logParseWorker = useRef<any>(null);
  const lineCountRef = useRef(0);

  useImperativeHandle(ref, () => ({
    abort() {
      chunkRequedtRef.current?.current?.abort?.();
      logParseWorker.current?.terminate?.();
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
      const { result, lines } = event.data;
      lineCountRef.current = lines;
      // setLogs(result.join('\n'));
      console.log('res+++++++++++', result);
      const data = result.map((item: any) => item.content);
      termRef.current?.write?.(data.join('\n'));
    };

    return () => {
      if (logParseWorker.current) {
        logParseWorker.current.terminate();
      }
    };
  }, []);

  const throttleScroll = _.throttle(() => {
    termRef.current?.scrollToBottom?.();
  }, 100);

  const debounceLoading = _.debounce(() => {
    setLoading(false);
  }, 200);

  const updateContent = (inputStr: string) => {
    const data = inputStr.replace(replaceLineRegex, '\n');
    cacheDataRef.current = data;
    setLoading(true);
    logParseWorker.current.postMessage({
      inputStr: data
    });
    debounceLoading();
  };

  const fitTerm = () => {
    fitAddonRef.current?.fit?.();
  };

  const createChunkConnection = async () => {
    chunkRequedtRef.current?.current?.cancel?.();
    chunkRequedtRef.current = setChunkRequest({
      url,
      params: {
        ...props.params,
        watch: true
      },
      contentType: 'text',
      handler: updateContent
    });
  };

  const initTerm = () => {
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

    // add event
    // termRef.current.onLineFeed((e: any) => {
    //   if (cacheDataRef.current) {
    //     throttleScroll();
    //   }
    // });
  };

  const handleResize = _.throttle(() => {
    fitTerm();
  }, 100);

  useEffect(() => {
    createChunkConnection();
    return () => {
      chunkRequedtRef.current?.current?.cancel?.();
    };
  }, [url, props.params]);

  useEffect(() => {
    if (termwrapRef.current) {
      initTerm();
    }
    return () => {
      termRef.current?.dispose?.();
    };
  }, [termwrapRef.current]);

  useEffect(() => {
    if (size) {
      handleResize();
    }
  }, [size]);

  useEffect(() => {
    // throttleScroll();
  }, [logs]);

  return (
    <div className="logs-viewer-wrap-w2">
      <div className="wrap" style={{ height: height }} ref={scroller}>
        <div className={classNames('content')}>
          <div className="text" ref={termwrapRef}></div>
        </div>
      </div>
    </div>
  );
});

export default LogsViewer;
