import { convertFileSize } from '@/utils';
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

async function parseErrorResponse(response: Response) {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();
      return { message: text || 'Unknown error' };
    }
  } catch (e) {
    return { message: 'Failed to parse error response' };
  }
}

const useSetChunkFetch = () => {
  const axiosToken = useRef<any>(null);
  const requestConfig = useRef<any>({});
  const chunkDataRef = useRef<any>([]);

  const readTextEventStreamData = async (
    response: Response,
    callback: HandlerFunction,
    delay = 100
  ) => {
    class BufferManager {
      private buffer: any[] = [];
      private contentLength: number | null = null;
      private progress: number = 0;
      private percent: number = 0;
      private speedHistory: number[] = [];
      private maxHistory = 5;
      private lastTime: number = performance.now();
      private lastBytes: number = 0;
      private totalBytes: number = 0;
      private avgSpeed: number = 0;

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

      private logSpeed(speedBps: number) {
        this.speedHistory.push(speedBps);
        if (this.speedHistory.length > this.maxHistory) {
          this.speedHistory.shift();
        }
        this.avgSpeed =
          this.speedHistory.reduce((a, b) => a + b, 0) /
          this.speedHistory.length;
        console.log(`瞬时均值: ${convertFileSize(this.avgSpeed)}/s`);
      }

      public updateSpeed(bytes: number) {
        const now = performance.now();
        const elapsed = (now - this.lastTime) / 1000;
        if (elapsed > 0.3) {
          const speed = (this.totalBytes + bytes - this.lastBytes) / elapsed;
          this.logSpeed(speed);
          this.lastTime = now;
          this.lastBytes = this.totalBytes + bytes;
        }
      }

      public add(data: any) {
        this.buffer.push(data);
        this.updateProgress(data);
      }

      public async flush(done?: boolean) {
        if (this.buffer.length > 0) {
          while (this.buffer.length > 0) {
            const item = this.buffer.shift()!;
            const isComplete = this.buffer.length === 0 && done;

            await new Promise<void>((resolve) => {
              callback(item, {
                isComplete: isComplete || this.percent === 100,
                percent: this.percent,
                progress: this.progress,
                contentLength: this.contentLength
              });
              resolve();
            });
          }
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

    const throttledCallback = throttle(async () => {
      await bufferManager.flush();
    }, delay);

    let isReading = true;

    while (isReading) {
      const { done, value } = await reader.read();

      try {
        const chunk = decoder.decode(value, { stream: true });
        bufferManager.add(chunk);
        throttledCallback();
      } catch (error) {
        // handle error
      }

      if (done) {
        isReading = false;
        await bufferManager.flush(done);
        throttledCallback.cancel();
        reader.releaseLock();
        break;
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
        const error = await parseErrorResponse(response);
        if (errorHandler) {
          errorHandler(error);
        } else {
          handler(error?.message);
        }
        return;
      }

      await readTextEventStreamData(response, handler);
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
