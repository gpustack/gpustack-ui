import IconFont from '@/components/icon-font';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import NoResult from '@/pages/_components/no-result';
import PageBox from '@/pages/_components/page-box';
import { useIntl } from '@umijs/max';
import { ConfigProvider, Table } from 'antd';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { FilterOptionType } from '../config/types';
import useAPIKeys from '../hooks/use-apikeys-columns';
import useQueryBreakdownList from '../services/use-query-breakdown-list';
import getBreakdownRowKey from '../utils/get-breakdown-row-key';

const APIKeys: React.FC<{
  apiKeys: FilterOptionType[];
  dateRange: { start_date: string; end_date: string };
  scope: string;
  pageResetKey?: number;
  refreshKey?: number;
}> = ({ apiKeys, dateRange, scope, pageResetKey = 0, refreshKey = 0 }) => {
  const intl = useIntl();

  const { loading, dataSource, fetchData } = useQueryBreakdownList({
    key: 'apiKeysTableData'
  });
  const [queryParams, setQueryParams] = useState<{
    page: number;
    perPage: number;
    sort_by: string;
  }>({
    page: 1,
    perPage: 10,
    sort_by: ''
  });
  const pendingPageResetRef = useRef(false);

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    let sort_by =
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
  const columns = useAPIKeys();

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
        image={<IconFont type="icon-key" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.keys.nofound'
        })}
        title={intl.formatMessage({ id: 'noresult.keys.title' })}
        subTitle={intl.formatMessage({ id: 'noresult.keys.subTitle' })}
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
      group_by: ['api_key'],
      filters: {
        api_keys: apiKeys
      },
      scope: scope,
      ...dateRange
    });
  }, [
    apiKeys,
    dateRange.end_date,
    dateRange.start_date,
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
            rowKey={getBreakdownRowKey}
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

export default APIKeys;
