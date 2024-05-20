import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SyncOutlined,
  UserOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Input, Modal, Space, Table, Tooltip, message } from 'antd';
import { useState } from 'react';
import AddModal from './components/add-modal';
const { Column } = Table;

const dataSource = [
  {
    key: '1',
    name: 'sam',
    role: 'admin',
    createTime: '2021-09-01 12:00:00'
  },
  {
    key: '2',
    name: 'wang',
    role: 'user',
    createTime: '2021-09-01 12:00:00'
  }
];

const Models: React.FC = () => {
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const [total, setTotal] = useState(100);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<PageActionType>(PageAction.CREATE);
  const [title, setTitle] = useState<string>('');
  const [queryParams, setQueryParams] = useState({
    current: 1,
    pageSize: 10,
    name: ''
  });
  const handleShowSizeChange = (current: number, size: number) => {
    console.log(current, size);
  };

  const handlePageChange = (page: number, pageSize: number | undefined) => {
    console.log(page, pageSize);
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    console.log('handleTableChange=======', pagination, filters, sorter);
    setSortOrder(sorter.order);
  };

  const fetchData = async () => {
    console.log('fetchData');
  };
  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = (e: any) => {
    setQueryParams({
      ...queryParams,
      name: e.target.value
    });
  };

  const handleAddUser = () => {
    setOpenAddModal(true);
    setAction(PageAction.CREATE);
    setTitle('Add User');
  };

  const handleClickMenu = (e: any) => {
    console.log('click', e);
  };

  const handleModalOk = () => {
    console.log('handleModalOk');
    setOpenAddModal(false);
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    setOpenAddModal(false);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '',
      content: 'Are you sure you want to delete the selected users?',
      onOk() {
        console.log('OK');
        message.success('successfully!');
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  };

  const handleEditUser = () => {
    setOpenAddModal(true);
    setAction(PageAction.EDIT);
    setTitle('Edit User');
  };
  return (
    <>
      <PageContainer
        ghost
        header={{
          title: 'Users'
        }}
        extra={[]}
      >
        <PageTools
          marginBottom={22}
          left={
            <Space>
              <Input
                placeholder="按名称查询"
                style={{ width: 300 }}
                onChange={handleNameChange}
              ></Input>
              <Button
                type="text"
                style={{ color: 'var(--ant-color-primary)' }}
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
                onClick={handleAddUser}
              >
                Add User
              </Button>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={handleDelete}
                disabled={!rowSelection.selectedRowKeys.length}
              >
                Delete
              </Button>
            </Space>
          }
        ></PageTools>
        <Table
          dataSource={dataSource}
          rowSelection={rowSelection}
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            showSizeChanger: true,
            pageSize: 10,
            current: 2,
            total: total,
            hideOnSinglePage: true,
            onShowSizeChange: handleShowSizeChange,
            onChange: handlePageChange
          }}
        >
          <Column title="Name" dataIndex="name" key="name" width={400} />
          <Column
            title="Create Time"
            dataIndex="createTime"
            key="createTime"
            defaultSortOrder="descend"
            sortOrder={sortOrder}
            showSorterTooltip={false}
            sorter={true}
          />
          <Column
            title="Role"
            dataIndex="role"
            key="role"
            width={400}
            render={(text, record) => {
              return text === 'admin' ? (
                <UserSwitchOutlined className="size-16" />
              ) : (
                <UserOutlined className="size-16" />
              );
            }}
          />
          <Column
            title="Operation"
            key="operation"
            render={(text, record) => {
              return (
                <Space>
                  <Tooltip title="编辑">
                    <Button
                      size="small"
                      type="primary"
                      onClick={handleEditUser}
                      icon={<EditOutlined></EditOutlined>}
                    ></Button>
                  </Tooltip>
                  <Tooltip title="删除">
                    <Button
                      size="small"
                      type="primary"
                      danger
                      icon={<DeleteOutlined></DeleteOutlined>}
                    ></Button>
                  </Tooltip>
                </Space>
              );
            }}
          />
        </Table>
      </PageContainer>
      <AddModal
        open={openAddModal}
        action={action}
        title={title}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddModal>
    </>
  );
};

export default Models;
