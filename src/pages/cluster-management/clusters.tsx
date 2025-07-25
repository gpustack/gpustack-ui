import AutoTooltip from '@/components/auto-tooltip';
import DeleteModal from '@/components/delete-modal';
import DropDownActions from '@/components/drop-down-actions';
import DropdownButtons from '@/components/drop-down-buttons';
import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import AddWorker from '@/pages/resources/components/add-worker';
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  KubernetesOutlined,
  ProfileOutlined,
  SnippetsOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Button,
  ConfigProvider,
  Empty,
  Input,
  Space,
  Table,
  message
} from 'antd';
import { useState } from 'react';
import styled from 'styled-components';
import {
  createCredential,
  deleteCredential,
  queryCredentialList,
  updateCredential
} from './apis';
import AddCluster from './components/add-cluster';
import { ClusterDataList } from './config';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from './config/types';
const { Column } = Table;

const addActions = [
  {
    label: 'Custom',
    locale: false,
    value: 'custom',
    key: 'custom',
    icon: <SnippetsOutlined />
  },
  {
    label: 'Kubernetes',
    locale: false,
    value: 'kubernetes',
    key: 'kubernetes',
    icon: <KubernetesOutlined />
  }
];

const WorkerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  .worker {
    display: flex;
    align-items: center;
    gap: 5px;
    .value {
      line-height: 1em;
      color: var(--ant-color-text-secondary);
    }
  }
  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;
    &.ready {
      background-color: var(--ant-color-success);
    }
    &.error {
      background-color: var(--ant-color-error);
    }

    &.transition {
      background-color: var(--ant-blue-5);
    }
  }
`;

const ActionList = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: <EditOutlined></EditOutlined>
  },
  {
    key: 'add',
    label: 'Add Worker',
    locale: false,
    icon: <EditOutlined></EditOutlined>
  },
  {
    key: 'terminal',
    label: 'common.button.detail',
    icon: <ProfileOutlined />
  },
  {
    key: 'delete',
    props: {
      danger: true
    },
    label: 'common.button.delete',
    icon: <DeleteOutlined></DeleteOutlined>
  }
];

const Credentials: React.FC = () => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    sortOrder,
    modalRef,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryCredentialList,
    deleteAPI: deleteCredential,
    contentForDelete: 'users.table.user'
  });

  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [clusterType, setClusterType] = useState<string>('custom');
  const [action, setAction] = useState<PageActionType>(PageAction.CREATE);
  const [title, setTitle] = useState<string>('');
  const [currentData, setCurrentData] = useState<ListItem | undefined>(
    undefined
  );

  const handleAddUser = (value: string) => {
    setOpenAddModal(true);
    setAction(PageAction.CREATE);
    setClusterType(value);
    setTitle('Add Cluster');
  };

  const handleClickDropdown = (item: any) => {
    console.log('handleClickDropdown', item);
    handleAddUser(item.key);
  };

  const handleModalOk = async (data: FormData) => {
    const params = {
      ...data
    };
    try {
      if (action === PageAction.EDIT) {
        await updateCredential({
          data: {
            ...params,
            id: currentData?.id
          }
        });
      } else {
        await createCredential({ data: params });
      }
      fetchData();
      setOpenAddModal(false);
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      setOpenAddModal(false);
    }
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    setOpenAddModal(false);
  };

  const handleEditUser = (row: ListItem) => {
    setCurrentData(row);
    setOpenAddModal(true);
    setAction(PageAction.EDIT);
    setTitle('Edit Cluster');
  };

  const handleSelect = (val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditUser(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    } else if (val === 'add') {
      setOpen(true);
      setCurrentData(row);
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

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({
            id: 'menu.clusterManagement.clusters'
          }),
          style: {
            paddingInline: 'var(--layout-content-header-inlinepadding)'
          },
          breadcrumb: {}
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
                  items: addActions,
                  onClick: handleClickDropdown
                }}
                trigger={['hover']}
                placement="bottomRight"
              >
                <Button
                  icon={<DownOutlined></DownOutlined>}
                  type="primary"
                  iconPosition="end"
                >
                  Add Cluster
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
            dataSource={ClusterDataList}
            rowSelection={rowSelection}
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
              title="Name"
              dataIndex="name"
              key="name"
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return (
                  <AutoTooltip ghost minWidth={20}>
                    {text}
                  </AutoTooltip>
                );
              }}
            />
            <Column
              title="Provider"
              dataIndex="provider"
              key="provider"
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return (
                  <AutoTooltip ghost minWidth={20}>
                    {text}
                  </AutoTooltip>
                );
              }}
            />
            <Column
              title="Workers"
              dataIndex="workers"
              key="workers"
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return (
                  <WorkerWrapper>
                    <span className="worker">
                      <span className="dot ready"></span>
                      <span className="value">3</span>
                    </span>
                    <span className="worker">
                      <span className="dot error"></span>
                      <span className="value">1</span>
                    </span>
                  </WorkerWrapper>
                );
              }}
            />
            <Column
              title="GPUs"
              dataIndex="gpus"
              key="gpus"
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return (
                  <AutoTooltip ghost minWidth={20}>
                    {text}
                  </AutoTooltip>
                );
              }}
            />

            <Column
              title="Deployments"
              dataIndex="deployments"
              key="deployments"
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return (
                  <AutoTooltip ghost minWidth={20}>
                    {text}
                  </AutoTooltip>
                );
              }}
            />
            <Column
              title="Replicas"
              dataIndex="replicas"
              key="replicas"
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return (
                  <WorkerWrapper>
                    <span className="worker">
                      <span className="dot ready"></span>
                      <span className="value">3</span>
                    </span>
                    <span className="worker">
                      <span className="dot error"></span>
                      <span className="value">1</span>
                    </span>
                    <span className="worker">
                      <span className="dot transition"></span>
                      <span className="value">1</span>
                    </span>
                  </WorkerWrapper>
                );
              }}
            />

            <Column
              title={intl.formatMessage({ id: 'common.table.operation' })}
              key="operation"
              ellipsis={{
                showTitle: false
              }}
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
        </ConfigProvider>
      </PageContainer>
      <AddCluster
        clusterType={clusterType}
        open={openAddModal}
        action={action}
        title={title}
        data={currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddCluster>
      <AddWorker open={open} onCancel={() => setOpen(false)}></AddWorker>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default Credentials;
