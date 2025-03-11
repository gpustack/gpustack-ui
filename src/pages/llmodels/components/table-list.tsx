import { modelsExpandKeysAtom } from '@/atoms/models';
import AutoTooltip from '@/components/auto-tooltip';
import DeleteModal from '@/components/delete-modal';
import DropdownButtons from '@/components/drop-down-buttons';
import IconFont from '@/components/icon-font';
import { PageSize } from '@/components/logs-viewer/config';
import PageTools from '@/components/page-tools';
import SealTable from '@/components/seal-table';
import { SealColumnProps } from '@/components/seal-table/types';
import { PageAction } from '@/config';
import HotKeys from '@/config/hotkeys';
import useBodyScroll from '@/hooks/use-body-scroll';
import useExpandedRowKeys from '@/hooks/use-expanded-row-keys';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import {
  GPUDeviceItem,
  ListItem as WorkerListItem
} from '@/pages/resources/config/types';
import { handleBatchRequest } from '@/utils';
import {
  IS_FIRST_LOGIN,
  readState,
  writeState
} from '@/utils/localstore/index';
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  ExperimentOutlined,
  QuestionCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useAccess, useIntl, useNavigate } from '@umijs/max';
import {
  Button,
  Dropdown,
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
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
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
  getSourceRepoConfigValue,
  modelCategories,
  modelCategoriesMap,
  modelSourceMap
} from '../config';
import { FormData, ListItem, ModelInstanceListItem } from '../config/types';
import { useGenerateFormEditInitialValues } from '../hooks';
import DeployModal from './deploy-modal';
import Instances from './instances';
import ModelTag from './model-tag';
import UpdateModel from './update-modal';
import ViewLogsModal from './view-logs-modal';

interface ModelsProps {
  handleSearch: () => void;
  handleNameChange: (e: any) => void;
  handleShowSizeChange?: (page: number, size: number) => void;
  handlePageChange: (page: number, pageSize: number | undefined) => void;
  handleDeleteSuccess: () => void;
  handleCategoryChange: (val: any) => void;
  onViewLogs: () => void;
  onCancelViewLogs: () => void;
  handleOnToggleExpandAll: () => void;
  queryParams: {
    page: number;
    perPage: number;
    query?: string;
    categories?: string[];
  };
  deleteIds?: number[];
  gpuDeviceList: GPUDeviceItem[];
  workerList: WorkerListItem[];
  catalogList?: any[];
  dataSource: ListItem[];
  loading: boolean;
  loadend: boolean;
  total: number;
}

const ActionList = [
  {
    label: 'common.button.edit',
    key: 'edit',
    icon: <EditOutlined />
  },
  {
    label: 'models.openinplayground',
    key: 'chat',
    icon: <ExperimentOutlined />
  },
  {
    label: 'common.button.stop',
    key: 'stop',
    icon: <IconFont type="icon-stop1"></IconFont>
  },
  {
    label: 'common.button.start',
    key: 'start',
    icon: <IconFont type="icon-outline-play"></IconFont>
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    props: {
      danger: true
    },
    icon: <DeleteOutlined />
  }
];

const ButtonList = [
  {
    label: 'common.button.start',
    key: 'start',
    icon: <IconFont type="icon-outline-play"></IconFont>
  },
  {
    label: 'common.button.stop',
    key: 'stop',
    icon: <IconFont type="icon-stop1"></IconFont>
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    icon: <DeleteOutlined />,
    props: {
      danger: true
    }
  }
];

const generateSource = (record: ListItem) => {
  if (record.source === modelSourceMap.modelscope_value) {
    return `${modelSourceMap.modelScope}/${record.model_scope_model_id}`;
  }
  if (record.source === modelSourceMap.huggingface_value) {
    return `${modelSourceMap.huggingface}/${record.huggingface_repo_id}`;
  }
  if (record.source === modelSourceMap.local_path_value) {
    return `${record.local_path}`;
  }
  if (record.source === modelSourceMap.ollama_library_value) {
    return `${modelSourceMap.ollama_library}/${record.ollama_library_model_name}`;
  }
  return '';
};

