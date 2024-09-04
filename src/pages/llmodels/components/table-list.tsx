import DeleteModal from '@/components/delete-modal';
import DropdownButtons from '@/components/drop-down-buttons';
import IconFont from '@/components/icon-font';
import PageTools from '@/components/page-tools';
import SealTable from '@/components/seal-table';
import SealColumn from '@/components/seal-table/components/seal-column';
import { PageAction } from '@/config';
import HotKeys from '@/config/hotkeys';
import useExpandedRowKeys from '@/hooks/use-expanded-row-keys';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import ViewCodeModal from '@/pages/playground/components/view-code-modal';
import { handleBatchRequest, platformCall } from '@/utils';
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  SyncOutlined,
  WechatWorkOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Access, useAccess, useIntl, useNavigate } from '@umijs/max';
import { Button, Dropdown, Input, Space, Tag, message } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { memo, useCallback, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  MODELS_API,
  MODEL_INSTANCE_API,
  createModel,
  deleteModel,
  deleteModelInstance,
  queryModelInstancesList,
  updateModel
} from '../apis';
import { modelSourceMap } from '../config';
import { FormData, ListItem, ModelInstanceListItem } from '../config/types';
import DeployModal from './deploy-modal';
import InstanceItem from './instance-item';
import UpdateModel from './update-modal';
import ViewLogsModal from './view-logs-modal';

interface ModelsProps {
  handleSearch: (e: any) => void;
  handleNameChange: (e: any) => void;
  handleShowSizeChange?: (page: number, size: number) => void;
  handlePageChange: (page: number, pageSize: number | undefined) => void;
  queryParams: {
    page: number;
    perPage: number;
    query?: string;
  };
  dataSource: ListItem[];
  loading: boolean;
  total: number;
}

