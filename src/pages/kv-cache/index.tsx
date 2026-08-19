import { PageAction } from '@/config';
import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import useGranfanaLink from '@/pages/resources/hooks/use-grafana-link';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  DeleteModal,
  FilterBar,
  IconFont,
  NoResult,
  useExpandedRowKeys
} from '@gpustack/core-ui';
import { useIntl, useNavigate } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Button, ConfigProvider, message, Space, Table } from 'antd';
import _ from 'lodash';
import { useState } from 'react';
import PageBox from '../_components/page-box';
import {
  CACHE_SERVICES_API,
  createCacheService,
  deleteCacheService,
  queryCacheServices,
  updateCacheService
} from './apis';
import AddService from './components/add-service-modal';
import InstanceRows from './components/instance-rows';
import ViewLogsModal from './components/view-logs-modal';
import { ServiceModeValueMap } from './config';
import {
  CacheServiceInstanceItem,
  FormData,
  ListItem,
  ServiceMode
} from './config/types';
import useCacheProviders from './hooks/use-cache-providers';
import useClusterWorkerNames from './hooks/use-cluster-worker-names';
import useRecreateInstance from './hooks/use-recreate-instance';
import useServiceColumns from './hooks/use-service-columns';
import useViewLogs from './hooks/use-view-logs';
import './style/index.less';

