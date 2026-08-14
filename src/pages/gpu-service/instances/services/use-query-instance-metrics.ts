import { createAxiosToken, usePageVisibility } from '@gpustack/core-ui';
import { useMemoizedFn } from 'ahooks';
import { CancelTokenSource } from 'axios';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { queryGPUServiceInstanceMetrics } from '../apis';
import { MetricsPollablePhases } from '../config';
import {
  AcceleratorGaugeItem,
  GaugeKey,
  GaugeState,
  GaugeValues,
  InstanceMetricsMap,
  InstanceMetricsSample,
  ListItem
} from '../config/types';

// One sweep of the whole page per POLL_INTERVAL, with at most CONCURRENCY
// requests in flight. The gate is what makes this safe at 100 rows: the sweep
// still covers every row within one interval (~7s over a 200ms-RTT proxy), it
// just never occupies more than 3 of the browser's ~6 connections per origin.
// Three, not four: the list's watch stream holds one for as long as the page is
// open, so this leaves two free — enough that a bulk action firing N deletes at
// once (use-table-fetch batches them with no cap of its own) still gets lanes
// while a sweep is running. Refreshing a subset per interval instead would be
// far worse: a 100-row page would take 25 minutes to come back to the first
// row, and the column would be quietly showing minutes-old load.
const POLL_INTERVAL = 15000;
const CONCURRENCY = 3;
// A sample nobody can deliver inside this window is worthless anyway, and
// letting the request linger would hold a gate slot and shrink CONCURRENCY.
// Kept well under POLL_INTERVAL, and still an order of magnitude above the
// latency of a healthy proxy hop, so a slow-but-working cluster is not cut off.
const REQUEST_TIMEOUT = 5000;
// The polled set churns while instances are starting or stopping — a batch
// start walks 20 rows into Ready one by one. Coalesce those into one restart
// instead of tearing down and re-issuing the sweep on every phase change.
const RESTART_DEBOUNCE = 300;
// Responses commit in batches, so a 100-row sweep re-renders the table a
// handful of times rather than once per response. A 10-row sweep finishes
// inside one window and lands in a single commit.
const COMMIT_WINDOW = 800;

// Total is the instance's own declaration (always populated); Used is absent
// when its source is unavailable — in that case the gauge keeps its last value.
const usageGauge = (used?: number, total?: number): GaugeState | undefined => {
  if (typeof used !== 'number' || !total) {
    return undefined;
  }
  return { percent: (used / total) * 100, used, total };
};

// Derives only the gauges this sample actually carries: a field absent from a
// successful sample (e.g. storageUsedMiB under the metrics.k8s.io fallback, or
// the whole accelerators array) simply produces no entry, so the merge in
// `commit` leaves that gauge's last value untouched.
const sampleToValues = (sample: InstanceMetricsSample): GaugeValues => {
  const accelerators = sample.accelerators ?? [];
  // Each card carries the index it holds in the instance's accelerator list,
  // so a card dropped for unreadable figures doesn't renumber the cards after
  // it in the per-card breakdown.
  const cards = accelerators.map((accelerator, index) => ({
    accelerator,
    index
  }));

  const gpuItems: AcceleratorGaugeItem[] = cards
    .filter(
      ({ accelerator }) =>
        typeof accelerator.coresUtilizationPercent === 'number'
    )
    .map(({ accelerator, index }) => ({
      index,
      percent: accelerator.coresUtilizationPercent as number
    }));

  // A card's VRAM percent is whichever figure the device library managed to
  // read: the percent field, or used/total when only the absolutes came back.
  const vramItems = cards.reduce<AcceleratorGaugeItem[]>(
    (items, { accelerator, index }) => {
      const used = accelerator.memoryUsedMiB;
      const total = accelerator.memoryTotalMiB;
      const percent =
        accelerator.memoryUtilizationPercent ??
        (typeof used === 'number' && total ? (used / total) * 100 : undefined);
      if (percent !== undefined) {
        items.push({ index, percent, used, total });
      }
      return items;
    },
    []
  );

  // The instance-level VRAM figures only mean something if every card reported
  // both halves. Summing the two fields independently would divide one card's
  // `used` by two cards' `total` (understating the instance) or the reverse —
  // a >100% ratio that clamps to a full ring in the error colour.
  const measured = cards.filter(
    ({ accelerator }) =>
      typeof accelerator.memoryUsedMiB === 'number' &&
      !!accelerator.memoryTotalMiB
  );
  const fullyMeasured = !!measured.length && measured.length === cards.length;
  const vramUsed = fullyMeasured
    ? _.sum(measured.map(({ accelerator }) => accelerator.memoryUsedMiB))
    : undefined;
  const vramTotal = fullyMeasured
    ? _.sum(measured.map(({ accelerator }) => accelerator.memoryTotalMiB))
    : undefined;

  const entries: [GaugeKey, GaugeState | undefined][] = [
    [
      'gpu',
      gpuItems.length
        ? {
            percent: _.mean(gpuItems.map((item) => item.percent)),
            items: gpuItems
          }
        : undefined
    ],
    [
      'vram',
      vramItems.length
        ? {
            // Capacity-weighted while every card is accounted for, since a
            // mean of per-card percents misweights cards of different sizes.
            // With absolutes missing on some card, the per-card mean covers
            // more of the instance than a partial ratio would.
            percent:
              vramUsed !== undefined && vramTotal
                ? (vramUsed / vramTotal) * 100
                : _.mean(vramItems.map((item) => item.percent)),
            used: vramUsed,
            total: vramTotal,
            items: vramItems
          }
        : undefined
    ],
    ['cpu', usageGauge(sample.cpuUsedMilliCores, sample.cpuTotalMilliCores)],
    ['memory', usageGauge(sample.memoryUsedMiB, sample.memoryTotalMiB)],
    ['storage', usageGauge(sample.storageUsedMiB, sample.storageTotalMiB)]
  ];
  return Object.fromEntries(
    entries.filter(([, state]) => state !== undefined)
  ) as GaugeValues;
};

