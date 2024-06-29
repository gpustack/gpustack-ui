import qs from 'query-string';
import { useEffect, useRef } from 'react';

export const createEventSourceURL = (url: string) => {
  const { host, protocol } = window.location;
  return `${protocol}://${host}${url}`;
};

/*  
0: connecting
1: connect successfully
2: closed
*/

export default function useEventSource() {
  const eventSourceRef = useRef<any>(null);

  const createEventSourceConnection = (query: {
    url: string;
    params: any;
    onmessage?: (data: any) => void;
  }) => {
    eventSourceRef.current?.close?.();

    const { url, params, onmessage = () => {} } = query;

    const sseurl = createEventSourceURL(url);

    eventSourceRef.current = new EventSource(
      `${url}?${qs.stringify({
        ...params
      })}`,
      {
        withCredentials: true
      }
    );

    eventSourceRef.current.onmessage = (res: any) => {
      try {
        const data = JSON.parse(res.data);
        console.log('event source message: ', { data, resData: res });
        onmessage(data);
      } catch (error) {
        // error
        console.log('event source error: ', error);
      }
    };

    eventSourceRef.current.onclose = () => {
      console.log('event source closed...');
    };

    eventSourceRef.current.onopen = () => {
      console.log('event source connected...');
    };

    eventSourceRef.current.onerror = (error: any) => {
      console.log('event source error: ', error);
    };
  };

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close?.();
    };
  }, []);

  return {
    eventSourceRef: eventSourceRef,
    createEventSourceConnection
  };
}
