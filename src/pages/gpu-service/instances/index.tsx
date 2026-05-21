import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrgNamespace } from '@/atoms/user';
import { PageAction } from '@/config';
import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import { ProviderValueMap } from '@/pages/cluster-management/config';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import {
  BaseSelect,
  DeleteModal,
  FilterBar,
  IconFont,
  NoResult
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Divider, Flex, message, Modal, Table } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageContainerInner } from '../../_components/page-box';
import {
  deleteGPUServiceInstance,
  GPU_SERVICE_INSTANCES_API,
  queryGPUServiceInstances
} from './apis';
import AddModal from './components/add-modal';
import ViewEventsModal from './components/view-events-modal';
import ViewLogsModal from './components/view-logs-modal';
import { FormData, ListItem } from './config/types';
import useInstancesColumns from './hooks/use-instances-columns';
import useViewEvents from './hooks/use-view-events';
import useViewLogs from './hooks/use-view-logs';
import useCreateInstance from './services/use-create-instance';
import useUpdateInstance from './services/use-update-instance';

const GPUService: React.FC = () => {
  const intl = useIntl();
  const [modal, modalContextHolder] = Modal.useModal();
  const [currentCluster, setCurrentCluster] = useAtom(currentClusterAtom);
  const clusterID = currentCluster?.id;
  // In admin "All" view there's no Org context, so the helper falls
  // back to the selected cluster's owner Org name.
  const namespace = getCurrentOrgNamespace(currentCluster?.owner_principal_id);

  const deleteInstance = useCallback(
    (id: number) => deleteGPUServiceInstance({ namespace, clusterID, id }),
    [namespace, clusterID]
  );

  const fetchInstances = useMemoizedFn(
    async (
      params: any,
      options?: any
    ): Promise<Global.PageResponse<ListItem>> => {
      const effectiveClusterID = params.cluster_id ?? clusterID;
      if (!effectiveClusterID) {
        return {
          items: [],
          pagination: {
            total: 0,
            totalPage: 0,
            page: 1,
            perPage: params.perPage || 10
          }
        } as Global.PageResponse<ListItem>;
      }
      const res = await queryGPUServiceInstances(
        { ...params, namespace, clusterID: effectiveClusterID },
        options
      );
      const total = res?.items?.length ?? 0;
      const perPage = params.perPage || 10;
      return {
        items: res?.items ?? [],
        pagination: {
          total,
          totalPage: Math.ceil(total / perPage),
          page: params.page || 1,
          perPage
        }
      };
    }
  );

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
    key: PaginationKey.Instances,
    fetchAPI: fetchInstances,
    deleteAPI: deleteInstance,
    watch: false,
    polling: true,
    API: GPU_SERVICE_INSTANCES_API({ namespace, clusterID }),
    contentForDelete: intl.formatMessage({ id: 'gpuservice.instance' })
  });

  const { fetchData: createInstance } = useCreateInstance();
  const { fetchData: updateInstance } = useUpdateInstance();
  const { openViewLogsModal, closeViewLogsModal, openViewLogsModalStatus } =
    useViewLogs();
  const {
    openViewEventsModal,
    closeViewEventsModal,
    openViewEventsModalStatus
  } = useViewEvents();
  const {
    fetchClusterList,
    cancelRequest: cancelClusterRequest,
    clusterList
  } = useQueryClusterList();

  const k8sClusterList = useMemo(
    () =>
      clusterList.filter(
        (item) => item.provider === ProviderValueMap.Kubernetes
      ),
    [clusterList]
  );

  const [openAddModalStatus, setOpenAddModalStatus] = useState<{
    action: PageActionType;
    open: boolean;
    title: string;
    currentData?: ListItem | null;
  }>({
    action: PageAction.CREATE,
    title: '',
    open: false,
    currentData: null
  });

  useEffect(() => {
    fetchClusterList({ page: -1 }).then((clusters) => {
      const k8sClusters = clusters.filter(
        (item: any) => item.provider === ProviderValueMap.Kubernetes
      );
      if (k8sClusters.length === 0) {
        return;
      }
      const storedCluster = k8sClusters.find(
        (item: any) => item.id === currentCluster?.id
      );
      const targetCluster = storedCluster ?? k8sClusters[0];
      if (!storedCluster) {
        setCurrentCluster({
          ...targetCluster,
          label: targetCluster.name,
          value: targetCluster.id
        });
      }
      handleQueryChange({
        cluster_id: targetCluster.id,
        page: 1
      });
    });
    return () => {
      cancelClusterRequest();
    };
  }, []);

  const handleAddInstance = () => {
    setOpenAddModalStatus({
      action: PageAction.CREATE,
      title: intl.formatMessage({ id: 'gpuservice.instance.add' }),
      open: true,
      currentData: null
    });
  };

  const handleEditInstance = (row: ListItem) => {
    setOpenAddModalStatus({
      action: PageAction.EDIT,
      title: intl.formatMessage({ id: 'gpuservice.instance.edit' }),
      open: true,
      currentData: row
    });
  };

  const closeModal = () => {
    setOpenAddModalStatus({
      action: PageAction.CREATE,
      title: '',
      open: false,
      currentData: null
    });
  };

  const handleModalOk = async (data: FormData) => {
    try {
      if (openAddModalStatus.action === PageAction.EDIT) {
        await updateInstance({
          id: openAddModalStatus.currentData!.id,
          data
        });
      } else {
        await createInstance({ data });
      }

      fetchData();
      closeModal();
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      message.error(intl.formatMessage({ id: 'common.message.fail' }));
    }
  };

  const handleRecreate = useMemoizedFn((row: ListItem) => {
    modalRef.current?.show({
      title: intl.formatMessage({
        id: 'gpuservice.instance.recreate.confirm.title'
      }),
      content: 'gpuservice.instance.recreate.confirm.content',
      okText: 'common.button.recreate',
      operation: 'gpuservice.instance.recreate.confirm.content',
      name: row.metadata?.name,
      onOk: async () => {
        try {
          await deleteInstance(row.metadata?.name as any);
          await new Promise((resolve) => {
            setTimeout(resolve, 500);
          });
          await createInstance({
            data: {
              metadata: { name: row.metadata.name, namespace },
              spec: row.spec
            } as FormData
          });
          message.success(intl.formatMessage({ id: 'common.message.success' }));
          handleSearch();
        } catch (error) {
          message.error(intl.formatMessage({ id: 'common.message.fail' }));
        }
      }
    });
  });

  const handleSelect = useMemoizedFn((val: string, row: ListItem) => {
    if (val === 'edit') {
      handleEditInstance(row);
    } else if (val === 'delete') {
      handleDelete({
        ...row,
        name: row.metadata?.name,
        id: row.metadata?.name as any
      });
    } else if (val === 'recreate') {
      handleRecreate(row);
    } else if (val === 'viewlog') {
      openViewLogsModal(row);
    } else if (val === 'viewevent') {
      openViewEventsModal(row);
    }
  });

  const handleClusterChange = (value: number) => {
    const cluster = k8sClusterList.find((item) => item.value === value);
    if (cluster) {
      setCurrentCluster(cluster);
    }
    handleQueryChange({
      cluster_id: value,
      page: 1
    });
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-cloud-outlined" />}
        filters={_.pick(queryParams, ['search', 'manufacturer'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.gpuservice.instance.nofound'
        })}
        title={intl.formatMessage({
          id: 'noresult.gpuservice.instance.title'
        })}
        subTitle={intl.formatMessage({
          id: 'noresult.gpuservice.instance.subTitle'
        })}
        onClick={handleAddInstance}
        buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
      />
    );
  };

  const columns = useInstancesColumns({
    handleSelect,
    sortOrder
  });

  return (
    <PageContainerInner
      leftContent={
        <Flex align="center">
          <span>{intl.formatMessage({ id: 'menu.gpuService.instances' })}</span>
          <Divider
            orientation="vertical"
            style={{
              marginLeft: 16
            }}
          />
          <BaseSelect
            variant="borderless"
            value={queryParams.cluster_id}
            options={k8sClusterList}
            onChange={handleClusterChange}
            style={{ minWidth: 120, fontWeight: 500 }}
          ></BaseSelect>
        </Flex>
      }
    >
      <FilterBar
        marginBottom={22}
        marginTop={30}
        showSelect={false}
        selectOptions={k8sClusterList}
        select={{ showSearch: true }}
        selectHolder={intl.formatMessage({
          id: 'gpuservice.instance.filter.cluster'
        })}
        buttonText={intl.formatMessage({ id: 'gpuservice.instance.add' })}
        handleSearch={handleSearch}
        handleSelectChange={handleClusterChange}
        handleDeleteByBatch={handleDeleteBatch}
        handleClickPrimary={handleAddInstance}
        handleInputChange={handleNameChange}
        rowSelection={rowSelection}
        widths={{ input: 300 }}
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
          rowKey={(record) => record.metadata.name}
          onChange={handleTableChange}
          pagination={false}
        />
      </ConfigProvider>
      <AddModal
        open={openAddModalStatus.open}
        action={openAddModalStatus.action}
        title={openAddModalStatus.title}
        data={openAddModalStatus.currentData}
        onCancel={closeModal}
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
        onCancel={closeViewEventsModal}
      />
      <DeleteModal ref={modalRef} />
      {modalContextHolder}
    </PageContainerInner>
  );
};

export default GPUService;