interface MetricsTarget {
  id: number;
  name: string;
  namespace: string;
  clusterID: number;
}

// Rows worth sampling: a running Pod, plus the clusterID/namespace the proxy
// URL is built from. Everything else is left out of the sweep entirely, which
// is also how a stopped instance ends up back at "--".
const toTargets = (list: ListItem[]): MetricsTarget[] =>
  list.reduce<MetricsTarget[]>((targets, row) => {
    const namespace = row.status?.namespace;
    const clusterID = row.clusterId;
    if (
      row.name &&
      namespace &&
      clusterID &&
      MetricsPollablePhases.includes(row.status?.phase as string)
    ) {
      targets.push({ id: row.id, name: row.name, namespace, clusterID });
    }
    return targets;
  }, []);

/**
 * Polls the instance metrics subresource for a whole page of rows and returns
 * `instance id → gauge values` for the Utilization column.
 *
 * One loop for the page, not one per row: a single interval sweeps every
 * pollable row behind a concurrency gate, so the request rate is known and the
 * browser's connection pool is never monopolised. The loop pauses while the
 * tab is hidden and while `enabled` is false (an open drawer has its own
 * requests to make, and the table behind it isn't visible anyway).
 *
 * Failures are silent by design: a proxy 503/404, a timeout or a network error
 * leaves the previous values in place, and a gauge that never had data stays
 * "--". Instances that leave the pollable set drop out of the map, so a
 * stopped row shows "--" rather than the load it had while running.
 */
