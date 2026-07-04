import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import PageBox from '@/pages/_components/page-box';
import {
  BaseSelect,
  DeleteModal,
  FilterBar,
  IconFont,
  NoResult,
  AntdResponsiveTable as Table,
  useFilterDrawer
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider } from 'antd';
import _ from 'lodash';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import {
  deleteModelInstance,
  MODEL_INSTANCE_API,
  queryModelsInstances
} from '../apis';
import ViewLogsModal from '../components/view-logs-modal';
import { useDeploymentsContext } from '../config/deploments-context';
import { ModelInstanceListItem as ListItem } from '../config/types';
import useFilterStatus from '../hooks/use-filter-status';
import useViewInstanceLogs from '../hooks/use-view-instance-logs';
import useQueryModelList from '../services/use-query-model-list';
import InstanceFilterForm from './filters';
import useInstanceColumns from './use-instance-columns';

const filterOptions = {
  optionList: [
    {
      label: 'Running',
      value: 'running',
      color: 'var(--ant-color-success)'
    },
    {
      label: 'Error',
      value: 'error',
      color: 'var(--ant-color-error)'
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
  const { dataList: modelList, fetchData: fetchModelList } =
    useQueryModelList();
  const { clusterList, workerList } = useDeploymentsContext();
  const { labelRender, optionRender, statusOptions } =
    useFilterStatus(filterOptions);
  const {
    filtersVisible,
    toggleFilters,
    filterRef,
    filterValues,
    filtersCount,
    handleOnFilterChange,
    handleOnClearFilters
  } = useFilterDrawer({
    onFilterChange: (filters) => {
      handleQueryChange({ page: 1, ...filters });
    },
    clearKeys: ['cluster_id', 'worker_id', 'state']
  });
  const { openViewLogsModal, openViewLogsModalStatus, closeViewLogsModal } =
    useViewInstanceLogs();

  useEffect(() => {
    fetchModelList({ page: -1 });
  }, []);

  const handleSelect = useMemoizedFn((val: any, row: ListItem) => {
    if (val === 'delete') {
      handleDelete(row, {
        okText: 'common.button.delrecreate'
      });
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
    modelList,
    workerList
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        minWidth: 0,
        maxWidth: '100%',
        padding: 24
      }}
    >
      <InstanceFilterForm
        ref={filterRef}
        open={filtersVisible}
        clusterList={clusterList}
        workerList={workerList}
        filterOptions={filterOptions}
        initialValues={filterValues}
        onValuesChange={handleOnFilterChange}
        onClose={toggleFilters}
        onClear={handleOnClearFilters}
      />
      <div style={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
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
            collapseInlineFilters
            filtersButtonProps={{
              show: true,
              count: filtersCount,
              onClick: toggleFilters,
              onClear: handleOnClearFilters
            }}
            inlineFilters={
              <>
                <BaseSelect
                  allowClear
                  showSearch={false}
                  placeholder={intl.formatMessage({
                    id: 'clusters.filterBy.cluster'
                  })}
                  style={{ width: 160 }}
                  size="large"
                  maxTagCount={1}
                  onChange={handleonClusterChange}
                  options={clusterList}
                />
                <BaseSelect
                  allowClear
                  showSearch={false}
                  placeholder={intl.formatMessage({
                    id: 'resources.filter.worker'
                  })}
                  style={{ width: 160 }}
                  size="large"
                  maxTagCount={1}
                  onChange={handleOnWorkerChange}
                  options={workerList.map((worker) => ({
                    label: worker.name,
                    value: worker.id
                  }))}
                />
                <BaseSelect
                  allowClear
                  showSearch={false}
                  placeholder={intl.formatMessage({
                    id: 'common.filter.status'
                  })}
                  style={{ width: 180 }}
                  size="large"
                  maxTagCount={1}
                  optionRender={optionRender}
                  labelRender={labelRender}
                  options={statusOptions}
                  onChange={handleStatusChange}
                />
              </>
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
              scroll={{ x: 'max-content' }}
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
    </div>
  );
});

export default InstanceView;
