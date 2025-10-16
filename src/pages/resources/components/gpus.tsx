import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import useTableFetch from '@/hooks/use-table-fetch';
import NoResult from '@/pages/_components/no-result';
import { queryClusterList } from '@/pages/cluster-management/apis';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { ConfigProvider, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import { GPU_DEVICES_API, queryGpuDevicesList } from '../apis';
import { GPUDeviceItem } from '../config/types';
import useGPUColumns from '../hooks/use-gpu-columns';

const GPUList: React.FC = () => {
  const {
    dataSource,
    queryParams,
    extraStatus,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<GPUDeviceItem>({
    fetchAPI: queryGpuDevicesList,
    polling: true,
    API: GPU_DEVICES_API
  });

  const intl = useIntl();
  const [clusterList, setClusterList] = useState<Global.BaseOption<number>[]>(
    []
  );

  const getClusterList = async () => {
    try {
      const res = await queryClusterList({ page: 1, perPage: 100 });
      const list = res.items?.map((item) => ({
        label: item.name,
        value: item.id
      }));
      setClusterList(list || []);
    } catch (error) {
      setClusterList([]);
    }
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-gpu1" />}
        filters={queryParams}
        noFoundText={intl.formatMessage({ id: 'noresult.gpus.nofound' })}
        title={intl.formatMessage({ id: 'noresult.gpus.title' })}
        subTitle={intl.formatMessage({ id: 'noresult.gpus.subTitle' })}
      ></NoResult>
    );
  };

  const columns = useGPUColumns({
    clusterList,
    loadend: dataSource.loadend,
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
      <PageContainer
        ghost
        header={{
          title: 'GPUs',
          style: {
            paddingInline: 'var(--layout-content-header-inlinepadding)'
          },
          breadcrumb: {}
        }}
        extra={[]}
      >
        <FilterBar
          marginBottom={22}
          marginTop={30}
          buttonText={intl.formatMessage({ id: 'resources.button.create' })}
          handleSearch={handleSearch}
          handleInputChange={handleNameChange}
          showDeleteButton={false}
          showPrimaryButton={false}
          width={{ input: 300 }}
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            style={{ width: '100%' }}
            tableLayout={dataSource.loadend ? 'auto' : 'fixed'}
            dataSource={dataSource.dataList}
            loading={dataSource.loading}
            rowKey="id"
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
      </PageContainer>
    </>
  );
};

export default GPUList;
