# GPU Instances

## Utilization columns

Live GPU / VRAM / CPU / RAM / Storage gauges, fed by the operator's Instance `metrics` subresource through the cluster proxy. The figures are **not** part of the list payload and are not carried by the list's watch stream — they are polled separately.

One column per gauge, not one cell holding all five: the header names the resource, so the cell is nothing but the ring — no label repeated down every row — and every row's reading for a given resource lands at the same x, so a busy instance is found by scanning a column.

Three ways a cell says "no figure", and they mean different things:

| Rendering | Meaning |
| --- | --- |
| `N/A` | The instance type has no accelerator, so a GPU / VRAM reading does not apply to this row at all |
| `-` | The row's phase is outside `MetricsPollablePhases` (stopped, stopping, initializing) — nothing is being sampled, so a ring would frame a figure that is never coming |
| `--` inside a ring | The row IS being polled and has not answered yet |

### Where the pieces are

| File | Role |
| --- | --- |
| `services/use-query-instance-metrics.ts` | The poller: one loop for the whole page, concurrency gate, batched commit |
| `components/utilization-cell.tsx` | Pure presentation, memoized — one cell per gauge, holds no state and issues no request |
| `apis/index.ts` | `queryGPUServiceInstanceMetrics`: proxy URL, `skipErrorHandler`, timeout |
| `config/types.ts` | `Gauge*` / `InstanceMetricsMap` view model |
| `config/index.ts` | `MetricsPollablePhases` (which phases have a Pod worth sampling), `GaugeColumnOrder`, `GaugeLabelIdMap`, `AcceleratorGaugeKeys` |
| `hooks/use-instances-columns.tsx` | Maps `GaugeColumnOrder` to columns; feeds each row its `values` + `hasAccelerators` |
| `index.tsx` | Owns the `enabled` flag (see "What pauses it") |

**One loop per page, not one per row.** A per-row timer would fire N requests in the same tick — at 100 rows that saturates the browser's connection pool every 15s. Refreshing only a subset per interval was rejected too: at one row per tick a 100-row page takes 25 minutes to come back to the first row, so the column would quietly show minutes-old load. The gate solves the burst without costing freshness.

### What it costs

| Dimension | Cost |
| --- | --- |
| Network | One sweep per 15s; requests per sweep = pollable rows on the page; ≤3 in flight; 5s per-request timeout |
| Connections | ≤3 of the browser's ~6 per origin. The list's watch stream holds one permanently, so ≥2 always stay free for user-initiated requests |
| Rendering | One table re-render per commit. `UtilizationCell` is memoized, so only rows whose values changed actually repaint. ~1 commit per sweep at 10 rows, ~8 at 100 |
| Backend | Cluster proxy → k8s API server → operator |
| Visibility | **Failures are silent** — no toast, no console error. Load and errors are invisible in the UI; use the Network panel |

### What pauses or restarts it

| Interaction | Effect |
| --- | --- |
| Instance enters/leaves Ready or NotReady | Target set changes → 300ms debounce → immediate re-sweep |
| Paging / search / filter | Same, and rows that left the page are pruned from the map |
| Instance deleted | Pruned; in-flight request cancelled; a late response is refused by commit |
| Create / edit drawer | Pauses while open; resumes with an immediate sweep on close |
| View logs / events modal | Same (logs hold a long-lived connection, so yielding matters most here) |
| Bulk start / stop / delete | Pauses from the moment the confirmation opens until the action settles |
| Browser tab hidden | Pauses; resumes with an immediate sweep |
| Leaving the page | Every request and timer is cancelled |
| Slow proxy | A sweep that outruns the interval delays the next one; cycles never overlap |

### Troubleshooting

| Symptom | Look at |
| --- | --- |
| Every gauge shows `--` inside a ring | Row phase is in `MetricsPollablePhases`? `clusterId` / `status.namespace` populated? Subresource 404 (operator < v0.8.2)? |
| Only some rows show `--` | Those rows' phase / namespace, or their request hitting the 5s timeout |
| Values frozen | An overlay or bulk confirmation is open, or the tab is in the background — i.e. `enabled` is false |
| GPU / VRAM show `N/A` | `acceleratable` in the row's persisted type snapshot (`description`) |
| Multi-card value looks wrong | Some card missing `used`/`total` — the aggregate then falls back to a per-card mean rather than mixing card sets |
| Too many requests | `CONCURRENCY` / `POLL_INTERVAL`, and whether the page size was raised to 100 |
| Table feels janky | Commit frequency (`COMMIT_WINDOW`), and whether something broke `UtilizationCell`'s memo by passing an unstable prop |

### Knobs

All at the top of `services/use-query-instance-metrics.ts`:

| Constant | Value | Purpose |
| --- | --- | --- |
| `POLL_INTERVAL` | 15s | Sweep cadence |
| `CONCURRENCY` | 3 | In-flight cap; leaves 2 connections for the user |
| `REQUEST_TIMEOUT` | 5s | Stops one stalled request from holding a gate slot |
| `RESTART_DEBOUNCE` | 300ms | Coalesces restarts while many rows change phase |
| `COMMIT_WINDOW` | 800ms | Batches responses to bound table re-renders |

### Invariants to preserve

1. **The cell stays pure, and its props stay referentially stable.** Passing it something that changes identity every render (a `record`, an inline object) defeats the memo, and every commit repaints all rows.
2. **Any new bulk action or long-lived connection on this page must feed into `enabled`.** The connection pool is shared.
3. **`commit()` swaps `pendingRef` synchronously before calling `setState`, and `setMetrics` uses the updater form.** These two are the entire reason a commit cannot race the requests still in flight.
