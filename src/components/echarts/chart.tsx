import _, { throttle } from 'lodash';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import echarts, { ECOption } from '.';

const Chart: React.FC<{
  options: ECOption;
  chartHeight?: number;
  height: number | string;
  width: number | string;
  ref?: any;
}> = forwardRef(({ options, width, height, chartHeight }, ref) => {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.EChartsType>();
  const resizeable = useRef(false);
  const resizeObserver = useRef<ResizeObserver>();
  const finished = useRef(false);

  useImperativeHandle(ref, () => {
    return {
      chart: chart.current
    };
  });

  const init = () => {
    if (container.current) {
      chart.current?.clear();
      chart.current = echarts.init(container.current);
    }
  };

  const setOption = (options: ECOption) => {
    if (!chart.current) return;
    chart.current?.clear();
    chart.current?.setOption(options, {
      notMerge: true,
      lazyUpdate: true
    });
    if (Array.isArray(options.yAxis) && options.yAxis.length > 1) {
      chart.current?.resize();
    }
  };

  useEffect(() => {
    const handleOnFinished = () => {
      if (!chart.current || finished.current) return;

      const currentChart = chart.current;
      const optionsYAxis = currentChart.getOption()?.yAxis;

      if (
        !optionsYAxis ||
        !Array.isArray(optionsYAxis) ||
        optionsYAxis.length < 2
      )
        return;
      // @ts-ignore
      const model = currentChart.getModel();

      const yAxisModels = [
        model.getComponent('yAxis', 0),
        model.getComponent('yAxis', 1)
      ];

      if (!yAxisModels[0] || !yAxisModels[1]) return;

      const axes = yAxisModels.map((m) => m.axis);

      const intervals = axes.map((axis) => axis.scale.getInterval());
      const ticksList = axes.map((axis) => axis.scale.getTicks());
      const counts = ticksList.map((t) => t.length);

      const unifiedCount = Math.max(counts[0], counts[1]);

      const newMax0 = intervals[0] * (unifiedCount - 1);
      const newMax1 = intervals[1] * (unifiedCount - 1);

      // if newMax0 equal to maxValue0, and newMax1 equal to maxValue1, do not update yAxis
      if (counts[0] === counts[1]) return;

      const yAxis: any[] = [{}, {}];

      if (counts[0] < unifiedCount) {
        yAxis[0].max = _.round(newMax0, 2);
        yAxis[0].interval = intervals[0];
        yAxis[0].splitNumber = unifiedCount;
      }

      if (counts[1] < unifiedCount) {
        yAxis[1].max = _.round(newMax1, 2);
        yAxis[1].interval = intervals[1];
        yAxis[1].splitNumber = unifiedCount;
      }
      finished.current = true;

      currentChart.setOption({
        yAxis: yAxis
      });
    };

    if (container.current) {
      init();
      chart.current?.on('finished', handleOnFinished);
    }

    return () => {
      chart.current?.off('finished', handleOnFinished);
      chart.current?.dispose();
    };
  }, []);

  useEffect(() => {
    resizeable.current = false;
    finished.current = false;
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
      resizeObserver.current?.disconnect();
      resizeObserver.current = undefined;
    };
  }, []);

  return (
    <div className="chart-wrapper" style={{ width: width, height }}>
      <div
        ref={container}
        style={{ width: width, height: chartHeight || height }}
      ></div>
    </div>
  );
});

export default Chart;
