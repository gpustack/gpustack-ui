import { useState } from 'react';
import { queryOtaSource, reloadOtaSource, updateOtaSource } from './apis';
import type {
  SourceConfig,
  SourceConfigUpsert,
  SourceProbeKind,
  SourceProbeStatus,
  SourceScopeConfig,
  SourceWriteResult
} from './types';

// The cadence the server creates an official slot with. Only a placeholder here:
// the switch turns official updates back on at this value when the stored one
// is 0, and it stands in until the first GET answers.
export const OFFICIAL_DEFAULT_HOURS = 12;

// What a slot reports before its first fetch: no custom source, official on.
const EMPTY_CONFIG: SourceConfig = {
  remote_enabled: true,
  custom: null,
  official: {
    auto_update_hours: OFFICIAL_DEFAULT_HOURS,
    enabled: true,
    updated_at: null,
    content_hash: null
  }
};

/**
 * One slot's stored configuration — both halves of it, since the server carries
 * `custom` and `official` in a single object and replaces both in one write.
 *
 * Every write re-resolves the source server-side (a URL is fetched once per
 * PUT), so `save` is also the re-sync action and `reload` is the cheaper variant
 * that reuses whatever the kind already points at. Both can come back 400 with
 * the reason; that message is thrown to the caller, which renders it inline.
 *
 * Addressed by `kind` alone — the endpoints are one family, so there is nothing
 * per-slot left to inject.
 */
export const useSlotConfig = (kind: SourceProbeKind) => {
  const [config, setConfig] = useState<SourceConfig>(EMPTY_CONFIG);

  // Returns what it just fetched so the caller can seed the form from it
  // without waiting for the state to land. `null` says the read failed, which
  // the caller has to tell apart from a slot that is genuinely unconfigured:
  // seeding the form from a placeholder would put values on screen that were
  // never stored, and Save would write them over whatever is really there.
  const load = async (): Promise<SourceConfig | null> => {
    try {
      const data = await queryOtaSource(kind);
      setConfig(data);
      return data;
    } catch {
      // surfaced by the global request error handler
      return null;
    }
  };

  const save = async (data: SourceConfigUpsert) => {
    const result = await updateOtaSource(kind, data);
    setConfig(result);
    return result;
  };

  // Refresh this kind now, from whichever layer serves it. `changed: false`
  // means the document hashed the same, so nothing was written.
  const reload = async (): Promise<SourceWriteResult> => {
    const result = await reloadOtaSource(kind);
    setConfig(result);
    return result;
  };

  return { config, load, save, reload };
};

/**
 * The refresher's status. One call reports every kind, so the drawer fetches it
 * once and hands each slot its own entry — that is where a slot's leader-only
 * state lives (the resolved ref, the last failed refresh) plus the OTA server
 * URL the official file download link is built from.
 */
export const useProbeStatus = (probe: SourceScopeConfig['probe']) => {
  const [probeStatus, setProbeStatus] = useState<SourceProbeStatus | null>(
    null
  );

  const loadProbe = async () => {
    try {
      const status = await probe();
      setProbeStatus(status);
      return status;
    } catch {
      // The last good status stands. This runs again after every save and
      // refetch, and the address it carries is what tells the form that the
      // URL in the box is the official file's own: dropping it on a failed
      // round would leave that same URL reading as one of the admin's own,
      // and the next Save would send it as one.
      return null;
    }
  };

  return { probeStatus, loadProbe };
};
