import PageTools from '@/components/page-tools';
import ProgressBar from '@/components/progress-bar';
import StatusTag from '@/components/status-tag';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import { SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Space, Table } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { queryWorkersList } from '../apis';
import { ListItem } from '../config/types';
const { Column } = Table;

const Models: React.FC = () => {
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const intl = useIntl();
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
      const res = await queryWorkersList(params);

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
          title={intl.formatMessage({ id: 'resources.table.hostname' })}
          dataIndex="hostname"
          key="hostname"
        />
        <Column
          title={intl.formatMessage({ id: 'common.table.status' })}
          dataIndex="state"
          key="state"
          render={(text, record: ListItem) => {
            return (
              <StatusTag
                statusValue={{
                  status: ['Inactive', 'unknown'].includes(record.state)
                    ? 'inactive'
                    : 'success',
                  text: record.state
                }}
              ></StatusTag>
            );
          }}
        />
        <Column title="IP" dataIndex="ip" key="address" />
        <Column
          title="CPU"
          dataIndex="CPU"
          key="CPU"
          render={(text, record: ListItem) => {
            return (
              <ProgressBar
                percent={_.round(record?.status?.cpu.utilization_rate, 2)}
              ></ProgressBar>
            );
          }}
        />
        <Column
          title={intl.formatMessage({ id: 'resources.table.memory' })}
          dataIndex="memory"
          key="Memory"
          render={(text, record: ListItem) => {
            return (
              <ProgressBar
                percent={formateUtilazation(
                  record?.status?.memory.used,
                  record?.status?.memory.total
                )}
              ></ProgressBar>
            );
          }}
        />
        <Column
          title="GPU"
          dataIndex="GPU"
          key="GPU"
          render={(text, record: ListItem) => {
            return (
              <Space>
                {record?.status?.gpu.map((item) => {
                  return (
                    <span key={item.index} className="flex-center">
                      <span
                        style={{
                          display: 'flex',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--ant-color-primary)'
                        }}
                      ></span>
                      <span className="m-l-5">
                        {' '}
                        {`${item.core.total}C`} /{' '}
                        {item.core.utilization_rate
                          ? `${item.core.utilization_rate}%`
                          : 0}
                      </span>
                    </span>
                  );
                })}
              </Space>
            );
          }}
        />
        <Column
          title={intl.formatMessage({ id: 'resources.table.disk' })}
          dataIndex="storage"
          key="storage"
          render={(text, record: ListItem) => {
            return <ProgressBar percent={0}></ProgressBar>;
          }}
        />
        <Column
          title={intl.formatMessage({ id: 'resources.table.vram' })}
          dataIndex="VRAM"
          key="VRAM"
          render={(text, record: ListItem) => {
            return (
              <Space>
                {record?.status?.gpu.map((item) => {
                  return (
                    <span key={item.index} className="flex-center">
                      <span
                        style={{
                          display: 'flex',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--ant-color-primary)'
                        }}
                      ></span>
                      <span className="m-l-5">
                        {item.memory.allocated
                          ? `${formateUtilazation(item.memory.allocated, item.memory.total)}%`
                          : 0}
                      </span>
                    </span>
                  );
                })}
              </Space>
            );
          }}
        />
      </Table>
    </>
  );
};

export default Models;
