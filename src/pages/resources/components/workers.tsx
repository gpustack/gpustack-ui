import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import PageBox from '@/pages/_components/page-box';
import { queryClusterTopology } from '@/pages/cluster-management/apis';
import { DockerStepsFromWorker } from '@/pages/cluster-management/components/add-worker/config';
import TopologyDrawer from '@/pages/cluster-management/components/topology';
import { SetLocationForWorkers } from '@/pages/cluster-management/components/topology/set-location';
import {
  ClusterListItem,
  TopologyView
} from '@/pages/cluster-management/config/types';
import useAddWorker from '@/pages/cluster-management/hooks/use-add-worker';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import useNoResourceResult from '@/pages/llmodels/hooks/use-no-resource-result';
import useGranfanaLink from '@/pages/resources/hooks/use-grafana-link';
import { EnvironmentOutlined } from '@ant-design/icons';
import {
  DeleteModal,
  FilterBar,
  Table as SealTable,
  type TableOrder
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Button, message } from 'antd';
import { useEffect, useState } from 'react';
import {
  WORKERS_API,
  deleteWorker,
  queryWorkersList,
  updateWorker
} from '../apis';
import { ListItem } from '../config/types';
import useWorkerColumns from '../hooks/use-worker-columns';
import useWorkerMaintenance from '../hooks/use-worker-maintenance';
import UpdateLabels from './update-labels';
import WorkerDetailModal from './worker-detail-modal';
import WorkerRightActions from './worker-right-actions';
import WorkerSSHModal from './worker-ssh-modal';

// Optional ``clusterId`` pins the list to a single cluster (used by
// the cluster-detail page) and hides the cluster-filter dropdown so
// the user can't change scope away from the cluster they're already
// inside.
interface WorkersProps {
  clusterId?: number;
  source?: 'clusterDetail';
}

