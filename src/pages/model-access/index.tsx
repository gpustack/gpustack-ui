import { expandKeysAtom } from '@/atoms/clusters';
import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import SealTable from '@/components/seal-table';
import TableContext from '@/components/seal-table/table-context';
import { TableOrder } from '@/components/seal-table/types';
import { PageAction } from '@/config';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useExpandedRowKeys from '@/hooks/use-expanded-row-keys';
import useTableFetch from '@/hooks/use-table-fetch';
import useWatchList from '@/hooks/use-watch-list';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { message } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import NoResult from '../_components/no-result';
import PageBox from '../_components/page-box';
import {
  ACCESS_API,
  ACCESS_POINTS_API,
  deleteAccess,
  queryModelAccesses,
  updateAccess
} from './apis';
import AccessPoints from './components/access-points';
import AddAccessModal from './components/add-access-modal';
import { maasProviderOptions } from './config';
import { mockDataList } from './config/mock';
import { FormData, AccessItem as ListItem } from './config/types';
import useAccessColumns from './hooks/use-access-columns';
import useCreateAccess from './hooks/use-create-access';

const Accesses: React.FC = () => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    handleTableChange,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handlePageChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryModelAccesses,
    deleteAPI: deleteAccess,
    watch: false,
    API: ACCESS_API,
    contentForDelete: 'menu.models.access'
  });
  const { watchDataList: allAccessPoints } = useWatchList(ACCESS_POINTS_API);
  const [expandAtom] = useAtom(expandKeysAtom);
  const { handleExpandChange, handleExpandAll, expandedRowKeys } =
    useExpandedRowKeys(expandAtom);
  const intl = useIntl();
  const {
    openAccessModalStatus,
    setOpenAccessModalStatus,
    openAccessModal,
    closeAccessModal
  } = useCreateAccess({
    refresh: handleSearch
  });

  const handleClickDropdown = () => {
    openAccessModal('create');
  };

  const handleModalOk = async (data: FormData) => {
    const params = {
      ...data
    };
    try {
      if (openAccessModalStatus.action === PageAction.EDIT) {
        await updateAccess({
          data: params,
          id: openAccessModalStatus.currentData!.id
        });
      }
      fetchData();
      setOpenAccessModalStatus({
        open: false,
        action: PageAction.CREATE,
        currentData: undefined,
        title: '',
        provider: null
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {}
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    setOpenAccessModalStatus({
      open: false,
      action: PageAction.CREATE,
      currentData: undefined,
      title: '',
      provider: null
    });
  };

  const handleEditProvider = (row: ListItem) => {
    setOpenAccessModalStatus({
      open: true,
      action: PageAction.EDIT,
      currentData: row,
      title: intl.formatMessage(
        { id: 'clusters.edit.cluster' },
        { cluster: row.name }
      ),
      provider: row.provider
    });
  };

  const handleSelect = useMemoizedFn((val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditProvider(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    }
  });

  const handleOnToggleExpandAll = () => {
    // do nothing
  };

  const handleToggleExpandAll = useMemoizedFn((expanded: boolean) => {
    const keys = dataSource.dataList?.map((item) => item.id);
    handleExpandAll(expanded, keys);
    if (expanded) {
      handleOnToggleExpandAll();
    }
  });

  const loadChildrenData = useMemoizedFn(
    async (row: ListItem, options?: any) => {
      const params = {
        cluster_id: row.id,
        page: -1
      };
      // const data = await queryAccessPoints(params, {
      //   token: options?.token
      // });
      return [1];
    }
  );

  const handleOnSortChange = (order: TableOrder | Array<TableOrder>) => {
    handleTableChange({}, {}, order, { action: 'sort' });
  };

  const renderChildren = (
    list: any,
    options: { parent?: any; [key: string]: any }
  ) => {
    return (
      <AccessPoints
        dataList={list}
        provider={options.parent?.provider}
        providerId={options.parent?.id}
      />
    );
  };

  const columns = useAccessColumns(handleSelect);

  return (
    <>
      <PageBox>
        <FilterBar
          actionType="dropdown"
          showSelect={false}
          marginBottom={22}
          marginTop={30}
          widths={{ input: 300 }}
          buttonText={intl.formatMessage({ id: 'accesses.button.add' })}
          rowSelection={rowSelection}
          handleInputChange={handleNameChange}
          handleSearch={handleSearch}
          handleDeleteByBatch={handleDeleteBatch}
          handleClickPrimary={handleClickDropdown}
          actionItems={maasProviderOptions.map((option) => ({
            ...option,
            icon: (
              <IconFont type={option.icon as string} style={{ fontSize: 14 }} />
            )
          }))}
        ></FilterBar>
        <TableContext.Provider
          value={{
            allChildren: allAccessPoints
          }}
        >
          <SealTable
            rowKey="id"
            loadChildren={loadChildrenData}
            sortDirections={TABLE_SORT_DIRECTIONS}
            expandedRowKeys={expandedRowKeys}
            onExpand={handleExpandChange}
            onExpandAll={handleToggleExpandAll}
            renderChildren={renderChildren}
            onTableSort={handleOnSortChange}
            showSorterTooltip={false}
            dataSource={mockDataList}
            loading={dataSource.loading}
            loadend={dataSource.loadend}
            rowSelection={rowSelection}
            columns={columns}
            childParentKey="access_id"
            expandable={true}
            empty={
              <NoResult
                loading={dataSource.loading}
                loadend={dataSource.loadend}
                dataSource={dataSource.dataList}
                image={<IconFont type="icon-extension-outline" />}
                filters={_.omit(queryParams, ['sort_by'])}
                noFoundText={intl.formatMessage({
                  id: 'noresult.accesses.nofound'
                })}
                title={intl.formatMessage({ id: 'noresult.accesses.title' })}
                subTitle={intl.formatMessage({
                  id: 'noresult.accesses.subTitle'
                })}
                onClick={handleClickDropdown}
                buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
              ></NoResult>
            }
            pagination={{
              showSizeChanger: true,
              pageSize: queryParams.perPage,
              current: queryParams.page,
              total: dataSource.total,
              hideOnSinglePage: queryParams.perPage === 10,
              onChange: handlePageChange
            }}
          ></SealTable>
        </TableContext.Provider>
      </PageBox>
      <AddAccessModal
        provider={openAccessModalStatus.provider}
        open={openAccessModalStatus.open}
        action={openAccessModalStatus.action}
        title={openAccessModalStatus.title}
        currentData={openAccessModalStatus.currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddAccessModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default Accesses;
