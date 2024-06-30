import PageTools from '@/components/page-tools';
import ProgressBar from '@/components/progress-bar';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import { convertFileSize } from '@/utils';
import { SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Space, Table } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { queryGpuDevicesList } from '../apis';
import { GPUDeviceItem } from '../config/types';
const { Column } = Table;

const Models: React.FC = () => {
  const intl = useIntl();
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const [dataSource, setDataSource] = useState<GPUDeviceItem[]>([]);
  const [total, setTotal] = useState(10);
  const [loading, setLoading] = useState(false);
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    query: ''
  });
  const handleShowSizeChange = (current: number, size: number) => {
    setQueryParams({
      ...queryParams,
      perPage: size
    });
  };

  const handlePageChange = (page: number, perPage: number | undefined) => {
    console.log(page, perPage);
    setQueryParams({
      ...queryParams,
      page: page
    });
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSortOrder(sorter.order);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        ..._.pickBy(queryParams, (val: any) => !!val)
      };
      const res = await queryGpuDevicesList(params);

      setDataSource(res.items);
      setTotal(res.pagination.total);
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = (e: any) => {
    setQueryParams({
      ...queryParams,
      query: e.target.value
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
              onChange={handleNameChange}
            ></Input>
            <Button
              type="text"
              style={{ color: 'var(--ant-color-primary)' }}
              onClick={handleSearch}
              icon={<SyncOutlined></SyncOutlined>}
            ></Button>
          </Space>
        }
      ></PageTools>
      <Table
        dataSource={dataSource}
        loading={loading}
        rowKey="id"
        onChange={handleTableChange}
        pagination={{
          showSizeChanger: true,
          pageSize: queryParams.perPage,
          current: queryParams.page,
          total: total,
          hideOnSinglePage: true,
          onShowSizeChange: handleShowSizeChange,
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
            return <span>{_.round(text, 1)}</span>;
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
                percent={_.round(record.memory.utilization_rate, 0)}
                label={
                  <span className="flex-column">
                    <span>
                      Total: {convertFileSize(record.memory?.total, 0)}
                    </span>
                    <span>Used: {convertFileSize(record.memory?.used, 0)}</span>
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

export default Models;