export default function useQueryInstanceMetrics({
  list,
  enabled = true
}: {
  list: ListItem[];
  enabled?: boolean;
}) {
  const [metrics, setMetrics] = useState<InstanceMetricsMap>({});
  const targetsRef = useRef<MetricsTarget[]>([]);
  // Bumped on every stop; a sweep or sleep whose generation no longer matches
  // unwinds instead of touching state.
  const generationRef = useRef(0);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const tokensRef = useRef(new Set<CancelTokenSource>());
  const pendingRef = useRef<InstanceMetricsMap>({});
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const targets = toTargets(list);
  // The sweep reads targets when it gets to them, so it always works from the
  // latest list without being restarted by every watch-stream update.
  useEffect(() => {
    targetsRef.current = targets;
  });

  // Restart only when the polled set itself changes — a new page, a filter, an
  // instance starting or stopping.
  const signature = targets.map((target) => target.id).join(',');

  const commit = useMemoizedFn(() => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    const pending = pendingRef.current;
    pendingRef.current = {};
    // Only instances still being polled may write. A response that lands in
    // the gap between an instance stopping and its request being cancelled
    // would otherwise put the load it had while running back on the row.
    const pollable = new Set(targetsRef.current.map((target) => target.id));
    const ids = Object.keys(pending).filter((id) => pollable.has(Number(id)));
    if (!ids.length) {
      return;
    }
    setMetrics((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        // Merge rather than replace: a gauge this sample said nothing about
        // keeps the value it had.
        next[Number(id)] = { ...next[Number(id)], ...pending[Number(id)] };
      });
      return next;
    });
  });

  const scheduleCommit = useMemoizedFn(() => {
    if (!commitTimerRef.current) {
      commitTimerRef.current = setTimeout(commit, COMMIT_WINDOW);
    }
  });

  const fetchOne = useMemoizedFn(async (target: MetricsTarget) => {
    const source = createAxiosToken();
    tokensRef.current.add(source);
    try {
      const data = await queryGPUServiceInstanceMetrics(
        {
          name: target.name,
          namespace: target.namespace,
          clusterID: target.clusterID
        },
        { token: source.token, timeout: REQUEST_TIMEOUT }
      );
      // An empty payload is not a successful sample — keep the last values.
      if (!data?.sample) {
        return;
      }
      pendingRef.current[target.id] = {
        ...pendingRef.current[target.id],
        ...sampleToValues(data.sample)
      };
      scheduleCommit();
    } catch {
      // Keep-last-data: proxy 503/404, timeouts, cancellations and network
      // errors all leave the previous values untouched — no error UI, no spam.
    } finally {
      tokensRef.current.delete(source);
    }
  });

  // One pass over the page: CONCURRENCY workers pulling from a shared cursor,
  // so a slow row delays only itself and the gate stays full.
  const sweep = useMemoizedFn(async (generation: number) => {
    const pollList = targetsRef.current;
    let cursor = 0;
    const worker = async () => {
      while (generationRef.current === generation) {
        const index = cursor;
        cursor += 1;
        if (index >= pollList.length) {
          return;
        }
        await fetchOne(pollList[index]);
      }
    };
    await Promise.all(
      _.times(Math.min(CONCURRENCY, pollList.length), () => worker())
    );
    commit();
  });

  const sleep = useMemoizedFn(
    (ms: number) =>
      new Promise<void>((resolve) => {
        wakeRef.current = resolve;
        sleepTimerRef.current = setTimeout(() => {
          sleepTimerRef.current = null;
          wakeRef.current = null;
          resolve();
        }, ms);
      })
  );

  const stop = useMemoizedFn(() => {
    generationRef.current += 1;
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    // Wake a sleeping loop so it observes the new generation and unwinds,
    // instead of leaving its promise pending for good.
    wakeRef.current?.();
    wakeRef.current = null;
    tokensRef.current.forEach((source) => source.cancel());
    tokensRef.current.clear();
    // Flush what already came back rather than dropping it: those samples are
    // paid for, and a pause can land mid-window. commit() clears the pending
    // batch and its timer, and refuses anything no longer being polled.
    commit();
  });

  const start = useMemoizedFn(async () => {
    stop();
    const generation = generationRef.current;
    while (generationRef.current === generation) {
      const startedAt = Date.now();
      await sweep(generation);
      if (generationRef.current !== generation) {
        return;
      }
      // Cycles never overlap: a sweep that outruns the interval just starts
      // the next one late, which is the backpressure we want from a slow proxy.
      await sleep(Math.max(POLL_INTERVAL - (Date.now() - startedAt), 0));
    }
  });

  // Every start is debounced, so a burst of phase changes produces one sweep
  // rather than one cancelled sweep per change. 300ms is invisible next to the
  // 15s cadence.
  const scheduleStart = useMemoizedFn(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      start();
    }, RESTART_DEBOUNCE);
  });

  const prune = useMemoizedFn(() => {
    setMetrics((prev) => {
      const ids = new Set(targetsRef.current.map((target) => target.id));
      const keys = Object.keys(prev);
      const kept = keys.filter((id) => ids.has(Number(id)));
      if (kept.length === keys.length) {
        return prev;
      }
      return kept.reduce<InstanceMetricsMap>((next, id) => {
        next[Number(id)] = prev[Number(id)];
        return next;
      }, {});
    });
  });

  useEffect(() => {
    prune();
    if (!enabled || !signature) {
      stop();
      return undefined;
    }
    // Never start while the tab is hidden (a page opened in a background tab);
    // usePageVisibility starts it on the way back.
    if (document.visibilityState !== 'hidden') {
      scheduleStart();
    }
    return stop;
  }, [enabled, signature, prune, scheduleStart, stop]);

  usePageVisibility({
    enabled: enabled && !!signature,
    onHidden: stop,
    onVisible: start
  });

  return { metrics };
}
