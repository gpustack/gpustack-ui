import _ from 'lodash';
import { SESSION_KEY_SOURCE } from '../config';
import {
  RoutePlugins,
  SessionAffinityPluginConfig,
  SessionKeyItem
} from '../config/types';

// sessionKeys form shape: { type: 'header' | 'bodyKey', key: string }.
// Server shape: exactly one of { header } / { bodyKey } per entry.
export interface SessionKeyFormItem {
  type: string;
  key: string;
}

export const toFormSessionKeys = (
  keys?: SessionKeyItem[]
): SessionKeyFormItem[] =>
  (keys || []).map((item) =>
    item.header != null
      ? { type: SESSION_KEY_SOURCE.header, key: item.header }
      : { type: SESSION_KEY_SOURCE.bodyKey, key: item.bodyKey || '' }
  );

export const toServerSessionKeys = (
  keys?: SessionKeyFormItem[]
): SessionKeyItem[] =>
  (keys || [])
    .filter((item) => item.key)
    .map((item) =>
      item.type === SESSION_KEY_SOURCE.bodyKey
        ? { bodyKey: item.key }
        : { header: item.key }
    );

export const toFormPlugins = (plugins?: RoutePlugins | null) => {
  if (!plugins) {
    return undefined;
  }
  const formPlugins: Record<string, any> = {};
  // No `weight ?? 1` backfill: an unset weight stays undefined so the
  // Advanced seam's open-seeding (value != null) keeps it collapsed, and
  // "not configured" keeps its meaning. The form seeds 1 explicitly the
  // moment the plugins become configurable (handleModeChange / card enable).
  if (plugins['session-affinity']) {
    formPlugins['session-affinity'] = {
      ...plugins['session-affinity'],
      sessionKeys: toFormSessionKeys(plugins['session-affinity']?.sessionKeys)
    };
  }
  if (plugins['least-load']) {
    formPlugins['least-load'] = { ...plugins['least-load'] };
  }
  return formPlugins;
};

const omitEmpty = (value: any) =>
  _.omitBy(value, (v: any) => v === undefined || v === null || v === '');

// Clamp a policy influence into (0, 2]. A non-positive/absent value falls
// back to null so `omitEmpty` drops it and the server applies the plugin's
// built-in default — 0 is a transient mid-typing state in the form, never a
// meaningful influence.
const toServerWeight = (weight?: number | null): number | null => {
  if (weight == null || weight <= 0) {
    return null;
  }
  return Math.min(2, weight);
};

const buildSessionAffinity = (
  formConfig: SessionAffinityPluginConfig & {
    sessionKeys?: SessionKeyFormItem[];
  }
) => {
  const sessionKeys = toServerSessionKeys(formConfig?.sessionKeys);
  return omitEmpty({
    enabled: true,
    sessionKeys,
    weight: toServerWeight(formConfig?.weight),
    // Round-trip the stored path gating: an unrelated edit must not strip
    // the restriction from an existing config.
    enableOnPathSuffix: formConfig?.enableOnPathSuffix
  });
};

// Build the PUT `plugins` object following the API's three-state contract:
// absent = leave untouched, object = replace config, null = delete config.
// The `lb` plugin has no form UI — its config is never touched here.
export const buildPluginsPayload = (
  formPlugins: Record<string, any> | undefined,
  originalPlugins: RoutePlugins | undefined
): RoutePlugins | undefined => {
  const payload: RoutePlugins = {};

  // session-affinity. Enabled but with no session keys yet (e.g. the user
  // toggled back to weighted mode mid-edit) is treated as not configured —
  // the server would reject an empty key chain with a 422.
  const saForm = formPlugins?.['session-affinity'];
  const saOriginal = originalPlugins?.['session-affinity'];
  const saConfigured =
    !!saForm?.enabled && toServerSessionKeys(saForm?.sessionKeys).length > 0;
  if (saConfigured) {
    const serverConfig: any = buildSessionAffinity(saForm);
    if (!_.isEqual(serverConfig, saOriginal)) {
      payload['session-affinity'] = serverConfig;
    }
  } else if (saOriginal && saOriginal.enabled !== false) {
    // Only an effectively-enabled stored config is worth deleting when the
    // form disables it (a stored config may omit `enabled`, as in the API's
    // PUT examples — that counts as enabled). A config explicitly disabled
    // server-side is left untouched (absent = leave alone), not nulled.
    payload['session-affinity'] = null;
  }

  // least-load
  const llForm = formPlugins?.['least-load'];
  const llOriginal = originalPlugins?.['least-load'];
  if (llForm?.enabled) {
    const serverConfig: any = omitEmpty({
      enabled: true,
      weight: toServerWeight(llForm?.weight)
    });
    if (!_.isEqual(serverConfig, llOriginal)) {
      payload['least-load'] = serverConfig;
    }
  } else if (llOriginal && llOriginal.enabled !== false) {
    payload['least-load'] = null;
  }

  return _.isEmpty(payload) ? undefined : payload;
};
