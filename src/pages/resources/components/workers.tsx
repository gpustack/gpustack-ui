import DeleteModal from '@/components/delete-modal';
import { FilterBar } from '@/components/page-tools';
import useTableFetch from '@/hooks/use-table-fetch';
import { queryClusterList } from '@/pages/cluster-management/apis';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Empty, Table, message } from 'antd';
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
    contentForDelete: 'worker',
    watch: true,
    API: WORKERS_API
  });

  const intl = useIntl();
  const [updateLabelsData, setUpdateLabelsData] = useState<{
    open: boolean;
    data: ListItem;
  }>({
    open: false,
    data: {} as ListItem
  });
  const [clusterData, setClusterData] = useState<{
    list: Global.BaseOption<number>[];
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

  const getClusterList = async () => {
    try {
      const params = {
        page: 1,
        perPage: 100
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
        value: item.id
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
      console.log('updateLabelsData.data', updateLabelsData.data);
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
    console.log('record', record);
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
      downloadWorkerPrivateKey(record.id);
    }
  });

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    if (
      !dataSource.loading &&
      dataSource.loadend &&
      !dataSource.dataList.length
    ) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}></Empty>;
    }
    return <div></div>;
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
  }, []);

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: 'Workers',
          style: {
            paddingInline: 'var(--layout-content-header-inlinepadding)'
          },
          breadcrumb: {}
        }}
        extra={[]}
      >
        <FilterBar
          showSelect={true}
          showPrimaryButton={false}
          selectHolder={intl.formatMessage({ id: 'clusters.filterBy.cluster' })}
          marginBottom={22}
          marginTop={30}
          buttonText={intl.formatMessage({ id: 'resources.button.create' })}
          handleDeleteByBatch={handleDeleteBatch}
          handleSearch={handleSearch}
          handleSelectChange={handleClusterChange}
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
      </PageContainer>
    </>
  );
};

export default Workers;
