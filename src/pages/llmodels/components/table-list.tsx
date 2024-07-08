import DropdownButtons from '@/components/drop-down-buttons';
import PageTools from '@/components/page-tools';
import SealTable from '@/components/seal-table';
import SealColumn from '@/components/seal-table/components/seal-column';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import { handleBatchRequest } from '@/utils';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SyncOutlined,
  WechatWorkOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Access, useAccess, useIntl, useNavigate } from '@umijs/max';
import { Button, Input, Modal, Space, message } from 'antd';
import dayjs from 'dayjs';
import { memo, useCallback, useEffect, useState } from 'react';
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
import AddModal from './add-modal';
import InstanceItem from './instance-item';
import ViewLogsModal from './view-logs-modal';

interface ModelsProps {
  handleSearch: (e: any) => void;
  handleNameChange: (e: any) => void;
  fetchData: () => Promise<any>;
  handleShowSizeChange: (page: number, size: number) => void;
  handlePageChange: (page: number, pageSize: number | undefined) => void;
  createModelsChunkRequest: () => void;
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
  handleShowSizeChange,
  handlePageChange,
  createModelsChunkRequest,
  queryParams,
  loading,
  total,
  fetchData
}) => {
  // const { modal } = App.useApp();
  console.log('model list====2');
  const access = useAccess();
  const intl = useIntl();
  const navigate = useNavigate();
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const [openLogModal, setOpenLogModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [action, setAction] = useState<PageActionType>(PageAction.CREATE);
  const [title, setTitle] = useState<string>('');
  const [currentData, setCurrentData] = useState<ListItem | undefined>(
    undefined
  );
  const [currentInstanceUrl, setCurrentInstanceUrl] = useState<string>('');

  const ActionList = [
    {
      label: intl.formatMessage({ id: 'common.button.edit' }),
      key: 'edit',
      icon: <EditOutlined />
    },
    {
      label: intl.formatMessage({ id: 'models.openinplayground' }),
      key: 'chat',
      icon: <WechatWorkOutlined />
    },
    {
      label: intl.formatMessage({ id: 'common.button.delete' }),
      key: 'delete',
      danger: true,
      icon: <DeleteOutlined />
    }
  ];

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    console.log('handleTableChange=======', pagination, filters, sorter);
    setSortOrder(sorter.order);
  };

  const handleAddModal = () => {
    setOpenAddModal(true);
    setAction(PageAction.CREATE);
    setTitle(intl.formatMessage({ id: 'models.button.deploy' }));
  };

  const handleModalOk = useCallback(
    async (data: FormData) => {
      try {
        if (action === PageAction.CREATE) {
          await createModel({ data });
        }
        if (action === PageAction.EDIT) {
          await updateModel({ data, id: currentData?.id as number });
        }
        setOpenAddModal(false);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
      } catch (error) {}
    },
    [action, currentData]
  );

  const handleModalCancel = useCallback(() => {
    console.log('handleModalCancel');
    setOpenAddModal(false);
  }, []);

  const handleLogModalCancel = useCallback(() => {
    setOpenLogModal(false);
  }, []);
  const handleDelete = async (row: any) => {
    Modal.confirm({
      title: '',
      content: intl.formatMessage(
        { id: 'common.delete.confirm' },
        { type: intl.formatMessage({ id: 'models.table.models' }) }
      ),
      async onOk() {
        await deleteModel(row.id);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
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
        { type: intl.formatMessage({ id: 'models.table.models' }) }
      ),
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRowKeys, deleteModel);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        rowSelection.clearSelections();
      },
      onCancel() {
        console.log('Cancel');
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
  const handleDeleteInstace = (row: any) => {
    Modal.confirm({
      title: '',
      content: intl.formatMessage(
        { id: 'common.delete.confirm' },
        { type: intl.formatMessage({ id: 'models.instances' }) }
      ),
      async onOk() {
        await deleteModelInstance(row.id);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  };

  const getModelInstances = useCallback(async (row: any) => {
    const params = {
      id: row.id,
      page: 1,
      perPage: 100
    };
    const data = await queryModelInstancesList(params);
    return data.items || [];
  }, []);

  const generateChildrenRequestAPI = (params: any) => {
    return `${MODELS_API}/${params.id}/instances`;
  };

  const handleEdit = (row: ListItem) => {
    setCurrentData(row);
    setOpenAddModal(true);
    setAction(PageAction.EDIT);
    setTitle(intl.formatMessage({ id: 'models.title.edit' }));
  };

  const handleSelect = useCallback((val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEdit(row);
    }
    if (val === 'chat') {
      handleOpenPlayGround(row);
    }
    if (val === 'delete') {
      handleDelete(row);
    }
  }, []);

  const handleChildSelect = useCallback(
    (val: any, row: ModelInstanceListItem) => {
      if (val === 'delete') {
        handleDeleteInstace(row);
      }
      if (val === 'viewlog') {
        handleViewLogs(row);
      }
    },
    []
  );

  const renderChildren = (list: any) => {
    return (
      <InstanceItem
        list={list}
        handleChildSelect={handleChildSelect}
      ></InstanceItem>
    );
  };

  useEffect(() => {
    createModelsChunkRequest();
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
              <Button
                icon={<PlusOutlined></PlusOutlined>}
                type="primary"
                onClick={handleAddModal}
              >
                {intl?.formatMessage?.({ id: 'models.button.deploy' })}
              </Button>
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
          loading={loading}
          rowKey="id"
          expandable={true}
          onChange={handleTableChange}
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
            hideOnSinglePage: true,
            onShowSizeChange: handleShowSizeChange,
            onChange: handlePageChange
          }}
        >
          <SealColumn
            title={intl.formatMessage({ id: 'common.table.name' })}
            dataIndex="name"
            key="name"
            width={400}
            span={6}
          />
          <SealColumn
            title={intl.formatMessage({ id: 'models.form.source' })}
            dataIndex="source"
            key="source"
            span={4}
            render={(text) => {
              return modelSourceMap[text] || '-';
            }}
          />
          <SealColumn
            title={intl.formatMessage({ id: 'models.form.replicas' })}
            dataIndex="replicas"
            key="replicas"
            align="center"
            span={4}
          />
          <SealColumn
            span={5}
            title={intl.formatMessage({ id: 'common.table.createTime' })}
            dataIndex="created_at"
            key="createTime"
            defaultSortOrder="descend"
            sortOrder={sortOrder}
            showSorterTooltip={false}
            sorter={true}
            render={(val, row) => {
              return dayjs(val).format('YYYY-MM-DD HH:mm:ss');
            }}
          />
          <SealColumn
            span={5}
            title={intl.formatMessage({ id: 'common.table.operation' })}
            key="operation"
            render={(text, record) => {
              return !record.transition ? (
                <DropdownButtons
                  items={ActionList}
                  onSelect={(val) => handleSelect(val, record)}
                ></DropdownButtons>
              ) : null;
            }}
          />
        </SealTable>
      </PageContainer>
      <AddModal
        open={openAddModal}
        action={action}
        title={title}
        data={currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddModal>
      <ViewLogsModal
        url={currentInstanceUrl}
        open={openLogModal}
        onCancel={handleLogModalCancel}
      ></ViewLogsModal>
    </>
  );
};

export default memo(Models);