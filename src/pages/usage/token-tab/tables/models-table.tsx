import PluginExtraFields from '@/components/plugin-extra-fields';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import PageBox from '@/pages/_components/page-box';
import { useIntl } from '@umijs/max';
import { Table } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BreakdownFilters, BreakdownItem } from '../../config/types';
import useModelsColumns from '../../hooks/use-models-columns';
import useQueryBreakdownList from '../../services/use-query-breakdown-list';
import getBreakdownRowKey from '../../utils/get-breakdown-row-key';

// Falls back here whenever the sorter is cleared or absent, so a page click
// can never send ``sort_by: undefined`` and reshuffle the rows.
const DEFAULT_SORT = '-total_tokens';

const Models: React.FC<{
  filters: BreakdownFilters;
  dateRange: { start_date: string; end_date: string };
  scope: string;
  pageResetKey?: number;
  refreshKey?: number;
}> = ({ filters, dateRange, scope, pageResetKey = 0, refreshKey = 0 }) => {
  const intl = useIntl();

  const { loading, dataSource, fetchData } = useQueryBreakdownList({
    key: 'modelsTableData'
  });
  const [queryParams, setQueryParams] = useState<{
    page: number;
    perPage: number;
    sort_by: string;
  }>({
    page: 1,
    perPage: 10,
    sort_by: DEFAULT_SORT
  });
  const pendingPageResetRef = useRef(false);

  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    // antd fires Table.onChange for paging too, with an empty ``sorter``.
    // This handler used to reset to page 1 unconditionally, so it undid the
    // page the pagination handler had just set and the table could never
    // leave page 1; it also read ``field`` off that empty sorter and sent
    // ``sort_by: undefined``, dropping the order.
    const sort_by = !s?.order
      ? DEFAULT_SORT
      : s.order === 'ascend'
        ? s.field
        : `-${s.field}`;
    // Only a real sort change snaps back to page 1; otherwise this is a no-op
    // and the two handlers compose (matches the resource tabs' tables).
    setQueryParams((prev) =>
      prev.sort_by === sort_by ? prev : { ...prev, sort_by, page: 1 }
    );
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setQueryParams((prev) => ({
      ...prev,
      page,
      perPage: pageSize
    }));
  };

  const columns = useModelsColumns();

  useEffect(() => {
    if (queryParams.page !== 1) {
      pendingPageResetRef.current = true;
      setQueryParams((prev) => ({
        ...prev,
        page: 1
      }));
    }
  }, [pageResetKey]);

  useEffect(() => {
    if (pendingPageResetRef.current && queryParams.page !== 1) {
      return;
    }
    pendingPageResetRef.current = false;

    fetchData({
      ...queryParams,
      group_by: ['route'],
      // Send the full filter set (route / user / api_key), not just the
      // table's own dimension, so the breakdown matches the trend chart.
      filters,
      scope: scope,
      ...dateRange
    });
  }, [
    dateRange.end_date,
    dateRange.start_date,
    filters,
    queryParams.page,
    queryParams.perPage,
    queryParams.sort_by,
    refreshKey,
    scope
  ]);

  // Route ids currently visible in the Models tab. Mirrored to the
  // plugin slot below so enterprise plugins can bulk-fetch per-route
  // data (e.g. the caller's quota / usage on each route) in one call
  // rather than firing N round-trips from each cell. `refreshToken`
  // bumps with every successful fetch so plugins re-pull even when the
  // id set hasn't changed.
  const pluginContext = useMemo(
    () => ({
      routeIds: (dataSource.dataList || [])
        .map((item) => item.route?.identity?.current?.route_id)
        .filter((id): id is number => id != null),
      refreshToken: refreshKey
    }),
    [dataSource.dataList, refreshKey]
  );

  return (
    <>
      <PageBox>
        <Table
          columns={columns}
          dataSource={dataSource.dataList}
          rowKey={(record: BreakdownItem) =>
            getBreakdownRowKey(record, 'models')
          }
          loading={{
            spinning: loading,
            size: 'middle'
          }}
          sortDirections={TABLE_SORT_DIRECTIONS}
          showSorterTooltip={false}
          onChange={handleTableChange}
          pagination={{
            size: 'middle',
            showSizeChanger: true,
            pageSize: queryParams.perPage,
            current: queryParams.page,
            total: dataSource.total,
            hideOnSinglePage: queryParams.perPage === 10,
            onChange: handlePageChange
          }}
        ></Table>
      </PageBox>
      {/* Page-level data lifecycle for plugin-contributed extra
          columns on this tab. Receives the visible route ids so the
          plugin can bulk-fetch per-route data in one call; renders
          nothing when no plugin is registered. */}
      <PluginExtraFields name="UsageModelsPageGlobal" context={pluginContext} />
    </>
  );
};

export default Models;
