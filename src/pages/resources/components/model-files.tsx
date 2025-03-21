import AutoTooltip from '@/components/auto-tooltip';
import CopyButton from '@/components/copy-button';
import DeleteModal from '@/components/delete-modal';
import DropDownActions from '@/components/drop-down-actions';
import DropdownButtons from '@/components/drop-down-buttons';
import PageTools from '@/components/page-tools';
import StatusTag from '@/components/status-tag';
import useAppUtils from '@/hooks/use-app-utils';
import useTableFetch from '@/hooks/use-table-fetch';
import { modelSourceMap } from '@/pages/llmodels/config';
import {
  generateSource,
  modalConfig,
  modelFileActions,
  onLineSourceOptions
} from '@/pages/llmodels/config/button-actions';
import DownloadModal from '@/pages/llmodels/download';
import { convertFileSize } from '@/utils';
import { DeleteOutlined, DownOutlined, SyncOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, ConfigProvider, Empty, Input, Space, Table } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import {
  MODEL_FILES_API,
  deleteModelFile,
  downloadModelFile,
  queryModelFilesList,
  queryWorkersList,
  retryDownloadModelFile
} from '../apis';
import {
  ModelfileState,
  ModelfileStateMap,
  ModelfileStateMapValue,
  WorkerStatusMap
} from '../config';
import {
  ModelFile as ListItem,
  ListItem as WorkerListItem
} from '../config/types';

const getWorkerName = (
  id: number,
  workersList: Global.BaseOption<number>[]
) => {
  const worker = workersList.find((item) => item.value === id);
  return worker?.label || '';
};
const InstanceStatusTag = (props: { data: ListItem }) => {
  const { data } = props;
  if (!data.state) {
    return null;
  }
  return (
    <StatusTag
      download={
        data.state === ModelfileStateMap.Downloading
          ? { percent: data.download_progress }
          : undefined
      }
      statusValue={{
        status:
          data.state === ModelfileStateMap.Downloading &&
          data.download_progress === 100
            ? ModelfileState[ModelfileStateMap.Ready]
            : ModelfileState[data.state],
        text: ModelfileStateMapValue[data.state],
        message:
          data.state === ModelfileStateMap.Downloading &&
          data.download_progress === 100
            ? ''
            : data.state_message
      }}
    />
  );
};

const ModelFiles = () => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    handleDelete,
    handleDeleteBatch,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryModelFilesList,
    deleteAPI: deleteModelFile,
    API: MODEL_FILES_API,
    watch: true,
    contentForDelete: 'resources.modelfiles.modelfile'
  });

  const intl = useIntl();
  const { showSuccess } = useAppUtils();
  const [workersList, setWorkersList] = useState<Global.BaseOption<number>[]>(
    []
  );
  const [downloadModalStatus, setDownlaodMoalStatus] = useState<{
    show: boolean;
    width: number | string;
    source: string;
    gpuOptions: any[];
  }>({
    show: false,
    width: 600,
    source: modelSourceMap.huggingface_value,
    gpuOptions: []
  });

  useEffect(() => {
    const fetchWorkerList = async () => {
      try {
        const res = await queryWorkersList({
          page: 1,
          perPage: 100
        });

        const list = res.items
          ?.map((item: WorkerListItem) => {
            return {
              ...item,
              value: item.id,
              label: item.name
            };
          })
          .filter(
            (item: WorkerListItem) => item.state === WorkerStatusMap.ready
          );
        setWorkersList(list);
      } catch (error) {
        // console.log('error', error);
      }
    };
    fetchWorkerList();
  }, []);

  const handleSelect = async (val: any, record: ListItem) => {
    try {
      if (val === 'delete') {
        handleDelete({
          ...record,
          name: record.local_path
        });
      } else if (val === 'retry') {
        await retryDownloadModelFile(record.id);
        showSuccess();
      }
    } catch (error) {
      // console.log('error', error);
    }
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

  const handleClickDropdown = (item: any) => {
    const config = modalConfig[item.key];
    if (config) {
      setDownlaodMoalStatus({ ...config, gpuOptions: [] });
    }
  };

  const handleDownloadCancel = () => {
    setDownlaodMoalStatus({
      ...downloadModalStatus,
      show: false
    });
  };

  const handleDownload = async (data: any) => {
    try {
      await downloadModelFile(data);
      setDownlaodMoalStatus({
        ...downloadModalStatus,
        show: false
      });
      showSuccess();
    } catch (error) {
      // console.log('error', error);
    }
  };

  const columns = [
    {
      title: intl.formatMessage({ id: 'resources.modelfiles.form.path' }),
      dataIndex: 'resolved_paths',
      width: 240,
      render: (text: string, record: ListItem) => {
        return (
          record.resolved_paths?.length > 0 && (
            <span className="flex-center">
              <AutoTooltip ghost maxWidth={240}>
                <span>{record.resolved_paths?.[0]}</span>
              </AutoTooltip>
              <CopyButton
                text={record.resolved_paths?.[0]}
                type="link"
              ></CopyButton>
            </span>
          )
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'resources.modelfiles.size' }),
      dataIndex: 'size',
      render: (text: string, record: ListItem) => {
        return (
          <AutoTooltip ghost maxWidth={100}>
            <span>{convertFileSize(record.size, 1)}</span>
          </AutoTooltip>
        );
      }
    },
    {
      title: 'Worker',
      dataIndex: 'worker_name',
      render: (text: string, record: ListItem) => {
        return (
          <AutoTooltip ghost maxWidth={240}>
            <span>{getWorkerName(record.worker_id, workersList)}</span>
          </AutoTooltip>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'models.form.source' }),
      dataIndex: 'source',
      render: (text: string, record: ListItem) => (
        <span className="flex flex-column" style={{ width: '100%' }}>
          <AutoTooltip ghost>{generateSource(record)}</AutoTooltip>
        </span>
      )
    },
    {
      title: intl.formatMessage({ id: 'common.table.status' }),
      dataIndex: 'state',
      render: (text: string, record: ListItem) => {
        return <InstanceStatusTag data={record} />;
      }
    },
    {
      title: intl.formatMessage({ id: 'common.table.createTime' }),
      dataIndex: 'created_at',
      sorter: false,
      render: (text: number) => (
        <AutoTooltip ghost>
          {dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
        </AutoTooltip>
      )
    },
    {
      title: intl.formatMessage({ id: 'common.table.operation' }),
      dataIndex: 'operation',
      render: (text: string, record: ListItem) => (
        <DropdownButtons
          items={modelFileActions}
          onSelect={(val) => handleSelect(val, record)}
        ></DropdownButtons>
      )
    }
  ];

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
            <DropDownActions
              menu={{
                items: onLineSourceOptions,
                onClick: handleClickDropdown
              }}
            >
              <Button
                icon={<DownOutlined></DownOutlined>}
                type="primary"
                iconPosition="end"
              >
                {intl.formatMessage({ id: 'resources.modelfiles.download' })}
              </Button>
            </DropDownActions>
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
      <ConfigProvider renderEmpty={renderEmpty}>
        <Table
          columns={columns}
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
        ></Table>
      </ConfigProvider>
      <DeleteModal ref={modalRef}></DeleteModal>
      <DownloadModal
        open={downloadModalStatus.show}
        title={intl.formatMessage({ id: 'resources.modelfiles.download' })}
        source={downloadModalStatus.source}
        width={downloadModalStatus.width}
        onCancel={handleDownloadCancel}
        onOk={handleDownload}
        workersList={workersList}
      ></DownloadModal>
    </>
  );
};

export default ModelFiles;
