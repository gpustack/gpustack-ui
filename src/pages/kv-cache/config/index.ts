import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { GrafanaIcon, IconFont, icons } from '@gpustack/core-ui';
import React from 'react';
import {
  CacheProviderField,
  CacheProviderItem,
  CacheProviderResourceProfile,
  CacheServiceInstanceItem,
  ListItem
} from './types';

// The support matrix keys the image a node with no accelerator runs under
// this, beside the accelerator families. It is not one of them, so a claim
// about which accelerators a provider covers leaves it out.
export const CPU_BACKEND = 'cpu';

// A family that builds one image per SoC generation keys them
// "<family>-<variant>" (e.g. "cann-910b"). The family is what a worker
// reports, and what a claim about coverage is made in.
export const backendFamily = (key: string) => key.split('-')[0];

// Whether a version's support matrix carries a build for this accelerator
// family. Any of the family's per-generation builds answers: a worker
// reports the family, and the generation is the worker's own to resolve —
// it may still refuse one built for another.
export const matrixServesFamily = (
  matrix: Record<string, Record<string, string>>,
  family: string
) =>
  // Both sides through the same reduction: a worker reports the family today,
  // and the day one reports "cann-910b" this still answers about cann.
  Object.keys(matrix).some(
    (key) => backendFamily(key) === backendFamily(family)
  );

export const ProviderSourceLabelMap: Record<string, string> = {
  built_in: 'kvCache.provider.source.builtin',
  community: 'kvCache.provider.source.community',
  partner: 'kvCache.provider.source.partner'
};

export const ProviderSourceColorMap: Record<string, string> = {
  built_in: 'geekblue',
  community: 'green',
  partner: 'gold'
};

export const ServiceStateValueMap = {
  Pending: 'pending',
  Starting: 'starting',
  Running: 'running',
  Error: 'error',
  Unreachable: 'unreachable'
};

export const ServiceStateLabelMap: Record<string, string> = {
  [ServiceStateValueMap.Pending]: 'Pending',
  [ServiceStateValueMap.Starting]: 'Starting',
  [ServiceStateValueMap.Running]: 'Running',
  [ServiceStateValueMap.Error]: 'Error',
  [ServiceStateValueMap.Unreachable]: 'Unreachable'
};

export const ServiceStatus: Record<string, StatusType> = {
  [ServiceStateValueMap.Pending]: StatusMaps.transitioning,
  [ServiceStateValueMap.Starting]: StatusMaps.transitioning,
  [ServiceStateValueMap.Running]: StatusMaps.success,
  [ServiceStateValueMap.Error]: StatusMaps.error,
  [ServiceStateValueMap.Unreachable]: StatusMaps.warning
};

// states where the managed container has logs to show
const logViewableStates: string[] = [
  ServiceStateValueMap.Starting,
  ServiceStateValueMap.Running,
  ServiceStateValueMap.Error,
  ServiceStateValueMap.Unreachable
];

// service-level logs exist only for single-instance (singleton topology)
// services; per_node services expose logs per instance on the detail page
export const canViewServiceLogs = (
  record: ListItem,
  provider?: CacheProviderItem
) =>
  provider?.topology !== 'per_node' &&
  !!record.worker_id &&
  logViewableStates.includes(record.state);

export const canViewInstanceLogs = (instance: CacheServiceInstanceItem) =>
  logViewableStates.includes(instance.state);

// hrefs built from stored config must never carry a javascript: scheme
export const isHttpUrl = (url?: string | null): boolean =>
  !!url && /^https?:\/\//i.test(url);

// resource_profile.ram_gib is a template over the declared field
// values; rendering it yields one instance's RAM claim in GiB (0 when
// the profile is absent or a referenced field has no value)
export const profileRamGib = (
  profile: CacheProviderResourceProfile | undefined,
  managedFields: CacheProviderField[] | undefined,
  values?: Record<string, any> | null
): number => {
  const template = profile?.ram_gib;
  if (!template) {
    return 0;
  }
  const rendered = template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, name) => {
    const declared = managedFields?.find((field) => field.name === name);
    const value = values?.[name] ?? declared?.default;
    return value == null ? '' : `${value}`;
  });
  const value = Number(rendered);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

// The reserved "custom" version names no release, so the image the
// service actually runs stands in for it.
export const formatServiceVersion = (
  providerVersion?: string,
  image?: string
) => {
  if (!providerVersion) {
    return '';
  }
  return providerVersion === 'custom' && image ? image : providerVersion;
};

// actions for an instance row: logs when the state can have any, and
// delete-and-recreate in every state — it is the recovery path for
// crash-looping instances
export const instanceActionItems = (record: CacheServiceInstanceItem) => {
  const items: {
    key: string;
    label: string;
    icon?: React.ReactNode;
    props?: Record<string, any>;
  }[] = [];
  if (canViewInstanceLogs(record)) {
    items.push({
      key: 'viewlogs',
      label: 'kvCache.button.viewLogs',
      icon: React.createElement(IconFont, { type: 'icon-logs' })
    });
  }
  items.push({
    key: 'delete',
    label: 'common.button.delrecreate',
    icon: icons.DeleteOutlined,
    props: { danger: true }
  });
  return items;
};

export interface ServiceRowAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  props?: Record<string, any>;
  show?: (record: ListItem, provider?: CacheProviderItem) => boolean;
}

// actions for each row
export const rowActionList: ServiceRowAction[] = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: icons.EditOutlined
  },
  {
    key: 'viewlogs',
    label: 'kvCache.button.viewLogs',
    icon: React.createElement(IconFont, { type: 'icon-logs' }),
    show: canViewServiceLogs
  },
  {
    key: 'metrics',
    label: 'resources.metrics.details',
    icon: React.createElement(
      'span',
      { className: 'flex-center' },
      React.createElement(GrafanaIcon, { style: { width: 14, height: 14 } })
    )
  },
  {
    key: 'delete',
    label: 'common.button.delete',
    icon: icons.DeleteOutlined,
    props: {
      danger: true
    }
  }
];

// Seeded into the provider-source editor while it is empty. All comments, so
// an untouched hint still counts as "nothing configured" — and the shape is
// what a reader needs before the built-in file (which is the thing to actually
// edit) makes sense: a list of providers, each naming the image its versions
// run and the command that launches them.
export const providerSourceTemplate = `# A YAML list of cache provider declarations. What you save replaces the
# built-in catalog entirely — every provider it does not declare goes out of
# service — so start from Built-in File above rather than from this hint.
#
# Example:
#
# - name: LMCache
#   display_name: LMCache
#   description: A KV cache layer for LLM serving.
#   default_version: v0.5.3
#   versions:
#     v0.5.3:
#       image: lmcache/vllm-openai:latest
#   # {{host}} and {{port}} are filled in by the platform
#   default_run_command: >-
#     lmcache server --host {{host}} --port {{port}}
#   # what an inference backend needs to attach to a service of this provider
#   inference_backend_integrations:
#     - backend: vLLM
#       injection:
#         kv_transfer_config:
#           kv_connector: LMCacheMPConnector
#           kv_role: kv_both
#           kv_connector_extra_config:
#             lmcache.mp.host: "tcp://{{host}}"
#             lmcache.mp.port: "{{port}}"
`;
