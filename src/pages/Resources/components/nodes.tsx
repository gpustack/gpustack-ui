import PageTools from '@/components/page-tools';
import StatusTag from '@/components/status-tag';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import { SyncOutlined } from '@ant-design/icons';
import { Button, Input, Space, Table } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { queryNodesList } from '../apis';
import { ListItem } from '../config/types';
import RenderProgress from './render-progress';
const { Column } = Table;

const Models: React.FC = () => {
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<ListItem[]>([]);
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    query: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        ..._.pickBy(queryParams, (val: any) => !!val)
      };
      const res = await queryNodesList(params);
      console.log('res=======', res);
      setDataSource(res.items);
      setTotal(res.pagination.total);
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };
  const handleShowSizeChange = (current: number, size: number) => {
    console.log(current, size);
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

  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = (e: any) => {
    setQueryParams({
      ...queryParams,
      query: e.target.value
    });
  };

  const formateUtilazation = (val1: number, val2: number): number => {
    if (!val2 || !val1) {
      return 0;
    }
    return _.round((val1 / val2) * 100, 2);
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
        <Column title="Host Name" dataIndex="hostname" key="hostname" />
        <Column
          title="State"
          dataIndex="state"
          key="state"
          render={(text, record: ListItem) => {
            return (
              <StatusTag
                statusValue={{
                  status:
                    record.status?.state === 'active' ? 'success' : 'error',
                  text: record.status?.state
                }}
              ></StatusTag>
            );
          }}
        />
        <Column title="IP" dataIndex="address" key="address" />
        <Column
          title="CPU"
          dataIndex="CPU"
          key="CPU"
          render={(text, record: ListItem) => {
            return (
              <RenderProgress
                percent={_.round(record?.status?.cpu.utilization_rate, 2)}
              ></RenderProgress>
            );
          }}
        />
        <Column
          title="Memory"
          dataIndex="memory"
          key="Memory"
          render={(text, record: ListItem) => {
            return (
              <RenderProgress
                percent={formateUtilazation(
                  record?.status?.memory.used,
                  record?.status?.memory.total
                )}
              ></RenderProgress>
            );
          }}
        />
        <Column
          title="GPU"
          dataIndex="GPU"
          key="GPU"
          render={(text, record: ListItem) => {
            return (
              <RenderProgress
                percent={_.get(record, [
                  'status',
                  'gpu',
                  '0',
                  'core_utilization_rate'
                ])}
              ></RenderProgress>
            );
          }}
        />
        <Column
          title="VRAM"
          dataIndex="VRAM"
          key="VRAM"
          render={(text, record: ListItem) => {
            return <RenderProgress percent={0}></RenderProgress>;
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
