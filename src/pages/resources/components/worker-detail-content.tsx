import { FilterBar } from '@/components/page-tools';
import useTableFetch from '@/hooks/use-table-fetch';
import { queryClusterList } from '@/pages/cluster-management/apis';
import {
  MODEL_INSTANCE_API,
  queryModelsInstances
} from '@/pages/llmodels/apis';
import { InstanceStatusMap } from '@/pages/llmodels/config';
import { ModelInstanceListItem } from '@/pages/llmodels/config/types';
import { useIntl } from '@umijs/max';
import { ConfigProvider, Empty, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import useInstanceColumns from '../hooks/use-instances-columns';

const statusList = Object.entries(InstanceStatusMap).map(([key, value]) => ({
  label: key,
  value: value
}));

const WorkerDetailContent: React.FC<{ worker_id: number | undefined }> = ({
  worker_id
}) => {
  const {
    dataSource,
    queryParams,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleQueryChange,
    handleNameChange
  } = useTableFetch<ModelInstanceListItem>({
    fetchAPI: queryModelsInstances,
    polling: false,
    API: MODEL_INSTANCE_API,
    defaultQueryParams: {
      worker_id
    }
  });

  const intl = useIntl();
  const [clusterList, setClusterList] = useState<Global.BaseOption<number>[]>(
    []
  );

  const getClusterList = async () => {
    try {
      const res = await queryClusterList({ page: -1 });
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
    if (
      !dataSource.loading &&
      dataSource.loadend &&
      !dataSource.dataList.length
    ) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}></Empty>;
    }
    return <div></div>;
  };

  const handleSelectChange = (value: string) => {
    handleQueryChange({ state: value });
  };

  const columns = useInstanceColumns({
    clusterList
  });

  useEffect(() => {
    console.log('columns changed!');
  }, [columns]);

  useEffect(() => {
    getClusterList();
  }, []);

  return (
    <>
      <FilterBar
        marginBottom={22}
        marginTop={0}
        buttonText={intl.formatMessage({ id: 'resources.button.create' })}
        handleSearch={handleSearch}
        handleSelectChange={handleSelectChange}
        handleInputChange={handleNameChange}
        selectHolder={intl.formatMessage({ id: 'resources.filter.status' })}
        showSelect={true}
        selectOptions={statusList}
        widths={{ input: 300 }}
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
    </>
  );
};

export default WorkerDetailContent;
