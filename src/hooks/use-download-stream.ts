import useSetChunkFetch, { HandlerOptions } from '@/hooks/use-chunk-fetch';
import { message } from 'antd';
import { useEffect, useRef } from 'react';

export default function useDownloadStream() {
  const chunkRequedtRef = useRef<any>(null);
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
    const { isComplete } = options || {};

    downloadNotificationRef.current?.({
      ...options,
      duration: isComplete ? 1 : null,
      filename: filename.current
    });

    logParseWorker.current?.postMessage({
      inputStr: data,
      page: 1,
      reset: clearScreen.current,
      isComplete: isComplete,
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

      downloadNotificationRef.current?.({
        filename: filename.current
      });

      chunkRequedtRef.current?.current?.abort?.();

      chunkRequedtRef.current = setChunkFetch({
        url,
        params,
        watch: false,
        contentType: 'text',
        errorHandler: handleError,
        handler: updateContent
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
      const { result } = event.data;
      downloadFile(result);
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
