import { clusterSessionAtom, expandKeysAtom } from '@/atoms/clusters';
import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import SealTable from '@/components/seal-table';
import TableContext from '@/components/seal-table/table-context';
import { TableOrder } from '@/components/seal-table/types';
import { PageAction } from '@/config';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import type { PageActionType } from '@/config/types';
import useExpandedRowKeys from '@/hooks/use-expanded-row-keys';
import useTableFetch from '@/hooks/use-table-fetch';
import useWatchList from '@/hooks/use-watch-list';
import { useIntl, useNavigate } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { message } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import NoResult from '../_components/no-result';
import PageBox from '../_components/page-box';
import useGranfanaLink from '../resources/hooks/use-grafana-link';
import {
  CLUSTERS_API,
  createWorkerPool,
  deleteCluster,
  queryClusterList,
  queryCredentialList,
  queryWorkerPools,
  setDefaultCluster,
  updateCluster,
  WORKER_POOLS_API
} from './apis';
import ClusterModal from './cluster-modal';
import AddCluster from './components/add-cluster';
import AddPool from './components/add-pool';
import {
  DockerStepsFromCluster,
  K8sStepsFromCluter
} from './components/add-worker/config';
import PoolRows from './components/pool-rows';
import RightActions from './components/right-actions';
import { ProviderType, ProviderValueMap } from './config';
import {
  ClusterListItem,
  CredentialListItem,
  ClusterFormData as FormData,
  ClusterListItem as ListItem,
  NodePoolFormData
} from './config/types';
import useAddWorker from './hooks/use-add-worker';
import useClusterColumns from './hooks/use-cluster-columns';
import useCreateCluster from './hooks/use-create-cluster';

