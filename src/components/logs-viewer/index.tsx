import useSetChunkRequest from '@/hooks/use-chunk-request';
import useContainerScroll from '@/hooks/use-container-scorll';
import Convert from 'ansi-to-html';
import classNames from 'classnames';
import _ from 'lodash';
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
    escapeXML: true
  });

  useEffect(() => {
    updateScrollerPosition();
  }, [logsContent]);

  const getTrailingACount = useCallback((str: string) => {
    const match = str.match(/A+$/);
    return match ? match[0].length : 0;
  }, []);
  const parseHtmlStr = useCallback((htmlStr: string) => {
    const result: string[] = [];
    const htmlStrArr = _.filter(
      htmlStr?.split?.('<br/>'),
      (item: string) => item
    );

    htmlStrArr.forEach((item: string, index: number) => {
      const aCount = getTrailingACount(item);
      if (aCount > 0) {
        console.log('aCount========', {
          htmlStrArr,
          aCount,
          item,
          length: result.length,
          result: [...result]
        });
        const placeIndex = result.length - aCount;
        result[placeIndex] = item.slice(0, -aCount);
      } else {
        result.push(item);
      }
    });

    return result;
  }, []);

  const updateContent = (newVal: string) => {
    const htmlStr = `${convert.toHtml(newVal)}`;
    const list = parseHtmlStr(htmlStr);
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
