import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { PageAction } from '@/config';
import { PaginationKey } from '@/config/settings';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import { useIntl } from '@umijs/max';
import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import { ConfigProvider, Table } from 'antd';
import _ from 'lodash';
import { useState } from 'react';
import NoResult from '../_components/no-result';
import PageBox from '../_components/page-box';
import { deleteApisKey, queryApisKeysList } from './apis';
import AddAPIKeyModal from './components/add-apikey-modal';
import { ListItem } from './config/types';
import useKeysColumns from './hooks/use-keys-columns';

const APIKeys: React.FC = () => {
  const {
    TABLE_SORT_DIRECTIONS,
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
    key: PaginationKey.APIKeys,
    fetchAPI: queryApisKeysList,
    deleteAPI: deleteApisKey,
    contentForDelete: 'apikeys.table.apikeys'
  });

  const intl = useIntl();
  const [openAddModal, setOpenAddModal] = useState<{
    open: boolean;
    action: PageActionType;
    title: string;
    currentData?: Partial<ListItem> | null;
  }>({
    open: false,
    action: PageAction.CREATE,
    title: '',
    currentData: null
  });

  const handleAddKey = () => {
    setOpenAddModal({
      open: true,
      title: intl.formatMessage({ id: 'apikeys.button.create' }),
      action: PageAction.CREATE,
      currentData: null
    });
  };

  const handleEditKey = (record: ListItem) => {
    setOpenAddModal({
      open: true,
      title: 'Edit API Key',
      action: PageAction.EDIT,
      currentData: record
    });
  };

  const handleModalOk = async () => {
    try {
      await fetchData();
      setOpenAddModal({
        open: false,
        title: '',
        action: PageAction.CREATE,
        currentData: null
      });
    } catch (error) {
      // do nothing
    }
  };

  const handleModalCancel = () => {
    setOpenAddModal({
      open: false,
      title: '',
      action: PageAction.CREATE,
      currentData: null
    });
  };

  const onSelect = useMemoizedFn(async (val: string, record: ListItem) => {
    if (val === 'delete') {
      handleDelete(record);
    } else if (val === 'edit') {
      handleEditKey(record);
    }
  });

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-key" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.keys.nofound'
        })}
        title={intl.formatMessage({ id: 'noresult.keys.title' })}
        subTitle={intl.formatMessage({ id: 'noresult.keys.subTitle' })}
        onClick={handleAddKey}
        buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
      ></NoResult>
    );
  };

  const columns = useKeysColumns({ handleSelect: onSelect, sortOrder });

  return (
    <>
      <PageBox>
        <FilterBar
          marginBottom={22}
          marginTop={30}
          buttonText={intl.formatMessage({ id: 'apikeys.button.create' })}
          handleSearch={handleSearch}
          handleDeleteByBatch={handleDeleteBatch}
          handleClickPrimary={handleAddKey}
          handleInputChange={handleNameChange}
          rowSelection={rowSelection}
          widths={{ input: 300 }}
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            dataSource={dataSource.dataList}
            rowSelection={rowSelection}
            loading={dataSource.loading}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
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
      </PageBox>
      <AddAPIKeyModal
        open={openAddModal.open}
        action={openAddModal.action}
        title={openAddModal.title}
        currentData={openAddModal.currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddAPIKeyModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default APIKeys;
