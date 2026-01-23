import { expandKeysAtom } from '@/atoms/clusters';
import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { TableOrder } from '@/components/seal-table/types';
import { PageAction } from '@/config';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useExpandedRowKeys from '@/hooks/use-expanded-row-keys';
import useTableFetch from '@/hooks/use-table-fetch';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, message, Table } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import NoResult from '../_components/no-result';
import PageBox from '../_components/page-box';
import {
  createProvider,
  deleteProvider,
  MAAS_PROVIDERS_API,
  queryMaasProviders,
  updateProvider
} from './apis';
import AddMaasProvider from './components/add-provider-modal';
import ProviderModels from './components/provider-models';
import { maasProviderOptions } from './config';
import {
  FormData,
  MaasProviderItem as ListItem,
  MaasProviderItem
} from './config/types';
import useCreateProvider from './hooks/use-create-provider';
import useProviderColumns from './hooks/use-provider-columns';

const MaasProvider: React.FC = () => {
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
    fetchAPI: queryMaasProviders,
    deleteAPI: deleteProvider,
    watch: false,
    API: MAAS_PROVIDERS_API,
    contentForDelete: 'menu.models.providers'
  });
  const [expandAtom] = useAtom(expandKeysAtom);
  const { handleExpandChange, handleExpandAll, expandedRowKeys } =
    useExpandedRowKeys(expandAtom);
  const intl = useIntl();
  const { openProviderModalStatus, openProviderModal, closeProviderModal } =
    useCreateProvider({
      refresh: handleSearch
    });

  const handleClickDropdown = () => {
    openProviderModal(
      'create',
      intl.formatMessage({ id: 'providers.button.add' })
    );
  };

  const handleModalOk = async (data: FormData) => {
    const params = {
      ...data
    };
    try {
      if (openProviderModalStatus.action === PageAction.EDIT) {
        await updateProvider({
          data: params,
          id: openProviderModalStatus.currentData!.id
        });
      }
      if (
        openProviderModalStatus.action === PageAction.CREATE ||
        openProviderModalStatus.action === PageAction.COPY
      ) {
        await createProvider({
          data: params
        });
      }
      fetchData();
      closeProviderModal();
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {}
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    closeProviderModal();
  };

  const handleEditProvider = (row: ListItem) => {
    openProviderModal(
      PageAction.EDIT,
      intl.formatMessage(
        { id: 'clusters.edit.cluster' },
        { cluster: row.name }
      ),
      row
    );
  };

  const handleSelect = useMemoizedFn((val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditProvider(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    }
    if (val === 'copy') {
      openProviderModal(PageAction.COPY, 'Copy Provider', row);
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
    async (row: MaasProviderItem, options?: any) => {
      const params = {
        cluster_id: row.id,
        page: -1
      };
      // const data = await queryProviderModels(params, {
      //   token: options?.token
      // });
      return [1, 2, 3];
    }
  );

  const handleOnSortChange = (order: TableOrder | Array<TableOrder>) => {
    handleTableChange({}, {}, order, { action: 'sort' });
  };

  const renderChildren = (
    list: any,
    options: { parent?: any; [key: string]: any }
  ) => {
    return <ProviderModels dataList={list} />;
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-extension-outline" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.providers.nofound'
        })}
        title={intl.formatMessage({ id: 'noresult.providers.title' })}
        subTitle={intl.formatMessage({
          id: 'noresult.providers.subTitle'
        })}
        onClick={handleClickDropdown}
        buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
      ></NoResult>
    );
  };

  const columns = useProviderColumns(handleSelect);

  return (
    <>
      <PageBox>
        <FilterBar
          showSelect={false}
          marginBottom={22}
          marginTop={30}
          widths={{ input: 300 }}
          buttonText={intl.formatMessage({ id: 'providers.button.add' })}
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
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            rowKey="id"
            tableLayout="auto"
            loadChildren={loadChildrenData}
            sortDirections={TABLE_SORT_DIRECTIONS}
            expandedRowKeys={expandedRowKeys}
            onExpand={handleExpandChange}
            onExpandAll={handleToggleExpandAll}
            renderChildren={renderChildren}
            onTableSort={handleOnSortChange}
            showSorterTooltip={false}
            dataSource={dataSource.dataList}
            loading={dataSource.loading}
            loadend={dataSource.loadend}
            rowSelection={rowSelection}
            columns={columns}
            childParentKey="provider_id"
            scroll={{ x: true }}
            expandable={true}
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
      <AddMaasProvider
        open={openProviderModalStatus.open}
        action={openProviderModalStatus.action}
        title={openProviderModalStatus.title}
        currentData={openProviderModalStatus.currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddMaasProvider>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default MaasProvider;
