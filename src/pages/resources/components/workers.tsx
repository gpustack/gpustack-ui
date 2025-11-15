import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import useTableFetch from '@/hooks/use-table-fetch';
import PageBox from '@/pages/_components/page-box';
import { queryClusterList } from '@/pages/cluster-management/apis';
import { DockerStepsFromWorker } from '@/pages/cluster-management/components/add-worker/config';
import {
  ClusterStatusValueMap,
  ProviderValueMap
} from '@/pages/cluster-management/config';
import { ClusterListItem } from '@/pages/cluster-management/config/types';
import useAddWorker from '@/pages/cluster-management/hooks/use-add-worker';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Button, ConfigProvider, Table, message } from 'antd';
import React, { useEffect, useState } from 'react';
import NoResult from '../../_components/no-result';
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

const Workers: React.FC = () => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    extraStatus,
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
    API: WORKERS_API
  });
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
    data: Record<number, string>;
  }>({
    list: [],
    data: {}
  });
  const [workerDetailStatus, setWorkerDetailStatus] = useState<{
    open: boolean;
    currentData: ListItem | null;
  }>({
    open: false,
    currentData: null
  });
  const { handleAddWorker, AddWorkerModal, setStepList } = useAddWorker({
    clusterList: clusterData.list
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
        provider: item.provider
      }));
      setClusterData({
        list,
        data: clusterMap
      });
    } catch (error) {
      setClusterData({
        list: [],
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
  });

  const handleOnAddWorker = () => {
    let currentData = clusterData.list.find(
      (item) =>
        item.provider === ProviderValueMap.Docker &&
        item.state === ClusterStatusValueMap.Ready
    );
    if (!currentData) {
      currentData = clusterData.list[0];
    }
    handleAddWorker(currentData as ClusterListItem);
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-resources" />}
        filters={queryParams}
        noFoundText={intl.formatMessage({ id: 'noresult.workers.nofound' })}
        title={intl.formatMessage({ id: 'noresult.workers.title' })}
        subTitle={intl.formatMessage({ id: 'noresult.workers.subTitle' })}
      >
        <Button type="primary" onClick={handleOnAddWorker}>
          {intl.formatMessage({ id: 'noresult.workers.button.add' })}
        </Button>
      </NoResult>
    );
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
          showSelect={true}
          selectHolder={intl.formatMessage({ id: 'clusters.filterBy.cluster' })}
          marginBottom={22}
          marginTop={30}
          buttonText={intl.formatMessage({ id: 'resources.button.create' })}
          handleDeleteByBatch={handleDeleteBatch}
          handleSearch={handleSearch}
          handleSelectChange={handleClusterChange}
          handleClickPrimary={handleOnAddWorker}
          handleInputChange={handleNameChange}
          rowSelection={rowSelection}
          selectOptions={clusterData.list}
          width={{ input: 200 }}
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            tableLayout={dataSource.loadend ? 'auto' : 'fixed'}
            style={{ width: '100%' }}
            dataSource={dataSource.dataList}
            loading={dataSource.loading}
            rowKey="id"
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
