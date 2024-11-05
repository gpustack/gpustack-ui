import { throttle } from 'lodash';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import echarts, { ECOption } from '.';

const Chart: React.FC<{
  options: ECOption;
  height: number | string;
  width: number | string;
  ref?: any;
}> = forwardRef(({ options, width, height }, ref) => {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.EChartsType>();
  const resizeable = useRef(false);
  const resizeObserver = useRef<ResizeObserver>();

  useImperativeHandle(ref, () => {
    return {
      chart: chart.current
    };
  });

  const init = useCallback(() => {
    if (container.current) {
      chart.current?.clear();
      chart.current = echarts.init(container.current);
    }
  }, []);

  const resize = useCallback(() => {
    chart.current?.resize();
  }, []);

  const setOption = useCallback((options: ECOption) => {
    chart.current?.clear();
    chart.current?.setOption(options, {
      notMerge: true,
      lazyUpdate: true
    });
  }, []);

  useEffect(() => {
    if (container.current) {
      init();
    }
    return () => {
      chart.current?.dispose();
    };
  }, [init]);

  useEffect(() => {
    resizeable.current = false;
    resize();
    setOption(options);
    resizeable.current = true;
  }, [options]);

  useEffect(() => {
    const handleResize = throttle(() => {
      if (resizeable.current) {
        chart.current?.resize();
      }
    }, 100);

    if (container.current) {
      resizeObserver.current = new ResizeObserver(handleResize);

      resizeObserver.current.observe(container.current);
    }
    return () => {
      if (container.current) {
        resizeObserver.current?.unobserve(container.current);
      }
    };
  }, []);

  // resize on window resize
  // useEffect(() => {
  //   const handleResize = throttle(() => {
  //     chart.current?.resize();
  //   }, 100);
  //   window.addEventListener('resize', handleResize);
  //   return () => {
  //     window.removeEventListener('resize', handleResize);
  //   };
  // }, []);

  return (
    <div className="chart-wrapper" style={{ width: width, height }}>
      <div ref={container} style={{ width: width, height }}></div>
    </div>
  );
});

export default Chart;
