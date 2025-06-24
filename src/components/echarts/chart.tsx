import { throttle } from 'lodash';
import React, {
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
  const finished = useRef(false);

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

  const setOption = useCallback(
    (options: ECOption) => {
      chart.current?.clear();
      chart.current?.setOption(options, {
        notMerge: true,
        lazyUpdate: true
      });
    },
    [options]
  );

  useEffect(() => {
    const handleOnFinished = () => {
      if (!chart.current || finished.current) return;

      const currentChart = chart.current;
      const optionsYAxis = currentChart.getOption()?.yAxis;

      console.log(
        'chart finished',
        finished.current,
        optionsYAxis,
        chart.current
      );
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
        yAxis[0].max = newMax0;
        yAxis[0].interval = intervals[0];
        yAxis[0].splitNumber = unifiedCount;
      }

      if (counts[1] < unifiedCount) {
        yAxis[1].max = newMax1;
        yAxis[1].interval = intervals[1];
        yAxis[1].splitNumber = unifiedCount;
      }
      finished.current = true;

      setTimeout(() => {
        currentChart.setOption({
          yAxis: yAxis
        });
      }, 0);
    };

    if (container.current) {
      init();
      chart.current?.on('finished', handleOnFinished);
    }

    return () => {
      chart.current?.dispose();
      chart.current?.off('finished', handleOnFinished);
    };
  }, [init]);

  useEffect(() => {
    resizeable.current = false;
    finished.current = false;
    resize();
    setOption(options);
    resizeable.current = true;
  }, [setOption]);

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

  return (
    <div className="chart-wrapper" style={{ width: width, height }}>
      <div ref={container} style={{ width: width, height }}></div>
    </div>
  );
});

export default Chart;
