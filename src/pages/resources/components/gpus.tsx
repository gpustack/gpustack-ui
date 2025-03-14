import AutoTooltip from '@/components/auto-tooltip';
import PageTools from '@/components/page-tools';
import ProgressBar from '@/components/progress-bar';
import InfoColumn from '@/components/simple-table/info-column';
import useTableSort from '@/hooks/use-table-sort';
import { convertFileSize } from '@/utils';
import { SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, ConfigProvider, Empty, Input, Space, Table } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { queryGpuDevicesList } from '../apis';
import { GPUDeviceItem } from '../config/types';
const { Column } = Table;

const fieldList = [
  {
    label: 'resources.table.total',
    key: 'total',
    locale: true,
    render: (val: any) => {
      return convertFileSize(val, 0);
    }
  },
  {
    label: 'resources.table.used',
    key: 'used',
    locale: true,
    render: (val: any) => {
      return convertFileSize(val, 0);
    }
  },
  {
    label: 'resources.table.allocated',
    key: 'allocated',
    locale: true,
    render: (val: any) => {
      return convertFileSize(val, 0);
    }
  }
];

const GPUList: React.FC = () => {
  console.log('GPUList======');
  const intl = useIntl();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const [dataSource, setDataSource] = useState<{
    dataList: GPUDeviceItem[];
    loading: boolean;
    loadend: boolean;
    total: number;
  }>({
    dataList: [],
    loading: false,
    loadend: false,
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
        loadend: true,
        total: res.pagination.total
      });
    } catch (error) {
      setDataSource({
        dataList: [],
        loading: false,
        loadend: true,
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
      page: 1,
      search: e.target.value
    });
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
      <ConfigProvider renderEmpty={renderEmpty}>
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
            render={(text, record) => {
              return (
                <AutoTooltip ghost style={{ width: '100%' }}>
                  {text}
                </AutoTooltip>
              );
            }}
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
            width={200}
            render={(text, record: GPUDeviceItem) => {
              return (
                <span style={{ display: 'flex', width: '100%' }}>
                  <AutoTooltip ghost maxWidth={340}>
                    {text}
                  </AutoTooltip>
                </span>
              );
            }}
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
            title={intl.formatMessage({ id: 'resources.table.gpuutilization' })}
            dataIndex="gpuUtil"
            key="gpuUtil"
            render={(text, record: GPUDeviceItem) => {
              return (
                <>
                  {record.core ? (
                    <ProgressBar
                      percent={_.round(record.core?.utilization_rate, 2)}
                    ></ProgressBar>
                  ) : (
                    '-'
                  )}
                </>
              );
            }}
          />

          <Column
            title={intl.formatMessage({
              id: 'resources.table.vramutilization'
            })}
            dataIndex="VRAM"
            key="VRAM"
            render={(text, record: GPUDeviceItem) => {
              return (
                <ProgressBar
                  percent={
                    record.memory?.used
                      ? _.round(record.memory?.utilization_rate, 0)
                      : _.round(
                          record.memory?.allocated / record.memory?.total,
                          0
                        ) * 100
                  }
                  label={
                    <InfoColumn
                      fieldList={fieldList}
                      data={record.memory}
                    ></InfoColumn>
                  }
                ></ProgressBar>
              );
            }}
          />
        </Table>
      </ConfigProvider>
    </>
  );
};

export default GPUList;
