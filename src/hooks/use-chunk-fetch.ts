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
  const completeData = useRef<any>([]);
  const chunkDataRef = useRef<any>([]);
  const conentLengthRef = useRef<any>(0);
  const receivedLengthRef = useRef<any>(0);

  const readTextEventStreamData = async (
    reader: any,
    decoder: TextDecoder,
    callback: (data: any) => void
  ) => {
    const { done, value } = await reader.read();
    console.log('chunkDataRef.current===1', {
      data: chunkDataRef.current,
      done
    });
    if (done) {
      return;
    }

    const chunk = decoder.decode(value, { stream: true });

    callback(chunk);
    // console.log('chunkDataRef.current===2', chunkDataRef.current);

    await readTextEventStreamData(reader, decoder, callback);
  };

  const combineUint8Arrays = (arrays: Uint8Array[]) => {
    // Calculate total length
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);

    // Create a new Uint8Array to hold the combined data
    const combined = new Uint8Array(totalLength);

    // Copy each array into the combined array
    let offset = 0;
    for (const arr of arrays) {
      combined.set(arr, offset);
      offset += arr.length;
    }

    return combined;
  };

  const readUint8ArrayStreamData = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    callback: (data: Uint8Array) => void
  ) => {
    const { done, value } = await reader.read();
    while (true) {
      if (done) {
        callback(completeData.current);
        break;
      }
      const tempData = new Uint8Array(
        completeData.current.length + value.length
      );
      tempData.set(completeData.current);
      tempData.set(value, completeData.current.length);
      completeData.current = tempData;
    }

    // await readUint8ArrayStreamData(reader, callback);
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

      if (!response.ok) {
        return;
      }

      chunkDataRef.current = '';
      conentLengthRef.current = response.headers.get('Content-Length');
      receivedLengthRef.current = 0;
      console.log('conentLengthRef.current', conentLengthRef.current, response);
      const reader = response?.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      await readTextEventStreamData(reader, decoder, handler);
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
