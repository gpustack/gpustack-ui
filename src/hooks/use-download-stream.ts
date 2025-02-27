import useSetChunkFetch, { HandlerOptions } from '@/hooks/use-chunk-fetch';
import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';

export default function useDownloadStream() {
  const chunkRequedtRef = useRef<any>(null);
  const logParseWorker = useRef<any>(null);
  const clearScreen = useRef(false);
  const filename = useRef('log');
  const { setChunkFetch } = useSetChunkFetch();

  const downloadFile = (content: string) => {
    const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
    const fileName = `${filename.current}_${timestamp}.txt`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const updateContent = (data: string, options?: HandlerOptions) => {
    const { isComplete } = options || {};
    logParseWorker.current?.postMessage({
      inputStr: data,
      page: 1,
      reset: clearScreen.current,
      isComplete: isComplete,
      chunked: false
    });
    clearScreen.current = false;
  };

  const downloadStream = async (props: {
    data?: any;
    url: string;
    params?: any;
    signal?: AbortSignal;
    method?: string;
    headers?: any;
    filename?: string;
  }) => {
    clearScreen.current = true;
    filename.current = props.filename || 'log';
    const { params, url } = props;

    chunkRequedtRef.current?.current?.abort?.();

    chunkRequedtRef.current = setChunkFetch({
      url,
      params,
      watch: false,
      contentType: 'text',
      handler: updateContent
    });
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
