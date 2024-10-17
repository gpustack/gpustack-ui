import qs from 'query-string';
import { useEffect, useRef } from 'react';

interface RequestConfig {
  url: string;
  handler: (data: any) => any;
  beforeReconnect?: () => void;
  params?: object;
  contentType?: 'json' | 'text';
}

const useSetChunkFetch = () => {
  const axiosToken = useRef<any>(null);
  const requestConfig = useRef<any>({});

  const readTextEventStreamData = async (
    reader: any,
    decoder: TextDecoder,
    callback: (data: any) => void
  ) => {
    const { done, value } = await reader.read();

    if (done) {
      return;
    }

    let chunk = decoder.decode(value, { stream: true });
    callback(chunk);
    await readTextEventStreamData(reader, decoder, callback);
  };

  const fetchChunkRequest = async ({
    url,
    handler,
    params = {}
  }: RequestConfig) => {
    axiosToken.current?.abort?.();
    axiosToken.current = new AbortController();
    try {
      const response = await fetch(
        `v1${url}?${qs.stringify({
          ...params,
          watch: true
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
      console.log('response============', response);
      if (!response.ok) {
        return;
      }
      const reader = response?.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      await readTextEventStreamData(reader, decoder, handler);
    } catch (error) {
      // handle error
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
