import { modelsExpandKeysAtom } from '@/atoms/models';
import AutoTooltip from '@/components/auto-tooltip';
import DeleteModal from '@/components/delete-modal';
import DropdownButtons from '@/components/drop-down-buttons';
import { TooltipOverlayScroller } from '@/components/overlay-scroller';
import { FilterBar } from '@/components/page-tools';
import StatusTag from '@/components/status-tag';
import { PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import useBodyScroll from '@/hooks/use-body-scroll';
import useTableFetch from '@/hooks/use-table-fetch';
import { createModel } from '@/pages/llmodels/apis';
import DeployModal from '@/pages/llmodels/components/deploy-modal';
import { backendOptionsMap, modelSourceMap } from '@/pages/llmodels/config';
import { identifyModelTask } from '@/pages/llmodels/config/audio-catalog';
import {
  modalConfig,
  modelFileActions,
  onLineSourceOptions
} from '@/pages/llmodels/config/button-actions';
import { SourceType } from '@/pages/llmodels/config/types';
import DownloadModal from '@/pages/llmodels/download';
import { convertFileSize } from '@/utils';
import {
  CheckCircleFilled,
  CopyOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useNavigate } from '@umijs/max';
import { ConfigProvider, Empty, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  checkCurrentbackend,
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

const { Paragraph } = Typography;

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

const ItemWrapper = styled.ul`
  max-width: 300px;
  margin: 0;
  padding-inline: 13px 0;
  word-break: break-word;
  li {
    line-height: 1.6;
  }
`;

const FilesTag = styled(Tag)`
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-inline: 4px 0;
  height: 22px;
  border-radius: var(--border-radius-base);
`;

const TextWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  height: 100%;
`;

const TypographyPara = styled(Paragraph)`
  background: transparent;
  color: inherit;
  margin-bottom: 0;
  font-size: 13px;
`;

const TooltipTitle: React.FC<{ path: string }> = ({ path }) => {
  const intl = useIntl();
  return (
    <TypographyPara
      style={{ margin: 0 }}
      copyable={{
        icon: [
          <CopyOutlined key="copy-icon" />,
          <CheckCircleFilled key="copied-icon" />
        ],
        text: path,
        tooltips: [
          intl.formatMessage({ id: 'common.button.copy' }),
          intl.formatMessage({ id: 'common.button.copied' })
        ]
      }}
    >
      {path}
    </TypographyPara>
  );
};

const getWorkerName = (
  id: number,
  workersList: Global.BaseOption<number>[]
) => {
  const worker = workersList.find((item) => item.value === id);
  return worker?.label || '';
};

const getModelInfo = (record: ListItem) => {
  const source = _.get(modelSourceMap, record.source, '');
  if (record.source === modelSourceMap.huggingface_value) {
    return {
      source: `${source}/${record.huggingface_repo_id}`,
      repo_id: record.huggingface_repo_id,
      title: `${record.huggingface_repo_id}/${record.huggingface_filename}`,
      filename: record.huggingface_filename || record.huggingface_repo_id
    };
  }
  if (record.source === modelSourceMap.modelscope_value) {
    return {
      source: `${source}/${record.model_scope_model_id}`,
      repo_id: record.model_scope_model_id,
      title: `${record.model_scope_model_id}/${record.model_scope_file_path}`,
      filename: record.model_scope_file_path || record.model_scope_model_id
    };
  }
  if (record.source === modelSourceMap.ollama_library_value) {
    return {
      source: `${source}/${record.ollama_library_model_name}`,
      repo_id: record.ollama_library_model_name,
      title: record.ollama_library_model_name,
      filename: record.ollama_library_model_name
    };
  }
  return {
    source: `${source}${record.local_path}`,
    repo_id: record.local_path,
    title: record.local_path,
    filename: _.split(record.local_path, /[\\/]/).pop()
  };
};

const getResolvedPath = (pathList: string[]) => {
  return _.split(pathList?.[0], /[\\/]/).pop();
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

const RenderParts = (props: { record: ListItem }) => {
  const { record } = props;
  const intl = useIntl();
  const parts = record.resolved_paths || [];
  if (parts.length <= 1) {
    return null;
  }

  const renderItem = () => {
    return (
      <ItemWrapper>
        {parts.map((item: string, index: number) => {
          return <li key={index}>{_.split(item, /[\\/]/).pop()}</li>;
        })}
      </ItemWrapper>
    );
  };

  return (
    <TooltipOverlayScroller title={renderItem()}>
      <FilesTag color="purple" icon={<InfoCircleOutlined />}>
        <span style={{ opacity: 1 }}>
          {record.resolved_paths?.length}{' '}
          {intl.formatMessage({ id: 'models.form.files' })}
        </span>
      </FilesTag>
    </TooltipOverlayScroller>
  );
};

const ResolvedPathColumn = (props: { record: ListItem }) => {
  const { record } = props;
  const intl = useIntl();
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
        <TextWrapper>
          <AutoTooltip
            ghost
            showTitle
            title={
              <TooltipTitle path={record.resolved_paths?.[0]}></TooltipTitle>
            }
          >
            <span>{getResolvedPath(record.resolved_paths)}</span>
          </AutoTooltip>
        </TextWrapper>
        <RenderParts record={record}></RenderParts>
      </PathWrapper>
    )
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
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [downloadModalStatus, setDownlaodMoalStatus] = useState<{
    show: boolean;
    width: number | string;
    source: string;
    hasLinuxWorker: boolean;
    gpuOptions: any[];
  }>({
    show: false,
    width: 600,
    hasLinuxWorker: false,
    source: modelSourceMap.huggingface_value,
    gpuOptions: []
  });
  const [openDeployModal, setOpenDeployModal] = useState<{
    show: boolean;
    width: number | string;
    source: SourceType;
    gpuOptions: any[];
    modelFileOptions?: any[];
    initialValues: any;
    isGGUF?: boolean;
  }>({
    show: false,
    width: 600,
    source: modelSourceMap.local_path_value as SourceType,
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
  const generateInitialValues = (record: ListItem, gpuOptions: any[]) => {
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
        /[\\/]/
      ).pop()
    );

    const targetWorker = _.find(workersList, { value: record.worker_id })
      ?.labels?.['worker-name'];

    return {
      source: modelSourceMap.local_path_value,
      local_path: record.resolved_paths?.[0],
      worker_selector: targetWorker
        ? {
            'worker-name': targetWorker
          }
        : {},
      name: extractFileName(name),
      backend: checkCurrentbackend({
        isGGUF: !audioModelTag && (isGGUF || isOllama),
        isAudio: !!audioModelTag,
        gpuOptions: gpuOptions,
        defaultBackend: backendOptionsMap.vllm
      }),
      isGGUF: !audioModelTag && (isGGUF || isOllama)
    };
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
        const initialValues = generateInitialValues(record, gpuList);
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

  const handleClickDropdown = useCallback(
    (item: any) => {
      const config = modalConfig[item.key];
      const hasLinuxWorker = workersList.some(
        (worker) => _.toLower(worker.labels?.os) === 'linux'
      );
      if (config) {
        setDownlaodMoalStatus({ ...config, hasLinuxWorker, gpuOptions: [] });
      }
    },
    [workersList]
  );

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
      const modelData = await createModel({
        data
      });
      setOpenDeployModal({
        ...openDeployModal,
        show: false
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      setModelsExpandKeys([modelData.id]);
      navigate('/models/deployments');
    } catch (error) {
      // console.log('error', error);
    }
  };

  const columns: any[] = [
    {
      title: intl.formatMessage({ id: 'models.form.source' }),
      dataIndex: 'source',
      ellipsis: {
        showTitle: false
      },
      render: (text: string, record: ListItem) => {
        const modelInfo = getModelInfo(record);
        const { repo_id, source } = modelInfo;
        return (
          <TextWrapper style={{ paddingRight: 8 }}>
            <AutoTooltip ghost title={source}>
              {source}
            </AutoTooltip>
          </TextWrapper>
        );
      }
    },
    {
      title: 'Worker',
      dataIndex: 'worker_name',
      ellipsis: {
        showTitle: false
      },
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
      width: 132,
      render: (text: string, record: ListItem) => {
        return <InstanceStatusTag data={record} />;
      }
    },
    {
      title: intl.formatMessage({ id: 'resources.modelfiles.form.path' }),
      dataIndex: 'resolved_paths',
      width: '30%',
      ellipsis: {
        showTitle: false
      },
      render: (text: string, record: ListItem) => (
        <ResolvedPathColumn record={record} />
      )
    },
    {
      title: intl.formatMessage({ id: 'resources.modelfiles.size' }),
      dataIndex: 'size',
      width: 110,
      align: 'right',
      ellipsis: {
        showTitle: false
      },
      render: (text: string, record: ListItem) => {
        return (
          <AutoTooltip ghost>
            <span>{convertFileSize(record.size, 1, true)}</span>
          </AutoTooltip>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'common.table.createTime' }),
      dataIndex: 'created_at',
      sorter: false,
      width: 180,
      ellipsis: {
        showTitle: false
      },
      render: (text: number) => (
        <AutoTooltip ghost minWidth={20}>
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

  const readyWorkers = useMemo(() => {
    return workersList.filter((item) => item.state === WorkerStatusMap.ready);
  }, [workersList]);

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({ id: 'resources.modelfiles.modelfile' }),
          style: {
            paddingInline: 'var(--layout-content-header-inlinepadding)'
          },
          breadcrumb: {}
        }}
        extra={[]}
      >
        <FilterBar
          marginBottom={22}
          marginTop={30}
          actionType="dropdown"
          selectHolder="resources.filter.worker"
          inputHolder="resources.filter.path"
          buttonText={intl.formatMessage({
            id: 'resources.modelfiles.download'
          })}
          handleSelectChange={handleWorkerChange}
          handleDeleteByBatch={handleDeleteByBatch}
          handleClickPrimary={handleClickDropdown}
          handleSearch={handleSearch}
          selectOptions={workersList}
          handleInputChange={handleNameChange}
          rowSelection={rowSelection}
          actionItems={onLineSourceOptions}
          showSelect={true}
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            rowKey="id"
            tableLayout="fixed"
            style={{ width: '100%' }}
            onChange={handleTableChange}
            dataSource={dataSource.dataList}
            loading={dataSource.loading}
            rowSelection={rowSelection}
            columns={columns}
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
          onCancel={handleDownloadCancel}
          onOk={handleDownload}
          title={intl.formatMessage({ id: 'resources.modelfiles.download' })}
          open={downloadModalStatus.show}
          source={downloadModalStatus.source}
          width={downloadModalStatus.width}
          hasLinuxWorker={downloadModalStatus.hasLinuxWorker}
          workersList={readyWorkers}
        ></DownloadModal>
        <DeployModal
          deploymentType="modelFiles"
          title={intl.formatMessage({ id: 'models.button.deploy' })}
          onCancel={handleDeployModalCancel}
          onOk={handleCreateModel}
          open={openDeployModal.show}
          action={PageAction.CREATE}
          source={openDeployModal.source}
          width={openDeployModal.width}
          gpuOptions={openDeployModal.gpuOptions}
          modelFileOptions={openDeployModal.modelFileOptions || []}
          initialValues={openDeployModal.initialValues}
          isGGUF={openDeployModal.isGGUF}
        ></DeployModal>
      </PageContainer>
    </>
  );
};

export default ModelFiles;
