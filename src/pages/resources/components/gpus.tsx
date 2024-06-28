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

const dataSource: GPUDeviceItem[] = [
  {
    id: 1,
    name: 'bj-web-service-1',
    address: '183.14.31.136',
    hostname: 'bj-web-service-1',
    labels: {},
    resources: {
      capacity: {
        cpu: 4,
        gpu: 2,
        memory: '64 GiB',
        gram: '24 Gib'
      },
      allocable: {
        cpu: 2.5,
        gpu: 1.6,
        memory: '64',
        gram: '24 Gib'
      }
    },
    state: 'ACTIVE'
  },
  {
    id: 2,
    name: 'bj-db-service-2',
    address: '172.24.1.36',
    hostname: 'bj-db-service-2',
    labels: {},
    resources: {
      capacity: {
        cpu: 4,
        gpu: 2,
        memory: '64 GiB',
        gram: '24 Gib'
      },
      allocable: {
        cpu: 2,
        gpu: 1.5,
        memory: '32 GiB',
        gram: '12 Gib'
      }
    },
    state: 'ACTIVE'
  },
  {
    id: 3,
    name: 'guangzhou-computed-node-2',
    address: '170.10.2.10',
    hostname: 'guangzhou-computed-node-2',
    labels: {},
    resources: {
      capacity: {
        cpu: 8,
        gpu: 4,
        memory: '64 GiB',
        gram: '24 Gib'
      },
      allocable: {
        cpu: 2,
        gpu: 1.5,
        memory: '32 GiB',
        gram: '12 Gib'
      }
    },
    state: 'ACTIVE'
  },
  {
    id: 4,
    name: 'hangzhou-cache-node-1',
    address: '115.2.21.10',
    hostname: 'hangzhou-cache-node-1',
    labels: {},
    resources: {
      capacity: {
        cpu: 8,
        gpu: 4,
        memory: '64 GiB',
        gram: '24 Gib'
      },
      allocable: {
        cpu: 4,
        gpu: 2.5,
        memory: '40 GiB',
        gram: '16 Gib'
      }
    },
    state: 'ACTIVE'
  }
];

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
        <Column title="Name" dataIndex="name" key="name" />
        <Column
          title="Index"
          dataIndex="index"
          key="index"
          render={(text, record: GPUDeviceItem) => {
            return <span>{record.index}</span>;
          }}
        />
        <Column title="Worker Name" dataIndex="worker_name" key="worker_name" />
        <Column title="Vendor" dataIndex="vendor" key="vendor" />

        <Column
          title="Temperature(˚C)"
          dataIndex="temperature"
          key="Temperature"
          render={(text, record: GPUDeviceItem) => {
            return <span>{_.round(text, 1)}</span>;
          }}
        />
        <Column
          title="Core"
          dataIndex="core"
          key="Core"
          render={(text, record: GPUDeviceItem) => {
            return <span>{record.core?.total}</span>;
          }}
        />
        <Column
          title="GPU Utilization"
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
          title="VRAM"
          dataIndex="GRAM"
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
