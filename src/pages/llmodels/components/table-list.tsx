import { modelsExpandKeysAtom, modelsSessionAtom } from '@/atoms/models';
import DeleteModal from '@/components/delete-modal';
import DropDownActions from '@/components/drop-down-actions';
import DropdownButtons from '@/components/drop-down-buttons';
import { PageSize } from '@/components/logs-viewer/config';
import PageTools from '@/components/page-tools';
import BaseSelect from '@/components/seal-form/base/select';
import SealTable from '@/components/seal-table';
import { TableOrder } from '@/components/seal-table/types';
import { PageAction } from '@/config';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import { PageActionType } from '@/config/types';
import useBodyScroll from '@/hooks/use-body-scroll';
import useExpandedRowKeys from '@/hooks/use-expanded-row-keys';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useWatchList from '@/hooks/use-watch-list';
import PageBox from '@/pages/_components/page-box';
import useNoResourceResult from '@/pages/llmodels/hooks/use-no-resource-result';
import { MODEL_ROUTE_TARGETS } from '@/pages/model-routes/apis';
import { TargetStatusValueMap } from '@/pages/model-routes/config';
import useOpenPlayground from '@/pages/model-routes/hooks/use-open-playground';
import useGranfanaLink from '@/pages/resources/hooks/use-grafana-link';
import { handleBatchRequest } from '@/utils';
import { DownOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Button, Input, Space, message } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  MODELS_API,
  MODEL_INSTANCE_API,
  createModel,
  deleteModel,
  deleteModelInstance,
  queryModelInstancesList,
  updateModel
} from '../apis';
import {
  InstanceRealtimeLogStatus,
  modelCategories,
  modelSourceMap
} from '../config';
import {
  ButtonList,
  modalConfig,
  sourceOptions
} from '../config/button-actions';
import {
  FormData,
  ListItem,
  ModelInstanceListItem,
  SourceType
} from '../config/types';
import useEditDeployment from '../hooks/use-edit-deployment';
import useFilterStatus from '../hooks/use-filter-status';
import useFormInitialValues from '../hooks/use-form-initial-values';
import useModelsColumns from '../hooks/use-models-columns';
import DeployModal from './deploy-modal';
import Instances from './instances';
import UpdateModelModal from './update-modal';
import ViewLogsModal from './view-logs-modal';
interface ModelsProps {
  handleSearch: (params?: any) => void;
  handleNameChange: (e: any) => void;
  handleShowSizeChange?: (page: number, size: number) => void;
  handlePageChange: (page: number, pageSize: number | undefined) => void;
  handleClusterChange: (value: number) => void;
  handleDeleteSuccess: () => void;
  handleCategoryChange: (val: any) => void;
  onViewLogs: () => void;
  onCancelViewLogs: () => void;
  handleOnToggleExpandAll: () => void;
  onStop?: (ids: number[]) => void;
  onStart?: () => void;
  onTableSort?: (order: TableOrder | Array<TableOrder>) => void;
  onStatusChange: (value?: any) => void;
  onDeleteInstanceFromCache?: (instanceId: number) => void;
  onFilterChange?: (filters: any) => void;
  sortOrder: string[];
  queryParams: {
    page: number;
    perPage: number;
    query?: string;
    categories?: string[];
  };
  deleteIds?: number[];
  dataSource: ListItem[];
  loading: boolean;
  loadend: boolean;
  total: number;
}

const getFormattedData = (record: any, extraData = {}) => ({
  id: record.id,
  data: {
    ..._.omit(record, [
      'id',
      'ready_replicas',
      'created_at',
      'updated_at',
      'rowIndex'
    ]),
    ...extraData
  }
});

