import { request } from '@umijs/max';
import type { SourceProbeStatus } from './types';

export const SOURCE_PROBE_API = '/source-probe';

// One call reports every kind's live state, so the drawer shares it across
// scopes. Read-only; the global error handler is fine for its failures.
//
// The status read is all the UI needs here: `POST /source-probe` forces a round
// over *all three* kinds, which is an operator's verb. A panel's refresh button
// reloads the one kind it is showing — see `reloadOtaSource`.
export async function querySourceProbe() {
  return request<SourceProbeStatus>(SOURCE_PROBE_API, {
    method: 'GET'
  });
}
