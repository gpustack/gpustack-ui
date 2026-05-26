import { PageAction } from '@/config';
import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import { PlusOutlined } from '@ant-design/icons';
import {
  DeleteModal,
  DropdownButtons,
  FilterBar,
  IconFont,
  NoResult
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Button, ConfigProvider, message, Modal, Space, Table } from 'antd';
import _ from 'lodash';
import PageBox from '../../_components/page-box';
import {
  deleteGPUServiceInstance,
  GPU_SERVICE_INSTANCES_API,
  queryGPUServiceInstances
} from './apis';
import AddModal from './components/add-modal';
import ViewEventsModal from './components/view-events-modal';
import ViewLogsModal from './components/view-logs-modal';
import { batchActionList } from './config';
import { FormData, ListItem } from './config/types';
import useCreateInstance from './hooks/use-create-instance';
import useInstancesColumns from './hooks/use-instances-columns';
import useViewEvents from './hooks/use-view-events';
import useViewLogs from './hooks/use-view-logs';
import useCreateInstanceRequest from './services/use-create-instance';
import useUpdateInstance from './services/use-update-instance';

const GPUService: React.FC = () => {
  const intl = useIntl();
  const [, modalContextHolder] = Modal.useModal();

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
    key: PaginationKey.Instances,
    fetchAPI: queryGPUServiceInstances,
    deleteAPI: deleteGPUServiceInstance,
    watch: true,
    API: GPU_SERVICE_INSTANCES_API,
    contentForDelete: intl.formatMessage({ id: 'gpuservice.instance' })
  });

  const { fetchData: createInstance } = useCreateInstanceRequest();
  const { fetchData: updateInstance } = useUpdateInstance();
  const {
    openInstanceModalStatus,
    openCreateInstanceModal,
    openEditInstanceModal,
    openViewInstanceModal,
    openRecreateInstanceModal,
    closeInstanceModal
  } = useCreateInstance();
  const { openViewLogsModal, closeViewLogsModal, openViewLogsModalStatus } =
    useViewLogs();
  const {
    openViewEventsModal,
    closeViewEventsModal,
    openViewEventsModalStatus
  } = useViewEvents();

  const handleModalOk = async (data: FormData) => {
    try {
      if (openInstanceModalStatus.realAction === PageAction.CREATE) {
        await deleteGPUServiceInstance(openInstanceModalStatus.currentData!.id);
        await new Promise((resolve) => {
          setTimeout(resolve, 300);
        });
        await createInstance({ data });
      } else if (openInstanceModalStatus.action === PageAction.EDIT) {
        await updateInstance({
          id: openInstanceModalStatus.currentData!.id,
          data
        });
      } else {
        await createInstance({ data });
      }

      fetchData();
      closeInstanceModal();
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      // ignore
    }
  };

  const handleSelect = useMemoizedFn((val: string, row: ListItem) => {
    if (val === 'view') {
      openViewInstanceModal(row);
    } else if (val === 'edit') {
      openEditInstanceModal(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    } else if (val === 'recreate') {
      openRecreateInstanceModal(row);
    } else if (val === 'viewlog') {
      openViewLogsModal(row);
    } else if (val === 'viewevent') {
      openViewEventsModal(row);
    }
    // start / stop are disabled until backend endpoints exist
  });

  const handleBatchActionSelect = useMemoizedFn((val: string) => {
    if (val === 'delete') {
      handleDeleteBatch();
    }
    // start / stop are disabled until backend endpoints exist
  });

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-cloud-outlined" />}
        filters={_.pick(queryParams, ['search'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.gpuservice.instance.nofound'
        })}
        title={intl.formatMessage({
          id: 'noresult.gpuservice.instance.title'
        })}
        subTitle={intl.formatMessage({
          id: 'noresult.gpuservice.instance.subTitle'
        })}
        onClick={openCreateInstanceModal}
        buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
      />
    );
  };

  const columns = useInstancesColumns({
    handleSelect,
    sortOrder
  });

  return (
    <>
      <PageBox>
        <FilterBar
          marginBottom={22}
          marginTop={30}
          showSelect={false}
          handleSearch={handleSearch}
          handleInputChange={handleNameChange}
          rowSelection={rowSelection}
          widths={{ input: 300 }}
          right={
            <Space size={16}>
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={openCreateInstanceModal}
              >
                {intl.formatMessage({ id: 'gpuservice.instance.add' })}
              </Button>
              <DropdownButtons
                items={batchActionList}
                extra={
                  rowSelection.selectedRowKeys.length > 0 && (
                    <span>({rowSelection.selectedRowKeys.length})</span>
                  )
                }
                size="large"
                showText={true}
                disabled={!rowSelection.selectedRowKeys.length}
                onSelect={handleBatchActionSelect}
              />
            </Space>
          }
        />
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            dataSource={dataSource.dataList}
            rowSelection={rowSelection}
            loading={{
              spinning: dataSource.loading,
              size: 'middle'
            }}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            rowKey={(record) => record.id}
            onChange={handleTableChange}
            pagination={{
              showSizeChanger: true,
              pageSize: queryParams.perPage,
              current: queryParams.page,
              total: dataSource.total,
              hideOnSinglePage: queryParams.perPage === 10,
              onChange: handlePageChange
            }}
          />
        </ConfigProvider>
      </PageBox>
      <AddModal
        open={openInstanceModalStatus.open}
        action={openInstanceModalStatus.action}
        title={openInstanceModalStatus.title}
        data={openInstanceModalStatus.currentData}
        width={openInstanceModalStatus.width}
        realAction={openInstanceModalStatus.realAction}
        onCancel={closeInstanceModal}
        onOk={handleModalOk}
      />
      <ViewLogsModal
        open={openViewLogsModalStatus.open}
        url={openViewLogsModalStatus.url}
        tail={openViewLogsModalStatus.tail}
        onCancel={closeViewLogsModal}
      />
      <ViewEventsModal
        open={openViewEventsModalStatus.open}
        name={openViewEventsModalStatus.name}
        namespace={openViewEventsModalStatus.namespace}
        clusterID={openViewEventsModalStatus.clusterID}
        volumeName={openViewEventsModalStatus.volumeName}
        hasPersistentVolume={openViewEventsModalStatus.hasPersistentVolume}
        onCancel={closeViewEventsModal}
      />
      <DeleteModal ref={modalRef} />
      {modalContextHolder}
    </>
  );
};

export default GPUService;