const Models: React.FC<ModelsProps> = ({
  handleNameChange,
  handleSearch,
  handlePageChange,
  handleDeleteSuccess,
  onViewLogs,
  onCancelViewLogs,
  handleCategoryChange,
  handleOnToggleExpandAll,
  handleClusterChange,
  onStop,
  onStart,
  onTableSort,
  onStatusChange,
  onDeleteInstanceFromCache,
  onFilterChange,
  sortOrder,
  deleteIds,
  dataSource,
  queryParams,
  loading,
  loadend,
  total
}) => {
  const {
    generateFormValues,
    clusterList,
    getClusterList,
    getWorkerList,
    workerList
  } = useFormInitialValues();
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page');
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const {
    openEditModalStatus,
    openEditModal,
    openDuplicateModal,
    closeEditModal
  } = useEditDeployment();
  const [expandAtom, setExpandAtom] = useAtom(modelsExpandKeysAtom);
  const [modelsSession, setModelsSession] = useAtom(modelsSessionAtom);
  const intl = useIntl();
  const navigate = useNavigate();
  const rowSelection = useTableRowSelection();
  const {
    handleExpandChange,
    handleExpandAll,
    updateExpandedRowKeys,
    removeExpandedRowKey,
    expandedRowKeys
  } = useExpandedRowKeys(expandAtom);
  const { handleOpenPlayGround } = useOpenPlayground();
  const { labelRender, optionRender, handleStatusChange, statusOptions } =
    useFilterStatus({
      onStatusChange: onStatusChange
    });
  const { watchDataList: targetList } = useWatchList(MODEL_ROUTE_TARGETS);

  const { goToGrafana, ActionButton } = useGranfanaLink({
    type: 'model'
  });

  const [openLogModal, setOpenLogModal] = useState(false);
  const [openDeployModal, setOpenDeployModal] = useState<{
    show: boolean;
    width: number | string;
    hasLinuxWorker?: boolean;
    source: SourceType;
    isGGUF?: boolean;
  }>({
    show: false,
    hasLinuxWorker: false,
    width: 600,
    isGGUF: false,
    source: modelSourceMap.huggingface_value as SourceType
  });
  const [currentInstance, setCurrentInstance] = useState<{
    url: string;
    status: string;
    id?: number | string;
    modelId?: number | string;
    tail?: number;
  }>({
    url: '',
    status: ''
  });
  const modalRef = useRef<any>(null);

  useEffect(() => {
    if (deleteIds?.length) {
      rowSelection.removeSelectedKey(deleteIds);
    }
  }, [deleteIds]);

  useEffect(() => {
    const getData = async () => {
      await Promise.all([getClusterList(), getWorkerList()]);
    };
    getData();
    return () => {
      setExpandAtom([]);
    };
  }, []);

  const handleOnSort = (order: TableOrder | Array<TableOrder>) => {
    onTableSort?.(order);
  };

  const handleOnCell = useMemoizedFn(async (record: any, extra: any) => {
    try {
      await updateModel(getFormattedData(record, { replicas: extra.newValue }));
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      if (extra.newValue > extra.oldValue) {
        updateExpandedRowKeys([record.id, ...expandedRowKeys]);
      }
    } catch (error) {
      // ignore
    }
  });

  const handleStartModel = async (row: ListItem) => {
    await updateModel(getFormattedData(row, { replicas: 1 }));
  };

  const handleStopModel = async (row: ListItem) => {
    await updateModel(getFormattedData(row, { replicas: 0 }));
    removeExpandedRowKey([row.id]);
  };

  const handleModalOk = async (data: FormData) => {
    const currentData = openEditModalStatus.currentData;
    try {
      if (currentData.realAction === PageAction.COPY) {
        const modelData = await createModel({
          data
        });

        if (data.replicas > 0) {
          updateExpandedRowKeys([modelData.id, ...expandedRowKeys]);
        }
      }
      if (currentData.realAction === PageAction.EDIT) {
        await updateModel({
          data,
          id: currentData.row.id as number
        });

        if (data.replicas > currentData.row.replicas) {
          updateExpandedRowKeys([currentData.row.id, ...expandedRowKeys]);
        }
      }
      closeEditModal();
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      setTimeout(() => {
        handleSearch();
      }, 150);
      restoreScrollHeight();
    } catch (error) {}
  };

  const handleModalCancel = useCallback(() => {
    closeEditModal();
    restoreScrollHeight();
  }, []);

  const handleDeployModalCancel = () => {
    setOpenDeployModal({
      ...openDeployModal,
      show: false
    });
  };

  const refreshListStatus = (modelData: ListItem) => {
    setTimeout(() => {
      updateExpandedRowKeys([modelData.id, ...expandedRowKeys]);
    }, 300);
    message.success(intl.formatMessage({ id: 'common.message.success' }));
    setTimeout(() => {
      handleSearch?.();
    }, 150);
  };

  const handleCreateModel = async (data: FormData) => {
    try {
      const modelData = await createModel({
        data
      });
      setOpenDeployModal({
        ...openDeployModal,
        show: false
      });
      refreshListStatus(modelData);
    } catch (error) {}
  };

  const handleLogModalCancel = useCallback(() => {
    setOpenLogModal(false);
    onCancelViewLogs();
    restoreScrollHeight();
  }, [onCancelViewLogs]);

  const handleDelete = async (row: any) => {
    modalRef.current?.show({
      content: 'models.table.models',
      operation: 'common.delete.single.confirm',
      name: row.name,
      async onOk() {
        await deleteModel(row.id);
        removeExpandedRowKey([row.id]);
        rowSelection.removeSelectedKey(row.id);
        handleDeleteSuccess();
        handleSearch();
      }
    });
  };

  const handleDeleteBatch = () => {
    modalRef.current?.show({
      content: 'models.table.models',
      operation: 'common.delete.confirm',
      selection: true,
      async onOk() {
        const successIds: any[] = [];
        const res = await handleBatchRequest(
          rowSelection.selectedRowKeys,
          async (id: any) => {
            await deleteModel(id);
            successIds.push(id);
          }
        );
        rowSelection.removeSelectedKeys(successIds);
        handleDeleteSuccess();
        handleSearch();
        return res;
      }
    });
  };

  const handleViewLogs = async (row: any) => {
    try {
      setCurrentInstance({
        url: `${MODEL_INSTANCE_API}/${row.id}/logs`,
        status: row.state,
        id: row.id,
        modelId: row.model_id,
        tail: InstanceRealtimeLogStatus.includes(row.state)
          ? undefined
          : PageSize - 1
      });
      setOpenLogModal(true);
      onViewLogs();
      saveScrollHeight();
    } catch (error) {
      console.log('error:', error);
    }
  };

  const handleDeleteInstace = (row: any) => {
    modalRef.current?.show({
      content: 'models.instances',
      okText: 'common.button.delrecreate',
      operation: 'common.delete.single.confirm',
      name: row.name,
      async onOk() {
        await deleteModelInstance(row.id);
        onDeleteInstanceFromCache?.(row.id);
      }
    });
  };

  const getModelInstances = useCallback(async (row: any, options?: any) => {
    try {
      const params = {
        id: row.id,
        page: -1
      };
      const data = await queryModelInstancesList(params, {
        token: options?.token
      });
      return data.items || [];
    } catch (error) {
      return [];
    }
  }, []);

  const generateChildrenRequestAPI = useCallback((params: any) => {
    return `${MODELS_API}/${params.id}/instances`;
  }, []);

  const handleEdit = async (row: ListItem, realAction: PageActionType) => {
    const initialValues = generateFormValues(row, []);
    if (realAction === PageAction.EDIT) {
      openEditModal(initialValues, row);
    } else if (realAction === PageAction.COPY) {
      openDuplicateModal(initialValues, row);
    }
    saveScrollHeight();
  };

  const handleSelect = useMemoizedFn(async (val: any, row: ListItem) => {
    try {
      if (val === 'edit') {
        handleEdit(row, PageAction.EDIT);
      }
      if (val === 'copy') {
        handleEdit(row, PageAction.COPY);
      }
      if (val === 'delete') {
        handleDelete(row);
      }
      if (val === 'start') {
        await handleStartModel(row);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        updateExpandedRowKeys([row.id, ...expandedRowKeys]);
        onStart?.();
      }

      if (val === 'stop') {
        modalRef.current?.show({
          content: 'models.instances',
          title: 'common.title.stop.confirm',
          okText: 'common.button.stop',
          operation: 'common.stop.single.confirm',
          name: row.name,
          async onOk() {
            await handleStopModel(row);
            onStop?.([row.id]);
          }
        });
      }
      if (val === 'chat') {
        const targetRoute = targetList.find(
          (target) =>
            target.model_id === row.id &&
            target.state === TargetStatusValueMap.Active
        );

        handleOpenPlayGround({
          categories: row.categories || [],
          name: targetRoute?.route_name || ''
        });
      }
      if (val === 'metrics') {
        goToGrafana(row);
      }
    } catch (error) {
      // ignore
    }
  });

  const handleChildSelect = useMemoizedFn(
    (val: any, row: ModelInstanceListItem) => {
      if (val === 'delete') {
        handleDeleteInstace(row);
      }
      if (val === 'viewlog') {
        handleViewLogs(row);
      }
    }
  );

  const renderChildren = useCallback(
    (list: any, options: { parent?: any; [key: string]: any }) => {
      return (
        <Instances
          list={list}
          currentExpanded={options.currentExpanded}
          modelData={options.parent}
          workerList={workerList}
          handleChildSelect={handleChildSelect}
        ></Instances>
      );
    },
    [workerList]
  );

  const handleClickDropdown = (item: any) => {
    if (item.key === 'catalog') {
      navigate('/models/catalog');
      return;
    }

    const config = modalConfig[item.key];
    const hasLinuxWorker = workerList.some(
      (worker) => _.toLower(worker.labels?.os) === 'linux'
    );

    if (config) {
      setOpenDeployModal({
        ...config,
        hasLinuxWorker: hasLinuxWorker
      });
    }
  };

  const handleStartBatch = async () => {
    modalRef.current?.show({
      content: 'models.table.models',
      title: 'common.title.start.confirm',
      okText: 'common.button.start',
      operation: 'common.start.confirm',
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRows, handleStartModel);
        onStart?.();
      }
    });
  };

  const handleStopBatch = async () => {
    modalRef.current?.show({
      content: 'models.table.models',
      title: 'common.title.stop.confirm',
      okText: 'common.button.stop',
      operation: 'common.stop.confirm',
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRows, handleStopModel);
        onStop?.(rowSelection.selectedRowKeys as number[]);
      }
    });
  };

  const handleActionSelect = (val: any) => {
    if (val === 'delete') {
      handleDeleteBatch();
    }
    if (val === 'start') {
      handleStartBatch();
    }
    if (val === 'stop') {
      handleStopBatch();
    }
  };

  const options = useMemo(() => {
    return {
      handleSelect,
      clusterList,
      sortOrder,
      targetList: targetList
    };
  }, [handleSelect, clusterList, sortOrder, targetList]);

  const columns = useModelsColumns(options);

  const handleToggleExpandAll = useMemoizedFn((expanded: boolean) => {
    const keys = dataSource.map((item) => item.id);
    handleExpandAll(expanded, keys);
    if (expanded) {
      handleOnToggleExpandAll();
    }
  });

  const { noResourceResult } = useNoResourceResult({
    loadend: loadend,
    loading: loading,
    dataSource: dataSource,
    queryParams: queryParams,
    iconType: 'icon-resources',
    title: intl.formatMessage({ id: 'noresult.deployments.title' }),
    noClusters: !clusterList.length,
    noWorkers: workerList.length === 0 && clusterList.length > 0,
    defaultContent: {
      subTitle: intl.formatMessage({ id: 'noresult.deployments.subTitle' }),
      noFoundText: intl.formatMessage({ id: 'noresult.mymodels.nofound' }),
      buttonText: intl.formatMessage({ id: 'models.table.button.deploy' }),
      onClick: () => handleClickDropdown({ key: 'catalog' })
    }
  });

  useEffect(() => {
    if (modelsSession.source && loadend) {
      handleClickDropdown({
        key: modelsSession.source
      });
    }
    return () => {
      setModelsSession({});
    };
  }, [loadend]);

  return (
    <>
      <PageBox>
        <PageTools
          marginBottom={22}
          marginTop={0}
          left={
            <Space>
              <Input
                prefix={
                  <SearchOutlined
                    style={{ color: 'var(--ant-color-text-placeholder)' }}
                  ></SearchOutlined>
                }
                placeholder={intl.formatMessage({ id: 'common.filter.name' })}
                style={{ width: 200 }}
                size="large"
                allowClear
                onChange={handleNameChange}
              ></Input>
              <BaseSelect
                allowClear
                showSearch={false}
                placeholder={intl.formatMessage({
                  id: 'models.filter.category'
                })}
                style={{ width: 160 }}
                size="large"
                maxTagCount={1}
                onChange={handleCategoryChange}
                options={modelCategories.filter((item) => item.value)}
              ></BaseSelect>
              <BaseSelect
                allowClear
                showSearch={false}
                placeholder={intl.formatMessage({
                  id: 'clusters.filterBy.cluster'
                })}
                style={{ width: 160 }}
                size="large"
                maxTagCount={1}
                onChange={handleClusterChange}
                options={clusterList}
              ></BaseSelect>
              <BaseSelect
                allowClear
                showSearch={false}
                placeholder={intl.formatMessage({ id: 'common.filter.status' })}
                style={{ width: 180 }}
                size="large"
                maxTagCount={1}
                optionRender={optionRender}
                labelRender={labelRender}
                options={statusOptions}
                onChange={handleStatusChange}
              ></BaseSelect>
              <Button
                type="text"
                style={{ color: 'var(--ant-color-text-tertiary)' }}
                onClick={handleSearch}
                icon={<SyncOutlined></SyncOutlined>}
              ></Button>
            </Space>
          }
          right={
            <Space size={16}>
              {ActionButton()}
              {page !== 'clusters' && (
                <DropDownActions
                  menu={{
                    items: sourceOptions,
                    onClick: handleClickDropdown
                  }}
                  placement="bottomRight"
                >
                  <Button
                    icon={<DownOutlined></DownOutlined>}
                    type="primary"
                    iconPlacement="end"
                  >
                    {intl?.formatMessage?.({ id: 'models.button.deploy' })}
                  </Button>
                </DropDownActions>
              )}
              <DropdownButtons
                items={ButtonList}
                extra={
                  rowSelection.selectedRowKeys.length > 0 && (
                    <span>({rowSelection.selectedRowKeys.length})</span>
                  )
                }
                size="large"
                showText={true}
                disabled={!rowSelection.selectedRowKeys.length}
                onSelect={handleActionSelect}
              />
            </Space>
          }
        ></PageTools>

        <SealTable
          columns={columns}
          sortDirections={TABLE_SORT_DIRECTIONS}
          dataSource={dataSource}
          rowSelection={rowSelection}
          expandedRowKeys={expandedRowKeys}
          showSorterTooltip={false}
          onExpand={handleExpandChange}
          onExpandAll={handleToggleExpandAll}
          loading={loading}
          loadend={loadend}
          rowKey="id"
          childParentKey="model_id"
          expandable={true}
          onTableSort={handleOnSort}
          onCell={handleOnCell}
          pollingChildren={false}
          watchChildren={true}
          loadChildren={getModelInstances}
          loadChildrenAPI={generateChildrenRequestAPI}
          renderChildren={renderChildren}
          empty={noResourceResult}
          pagination={{
            showSizeChanger: true,
            pageSize: queryParams.perPage,
            current: queryParams.page,
            total: total,
            hideOnSinglePage: queryParams.perPage === 10,
            onChange: handlePageChange
          }}
        ></SealTable>
      </PageBox>
      <UpdateModelModal
        open={openEditModalStatus.open}
        action={openEditModalStatus.action}
        title={openEditModalStatus.title}
        currentData={openEditModalStatus.currentData}
        clusterList={clusterList}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></UpdateModelModal>
      <DeployModal
        open={openDeployModal.show}
        action={PageAction.CREATE}
        title={intl.formatMessage({ id: 'models.button.deploy' })}
        source={openDeployModal.source}
        width={openDeployModal.width}
        isGGUF={openDeployModal.isGGUF}
        hasLinuxWorker={openDeployModal.hasLinuxWorker}
        clusterList={clusterList}
        onCancel={handleDeployModalCancel}
        onOk={handleCreateModel}
      ></DeployModal>
      <ViewLogsModal
        status={currentInstance.status}
        url={currentInstance.url}
        tail={currentInstance.tail}
        id={currentInstance.id}
        modelId={currentInstance.modelId}
        open={openLogModal}
        onCancel={handleLogModalCancel}
      ></ViewLogsModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default Models;
