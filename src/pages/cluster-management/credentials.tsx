import AutoTooltip from '@/components/auto-tooltip';
import DeleteModal from '@/components/delete-modal';
import DropDownActions from '@/components/drop-down-actions';
import DropdownButtons from '@/components/drop-down-buttons';
import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import {
  CloudOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  KeyOutlined,
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
import dayjs from 'dayjs';
import { useState } from 'react';
import {
  createCredential,
  deleteCredential,
  queryCredentialList,
  updateCredential
} from './apis';
import AddModal from './components/add-credential';
import { FormData, ListItem } from './config/types';
const { Column } = Table;

const ActionList = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: <EditOutlined></EditOutlined>
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

const addActions = [
  {
    label: 'Cloud Credential',
    locale: false,
    value: 'cloud_credential',
    key: 'cloud_credential',
    icon: <CloudOutlined />
  },
  {
    label: 'SSH Key',
    locale: false,
    value: 'ssh_key',
    key: 'ssh_key',
    icon: <KeyOutlined />
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
  const [openAddModal, setOpenAddModal] = useState(false);

  const [action, setAction] = useState<PageActionType>(PageAction.CREATE);
  const [title, setTitle] = useState<string>('');
  const [currentData, setCurrentData] = useState<ListItem | undefined>(
    undefined
  );

  const handleAddUser = () => {
    setOpenAddModal(true);
    setAction(PageAction.CREATE);
    setTitle('Add Credential');
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
    setTitle('Edit Credential');
  };

  const handleSelect = (val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditUser(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
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

  const handleClickDropdown = (e: any) => {
    handleAddUser();
  };

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({
            id: 'menu.clusterManagement.credentials'
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
                  Add Credential
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
            dataSource={dataSource.dataList}
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
              title={intl.formatMessage({ id: 'common.table.createTime' })}
              dataIndex="created_at"
              key="createTime"
              defaultSortOrder="descend"
              sortOrder={sortOrder}
              showSorterTooltip={false}
              sorter={false}
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return (
                  <AutoTooltip ghost minWidth={20}>
                    {dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
                  </AutoTooltip>
                );
              }}
            />
            <Column
              title="Description"
              dataIndex="description"
              key="description"
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
      <AddModal
        open={openAddModal}
        action={action}
        title={title}
        data={currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default Credentials;
