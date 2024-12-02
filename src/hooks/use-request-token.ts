import axiso from 'axios';
import { useEffect, useRef } from 'react';

export default function useRequestToken() {
  const { source } = axiso.CancelToken;

  return source;
}

export function useCancelToken() {
  const { source } = axiso.CancelToken;
  const requestToken = useRef<any>(null);

  const updateCancelToken = () => {
    if (requestToken.current) {
      requestToken.current.cancel();
    }
    requestToken.current = source();
  };

  const cancelRequest = () => {
    if (requestToken.current) {
      requestToken.current.cancel();
    }
  };

  const getCanceltToken = () => {
    return requestToken.current.token;
  };

  useEffect(() => {
    return () => {
      if (requestToken.current) {
        requestToken.current.cancel();
      }
    };
  }, []);

  return { updateCancelToken, cancelRequest, getCanceltToken, source };
}
