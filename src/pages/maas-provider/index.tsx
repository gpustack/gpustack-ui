import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { PageAction } from '@/config';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, message, Table } from 'antd';
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
import { FormData, MaasProviderItem as ListItem } from './config/types';
import useCreateProvider from './hooks/use-create-provider';
import useProviderColumns from './hooks/use-provider-columns';
import useRegisterRoute from './hooks/use-register-route';

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
  const intl = useIntl();
  const { handleRegisterRoute } = useRegisterRoute();
  const { openProviderModalStatus, openProviderModal, closeProviderModal } =
    useCreateProvider({
      refresh: handleSearch
    });

  const handleClickDropdown = () => {
    openProviderModal(
      PageAction.CREATE,
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
      openProviderModal(
        PageAction.COPY,
        intl.formatMessage({ id: 'providers.button.clone' }),
        {
          ...row,
          name: `${row.name}-copy`
        }
      );
    }

    if (val === 'registerRoute') {
      handleRegisterRoute(row);
    }
  });

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
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            rowKey="id"
            tableLayout="fixed"
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            dataSource={dataSource.dataList}
            loading={dataSource.loading}
            rowSelection={rowSelection}
            columns={columns}
            scroll={{ x: 900 }}
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
