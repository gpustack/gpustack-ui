import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import NoResult from '@/pages/_components/no-result';
import PageBox from '@/pages/_components/page-box';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import { useIntl, useSearchParams } from '@umijs/max';
import { ConfigProvider, Table } from 'antd';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { GPU_DEVICES_API, queryGpuDevicesList } from '../apis';
import { GPUDeviceItem } from '../config/types';
import useGPUColumns from '../hooks/use-gpu-columns';

const GPUList: React.FC<{ clusterId?: number; widths?: { input: number } }> = ({
  clusterId,
  widths
}) => {
  const {
    dataSource,
    queryParams,
    extraStatus,
    sortOrder,
    handlePageChange,
    handleTableChange,
    handleQueryChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<GPUDeviceItem>({
    fetchAPI: queryGpuDevicesList,
    polling: true,
    API: GPU_DEVICES_API,
    defaultQueryParams: {
      cluster_id: clusterId
    }
  });
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page');
  const intl = useIntl();
  const [clusterList, setClusterList] = useState<Global.BaseOption<number>[]>(
    []
  );
  const { fetchClusterList } = useQueryClusterList({
    useStateData: false
  });

  const getClusterList = async () => {
    try {
      const items = await fetchClusterList({ page: -1 });
      const list = items?.map((item) => ({
        label: item.name,
        value: item.id
      }));
      setClusterList(list || []);
    } catch (error) {
      setClusterList([]);
    }
  };

  const handleClusterChange = (value: number) => {
    handleQueryChange({
      page: 1,
      cluster_id: value
    });
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-gpu1" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText={intl.formatMessage({ id: 'noresult.gpus.nofound' })}
        title={intl.formatMessage({ id: 'noresult.gpus.title' })}
        subTitle={intl.formatMessage({ id: 'noresult.gpus.subTitle' })}
      ></NoResult>
    );
  };

  const columns = useGPUColumns({
    clusterList,
    loadend: dataSource.loadend,
    sortOrder,
    firstLoad: extraStatus.firstLoad
  });

  useEffect(() => {
    console.log('columns changed!');
  }, [columns]);

  useEffect(() => {
    getClusterList();
  }, []);

  return (
    <>
      <PageBox>
        <FilterBar
          marginBottom={22}
          buttonText={intl.formatMessage({ id: 'resources.button.create' })}
          selectHolder={intl.formatMessage({ id: 'clusters.filterBy.cluster' })}
          handleSearch={handleSearch}
          handleInputChange={handleNameChange}
          handleSelectChange={handleClusterChange}
          selectOptions={clusterList}
          showSelect={page !== 'clusters'}
          widths={{ input: widths?.input || 200 }}
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            tableLayout={'auto'}
            dataSource={dataSource.dataList}
            loading={dataSource.loading}
            rowKey="id"
            scroll={{ x: 900 }}
            onChange={handleTableChange}
            pagination={{
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

export default GPUList;
