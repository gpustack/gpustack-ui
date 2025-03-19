import AutoTooltip from '@/components/auto-tooltip';
import DeleteModal from '@/components/delete-modal';
import DropDownActions from '@/components/drop-down-actions';
import DropdownButtons from '@/components/drop-down-buttons';
import PageTools from '@/components/page-tools';
import StatusTag from '@/components/status-tag';
import useTableFetch from '@/hooks/use-table-fetch';
import { modelSourceMap } from '@/pages/llmodels/config';
import {
  modalConfig,
  onLineSourceOptions
} from '@/pages/llmodels/config/button-actions';
import DownloadModal from '@/pages/llmodels/download';
import {
  DeleteOutlined,
  DownOutlined,
  SyncOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import React, {
  Button,
  ConfigProvider,
  Empty,
  Input,
  Space,
  Table
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { deleteWorker, queryWorkersList } from '../apis';
import { WorkerStatusMapValue, status } from '../config';
import { ModelFile as ListItem } from '../config/types';

const ActionList = [
  {
    label: 'common.button.deploy',
    key: 'deploy',
    icon: <ThunderboltOutlined />
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

const generateSource = (record: ListItem) => {
  if (record.source === modelSourceMap.modelscope_value) {
    return `${modelSourceMap.modelScope}/${record.model_scope_model_id}`;
  }
  if (record.source === modelSourceMap.huggingface_value) {
    return `${modelSourceMap.huggingface}/${record.huggingface_repo_id}`;
  }
  if (record.source === modelSourceMap.local_path_value) {
    return `${record.local_path}`;
  }
  if (record.source === modelSourceMap.ollama_library_value) {
    return `${modelSourceMap.ollama_library}/${record.ollama_library_model_name}`;
  }
  return '';
};

const ModelFiles: React.FC = () => {
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
    fetchAPI: queryWorkersList,
    deleteAPI: deleteWorker,
    contentForDelete: 'worker'
  });

  const intl = useIntl();
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

  const handleSelect = (val: any, record: ListItem) => {
    if (val === 'delete') {
      handleDelete({
        ...record,
        name: record.local_path
      });
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

  const handleDownload = (data: any) => {
    console.log('download:', data);
  };

  const columns = [
    {
      title: 'Path',
      dataIndex: 'local_path',
      width: 240,
      render: (text: string, record: ListItem) => {
        return (
          <AutoTooltip ghost maxWidth={240}>
            <span>{record.local_path}</span>
          </AutoTooltip>
        );
      }
    },
    {
      title: 'Size',
      dataIndex: 'size',
      render: (text: string, record: ListItem) => {
        return (
          <AutoTooltip ghost maxWidth={100}>
            <span>{record.size}</span>
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
            <span>{record.worker_name}</span>
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
        return (
          <StatusTag
            statusValue={{
              status: status[record.state] as any,
              text: WorkerStatusMapValue[record.state],
              message: record.state_message
            }}
          ></StatusTag>
        );
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
          items={ActionList}
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
                Download Model
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
        title={intl.formatMessage({ id: 'models.button.deploy' })}
        source={downloadModalStatus.source}
        width={downloadModalStatus.width}
        onCancel={handleDownloadCancel}
        onOk={handleDownload}
      ></DownloadModal>
    </>
  );
};

export default ModelFiles;
