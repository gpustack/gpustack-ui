import { split } from 'lodash';
import qs from 'query-string';
import { useEffect, useRef } from 'react';

interface RequestConfig {
  url: string;
  handler: (data: any) => any;
  beforeReconnect?: () => void;
  params?: object;
  byLine?: boolean;
  watch?: boolean;
  contentType?: 'json' | 'text';
}

const useSetChunkFetch = () => {
  const axiosToken = useRef<any>(null);
  const requestConfig = useRef<any>({});
  const chunkDataRef = useRef<any>([]);
  const bufferCacheRef = useRef<any>('');

  const readTextEventStreamData = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder,
    callback: (data: any) => void
  ) => {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }

    const chunk = decoder.decode(value, { stream: true });

    callback(chunk);
    // console.log('chunkDataRef.current===2', chunkDataRef.current);

    await readTextEventStreamData(reader, decoder, callback);
  };

  const readTextEventStreamDataByLine = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder,
    callback: (data: any) => void
  ) => {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }

    bufferCacheRef.current += decoder.decode(value, { stream: true });
    const lines = split(bufferCacheRef.current, /\r?\n/);
    bufferCacheRef.current = lines.pop();
    for (const line of lines) {
      callback(line);
    }

    await readTextEventStreamDataByLine(reader, decoder, callback);
  };

  const readTextEventStreamDataByLineWithBuffer = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder,
    callback: (data: any) => void
  ) => {
    await readTextEventStreamDataByLine(reader, decoder, callback);

    if (bufferCacheRef.current.length > 0) {
      callback(bufferCacheRef.current);
    }
  };

  const fetchChunkRequest = async ({
    url,
    handler,
    watch,
    byLine = false,
    params = {}
  }: RequestConfig) => {
    axiosToken.current?.abort?.();
    axiosToken.current = new AbortController();
    try {
      const response = await fetch(
        `v1${url}?${qs.stringify({
          ...params,
          watch: watch === undefined ? true : watch
        })}`,
        {
          method: 'GET',
          body: null,
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          signal: axiosToken.current.signal
        }
      );

      if (!response.ok) {
        return;
      }

      const reader =
        response?.body?.getReader() as ReadableStreamDefaultReader<Uint8Array>;
      const decoder = new TextDecoder('utf-8');

      await readTextEventStreamData(reader, decoder, handler);

      console.log('chunkDataRef.current===1', chunkDataRef.current);
    } catch (error) {
      // handle error
      console.log('error============', error);
    }

    return axiosToken.current;
  };

  const setChunkFetch = (config: RequestConfig) => {
    requestConfig.current = { ...config };
    fetchChunkRequest(requestConfig.current);
    return axiosToken;
  };

  useEffect(() => {
    const handleUnload = () => {
      axiosToken.current?.abort?.();
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      axiosToken.current?.abort?.();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return {
    setChunkFetch
  };
};

export default useSetChunkFetch;
