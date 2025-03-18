import AutoTooltip from '@/components/auto-tooltip';
import PageTools from '@/components/page-tools';
import ProgressBar from '@/components/progress-bar';
import InfoColumn from '@/components/simple-table/info-column';
import useTableFetch from '@/hooks/use-table-fetch';
import { convertFileSize } from '@/utils';
import { SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, ConfigProvider, Empty, Input, Space, Table } from 'antd';
import _ from 'lodash';
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
  const {
    dataSource,
    queryParams,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<GPUDeviceItem>({
    fetchAPI: queryGpuDevicesList
  });

  const intl = useIntl();

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