const KVCache: React.FC = () => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    handleTableChange,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handlePageChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    key: PaginationKey.CacheServices,
    fetchAPI: queryCacheServices,
    deleteAPI: deleteCacheService,
    watch: false,
    polling: true,
    API: CACHE_SERVICES_API,
    contentForDelete: 'kvCache.title'
  });
  const intl = useIntl();
  const navigate = useNavigate();
  const { providers, getProvider } = useCacheProviders();
  const { clusterNameMap, workerNameMap, workerIpMap } =
    useClusterWorkerNames();
  const {
    openViewLogsModalStatus,
    openViewLogsModal,
    openInstanceLogsModal,
    closeViewLogsModal
  } = useViewLogs();
  const { expandedRowKeys, handleExpandChange } = useExpandedRowKeys();
  // bumped after a recreate so expanded rows refetch their instances at once
  const [instancesRefreshKey, setInstancesRefreshKey] = useState(0);
  const { handleRecreateInstance } = useRecreateInstance({
    modalRef,
    onSuccess: () => {
      fetchData();
      setInstancesRefreshKey((key) => key + 1);
    }
  });
  const { goToGrafana, ActionButton } = useGranfanaLink({
    type: 'cache-service'
  });
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    action: PageActionType;
    mode: ServiceMode;
    currentData?: ListItem;
    title: string;
  }>({
    open: false,
    action: PageAction.CREATE,
    mode: ServiceModeValueMap.Managed as ServiceMode,
    currentData: undefined,
    title: ''
  });

  // creation starts on the drawer's provider-catalog step, which fixes
  // both the provider and the mode of the service form
  const handleAddService = () => {
    setOpenModalStatus({
      open: true,
      action: PageAction.CREATE,
      mode: ServiceModeValueMap.Managed as ServiceMode,
      currentData: undefined,
      title: ''
    });
  };

  const closeServiceModal = () => {
    setOpenModalStatus({
      open: false,
      action: PageAction.CREATE,
      mode: ServiceModeValueMap.Managed as ServiceMode,
      currentData: undefined,
      title: ''
    });
  };

  const handleModalOk = async (data: FormData) => {
    try {
      if (openModalStatus.action === PageAction.EDIT) {
        await updateCacheService(openModalStatus.currentData!.id, {
          data
        });
      } else {
        await createCacheService({
          data
        });
      }
      fetchData();
      closeServiceModal();
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {}
  };

  const handleEditService = (row: ListItem) => {
    setOpenModalStatus({
      open: true,
      action: PageAction.EDIT,
      mode: row.mode,
      currentData: row,
      title: intl.formatMessage(
        { id: 'kvCache.edit.title' },
        { name: row.name }
      )
    });
  };

  const handleSelect = useMemoizedFn((val: string, row: ListItem) => {
    if (val === 'edit') {
      handleEditService(row);
    } else if (val === 'viewlogs') {
      openViewLogsModal(row);
    } else if (val === 'metrics') {
      goToGrafana(row);
    } else if (val === 'delete') {
      handleDelete(row);
    }
  });

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        minHeight="calc(100vh - 300px)"
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-storage-outlined" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.kvCache.nofound'
        })}
        title={intl.formatMessage({ id: 'noresult.kvCache.title' })}
        subTitle={intl.formatMessage({
          id: 'noresult.kvCache.subTitle'
        })}
        onClick={handleAddService}
        buttonText={intl.formatMessage({ id: 'kvCache.button.add' })}
      ></NoResult>
    );
  };

  const handleOnCellClick = useMemoizedFn((record: ListItem) => {
    navigate(`/models/kv-cache/detail?id=${record.id}&name=${record.name}`);
  });

  const getInstanceWorkerName = (instance: CacheServiceInstanceItem) =>
    workerNameMap[instance.worker_id] || `#${instance.worker_id}`;

  const handleRecreateInstanceClick = useMemoizedFn(
    (service: ListItem, instance: CacheServiceInstanceItem) => {
      handleRecreateInstance(
        service,
        instance,
        getInstanceWorkerName(instance)
      );
    }
  );

  const handleViewInstanceLogs = useMemoizedFn(
    (service: ListItem, instance: CacheServiceInstanceItem) => {
      openInstanceLogsModal(service, instance);
    }
  );

  const renderExpandedRow = useMemoizedFn((record: ListItem) => (
    <InstanceRows
      service={record}
      workerNameMap={workerNameMap}
      workerIpMap={workerIpMap}
      refreshKey={instancesRefreshKey}
      onRecreate={handleRecreateInstanceClick}
      onViewLogs={handleViewInstanceLogs}
    ></InstanceRows>
  ));

  const columns = useServiceColumns(handleSelect, {
    getProvider,
    clusterNameMap,
    onCellClick: handleOnCellClick
  });

  return (
    <>
      <PageBox>
        <FilterBar
          showSelect={false}
          marginBottom={22}
          widths={{ input: 300 }}
          rowSelection={rowSelection}
          handleInputChange={handleNameChange}
          handleSearch={handleSearch}
          right={
            <Space size={16}>
              {ActionButton()}
              <Button
                icon={<PlusOutlined></PlusOutlined>}
                type="primary"
                onClick={handleAddService}
              >
                {intl.formatMessage({ id: 'kvCache.button.add' })}
              </Button>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={handleDeleteBatch}
                disabled={!rowSelection?.selectedRowKeys?.length}
              >
                <span>
                  {intl.formatMessage({ id: 'common.button.delete' })}
                  {rowSelection?.selectedRowKeys?.length > 0 && (
                    <span>({rowSelection?.selectedRowKeys?.length})</span>
                  )}
                </span>
              </Button>
            </Space>
          }
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            className={'scroll-table cache-services-table'}
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
            expandable={{
              expandedRowKeys,
              // only managed services run instances
              rowExpandable: (record: ListItem) =>
                record.mode === ServiceModeValueMap.Managed,
              expandedRowRender: renderExpandedRow,
              onExpand: (expanded: boolean, record: ListItem) =>
                handleExpandChange(expanded, record, record.id),
              expandIcon: ({ expanded, onExpand, record, expandable }) =>
                expandable ? (
                  <Button
                    type="text"
                    size="small"
                    onClick={(e) => onExpand(record, e)}
                  >
                    <IconFont
                      type="icon-down"
                      rotate={expanded ? 0 : -90}
                      style={{ fontSize: 12 }}
                    ></IconFont>
                  </Button>
                ) : null
            }}
            columns={columns}
            scroll={{ x: 1100 }}
            onChange={handleTableChange}
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
      <AddService
        open={openModalStatus.open}
        action={openModalStatus.action}
        mode={openModalStatus.mode}
        providers={providers}
        title={openModalStatus.title}
        currentData={openModalStatus.currentData}
        onCancel={closeServiceModal}
        onOk={handleModalOk}
      ></AddService>
      <ViewLogsModal
        open={openViewLogsModalStatus.open}
        url={openViewLogsModalStatus.url}
        title={openViewLogsModalStatus.name}
        tail={openViewLogsModalStatus.tail}
        onCancel={closeViewLogsModal}
      ></ViewLogsModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default KVCache;
