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
import { SimpleSelect } from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Input, Select, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ResourceEventItem } from '../apis/resource';
import ResourceFilterBar from '../components/resource-filter-bar';
import { parseRollup } from '../utils/time-buckets';
import useQueryResourceEvents from './services/use-query-resource-events';

// Only these four are ever emitted (see resource_event_logger): create/delete
// + the metering-window pair. updated/attached/detached exist as enum values
// but are intentionally not recorded, so they're not offered as filters.
const EVENT_COLOR: Record<string, string> = {
  created: 'green',
  deleted: 'red',
  phase_to_metered: 'blue',
  phase_left_metered: 'orange'
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

  // All filters live in one query-params object; ``resourceType`` is single
  // (the backend filters by one) and ``nameQuery`` is the debounced substring.
  type QueryParams = {
    dateRange: [dayjs.Dayjs, dayjs.Dayjs];
    resourceType?: string;
    eventTypes: string[];
    nameQuery: string;
    page: number;
    perPage: number;
  };
  const [queryParams, setQueryParams] = useState<QueryParams>({
    dateRange: [dayjs().subtract(29, 'day'), dayjs()],
    resourceType: undefined,
    eventTypes: [],
    nameQuery: '',
    perPage: 50,
    page: 1
  });
  const { detailData: data, loading, fetchData } = useQueryResourceEvents();

  // Latest params, so the stable debounced name handler reads current values.
  const queryRef = useRef(queryParams);
  queryRef.current = queryParams;

  // Single fetch entry point: merge the patch into the current params, persist
  // them, then request — triggered from each handler rather than from effect
  // dependencies, so there's exactly one request per user action.
  const fetchEvents = useMemoizedFn((patch: Partial<QueryParams>) => {
    const params = { ...queryRef.current, ...patch };
    setQueryParams(params);
    return fetchData({
      start_date: params.dateRange[0].format('YYYY-MM-DD'),
      end_date: params.dateRange[1].format('YYYY-MM-DD'),
      scope,
      resource_types: params.resourceType ? [params.resourceType] : undefined,
      resource_name: params.nameQuery || undefined,
      event_types: params.eventTypes,
      page: params.page,
      perPage: 50
    });
  });

  // First load only — subsequent fetches are driven by the handlers below.
  useEffect(() => {
    fetchEvents({});
  }, []);

  // Debounced name search; a filter change always resets to page 1.
  const onNameChange = useMemo(
    () =>
      _.debounce(
        (value: string) => fetchEvents({ nameQuery: value.trim(), page: 1 }),
        400
      ),
    [fetchEvents]
  );

  const columns = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: 'usage.events.col.time' }),
        dataIndex: 'occurred_at',
        key: 'occurred_at',
        // Backend sends the rollup-tz instant with its offset; parseRollup keeps
        // it (no conversion to the browser tz).
        render: (v: string) =>
          v ? parseRollup(v).format('YYYY-MM-DD HH:mm:ss') : '-',
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
        value={queryParams.dateRange}
        onChange={(dates) => fetchEvents({ dateRange: dates, page: 1 })}
        // No user filter here — the events list has no User column. Scope is
        // still applied to the query (members see only their own events).
        canManageUsers={false}
        userOptions={[]}
        selectedUsers={[]}
        onUsersChange={() => {}}
        onRefresh={() => fetchEvents({})}
        extra={
          <>
            <Input
              allowClear
              placeholder={intl.formatMessage({
                id: 'usage.events.resourceName'
              })}
              onChange={(e) => onNameChange(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              allowClear
              placeholder={intl.formatMessage({
                id: 'usage.events.resourceType'
              })}
              value={queryParams.resourceType}
              onChange={(v) => fetchEvents({ resourceType: v, page: 1 })}
              options={RESOURCE_TYPE_OPTIONS}
              style={{ minWidth: 200 }}
            />
            <SimpleSelect
              mode="multiple"
              allowClear
              showSearch
              maxTagCount={'responsive'}
              placeholder={intl.formatMessage({
                id: 'usage.events.eventType'
              })}
              value={queryParams.eventTypes}
              onChange={(v) => fetchEvents({ eventTypes: v, page: 1 })}
              options={EVENT_TYPE_OPTIONS}
              style={{ width: 240 }}
            />
          </>
        }
      />

      <Table
        rowKey="id"
        dataSource={data?.items ?? []}
        columns={columns as any}
        style={{ marginTop: 24 }}
        loading={{
          spinning: loading,
          size: 'middle'
        }}
        pagination={{
          size: 'middle',
          current: queryParams.page,
          pageSize: data?.pagination?.perPage ?? 50,
          total: data?.pagination?.total ?? 0,
          showSizeChanger: false,
          hideOnSinglePage: queryParams.perPage === 50,
          onChange: (p) => fetchEvents({ page: p })
        }}
      />
    </div>
  );
};

export default ResourceEvents;
