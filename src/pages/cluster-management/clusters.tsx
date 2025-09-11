import { expandKeysAtom } from '@/atoms/clusters';
import DeleteModal from '@/components/delete-modal';
import { FilterBar } from '@/components/page-tools';
import SealTable from '@/components/seal-table';
import TableContext from '@/components/seal-table/table-context';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useExpandedRowKeys from '@/hooks/use-expanded-row-keys';
import useTableFetch from '@/hooks/use-table-fetch';
import useWatchList from '@/hooks/use-watch-list';
import AddWorker from '@/pages/resources/components/add-worker';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { message } from 'antd';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import {
  CLUSTERS_API,
  createCluster,
  createWorkerPool,
  deleteCluster,
  queryClusterList,
  queryClusterToken,
  queryCredentialList,
  queryWorkerPools,
  updateCluster,
  WORKER_POOLS_API
} from './apis';
import AddCluster from './components/add-cluster';
import AddPool from './components/add-pool';
import PoolRows from './components/pool-rows';
import RegisterCluster from './components/register-cluster';
import { ProviderLabelMap, ProviderType, ProviderValueMap } from './config';
import {
  ClusterListItem,
  ClusterFormData as FormData,
  ClusterListItem as ListItem,
  NodePoolFormData
} from './config/types';
import useClusterColumns from './hooks/use-cluster-columns';

