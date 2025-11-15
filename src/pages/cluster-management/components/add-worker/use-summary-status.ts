import { useCallback, useRef, useState } from 'react';
import { SummaryDataKey, SummaryDataMap } from './config';

const useSummaryStatus = () => {
  const summaryRef = useRef<
    Map<SummaryDataKey, SummaryDataMap[SummaryDataKey]>
  >(new Map());
  const [, forceRender] = useState({});

  // Register a key in the summary map, but do not tigger a render
  const register = useCallback((key: SummaryDataKey) => {
    return () => {
      summaryRef.current.delete(key);
      forceRender({});
    };
  }, []);

  // call it to update a initial value or change value, it will trigger a render
  const update = useCallback(
    (key: SummaryDataKey, value: SummaryDataMap[typeof key]) => {
      const prev = summaryRef.current.get(key);

      if (prev === value) return;

      summaryRef.current.set(key, value);
      forceRender({});
    },
    []
  );

  return {
    summary: summaryRef.current,
    register,
    update
  };
};

export default useSummaryStatus;
