import useSetChunkRequest from '@/hooks/use-chunk-request';
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

  const convert = new Convert();

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
      <div className="wrap" style={{ height: height }}>
        <div className={classNames('content', { 'line-break': nowrap })}>
          <div className="text">{logsContent}</div>
        </div>
      </div>
    </div>
  );
};

export default LogsViewer;
