/**
 * Resource Events panel — lifecycle event list.
 *
 * Each row is one ``resource_events`` row: when a GPU instance / PV was
 * created, transitioned metered, attached / detached, deleted, etc.
 *
 * Mounted as a stretch tab in the Usage page. Filter bar matches the Tokens
 * tab (date range + "filter by user" for managers); the resource-type /
 * event-type selects ride in the bar's ``extra`` slot.
 */
import { useAccess, useIntl } from '@umijs/max';
import { Select, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  queryResourceEvents,
  ResourceEventItem,
  ResourceEventsResponse
} from '../apis/resource';
import useResourceMeta from '../hooks/use-resource-meta';
import ResourceFilterBar from './resource-filter-bar';

const EVENT_COLOR: Record<string, string> = {
  created: 'green',
  deleted: 'red',
  phase_to_metered: 'blue',
  phase_left_metered: 'orange',
  updated: 'cyan',
  attached: 'purple',
  detached: 'gold'
};

// Humanize a failure phase enum for display, e.g. "SSHPublicKeyCreateFailed" →
// "SSH Public Key Create Failed" (fallback when the backend has no detail).
const humanizePhase = (phase: string): string =>
  phase
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2');

const ResourceEvents: React.FC = () => {
  const access = useAccess();
  const intl = useIntl();
  const canManageUsers = !!access.canSeeOrgAdmin;
  const scope = canManageUsers ? 'all' : 'self';

  // Users only ever see "Storage" in the product — never "Persistent Volume".
  const RESOURCE_TYPE_LABELS: Record<string, string> = useMemo(
    () => ({
      gpu_instance: intl.formatMessage({
        id: 'usage.events.resource.gpuInstance'
      }),
      cpu_instance: intl.formatMessage({
        id: 'usage.events.resource.cpuInstance'
      }),
      persistent_volume: intl.formatMessage({ id: 'usage.tabs.storage' })
    }),
    [intl]
  );

  const RESOURCE_TYPE_OPTIONS = useMemo(
    () => [
      { value: 'gpu_instance', label: RESOURCE_TYPE_LABELS.gpu_instance },
      {
        value: 'persistent_volume',
        label: RESOURCE_TYPE_LABELS.persistent_volume
      }
    ],
    [RESOURCE_TYPE_LABELS]
  );

  const EVENT_TYPE_OPTIONS = useMemo(
    () => [
      {
        value: 'created',
        label: intl.formatMessage({ id: 'usage.events.type.created' })
      },
      {
        value: 'deleted',
        label: intl.formatMessage({ id: 'usage.events.type.deleted' })
      },
      {
        value: 'phase_to_metered',
        label: intl.formatMessage({ id: 'usage.events.type.started' })
      },
      {
        value: 'phase_left_metered',
        label: intl.formatMessage({ id: 'usage.events.type.stopped' })
      },
      {
        value: 'updated',
        label: intl.formatMessage({ id: 'usage.events.type.updated' })
      },
      {
        value: 'attached',
        label: intl.formatMessage({ id: 'usage.events.type.attached' })
      },
      {
        value: 'detached',
        label: intl.formatMessage({ id: 'usage.events.type.detached' })
      }
    ],
    [intl]
  );

  // Raw event_type → human-readable label (the same wording as the filter).
  // ``phase_to_metered`` / ``phase_left_metered`` bracket the metering window —
  // when the resource starts / stops accruing metered uptime (the OSS build
  // only meters, it doesn't charge). Users shouldn't see the internal enum
  // names.
  const EVENT_LABEL: Record<string, string> = useMemo(
    () => Object.fromEntries(EVENT_TYPE_OPTIONS.map((o) => [o.value, o.label])),
    [EVENT_TYPE_OPTIONS]
  );

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs()
  ]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [resourceTypes, setResourceTypes] = useState<string[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ResourceEventsResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { creators: userOptions } = useResourceMeta(scope);

  const fetch = async () => {
    try {
      const res = await queryResourceEvents({
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        scope,
        filters: selectedUsers.length
          ? { creator_ids: selectedUsers }
          : undefined,
        resource_types: resourceTypes,
        event_types: eventTypes,
        page,
        perPage: 50
      });
      setData(res);
    } catch {
      // Keep last response on failure.
    }
  };

  useEffect(() => {
    fetch();
  }, [dateRange, selectedUsers, resourceTypes, eventTypes, page, refreshKey]);

  const columns = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: 'usage.events.col.time' }),
        dataIndex: 'occurred_at',
        key: 'occurred_at',
        render: (v: string) =>
          v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-',
        width: 200
      },
      {
        title: intl.formatMessage({ id: 'usage.events.col.resource' }),
        dataIndex: 'resource_type',
        key: 'resource_type',
        render: (v: string) => RESOURCE_TYPE_LABELS[v] || v,
        width: 160
      },
      {
        title: intl.formatMessage({ id: 'usage.table.name' }),
        dataIndex: 'resource_name',
        key: 'resource_name'
      },
      {
        title: intl.formatMessage({ id: 'usage.events.col.event' }),
        dataIndex: 'event_type',
        key: 'event_type',
        render: (v: string) => (
          <Tag color={EVENT_COLOR[v] ?? 'default'}>{EVENT_LABEL[v] ?? v}</Tag>
        ),
        width: 180
      },
      {
        title: intl.formatMessage({ id: 'usage.events.col.message' }),
        dataIndex: 'event_message',
        key: 'event_message',
        render: (v?: string, row?: ResourceEventItem) => {
          // A failure phase (…Failed) is the one thing not already shown in the
          // Event column — surface it (with its detail) as an error message.
          if (row?.phase && /failed$/i.test(row.phase)) {
            return (
              <span style={{ color: 'var(--ant-color-error)' }}>
                {row.phase_message || humanizePhase(row.phase)}
              </span>
            );
          }
          return v ?? '-';
        }
      }
    ],
    [intl, RESOURCE_TYPE_LABELS, EVENT_LABEL]
  );

  return (
    <div>
      <ResourceFilterBar
        value={dateRange}
        onChange={(dates) => {
          setDateRange(dates);
          setPage(1);
        }}
        canManageUsers={canManageUsers}
        userOptions={userOptions}
        selectedUsers={selectedUsers}
        onUsersChange={(ids) => {
          setSelectedUsers(ids);
          setPage(1);
        }}
        onRefresh={() => setRefreshKey((k) => k + 1)}
        extra={
          <>
            <Select
              mode="multiple"
              allowClear
              placeholder={intl.formatMessage({
                id: 'usage.events.resourceType'
              })}
              value={resourceTypes}
              onChange={(v) => {
                setResourceTypes(v);
                setPage(1);
              }}
              options={RESOURCE_TYPE_OPTIONS}
              style={{ minWidth: 200 }}
            />
            <Select
              mode="multiple"
              allowClear
              placeholder={intl.formatMessage({
                id: 'usage.events.eventType'
              })}
              value={eventTypes}
              onChange={(v) => {
                setEventTypes(v);
                setPage(1);
              }}
              options={EVENT_TYPE_OPTIONS}
              style={{ minWidth: 240 }}
            />
          </>
        }
      />

      <Table
        rowKey="id"
        dataSource={data?.items ?? []}
        columns={columns as any}
        style={{ marginTop: 24 }}
        pagination={{
          current: page,
          pageSize: data?.pagination.perPage ?? 50,
          total: data?.pagination.total ?? 0,
          onChange: (p) => setPage(p)
        }}
      />
    </div>
  );
};

export default ResourceEvents;
