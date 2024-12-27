interface WatchRequest {
  id: number;
  token: any;
  cancel: () => void;
}

declare global {
  interface Window {
    __GPUSTACK_WATCH_REQUEST_CLEAR__: {
      watchIDValue: number;
      requestList: WatchRequest[];
    };
  }
}

window.__GPUSTACK_WATCH_REQUEST_CLEAR__ = {
  watchIDValue: 0,
  requestList: []
};

export const updateWatchIDValue = () => {
  window.__GPUSTACK_WATCH_REQUEST_CLEAR__.watchIDValue =
    window.__GPUSTACK_WATCH_REQUEST_CLEAR__.watchIDValue + 1;
  return window.__GPUSTACK_WATCH_REQUEST_CLEAR__.watchIDValue;
};

export const updateWatchRequest = (watchToken: WatchRequest) => {
  window.__GPUSTACK_WATCH_REQUEST_CLEAR__.requestList.push(watchToken);
};

export const cancelWatchRequest = (n: number) => {
  // cancel the before n requests
  const requestList = window.__GPUSTACK_WATCH_REQUEST_CLEAR__.requestList;

  for (let i = 0; i < n; i++) {
    requestList[i]?.cancel?.();
  }
  window.__GPUSTACK_WATCH_REQUEST_CLEAR__.requestList = requestList.slice(n);
};

export const clearWatchRequestId = (id: number) => {
  const requestList = window.__GPUSTACK_WATCH_REQUEST_CLEAR__.requestList;
  const newRequestList = requestList.filter((item) => item.id !== id);
  window.__GPUSTACK_WATCH_REQUEST_CLEAR__.requestList = newRequestList;
};
