import {
  cancelWatchRequest,
  clearWatchRequestId,
  updateWatchIDValue,
  updateWatchRequest
} from '@/atoms/watch-request';
import { WatchEventType } from '@/config';
import { request } from '@umijs/max';
import axios, { CancelTokenSource } from 'axios';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';

interface RequestConfig {
  url: string;
  handler: (data: any) => any;
  beforeReconnect?: () => void;
  params?: object;
  contentType?: 'json' | 'text';
}

export const sliceJsonStr = (text: string) => {
  if (!text) return [];
  const result: string[] = [];
  for (let i = 0, j = 0, start = 0; i < text.length; i += 1) {
    if (text.charAt(i) === '{') {
      j += 1;
    }
    if (text.charAt(i) === '}') {
      j -= 1;
    }
    if (j === 0 && i !== start) {
      result.push(text.slice(start, i + 1));
      start = i + 1;
    }
  }
  return result;
};

export const createAxiosToken = (): CancelTokenSource => {
  const { CancelToken } = axios;
  const source = CancelToken.source();
  return source;
};

export const sliceData = (data: string, loaded: number, loadedSize: any) => {
  const result = data.slice(loadedSize.current);
  loadedSize.current = loaded;
  return result;
};

const useSetChunkRequest = () => {
  const watchRequestList = window.__GPUSTACK_WATCH_REQUEST_CLEAR__.requestList;
  const [requestReadyState, setRequestReadyState] = useState(0);
  const axiosToken = useRef<any>(null);
  const requestConfig = useRef<any>({});
  const loaded = useRef(0);
  const total = useRef(0);
  const totalCount = 5;
  const retryCount = useRef(totalCount);
  const particalConfig = { params: {}, contentType: 'json' };
  const timer = useRef<any>(null);
  const loadedSize = useRef(0);
  const workerRef = useRef<any>(null);

  const reset = () => {
    loaded.current = 0;
    total.current = 0;
    loadedSize.current = 0;
    setRequestReadyState(0);
  };

  const createAxiosToken = () => {
    const { CancelToken } = axios;
    const source = CancelToken.source();
    const watchID = updateWatchIDValue();
    return {
      id: watchID,
      token: source.token,
      cancel() {
        source.cancel();
        clearWatchRequestId(watchID);
      }
    };
  };

  const resetResultSchema = (result: any[]) => {
    return _.map(result, (data: any) => {
      if (data.type === WatchEventType.DELETE) {
        data.ids = data.data?.id ? [data.data.id] : [];
      }
      data.collection = data.data ? [data.data] : [];
      return data;
    });
  };

  const axiosChunkRequest = async ({
    url,
    handler,
    beforeReconnect,
    params = {},
    contentType = 'json'
  }: RequestConfig) => {
    reset();
    axiosToken.current?.cancel?.();
    axiosToken.current = createAxiosToken();

    updateWatchRequest(axiosToken.current);
    if (watchRequestList.length >= 4) {
      cancelWatchRequest(watchRequestList.length - 4 || 1);
    }

    if (contentType === 'json') {
      workerRef.current?.terminate();

      workerRef.current = new Worker(
        // @ts-ignore
        new URL('./json-parser-worker.ts', import.meta.url)
      );

      workerRef.current.onmessage = function (event: any) {
        const validJSON = event.data;
        if (validJSON.length > 0) {
          const result = resetResultSchema(validJSON);
          handler(result);
        }
      };
    }

    try {
      const { request: requestData } = await request(url, {
        params: {
          ...params,
          watch: true
        },
        skipErrorHandler: true,
        getResponse: true,
        cancelToken: axiosToken.current.token,

        async onDownloadProgress(e) {
          const { response, readyState } = e.currentTarget;
          setRequestReadyState(readyState);
          loaded.current = e.loaded || 0;
          total.current = e.total || 0;

          if (contentType === 'json') {
            let currentRes = sliceData(response, e.loaded, loadedSize);
            workerRef.current.postMessage(currentRes);
          } else {
            handler(response);
          }
        }
      });
      setRequestReadyState(requestData?.readyState);
      if (retryCount.current > 0) {
        retryCount.current -= 1;
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        setRequestReadyState(4);
        if (retryCount.current > 0) {
          retryCount.current -= 1;
        }
      }
    }

    return axiosToken.current;
  };

  const setChunkRequest = (config: RequestConfig) => {
    requestConfig.current = { ...particalConfig, ...config };
    retryCount.current = totalCount;
    clearTimeout(timer.current);
    axiosChunkRequest(requestConfig.current);
    return axiosToken;
  };

  useEffect(() => {
    const handleUnload = () => {
      axiosToken.current?.cancel?.();
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      reset();
      requestConfig.current.beforeReconnect = null;
      axiosToken.current?.cancel?.();
      clearTimeout(timer.current);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  useEffect(() => {
    if (requestReadyState === 4 && retryCount.current > 0) {
      requestConfig.current.beforeReconnect?.();
      clearTimeout(timer.current);
      timer.current = setTimeout(
        () => {
          axiosChunkRequest(requestConfig.current);
        },
        2 ** (totalCount - retryCount.current) * 1000
      );
    }
  }, [requestReadyState]);

  return {
    setChunkRequest,
    createAxiosToken
  };
};

export default useSetChunkRequest;
