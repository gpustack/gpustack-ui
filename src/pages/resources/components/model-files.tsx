import { modelsExpandKeysAtom } from '@/atoms/models';
import AutoTooltip from '@/components/auto-tooltip';
import CopyButton from '@/components/copy-button';
import DeleteModal from '@/components/delete-modal';
import DropDownActions from '@/components/drop-down-actions';
import DropdownButtons from '@/components/drop-down-buttons';
import PageTools from '@/components/page-tools';
import StatusTag from '@/components/status-tag';
import { PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import useBodyScroll from '@/hooks/use-body-scroll';
import useTableFetch from '@/hooks/use-table-fetch';
import { createModel } from '@/pages/llmodels/apis';
import DeployModal from '@/pages/llmodels/components/deploy-modal';
import {
  backendOptionsMap,
  getSourceRepoConfigValue,
  modelSourceMap,
  setSourceRepoConfigValue
} from '@/pages/llmodels/config';
import { identifyModelTask } from '@/pages/llmodels/config/audio-catalog';
import {
  generateSource,
  modalConfig,
  modelFileActions,
  onLineSourceOptions
} from '@/pages/llmodels/config/button-actions';
import DownloadModal from '@/pages/llmodels/download';
import { convertFileSize } from '@/utils';
import { DeleteOutlined, DownOutlined, SyncOutlined } from '@ant-design/icons';
import { useIntl, useNavigate } from '@umijs/max';
import {
  Button,
  ConfigProvider,
  Empty,
  Input,
  Select,
  Space,
  Table,
  Tag,
  message
} from 'antd';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  useGenerateFormEditInitialValues,
  useGenerateModelFileOptions
} from '../../llmodels/hooks';
import {
  MODEL_FILES_API,
  deleteModelFile,
  downloadModelFile,
  queryModelFilesList,
  queryWorkersList,
  retryDownloadModelFile
} from '../apis';
import {
  ModelfileState,
  ModelfileStateMap,
  ModelfileStateMapValue,
  WorkerStatusMap
} from '../config';
import {
  ModelFile as ListItem,
  ListItem as WorkerListItem
} from '../config/types';

const filterPattern = /^(.*?)(?:-\d+-of-\d+)?(\.gguf)?$/;

const PathWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
  &::after {
    content: '';
    display: block;
    width: 20px;
    height: 100%;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
  }
  .btn-wrapper {
    display: flex;
    opacity: 0;
    width: 0;
    align-items: center;
  }
  &:hover {
    .btn-wrapper {
      width: auto;
      opacity: 1;
    }
  }
