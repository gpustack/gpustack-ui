import { throttle } from 'lodash';
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
    callback: (data: any) => void,
    delay = 200
  ) => {
    class BufferManager {
      private buffer: any[] = [];

      public add(data: any) {
        this.buffer.push(data);
      }

      public flush() {
        if (this.buffer.length > 0) {
          const currentBuffer = [...this.buffer];
          this.buffer = [];
          currentBuffer.forEach((item) => callback(item));
        }
      }

      public getBuffer() {
        return this.buffer;
      }
    }
    const bufferManager = new BufferManager();

    const throttledCallback = throttle(() => {
      bufferManager.flush();
    }, delay);

    let isReading = true;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        isReading = false;
        bufferManager.flush();
        break;
      }

      try {
        const chunk = decoder.decode(value, { stream: true });
        bufferManager.add(chunk);
        throttledCallback();
      } catch (error) {
        console.log('error:', error);
      }
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