const setActionList = (record: ListItem) => {
  return _.filter(ActionList, (action: any) => {
    if (action.key === 'chat') {
      return record.ready_replicas > 0;
    }
    if (action.key === 'start') {
      return record.replicas === 0;
    }

    if (action.key === 'stop') {
      return record.replicas > 0;
    }

    return true;
  });
};

const Models: React.FC<ModelsProps> = ({
  handleNameChange,
  handleSearch,
  handlePageChange,
  handleDeleteSuccess,
  onViewLogs,
  onCancelViewLogs,
  handleCategoryChange,
  handleOnToggleExpandAll,
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
    data: any;
    isGGUF: boolean;
  }>({
    gpuOptions: [],
    data: {},
    isGGUF: false
  });
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandAtom, setExpandAtom] = useAtom(modelsExpandKeysAtom);
  const access = useAccess();
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

  const [openLogModal, setOpenLogModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openDeployModal, setOpenDeployModal] = useState<{
    show: boolean;
    width: number | string;
    source: string;
    gpuOptions: any[];
  }>({
    show: false,
    width: 600,
    source: modelSourceMap.huggingface_value,
    gpuOptions: []
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

  useHotkeys(
    HotKeys.NEW1.join(','),
    () => {
      setOpenDeployModal({
        show: true,
        width: 'calc(100vw - 220px)',
        source: modelSourceMap.huggingface_value,
        gpuOptions: gpuDeviceList.current
      });
    },
    {
      preventDefault: true,
      enabled: !openAddModal && !openDeployModal.show && !openLogModal
    }
  );

  useHotkeys(
    HotKeys.NEW3.join(','),
    () => {
      setOpenDeployModal({
        show: true,
        width: 'calc(100vw - 220px)',
        source: modelSourceMap.modelscope_value,
        gpuOptions: gpuDeviceList.current
      });
    },
    {
      preventDefault: true,
      enabled: !openAddModal && !openDeployModal.show && !openLogModal
    }
  );

  useHotkeys(
    HotKeys.NEW2.join(','),
    () => {
      setOpenDeployModal({
        show: true,
        width: 600,
        source: modelSourceMap.ollama_library_value,
        gpuOptions: gpuDeviceList.current
      });
    },
    {
      preventDefault: true,
      enabled: !openAddModal && !openDeployModal.show && !openLogModal
    }
  );
  useHotkeys(
    HotKeys.NEW4.join(','),
    () => {
      setOpenDeployModal({
        show: true,
        width: 600,
        source: modelSourceMap.local_path_value,
        gpuOptions: gpuDeviceList.current
      });
    },
    {
      preventDefault: true,
      enabled: !openAddModal && !openDeployModal.show && !openLogModal
    }
  );

  useEffect(() => {
    if (deleteIds?.length) {
      rowSelection.removeSelectedKey(deleteIds);
    }
  }, [deleteIds]);

  useEffect(() => {
    getGPUList();
    return () => {
      setExpandAtom([]);
    };
  }, []);

  const sourceOptions = [
    {
      label: intl.formatMessage({ id: 'menu.models.modelCatalog' }),
      value: 'catalog',
      key: 'catalog',
      icon: <IconFont type="icon-catalog"></IconFont>
    },
    {
      label: 'Hugging Face',
      value: modelSourceMap.huggingface_value,
      key: 'huggingface',
      icon: <IconFont type="icon-huggingface"></IconFont>
    },
    {
      label: 'Ollama Library',
      value: modelSourceMap.ollama_library_value,
      key: 'ollama_library',
      icon: <IconFont type="icon-ollama"></IconFont>
    },
    {
      label: 'ModelScope',
      value: modelSourceMap.modelscope_value,
      key: 'modelscope',
      icon: <IconFont type="icon-tu2"></IconFont>
    },
    {
      label: intl.formatMessage({ id: 'models.form.localPath' }),
      value: modelSourceMap.local_path_value,
      key: 'local_path',
      icon: <IconFont type="icon-hard-disk"></IconFont>
    }
  ];

  const setCurrentData = (data: ListItem) => {
    currentData.current = data;
  };

  const handleOnSort = (dataIndex: string, order: any) => {
    setSortOrder(order);
  };

  const handleOnCell = useCallback(async (record: any, dataIndex: string) => {
    const params = {
      id: record.id,
      data: _.omit(record, [
        'id',
        'ready_replicas',
        'created_at',
        'updated_at',
        'rowIndex'
      ])
    };
    await updateModel(params);
    message.success(intl.formatMessage({ id: 'common.message.success' }));
  }, []);

  const handleStartModel = async (row: ListItem) => {
    try {
      await updateModel({
        id: row.id,
        data: {
          ..._.omit(row, [
            'id',
            'ready_replicas',
            'created_at',
            'updated_at',
            'rowIndex'
          ]),
          replicas: 1
        }
      });
    } catch (error) {
      // ingore
    }
  };

  const handleStopModel = async (row: ListItem) => {
    try {
      await updateModel({
        id: row.id,
        data: {
          ..._.omit(row, [
            'id',
            'ready_replicas',
            'created_at',
            'updated_at',
            'rowIndex'
          ]),
          replicas: 0
        }
      });
      removeExpandedRowKey([row.id]);
    } catch (error) {
      // ingore
    }
  };

  const handleModalOk = useCallback(
    async (data: FormData) => {
      try {
        const result = getSourceRepoConfigValue(
          currentData.current?.source,
          data
        );
        await updateModel({
          data: {
            ...result.values,
            ..._.omit(data, result.omits)
          },
          id: currentData.current?.id as number
        });
        setOpenAddModal(false);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        handleSearch();
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

        const result = getSourceRepoConfigValue(openDeployModal.source, data);

        const modelData = await createModel({
          data: {
            ...result.values,
            ..._.omit(data, result.omits)
          }
        });
        setOpenDeployModal({
          ...openDeployModal,
          show: false
        });
        setTimeout(() => {
          updateExpandedRowKeys([modelData.id, ...expandedRowKeys]);
        }, 300);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        handleSearch?.();
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
    modalRef.current.show({
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
    modalRef.current.show({
      content: 'models.table.models',
      operation: 'common.delete.confirm',
      selection: true,
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRowKeys, deleteModel);
        rowSelection.clearSelections();
        removeExpandedRowKey(rowSelection.selectedRowKeys);
        handleDeleteSuccess();
        handleSearch();
      }
    });
  };

  const handleOpenPlayGround = (row: any) => {
    if (row.categories?.includes(modelCategoriesMap.image)) {
      navigate(`/playground/text-to-image?model=${row.name}`);
      return;
    }
    if (row.categories?.includes(modelCategoriesMap.text_to_speech)) {
      navigate(`/playground/speech?model=${row.name}&type=tts`);
      return;
    }
    if (row.categories?.includes(modelCategoriesMap.speech_to_text)) {
      navigate(`/playground/speech?model=${row.name}&type=stt`);
      return;
    }
    if (row.categories?.includes(modelCategoriesMap.reranker)) {
      navigate(`/playground/rerank?model=${row.name}`);
      return;
    }
    if (row.categories?.includes(modelCategoriesMap.embedding)) {
      navigate(`/playground/embedding?model=${row.name}`);
      return;
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
      modalRef.current.show({
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
      data: initialValues,
      isGGUF: row.backend === backendOptionsMap.llamaBox
    });
    setCurrentData(row);
    setOpenAddModal(true);
    saveScrollHeight();
  };

  const handleSelect = useCallback(
    async (val: any, row: ListItem) => {
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
      }

      if (val === 'stop') {
        modalRef.current.show({
          content: 'models.instances',
          title: 'common.title.stop.confirm',
          okText: 'common.button.stop',
          operation: 'common.stop.single.confirm',
          name: row.name,
          async onOk() {
            await handleStopModel(row);
          }
        });
      }
    },
    [handleEdit, handleOpenPlayGround, handleDelete, expandedRowKeys]
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
    if (item.key === 'huggingface') {
      setOpenDeployModal({
        show: true,
        width: 'calc(100vw - 220px)',
        source: modelSourceMap.huggingface_value,
        gpuOptions: gpuDeviceList.current
      });
    }

    if (item.key === 'ollama_library') {
      setOpenDeployModal({
        show: true,
        width: 600,
        source: modelSourceMap.ollama_library_value,
        gpuOptions: gpuDeviceList.current
      });
    }

    if (item.key === 'modelscope') {
      setOpenDeployModal({
        show: true,
        width: 'calc(100vw - 220px)',
        source: modelSourceMap.modelscope_value,
        gpuOptions: gpuDeviceList.current
      });
    }

    if (item.key === 'local_path') {
      setOpenDeployModal({
        show: true,
        width: 600,
        source: modelSourceMap.local_path_value,
        gpuOptions: gpuDeviceList.current
      });
    }
    if (item.key === 'catalog') {
      navigate('/models/catalog');
    }
  };

  const handleStartBatch = async () => {
    modalRef.current.show({
      content: 'models.table.models',
      title: 'common.title.start.confirm',
      okText: 'common.button.start',
      operation: 'common.start.confirm',
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRows, handleStartModel);
        rowSelection.clearSelections();
      }
    });
  };

  const handleStopBatch = async () => {
    modalRef.current.show({
      content: 'models.table.models',
      title: 'common.title.stop.confirm',
      okText: 'common.button.stop',
      operation: 'common.stop.confirm',
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRows, handleStopModel);
        rowSelection.clearSelections();
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
        title: intl.formatMessage({ id: 'models.form.source' }),
        dataIndex: 'source',
        key: 'source',
        span: 6,
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
            {intl.formatMessage({ id: 'models.form.replicas' })}
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
        span: 5,
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
        span: 4,
        render: (text, record) => (
          <DropdownButtons
            items={setActionList(record)}
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
          title: intl.formatMessage({ id: 'models.title' }),
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
                style={{ width: 230 }}
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
                style={{ width: 230 }}
                size="large"
                mode="multiple"
                maxTagCount={1}
                onChange={handleCategoryChange}
                options={modelCategories.filter((item) => item.value)}
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
              <Dropdown
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
              </Dropdown>
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
              {/* <Button
                icon={<IconFont type="icon-outline-play"></IconFont>}
                onClick={handleStartBatch}
                disabled={!rowSelection.selectedRows.length}
              >
                <span>
                  {intl?.formatMessage?.({ id: 'common.button.start' })}
                  {rowSelection.selectedRows.length > 0 && (
                    <span>({rowSelection.selectedRows?.length})</span>
                  )}
                </span>
              </Button>
              <Button
                icon={<IconFont type="icon-stop1"></IconFont>}
                onClick={handleStopBatch}
                disabled={!rowSelection.selectedRows.length}
              >
                <span>
                  {intl?.formatMessage?.({ id: 'common.button.stop' })}
                  {rowSelection.selectedRows.length > 0 && (
                    <span>({rowSelection.selectedRows?.length})</span>
                  )}
                </span>
              </Button>
              <Access accessible={access.canDelete}>
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={handleDeleteBatch}
                  disabled={!rowSelection.selectedRowKeys.length}
                >
                  <span>
                    {intl?.formatMessage?.({ id: 'common.button.delete' })}
                    {rowSelection.selectedRowKeys.length > 0 && (
                      <span>({rowSelection.selectedRowKeys?.length})</span>
                    )}
                  </span>
                </Button>
              </Access> */}
            </Space>
          }
        ></PageTools>

        <SealTable
          empty={renderEmpty}
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
        gpuOptions={openDeployModal.gpuOptions}
        onCancel={handleDeployModalCancel}
        onOk={handleCreateModel}
      ></DeployModal>
      <ViewLogsModal
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

export default memo(Models);
