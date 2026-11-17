import type { ModelInstanceListItem } from '../../config/types';
import type { MonitoringScope } from '../config/types';

type RequestRole = 'prefill' | 'decode' | 'router';

// PD child requests are distinct populations. Follow an explicit selected
// engine pool, but retain Decode as the whole-deployment default and never
// combine role-local counts or latency observations.
export const effectiveRequestRole = (
  scope: Pick<MonitoringScope, 'role' | 'instanceIds'>,
  instances: Pick<ModelInstanceListItem, 'id' | 'role'>[] = []
): RequestRole => {
  if (scope.role !== 'all') return scope.role;
  const requested = new Set(scope.instanceIds);
  if (!requested.size) return 'decode';
  const selected = instances.filter((instance) => requested.has(instance.id));
  if (selected.length !== requested.size) return 'decode';
  const roles = new Set(selected.map((instance) => instance.role));
  if (roles.has('decode')) return 'decode';
  if (roles.has('prefill')) return 'prefill';
  return roles.has('router') ? 'router' : 'decode';
};
