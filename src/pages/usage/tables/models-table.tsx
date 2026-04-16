import IconFont from '@/components/icon-font';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import NoResult from '@/pages/_components/no-result';
import PageBox from '@/pages/_components/page-box';
import { useIntl } from '@umijs/max';
import { ConfigProvider, Table } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { FilterOptionType } from '../config/types';
import useUsersColumns from '../hooks/use-models-columns';
import useQueryBreakdownList from '../services/use-query-breakdown-list';

const Models: React.FC<{
  models: FilterOptionType[];
  dateRange: { start_date: string; end_date: string };
  scope: string;
}> = ({ models, dateRange, scope }) => {
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
    sort_by: ''
  });

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {};

  const handlePageChange = (page: number, pageSize: number) => {};

  const columns = useUsersColumns();

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
    fetchData({
      ...queryParams,
      group_by: 'model',
      filters: {
        models: models || []
      },
      scope: scope,
      ...dateRange
    });
  }, [dateRange, models, queryParams, scope]);

  return (
    <>
      <PageBox>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            dataSource={dataSource.dataList}
            loading={{
              spinning: loading,
              size: 'middle'
            }}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            rowKey="id"
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
