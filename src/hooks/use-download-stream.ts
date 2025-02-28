import useSetChunkFetch, { HandlerOptions } from '@/hooks/use-chunk-fetch';
import { message } from 'antd';
import { useEffect, useRef } from 'react';

export default function useDownloadStream() {
  const chunkRequestRef = useRef<any>(null);
  const logParseWorker = useRef<any>(null);
  const clearScreen = useRef(false);
  const filename = useRef('log');
  const downloadNotificationRef = useRef<any>(null);

  const { setChunkFetch } = useSetChunkFetch();

  const downloadFile = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename.current;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const updateContent = (data: string, options?: HandlerOptions) => {
    const { isComplete, percent } = options || {};

    logParseWorker.current?.postMessage({
      inputStr: data,
      reset: clearScreen.current,
      isComplete: isComplete,
      percent: percent,
      chunked: false
    });
    clearScreen.current = false;
  };

  const handleError = (error: any) => {
    const errorMsg = error?.message || error;
    const msg =
      typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
    message.error(msg);
    downloadNotificationRef.current?.({
      duration: 1,
      percent: 0,
      filename: filename.current
    });
  };

  const downloadStream = async (props: {
    data?: any;
    url: string;
    params?: any;
    signal?: AbortSignal;
    method?: string;
    headers?: any;
    filename?: string;
    downloadNotification?: (data: any) => void;
  }) => {
    try {
      clearScreen.current = true;
      filename.current = props.filename || 'log';
      downloadNotificationRef.current = props.downloadNotification;
      const { params, url } = props;

      chunkRequestRef.current?.current?.abort?.();

      chunkRequestRef.current = setChunkFetch({
        url,
        params,
        watch: false,
        contentType: 'text',
        errorHandler: handleError,
        handler: updateContent
      });
      downloadNotificationRef.current?.({
        filename: filename.current,
        duration: null,
        chunkRequestRef: chunkRequestRef.current
      });
    } catch (error) {
      //
      downloadNotificationRef.current?.({
        duration: 1,
        percent: 0,
        filename: filename.current
      });
    }
  };

  useEffect(() => {
    logParseWorker.current?.terminate?.();

    logParseWorker.current = new Worker(
      // @ts-ignore
      new URL('@/components/logs-viewer/parse-worker.ts', import.meta.url),
      {
        type: 'module'
      }
    );

    logParseWorker.current.onmessage = (event: any) => {
      const { result, isComplete, percent } = event.data;

      const isAborted = chunkRequestRef.current?.current?.signal?.aborted;
      if (!isComplete && !isAborted) {
        downloadNotificationRef.current?.({
          percent: percent,
          duration: null,
          filename: filename.current,
          chunkRequestRef: chunkRequestRef.current
        });
      } else if (isComplete && !isAborted) {
        downloadNotificationRef.current?.({
          duration: 1,
          percent: 100,
          filename: filename.current
        });
        downloadFile(result);
      }
    };

    return () => {
      if (logParseWorker.current) {
        logParseWorker.current.terminate();
      }
    };
  }, []);

  return {
    downloadStream
  };
}
