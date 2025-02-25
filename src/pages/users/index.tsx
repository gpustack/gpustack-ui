import AutoTooltip from '@/components/auto-tooltip';
import DeleteModal from '@/components/delete-modal';
import DropdownButtons from '@/components/drop-down-buttons';
import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import HotKeys from '@/config/hotkeys';
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
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
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
  const modalRef = useRef<any>(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [dataSource, setDataSource] = useState<{
    dataList: ListItem[];
    loading: boolean;
    loadend: boolean;
    total: number;
  }>({
    dataList: [],
    loading: false,
    loadend: false,
    total: 0
  });
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
  const fetchData = async () => {
    setDataSource((pre) => {
      pre.loading = true;
      return { ...pre };
    });
    try {
      const params = {
        ..._.pickBy(queryParams, (val: any) => !!val)
      };
      const res = await queryUsersList(params);
      setDataSource({
        dataList: res.items || [],
        loading: false,
        loadend: true,
        total: res.pagination.total
      });
    } catch (error) {
      setDataSource({
        dataList: [],
        loading: false,
        loadend: true,
        total: dataSource.total
      });
      console.log('error', error);
    }
  };

  const handlePageChange = (page: number, pageSize: number | undefined) => {
    console.log(page, pageSize);
    setQueryParams({
      ...queryParams,
      perPage: pageSize || 10,
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
      page: 1,
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
    modalRef.current.show({
      content: 'users.table.user',
      operation: 'common.delete.single.confirm',
      name: row.name,
      async onOk() {
        console.log('OK');
        await deleteUser(row.id);
        fetchData();
      }
    });
  };

  const handleDeleteBatch = () => {
    modalRef.current.show({
      content: 'users.table.user',
      operation: 'common.delete.confirm',
      selection: true,
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRowKeys, deleteUser);
        rowSelection.clearSelections();
        fetchData();
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

  useEffect(() => {
    fetchData();
  }, [queryParams]);

  useHotkeys(
    HotKeys.CREATE,
    () => {
      handleAddUser();
    },
    {
      enabled: !openAddModal
    }
  );

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({ id: 'users.title' }),
          style: {
            paddingInline: 'var(--layout-content-header-inlinepadding)'
          }
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
              title={intl.formatMessage({ id: 'common.table.name' })}
              dataIndex="username"
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
              title={intl.formatMessage({ id: 'users.table.role' })}
              dataIndex="role"
              key="role"
              ellipsis={{
                showTitle: false
              }}
              render={(text, record: ListItem) => {
                return record.is_admin ? (
                  <AutoTooltip ghost minWidth={50}>
                    <UserSwitchOutlined className="size-16" />
                    <span className="m-l-5">
                      {intl.formatMessage({ id: 'users.form.admin' })}
                    </span>
                  </AutoTooltip>
                ) : (
                  <AutoTooltip ghost minWidth={50}>
                    <UserOutlined className="size-16" />
                    <span className="m-l-5">
                      {intl.formatMessage({ id: 'users.form.user' })}
                    </span>
                  </AutoTooltip>
                );
              }}
            />
            <Column
              title={intl.formatMessage({ id: 'users.form.fullname' })}
              dataIndex="full_name"
              key="full_name"
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

export default Users;
