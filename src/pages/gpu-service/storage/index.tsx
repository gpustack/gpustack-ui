import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrganizationId } from '@/atoms/user';
import { PageAction } from '@/config';
import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import { ProviderValueMap } from '@/pages/cluster-management/config';
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
import { useAtom } from 'jotai';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageContainerInner } from '../../_components/page-box';
import {
  deleteGPUServiceStorage,
  GPU_SERVICE_STORAGE_API,
  queryGPUServiceStorage
} from './apis';

import AddModal from './components/add-modal';
import { FormData, ListItem } from './config/types';
import useStorageColumns from './hooks/use-storage-columns';
import useCreateStorage from './services/use-create-storage';
import useUpdateStorage from './services/use-update-storage';

const GPUServiceStorage: React.FC = () => {
  const intl = useIntl();
  const namespace = getCurrentOrganizationId();
  const [currentCluster, setCurrentCluster] = useAtom(currentClusterAtom);
  const clusterID = currentCluster?.id;

  const deleteStorage = useCallback(
    (id: number) => deleteGPUServiceStorage({ namespace, clusterID, id }),
    [namespace, clusterID]
  );

  const fetchStorage = useCallback(
    async (
      params: any,
      options?: any
    ): Promise<Global.PageResponse<ListItem>> => {
      const effectiveClusterID = params.cluster_id ?? clusterID;
      if (!effectiveClusterID) {
        return {
          items: [],
          pagination: {
            total: 0,
            totalPage: 0,
            page: 1,
            perPage: params.perPage || 10
          }
        } as Global.PageResponse<ListItem>;
      }
      const res = await queryGPUServiceStorage(
        { ...params, namespace, clusterID: effectiveClusterID },
        options
      );
      const total = res.items?.length ?? 0;
      const perPage = params.perPage || 10;
      return {
        items: res.items ?? [],
        pagination: {
          total,
          totalPage: Math.ceil(total / perPage),
          page: params.page || 1,
          perPage
        }
      };
    },
    [namespace, clusterID]
  );

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
    fetchAPI: fetchStorage,
    deleteAPI: deleteStorage,
    watch: false,
    polling: true,
    API: GPU_SERVICE_STORAGE_API({ namespace, clusterID }),
    contentForDelete: intl.formatMessage({ id: 'gpuservice.storage' })
  });

  const { fetchData: createStorage } = useCreateStorage();
  const { fetchData: updateStorage } = useUpdateStorage();
  const {
    fetchClusterList,
    cancelRequest: cancelClusterRequest,
    clusterList
  } = useQueryClusterList();

  const k8sClusterList = useMemo(
    () =>
      clusterList.filter(
        (item) => item.provider === ProviderValueMap.Kubernetes
      ),
    [clusterList]
  );

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
      const k8sClusters = clusters.filter(
        (item: any) => item.provider === ProviderValueMap.Kubernetes
      );
      if (k8sClusters.length === 0) {
        return;
      }
      const storedCluster = k8sClusters.find(
        (item: any) => item.id === currentCluster?.id
      );
      const targetCluster = storedCluster ?? k8sClusters[0];
      if (!storedCluster) {
        setCurrentCluster({
          ...targetCluster,
          label: targetCluster.name,
          value: targetCluster.id
        });
      }
      handleQueryChange({
        cluster_id: targetCluster.id,
        page: 1
      });
    });
    return () => {
      cancelClusterRequest();
    };
  }, []);

  const handleAddStorage = () => {
    setOpenAddModalStatus({
      action: PageAction.CREATE,
      title: intl.formatMessage({ id: 'gpuservice.storage.add' }),
      open: true,
      currentData: null
    });
  };

  const handleEditStorage = (row: ListItem) => {
    setOpenAddModalStatus({
      action: PageAction.EDIT,
      title: intl.formatMessage({ id: 'gpuservice.storage.edit' }),
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
        await updateStorage({
          id: openAddModalStatus.currentData!.metadata?.name as any,
          data
        });
      } else {
        await createStorage({ data });
      }

      fetchData();
      closeModal();
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      message.error(intl.formatMessage({ id: 'common.message.fail' }));
    }
  };

  const handleSelect = useMemoizedFn((val: string, row: ListItem) => {
    if (val === 'edit') {
      handleEditStorage(row);
    } else if (val === 'delete') {
      handleDelete({
        ...row,
        name: row.metadata?.name,
        id: row.metadata?.name as any
      });
    }
  });

  const handleClusterChange = (value: number) => {
    const cluster = k8sClusterList.find((item) => item.value === value);
    if (cluster) {
      setCurrentCluster(cluster);
    }
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
        filters={_.pick(queryParams, ['search'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.gpuservice.storage.nofound'
        })}
        title={intl.formatMessage({ id: 'noresult.gpuservice.storage.title' })}
        subTitle={intl.formatMessage({
          id: 'noresult.gpuservice.storage.subTitle'
        })}
        onClick={handleAddStorage}
        buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
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
              options={k8sClusterList}
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
          selectOptions={k8sClusterList}
          select={{ showSearch: true }}
          selectHolder={intl.formatMessage({
            id: 'gpuservice.storage.filter.cluster'
          })}
          buttonText={intl.formatMessage({ id: 'gpuservice.storage.add' })}
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
            rowKey={(record) => record.metadata?.name as any}
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