const Clusters: React.FC = () => {
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
    fetchAPI: queryClusterList,
    deleteAPI: deleteCluster,
    watch: true,
    API: CLUSTERS_API,
    contentForDelete: 'menu.clusterManagement.clusters'
  });
  const navigate = useNavigate();
  const { goToGrafana, ActionButton } = useGranfanaLink({
    type: 'cluster'
  });
  const { watchDataList: allWorkerPoolList } = useWatchList(WORKER_POOLS_API);
  const [expandAtom] = useAtom(expandKeysAtom);
  const [clusterSession, setClusterSession] = useAtom(clusterSessionAtom);
  const { handleExpandChange, handleExpandAll, expandedRowKeys } =
    useExpandedRowKeys(expandAtom);
  const intl = useIntl();
  const { handleAddWorker, checkDefaultCluster, AddWorkerModal, setStepList } =
    useAddWorker({});
  const { clusterModalStatus, openClusterModal, closeClusterModal } =
    useCreateCluster({
      refresh: handleSearch
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
    clusterData: ClusterListItem | null;
  }>({
    open: false,
    action: PageAction.CREATE,
    title: '',
    provider: ProviderValueMap.DigitalOcean as ProviderType,
    clusterId: 0,
    clusterData: null
  });

  const handleAddPool = (row: ListItem) => {
    setAddPoolStatus({
      open: true,
      action: PageAction.CREATE,
      title: intl.formatMessage({ id: 'clusters.button.addNodePool' }),
      provider: row.provider as ProviderType,
      clusterId: row.id,
      clusterData: row
    });
  };

  const handleClickDropdown = () => {
    openClusterModal();
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
    } catch (error) {}
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

  const handleSelect = useMemoizedFn((val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditCluster(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    } else if (val === 'add_worker') {
      handleAddWorker(row);
      setStepList(DockerStepsFromCluster);
    } else if (val === 'addPool') {
      handleAddPool(row);
    } else if (val === 'register_cluster') {
      handleAddWorker(row);
      setStepList(K8sStepsFromCluter);
    } else if (val === 'isDefault') {
      setDefaultCluster({ id: row.id }).then(() => {
        message.success(intl.formatMessage({ id: 'common.message.success' }));
      });
    } else if (val === 'metrics') {
      goToGrafana(row);
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
        page: -1
      };
      const data = await queryWorkerPools(params, {
        token: options?.token
      });
      return data?.items || [];
    }
  );

  const handleOnSortChange = (order: TableOrder | Array<TableOrder>) => {
    handleTableChange({}, {}, order, { action: 'sort' });
  };

  const setDisableExpand = (row: ClusterListItem) => {
    return (
      row.provider !== ProviderValueMap.DigitalOcean ||
      !allWorkerPoolList.some((item) => item.cluster_id === row.id)
    );
  };

  const handleOnCell = useMemoizedFn((record: ClusterListItem, dataIndex) => {
    if (dataIndex === 'name') {
      navigate(
        `/cluster-management/clusters/detail?id=${record.id}&name=${record.name}&page=clusters`
      );
    }
  });

  useEffect(() => {
    const fetchCredentialList = async () => {
      const data = await queryCredentialList({ page: -1 });
      const list = data?.items?.map((item: CredentialListItem) => ({
        label: item.name,
        value: item.id
      }));
      setCredentialList(list);
    };
    fetchCredentialList();
  }, []);

  useEffect(() => {
    if (
      clusterSession?.firstAddWorker &&
      dataSource.loadend &&
      dataSource.dataList?.length > 0
    ) {
      const list = dataSource.dataList?.map((item) => ({
        label: item.name,
        value: item.id,
        ...item
      }));
      const targetCluster = checkDefaultCluster(list);

      if (targetCluster) {
        const actionMap = {
          [ProviderValueMap.Docker]: 'add_worker',
          [ProviderValueMap.Kubernetes]: 'register_cluster',
          [ProviderValueMap.DigitalOcean]: 'addPool'
        };
        handleSelect(
          actionMap[targetCluster.provider as string],
          targetCluster as ListItem
        );
        // reset session
        setClusterSession(null);
      }
    }
  }, [clusterSession, dataSource.loadend, dataSource.dataList]);

  useEffect(() => {
    if (clusterSession?.firstAddCluster && dataSource.loadend) {
      openClusterModal();
      // reset session
      setClusterSession(null);
    }
  }, [clusterSession, dataSource.loadend]);

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

  const columns = useClusterColumns(handleSelect, handleOnCell);

  return (
    <>
      <PageBox>
        <FilterBar
          showSelect={false}
          marginBottom={22}
          marginTop={30}
          widths={{ input: 300 }}
          buttonText={intl.formatMessage({ id: 'clusters.button.add' })}
          rowSelection={rowSelection}
          handleInputChange={handleNameChange}
          handleSearch={handleSearch}
          handleDeleteByBatch={handleDeleteBatch}
          handleClickPrimary={handleClickDropdown}
          right={
            <RightActions
              handleDeleteByBatch={handleDeleteBatch}
              handleClickPrimary={handleClickDropdown}
              rowSelection={rowSelection}
              MonitorButton={ActionButton()}
            ></RightActions>
          }
        ></FilterBar>
        <TableContext.Provider
          value={{
            allChildren: allWorkerPoolList,
            setDisableExpand: setDisableExpand
          }}
        >
          <SealTable
            rowKey="id"
            loadChildren={getWorkerPoolList}
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
            childParentKey="cluster_id"
            expandable={true}
            empty={
              <NoResult
                loading={dataSource.loading}
                loadend={dataSource.loadend}
                dataSource={dataSource.dataList}
                image={<IconFont type="icon-cluster-outline" />}
                filters={_.omit(queryParams, ['sort_by'])}
                noFoundText={intl.formatMessage({
                  id: 'noresult.cluster.nofound'
                })}
                title={intl.formatMessage({ id: 'noresult.cluster.title' })}
                subTitle={intl.formatMessage({
                  id: 'noresult.cluster.subTitle'
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
      <AddPool
        provider={addPoolStatus.provider}
        open={addPoolStatus.open}
        action={addPoolStatus.action}
        title={addPoolStatus.title}
        clusterData={addPoolStatus.clusterData}
        onCancel={() => {
          setAddPoolStatus({
            open: false,
            action: PageAction.CREATE,
            title: '',
            provider: ProviderValueMap.DigitalOcean as ProviderType,
            clusterId: 0,
            clusterData: null
          });
        }}
        onOk={handleSubmitWorkerPool}
      ></AddPool>
      <DeleteModal ref={modalRef}></DeleteModal>
      <ClusterModal
        title={intl.formatMessage({
          id: 'menu.clusterManagement.clusterCreate'
        })}
        open={clusterModalStatus.open}
        onClose={closeClusterModal}
      ></ClusterModal>
      {AddWorkerModal}
    </>
  );
};

export default Clusters;
