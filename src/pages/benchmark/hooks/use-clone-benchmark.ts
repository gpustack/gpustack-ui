import { benchmarkCloneSourceAtom } from '@/atoms/benchmark';
import { useNavigate } from '@umijs/max';
import { useAtom } from 'jotai';
import { BenchmarkListItem as ListItem } from '../config/types';

/**
 * Clone raised from a page that has no create drawer (the detail page).
 *
 * The drawer and its submit path live on the list page, so cloning from
 * elsewhere hands the source row over through an atom and navigates there;
 * the list page opens the pre-filled drawer and clears the hand-off.
 */
const useCloneBenchmark = () => {
  const [cloneSource, setCloneSource] = useAtom(benchmarkCloneSourceAtom);
  const navigate = useNavigate();

  const cloneBenchmarkOnList = (row: ListItem) => {
    setCloneSource(row);
    navigate('/models/benchmark');
  };

  const clearCloneSource = () => {
    setCloneSource(null);
  };

  return {
    cloneSource,
    clearCloneSource,
    cloneBenchmarkOnList
  };
};

export default useCloneBenchmark;
