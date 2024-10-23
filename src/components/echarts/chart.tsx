import { throttle } from 'lodash';
import { useCallback, useEffect, useRef } from 'react';
import echarts, { ECOption } from '.';

const Chart: React.FC<{
  options: ECOption;
  height: number | string;
  width: number | string;
}> = ({ options, width, height }) => {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.EChartsType>();
  const resizeable = useRef(false);
  const resizeObserver = useRef<ResizeObserver>();

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
  }, [options]);

  useEffect(() => {
    let timer: any = null;
    timer = setTimeout(() => {
      resizeable.current = true;
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, []);

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

  return <div ref={container} style={{ width: width, height }}></div>;
};

export default Chart;
