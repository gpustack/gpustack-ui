import { WatchEventType } from '@/config';
import { request } from '@umijs/max';
import axios from 'axios';
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

export const parseJsonStr = (list: string[]) => {
  return _.map(list, (str: string) => {
    return JSON.parse(str);
  });
};

const findMatchingClosingBracket = (inputStr: string, startIndex: number) => {
  let count = 0;
  for (let i = startIndex; i < inputStr.length; i += 1) {
    if (inputStr[i] === '{') {
      count += 1;
    } else if (inputStr[i] === '}') {
      count -= 1;
    }

    if (count === 0) {
      return i;
    }
  }
  return -1;
};

const findValidJSONStrings = (inputStr: string) => {
  const validJSONStrings: any[] = [];
  let startIndex = 0;

  while (startIndex < inputStr.length) {
    const openingBraceIndex = inputStr.indexOf('{', startIndex);
    if (openingBraceIndex === -1) {
      break; // No more opening braces
    }

    const closingBraceIndex = findMatchingClosingBracket(
      inputStr,
      openingBraceIndex
    );
    if (closingBraceIndex === -1) {
      // If no matching closing brace, set startIndex to next character
      startIndex = openingBraceIndex + 1;
    } else {
      const jsonString = inputStr.substring(
        openingBraceIndex,
        closingBraceIndex + 1
      );
      try {
        const data = JSON.parse(jsonString);
        validJSONStrings.push(data);
      } catch (error) {
        // Ignore invalid JSON
      }

      startIndex = closingBraceIndex + 1;
    }
  }

  return validJSONStrings;
};

const parseData = (data: string) => {
  const res = findValidJSONStrings(data);
  return res;
};

export const createAxiosToken = () => {
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
  const [requestReadyState, setRequestReadyState] = useState(3);
  const axiosToken = useRef<any>(null);
  const requestConfig = useRef<any>({});
  const loaded = useRef(0);
  const total = useRef(0);
  const totalCount = 5;
  const retryCount = useRef(totalCount);
  const particalConfig = { params: {}, contentType: 'json' };
  const timer = useRef<any>(null);
  const loadedSize = useRef(0);

  const reset = () => {
    loaded.current = 0;
    total.current = 0;
    loadedSize.current = 0;
    setRequestReadyState(3);
  };

  const resetResultSchema = (result: any[]) => {
    return _.map(result, (data: any) => {
      if (data.type === WatchEventType.DELETE) {
        data.ids = _.map(data.items, (item: any) => item.id);
      }
      data.collection = data.items || [];
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

          let result = response;
          let cres = '';
          if (contentType === 'json') {
            const currentRes = sliceData(response, e.loaded, loadedSize);
            result = parseData(currentRes);
            result = resetResultSchema(result);
            cres = currentRes;
          }

          handler(result);
          console.log('chunkrequest===', {
            result,
            url,
            params,
            raw: cres
          });
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
    return axiosToken.current;
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
    setChunkRequest
  };
};

export default useSetChunkRequest;
