import { PageAction } from '@/config';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import { DeleteModal, FilterBar, IconFont, NoResult } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, message, Table } from 'antd';
import _ from 'lodash';
import PageBox from '../../_components/page-box';
import {
  deleteGPUServiceStorageType,
  GPU_SERVICE_STORAGE_TYPE_API,
  queryGPUServiceStorageTypes
} from './apis';
import AddStorageTypeModal from './components/add-storage-type-modal';
import { FormData, ListItem } from './config/types';
import useCreateStorageTypeModal from './hooks/use-create-storage-type-modal';
import useStorageTypeColumns from './hooks/use-storage-type-columns';
import useCreateStorageType from './services/use-create-storage-type';
import useUpdateStorageType from './services/use-update-storage-type';

const GPUServiceStorageTypes: React.FC = () => {
  const intl = useIntl();

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
    key: 'StorageTypes',
    fetchAPI: queryGPUServiceStorageTypes,
    deleteAPI: deleteGPUServiceStorageType,
    watch: false,
    polling: false,
    API: GPU_SERVICE_STORAGE_TYPE_API,
    contentForDelete: intl.formatMessage({ id: 'gpuservice.storageType' }),
    defaultQueryParams: {
      // Management view: drop types reachable only via cross-Org
      // cluster_access. The PV-create picker queries without ``mine``
      // and still sees those for use.
      mine: true
    }
  });

  const { fetchData: createStorageType } = useCreateStorageType();
  const { fetchData: updateStorageType } = useUpdateStorageType();
  const {
    openStorageTypeModalStatus,
    openStorageTypeModal,
    closeStorageTypeModal
  } = useCreateStorageTypeModal();

  const handleAdd = () => {
    openStorageTypeModal(
      PageAction.CREATE,
      intl.formatMessage({ id: 'gpuservice.storageType.add' })
    );
  };

  const handleEdit = (row: ListItem) => {
    openStorageTypeModal(
      PageAction.EDIT,
      intl.formatMessage({ id: 'gpuservice.storageType.edit' }),
      row
    );
  };

  const handleModalOk = async (data: FormData) => {
    try {
      if (openStorageTypeModalStatus.action === PageAction.EDIT) {
        await updateStorageType({
          id: openStorageTypeModalStatus.currentData!.id,
          data: data
        });
      } else {
        await createStorageType({ data: data });
      }
      fetchData();
      closeStorageTypeModal();
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      // it's handled in interceptor
    }
  };

  const handleSelect = useMemoizedFn((val: string, row: ListItem) => {
    if (val === 'edit') {
      handleEdit(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    }
  });

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-storage-outlined" />}
        filters={_.pick(queryParams, ['search'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.gpuservice.storageType.nofound'
        })}
        title={intl.formatMessage({
          id: 'noresult.gpuservice.storageType.title'
        })}
        subTitle={intl.formatMessage({
          id: 'noresult.gpuservice.storageType.subTitle'
        })}
        onClick={handleAdd}
        buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
      />
    );
  };

  const columns = useStorageTypeColumns({
    handleSelect,
    sortOrder
  });

  return (
    <>
      <PageBox>
        <FilterBar
          marginBottom={22}
          marginTop={30}
          showSelect={false}
          inputHolder={intl.formatMessage({
            id: 'gpuservice.storageType.filter.name'
          })}
          buttonText={intl.formatMessage({ id: 'gpuservice.storageType.add' })}
          handleSearch={handleSearch}
          handleDeleteByBatch={handleDeleteBatch}
          handleClickPrimary={handleAdd}
          handleInputChange={handleNameChange}
          rowSelection={rowSelection}
          widths={{ input: 300 }}
        />
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            dataSource={dataSource.dataList}
            rowSelection={rowSelection}
            loading={{
              spinning: dataSource.loading,
              size: 'middle'
            }}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            rowKey={(record) => record.id}
            onChange={handleTableChange}
            pagination={{
              showSizeChanger: true,
              pageSize: queryParams.perPage,
              current: queryParams.page,
              total: dataSource.total,
              hideOnSinglePage: queryParams.perPage === 10,
              onChange: handlePageChange
            }}
          />
        </ConfigProvider>
      </PageBox>
      <AddStorageTypeModal
        open={openStorageTypeModalStatus.open}
        action={openStorageTypeModalStatus.action}
        title={openStorageTypeModalStatus.title}
        data={openStorageTypeModalStatus.currentData}
        onCancel={closeStorageTypeModal}
        onOk={handleModalOk}
      />
      <DeleteModal ref={modalRef} />
    </>
  );
};

export default GPUServiceStorageTypes;
