import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { stopBenchmark } from '../apis';
import { BenchmarkStatusValueMap } from '../config';

const useStopBenchmark = () => {
  const intl = useIntl();
  const handleStopBenchmark = async (id: number) => {
    try {
      await stopBenchmark({
        id,
        data: {
          state: BenchmarkStatusValueMap.Stopped
        }
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {}
  };

  const handleBatchStopBenchmark = async (ids: number[]) => {};

  return {
    handleStopBenchmark
  };
};

export default useStopBenchmark;
