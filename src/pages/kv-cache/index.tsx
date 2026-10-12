import { PageAction } from '@/config';
import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import { useSourceConfigVisible } from '@/pages/_components/source-config';
import useGranfanaLink from '@/pages/resources/hooks/use-grafana-link';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  DeleteModal,
  FilterBar,
  IconFont,
  NoResult,
  Table as SealTable,
  TableProvider,
  useExpandedRowKeys,
  type ChildGridOptions,
  type TableOrder
} from '@gpustack/core-ui';
import { useIntl, useNavigate } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Button, message, Space } from 'antd';
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
import ProviderSourceEntry from './components/provider-source-entry';
import ViewLogsModal from './components/view-logs-modal';
import { profileRamGib } from './config';
import { CacheServiceInstanceItem, FormData, ListItem } from './config/types';
import useCacheProviders from './hooks/use-cache-providers';
import useClusterWorkerNames from './hooks/use-cluster-worker-names';
import useRecreateInstance from './hooks/use-recreate-instance';
import useServiceColumns from './hooks/use-service-columns';
import useViewLogs from './hooks/use-view-logs';
import './style/index.less';

// Core Table renders child panels only for nonempty child data. A service
// marker also lets expand-all mount the panels, while InstanceRows owns the
// instance request, polling and first-load error state.
const loadServicePanel = async (service: ListItem) => [service];

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
  const showSourceEntry = useSourceConfigVisible();
  const { providers, getProvider } = useCacheProviders();
  const { clusterNameMap, workerNameMap, workerIpMap } =
    useClusterWorkerNames();
  const {
    openViewLogsModalStatus,
    openViewLogsModal,
    openInstanceLogsModal,
    closeViewLogsModal
  } = useViewLogs();
  const {
    expandedRowKeys,
    handleExpandChange,
    handleExpandAll,
    removeExpandedRowKey
  } = useExpandedRowKeys();
  // bumped after a recreate so expanded rows refetch their instances at once
  const [instancesRefreshKey, setInstancesRefreshKey] = useState(0);
  const { handleRecreateInstance } = useRecreateInstance({
    modalRef,
    onSuccess: () => {
      fetchData();
      setInstancesRefreshKey((key) => key + 1);
    }
  });
  const { goToGrafana } = useGranfanaLink({
    type: 'cache-service'
  });
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    action: PageActionType;
    currentData?: ListItem;
    title: string;
  }>({
    open: false,
    action: PageAction.CREATE,
    currentData: undefined,
    title: ''
  });

  // creation starts on the drawer's provider-catalog step, which fixes
  // the provider of the service form
  const handleAddService = () => {
    setOpenModalStatus({
      open: true,
      action: PageAction.CREATE,
      currentData: undefined,
      title: ''
    });
  };

  const closeServiceModal = () => {
    setOpenModalStatus({
      open: false,
      action: PageAction.CREATE,
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

  const renderEmpty = () => {
    return (
      <NoResult
        minHeight="calc(100vh - 300px)"
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-kvcache-outlined" />}
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

  const renderChildren = useMemoizedFn(
    (_panels: ListItem[], options: ChildGridOptions) => {
      const record = options.parent as ListItem;
      return (
        <InstanceRows
          service={record}
          capacityGib={profileRamGib(
            getProvider(record.provider_name)?.resource_profile,
            getProvider(record.provider_name)?.fields,
            record.config?.fields
          )}
          workerNameMap={workerNameMap}
          workerIpMap={workerIpMap}
          gridTemplate={options.gridTemplate}
          prefixWidth={options.prefixWidth}
          columns={options.columns}
          refreshKey={instancesRefreshKey}
          onRecreate={handleRecreateInstanceClick}
          onViewLogs={handleViewInstanceLogs}
        ></InstanceRows>
      );
    }
  );

  const handleToggleExpandAll = (expanded: boolean) => {
    const keys = dataSource.dataList.map((item) => item.id);
    if (expanded) {
      handleExpandAll(true, keys);
    } else {
      removeExpandedRowKey(keys);
    }
  };

  const handleOnSortChange = (order: TableOrder | TableOrder[]) => {
    handleTableChange({}, {}, order, { action: 'sort' });
  };

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
          widths={{ input: 300 }}
          rowSelection={rowSelection}
          handleInputChange={handleNameChange}
          handleSearch={handleSearch}
          right={
            <Space size={16}>
              {/* Gated here rather than inside the entry: a `Space` item that
                  renders nothing still takes its gap. */}
              {showSourceEntry && (
                <ProviderSourceEntry onSaved={fetchData}></ProviderSourceEntry>
              )}
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
        <div className="cache-services-table">
          <TableProvider value={{ allChildren: dataSource.dataList }}>
            <SealTable
              rowKey="id"
              emptyMinHeight="calc(100vh - 300px)"
              sortDirections={TABLE_SORT_DIRECTIONS}
              showSorterTooltip={false}
              dataSource={dataSource.dataList}
              loading={dataSource.loading}
              loadend={dataSource.loadend}
              rowSelection={rowSelection}
              expandable={true}
              expandedRowKeys={expandedRowKeys}
              onExpand={handleExpandChange}
              onExpandAll={handleToggleExpandAll}
              loadChildren={loadServicePanel}
              childParentKey="id"
              renderChildren={renderChildren}
              columns={columns}
              scroll={{ x: true }}
              onTableSort={handleOnSortChange}
              empty={renderEmpty()}
              pagination={{
                size: 'middle',
                showSizeChanger: true,
                pageSize: queryParams.perPage,
                current: queryParams.page,
                total: dataSource.total,
                hideOnSinglePage: queryParams.perPage === 10,
                onChange: handlePageChange
              }}
            ></SealTable>
          </TableProvider>
        </div>
      </PageBox>
      <AddService
        open={openModalStatus.open}
        action={openModalStatus.action}
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
