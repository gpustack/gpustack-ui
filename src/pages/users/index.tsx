import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useModel } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Button, ConfigProvider, message, Table } from 'antd';
import { useMemo, useState } from 'react';
import NoResult from '../_components/no-result';
import { createUser, deleteUser, queryUsersList, updateUser } from './apis';
import AddModal from './components/add-modal';
import { FormData, ListItem } from './config/types';
import useUsersColumns from './hooks/use-users-columns';

const Users: React.FC = () => {
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
    fetchAPI: queryUsersList,
    deleteAPI: deleteUser,
    contentForDelete: 'users.table.user'
  });

  const { initialState } = useModel('@@initialState') || {};
  const intl = useIntl();
  const [openAddModalStatus, setOpenAddModalStatus] = useState<{
    action: PageActionType;
    open: boolean;
    title: string;
    currentData?: ListItem | null;
  }>({
    action: PageAction.CREATE,
    title: '',
    open: false,
    currentData: null
  });

  const handleAddUser = () => {
    setOpenAddModalStatus({
      action: PageAction.CREATE,
      title: intl.formatMessage({ id: 'users.form.create' }),
      open: true,
      currentData: null
    });
  };

  const handleModalOk = async (data: FormData) => {
    const params = {
      ...openAddModalStatus.currentData,
      ...data,
      is_admin: data.is_admin === 'admin'
    };
    try {
      if (openAddModalStatus.action === PageAction.EDIT) {
        await updateUser({
          data: {
            ...params,
            id: openAddModalStatus.currentData?.id
          }
        });
      } else {
        await createUser({ data: params });
      }
      fetchData();
      setOpenAddModalStatus({
        ...openAddModalStatus,
        open: false
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      setOpenAddModalStatus({ ...openAddModalStatus, open: false });
      message.error(intl.formatMessage({ id: 'common.message.fail' }));
    }
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    setOpenAddModalStatus({
      ...openAddModalStatus,
      open: false,
      currentData: null
    });
  };

  const handleEditUser = (row: ListItem) => {
    setOpenAddModalStatus({
      title: intl.formatMessage({ id: 'users.form.edit' }),
      action: PageAction.EDIT,
      open: true,
      currentData: row
    });
  };

  const handleSelect = useMemoizedFn((val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditUser(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.username });
    }
  });

  const handleActiveChange = async (checked: boolean, row: ListItem) => {
    try {
      await updateUser({
        data: {
          ...row,
          is_active: checked,
          id: row?.id
        }
      });
      handleSearch();
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      message.error(intl.formatMessage({ id: 'common.message.fail' }));
    }
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-users" />}
        filters={queryParams}
        noFoundText={intl.formatMessage({
          id: 'noresult.users.nofound'
        })}
        title={intl.formatMessage({ id: 'noresult.users.title' })}
        subTitle={intl.formatMessage({ id: 'noresult.users.subTitle' })}
      >
        <Button type="primary" onClick={handleAddUser}>
          {intl.formatMessage({ id: 'noresult.button.add' })}
        </Button>
      </NoResult>
    );
  };

  const columns = useUsersColumns({
    handleSelect,
    sortOrder
  });

  const dataList = useMemo(() => {
    return dataSource.dataList.map((item) => ({
      ...item,
      disabled: initialState?.currentUser?.id === item.id
    }));
  }, [dataSource.dataList, initialState?.currentUser?.id]);

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({ id: 'users.title' }),
          style: {
            paddingInline: 'var(--layout-content-header-inlinepadding)'
          },
          breadcrumb: {}
        }}
        extra={[]}
      >
        <FilterBar
          marginBottom={22}
          marginTop={30}
          buttonText={intl.formatMessage({ id: 'users.button.create' })}
          handleSearch={handleSearch}
          handleDeleteByBatch={handleDeleteBatch}
          handleClickPrimary={handleAddUser}
          handleInputChange={handleNameChange}
          rowSelection={rowSelection}
          width={{ input: 300 }}
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            dataSource={dataList}
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
          ></Table>
        </ConfigProvider>
      </PageContainer>
      <AddModal
        open={openAddModalStatus.open}
        action={openAddModalStatus.action}
        title={openAddModalStatus.title}
        data={openAddModalStatus.currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default Users;