const Credentials: React.FC = () => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryClusterList,
    deleteAPI: deleteCluster,
    watch: true,
    API: CLUSTERS_API,
    contentForDelete: 'menu.clusterManagement.clusters'
  });
  const { watchDataList: allWorkerPoolList } = useWatchList(WORKER_POOLS_API);
  const [expandAtom, setExpandAtom] = useAtom(expandKeysAtom);
  const {
    handleExpandChange,
    handleExpandAll,
    updateExpandedRowKeys,
    removeExpandedRowKey,
    expandedRowKeys
  } = useExpandedRowKeys(expandAtom);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const intl = useIntl();
  const [registerClusterStatus, setRegisterClusterStatus] = useState<{
    open: boolean;
    registrationInfo: {
      token: string;
      image: string;
      server_url: string;
      cluster_id: number;
    };
  }>({
    open: false,
    registrationInfo: {
      token: '',
      image: '',
      server_url: '',
      cluster_id: 0
    }
  });

  const [openAddWorker, setOpenAddWorker] = useState<{
    open: boolean;
    registrationInfo: {
      token: string;
      image: string;
      server_url: string;
    };
  }>({
    open: false,
    registrationInfo: {
      token: '',
      image: '',
      server_url: ''
    }
  });
  const [openAddModal, setOpenAddModal] = useState<{
    open: boolean;
    action: PageActionType;
    currentData?: ListItem;
    title: string;
    provider: ProviderType;
  }>({
    open: false,
    action: PageAction.CREATE,
    currentData: undefined,
    title: '',
    provider: null
  });

  const [credentialList, setCredentialList] = useState<
    Global.BaseOption<number>[]
  >([]);

  const [addPoolStatus, setAddPoolStatus] = useState<{
    open: boolean;
    action: PageActionType;
    title: string;
    provider: ProviderType;
    clusterId: number;
  }>({
    open: false,
    action: PageAction.CREATE,
    title: '',
    provider: ProviderValueMap.DigitalOcean as ProviderType,
    clusterId: 0
  });

  const handleAddCluster = (value: string) => {
    const label = ProviderLabelMap[value];
    const clusterLabel =
      value === ProviderValueMap.Custom
        ? intl.formatMessage({ id: 'clusters.provider.custom' })
        : label;

    setOpenAddModal({
      open: true,
      action: PageAction.CREATE,
      currentData: undefined,
      title: intl.formatMessage(
        { id: 'clusters.add.cluster' },
        { cluster: clusterLabel }
      ),
      provider: value as ProviderType
    });
  };

  const handleAddPool = (row: ListItem) => {
    setAddPoolStatus({
      open: true,
      action: PageAction.CREATE,
      title: intl.formatMessage({ id: 'clusters.button.addNodePool' }),
      provider: row.provider as ProviderType,
      clusterId: row.id
    });
  };

  const handleClickDropdown = (item: any) => {
    navigate(`/cluster-management/clusters/create?action=${PageAction.CREATE}`);
  };

  const handleModalOk = async (data: FormData) => {
    const params = {
      ...data
    };
    try {
      if (openAddModal.action === PageAction.EDIT) {
        await updateCluster({
          data: params,
          id: openAddModal.currentData!.id
        });
      } else {
        await createCluster({ data: params });
      }
      fetchData();
      setOpenAddModal({
        open: false,
        action: PageAction.CREATE,
        currentData: undefined,
        title: '',
        provider: null
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      setOpenAddModal({
        open: false,
        action: PageAction.CREATE,
        currentData: undefined,
        title: '',
        provider: null
      });
    }
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    setOpenAddModal({
      open: false,
      action: PageAction.CREATE,
      currentData: undefined,
      title: '',
      provider: null
    });
  };

  const handleEditCluster = (row: ListItem) => {
    setOpenAddModal({
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

  const handleAddWorker = async (row: ListItem) => {
    try {
      const data = await queryClusterToken({ id: row.id });
      setOpenAddWorker({
        open: true,
        registrationInfo: data
      });
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch cluster token');
    }
  };

  const handleRegisterCluster = async (row: ListItem) => {
    try {
      const info = await queryClusterToken({ id: row.id });
      setRegisterClusterStatus({
        open: true,
        registrationInfo: {
          ...info,
          cluster_id: row.id
        }
      });
    } catch (error) {}
  };

  const handleSelect = useMemoizedFn((val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditCluster(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    } else if (val === 'add_worker') {
      handleAddWorker(row);
    } else if (val === 'addPool') {
      handleAddPool(row);
    } else if (val === 'register_cluster') {
      handleRegisterCluster(row);
    }
  });

  const handleOnToggleExpandAll = () => {};

  const handleToggleExpandAll = useMemoizedFn((expanded: boolean) => {
    const keys = dataSource.dataList?.map((item) => item.id);
    handleExpandAll(expanded, keys);
    if (expanded) {
      handleOnToggleExpandAll();
    }
  });

  const handleSubmitWorkerPool = async (formdata: NodePoolFormData) => {
    try {
      await createWorkerPool({
        data: formdata,
        clusterId: addPoolStatus.clusterId
      });
      setAddPoolStatus({
        ...addPoolStatus,
        open: false
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      // error
    }
  };

  const getWorkerPoolList = useMemoizedFn(
    async (row: ClusterListItem, options?: any) => {
      const params = {
        cluster_id: row.id,
        page: 1,
        perPage: 100
      };
      const data = await queryWorkerPools(params, {
        token: options?.token
      });
      return data?.items || [];
    }
  );

  const setDisableExpand = (row: ClusterListItem) => {
    return (
      row.provider !== ProviderValueMap.DigitalOcean ||
      !allWorkerPoolList.some((item) => item.cluster_id === row.id)
    );
  };

  useEffect(() => {
    const fetchCredentialList = async () => {
      const data = await queryCredentialList({ page: 1, perPage: 100 });
      const list = data?.items?.map((item) => ({
        label: item.name,
        value: item.id
      }));
      setCredentialList(list);
    };
    fetchCredentialList();
  }, []);

  const renderChildren = (
    list: any,
    options: { parent?: any; [key: string]: any }
  ) => {
    return (
      <PoolRows
        dataList={list}
        provider={options.parent?.provider}
        clusterId={options.parent?.id}
      />
    );
  };

  const columns = useClusterColumns(handleSelect);

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({
            id: 'menu.clusterManagement.clusters'
          }),
          style: {
            paddingInline: 'var(--layout-content-header-inlinepadding)'
          },
          breadcrumb: {}
        }}
        extra={[]}
      >
        <FilterBar
          showSelect={false}
          showPrimaryButton={true}
          showDeleteButton={true}
          marginBottom={22}
          marginTop={30}
          width={{ input: 300 }}
          buttonText={intl.formatMessage({ id: 'clusters.button.add' })}
          rowSelection={rowSelection}
          handleInputChange={handleNameChange}
          handleSearch={handleSearch}
          handleDeleteByBatch={handleDeleteBatch}
          handleClickPrimary={handleClickDropdown}
        ></FilterBar>
        <TableContext.Provider
          value={{
            allChildren: allWorkerPoolList,
            setDisableExpand: setDisableExpand
          }}
        >
          <SealTable
            rowKey="id"
            tableLayout="fixed"
            style={{ width: '100%' }}
            loadChildren={getWorkerPoolList}
            onChange={handleTableChange}
            expandedRowKeys={expandedRowKeys}
            onExpand={handleExpandChange}
            onExpandAll={handleToggleExpandAll}
            renderChildren={renderChildren}
            dataSource={dataSource.dataList}
            loading={dataSource.loading}
            loadend={dataSource.loadend}
            rowSelection={rowSelection}
            columns={columns}
            childParentKey="cluster_id"
            expandable={true}
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
      </PageContainer>
      <AddCluster
        provider={openAddModal.provider}
        open={openAddModal.open}
        action={openAddModal.action}
        title={openAddModal.title}
        currentData={openAddModal.currentData}
        credentialList={credentialList}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddCluster>
      <AddWorker
        open={openAddWorker.open}
        onCancel={() =>
          setOpenAddWorker({
            open: false,
            registrationInfo: { token: '', image: '', server_url: '' }
          })
        }
        registrationInfo={openAddWorker.registrationInfo}
      ></AddWorker>
      <RegisterCluster
        title={intl.formatMessage({ id: 'clusters.button.register' })}
        open={registerClusterStatus.open}
        registrationInfo={registerClusterStatus.registrationInfo}
        onCancel={() => {
          setRegisterClusterStatus({
            open: false,
            registrationInfo: {
              token: '',
              image: '',
              server_url: '',
              cluster_id: 0
            }
          });
        }}
      ></RegisterCluster>
      <AddPool
        provider={addPoolStatus.provider}
        open={addPoolStatus.open}
        action={addPoolStatus.action}
        title={addPoolStatus.title}
        onCancel={() => {
          setAddPoolStatus({
            open: false,
            action: PageAction.CREATE,
            title: '',
            provider: ProviderValueMap.DigitalOcean as ProviderType,
            clusterId: 0
          });
        }}
        onOk={handleSubmitWorkerPool}
      ></AddPool>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default Credentials;
