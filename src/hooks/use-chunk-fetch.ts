import { throttle } from 'lodash';
import qs from 'query-string';
import { useEffect, useRef } from 'react';

export interface HandlerOptions {
  isComplete?: boolean | null;
  percent?: number;
  progress?: number;
  contentLength?: number | null;
}

type HandlerFunction = (data: any, options?: HandlerOptions) => any;
interface RequestConfig {
  url: string;
  handler: HandlerFunction;
  errorHandler?: (error: any) => void;
  beforeReconnect?: () => void;
  params?: object;
  watch?: boolean;
  contentType?: 'json' | 'text';
}

const useSetChunkFetch = () => {
  const axiosToken = useRef<any>(null);
  const requestConfig = useRef<any>({});
  const chunkDataRef = useRef<any>([]);
  const readTextEventStreamData = async (
    response: Response,
    callback: HandlerFunction,
    delay = 200
  ) => {
    class BufferManager {
      private buffer: any[] = [];
      private contentLength: number | null = null;
      private progress: number = 0;
      private percent: number = 0;

      constructor(private options: { contentLength?: string | null }) {
        this.contentLength = options.contentLength
          ? parseInt(options.contentLength, 10)
          : null;
      }

      private updateProgress(data: any) {
        if (this.contentLength) {
          this.progress += new TextEncoder().encode(data).length;
          this.percent = Math.floor((this.progress / this.contentLength) * 100);
        }
      }

      public add(data: any) {
        this.buffer.push(data);
        this.updateProgress(data);
      }

      public flush(done?: boolean) {
        if (this.buffer.length > 0) {
          const currentBuffer = [...this.buffer];
          this.buffer = [];
          currentBuffer.forEach((item, i) => {
            const isComplete = i === currentBuffer.length - 1 && done;
            callback(item, {
              isComplete: isComplete || this.percent === 100,
              percent: this.percent,
              progress: this.progress,
              contentLength: this.contentLength
            });
          });
        }
      }

      public getBuffer() {
        return this.buffer;
      }
    }

    const reader =
      response?.body?.getReader() as ReadableStreamDefaultReader<Uint8Array>;
    const decoder = new TextDecoder('utf-8');
    const contentLength = response.headers.get('content-length');

    const bufferManager = new BufferManager({
      contentLength: contentLength
    });

    const throttledCallback = throttle(() => {
      bufferManager.flush();
    }, delay);

    let isReading = true;

    while (isReading) {
      const { done, value } = await reader.read();

      if (done) {
        isReading = false;
        bufferManager.flush(done);
        break;
      }

      try {
        const chunk = decoder.decode(value, { stream: true });
        bufferManager.add(chunk);
        throttledCallback();
      } catch (error) {
        console.log('error============:', error);
      }
    }
  };

  const fetchChunkRequest = async ({
    url,
    handler,
    errorHandler,
    watch,
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
        const error = await response.json();
        if (errorHandler) {
          errorHandler(error);
        } else {
          handler(error?.message);
        }
        return;
      }

      await readTextEventStreamData(response, handler);

      console.log('chunkDataRef.current===1', chunkDataRef.current);
    } catch (error) {
      // handle error: catched in request interceptor
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
