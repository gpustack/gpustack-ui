import AutoTooltip from '@/components/auto-tooltip';
import { FilterBar } from '@/components/page-tools';
import ProgressBar from '@/components/progress-bar';
import InfoColumn from '@/components/simple-table/info-column';
import useTableFetch from '@/hooks/use-table-fetch';
import { convertFileSize } from '@/utils';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { ConfigProvider, Empty, Table } from 'antd';
import _ from 'lodash';
import React from 'react';
import { GPU_DEVICES_API, queryGpuDevicesList } from '../apis';
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
          >
            <Column
              title={intl.formatMessage({ id: 'common.table.name' })}
              dataIndex="name"
              key="name"
              width={240}
              render={(text, record) => {
                return (
                  <AutoTooltip ghost maxWidth={240}>
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
              title={intl.formatMessage({
                id: 'resources.table.gpuutilization'
              })}
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
              render={(text, record: GPUDeviceItem, index: number) => {
                return (
                  <ProgressBar
                    defaultOpen={
                      index === 0 && dataSource.loadend && extraStatus.firstLoad
                    }
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
      </PageContainer>
    </>
  );
};

export default GPUList;
