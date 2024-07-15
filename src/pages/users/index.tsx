import DropdownButtons from '@/components/drop-down-buttons';
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
import { useIntl } from '@umijs/max';
import { Button, Input, Modal, Space, Table, message } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { StrictMode, useEffect, useState } from 'react';
import { createUser, deleteUser, queryUsersList, updateUser } from './apis';
import AddModal from './components/add-modal';
import { FormData, ListItem } from './config/types';
const { Column } = Table;

const Users: React.FC = () => {
  console.log('users======');
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const intl = useIntl();
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
    search: ''
  });

  const ActionList = [
    {
      key: 'edit',
      label: intl.formatMessage({ id: 'common.button.edit' }),
      icon: <EditOutlined></EditOutlined>
    },
    {
      key: 'delete',
      danger: true,
      label: intl.formatMessage({ id: 'common.button.delete' }),
      icon: <DeleteOutlined></DeleteOutlined>
    }
  ];
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
      setDataSource([]);
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
      search: e.target.value
    });
  };

  const handleAddUser = () => {
    setOpenAddModal(true);
    setAction(PageAction.CREATE);
    setTitle(intl.formatMessage({ id: 'users.form.create' }));
  };

  const handleModalOk = async (data: FormData) => {
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

  const handleDelete = (row: ListItem) => {
    Modal.confirm({
      title: '',
      content: intl.formatMessage(
        { id: 'common.delete.confirm' },
        { type: intl.formatMessage({ id: 'users.table.user' }) }
      ),
      async onOk() {
        console.log('OK');
        await deleteUser(row.id);
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
        { type: intl.formatMessage({ id: 'users.table.user' }) }
      ),
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRowKeys, deleteUser);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        rowSelection.clearSelections();
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
    setTitle(intl.formatMessage({ id: 'users.form.edit' }));
  };

  const handleSelect = (val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditUser(row);
    } else if (val === 'delete') {
      handleDelete(row);
    }
  };

  useEffect(() => {
    fetchData();
  }, [queryParams]);

  return (
    <StrictMode>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({ id: 'users.title' })
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
              <Button
                icon={<PlusOutlined></PlusOutlined>}
                type="primary"
                onClick={handleAddUser}
              >
                {intl.formatMessage({ id: 'users.button.create' })}
              </Button>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={handleDeleteBatch}
                disabled={!rowSelection.selectedRowKeys.length}
              >
                {intl.formatMessage({ id: 'common.button.delete' })}
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
          <Column
            title={intl.formatMessage({ id: 'common.table.name' })}
            dataIndex="username"
            key="name"
          />
          <Column
            title={intl.formatMessage({ id: 'users.table.role' })}
            dataIndex="role"
            key="role"
            render={(text, record: ListItem) => {
              return record.is_admin ? (
                <>
                  <UserSwitchOutlined className="size-16" />
                  <span className="m-l-5">
                    {intl.formatMessage({ id: 'users.form.admin' })}
                  </span>
                </>
              ) : (
                <>
                  <UserOutlined className="size-16" />
                  <span className="m-l-5">
                    {intl.formatMessage({ id: 'users.form.user' })}
                  </span>
                </>
              );
            }}
          />
          <Column
            title={intl.formatMessage({ id: 'users.form.fullname' })}
            dataIndex="full_name"
            key="full_name"
          />
          <Column
            title={intl.formatMessage({ id: 'common.table.createTime' })}
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
            title={intl.formatMessage({ id: 'common.table.operation' })}
            key="operation"
            width={200}
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
      </PageContainer>
      <AddModal
        open={openAddModal}
        action={action}
        title={title}
        data={currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddModal>
    </StrictMode>
  );
};

export default Users;
