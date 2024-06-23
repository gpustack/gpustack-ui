import PageTools from '@/components/page-tools';
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
  UserOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Input, Modal, Space, Table, Tooltip, message } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { createUser, deleteUser, queryUsersList, updateUser } from './apis';
import AddModal from './components/add-modal';
import { FormData, ListItem } from './config/types';
const { Column } = Table;

const Models: React.FC = () => {
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const [total, setTotal] = useState(0);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<ListItem[]>([]);
  const [action, setAction] = useState<PageActionType>(PageAction.CREATE);
  const [title, setTitle] = useState<string>('');
  const [currentData, setCurrentData] = useState<ListItem | undefined>(
    undefined
  );
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    query: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        ..._.pickBy(queryParams, (val: any) => !!val)
      };
      const res = await queryUsersList(params);
      console.log('res=======', res);
      setDataSource(res.items);
      setTotal(res.pagination.total);
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowSizeChange = (page: number, size: number) => {
    setQueryParams({
      ...queryParams,
      perPage: size
    });
  };

  const handlePageChange = (page: number, pageSize: number | undefined) => {
    console.log(page, pageSize);
    setQueryParams({
      ...queryParams,
      page: page
    });
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    console.log('handleTableChange=======', pagination, filters, sorter);
    setSortOrder(sorter.order);
  };

  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = (e: any) => {
    setQueryParams({
      ...queryParams,
      query: e.target.value
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

  const handleModalOk = async (data: FormData) => {
    console.log('handleModalOk');
    const params = {
      ...data,
      is_admin: data.is_admin === 'admin'
    };
    try {
      if (action === PageAction.EDIT) {
        await updateUser({
          data: {
            ...params,
            id: currentData?.id
          }
        });
      } else {
        await createUser({ data: params });
      }
      setOpenAddModal(false);
      message.success('successfully!');
    } catch (error) {
      setOpenAddModal(false);
    }
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    setOpenAddModal(false);
  };

  const handleDelete = (row: ListItem) => {
    Modal.confirm({
      title: '',
      content: 'Are you sure you want to delete the selected users?',
      async onOk() {
        console.log('OK');
        await deleteUser(row.id);
        message.success('successfully!');
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
      content: 'Are you sure you want to delete the selected users?',
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRowKeys, deleteUser);
        message.success('successfully!');
        fetchData();
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  };

  const handleEditUser = (row: ListItem) => {
    setCurrentData(row);
    setOpenAddModal(true);
    setAction(PageAction.EDIT);
    setTitle('Edit User');
  };

  useEffect(() => {
    fetchData();
  }, [queryParams]);

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
                placeholder="名称查询"
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
                onClick={handleDeleteBatch}
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
          rowKey="id"
          onChange={handleTableChange}
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
          <Column title="Name" dataIndex="username" key="name" width={200} />
          <Column
            title="Create Time"
            dataIndex="created_at"
            key="createTime"
            defaultSortOrder="descend"
            sortOrder={sortOrder}
            showSorterTooltip={false}
            sorter={true}
            render={(text, record) => {
              return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
            }}
          />
          <Column
            title="Role"
            dataIndex="role"
            key="role"
            render={(text, record: ListItem) => {
              return record.is_admin ? (
                <>
                  <UserSwitchOutlined className="size-16" />
                  <span className="m-l-5">管理员</span>
                </>
              ) : (
                <>
                  <UserOutlined className="size-16" />
                  <span className="m-l-5">普通用户</span>
                </>
              );
            }}
          />
          <Column
            title="Update Time"
            dataIndex="updated_at"
            key="updateTime"
            defaultSortOrder="descend"
            sortOrder={sortOrder}
            showSorterTooltip={false}
            sorter={true}
            render={(text, record) => {
              return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
            }}
          />
          <Column
            title="Operation"
            key="operation"
            width={200}
            render={(text, record: ListItem) => {
              return (
                <Space size={20}>
                  <Tooltip title="编辑">
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => handleEditUser(record)}
                      icon={<EditOutlined></EditOutlined>}
                    ></Button>
                  </Tooltip>
                  <Tooltip title="删除">
                    <Button
                      size="small"
                      type="primary"
                      danger
                      onClick={() => handleDelete(record)}
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
        data={currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddModal>
    </>
  );
};

export default Models;
