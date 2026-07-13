import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import { Table } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { ResourceBreakdownItem } from '../../apis/resource';
import useQueryStorageBreakdown from '../services/use-query-storage-breakdown';
import useStorageColumns from './use-storage-columns';

type Scope = 'self' | 'all';
type Metric = 'storage_gb_days' | 'storage_gb_hours';
type GroupKey = 'volume' | 'user';

// The frontend metric keys (storage_gb_days/hours) map to the server's
// breakdown metric keys (gb_days/gb_hours).
const ORDER_BY_KEY: Record<Metric, string> = {
  storage_gb_days: 'gb_days',
  storage_gb_hours: 'gb_hours'
};

const PER_PAGE = 50;
// sort_by encodes order as a string (`-` prefix = descending), so the fetch
// effect dedupes naturally on the primitive. Default: GB-Days descending.
const DEFAULT_SORT = '-gb_days';

interface Props {
  groupKey: GroupKey;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  scope: Scope;
  selectedUsers: number[];
  selectedVolumes: number[];
  // Platform-wide "All" view only (enterprise-gated); empty otherwise.
  selectedOrganizations?: number[];
  selectedUserGroups?: number[];
  // Bumped by the parent when a filter changes, so each mounted table snaps
  // back to page 1 independently.
  pageResetKey?: number;
  refreshKey?: number;
}

/**
 * One storage breakdown table, owning its own page/sort/data. Both tabs mount
 * an instance (volume / user) and keep it alive (Tabs `forceRender`), so each
 * keeps its own pagination + sort and switching tabs neither refetches nor
 * resets the other.
 */
const StorageBreakdownTable: React.FC<Props> = ({
  groupKey,
  dateRange,
  scope,
  selectedUsers,
  selectedVolumes,
  selectedOrganizations = [],
  selectedUserGroups = [],
  pageResetKey = 0,
  refreshKey = 0
}) => {
  const [queryParams, setQueryParams] = useState<{
    page: number;
    perPage: number;
    sort_by: string;
  }>({ page: 1, perPage: PER_PAGE, sort_by: DEFAULT_SORT });
  const pendingPageResetRef = useRef(false);

  const { detailData, loading, fetchData } = useQueryStorageBreakdown({
    key: `storageBreakdown-${groupKey}`
  });

  const columns = useStorageColumns(groupKey);

  // Sort only — paging goes through handlePageChange, so this stays
  // page-agnostic and the two compose (matches the Tokens tab tables).
  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = ORDER_BY_KEY[s?.field as Metric];
    // Cleared (3rd click) or an unknown column → default GB-Days descending.
    const sort_by =
      !field || !s?.order
        ? DEFAULT_SORT
        : s.order === 'ascend'
          ? field
          : `-${field}`;
    // Only a real sort change snaps back to page 1; an unchanged sort_by
    // (e.g. the onChange that fires alongside a page click) is a no-op, so it
    // doesn't fight handlePageChange.
    setQueryParams((prev) =>
      prev.sort_by === sort_by ? prev : { ...prev, sort_by, page: 1 }
    );
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setQueryParams((prev) => ({ ...prev, page, perPage: pageSize }));
  };

  // Filters changed upstream → snap back to page 1. Defer the fetch until the
  // page-1 render so we don't fire a stale page-N request first.
  useEffect(() => {
    if (queryParams.page !== 1) {
      pendingPageResetRef.current = true;
      setQueryParams((prev) => ({ ...prev, page: 1 }));
    }
  }, [pageResetKey]);

  useEffect(() => {
    if (pendingPageResetRef.current && queryParams.page !== 1) return;
    pendingPageResetRef.current = false;

    const descending = queryParams.sort_by.startsWith('-');
    fetchData({
      start_date: dateRange[0].format('YYYY-MM-DD'),
      end_date: dateRange[1].format('YYYY-MM-DD'),
      scope,
      filters:
        selectedUsers.length ||
        selectedVolumes.length ||
        selectedOrganizations.length ||
        selectedUserGroups.length
          ? {
              ...(selectedUsers.length ? { creator_ids: selectedUsers } : {}),
              ...(selectedVolumes.length
                ? { volume_ids: selectedVolumes }
                : {}),
              ...(selectedOrganizations.length
                ? { organization_ids: selectedOrganizations }
                : {}),
              ...(selectedUserGroups.length
                ? { user_group_ids: selectedUserGroups }
                : {})
            }
          : undefined,
      group_by: [groupKey],
      page: queryParams.page,
      perPage: queryParams.perPage,
      order_by: descending ? queryParams.sort_by.slice(1) : queryParams.sort_by,
      descending
    });
  }, [
    dateRange,
    scope,
    selectedUsers,
    selectedVolumes,
    selectedOrganizations,
    selectedUserGroups,
    queryParams.page,
    queryParams.perPage,
    queryParams.sort_by,
    refreshKey,
    fetchData
  ]);

  const rows: ResourceBreakdownItem[] = detailData?.items ?? [];

  return (
    <Table
      rowKey={(row) =>
        `${row.volume_id ?? ''}|${row.user_id ?? ''}|${row.volume_name ?? ''}`
      }
      dataSource={rows}
      columns={columns as any}
      loading={{ spinning: loading, size: 'middle' }}
      sortDirections={TABLE_SORT_DIRECTIONS}
      showSorterTooltip={false}
      onChange={handleTableChange}
      pagination={{
        size: 'middle',
        current: queryParams.page,
        pageSize: detailData?.pagination?.perPage ?? queryParams.perPage,
        total: detailData?.pagination?.total ?? 0,
        showSizeChanger: true,
        hideOnSinglePage: queryParams.perPage === PER_PAGE,
        onChange: handlePageChange
      }}
    />
  );
};

export default StorageBreakdownTable;
