import PageTools from '@/components/page-tools';
import ProgressBar from '@/components/progress-bar';
import StatusTag from '@/components/status-tag';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import { convertFileSize, handleBatchRequest } from '@/utils';
import {
  DeleteOutlined,
  InfoCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Modal, Space, Table, Tooltip, message } from 'antd';
import _ from 'lodash';
import { memo, useEffect, useState } from 'react';
import { deleteWorker, queryWorkersList } from '../apis';
import { WorkerStatusMapValue, status } from '../config';
import { Filesystem, GPUDeviceItem, ListItem } from '../config/types';
const { Column } = Table;

const Resources: React.FC = () => {
  console.log('resources======workers');

  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const rowSelection = useTableRowSelection();
  const intl = useIntl();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<ListItem[]>([]);
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    search: ''
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
      setDataSource([]);
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };
  const handleShowSizeChange = (current: number, size: number) => {
    setQueryParams({
      ...queryParams,
      page: current,
      perPage: size || 10
    });
  };

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

  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = (e: any) => {
    setQueryParams({
      ...queryParams,
      search: e.target.value
    });
  };

  const formateUtilazation = (val1: number, val2: number): number => {
    if (!val2 || !val1) {
      return 0;
    }
    return _.round((val1 / val2) * 100, 0);
  };

  const calcStorage = (files: Filesystem[]) => {
    const mountRoot = _.find(
      files,
      (item: Filesystem) => item.mount_point === '/'
    );
    return mountRoot ? formateUtilazation(mountRoot.used, mountRoot.total) : 0;
  };

  const handleDelete = (row: ListItem) => {
    Modal.confirm({
      title: '',
      content: intl.formatMessage(
        { id: 'common.delete.confirm' },
        { type: ' worker ' }
      ),
      async onOk() {
        console.log('OK');
        await deleteWorker(row.id);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        fetchData();
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  };

  const handleDeleteBatch = () => {
    Modal.confirm({
      title: '',
      content: intl.formatMessage(
        { id: 'common.delete.confirm' },
        { type: ` wokers ` }
      ),
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRowKeys, deleteWorker);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        rowSelection.clearSelections();
        fetchData();
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  };

  const renderStorageTooltip = (files: Filesystem[]) => {
    const mountRoot = _.find(
      files,
      (item: Filesystem) => item.mount_point === '/'
    );
    return mountRoot ? (
      <span className="flex-column">
        <span>
          {intl.formatMessage({ id: 'resources.table.total' })}:{' '}
          {convertFileSize(mountRoot?.total, 0)}
        </span>
        <span>
          {intl.formatMessage({ id: 'resources.table.used' })}:{' '}
          {convertFileSize(mountRoot?.used, 0)}
        </span>
      </span>
    ) : (
      0
    );
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
        right={
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={handleDeleteBatch}
            disabled={!rowSelection.selectedRowKeys.length}
          >
            {intl.formatMessage({ id: 'common.button.delete' })}
          </Button>
        }
      ></PageTools>
      <Table
        dataSource={dataSource}
        loading={loading}
        rowKey="id"
        onChange={handleTableChange}
        rowSelection={rowSelection}
        pagination={{
          showSizeChanger: true,
          pageSize: queryParams.perPage,
          current: queryParams.page,
          total: total,
          hideOnSinglePage: queryParams.perPage === 10,
          onChange: handlePageChange
        }}
      >
        <Column
          title={intl.formatMessage({ id: 'common.table.name' })}
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
                  status: status[record.state] as any,
                  text: WorkerStatusMapValue[record.state],
                  message: record.state_message
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
                percent={_.round(record?.status?.cpu.utilization_rate, 0)}
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
                label={
                  <span className="flex-column">
                    <span>
                      {intl.formatMessage({ id: 'resources.table.total' })}:{' '}
                      {convertFileSize(record?.status?.memory.total, 0)}
                    </span>
                    <span>
                      {intl.formatMessage({ id: 'resources.table.used' })}:{' '}
                      {convertFileSize(record?.status?.memory.used, 0)}
                    </span>
                  </span>
                }
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
              <span className="flex-column flex-gap-2">
                {record?.status?.gpu_devices.map((item, index) => {
                  return (
                    <span className="flex-center" key={index}>
                      <span
                        className="m-r-5"
                        style={{ display: 'flex', width: 25 }}
                      >
                        [{index}]
                      </span>
                      <ProgressBar
                        key={index}
                        percent={_.round(item.core.utilization_rate, 0)}
                      ></ProgressBar>
                    </span>
                  );
                })}
              </span>
            );
          }}
        />

        <Column
          title={intl.formatMessage({ id: 'resources.table.vram' })}
          dataIndex="VRAM"
          key="VRAM"
          render={(text, record: ListItem) => {
            return (
              <span className="flex-column">
                {record?.status?.gpu_devices.map(
                  (item: GPUDeviceItem, index) => {
                    return (
                      <span key={index}>
                        <span className="flex-center">
                          <span
                            className="m-r-5"
                            style={{ display: 'flex', width: 25 }}
                          >
                            [{item.index}]
                          </span>
                          <ProgressBar
                            key={index}
                            percent={_.round(item.memory.utilization_rate, 0)}
                            label={
                              <span className="flex-column">
                                <span>
                                  {intl.formatMessage({
                                    id: 'resources.table.total'
                                  })}
                                  : {convertFileSize(item.memory?.total, 0)}
                                </span>
                                <span>
                                  {intl.formatMessage({
                                    id: 'resources.table.used'
                                  })}
                                  : {convertFileSize(item.memory?.used, 0)}
                                </span>
                              </span>
                            }
                          ></ProgressBar>
                          {item.memory.is_unified_memory && (
                            <Tooltip
                              title={intl.formatMessage({
                                id: 'resources.table.unified'
                              })}
                            >
                              <InfoCircleOutlined className="m-l-5" />
                            </Tooltip>
                          )}
                        </span>
                      </span>
                    );
                  }
                )}
              </span>
            );
          }}
        />
        <Column
          title={intl.formatMessage({ id: 'resources.table.disk' })}
          dataIndex="storage"
          key="storage"
          render={(text, record: ListItem) => {
            return (
              <ProgressBar
                percent={calcStorage(record.status?.filesystem)}
                label={renderStorageTooltip(record.status.filesystem)}
              ></ProgressBar>
            );
          }}
        />
        <Column
          title={intl.formatMessage({ id: 'common.table.operation' })}
          key="operation"
          render={(text, record: ListItem) => {
            return (
              <Space size={20}>
                <Tooltip
                  title={intl.formatMessage({ id: 'common.button.delete' })}
                >
                  <Button
                    onClick={() => handleDelete(record)}
                    size="small"
                    danger
                    icon={<DeleteOutlined></DeleteOutlined>}
                  ></Button>
                </Tooltip>
              </Space>
            );
          }}
        />
      </Table>
    </>
  );
};

export default memo(Resources);
