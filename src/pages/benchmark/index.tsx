import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { PageAction } from '@/config';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import { useBenchmarkTargetInstance } from '@/pages/llmodels/hooks/use-run-benchmark';
import { useQueryModelList } from '@/pages/llmodels/services/use-query-model-list';
import { useIntl, useNavigate } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Table, message } from 'antd';
import _ from 'lodash';
import { useEffect } from 'react';
import NoResult from '../_components/no-result';
import PageBox from '../_components/page-box';
import { useQueryClusterList } from '../cluster-management/services/use-query-cluster-list';
import {
  BENCHMARKS_API,
  createBenchmark,
  deleteBenchmark,
  queryBenchmarkList,
  updateBenchmark
} from './apis';
import AddBenchmarkModal from './components/add-benchmark-modal';
import LeftActions from './components/left-actions';
import RightActions from './components/right-actions';
import ViewLogsModal from './components/view-logs-modal';
import { FormData, BenchmarkListItem as ListItem } from './config/types';
import useBenchmarkColumns from './hooks/use-benchmark-columns';
import useColumnSettings from './hooks/use-column-settings';
import useCreateBenchmark from './hooks/use-create-benchmark';
import useViewLogs from './hooks/use-view-logs';
import { useExportBenchmark } from './services/use-export-benchmark';
import useQueryDataset from './services/use-query-dataset';
import useQueryProfiles from './services/use-query-profiles';
import useStopBenchmark from './services/use-stop-benchmark';

const Benchmark: React.FC = () => {
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
    fetchAPI: queryBenchmarkList,
    deleteAPI: deleteBenchmark,
    API: BENCHMARKS_API,
    watch: true,
    contentForDelete: 'menu.models.benchmark'
  });
  const intl = useIntl();
  const navigate = useNavigate();
  const { openBenchmarkModal, closeBenchmarkModal, openBenchmarkModalStatus } =
    useCreateBenchmark();
  const { dataList: modelList, fetchData: fetchModelList } = useQueryModelList({
    getValue: (item: any) => item.name
  });
  const { openViewLogsModal, closeViewLogsModal, openViewLogsModalStatus } =
    useViewLogs();
  const { handleStopBenchmark } = useStopBenchmark();
  const { datasetList, fetchDatasetData } = useQueryDataset();
  const { exportData } = useExportBenchmark();
  const {
    fetchClusterList,
    cancelRequest: cancelClusterRequest,
    clusterList
  } = useQueryClusterList();
  const { benchmarkTargetInstance } = useBenchmarkTargetInstance();
  const {
    profilesOptions,
    fetchProfilesData,
    cancelRequest: cancelProfilesRequest
  } = useQueryProfiles();
  const { SettingsButton, columns: selectedColumns } = useColumnSettings({
    contentHeight: 320,
    clusterList,
    profileOptions: profilesOptions
  });

  useEffect(() => {
    fetchModelList({ page: -1 });
    fetchDatasetData();
    fetchProfilesData();
    fetchClusterList({ page: -1 }).then(() => {
      if (benchmarkTargetInstance.model_name) {
        openBenchmarkModal(
          PageAction.CREATE,
          intl.formatMessage({ id: 'benchmark.button.add' })
        );
      }
    });
    return () => {
      cancelClusterRequest();
      cancelProfilesRequest();
    };
  }, []);

  const handleAddBenchmark = () => {
    openBenchmarkModal(
      PageAction.CREATE,
      intl.formatMessage({ id: 'benchmark.button.add' })
    );
  };

  const handleModalOk = async (data: FormData) => {
    const params = {
      ...data
    };
    try {
      if (openBenchmarkModalStatus.action === PageAction.EDIT) {
        await updateBenchmark({
          data: {
            ...params
          },
          id: openBenchmarkModalStatus.currentData!.id
        });
      } else {
        await createBenchmark({ data: params });
      }
      fetchData();
      closeBenchmarkModal();
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      closeBenchmarkModal();
    }
  };

  const handleModalCancel = () => {
    closeBenchmarkModal();
  };

  const handleEdit = (row: ListItem) => {
    openBenchmarkModal(
      PageAction.EDIT,
      intl.formatMessage({ id: 'benchmark.button.edit' }),
      row
    );
  };

  const handleSelect = useMemoizedFn((val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEdit(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    } else if (val === 'viewlog') {
      openViewLogsModal(row);
    } else if (val === 'stop') {
      handleStopBenchmark(row.id);
    } else if (val === 'export') {
      exportData([row.id], row.name);
    }
  });

  const handleOnCellClick = useMemoizedFn(
    (record: ListItem, dataIndex: string) => {
      if (dataIndex === 'name') {
        navigate(
          `/models/benchmark/detail?id=${record.id}&name=${record.name}`,
          { state: 'benchmark-details' }
        );
      }
    }
  );

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={[]}
        image={<IconFont type="icon-credential-outline" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.benchmark.nofound'
        })}
        title={intl.formatMessage({ id: 'noresult.benchmark.title' })}
        subTitle={intl.formatMessage({
          id: 'noresult.benchmark.subTitle'
        })}
        onClick={handleAddBenchmark}
        buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
      ></NoResult>
    );
  };

  const columns = useBenchmarkColumns({
    sortOrder,
    columns: selectedColumns,
    handleSelect,
    onCellClick: handleOnCellClick
  });

  const handleExportData = () => {
    exportData(rowSelection.selectedRowKeys);
  };

  return (
    <>
      <PageBox>
        <FilterBar
          showSelect={false}
          marginBottom={22}
          marginTop={0}
          handleSearch={handleSearch}
          handleInputChange={handleNameChange}
          rowSelection={rowSelection}
          widths={{ input: 300 }}
          left={
            <LeftActions
              modelList={modelList}
              datasetList={datasetList}
              handleSearch={handleSearch}
              handleQueryChange={handleQueryChange}
              handleInputChange={handleNameChange}
            ></LeftActions>
          }
          right={
            <RightActions
              settingButton={SettingsButton}
              handleDeleteByBatch={handleDeleteBatch}
              handleClickPrimary={handleAddBenchmark}
              handleExport={handleExportData}
              buttonText={intl.formatMessage({
                id: 'benchmark.button.add'
              })}
              rowSelection={rowSelection}
            />
          }
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            tableLayout="fixed"
            columns={columns}
            dataSource={dataSource.dataList}
            rowSelection={rowSelection}
            loading={dataSource.loading}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            rowKey="id"
            scroll={{ x: 1260 }}
            onChange={handleTableChange}
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
      <AddBenchmarkModal
        clusterList={clusterList}
        open={openBenchmarkModalStatus.open}
        action={openBenchmarkModalStatus.action}
        title={openBenchmarkModalStatus.title}
        currentData={openBenchmarkModalStatus.currentData}
        profilesOptions={profilesOptions}
        datasetList={datasetList}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddBenchmarkModal>
      <ViewLogsModal
        open={openViewLogsModalStatus.open}
        url={openViewLogsModalStatus.url}
        tail={openViewLogsModalStatus.tail}
        onCancel={closeViewLogsModal}
      ></ViewLogsModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default Benchmark;
