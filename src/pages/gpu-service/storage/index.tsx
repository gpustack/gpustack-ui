import { PageAction } from '@/config';
import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import {
  BaseSelect,
  DeleteModal,
  FilterBar,
  IconFont,
  NoResult
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Divider, Flex, message, Table } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { PageContainerInner } from '../../_components/page-box';
import {
  createGPUServiceStorage,
  deleteGPUServiceStorage,
  GPU_SERVICE_STORAGE_API,
  queryGPUServiceStorage,
  updateGPUServiceStorage
} from './apis';
import AddModal from './components/add-modal';
import { FormData, ListItem } from './config/types';
import useStorageColumns from './hooks/use-storage-columns';

const GPUServiceStorage: React.FC = () => {
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
    handleQueryChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    key: PaginationKey.Storage,
    fetchAPI: queryGPUServiceStorage,
    deleteAPI: deleteGPUServiceStorage,
    watch: false,
    API: GPU_SERVICE_STORAGE_API,
    contentForDelete: '存储'
  });
  const {
    fetchClusterList,
    cancelRequest: cancelClusterRequest,
    clusterList
  } = useQueryClusterList();
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

  useEffect(() => {
    fetchClusterList({ page: -1 }).then((clusters) => {
      if (clusters.length > 0) {
        handleQueryChange({
          cluster_id: clusters[0].id,
          page: 1
        });
      }
    });
    return () => {
      cancelClusterRequest();
    };
  }, []);

  const handleAddStorage = () => {
    setOpenAddModalStatus({
      action: PageAction.CREATE,
      title: '添加存储',
      open: true,
      currentData: null
    });
  };

  const handleEditStorage = (row: ListItem) => {
    setOpenAddModalStatus({
      action: PageAction.EDIT,
      title: '编辑存储',
      open: true,
      currentData: row
    });
  };

  const closeModal = () => {
    setOpenAddModalStatus({
      action: PageAction.CREATE,
      title: '',
      open: false,
      currentData: null
    });
  };

  const handleModalOk = async (data: FormData) => {
    try {
      if (openAddModalStatus.action === PageAction.EDIT) {
        await updateGPUServiceStorage({
          id: openAddModalStatus.currentData!.id,
          data
        });
      } else {
        await createGPUServiceStorage({ data });
      }

      fetchData();
      closeModal();
      message.success('操作成功');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSelect = useMemoizedFn((val: string, row: ListItem) => {
    if (val === 'edit') {
      handleEditStorage(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    }
  });

  const handleClusterChange = (value: number) => {
    handleQueryChange({
      cluster_id: value,
      page: 1
    });
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-storage-outlined" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText="未找到匹配的存储"
        title="暂无存储"
        subTitle="创建一个存储后会显示在这里"
        onClick={handleAddStorage}
        buttonText="立即添加"
      />
    );
  };

  const columns = useStorageColumns({
    handleSelect,
    sortOrder
  });

  return (
    <>
      <PageContainerInner
        leftContent={
          <Flex align="center">
            <span>{intl.formatMessage({ id: 'menu.gpuService.storage' })}</span>
            <Divider
              orientation="vertical"
              style={{
                marginLeft: 16
              }}
            />
            <BaseSelect
              variant="borderless"
              value={queryParams.cluster_id}
              options={clusterList}
              style={{ minWidth: 120, fontWeight: 500 }}
              onChange={handleClusterChange}
            ></BaseSelect>
          </Flex>
        }
      >
        <FilterBar
          marginBottom={22}
          marginTop={30}
          showSelect={false}
          selectOptions={clusterList}
          select={{ showSearch: true }}
          selectHolder="按集群过滤"
          buttonText="添加存储"
          handleSearch={handleSearch}
          handleSelectChange={handleClusterChange}
          handleDeleteByBatch={handleDeleteBatch}
          handleClickPrimary={handleAddStorage}
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
            rowKey="id"
            onChange={handleTableChange}
            pagination={{
              size: 'middle',
              showSizeChanger: true,
              pageSize: queryParams.perPage,
              current: queryParams.page,
              total: dataSource.total,
              hideOnSinglePage: queryParams.perPage === 10,
              onChange: handlePageChange
            }}
          />
        </ConfigProvider>
      </PageContainerInner>
      <AddModal
        open={openAddModalStatus.open}
        action={openAddModalStatus.action}
        title={openAddModalStatus.title}
        data={openAddModalStatus.currentData}
        onCancel={closeModal}
        onOk={handleModalOk}
      />
      <DeleteModal ref={modalRef} />
    </>
  );
};

export default GPUServiceStorage;
