import { request } from '@umijs/max';
import type {
  SourceConfig,
  SourceConfigUpsert,
  SourceProbeKind,
  SourceWriteResult
} from './types';

// One endpoint family for all three kinds, keyed by the same name the probe
// reports its `kinds` under — so a slot addresses its own configuration from
// `slot.kind` alone, with no per-consumer wiring and no name translation.
export const OTA_SOURCE_API = '/ota-sources';

const sourceUrl = (kind: SourceProbeKind) => `${OTA_SOURCE_API}/${kind}`;

export async function queryOtaSource(kind: SourceProbeKind) {
  return request<SourceConfig>(sourceUrl(kind), {
    method: 'GET'
  });
}

// `skipErrorHandler`: a refused write — a URL that will not fetch, an update
// that would take away a backend version still in use — is rendered inline in
// the panel that sent it, not as a global toast.
export async function updateOtaSource(
  kind: SourceProbeKind,
  data: SourceConfigUpsert
) {
  return request<SourceWriteResult>(sourceUrl(kind), {
    method: 'PUT',
    data,
    skipErrorHandler: true
  });
}

// Refresh this kind now, from whichever layer serves it: the configured URL
// while there is one, else the official slot. The official half runs on the
// leader, so a standby answers 503 — surfaced inline like any other failure.
export async function reloadOtaSource(kind: SourceProbeKind) {
  return request<SourceWriteResult>(`${sourceUrl(kind)}/reload`, {
    method: 'POST',
    skipErrorHandler: true
  });
}
