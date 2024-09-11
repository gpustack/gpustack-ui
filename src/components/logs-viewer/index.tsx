import useSetChunkRequest from '@/hooks/use-chunk-request';
import useContainerScroll from '@/hooks/use-container-scorll';
import Convert from 'ansi-to-html';
import classNames from 'classnames';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import './index.less';

interface LogsViewerProps {
  height: number;
  content?: string;
  url: string;
  params?: object;
}
const LogsViewer: React.FC<LogsViewerProps> = (props) => {
  const { height, content, url } = props;
  const [nowrap, setNowrap] = useState(false);
  const [logsContent, setLogsContent] = useState<string[]>([]);
  const { setChunkRequest } = useSetChunkRequest();
  const chunkRequedtRef = useRef<any>(null);
  const scroller = useRef<any>(null);
  const { updateScrollerPosition, handleContentWheel } = useContainerScroll(
    scroller,
    { toBottom: true }
  );

  const convert = new Convert({
    newline: true,
    escapeXML: true,
    stream: false
  });

  useEffect(() => {
    updateScrollerPosition();
  }, [logsContent]);

  const ansiEscapeRegex = /(\x1B\[[0-9;]*[A-Za-z])+$/;

  const endsWithAnsiEscapeSequence = useCallback((str: string) => {
    return ansiEscapeRegex.test(str);
  }, []);
  const getCursorUpLines = useCallback((str: string) => {
    const matches = str.match(/(?:\x1B\[A)+$/);

    return matches ? matches[0].length / 3 : 0;
  }, []);

  const removeDot = useCallback((str: string) => {
    return str.replace(/^\(.*?\)/, '');
  }, []);
  const replaceAnsiEscapeSequence = useCallback((str: string) => {
    const res = str.replace(ansiEscapeRegex, '');
    return removeDot(res);
  }, []);

  const handleRControl = useCallback((str: string) => {
    if (str.includes('\r')) {
      const parts = str.split('\r');
      const lastLine = parts[parts.length - 1];
      return lastLine;
    }
    return str;
  }, []);

  const parseHtmlStr = useCallback((logStr: string) => {
    const result: string[] = [];
    const lines = logStr.split('\n').filter((line) => line.trim() !== '');
    // const lines = text;
    lines.forEach((line: string, index: number) => {
      const upCount = getCursorUpLines(line);
      console.log('line=========1', {
        line,
        upCount,
        result
      });
      if (endsWithAnsiEscapeSequence(line)) {
        const newLine = handleRControl(line);
        const val = removeDot(newLine);
        if (result.length < upCount) {
          result.push('');
        }
        if (upCount) {
          console.log('line=========0', {
            line,
            upCount,
            result
          });
          const placeIndex = result.length - upCount;
          result[placeIndex] = replaceAnsiEscapeSequence(val);
        } else {
          result.push(val);
        }
      } else {
        const val = handleRControl(line);
        result.push(val);
      }
    });
    return result.map((item) => {
      return convert.toHtml(item);
    });
  }, []);

  const updateContent = (newVal: string) => {
    const list = parseHtmlStr(newVal);
    setLogsContent(list);
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

  useEffect(() => {
    createChunkConnection();
    return () => {
      chunkRequedtRef.current?.current?.cancel?.();
    };
  }, [url, props.params]);

  return (
    <div className="logs-viewer-wrap-w2">
      <div
        className="wrap"
        style={{ height: height }}
        ref={scroller}
        onWheel={handleContentWheel}
      >
        <div className={classNames('content', { 'line-break': nowrap })}>
          <div className="text">
            {logsContent.map((item, index) => {
              return (
                <div key={index} dangerouslySetInnerHTML={{ __html: item }} />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(LogsViewer);
