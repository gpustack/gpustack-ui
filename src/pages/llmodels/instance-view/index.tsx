import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import NoResult from '@/pages/_components/no-result';
import PageBox from '@/pages/_components/page-box';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Table } from 'antd';
import _ from 'lodash';
import { forwardRef, useImperativeHandle } from 'react';
import {
  deleteModelInstance,
  MODEL_INSTANCE_API,
  queryModelsInstances
} from '../apis';
import ViewLogsModal from '../components/view-logs-modal';
import { useDeploymentsContext } from '../config/deploments-context';
import { ModelInstanceListItem as ListItem } from '../config/types';
import useViewInstanceLogs from '../hooks/use-view-instance-logs';
import LeftFilters from './left-filters';
import useInstanceColumns from './use-instance-columns';

const InstanceView = forwardRef((props, ref) => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    handleTableChange,
    cancelChunkRequest,
    createTableListChunkRequest,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handleQueryChange,
    handlePageChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    key: PaginationKey.Instances,
    fetchAPI: queryModelsInstances,
    deleteAPI: deleteModelInstance,
    watch: true,
    API: MODEL_INSTANCE_API,
    contentForDelete: 'menu.models.instances'
  });
  const intl = useIntl();
  const { clusterList, workerList } = useDeploymentsContext();
  const { openViewLogsModal, openViewLogsModalStatus, closeViewLogsModal } =
    useViewInstanceLogs();

  const handleSelect = useMemoizedFn((val: any, row: ListItem) => {
    if (val === 'delete') {
      handleDelete(row);
    }

    if (val === 'viewlog') {
      openViewLogsModal(row);
    }
  });

  const cancelRequestsOnPageInactive = useMemoizedFn(() => {
    cancelChunkRequest();
  });

  const resumeRequestsOnPageActive = useMemoizedFn(() => {
    fetchData({} as any, true);
    createTableListChunkRequest();
  });

  useImperativeHandle(ref, () => ({
    resumeRequestsOnPageActive,
    cancelRequestsOnPageInactive
  }));

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-instance-outline" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.instances.nofound'
        })}
        title={intl.formatMessage({ id: 'noresult.instances.title' })}
        subTitle={intl.formatMessage({
          id: 'noresult.instances.subTitle'
        })}
        buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
      ></NoResult>
    );
  };

  const handleonClusterChange = (value: number) => {
    handleQueryChange({
      page: 1,
      cluster_id: value
    });
  };

  const handleStatusChange = (value: string) => {
    handleQueryChange({
      page: 1,
      state: value
    });
  };

  const handleOnWorkerChange = (value: number) => {
    handleQueryChange({
      page: 1,
      worker_id: value
    });
  };

  const columns = useInstanceColumns({
    handleSelect,
    clusterList,
    workerList
  });

  return (
    <>
      <PageBox>
        <FilterBar
          showSelect={false}
          marginBottom={22}
          marginTop={30}
          widths={{ input: 300 }}
          rowSelection={rowSelection}
          handleInputChange={handleNameChange}
          handleSearch={handleSearch}
          handleDeleteByBatch={handleDeleteBatch}
          left={
            <LeftFilters
              handleNameChange={handleNameChange}
              handleClusterChange={handleonClusterChange}
              handleStatusChange={handleStatusChange}
              handleWorkerChange={handleOnWorkerChange}
              handleSearch={handleSearch}
              clusterList={clusterList}
              workerList={workerList}
            ></LeftFilters>
          }
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            rowKey="id"
            tableLayout="fixed"
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            dataSource={dataSource.dataList}
            loading={{
              spinning: dataSource.loading,
              size: 'middle'
            }}
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
      <ViewLogsModal
        status={openViewLogsModalStatus.currentData.status}
        url={openViewLogsModalStatus.currentData.url}
        tail={openViewLogsModalStatus.currentData.tail}
        id={openViewLogsModalStatus.currentData.id}
        modelId={openViewLogsModalStatus.currentData.modelId}
        open={openViewLogsModalStatus.open}
        onCancel={closeViewLogsModal}
      ></ViewLogsModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
});

export default InstanceView;
