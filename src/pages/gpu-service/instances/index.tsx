import { clusterSessionAtom } from '@/atoms/clusters';
import { PageAction } from '@/config';
import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import { ProviderValueMap } from '@/pages/cluster-management/config';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import { handleBatchRequest } from '@/utils';
import { PlusOutlined } from '@ant-design/icons';
import {
  DeleteModal,
  DropdownButtons,
  FilterBar,
  IconFont,
  NoResult
} from '@gpustack/core-ui';
import { useAccess, useIntl, useNavigate } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Button, ConfigProvider, message, Modal, Space, Table } from 'antd';
import { useSetAtom } from 'jotai';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import PageBox from '../../_components/page-box';
import { queryGPUServiceStorage } from '../storage/apis';
import {
  deleteGPUServiceInstance,
  GPU_SERVICE_INSTANCES_API,
  queryGPUServiceInstances,
  startGPUServiceInstance,
  stopGPUServiceInstance
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
  const navigate = useNavigate();
  const access = useAccess();
  const setClusterSession = useSetAtom(clusterSessionAtom);
  const [, modalContextHolder] = Modal.useModal();

  const handleAddK8sCluster = () => {
    setClusterSession({
      firstAddWorker: false,
      firstAddCluster: true,
      presetClusterType: 'gpu',
      providerHint: ProviderValueMap.Kubernetes
    });
    navigate('/resources/clusters/list');
  };

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
    contentForDelete: 'gpuservice.instance'
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
  const {
    fetchClusterList,
    cancelRequest,
    clusterList,
    loading: clusterLoading
  } = useQueryClusterList();

  // name → capacity for persistent volumes, so the Instance Type popover can
  // show the persistent disk size (the instance spec only references it by
  // name). Best-effort: falls back to the name if a PV can't be resolved.
  const [pvCapacityByName, setPvCapacityByName] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    fetchClusterList({ page: -1 });
    const fetchPVCapacities = async () => {
      try {
        const res = await queryGPUServiceStorage({ page: -1 } as any);
        const map: Record<string, string> = {};
        (res?.items || []).forEach((pv: any) => {
          if (pv?.name && pv?.spec?.capacity) {
            map[pv.name] = pv.spec.capacity;
          }
        });
        setPvCapacityByName(map);
      } catch {
        // best-effort; the popover falls back to the PV name
      }
    };
    fetchPVCapacities();
  }, []);

  const hasK8sCluster = useMemo(
    () => clusterList.some((c) => c.provider === ProviderValueMap.Kubernetes),
    [clusterList]
  );

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

  const handleStart = useMemoizedFn((row: ListItem) => {
    modalRef.current?.show({
      content: 'gpuservice.instance',
      title: 'common.title.start.confirm',
      okText: 'common.button.start',
      operation: 'common.start.single.confirm',
      name: row.name,
      async onOk() {
        await startGPUServiceInstance(row.id);
        rowSelection.removeSelectedKeys([row.id]);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        fetchData();
      }
    });
  });

  const handleStop = useMemoizedFn((row: ListItem) => {
    modalRef.current?.show({
      content: 'gpuservice.instance',
      title: 'common.title.stop.confirm',
      okText: 'common.button.stop',
      operation: 'common.stop.single.confirm',
      name: row.name,
      async onOk() {
        await stopGPUServiceInstance(row.id);
        rowSelection.removeSelectedKeys([row.id]);
        fetchData();
      }
    });
  });

  const handleStartBatch = useMemoizedFn(() => {
    modalRef.current?.show({
      content: 'gpuservice.instance',
      title: 'common.title.start.confirm',
      okText: 'common.button.start',
      operation: 'common.start.confirm',
      selection: true,
      async onOk() {
        const successIds: number[] = [];
        const res = await handleBatchRequest(
          rowSelection.selectedRowKeys,
          async (id: number) => {
            await startGPUServiceInstance(id);
            successIds.push(id);
          }
        );
        rowSelection.removeSelectedKeys(successIds);
        fetchData();
        return res;
      }
    });
  });

  const handleStopBatch = useMemoizedFn(() => {
    modalRef.current?.show({
      content: 'gpuservice.instance',
      title: 'common.title.stop.confirm',
      okText: 'common.button.stop',
      operation: 'common.stop.confirm',
      selection: true,
      async onOk() {
        const successIds: number[] = [];
        const res = await handleBatchRequest(
          rowSelection.selectedRowKeys,
          async (id: number) => {
            await stopGPUServiceInstance(id);
            successIds.push(id);
          }
        );
        rowSelection.removeSelectedKeys(successIds);
        fetchData();
        return res;
      }
    });
  });

  const handleSelect = useMemoizedFn((val: string, row: ListItem) => {
    if (val === 'view') {
      openViewInstanceModal(row);
    } else if (val === 'edit') {
      openEditInstanceModal(row);
    } else if (val === 'delete') {
      handleDelete({ ...row });
    } else if (val === 'recreate') {
      openRecreateInstanceModal(row);
    } else if (val === 'viewlog') {
      openViewLogsModal(row);
    } else if (val === 'viewevent') {
      openViewEventsModal(row);
    } else if (val === 'start') {
      handleStart(row);
    } else if (val === 'stop') {
      handleStop(row);
    }
  });

  const handleBatchActionSelect = useMemoizedFn((val: string) => {
    if (val === 'delete') {
      handleDeleteBatch();
    } else if (val === 'start') {
      handleStartBatch();
    } else if (val === 'stop') {
      handleStopBatch();
    }
  });

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    if (!clusterLoading && !hasK8sCluster) {
      return (
        <NoResult
          minHeight="calc(100vh - 300px)"
          loading={dataSource.loading || clusterLoading}
          loadend={dataSource.loadend}
          dataSource={[]}
          image={<IconFont type="icon-cloud-outlined" />}
          title={intl.formatMessage({
            id: 'noresult.gpuservice.instance.title'
          })}
          subTitle={intl.formatMessage({
            id: 'noresult.resources.k8sCluster'
          })}
          {...(access.canSeeOrgAdmin
            ? {
                buttonText: intl.formatMessage({
                  id: 'noresult.resources.addk8scluster'
                }),
                onClick: handleAddK8sCluster
              }
            : {})}
        />
      );
    }
    return (
      <NoResult
        minHeight="calc(100vh - 300px)"
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
    clusterList,
    sortOrder,
    pvCapacityByName
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
              {hasK8sCluster && (
                <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  onClick={openCreateInstanceModal}
                >
                  {intl.formatMessage({ id: 'gpuservice.instance.add' })}
                </Button>
              )}
              <DropdownButtons
                items={batchActionList}
                onSelect={handleBatchActionSelect}
                disabled={!rowSelection.selectedRowKeys.length}
                size="large"
                showText={true}
                extra={
                  rowSelection.selectedRowKeys.length > 0 && (
                    <span>({rowSelection.selectedRowKeys.length})</span>
                  )
                }
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
        clusterList={clusterList}
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
