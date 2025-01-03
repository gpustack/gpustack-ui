import AutoTooltip from '@/components/auto-tooltip';
import DeleteModal from '@/components/delete-modal';
import DropdownButtons from '@/components/drop-down-buttons';
import PageTools from '@/components/page-tools';
import ProgressBar from '@/components/progress-bar';
import StatusTag from '@/components/status-tag';
import Hotkeys from '@/config/hotkeys';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import { convertFileSize, handleBatchRequest } from '@/utils';
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Space, Table, Tooltip, message } from 'antd';
import _ from 'lodash';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { deleteWorker, queryWorkersList, updateWorker } from '../apis';
import { WorkerStatusMapValue, status } from '../config';
import { Filesystem, GPUDeviceItem, ListItem } from '../config/types';
import AddWorker from './add-worker';
import UpdateLabels from './update-labels';

const { Column } = Table;

const ActionList = [
  {
    label: 'common.button.edit',
    key: 'edit',
    icon: <EditOutlined />
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    props: {
      danger: true
    },
    icon: <DeleteOutlined />
  }
];

const Resources: React.FC = () => {
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const modalRef = useRef<any>(null);
  const rowSelection = useTableRowSelection();
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [dataSource, setDataSource] = useState<{
    dataList: ListItem[];
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
  const [updateLabelsData, setUpdateLabelsData] = useState<{
    open: boolean;
    data: ListItem;
  }>({
    open: false,
    data: {} as ListItem
  });

  const fetchData = useCallback(async () => {
    setDataSource((pre) => {
      pre.loading = true;
      return { ...pre };
    });
    try {
      const params = {
        ..._.pickBy(queryParams, (val: any) => !!val)
      };
      const res = await queryWorkersList(params);

      setDataSource({
        dataList: res.items,
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
  }, [queryParams]);

  const handlePageChange = (page: number, perPage: number | undefined) => {
    console.log(page, perPage);
    setQueryParams({
      ...queryParams,
      page: page,
      perPage: perPage || 10
    });
  };

  const handleTableChange = useCallback(
    (pagination: any, filters: any, sorter: any) => {
      setSortOrder(sorter.order);
    },
    []
  );

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

  const handleAddWorker = () => {
    setOpen(true);
  };

  const handleDelete = (row: ListItem) => {
    modalRef.current.show({
      content: 'worker',
      operation: 'common.delete.single.confirm',
      name: row.name,
      async onOk() {
        console.log('OK');
        await deleteWorker(row.id);
        fetchData();
      }
    });
  };

  const handleDeleteBatch = () => {
    modalRef.current.show({
      content: 'wokers',
      operation: 'common.delete.confirm',
      selection: true,
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRowKeys, deleteWorker);
        rowSelection.clearSelections();
        fetchData();
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

  const handleUpdateLabelsOk = useCallback(
    async (values: Record<string, any>) => {
      try {
        console.log('updateLabelsData.data', updateLabelsData.data);
        await updateWorker(updateLabelsData.data.id, {
          ...updateLabelsData.data,
          labels: values.labels
        });
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        fetchData();
        setUpdateLabelsData({ open: false, data: {} as ListItem });
      } catch (error) {
        console.log('error', error);
      }
    },
    [updateLabelsData, fetchData]
  );

  const handleCancelUpdateLabels = useCallback(() => {
    setUpdateLabelsData({
      ...updateLabelsData,
      open: false
    });
  }, []);

  const handleUpdateLabels = (record: ListItem) => {
    console.log('record', record);
    setUpdateLabelsData({
      open: true,
      data: {
        ...record
      }
    });
  };

  const handleSelect = (val: any, record: ListItem) => {
    if (val === 'edit') {
      handleUpdateLabels(record);
      return;
    }
    if (val === 'delete') {
      handleDelete(record);
    }
  };

  useEffect(() => {
    fetchData();
  }, [queryParams]);

  useHotkeys(Hotkeys.CREATE.join(','), handleAddWorker, {
    enabled: !open
  });

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
          <Space size={20}>
            <Button
              icon={<PlusOutlined></PlusOutlined>}
              type="primary"
              onClick={handleAddWorker}
            >
              {intl.formatMessage({ id: 'resources.button.create' })}
            </Button>
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={handleDeleteBatch}
              disabled={!rowSelection.selectedRowKeys.length}
            >
              <span>
                {intl?.formatMessage?.({ id: 'common.button.delete' })}
                {rowSelection.selectedRowKeys.length > 0 && (
                  <span>({rowSelection.selectedRowKeys?.length})</span>
                )}
              </span>
            </Button>
          </Space>
        }
      ></PageTools>
      <Table
        style={{ width: '100%' }}
        dataSource={dataSource.dataList}
        loading={dataSource.loading}
        rowKey="id"
        onChange={handleTableChange}
        rowSelection={rowSelection}
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
          width={100}
          render={(text, record: ListItem) => {
            return (
              <AutoTooltip ghost maxWidth={240}>
                <span>{record.name}</span>
              </AutoTooltip>
            );
          }}
        />
        <Column
          title={intl.formatMessage({ id: 'resources.table.labels' })}
          dataIndex="labels"
          key="labels"
          width={200}
          render={(text, record: ListItem) => {
            return (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  maxWidth: 200
                }}
              >
                {_.map(record.labels, (item: any, index: string) => {
                  return (
                    <AutoTooltip
                      key={index}
                      className="m-r-0"
                      maxWidth={120}
                      style={{
                        paddingInline: 8,
                        borderRadius: 12
                      }}
                    >
                      {index}:{item}
                    </AutoTooltip>
                  );
                })}
              </div>
            );
          }}
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
                percent={_.round(record?.status?.cpu?.utilization_rate, 0)}
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
                  record?.status?.memory?.used,
                  record?.status?.memory?.total
                )}
                label={
                  <span className="flex-column">
                    <span>
                      {intl.formatMessage({ id: 'resources.table.total' })}:{' '}
                      {convertFileSize(record?.status?.memory?.total, 0)}
                    </span>
                    <span>
                      {intl.formatMessage({ id: 'resources.table.used' })}:{' '}
                      {convertFileSize(record?.status?.memory?.used, 0)}
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
                {_.map(
                  _.sortBy(record?.status?.gpu_devices || [], ['index']),
                  (item: GPUDeviceItem, index: string) => {
                    return (
                      <span className="flex-center" key={index}>
                        <span
                          className="m-r-5"
                          style={{ display: 'flex', width: 25 }}
                        >
                          [{item.index}]
                        </span>
                        {item.core ? (
                          <ProgressBar
                            key={index}
                            percent={_.round(item.core?.utilization_rate, 0)}
                          ></ProgressBar>
                        ) : (
                          '-'
                        )}
                      </span>
                    );
                  }
                )}
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
              <span className="flex-column flex-gap-2">
                {_.map(
                  _.sortBy(record?.status?.gpu_devices || [], ['index']),
                  (item: GPUDeviceItem, index: string) => {
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
                            percent={
                              item.memory?.used
                                ? _.round(item.memory?.utilization_rate, 0)
                                : _.round(
                                    (item.memory?.allocated /
                                      item.memory?.total) *
                                      100,
                                    0
                                  )
                            }
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
                                  :{' '}
                                  {convertFileSize(
                                    item.memory?.used || item.memory?.allocated,
                                    0
                                  )}
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
              <DropdownButtons
                items={ActionList}
                onSelect={(val) => handleSelect(val, record)}
              ></DropdownButtons>
            );
          }}
        />
      </Table>
      <DeleteModal ref={modalRef}></DeleteModal>
      <AddWorker open={open} onCancel={() => setOpen(false)}></AddWorker>
      <UpdateLabels
        open={updateLabelsData.open}
        onOk={handleUpdateLabelsOk}
        onCancel={handleCancelUpdateLabels}
        data={{
          name: updateLabelsData.data.name,
          labels: updateLabelsData.data.labels
        }}
      ></UpdateLabels>
    </>
  );
};

export default memo(Resources);
