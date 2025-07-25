import { modelsExpandKeysAtom } from '@/atoms/models';
import AutoTooltip from '@/components/auto-tooltip';
import DeleteModal from '@/components/delete-modal';
import DropDownActions from '@/components/drop-down-actions';
import DropdownButtons from '@/components/drop-down-buttons';
import { PageSize } from '@/components/logs-viewer/config';
import PageTools from '@/components/page-tools';
import SealTable from '@/components/seal-table';
import { SealColumnProps } from '@/components/seal-table/types';
import { PageAction } from '@/config';
import useBodyScroll from '@/hooks/use-body-scroll';
import useExpandedRowKeys from '@/hooks/use-expanded-row-keys';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { handleBatchRequest } from '@/utils';
import {
  IS_FIRST_LOGIN,
  readState,
  writeState
} from '@/utils/localstore/index';
import {
  DownOutlined,
  QuestionCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useNavigate } from '@umijs/max';
import {
  Button,
  Empty,
  Input,
  Select,
  Space,
  Tooltip,
  Typography,
  message
} from 'antd';
import dayjs from 'dayjs';
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
  backendOptionsMap,
  modelCategories,
  modelCategoriesMap,
  modelSourceMap
} from '../config';
import {
  ButtonList,
  categoryToPathMap,
  generateSource,
  modalConfig,
  setModelActionList,
  sourceOptions
} from '../config/button-actions';
import {
  FormData,
  ListItem,
  ModelInstanceListItem,
  SourceType
} from '../config/types';
import { useGenerateFormEditInitialValues } from '../hooks';
import APIAccessInfoModal from './api-access-info';
import DeployModal from './deploy-modal';
import Instances from './instances';
import ModelTag from './model-tag';
import UpdateModel from './update-modal';
import ViewLogsModal from './view-logs-modal';
interface ModelsProps {
  handleSearch: (params?: any) => void;
  handleNameChange: (e: any) => void;
  handleShowSizeChange?: (page: number, size: number) => void;
  handlePageChange: (page: number, pageSize: number | undefined) => void;
  handleDeleteSuccess: () => void;
  handleCategoryChange: (val: any) => void;
  onViewLogs: () => void;
  onCancelViewLogs: () => void;
  handleOnToggleExpandAll: () => void;
  onStop?: (ids: number[]) => void;
  onStart?: () => void;
  queryParams: {
    page: number;
    perPage: number;
    query?: string;
    categories?: string[];
  };
  deleteIds?: number[];
  workerList: WorkerListItem[];
  modelFileOptions: any[];
  catalogList?: any[];
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
  onStop,
  onStart,
  modelFileOptions,
  deleteIds,
  dataSource,
  workerList,
  catalogList,
  queryParams,
  loading,
  loadend,
  total
}) => {
  const { getGPUList, generateFormValues, gpuDeviceList } =
    useGenerateFormEditInitialValues();
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const [updateFormInitials, setUpdateFormInitials] = useState<{
    gpuOptions: any[];
    modelFileOptions?: any[];
    data: any;
    isGGUF: boolean;
  }>({
    gpuOptions: [],
    modelFileOptions: [],
    data: {},
    isGGUF: false
  });
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandAtom, setExpandAtom] = useAtom(modelsExpandKeysAtom);
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
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });

  const [apiAccessInfo, setAPIAccessInfo] = useState<any>({
    show: false,
    data: {}
  });
  const [openLogModal, setOpenLogModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openDeployModal, setOpenDeployModal] = useState<{
    show: boolean;
    width: number | string;
    hasLinuxWorker?: boolean;
    source: SourceType;
    gpuOptions: any[];
    isGGUF?: boolean;
    modelFileOptions?: any[];
  }>({
    show: false,
    hasLinuxWorker: false,
    width: 600,
    isGGUF: false,
    source: modelSourceMap.huggingface_value as SourceType,
    gpuOptions: [],
    modelFileOptions: []
  });
  const currentData = useRef<ListItem>({} as ListItem);
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
    if (!catalogList?.length) {
      return;
    }
    const getFirstLoginState = async () => {
      const is_first_login = await readState(IS_FIRST_LOGIN);
      setIsFirstLogin(is_first_login);
    };
    getFirstLoginState();
  }, [catalogList?.length]);

  useEffect(() => {
    if (deleteIds?.length) {
      rowSelection.removeSelectedKey(deleteIds);
    }
  }, [deleteIds]);

  useEffect(() => {
    const getData = async () => {
      await getGPUList();
    };
    getData();
    return () => {
      setExpandAtom([]);
    };
  }, []);

  const setCurrentData = (data: ListItem) => {
    currentData.current = data;
  };

  const handleOnSort = (dataIndex: string, order: any) => {
    setSortOrder(order);
  };

  const handleOnCell = useCallback(async (record: any) => {
    try {
      await updateModel(getFormattedData(record));
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      // ignore
    }
  }, []);

  const handleStartModel = async (row: ListItem) => {
    await updateModel(getFormattedData(row, { replicas: 1 }));
  };

  const handleStopModel = async (row: ListItem) => {
    await updateModel(getFormattedData(row, { replicas: 0 }));
    removeExpandedRowKey([row.id]);
  };

  const handleModalOk = useCallback(
    async (data: FormData) => {
      try {
        await updateModel({
          data,
          id: currentData.current?.id as number
        });
        setOpenAddModal(false);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        setTimeout(() => {
          handleSearch();
        }, 150);
        restoreScrollHeight();
      } catch (error) {}
    },
    [handleSearch]
  );

  const handleModalCancel = useCallback(() => {
    setOpenAddModal(false);
    restoreScrollHeight();
  }, []);

  const handleDeployModalCancel = () => {
    setOpenDeployModal({
      ...openDeployModal,
      show: false
    });
  };

  const handleCreateModel = useCallback(
    async (data: FormData) => {
      try {
        console.log('data:', data, openDeployModal);

        const modelData = await createModel({
          data
        });
        setOpenDeployModal({
          ...openDeployModal,
          show: false
        });
        setTimeout(() => {
          updateExpandedRowKeys([modelData.id, ...expandedRowKeys]);
        }, 300);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        setTimeout(() => {
          handleSearch?.();
        }, 150);
      } catch (error) {}
    },
    [openDeployModal]
  );

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

  const handleOpenPlayGround = (row: any) => {
    for (const [category, path] of Object.entries(categoryToPathMap)) {
      if (
        row.categories?.includes(category) &&
        [
          modelCategoriesMap.text_to_speech,
          modelCategoriesMap.speech_to_text
        ].includes(category)
      ) {
        navigate(`${path}&model=${row.name}`);
        return;
      }
      if (row.categories?.includes(category)) {
        navigate(`${path}?model=${row.name}`);
        return;
      }
    }
    navigate(`/playground/chat?model=${row.name}`);
  };

  const handleViewLogs = useCallback(
    async (row: any) => {
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
    },
    [onViewLogs]
  );
  const handleDeleteInstace = useCallback(
    (row: any) => {
      modalRef.current?.show({
        content: 'models.instances',
        okText: 'common.button.delrecreate',
        operation: 'common.delete.single.confirm',
        name: row.name,
        async onOk() {
          await deleteModelInstance(row.id);
        }
      });
    },
    [deleteModelInstance]
  );

  const getModelInstances = useCallback(async (row: any, options?: any) => {
    try {
      const params = {
        id: row.id,
        page: 1,
        perPage: 100
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

  const handleEdit = async (row: ListItem) => {
    const initialValues = generateFormValues(row, gpuDeviceList.current);
    setUpdateFormInitials({
      gpuOptions: gpuDeviceList.current,
      modelFileOptions: modelFileOptions,
      data: initialValues,
      isGGUF: row.backend === backendOptionsMap.llamaBox
    });
    setCurrentData(row);
    setOpenAddModal(true);
    saveScrollHeight();
  };

  const handleViewAPIInfo = useCallback((row: ListItem) => {
    setAPIAccessInfo({
      show: true,
      data: {
        id: row.id,
        name: row.name,
        categories: row.categories,
        url: `${MODELS_API}/${row.id}/instances`
      }
    });
  }, []);
  const handleSelect = useCallback(
    async (val: any, row: ListItem) => {
      try {
        if (val === 'edit') {
          handleEdit(row);
        }
        if (val === 'chat') {
          handleOpenPlayGround(row);
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

        if (val === 'api') {
          handleViewAPIInfo(row);
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
      } catch (error) {
        // ignore
      }
    },
    [
      handleEdit,
      handleOpenPlayGround,
      handleDelete,
      onStop,
      onStart,
      expandedRowKeys
    ]
  );

  const handleChildSelect = useCallback(
    (val: any, row: ModelInstanceListItem) => {
      if (val === 'delete') {
        handleDeleteInstace(row);
      }
      if (val === 'viewlog') {
        handleViewLogs(row);
      }
    },
    [handleViewLogs, handleDeleteInstace]
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
        hasLinuxWorker: hasLinuxWorker,
        gpuOptions: gpuDeviceList.current,
        modelFileOptions: modelFileOptions
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

  const columns: SealColumnProps[] = useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        key: 'name',
        width: 400,
        span: 5,
        render: (text: string, record: ListItem) => (
          <span className="flex-center" style={{ maxWidth: '100%' }}>
            <AutoTooltip ghost>
              <span className="m-r-5">{text}</span>
            </AutoTooltip>
            <ModelTag categoryKey={record.categories?.[0] || ''} />
          </span>
        )
      },
      {
        title: 'Cluster',
        dataIndex: 'cluster',
        key: 'cluster',
        span: 4,
        render: (text: string, record: ListItem) => (
          <span className="flex flex-column" style={{ width: '100%' }}>
            Custom
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'models.form.source' }),
        dataIndex: 'source',
        key: 'source',
        span: 4,
        render: (text: string, record: ListItem) => (
          <span className="flex flex-column" style={{ width: '100%' }}>
            <AutoTooltip ghost>{generateSource(record)}</AutoTooltip>
          </span>
        )
      },
      {
        title: (
          <Tooltip
            title={intl.formatMessage(
              { id: 'models.form.replicas.tips' },
              { api: `${window.location.origin}/v1` }
            )}
          >
            <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
              {intl.formatMessage({ id: 'models.form.replicas' })}
            </span>
            <QuestionCircleOutlined className="m-l-5" />
          </Tooltip>
        ),
        dataIndex: 'replicas',
        key: 'replicas',
        align: 'center',
        span: 4,
        editable: {
          valueType: 'number',
          title: intl.formatMessage({ id: 'models.table.replicas.edit' })
        },
        render: (text: number, record: ListItem) => (
          <span style={{ paddingLeft: 10, minWidth: '33px' }}>
            {record.ready_replicas} / {record.replicas}
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        defaultSortOrder: 'descend',
        sortOrder,
        sorter: false,
        span: 4,
        render: (text: number) => (
          <AutoTooltip ghost>
            {dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        key: 'operation',
        dataIndex: 'operation',
        span: 3,
        render: (text, record) => (
          <DropdownButtons
            items={setModelActionList(record)}
            onSelect={(val) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [sortOrder, intl, handleSelect]);

  const handleOnClick = async () => {
    if (isLoading) {
      return;
    }

    const data = catalogList?.[0] || {};
    try {
      setIsLoading(true);
      const modelData = await createModel({
        data: data
      });
      writeState(IS_FIRST_LOGIN, false);
      setIsFirstLogin(false);
      setTimeout(() => {
        updateExpandedRowKeys([modelData.id]);
      }, 300);
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      handleSearch?.();
    } catch (error) {
      // ingore
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpandAll = useCallback(
    (expanded: boolean) => {
      const keys = dataSource.map((item) => item.id);
      handleExpandAll(expanded, keys);
      if (expanded) {
        handleOnToggleExpandAll();
      }
    },
    [dataSource]
  );

  const renderEmpty = useMemo(() => {
    if (dataSource.length || !isFirstLogin || !catalogList?.length) {
      return null;
    }
    return (
      <div
        className="flex-column justify-center flex-center"
        style={{ height: 300 }}
      >
        <Empty description=""></Empty>
        <Typography.Title level={4} style={{ marginBottom: 30 }}>
          {intl.formatMessage({ id: 'models.table.list.empty' })}
        </Typography.Title>
        <div>
          <Button type="primary" onClick={handleOnClick} loading={isLoading}>
            <span
              className="flex-center"
              dangerouslySetInnerHTML={{
                __html: intl.formatMessage({ id: 'models.table.list.getStart' })
              }}
            ></span>
          </Button>
        </div>
      </div>
    );
  }, [dataSource.length, isFirstLogin, isLoading, intl]);

  return (
    <>
      <PageContainer
        className="models-page-container"
        ghost
        header={{
          title: intl.formatMessage({ id: 'menu.models.deployment' }),
          style: {
            paddingInline: 'var(--layout-content-header-inlinepadding)'
          },
          breadcrumb: {}
        }}
        extra={[]}
      >
        <PageTools
          marginBottom={22}
          left={
            <Space>
              <Input
                placeholder={intl.formatMessage({ id: 'common.filter.name' })}
                style={{ width: 200 }}
                size="large"
                allowClear
                onChange={handleNameChange}
              ></Input>
              <Select
                allowClear
                showSearch={false}
                placeholder={intl.formatMessage({
                  id: 'models.filter.category'
                })}
                style={{ width: 180 }}
                size="large"
                maxTagCount={1}
                onChange={handleCategoryChange}
                options={modelCategories.filter((item) => item.value)}
              ></Select>
              <Select
                allowClear
                showSearch={false}
                placeholder="Filter by worker"
                style={{ width: 180 }}
                size="large"
                maxTagCount={1}
                options={[]}
              ></Select>
              <Button
                type="text"
                style={{ color: 'var(--ant-color-text-tertiary)' }}
                onClick={handleSearch}
                icon={<SyncOutlined></SyncOutlined>}
              ></Button>
            </Space>
          }
          right={
            <Space size={20}>
              <DropDownActions
                menu={{
                  items: sourceOptions,
                  onClick: handleClickDropdown
                }}
                trigger={['hover']}
                placement="bottomRight"
              >
                <Button
                  icon={<DownOutlined></DownOutlined>}
                  type="primary"
                  iconPosition="end"
                >
                  {intl?.formatMessage?.({ id: 'models.button.deploy' })}
                </Button>
              </DropDownActions>
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
          dataSource={dataSource}
          rowSelection={rowSelection}
          expandedRowKeys={expandedRowKeys}
          onExpand={handleExpandChange}
          onExpandAll={handleToggleExpandAll}
          loading={loading}
          loadend={loadend}
          rowKey="id"
          childParentKey="model_id"
          expandable={true}
          onSort={handleOnSort}
          onCell={handleOnCell}
          pollingChildren={false}
          watchChildren={true}
          loadChildren={getModelInstances}
          loadChildrenAPI={generateChildrenRequestAPI}
          renderChildren={renderChildren}
          pagination={{
            showSizeChanger: true,
            pageSize: queryParams.perPage,
            current: queryParams.page,
            total: total,
            hideOnSinglePage: queryParams.perPage === 10,
            onChange: handlePageChange
          }}
        ></SealTable>
      </PageContainer>
      <UpdateModel
        open={openAddModal}
        action={PageAction.EDIT}
        title={intl.formatMessage({ id: 'models.title.edit' })}
        updateFormInitials={updateFormInitials}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></UpdateModel>
      <DeployModal
        open={openDeployModal.show}
        action={PageAction.CREATE}
        title={intl.formatMessage({ id: 'models.button.deploy' })}
        source={openDeployModal.source}
        width={openDeployModal.width}
        isGGUF={openDeployModal.isGGUF}
        hasLinuxWorker={openDeployModal.hasLinuxWorker}
        gpuOptions={openDeployModal.gpuOptions}
        modelFileOptions={openDeployModal.modelFileOptions || []}
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
      <APIAccessInfoModal
        open={apiAccessInfo.show}
        data={apiAccessInfo.data}
        onClose={() => {
          setAPIAccessInfo({
            ...apiAccessInfo,
            show: false
          });
        }}
      ></APIAccessInfoModal>
    </>
  );
};

export default Models;