const Workers: React.FC<WorkersProps> = ({ clusterId, source }) => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    extraStatus,
    sortOrder,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleQueryChange,
    handleNameChange
  } = useTableFetch<ListItem>({
    key: PaginationKey.Workers,
    events: ['UPDATE', 'DELETE', 'CREATE'],
    fetchAPI: queryWorkersList,
    deleteAPI: deleteWorker,
    contentForDelete: 'resources.worker',
    watch: true,
    API: WORKERS_API,
    updateManually: true,
    defaultQueryParams: clusterId ? { cluster_id: clusterId } : undefined
  });
  const { goToGrafana, ActionButton } = useGranfanaLink({
    type: 'worker'
  });
  const { MaintenanceModal, handleStopMaintenance, setOpenStatus } =
    useWorkerMaintenance({ fetchData: handleSearch });
  const { fetchClusterList } = useQueryClusterList({
    useStateData: false
  });

  const intl = useIntl();
  // Non-empty means the labels modal is writing to the selection rather than
  // to one row. Held as ids and not rows so a background refresh cannot leave
  // the modal pointed at stale copies.
  const [batchLabelTargets, setBatchLabelTargets] = useState<number[]>([]);
  const [updateLabelsData, setUpdateLabelsData] = useState<{
    open: boolean;
    data: ListItem;
  }>({
    open: false,
    data: {} as ListItem
  });
  const [clusterData, setClusterData] = useState<{
    list: Global.BaseOption<number, ClusterListItem>[];
    loading: boolean;
    data: Record<number, string>;
  }>({
    list: [],
    loading: false,
    data: {}
  });
  const [workerDetailStatus, setWorkerDetailStatus] = useState<{
    open: boolean;
    currentData: ListItem | null;
  }>({
    open: false,
    currentData: null
  });
  const [workerSSHStatus, setWorkerSSHStatus] = useState<{
    open: boolean;
    currentData: ListItem | null;
  }>({
    open: false,
    currentData: null
  });
  // Which label keys each cluster's location fields read; the location column
  // resolves rows against these locally instead of asking per row.
  const [topologies, setTopologies] = useState<Record<number, TopologyView>>(
    {}
  );
  const [topologyTarget, setTopologyTarget] = useState<{
    clusterId: number;
    workerId?: number;
  } | null>(null);
  const [setLocationOpen, setSetLocationOpen] = useState(false);

  const getTopologies = async (clusterIds: number[]) => {
    const pairs = await Promise.all(
      clusterIds.map((id) =>
        queryClusterTopology({ id }, { skipErrorHandler: true })
          .then((view) => [id, view] as const)
          .catch(() => null)
      )
    );
    const next: Record<number, TopologyView> = {};
    pairs.forEach((pair) => {
      if (pair) {
        next[pair[0]] = pair[1];
      }
    });
    setTopologies(next);
  };
  const { handleAddWorker, checkDefaultCluster, AddWorkerModal, setStepList } =
    useAddWorker({
      clusterList: clusterData.list,
      clusterLoading: clusterData.loading
    });

  const getClusterList = async () => {
    try {
      // Own-org clusters only (mine=true). A worker can only join a cluster
      // its org owns, so another org's cluster (e.g. the Default org's
      // "shared with everyone" clusters) must not be offered in the picker.
      // The worker list is owner-scoped too, so this list also covers every
      // cluster the table's name column can reference.
      const params = {
        page: -1,
        mine: true
      };
      const items = await fetchClusterList(params);
      const clusterMap = items?.reduce(
        (acc: Record<number, string>, item: any) => {
          acc[item.id] = item.name;
          return acc;
        },
        {}
      );
      const list = items?.map((item: any) => ({
        label: item.name,
        value: item.id,
        id: item.id,
        state: item.state,
        is_default: item.is_default,
        provider: item.provider
      }));
      setClusterData({
        list,
        loading: false,
        data: clusterMap
      });
      getTopologies((items || []).map((item: any) => item.id));
    } catch (error) {
      setClusterData({
        list: [],
        loading: false,
        data: {}
      });
    }
  };

  const handleUpdateLabelsOk = async (values: Record<string, any>) => {
    try {
      if (batchLabelTargets.length) {
        // The endpoint is a per-worker PUT taking the whole row, so a batch is
        // N writes. Sent with `allSettled` and reported by count: labelling
        // thirty workers and failing on one must not roll back the
        // twenty-nine that worked, and must not claim success either.
        const rows = (dataSource.dataList || []).filter((item: ListItem) =>
          batchLabelTargets.includes(item.id)
        );
        const results = await Promise.allSettled(
          rows.map((row: ListItem) =>
            updateWorker(row.id, { ...row, labels: values.labels })
          )
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed) {
          message.warning(
            intl.formatMessage(
              { id: 'resources.worker.setLabels.partial' },
              { done: results.length - failed, failed }
            )
          );
        } else {
          message.success(intl.formatMessage({ id: 'common.message.success' }));
        }
        rowSelection?.clearSelections?.();
      } else {
        await updateWorker(updateLabelsData.data.id, {
          ...updateLabelsData.data,
          labels: values.labels
        });
        message.success(intl.formatMessage({ id: 'common.message.success' }));
      }
      fetchData();
      setBatchLabelTargets([]);
      setUpdateLabelsData({ open: false, data: {} as ListItem });
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleCancelUpdateLabels = () => {
    setBatchLabelTargets([]);
    setUpdateLabelsData({
      ...updateLabelsData,
      open: false
    });
  };

  const handleUpdateLabels = (record: ListItem) => {
    setBatchLabelTargets([]);
    setUpdateLabelsData({
      open: true,
      data: {
        ...record
      }
    });
  };

  /**
   * Bulk labelling: the same modal, pointed at the selection.
   *
   * Topology is declared once and maintained by labelling, and a fleet is
   * labelled forty machines at a time — a modal per host is not a workflow.
   */
  const handleUpdateLabelsByBatch = () => {
    const ids = (rowSelection?.selectedRowKeys || []) as number[];
    if (!ids.length) {
      return;
    }
    setBatchLabelTargets(ids);
    setUpdateLabelsData({
      open: true,
      data: {} as ListItem
    });
  };

  const handleViewDetail = (record: ListItem) => {
    setWorkerDetailStatus({
      open: true,
      currentData: record
    });
  };

  const handleSelect = useMemoizedFn((val: any, record: ListItem) => {
    if (val === 'edit') {
      handleUpdateLabels(record);
      return;
    }
    if (val === 'delete') {
      handleDelete(record);
    }
    if (val === 'details') {
      handleViewDetail(record);
    }
    if (val === 'view_ssh') {
      setWorkerSSHStatus({
        open: true,
        currentData: record
      });
    }

    if (val === 'star_maintenance') {
      setOpenStatus({
        open: true,
        currentData: record
      });
    }

    if (val === 'stop_maintenance') {
      handleStopMaintenance(record);
    }
    if (val === 'metrics') {
      goToGrafana(record);
    }
    if (val === 'topology') {
      setTopologyTarget({ clusterId: record.cluster_id, workerId: record.id });
    }
  });

  const selectedWorkers = (dataSource.dataList || []).filter((item: ListItem) =>
    (rowSelection?.selectedRowKeys || []).includes(item.id)
  );

  const setLocationAction = (
    <SetLocationForWorkers
      open={setLocationOpen}
      onOpenChange={setSetLocationOpen}
      workers={selectedWorkers}
      onDone={() => {
        fetchData();
        getTopologies(Object.keys(topologies).map(Number));
      }}
    >
      <Button
        icon={<EnvironmentOutlined />}
        disabled={!rowSelection?.selectedRowKeys?.length}
      >
        <span>
          {intl.formatMessage({ id: 'resources.worker.setLocation' })}
          {rowSelection?.selectedRowKeys?.length > 0 && (
            <span>({rowSelection?.selectedRowKeys?.length})</span>
          )}
        </span>
      </Button>
    </SetLocationForWorkers>
  );

  const handleOnAddWorker = () => {
    const targetCluster = checkDefaultCluster(clusterData.list);
    if (targetCluster) {
      handleAddWorker(targetCluster as ClusterListItem, true);
    } else {
      message.info(intl.formatMessage({ id: 'noresult.resources.cluster' }));
    }
  };

  const { noResourceResult } = useNoResourceResult({
    loadend: dataSource.loadend,
    loading: dataSource.loading,
    dataSource: dataSource.dataList,
    queryParams: queryParams,
    iconType: 'icon-resources',
    title: intl.formatMessage({ id: 'noresult.workers.title' }),
    noClusters: !clusterData.list.length,
    noWorkers: dataSource.dataList.length === 0 && clusterData.list.length > 0,
    defaultContent: {
      subTitle: intl.formatMessage({ id: 'noresult.workers.subTitle' }),
      noFoundText: intl.formatMessage({ id: 'noresult.workers.nofound' }),
      buttonText: intl.formatMessage({ id: 'noresult.workers.button.add' }),
      onClick: handleOnAddWorker
    }
  });

  // SealTable reports a sort as a `TableOrder` (or a list of them) instead of
  // antd's `(pagination, filters, sorter, extra)`, so feed `handleTableChange`
  // the shape it expects — the sorter slot plus an explicit `sort` action.
  const handleTableSort = (order: TableOrder | Array<TableOrder>) => {
    handleTableChange({}, {}, order, { action: 'sort' });
  };

  const handleClusterChange = (value: number) => {
    handleQueryChange({
      page: 1,
      cluster_id: value
    });
  };

  const columns = useWorkerColumns({
    clusterData,
    topologies,
    loadend: dataSource.loadend,
    firstLoad: extraStatus.firstLoad,
    sortOrder,
    source,
    handleSelect
  });

  useEffect(() => {
    getClusterList();
    setStepList(DockerStepsFromWorker);
  }, []);

  return (
    <>
      <PageBox>
        <FilterBar
          showSelect={source !== 'clusterDetail'}
          selectHolder={intl.formatMessage({ id: 'clusters.filterBy.cluster' })}
          buttonText={intl.formatMessage({ id: 'resources.button.create' })}
          handleDeleteByBatch={handleDeleteBatch}
          handleSearch={handleSearch}
          handleSelectChange={handleClusterChange}
          handleClickPrimary={handleOnAddWorker}
          handleInputChange={handleNameChange}
          rowSelection={rowSelection}
          selectOptions={clusterData.list}
          widths={
            source !== 'clusterDetail'
              ? { select: 230, input: 230 }
              : { input: 300 }
          }
          right={
            source === 'clusterDetail' ? (
              <></>
            ) : (
              <WorkerRightActions
                handleDeleteByBatch={handleDeleteBatch}
                handleUpdateLabelsByBatch={handleUpdateLabelsByBatch}
                SetLocationAction={setLocationAction}
                handleClickPrimary={handleOnAddWorker}
                rowSelection={rowSelection}
                MonitorButton={ActionButton()}
              ></WorkerRightActions>
            )
          }
        ></FilterBar>
        <SealTable
          rowKey="id"
          columns={columns}
          dataSource={dataSource.dataList}
          loading={dataSource.loading}
          loadend={dataSource.loadend}
          sortDirections={TABLE_SORT_DIRECTIONS}
          showSorterTooltip={false}
          onTableSort={handleTableSort}
          // `true` widens the row to the columns' own floors (sum of their
          // `minWidth` + the prefix gutter) and scrolls past that. Not
          // `'max-content'`: on a grid of `fr` tracks the greediest cell — the
          // wrap-happy labels column — sets the `fr` unit for every track, which
          // blows the table up to ~3.4x the width it actually needs.
          scroll={{ x: true }}
          rowSelection={source === 'clusterDetail' ? undefined : rowSelection}
          empty={noResourceResult}
          // Matches the `<NoResult minHeight>` inside `noResourceResult` so the
          // first-load spinner, the empty state and the eventual rows occupy
          // one stable block instead of jumping on entry.
          emptyMinHeight="calc(100vh - 300px)"
          pagination={{
            size: 'middle',
            showSizeChanger: true,
            pageSize: queryParams.perPage,
            current: queryParams.page,
            total: dataSource.total,
            hideOnSinglePage: queryParams.perPage === 10,
            onChange: handlePageChange
          }}
        ></SealTable>
        <DeleteModal ref={modalRef}></DeleteModal>
        <UpdateLabels
          open={updateLabelsData.open}
          onOk={handleUpdateLabelsOk}
          onCancel={handleCancelUpdateLabels}
          batch={batchLabelTargets.length > 0}
          count={batchLabelTargets.length}
          data={{
            name: updateLabelsData.data.name,
            labels: updateLabelsData.data.labels
          }}
        ></UpdateLabels>
        <WorkerDetailModal
          open={workerDetailStatus.open}
          currentData={workerDetailStatus.currentData}
          onClose={() =>
            setWorkerDetailStatus({ currentData: null, open: false })
          }
        />
        <WorkerSSHModal
          open={workerSSHStatus.open}
          currentData={workerSSHStatus.currentData}
          onClose={() => setWorkerSSHStatus({ currentData: null, open: false })}
        />
        <TopologyDrawer
          open={!!topologyTarget}
          clusterId={topologyTarget?.clusterId}
          clusterName={
            topologyTarget ? clusterData.data[topologyTarget.clusterId] : null
          }
          highlightWorkerId={topologyTarget?.workerId}
          onClose={() => {
            setTopologyTarget(null);
            // Values may have changed in the drawer; the list's own polling
            // is manual here.
            fetchData();
          }}
        />
        {MaintenanceModal}
        {AddWorkerModal}
      </PageBox>
    </>
  );
};

export default Workers;
