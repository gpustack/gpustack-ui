import PageTools from '@/components/page-tools';
import ProgressBar from '@/components/progress-bar';
import useTableSort from '@/hooks/use-table-sort';
import { convertFileSize } from '@/utils';
import { SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Space, Table } from 'antd';
import _ from 'lodash';
import { memo, useEffect, useState } from 'react';
import { queryGpuDevicesList } from '../apis';
import { GPUDeviceItem } from '../config/types';
const { Column } = Table;

const GPUList: React.FC = () => {
  console.log('GPUList======');
  const intl = useIntl();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const [dataSource, setDataSource] = useState<{
    dataList: GPUDeviceItem[];
    loading: boolean;
    total: number;
  }>({
    dataList: [],
    loading: false,
    total: 0
  });
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    search: ''
  });

  const handlePageChange = (page: number, perPage: number | undefined) => {
    console.log(page, perPage);
    setQueryParams({
      ...queryParams,
      page: page,
      perPage: perPage || 10
    });
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSortOrder(sorter.order);
  };

  const fetchData = async () => {
    setDataSource((pre) => {
      pre.loading = true;
      return { ...pre };
    });
    try {
      const params = {
        ..._.pickBy(queryParams, (val: any) => !!val)
      };
      const res = await queryGpuDevicesList(params);

      setDataSource({
        dataList: res.items || [],
        loading: false,
        total: res.pagination.total
      });
    } catch (error) {
      setDataSource({
        dataList: [],
        loading: false,
        total: dataSource.total
      });
      console.log('error', error);
    }
  };
  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = (e: any) => {
    setQueryParams({
      ...queryParams,
      search: e.target.value
    });
  };

  useEffect(() => {
    fetchData();
  }, [queryParams]);

  return (
    <>
      <PageTools
        marginBottom={10}
        marginTop={10}
        left={
          <Space>
            <Input
              placeholder={intl.formatMessage({
                id: 'common.filter.name'
              })}
              style={{ width: 300 }}
              allowClear
              onChange={handleNameChange}
            ></Input>
            <Button
              type="text"
              style={{ color: 'var(--ant-color-text-tertiary)' }}
              onClick={handleSearch}
              icon={<SyncOutlined></SyncOutlined>}
            ></Button>
          </Space>
        }
      ></PageTools>
      <Table
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
      >
        <Column
          title={intl.formatMessage({ id: 'common.table.name' })}
          dataIndex="name"
          key="name"
        />
        <Column
          title={intl.formatMessage({ id: 'resources.table.index' })}
          dataIndex="index"
          key="index"
          render={(text, record: GPUDeviceItem) => {
            return <span>{record.index}</span>;
          }}
        />
        <Column
          title={intl.formatMessage({ id: 'resources.table.workername' })}
          dataIndex="worker_name"
          key="worker_name"
        />
        <Column
          title={intl.formatMessage({ id: 'resources.table.vender' })}
          dataIndex="vendor"
          key="vendor"
        />

        <Column
          title={`${intl.formatMessage({ id: 'resources.table.temperature' })} (°C)`}
          dataIndex="temperature"
          key="Temperature"
          render={(text, record: GPUDeviceItem) => {
            return <span>{text ? _.round(text, 1) : '-'}</span>;
          }}
        />
        <Column
          title={intl.formatMessage({ id: 'resources.table.core' })}
          dataIndex="core"
          key="Core"
          render={(text, record: GPUDeviceItem) => {
            return <span>{record.core?.total}</span>;
          }}
        />
        <Column
          title={intl.formatMessage({ id: 'resources.table.gpuutilization' })}
          dataIndex="gpuUtil"
          key="gpuUtil"
          render={(text, record: GPUDeviceItem) => {
            return (
              <ProgressBar
                percent={_.round(record.core?.utilization_rate, 2)}
              ></ProgressBar>
            );
          }}
        />

        <Column
          title={intl.formatMessage({ id: 'resources.table.vramutilization' })}
          dataIndex="VRAM"
          key="VRAM"
          render={(text, record: GPUDeviceItem) => {
            return (
              <ProgressBar
                percent={_.round(record.memory?.utilization_rate, 0)}
                label={
                  <span className="flex-column">
                    <span>
                      {intl.formatMessage({ id: 'resources.table.total' })}:{' '}
                      {convertFileSize(record.memory?.total, 0)}
                    </span>
                    <span>
                      {intl.formatMessage({ id: 'resources.table.used' })}:{' '}
                      {convertFileSize(record.memory?.used, 0)}
                    </span>
                  </span>
                }
              ></ProgressBar>
            );
          }}
        />
      </Table>
    </>
  );
};

export default memo(GPUList);
