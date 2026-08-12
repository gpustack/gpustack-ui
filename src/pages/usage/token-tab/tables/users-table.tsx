import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import PageBox from '@/pages/_components/page-box';
import { useIntl } from '@umijs/max';
import { Table } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { BreakdownFilters } from '../../config/types';
import useUsersColumns from '../../hooks/use-users-columns';
import useQueryBreakdownList from '../../services/use-query-breakdown-list';
import getBreakdownRowKey from '../../utils/get-breakdown-row-key';

// Falls back here whenever the sorter is cleared or absent, so a page click
// can never send ``sort_by: undefined`` and reshuffle the rows.
const DEFAULT_SORT = '-total_tokens';

const Users: React.FC<{
  filters: BreakdownFilters;
  dateRange: { start_date: string; end_date: string };
  scope: string;
  pageResetKey?: number;
  refreshKey?: number;
}> = ({ filters, dateRange, scope, pageResetKey = 0, refreshKey = 0 }) => {
  const intl = useIntl();

  const { loading, dataSource, fetchData } = useQueryBreakdownList({
    key: 'usersTableData'
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

  const columns = useUsersColumns();

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

    if (scope === 'all') {
      fetchData({
        ...queryParams,
        group_by: ['user'],
        // Send the full filter set (route / user / api_key), not just the
        // table's own dimension, so the breakdown matches the trend chart.
        filters,
        scope: scope,
        ...dateRange
      });
    }
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

  return (
    <>
      <PageBox>
        <Table
          columns={columns}
          dataSource={dataSource.dataList}
          rowKey={(record) => getBreakdownRowKey(record, 'users')}
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
    </>
  );
};

export default Users;
