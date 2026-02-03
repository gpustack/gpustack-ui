import DeleteModal from '@/components/delete-modal';
import { FilterBar } from '@/components/page-tools';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import PageBox from '@/pages/_components/page-box';
import { queryClusterList } from '@/pages/cluster-management/apis';
import { DockerStepsFromWorker } from '@/pages/cluster-management/components/add-worker/config';
import { ClusterListItem } from '@/pages/cluster-management/config/types';
import useAddWorker from '@/pages/cluster-management/hooks/use-add-worker';
import useNoResourceResult from '@/pages/llmodels/hooks/use-no-resource-result';
import useGranfanaLink from '@/pages/resources/hooks/use-grafana-link';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Table, message } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  WORKERS_API,
  deleteWorker,
  downloadWorkerPrivateKey,
  queryWorkersList,
  updateWorker
} from '../apis';
import { ListItem } from '../config/types';
import useWorkerColumns from '../hooks/use-worker-columns';
import useWorkerMaintenance from '../hooks/use-worker-maintenance';
import UpdateLabels from './update-labels';
import WorkerDetailModal from './worker-detail-modal';

const Workers: React.FC<{
  clusterId?: string | number | null;
  showSelect?: boolean;
  showAddButton?: boolean;
  widths?: { input: number };
  sourceType?: string;
}> = ({
  clusterId,
  showSelect = true,
  showAddButton = true,
  widths = { input: 200 },
  sourceType = 'resources'
}) => {
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
    fetchAPI: queryWorkersList,
    deleteAPI: deleteWorker,
    contentForDelete: 'resources.worker',
    watch: true,
    API: WORKERS_API,
    updateManually: true,
    defaultQueryParams: {
      cluster_id: clusterId
    }
  });
  const { goToGrafana } = useGranfanaLink({ type: 'worker' });
  const { MaintenanceModal, handleStopMaintenance, setOpenStatus } =
    useWorkerMaintenance({ fetchData: handleSearch });

  const intl = useIntl();
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
  const { handleAddWorker, checkDefaultCluster, AddWorkerModal, setStepList } =
    useAddWorker({
      clusterList: clusterData.list,
      clusterLoading: clusterData.loading
    });

  const getClusterList = async () => {
    try {
      const params = {
        page: -1
      };
      const res = await queryClusterList(params);
      const clusterMap = res?.items?.reduce(
        (acc: Record<number, string>, item: any) => {
          acc[item.id] = item.name;
          return acc;
        },
        {}
      );
      const list = res?.items?.map((item: any) => ({
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
      await updateWorker(updateLabelsData.data.id, {
        ...updateLabelsData.data,
        labels: values.labels
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      fetchData();
      setUpdateLabelsData({ open: false, data: {} as ListItem });
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleCancelUpdateLabels = () => {
    setUpdateLabelsData({
      ...updateLabelsData,
      open: false
    });
  };

  const handleUpdateLabels = (record: ListItem) => {
    setUpdateLabelsData({
      open: true,
      data: {
        ...record
      }
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
    if (val === 'download_ssh_key') {
      downloadWorkerPrivateKey({
        id: record.id,
        name: record.name
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
  });

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

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return noResourceResult;
  };

  const handleClusterChange = (value: number) => {
    handleQueryChange({
      page: 1,
      cluster_id: value
    });
  };

  const columns = useWorkerColumns({
    clusterData,
    loadend: dataSource.loadend,
    firstLoad: extraStatus.firstLoad,
    sortOrder,
    handleSelect,
    sourceType
  });

  useEffect(() => {
    getClusterList();
    setStepList(DockerStepsFromWorker);
  }, []);

  return (
    <>
      <PageBox>
        <FilterBar
          showSelect={showSelect}
          selectHolder={intl.formatMessage({ id: 'clusters.filterBy.cluster' })}
          marginBottom={22}
          marginTop={30}
          buttonText={intl.formatMessage({ id: 'resources.button.create' })}
          handleDeleteByBatch={handleDeleteBatch}
          handleSearch={handleSearch}
          handleSelectChange={handleClusterChange}
          handleClickPrimary={showAddButton ? handleOnAddWorker : undefined}
          handleInputChange={handleNameChange}
          rowSelection={rowSelection}
          selectOptions={clusterData.list}
          widths={widths}
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            tableLayout={'auto'}
            dataSource={dataSource.dataList}
            loading={dataSource.loading}
            rowKey="id"
            scroll={{ x: 900 }}
            onChange={handleTableChange}
            rowSelection={rowSelection}
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
        <DeleteModal ref={modalRef}></DeleteModal>
        <UpdateLabels
          open={updateLabelsData.open}
          onOk={handleUpdateLabelsOk}
          onCancel={handleCancelUpdateLabels}
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
        {MaintenanceModal}
        {AddWorkerModal}
      </PageBox>
    </>
  );
};

export default Workers;