const Models: React.FC<ModelsProps> = ({
  dataSource,
  handleNameChange,
  handleSearch,
  handlePageChange,
  queryParams,
  loading,
  total
}) => {
  console.log('model list====2');
  const platform = platformCall();
  const access = useAccess();
  const intl = useIntl();
  const navigate = useNavigate();
  const rowSelection = useTableRowSelection();
  const { handleExpandChange, updateExpandedRowKeys, expandedRowKeys } =
    useExpandedRowKeys();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const [embeddingParams, setEmbeddingParams] = useState<any>({
    params: {},
    show: false
  });
  const [openLogModal, setOpenLogModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openDeployModal, setOpenDeployModal] = useState<any>({
    show: false,
    width: 600,
    source: modelSourceMap.huggingface_value
  });
  const [title, setTitle] = useState<string>('');
  const [currentData, setCurrentData] = useState<ListItem | undefined>(
    undefined
  );
  const [currentInstanceUrl, setCurrentInstanceUrl] = useState<string>('');
  const modalRef = useRef<any>(null);

  useHotkeys(
    HotKeys.NEW1.join(','),
    () => {
      setOpenDeployModal({
        show: true,
        width: 'calc(100vw - 220px)',
        source: modelSourceMap.huggingface_value
      });
    },
    {
      preventDefault: true,
      enabled: !openAddModal && !openDeployModal.show && !openLogModal
    }
  );

  useHotkeys(
    HotKeys.NEW2.join(','),
    () => {
      setOpenDeployModal({
        show: true,
        width: 600,
        source: modelSourceMap.ollama_library_value
      });
    },
    {
      preventDefault: true,
      enabled: !openAddModal && !openDeployModal.show && !openLogModal
    }
  );

  const sourceOptions = [
    {
      label: 'Hugging Face',
      value: modelSourceMap.huggingface_value,
      key: 'huggingface',
      icon: <IconFont type="icon-huggingface"></IconFont>,
      onClick: () => {
        setOpenDeployModal({
          show: true,
          width: 'calc(100vw - 220px)',
          source: modelSourceMap.huggingface_value
        });
      }
    },
    {
      label: 'Ollama Library',
      value: modelSourceMap.ollama_library_value,
      key: 'ollama_library',
      icon: <IconFont type="icon-ollama"></IconFont>,
      onClick: () => {
        setOpenDeployModal({
          show: true,
          width: 600,
          source: modelSourceMap.ollama_library_value
        });
      }
    }
  ];

  const ActionList = [
    {
      label: 'common.button.edit',
      key: 'edit',
      icon: <EditOutlined />
    },
    {
      label: 'models.openinplayground',
      key: 'chat',
      icon: <WechatWorkOutlined />
    },
    {
      label: 'common.button.viewcode',
      key: 'embedding',
      icon: <IconFont type="icon-code" />
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

  const setActionList = useCallback((record: ListItem) => {
    return _.filter(ActionList, (action: any) => {
      if (action.key === 'chat') {
        return record.ready_replicas > 0 && !record.embedding_only;
      }
      if (action.key === 'embedding') {
        return record.embedding_only && record.ready_replicas > 0;
      }
      return true;
    });
  }, []);

  const handleOnSort = (dataIndex: string, order: any) => {
    console.log('handleTableChange=======', dataIndex, order);
    setSortOrder(order);
  };

  const handleOnCell = async (record: any, dataIndex: string) => {
    const params = {
      id: record.id,
      data: _.omit(record, [
        'id',
        'ready_replicas',
        'created_at',
        'updated_at',
        'rowIndex'
      ])
    };
    await updateModel(params);
    message.success(intl.formatMessage({ id: 'common.message.success' }));
  };

  const handleAddModal = () => {
    setOpenAddModal(true);
    setTitle(intl.formatMessage({ id: 'models.button.deploy' }));
  };

  const handleModalOk = useCallback(
    async (data: FormData) => {
      try {
        console.log('data:', data);
        await updateModel({ data, id: currentData?.id as number });
        setOpenAddModal(false);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
      } catch (error) {}
    },
    [currentData]
  );

  const handleModalCancel = useCallback(() => {
    console.log('handleModalCancel');
    setOpenAddModal(false);
  }, []);

  const handleDeployModalCancel = () => {
    setOpenDeployModal({
      ...openDeployModal,
      show: false
    });
  };

  const handleCreateModel = useCallback(async (data: FormData) => {
    try {
      console.log('data:', data);

      await createModel({ data });
      setOpenDeployModal({
        ...openDeployModal,
        show: false
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {}
  }, []);

  const handleLogModalCancel = useCallback(() => {
    setOpenLogModal(false);
  }, []);
  const handleDelete = async (row: any) => {
    modalRef.current.show({
      content: 'models.table.models',
      name: row.name,
      async onOk() {
        await deleteModel(row.id);
        updateExpandedRowKeys([row.id]);
      }
    });
  };
  const handleDeleteBatch = () => {
    modalRef.current.show({
      content: 'models.table.models',
      selection: true,
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRowKeys, deleteModel);
        rowSelection.clearSelections();
        updateExpandedRowKeys(rowSelection.selectedRowKeys);
      }
    });
  };

  const handleOpenPlayGround = (row: any) => {
    navigate(`/playground?model=${row.name}`);
  };

  const handleViewLogs = async (row: any) => {
    try {
      setCurrentInstanceUrl(`${MODEL_INSTANCE_API}/${row.id}/logs`);
      setOpenLogModal(true);
    } catch (error) {
      console.log('error:', error);
    }
  };
  const handleDeleteInstace = (row: any, list: ModelInstanceListItem[]) => {
    modalRef.current.show({
      content: 'models.instances',
      name: row.name,
      async onOk() {
        await deleteModelInstance(row.id);
        if (list.length === 1) {
          updateExpandedRowKeys([row.model_id]);
        }
      }
    });
  };

  const getModelInstances = async (row: any) => {
    const params = {
      id: row.id,
      page: 1,
      perPage: 100
    };
    const data = await queryModelInstancesList(params);
    return data.items || [];
  };

  const generateChildrenRequestAPI = (params: any) => {
    return `${MODELS_API}/${params.id}/instances`;
  };

  const handleEdit = (row: ListItem) => {
    setCurrentData(row);
    setOpenAddModal(true);
    setTitle(intl.formatMessage({ id: 'models.title.edit' }));
  };

  const handleSelect = useCallback((val: any, row: ListItem) => {
    if (val === 'edit') {
      console.log('row=======', row);
      handleEdit(row);
    }
    if (val === 'chat') {
      handleOpenPlayGround(row);
    }
    if (val === 'delete') {
      handleDelete(row);
    }
    if (val === 'embedding') {
      setEmbeddingParams({
        params: {
          input: 'Your text string goes here',
          model: row.name
        },
        show: true
      });
    }
  }, []);

  const handleChildSelect = useCallback(
    (val: any, row: ModelInstanceListItem, list: ModelInstanceListItem[]) => {
      if (val === 'delete') {
        handleDeleteInstace(row, list);
      }
      if (val === 'viewlog') {
        handleViewLogs(row);
      }
    },
    []
  );

  const renderChildren = useCallback((list: any) => {
    return (
      <InstanceItem
        list={list}
        handleChildSelect={handleChildSelect}
      ></InstanceItem>
    );
  }, []);

  const handleCloseViewCode = useCallback(() => {
    setEmbeddingParams({
      params: {},
      show: false
    });
  }, []);

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({ id: 'models.title' })
        }}
        extra={[]}
      >
        <PageTools
          marginBottom={22}
          left={
            <Space>
              <Input
                placeholder={intl.formatMessage({ id: 'common.filter.name' })}
                style={{ width: 300 }}
                size="large"
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
              <Dropdown menu={{ items: sourceOptions }} placement="bottomRight">
                <Button
                  icon={<DownOutlined></DownOutlined>}
                  type="primary"
                  iconPosition="end"
                >
                  {intl?.formatMessage?.({ id: 'models.button.deploy' })}
                </Button>
              </Dropdown>
              <Access accessible={access.canDelete}>
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={handleDeleteBatch}
                  disabled={!rowSelection.selectedRowKeys.length}
                >
                  {intl?.formatMessage?.({ id: 'common.button.delete' })}
                </Button>
              </Access>
            </Space>
          }
        ></PageTools>
        <SealTable
          dataSource={dataSource}
          rowSelection={rowSelection}
          expandedRowKeys={expandedRowKeys}
          onExpand={handleExpandChange}
          loading={loading}
          rowKey="id"
          childParentKey="model_id"
          expandable={true}
          onSort={handleOnSort}
          onCell={handleOnCell}
          pollingChildren={false}
          watchChildren={true}
          loadChildren={getModelInstances}
          loadChildrenAPI={generateChildrenRequestAPI}
          renderChildren={renderChildren}
          pagination={{
            showSizeChanger: true,
            pageSize: queryParams.perPage,
            current: queryParams.page,
            total: total,
            hideOnSinglePage: queryParams.perPage === 10,
            onChange: handlePageChange
          }}
        >
          <SealColumn
            title={intl.formatMessage({ id: 'common.table.name' })}
            dataIndex="name"
            key="name"
            width={400}
            span={5}
            render={(text, record: ListItem) => {
              return (
                <span>
                  <span className="m-r-5">{text}</span>
                  <span>
                    {record.embedding_only && (
                      <Tag style={{ marginTop: 6 }} color="geekblue">
                        Embedding Only
                      </Tag>
                    )}
                  </span>
                </span>
              );
            }}
          />
          <SealColumn
            title={intl.formatMessage({ id: 'models.form.source' })}
            dataIndex="source"
            key="source"
            span={6}
            render={(text, record: ListItem) => {
              return (
                <span className="flex flex-column">
                  <span>
                    {record.source === modelSourceMap.huggingface_value
                      ? `${modelSourceMap.huggingface} / ${record.huggingface_filename}`
                      : `${modelSourceMap.ollama_library} / ${record.ollama_library_model_name}`}
                  </span>
                </span>
              );
            }}
          />
          <SealColumn
            title={intl.formatMessage({ id: 'models.form.replicas' })}
            dataIndex="replicas"
            key="replicas"
            align="center"
            span={4}
            editable
            valueType="number"
            render={(text, record: ListItem) => {
              return (
                <span>
                  {record.ready_replicas} / {record.replicas}
                </span>
              );
            }}
          />
          <SealColumn
            span={5}
            title={intl.formatMessage({ id: 'common.table.createTime' })}
            dataIndex="created_at"
            key="created_at"
            defaultSortOrder="descend"
            sortOrder={sortOrder}
            sorter={false}
            render={(text, row) => {
              return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
            }}
          />
          <SealColumn
            span={4}
            title={intl.formatMessage({ id: 'common.table.operation' })}
            key="operation"
            dataIndex="operation"
            render={(text, record) => {
              return (
                <DropdownButtons
                  items={setActionList(record)}
                  onSelect={(val) => handleSelect(val, record)}
                ></DropdownButtons>
              );
            }}
          />
        </SealTable>
      </PageContainer>
      <UpdateModel
        open={openAddModal}
        action={PageAction.EDIT}
        title={title}
        data={currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></UpdateModel>
      <DeployModal
        open={openDeployModal.show}
        action={PageAction.CREATE}
        title={intl.formatMessage({ id: 'models.button.deploy' })}
        data={currentData}
        source={openDeployModal.source}
        width={openDeployModal.width}
        onCancel={handleDeployModalCancel}
        onOk={handleCreateModel}
      ></DeployModal>
      <ViewLogsModal
        url={currentInstanceUrl}
        open={openLogModal}
        onCancel={handleLogModalCancel}
      ></ViewLogsModal>
      <DeleteModal ref={modalRef}></DeleteModal>
      <ViewCodeModal
        apiType="embedding"
        open={embeddingParams.show}
        messageList={[]}
        parameters={embeddingParams.params}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewCodeModal>
    </>
  );
};

export default memo(Models);
