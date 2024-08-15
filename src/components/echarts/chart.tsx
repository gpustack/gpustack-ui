import { throttle } from 'echarts/core';
import { useCallback, useEffect, useRef } from 'react';
import echarts, { ECOption } from '.';

const Chart: React.FC<{
  options: ECOption;
  height: number | string;
  width: number | string;
}> = ({ options, width, height }) => {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.EChartsType>();

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
    init();
    return () => {
      chart.current?.dispose();
    };
  }, [init]);

  useEffect(() => {
    resize();
    setOption(options);
  }, [options]);

  // resize on window resize
  useEffect(() => {
    const handleResize = throttle(() => {
      resize();
    }, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [resize]);

  return <div ref={container} style={{ width: width, height }}></div>;
};

export default Chart;
