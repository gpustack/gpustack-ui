import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import PageBox from '@/pages/_components/page-box';
import { DeleteModal, FilterBar, IconFont, NoResult } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, message, Table } from 'antd';
import _ from 'lodash';
import { forwardRef, useImperativeHandle } from 'react';
import {
  deleteModelInstance,
  MODEL_INSTANCE_API,
  MODELS_API,
  queryModelDetail,
  queryModelsInstances,
  queryModelsList
} from '../apis';
import ViewLogsModal from '../components/view-logs-modal';
import { status as instanceStatus } from '../config';
import { useDeploymentsContext } from '../config/deploments-context';
import {
  ModelInstanceListItem as ListItem,
  ListItem as ModelListItem
} from '../config/types';
import { fetchCatalog } from '../hooks/use-query-pd-modes';
import useViewInstanceLogs from '../hooks/use-view-instance-logs';
import { instanceDeleteMessages } from '../utils/instance-recreation';
import LeftFilters from './left-filters';
import useInstanceColumns from './use-instance-columns';

const filterOptions = {
  optionList: [
    {
      label: 'Running',
      value: 'running',
      status: instanceStatus.running
    },
    {
      label: 'Error',
      value: 'error',
      status: instanceStatus.error
    },
    {
      label: 'Pending',
      value: 'pending',
      status: instanceStatus.pending
    },
    {
      label: 'Starting',
      value: 'starting',
      status: instanceStatus.starting
    }
  ]
};

const InstanceView = forwardRef((props, ref) => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    handleTableChange,
    cancelRequestsOnPageInactive,
    resumeRequestsOnPageActive,
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
    deleteAPI: async (id: number) => {
      try {
        return await deleteModelInstance(id);
      } catch (error: any) {
        if (!error?.response?.status) {
          message.error(
            error?.message || intl.formatMessage({ id: 'common.delete.fail' })
          );
        }
        throw error;
      }
    },
    watch: true,
    API: MODEL_INSTANCE_API,
    // The hook's default is `['UPDATE', 'DELETE']`, and on this list that
    // silently loses rows: an instance the scheduler has just created arrives
    // as a CREATE event, whose branch the default skips entirely, and the
    // UPDATE that follows it carries an id the list has never seen — which
    // `useUpdateChunkedList` only inserts when 'INSERT' is among the events
    // too. With neither, a new instance can reach the list by no path at all
    // and the table sits a row short of the API until the next full fetch.
    // Spelled out here rather than fixed in the default, which every other
    // list page shares.
    events: ['CREATE', 'UPDATE', 'DELETE', 'INSERT'],
    contentForDelete: 'menu.models.instances',
    // the models page routes pause/resume by which view tab is active
    pauseOnHidden: false
  });
  const intl = useIntl();
  const {
    dataSource: modelSource,
    cancelRequestsOnPageInactive: cancelModelRequests,
    resumeRequestsOnPageActive: resumeModelRequests
  } = useTableFetch<ModelListItem>({
    fetchAPI: queryModelsList,
    API: MODELS_API,
    watch: true,
    updateManually: true,
    events: ['CREATE', 'UPDATE', 'DELETE', 'INSERT'],
    defaultQueryParams: { page: -1 },
    pauseOnHidden: false
  });
  const { clusterList, workerList } = useDeploymentsContext();
  const { openViewLogsModal, openViewLogsModalStatus, closeViewLogsModal } =
    useViewInstanceLogs();

  const handleSelect = useMemoizedFn(async (val: any, row: ListItem) => {
    if (val === 'delete') {
      try {
        const model = await queryModelDetail(row.model_id);
        const modes = model.roles?.length ? await fetchCatalog() : [];
        const { okText, tip } = instanceDeleteMessages(
          model,
          modes.find((mode) => mode.name === model.disaggregation?.mode)
        );
        handleDelete(row, {
          okText,
          tips: tip ? intl.formatMessage({ id: tip }) : undefined
        });
      } catch (error: any) {
        // HTTP errors are reported globally; transport failures need local feedback.
        if (!error?.response?.status) {
          message.error(
            error?.message || intl.formatMessage({ id: 'common.delete.fail' })
          );
        }
        return;
      }
    }

    if (val === 'viewlog') {
      openViewLogsModal(row);
    }
  });

  useImperativeHandle(ref, () => ({
    resumeRequestsOnPageActive: () => {
      resumeRequestsOnPageActive();
      resumeModelRequests();
    },
    cancelRequestsOnPageInactive: () => {
      cancelRequestsOnPageInactive();
      cancelModelRequests();
    }
  }));

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        minHeight="calc(100vh - 300px)"
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
    modelList: modelSource.dataList,
    workerList
  });

  return (
    <div style={{ padding: 24 }}>
      <PageBox>
        <FilterBar
          showSelect={false}
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
              filterOptions={filterOptions}
            ></LeftFilters>
          }
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            rowKey="id"
            tableLayout="auto"
            className={'scroll-table'}
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
              size: 'middle',
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
    </div>
  );
});

export default InstanceView;
