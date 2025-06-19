import { useRequest } from 'ahooks';

export default function useDeferredRequest<P extends any[], R>(
  requestFn: (...args: P) => Promise<R>,
  delay = 100
) {
  return useRequest(
    async (...args: P) => {
      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
      return await requestFn(...args);
    },
    {
      manual: true
    }
  );
}
