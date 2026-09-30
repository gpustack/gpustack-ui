import { useDebounceFn } from 'ahooks';
import { useRef, useState } from 'react';
import type { BenchmarkFilterValues } from '../config/types';

interface BenchmarkFiltersOptions {
  initialValues: Partial<BenchmarkFilterValues>;
  onChange: (values: Partial<BenchmarkFilterValues> & { page: number }) => void;
}

/** Drafts survive remounts; resizing never publishes a query. */
const useBenchmarkFilters = ({
  initialValues,
  onChange
}: BenchmarkFiltersOptions) => {
  const [values, setValues] = useState<BenchmarkFilterValues>(() => ({
    search: initialValues.search ?? '',
    model_name: initialValues.model_name ?? '',
    gpu_summary: initialValues.gpu_summary ?? '',
    profile: initialValues.profile ?? '',
    target_mode: initialValues.target_mode,
    load_type: initialValues.load_type
  }));
  const [nameSearch, setNameSearch] = useState('');
  const pendingRef = useRef<Partial<BenchmarkFilterValues>>({});

  const publish = () => {
    const pending = pendingRef.current;
    pendingRef.current = {};
    if (Object.keys(pending).length) onChange({ page: 1, ...pending });
  };

  const { run, cancel } = useDebounceFn(publish, { wait: 350 });

  const changeValues = (
    patch: Partial<BenchmarkFilterValues>,
    debounce = false
  ) => {
    setValues((previous) => ({ ...previous, ...patch }));
    pendingRef.current = { ...pendingRef.current, ...patch };
    if (patch.search !== undefined) setNameSearch('');

    if (debounce) {
      run();
    } else {
      // An immediate selection/clear also commits any outstanding text edits.
      cancel();
      publish();
    }
  };

  return { values, changeValues, nameSearch, setNameSearch };
};

export default useBenchmarkFilters;
