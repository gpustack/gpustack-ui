import PageTools from '@/components/page-tools';
import StatusTag from '@/components/status-tag';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import { SyncOutlined } from '@ant-design/icons';
import { Button, Input, Space, Table } from 'antd';
import { useState } from 'react';
import { NodeItem } from '../config/types';
import RenderProgress from './render-progress';
const { Column } = Table;

const dataSource: NodeItem[] = [
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
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const [total, setTotal] = useState(10);
  const [loading, setLoading] = useState(false);
  const [queryParams, setQueryParams] = useState({
    current: 1,
    pageSize: 10,
    name: ''
  });
  const handleShowSizeChange = (current: number, size: number) => {
    console.log(current, size);
  };

  const handlePageChange = (page: number, pageSize: number | undefined) => {
    console.log(page, pageSize);
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSortOrder(sorter.order);
  };

  const fetchData = async () => {
    console.log('fetchData');
  };
  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = (e: any) => {
    setQueryParams({
      ...queryParams,
      name: e.target.value
    });
  };

  return (
    <>
      <PageTools
        marginBottom={10}
        marginTop={10}
        left={
          <Space>
            <Input
              placeholder="按名称查询"
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
        rowSelection={rowSelection}
        loading={loading}
        rowKey="id"
        onChange={handleTableChange}
        pagination={{
          showSizeChanger: true,
          pageSize: 10,
          current: 2,
          total: total,
          hideOnSinglePage: true,
          onShowSizeChange: handleShowSizeChange,
          onChange: handlePageChange
        }}
      >
        <Column title="GPU Name" dataIndex="hostname" key="hostname" />
        <Column
          title="State"
          dataIndex="state"
          key="state"
          render={(text, record) => {
            return (
              <StatusTag
                statusValue={{
                  status: 'success',
                  text: 'ALIVE'
                }}
              ></StatusTag>
            );
          }}
        />
        <Column title="IP" dataIndex="address" key="address" />

        <Column title="Temperature" dataIndex="Temperature" key="Temperature" />
        <Column title="Core" dataIndex="core" key="Core" />
        <Column title="GPU-Util" dataIndex="gpuUtil" key="gpuUtil" />

        <Column
          title="VRAM"
          dataIndex="GRAM"
          key="VRAM"
          render={(text, record: NodeItem) => {
            return (
              <RenderProgress record={record} dataIndex="gram"></RenderProgress>
            );
          }}
        />
        <Column
          title="Operation"
          key="operation"
          render={(text, record) => {
            return (
              <Space>
                <Button size="middle">Logs</Button>
              </Space>
            );
          }}
        />
      </Table>
    </>
  );
};

export default Models;
