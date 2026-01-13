import { modelsExpandKeysAtom } from '@/atoms/models';
import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { PageAction } from '@/config';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useAppUtils from '@/hooks/use-app-utils';
import useBodyScroll from '@/hooks/use-body-scroll';
import useTableFetch from '@/hooks/use-table-fetch';
import NoResult from '@/pages/_components/no-result';
import PageBox from '@/pages/_components/page-box';
import { createModel } from '@/pages/llmodels/apis';
import DeployModal from '@/pages/llmodels/components/deploy-modal';
import { modelSourceMap } from '@/pages/llmodels/config';
import { backendOptionsMap } from '@/pages/llmodels/config/backend-parameters';
import {
  modalConfig,
  onLineSourceOptions
} from '@/pages/llmodels/config/button-actions';
import { SourceType } from '@/pages/llmodels/config/types';
import DownloadModal from '@/pages/llmodels/download';
import useCheckBackend from '@/pages/llmodels/hooks/use-check-backend';
import { useGenerateWorkerOptions } from '@/pages/llmodels/hooks/use-form-initial-values';
import useRecognizeAudio from '@/pages/llmodels/hooks/use-recognize-audio';
import { useIntl, useNavigate } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Table, message } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import {
  MODEL_FILES_API,
  deleteModelFile,
  downloadModelFile,
  queryModelFilesList,
  retryDownloadModelFile
} from '../apis';
import { WorkerStatusMap } from '../config';
import { ModelFile as ListItem } from '../config/types';
import useFilesColumns from '../hooks/use-files-columns';

const filterPattern = /^(.*?)(?:-\d+-of-\d+)?(\.gguf)?$/;

const ModelFiles = () => {
  const { identifyModelTask } = useRecognizeAudio();
  const { checkCurrentbackend } = useCheckBackend();
  const { getWorkerOptionList, workerOptions, clusterList, workersList } =
    useGenerateWorkerOptions();
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const [modelsExpandKeys, setModelsExpandKeys] = useAtom(modelsExpandKeysAtom);
  const navigate = useNavigate();
  const {
    dataSource,
    rowSelection,
    queryParams,
    sortOrder,
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
  const intl = useIntl();
  const { showSuccess } = useAppUtils();
  const [downloadModalStatus, setDownlaodMoalStatus] = useState<{
    show: boolean;
    width: number | string;
    source: string;
    hasLinuxWorker: boolean;
  }>({
    show: false,
    width: 600,
    hasLinuxWorker: false,
    source: modelSourceMap.huggingface_value
  });
  const [openDeployModal, setOpenDeployModal] = useState<{
    show: boolean;
    width: number | string;
    source: SourceType;
    initialValues: any;
    isGGUF?: boolean;
  }>({
    show: false,
    width: 600,
    source: modelSourceMap.local_path_value as SourceType,
    initialValues: {},
    isGGUF: false
  });

  useEffect(() => {
    getWorkerOptionList();
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

  const checkIsGGUF = (record: ListItem) => {
    const isGGUF = _.includes(record.resolved_paths?.[0], 'gguf');
    const isOllama = !!record.ollama_library_model_name;
    return isGGUF || isOllama;
  };

  const generateInitialValues = (record: ListItem, gpuOptions: any[]) => {
    const isGGUF = checkIsGGUF(record);
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

    // select the worker current model file is downloaded to.
    const targetWorker = _.find(workersList, { value: record.worker_id })
      ?.labels?.['worker-name'];

    return {
      cluster_id: workersList?.find(
        (worker) => worker.value === record.worker_id
      )?.cluster_id,
      source: modelSourceMap.local_path_value,
      local_path: record.resolved_paths?.[0],
      worker_selector: targetWorker
        ? {
            'worker-name': targetWorker
          }
        : {},
      name: extractFileName(name),
      backend: checkCurrentbackend({
        isGGUF: !audioModelTag && isGGUF,
        isAudio: !!audioModelTag,
        gpuOptions: gpuOptions,
        defaultBackend: backendOptionsMap.vllm
      }),
      isGGUF: !audioModelTag && isGGUF
    };
  };

  const handleSelect = useMemoizedFn(async (val: any, record: ListItem) => {
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

        const initialValues = generateInitialValues(record, []);
        setOpenDeployModal({
          ...openDeployModal,
          initialValues: initialValues,
          isGGUF: initialValues.isGGUF,
          show: true
        });
      }
    } catch (error) {
      // console.log('error', error);
    }
  });

  const handleClickDropdown = (item: any) => {
    const config = modalConfig[item.key];
    const hasLinuxWorker = workersList.some(
      (worker) => _.toLower(worker.labels?.os) === 'linux'
    );
    if (config) {
      setDownlaodMoalStatus({ ...config, hasLinuxWorker });
    }
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-files" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText={intl.formatMessage({ id: 'noresult.modelfiles.nofound' })}
        title={intl.formatMessage({ id: 'noresult.modelfiles.title' })}
        subTitle={intl.formatMessage({ id: 'noresult.modelfiles.subTitle' })}
      ></NoResult>
    );
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

  const columns = useFilesColumns({
    handleSelect,
    sortOrder,
    workersList
  });

  const readyWorkers = useMemo(() => {
    return workerOptions.map((item) => {
      item.children = item.children?.filter(
        (child) => child.state === WorkerStatusMap.ready
      );
      return item;
    });
  }, [workerOptions]);

  return (
    <>
      <PageBox>
        <FilterBar
          marginBottom={22}
          marginTop={30}
          actionType="dropdown"
          selectHolder={intl.formatMessage({ id: 'resources.filter.worker' })}
          inputHolder={intl.formatMessage({ id: 'resources.filter.path' })}
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
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            scroll={{
              x: 900
            }}
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
          workerOptions={readyWorkers}
          workersList={workersList}
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
          initialValues={openDeployModal.initialValues}
          isGGUF={openDeployModal.isGGUF}
          clusterList={clusterList}
        ></DeployModal>
      </PageBox>
    </>
  );
};

export default ModelFiles;