`;

const getWorkerName = (
  id: number,
  workersList: Global.BaseOption<number>[]
) => {
  const worker = workersList.find((item) => item.value === id);
  return worker?.label || '';
};

const InstanceStatusTag = (props: { data: ListItem }) => {
  const { data } = props;
  if (!data.state) {
    return null;
  }
  return (
    <StatusTag
      download={
        data.state === ModelfileStateMap.Downloading
          ? { percent: data.download_progress }
          : undefined
      }
      statusValue={{
        status:
          data.state === ModelfileStateMap.Downloading &&
          data.download_progress === 100
            ? ModelfileState[ModelfileStateMap.Ready]
            : ModelfileState[data.state],
        text: ModelfileStateMapValue[data.state],
        message:
          data.state === ModelfileStateMap.Downloading &&
          data.download_progress === 100
            ? ''
            : data.state_message
      }}
    />
  );
};

const ModelFiles = () => {
  const { getGPUList } = useGenerateFormEditInitialValues();
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const [modelsExpandKeys, setModelsExpandKeys] = useAtom(modelsExpandKeysAtom);
  const navigate = useNavigate();
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    fetchData,
    handleDelete,
    handleDeleteBatch,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleNameChange,
    handleQueryChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryModelFilesList,
    deleteAPI: deleteModelFile,
    API: MODEL_FILES_API,
    watch: true,
    contentForDelete: 'resources.modelfiles.modelfile'
  });
  const { getModelFileList, generateModelFileOptions } =
    useGenerateModelFileOptions();
  const intl = useIntl();
  const { showSuccess } = useAppUtils();
  const [workersList, setWorkersList] = useState<Global.BaseOption<number>[]>(
    []
  );
  const [downloadModalStatus, setDownlaodMoalStatus] = useState<{
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
  const [openDeployModal, setOpenDeployModal] = useState<{
    show: boolean;
    width: number | string;
    source: string;
    gpuOptions: any[];
    modelFileOptions?: any[];
    initialValues: any;
    isGGUF?: boolean;
  }>({
    show: false,
    width: 600,
    source: modelSourceMap.local_path_value,
    gpuOptions: [],
    modelFileOptions: [],
    initialValues: {},
    isGGUF: false
  });

  useEffect(() => {
    const fetchWorkerList = async () => {
      try {
        const res = await queryWorkersList({
          page: 1,
          perPage: 100
        });

        const list = res.items?.map((item: WorkerListItem) => {
          return {
            ...item,
            value: item.id,
            label: item.name
          };
        });
        setWorkersList(list);
      } catch (error) {
        // console.log('error', error);
      }
    };
    fetchWorkerList();
  }, []);

  const extractFileName = (name: string) => {
    return name.replace(filterPattern, '$1');
  };

  const handleWorkerChange = (value: number) => {
    handleQueryChange({
      page: 1,
      worker_id: value
    });
  };
  const generateInitialValues = (record: ListItem) => {
    const isGGUF = _.includes(record.resolved_paths?.[0], 'gguf');
    const isOllama = !!record.ollama_library_model_name;
    const audioModelTag = identifyModelTask(
      record.source,
      record.resolved_paths?.[0]
    );

    let name = _.toLower(
      _.split(
        record.huggingface_repo_id ||
          record.ollama_library_model_name ||
          record.model_scope_model_id ||
          record.local_path,
        '/'
      ).pop()
    );

    const targetWorker = _.find(workersList, { value: record.worker_id })
      ?.labels?.['worker-name'];

    const result = setSourceRepoConfigValue(record.source, record);

    return {
      source: modelSourceMap.local_path_value,
      local_path: record.resolved_paths?.[0],
      worker_selector: targetWorker
        ? {
            'worker-name': targetWorker
          }
        : {},
      name: extractFileName(name),
      backend:
        isGGUF || isOllama
          ? backendOptionsMap.llamaBox
          : audioModelTag
            ? backendOptionsMap.voxBox
            : backendOptionsMap.vllm,
      isGGUF: !audioModelTag && (isGGUF || isOllama)
    };
  };

  const renderParts = (record: ListItem) => {
    const parts = _.tail(record.resolved_paths);
    if (!parts.length) {
      return null;
    }

    return (
      <Tag
        className="flex-center"
        color="purple"
        style={{
          marginRight: 0,
          marginLeft: 4,
          height: 22,
          borderRadius: 'var(--border-radius-base)'
        }}
      >
        <span style={{ opacity: 1 }}>
          {record.resolved_paths?.length}{' '}
          {intl.formatMessage({ id: 'models.form.files' })}
        </span>
      </Tag>
    );
  };

  const handleSelect = async (val: any, record: ListItem) => {
    try {
      if (val === 'delete') {
        handleDelete(
          {
            ...record,
            name: record.resolved_paths?.[0]
          },
          {
            checkConfig: {
              checkText: 'resources.modelfiles.delete.tips',
              defautlChecked: record.source !== modelSourceMap.local_path_value
            }
          }
        );
      } else if (val === 'retry') {
        await retryDownloadModelFile(record.id);
        showSuccess();
      } else if (val === 'deploy') {
        saveScrollHeight();
        const [modelFileList, gpuList] = await Promise.all([
          getModelFileList(),
          getGPUList()
        ]);
        const dataList = generateModelFileOptions(modelFileList, workersList);
        const initialValues = generateInitialValues(record);
        setOpenDeployModal({
          ...openDeployModal,
          modelFileOptions: dataList,
          gpuOptions: gpuList,
          initialValues: initialValues,
          isGGUF: initialValues.isGGUF,
          show: true
        });
      }
    } catch (error) {
      // console.log('error', error);
    }
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    if (
      !dataSource.loading &&
      dataSource.loadend &&
      !dataSource.dataList.length
    ) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}></Empty>;
    }
    return <div></div>;
  };

  const handleClickDropdown = (item: any) => {
    const config = modalConfig[item.key];
    if (config) {
      setDownlaodMoalStatus({ ...config, gpuOptions: [] });
    }
  };

  const handleDownloadCancel = () => {
    setDownlaodMoalStatus({
      ...downloadModalStatus,
      show: false
    });
  };

  const handleDownload = async (data: any) => {
    try {
      await downloadModelFile(data);
      setDownlaodMoalStatus({
        ...downloadModalStatus,
        show: false
      });
      fetchData();
      showSuccess();
    } catch (error) {
      // console.log('error', error);
    }
  };

  const setActionList = (record: ListItem) => {
    return _.filter(modelFileActions, (item: { key: string }) => {
      if (item.key === 'deploy') {
        return record.state === ModelfileStateMap.Ready;
      }
      return true;
    });
  };
  const handleDeployModalCancel = () => {
    setOpenDeployModal({
      ...openDeployModal,
      show: false
    });
    restoreScrollHeight();
  };

  const handleDeleteByBatch = () => {
    handleDeleteBatch({
      checkConfig: {
        checkText: 'resources.modelfiles.delete.tips',
        defautlChecked: false
      }
    });
  };

  const handleCreateModel = async (data: any) => {
    try {
      const result = getSourceRepoConfigValue(openDeployModal.source, data);

      const modelData = await createModel({
        data: {
          ...result.values
        }
      });
      setOpenDeployModal({
        ...openDeployModal,
        show: false
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      setModelsExpandKeys([modelData.id]);
      navigate('/models/list');
    } catch (error) {
      // console.log('error', error);
    }
  };

  const columns = [
    {
      title: intl.formatMessage({ id: 'models.form.source' }),
      dataIndex: 'source',
      render: (text: string, record: ListItem) => (
        <span className="flex flex-column" style={{ width: '100%' }}>
          {record.source === modelSourceMap.local_path_value ? (
            intl.formatMessage({ id: 'models.form.localPath' })
          ) : (
            <AutoTooltip ghost>{generateSource(record)}</AutoTooltip>
          )}
        </span>
      )
    },
    {
      title: 'Worker',
      dataIndex: 'worker_name',
      render: (text: string, record: ListItem) => {
        return (
          <AutoTooltip ghost>
            <span>{getWorkerName(record.worker_id, workersList)}</span>
          </AutoTooltip>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'common.table.status' }),
      dataIndex: 'state',
      width: 120,
      render: (text: string, record: ListItem) => {
        return <InstanceStatusTag data={record} />;
      }
    },
    {
      title: intl.formatMessage({ id: 'resources.modelfiles.form.path' }),
      dataIndex: 'resolved_paths',
      width: '35%',
      render: (text: string, record: ListItem) => {
        if (
          !record.resolved_paths.length &&
          record.state === ModelfileStateMap.Downloading
        ) {
          return (
            <span>
              {intl.formatMessage({
                id: 'resources.modelfiles.storagePath.holder'
              })}
            </span>
          );
        }
        return (
          record.resolved_paths?.length > 0 && (
            <PathWrapper>
              <AutoTooltip ghost>
                <span>{record.resolved_paths?.[0]}</span>
              </AutoTooltip>
              <span className="btn-wrapper">
                <CopyButton
                  text={record.resolved_paths?.[0]}
                  type="link"
                  btnStyle={{ width: 18, paddingInline: 2 }}
                ></CopyButton>
              </span>
              {renderParts(record)}
            </PathWrapper>
          )
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'resources.modelfiles.size' }),
      dataIndex: 'size',
      width: 100,
      render: (text: string, record: ListItem) => {
        return (
          <AutoTooltip ghost maxWidth={100}>
            <span>{convertFileSize(record.size, 1)}</span>
          </AutoTooltip>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'common.table.createTime' }),
      dataIndex: 'created_at',
      sorter: false,
      width: 180,
      render: (text: number) => (
        <AutoTooltip ghost>
          {dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
        </AutoTooltip>
      )
    },
    {
      title: intl.formatMessage({ id: 'common.table.operation' }),
      dataIndex: 'operation',
      width: 120,
      render: (text: string, record: ListItem) => (
        <DropdownButtons
          items={setActionList(record)}
          onSelect={(val) => handleSelect(val, record)}
        ></DropdownButtons>
      )
    }
  ];

  return (
    <>
      <PageTools
        marginBottom={10}
        marginTop={10}
        left={
          <Space>
            <Input
              placeholder={intl.formatMessage({
                id: 'resources.filter.source'
              })}
              style={{ width: 230 }}
              allowClear
              onChange={handleNameChange}
            ></Input>
            <Select
              allowClear
              showSearch={false}
              placeholder={intl.formatMessage({
                id: 'resources.filter.worker'
              })}
              style={{ width: 230 }}
              size="large"
              onChange={handleWorkerChange}
              options={workersList}
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
                items: onLineSourceOptions,
                onClick: handleClickDropdown
              }}
            >
              <Button
                icon={<DownOutlined></DownOutlined>}
                type="primary"
                iconPosition="end"
              >
                {intl.formatMessage({ id: 'resources.modelfiles.download' })}
              </Button>
            </DropDownActions>
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={handleDeleteByBatch}
              disabled={!rowSelection.selectedRowKeys.length}
            >
              <span>
                {intl?.formatMessage?.({ id: 'common.button.delete' })}
                {rowSelection.selectedRowKeys.length > 0 && (
                  <span>({rowSelection.selectedRowKeys?.length})</span>
                )}
              </span>
            </Button>
          </Space>
        }
      ></PageTools>
      <ConfigProvider renderEmpty={renderEmpty}>
        <Table
          columns={columns}
          tableLayout="fixed"
          style={{ width: '100%' }}
          dataSource={dataSource.dataList}
          loading={dataSource.loading}
          rowKey="id"
          onChange={handleTableChange}
          rowSelection={rowSelection}
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
      <DeleteModal ref={modalRef}></DeleteModal>
      <DownloadModal
        open={downloadModalStatus.show}
        title={intl.formatMessage({ id: 'resources.modelfiles.download' })}
        source={downloadModalStatus.source}
        width={downloadModalStatus.width}
        onCancel={handleDownloadCancel}
        onOk={handleDownload}
        workersList={workersList.filter(
          (item: any) => item.state === WorkerStatusMap.ready
        )}
      ></DownloadModal>
      <DeployModal
        deploymentType="modelFiles"
        open={openDeployModal.show}
        action={PageAction.CREATE}
        title={intl.formatMessage({ id: 'models.button.deploy' })}
        source={openDeployModal.source}
        width={openDeployModal.width}
        gpuOptions={openDeployModal.gpuOptions}
        modelFileOptions={openDeployModal.modelFileOptions || []}
        initialValues={openDeployModal.initialValues}
        isGGUF={openDeployModal.isGGUF}
        onCancel={handleDeployModalCancel}
        onOk={handleCreateModel}
      ></DeployModal>
    </>
  );
};

export default ModelFiles;
