import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { PageAction } from '@/config';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import { useIntl, useNavigate } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Table, message } from 'antd';
import _ from 'lodash';
import NoResult from '../_components/no-result';
import PageBox from '../_components/page-box';
import {
  createBenchmark,
  deleteBenchmark,
  queryBenchmarkList,
  updateBenchmark
} from './apis';
import AddBenchmarkModal from './components/add-benchmark-modal';
import DetailModal from './components/detail-modal';
import LeftActions from './components/left-actions';
import RightActions from './components/right-actions';
import { FormData, BenchmarkListItem as ListItem } from './config/types';
import useBenchmarkColumns from './hooks/use-benchmark-columns';
import useColumnSettings from './hooks/use-column-settings';
import useCreateBenchmark from './hooks/use-create-benchmark';
import useViewDetail from './hooks/use-view-detail';

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
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryBenchmarkList,
    deleteAPI: deleteBenchmark,
    contentForDelete: 'menu.models.benchmark'
  });
  const intl = useIntl();
  const navigate = useNavigate();
  const { openBenchmarkModal, closeBenchmarkModal, openBenchmarkModalStatus } =
    useCreateBenchmark();
  const {
    openViewDetailModal,
    closeViewDetailModal,
    openViewDetailModalStatus
  } = useViewDetail();
  const { SettingsButton, selectedColumns } = useColumnSettings();

  const handleAddBenchmark = () => {
    openBenchmarkModal(PageAction.CREATE, 'Add Benchmark');
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

  const handleEditUser = (row: ListItem) => {
    openBenchmarkModal(PageAction.EDIT, 'Edit Benchmark', row);
  };

  const handleSelect = useMemoizedFn((val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditUser(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    }
  });

  const handleOnCellClick = useMemoizedFn(
    (record: ListItem, dataIndex: string) => {
      if (dataIndex === 'name') {
        navigate(
          `/models/benchmark/detail?id=${record.id}&name=${record.name}`
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

  const columns = useBenchmarkColumns(
    sortOrder,
    handleSelect,
    handleOnCellClick
  );

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
              handleSearch={handleSearch}
              handleInputChange={handleNameChange}
            ></LeftActions>
          }
          right={
            <RightActions
              settingButton={SettingsButton}
              handleDeleteByBatch={handleDeleteBatch}
              handleClickPrimary={handleAddBenchmark}
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
        open={openBenchmarkModalStatus.open}
        action={openBenchmarkModalStatus.action}
        title={openBenchmarkModalStatus.title}
        currentData={openBenchmarkModalStatus.currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddBenchmarkModal>
      <DetailModal
        open={openViewDetailModalStatus.open}
        currentData={openViewDetailModalStatus.currentData}
        onClose={closeViewDetailModal}
      ></DetailModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default Benchmark;
