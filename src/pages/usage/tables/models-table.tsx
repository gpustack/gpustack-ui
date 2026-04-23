import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import PageBox from '@/pages/_components/page-box';
import { IconFont, NoResult } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { ConfigProvider, Table } from 'antd';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { FilterOptionType } from '../config/types';
import useUsersColumns from '../hooks/use-models-columns';
import useQueryBreakdownList from '../services/use-query-breakdown-list';
import getBreakdownRowKey from '../utils/get-breakdown-row-key';

const Models: React.FC<{
  models: FilterOptionType[];
  dateRange: { start_date: string; end_date: string };
  scope: string;
  pageResetKey?: number;
  refreshKey?: number;
}> = ({ models, dateRange, scope, pageResetKey = 0, refreshKey = 0 }) => {
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
      group_by: ['model'],
      filters: {
        models
      },
      scope: scope,
      ...dateRange
    });
  }, [
    dateRange.end_date,
    dateRange.start_date,
    models,
    queryParams.page,
    queryParams.perPage,
    queryParams.sort_by,
    refreshKey,
    scope
  ]);

  return (
    <>
      <PageBox>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            dataSource={dataSource.dataList}
            rowKey={(record) => getBreakdownRowKey(record, 'models')}
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
        </ConfigProvider>
      </PageBox>
    </>
  );
};

export default Models;
