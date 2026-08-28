import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { GrafanaIcon, IconFont, icons } from '@gpustack/core-ui';
import React from 'react';
import { CacheProviderItem, CacheServiceInstanceItem, ListItem } from './types';

export const ServiceModeValueMap = {
  Managed: 'managed',
  External: 'external'
};

export const ServiceModeMap: Record<string, string> = {
  [ServiceModeValueMap.Managed]: 'kvCache.mode.managed',
  [ServiceModeValueMap.External]: 'kvCache.mode.external'
};

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

// managed=blue, external=purple; gold stays reserved for the certified
// partner badge
export const ServiceModeColorMap: Record<string, string> = {
  managed: 'blue',
  external: 'purple'
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
  record.mode === ServiceModeValueMap.Managed &&
  provider?.topology !== 'per_node' &&
  !!record.worker_id &&
  logViewableStates.includes(record.state);

export const canViewInstanceLogs = (instance: CacheServiceInstanceItem) =>
  logViewableStates.includes(instance.state);

// hrefs built from stored config must never carry a javascript: scheme
export const isHttpUrl = (url?: string | null): boolean =>
  !!url && /^https?:\/\//i.test(url);

// The reserved "custom" version says nothing by itself, so it is shown with
// the image the service actually runs.
export const formatServiceVersion = (
  providerVersion?: string,
  image?: string
) => {
  if (!providerVersion) {
    return '';
  }
  return providerVersion === 'custom' && image
    ? `${providerVersion} (${image})`
    : providerVersion;
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
