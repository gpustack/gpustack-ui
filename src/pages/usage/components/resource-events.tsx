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

const RESOURCE_TYPE_OPTIONS = [
  { value: 'gpu_instance', label: 'GPU Instance' },
  { value: 'persistent_volume', label: 'Persistent Volume' }
];

const EVENT_TYPE_OPTIONS = [
  { value: 'created', label: 'Created' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'phase_to_metered', label: 'Started' },
  { value: 'phase_left_metered', label: 'Stopped' },
  { value: 'updated', label: 'Updated' },
  { value: 'attached', label: 'Attached' },
  { value: 'detached', label: 'Detached' }
];

const EVENT_COLOR: Record<string, string> = {
  created: 'green',
  deleted: 'red',
  phase_to_metered: 'blue',
  phase_left_metered: 'orange',
  updated: 'cyan',
  attached: 'purple',
  detached: 'gold'
};

// Raw event_type → human-readable label (the same wording as the filter).
// ``phase_to_metered`` / ``phase_left_metered`` bracket the metering window —
// when the resource starts / stops accruing metered uptime (the OSS build only
// meters, it doesn't charge). Users shouldn't see the internal enum names.
const EVENT_LABEL: Record<string, string> = Object.fromEntries(
  EVENT_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

const ResourceEvents: React.FC = () => {
  const access = useAccess();
  const intl = useIntl();
  const canManageUsers = !!access.canSeeOrgAdmin;
  const scope = canManageUsers ? 'all' : 'self';

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
        title: 'Time',
        dataIndex: 'occurred_at',
        key: 'occurred_at',
        render: (v: string) =>
          v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-',
        width: 200
      },
      {
        title: 'Resource',
        dataIndex: 'resource_type',
        key: 'resource_type',
        render: (v: string) =>
          v === 'gpu_instance' ? 'GPU Instance' : 'Persistent Volume',
        width: 160
      },
      {
        title: 'Name',
        dataIndex: 'resource_name',
        key: 'resource_name'
      },
      {
        title: 'Event',
        dataIndex: 'event_type',
        key: 'event_type',
        render: (v: string) => (
          <Tag color={EVENT_COLOR[v] ?? 'default'}>{EVENT_LABEL[v] ?? v}</Tag>
        ),
        width: 180
      },
      {
        title: 'Phase',
        dataIndex: 'phase',
        key: 'phase',
        width: 140
      },
      {
        title: 'Creator',
        dataIndex: 'creator_name',
        key: 'creator_name',
        render: (v?: string, row?: ResourceEventItem) =>
          v ?? (row?.creator_id ? `principal:${row.creator_id}` : '-'),
        width: 160
      },
      {
        title: 'Message',
        dataIndex: 'event_message',
        key: 'event_message',
        render: (v?: string) => v ?? '-'
      }
    ],
    []
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
                id: 'usage.events.resourceType',
                defaultMessage: 'Resource type'
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
                id: 'usage.events.eventType',
                defaultMessage: 'Event type'
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
