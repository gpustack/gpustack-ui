import { useSearchParams } from '@umijs/max';
import type { StagePoint } from '../components/summary/metrics';
import {
  readBenchmarkInspection,
  writeBenchmarkInspection,
  type BenchmarkInspection
} from '../utils/inspection-url';

export type UpdateBenchmarkInspection = (
  patch: Partial<BenchmarkInspection>
) => void;

export default function useBenchmarkInspectionUrl(
  id: number,
  points: StagePoint[]
) {
  const [params, setParams] = useSearchParams();
  const inspection = readBenchmarkInspection(params, id, points);
  const updateInspection: UpdateBenchmarkInspection = (patch) => {
    const next = writeBenchmarkInspection(params, { ...inspection, ...patch });
    if (next.toString() !== params.toString())
      setParams(next, { replace: true });
  };
  return { inspection, updateInspection };
}
