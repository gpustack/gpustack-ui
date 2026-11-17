import TimeRangeControl from '@/pages/_components/monitoring/time-range-control';
import { useDetail } from '../config/context';
const TimeRangeFilter = () => {
  const { scope, changeScope, capabilities } = useDetail();
  return (
    <TimeRangeControl
      scope={scope}
      changeScope={changeScope}
      capabilities={capabilities}
    />
  );
};
export default TimeRangeFilter;
