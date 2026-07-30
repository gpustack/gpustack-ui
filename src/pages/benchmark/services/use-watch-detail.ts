import { WatchEventType } from '@/config';
import { useChunkRequest, usePageVisibility } from '@gpustack/core-ui';
import { useMemoizedFn } from 'ahooks';
import { useEffect, useRef } from 'react';
import { BENCHMARKS_API } from '../apis';

// Subscribe to the benchmark collection watch stream (SSE) and fire `onChange`
// whenever the benchmark with `id` is created/updated. The worker streams the
// row's changes as it runs (progress, best-points, validity, and — via the periodic
// partial sync — each newly finished point), so this drives the detail page's
// live "results grow while running" behavior.
//
// Used purely as a change SIGNAL: the caller pulls the authoritative detail +
// per-point results itself, so this stays agnostic to which fields the streamed
// row happens to carry ("推信号 + 拉数据", design §5.4). `setChunkRequest` adds
// `watch=true` and closes the stream on unmount.
export default function useWatchBenchmarkDetail(options: {
  id?: number | null;
  onChange: () => void;
}) {
  const { id, onChange } = options;
  const { setChunkRequest } = useChunkRequest();
  const chunkRef = useRef<any>(null);

  const handler = useMemoizedFn((events: any[]) => {
    if (id == null) {
      return;
    }
    const touched = (events || []).some(
      (evt: any) =>
        (evt?.type === WatchEventType.UPDATE ||
          evt?.type === WatchEventType.CREATE) &&
        (evt?.collection || []).some(
          (item: any) => Number(item?.id) === Number(id)
        )
    );
    if (touched) {
      onChange();
    }
  });

  const startWatch = useMemoizedFn(() => {
    chunkRef.current?.current?.cancel?.();
    if (id == null) {
      return;
    }
    try {
      chunkRef.current = setChunkRequest({
        url: BENCHMARKS_API,
        handler
      });
    } catch (error) {
      // A dropped stream just means no live updates — the initial fetch has
      // already rendered the page, so this is not fatal.
    }
  });

  const cancelWatch = useMemoizedFn(() => {
    chunkRef.current?.current?.cancel?.();
  });

  // A hidden tab drops the stream instead of holding an idle SSE connection
  // open. Coming back re-issues it AND pulls once: the stream carries no
  // history, so a point that finished while away is only visible via a fetch.
  const resumeWatch = useMemoizedFn(() => {
    if (id == null) {
      return;
    }
    startWatch();
    onChange();
  });

  usePageVisibility({
    onHidden: cancelWatch,
    onVisible: resumeWatch
  });

  useEffect(() => {
    startWatch();
    return () => cancelWatch();
  }, [id]);

  return { cancelWatch };
}
