import PluginExtraFields from '@/components/plugin-extra-fields';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import PageBox from '@/pages/_components/page-box';
import { IconFont, NoResult } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Table } from 'antd';
import _ from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BreakdownItem, FilterOptionType } from '../../config/types';
import useModelsColumns from '../../hooks/use-models-columns';
import useQueryBreakdownList from '../../services/use-query-breakdown-list';
import getBreakdownRowKey from '../../utils/get-breakdown-row-key';

const Models: React.FC<{
  routes: FilterOptionType[];
  dateRange: { start_date: string; end_date: string };
  scope: string;
  pageResetKey?: number;
  refreshKey?: number;
}> = ({ routes, dateRange, scope, pageResetKey = 0, refreshKey = 0 }) => {
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
    sort_by: '-total_tokens'
  });
  const pendingPageResetRef = useRef(false);

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    console.log('pagination, filters, sorter: ', pagination, filters, sorter);
    const sort_by =
      sorter.order === 'descend' ? `-${sorter.field}` : sorter.field;
    setQueryParams((prev) => ({
      ...prev,
      sort_by
    }));
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

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-resources" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.mymodels.nofound'
        })}
        title={intl.formatMessage({ id: 'noresult.deployments.title' })}
        subTitle={intl.formatMessage({ id: 'noresult.deployments.subTitle' })}
      ></NoResult>
    );
  };

  useEffect(() => {
    if (pendingPageResetRef.current && queryParams.page !== 1) {
      return;
    }
    pendingPageResetRef.current = false;

    fetchData({
      ...queryParams,
      group_by: ['route'],
      filters: {
        routes
      },
      scope: scope,
      ...dateRange
    });
  }, [
    dateRange.end_date,
    dateRange.start_date,
    routes,
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
