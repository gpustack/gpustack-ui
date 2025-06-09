import axiso from 'axios';
import { useEffect, useRef } from 'react';

export default function useRequestToken() {
  const { source } = axiso.CancelToken;

  return source;
}

export function useCancelToken() {
  const { source } = axiso.CancelToken;
  const requestToken = useRef<any>(null);

  const cancelRequest = () => {
    if (requestToken.current) {
      requestToken.current.cancel();
    }
  };

  const updateCancelToken = () => {
    cancelRequest();
    requestToken.current = source();
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

export function useAbortController() {
  const controller = useRef<AbortController | null>(null);

  const abortController = () => {
    if (controller.current) {
      controller.current.abort();
    }
  };

  const getController = () => {
    if (!controller.current) {
      controller.current = new AbortController();
    }
    return controller.current;
  };

  const updateController = () => {
    abortController();
    controller.current = new AbortController();
  };

  useEffect(() => {
    return () => {
      abortController();
    };
  }, []);

  return { getController, updateController, abortController, controller };
}
