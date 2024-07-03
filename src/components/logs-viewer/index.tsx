import useSetChunkRequest from '@/hooks/use-chunk-request';
import useContainerScroll from '@/hooks/use-container-scorll';
import Convert from 'ansi-to-html';
import classNames from 'classnames';
import hasAnsi from 'has-ansi';
import { useEffect, useRef, useState } from 'react';
import './index.less';

interface LogsViewerProps {
  height: number;
  content: string;
  url: string;
  params?: object;
}
const LogsViewer: React.FC<LogsViewerProps> = (props) => {
  const { height, content, url } = props;
  const [nowrap, setNowrap] = useState(false);
  const [logsContent, setLogsContent] = useState(content);
  const { setChunkRequest } = useSetChunkRequest();
  const chunkRequedtRef = useRef<any>(null);
  const scroller = useRef<any>(null);
  const { updateScrollerPosition, handleContentWheel } = useContainerScroll(
    scroller,
    { toBottom: true }
  );

  const convert = new Convert();

  useEffect(() => {
    updateScrollerPosition();
  }, [logsContent]);

  const updateContent = (newVal: string) => {
    if (hasAnsi(newVal)) {
      const htmlStr = `${convert.toHtml(newVal)}`;
      setLogsContent(htmlStr);
    } else {
      setLogsContent(newVal);
    }
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
          <div className="text">{logsContent}</div>
        </div>
      </div>
    </div>
  );
};

export default LogsViewer;
