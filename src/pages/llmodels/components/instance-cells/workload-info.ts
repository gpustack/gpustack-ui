import type {
  DPRankPlacement,
  ModelInstanceComponent,
  ModelInstanceDashboardTarget,
  ModelInstanceListItem,
  ModelInstanceWorkload
} from '../../config/types';

export interface WorkloadInfoEntry {
  workerName: string;
  state: ModelInstanceWorkload['state'];
  api: string;
  placement?: DPRankPlacement;
  component?: ModelInstanceComponent;
  key: string;
  detail: string;
  monitor?: ModelInstanceDashboardTarget;
  logicalDPSize?: number;
}

// Keep the authoritative empty manifest distinct from legacy placement data.
export function workloadInfoEntries(
  record: ModelInstanceListItem,
  workers: { id: number; name: string; ip?: string }[] = []
): WorkloadInfoEntry[] | null {
  const workloads = record.distributed_servers?.workloads;
  if (workloads == null) return null;
  const epoch = record.restart_count;
  return workloads.flatMap<WorkloadInfoEntry>((workload) => {
    const worker = workers.find(({ id }) => id === workload.worker_id);
    const local = workload.worker_id === record.worker_id;
    const name =
      worker?.name ||
      (local ? record.worker_name : `Worker ${workload.worker_id}`);
    const peer = record.distributed_servers?.subordinate_workers?.find(
      ({ worker_id }) => worker_id === workload.worker_id
    );
    const ip = worker?.ip || (local ? record.worker_ip : peer?.worker_ip);
    const common = {
      workerName: name,
      state: workload.state
    };
    const component = workload.component;
    if (component) {
      const endpoint = (port?: number | null) =>
        port == null ? '-' : `${ip || `Worker ${workload.worker_id}`}:${port}`;
      const service =
        component.kind === 'sglang_smg'
          ? `CPU | aggregate API ${endpoint(component.api_port)}`
          : `${component.api_port == null ? 'headless | API -' : `shared API ${endpoint(component.api_port)}`} | logical DP ${component.dp_size ?? '-'}`;
      const monitor: ModelInstanceDashboardTarget | undefined =
        epoch != null && component.api_port != null
          ? {
              restart_count: epoch,
              worker_id: workload.worker_id,
              component: component.kind,
              ...(component.kind === 'sglang_smg'
                ? { attempt: component.attempt }
                : {})
            }
          : undefined;
      return [
        {
          ...common,
          component,
          api: endpoint(component.api_port),
          key: `${workload.worker_id}:${workload.name}:${component.kind}`,
          detail: `${workload.name} | ${name} | ${component.kind} | ${service} | metrics ${endpoint(component.metrics_port)} | attempt=${component.attempt} | ready=${component.ready ?? '-'} | stop_requested=${component.stop_requested} | last_restart_time=${component.last_restart_time ?? '-'} | ${workload.state}`,
          monitor,
          logicalDPSize:
            monitor &&
            component.kind === 'sglang_engine' &&
            Number.isInteger(component.dp_size) &&
            component.dp_size! > 0
              ? component.dp_size!
              : undefined
        }
      ];
    }
    return workload.dp_rank_placements.map((placement) => {
      const main = placement.node_rank === 0;
      const api =
        main && placement.api_port != null
          ? `${ip || `Worker ${workload.worker_id}`}:${placement.api_port}`
          : '-';
      return {
        ...common,
        placement,
        api,
        key: `${workload.worker_id}:${workload.name}:${placement.dp_rank}:${placement.node_rank}`,
        detail: `${workload.name} | ${name} | DP ${placement.dp_rank} / node ${placement.node_rank} | GPU [${placement.gpu_indexes.join(', ')}] | API ${api} | ${main ? `main | ready=${placement.ready}` : 'headless'} | ${workload.state}`,
        monitor:
          epoch != null && main && placement.api_port != null
            ? {
                restart_count: epoch,
                dp_rank: placement.dp_rank,
                worker_id: workload.worker_id
              }
            : undefined
      };
    });
  });
}

export function workloadInfo(
  record: ModelInstanceListItem,
  workers: { id: number; name: string; ip?: string }[] = []
): string[] | null {
  return (
    workloadInfoEntries(record, workers)?.map((entry) => entry.detail) ?? null
  );
}

interface WorkloadInfoGroup {
  key: string;
  rank?: number;
  entries: WorkloadInfoEntry[];
}

export function groupWorkloadInfoEntries(
  entries: WorkloadInfoEntry[]
): WorkloadInfoGroup[] {
  const ranks = new Map<number, WorkloadInfoGroup>();
  const components: WorkloadInfoGroup[] = [];
  for (const entry of entries) {
    if (!entry.placement) {
      components.push({ key: entry.key, entries: [entry] });
      continue;
    }
    const rank = entry.placement.dp_rank;
    if (!ranks.has(rank))
      ranks.set(rank, { key: `dp-${rank}`, rank, entries: [] });
    ranks.get(rank)!.entries.push(entry);
  }
  return [
    ...[...ranks.values()]
      .sort((a, b) => a.rank! - b.rank!)
      .map((group) => ({
        ...group,
        entries: group.entries.sort(
          (a, b) => a.placement!.node_rank - b.placement!.node_rank
        )
      })),
    ...components
  ];
}
