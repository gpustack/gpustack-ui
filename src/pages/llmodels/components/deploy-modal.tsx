import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { PageActionType } from '@/config/types';
import { ProviderValueMap } from '@/pages/cluster-management/config';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import _ from 'lodash';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import ColumnWrapper from '../../_components/column-wrapper';
import { defaultFormValues, deployFormKeyMap, modelSourceMap } from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { FormData, SourceType } from '../config/types';
import DataForm from '../forms';
import {
  MessageStatus,
  WarningStausOptions,
  useCheckCompatibility,
  useSelectModel
} from '../hooks';
import useCheckBackend from '../hooks/use-check-backend';
import CompatibilityAlert from './compatible-alert';
import GGUFResult from './gguf-result';
import ModelCard from './model-card';
import SearchModel from './search-model';
import Separator from './separator';
import TitleWrapper from './title-wrapper';

const pickFieldsFromSpec = ['backend_version', 'backend_parameters', 'env'];
const dropFieldsFromForm = ['name', 'file_name', 'repo_id', 'backend'];
const resetFields = ['worker_selector', 'env'];

const ModalFooterStyle = {
  padding: '16px 24px',
  display: 'flex',
  justifyContent: 'flex-end'
};

const Container = styled.div`
  display: flex;
  height: 100%;
`;

const ColWrapper = styled.div`
  display: flex;
  flex: 1;
  max-width: 33.33%;
`;

const FormWrapper = styled.div`
  display: flex;
  flex: 1;
  maxwidth: 100%;
`;

type AddModalProps = {
  title: string;
  hasLinuxWorker?: boolean;
  action: PageActionType;
  open: boolean;
  source: SourceType;
  isGGUF?: boolean;
  width?: string | number;
  initialValues?: any;
  deploymentType?: 'modelList' | 'modelFiles';
  clusterList: Global.BaseOption<
    number,
    { provider: string; state: string | number }
  >[];
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

type EvaluateProccessType = 'model' | 'file' | 'form';

const EvaluateProccess: Record<string, EvaluateProccessType> = {
  model: 'model',
  file: 'file',
  form: 'form'
};

const AddModal: FC<AddModalProps> = (props) => {
  const {
    title,
    open,
    onOk,
    onCancel,
    hasLinuxWorker,
    source,
    action,
    width = 600,
    deploymentType = 'modelList',
    initialValues,
    clusterList
  } = props || {};
  const SEARCH_SOURCE = [
    modelSourceMap.huggingface_value,
    modelSourceMap.modelscope_value
  ];

  const { checkOnlyAscendNPU } = useCheckBackend();
  const {
    handleShowCompatibleAlert,
    setWarningStatus,
    handleBackendChangeBefore,
    cancelEvaluate,
    unlockWarningStatus,
    handleOnValuesChange: handleOnValuesChangeBefore,
    clearCahceFormValues,
    warningStatus,
    submitAnyway
  } = useCheckCompatibility();
  const { onSelectModel } = useSelectModel({ gpuOptions: [] });
  const form = useRef<any>({});
  const intl = useIntl();
  const [selectedModel, setSelectedModel] = useState<any>({});
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isGGUF, setIsGGUF] = useState<boolean>(false);
  const modelFileRef = useRef<any>(null);
  const evaluateStateRef = useRef<{
    state: EvaluateProccessType;
    requestModelId: number;
  }>({
    state: 'form',
    requestModelId: 0
  });
  const requestModelIdRef = useRef<number>(0);
  const currentSelectedModel = useRef<any>({});

  const updateSelectedModel = (model: any) => {
    currentSelectedModel.current = model;
    setSelectedModel(model);
  };

  /**
   * Update the request model id to distinguish
   * the evaluate request.
   */
  const updateRequestModelId = () => {
    requestModelIdRef.current += 1;
    return requestModelIdRef.current;
  };

  /**
   *
   * @param state target to distinguish the evaluate state, current evaluate state
   *              can be 'model', 'file' or 'form'.
   */
  const setEvaluteState = (state: {
    state: EvaluateProccessType;
    requestModelId: number;
  }) => {
    evaluateStateRef.current = state;
  };

  const handleOnValuesChange = (data: {
    changedValues: any;
    allValues: any;
    source: SourceType;
  }) => {
    setEvaluteState({
      state: EvaluateProccess.form,
      requestModelId: updateRequestModelId()
    });
    handleOnValuesChangeBefore(data);
  };

  const getDefaultSpec = (item: any) => {
    const defaultSpec = _.pick(
      item.evaluateResult?.default_spec,
      pickFieldsFromSpec
    );

    return defaultSpec;
  };

  const getCategory = (item: any) => {
    const categories = item.evaluateResult?.default_spec?.categories || [];
    if (Array.isArray(categories)) {
      return categories?.[0] || null;
    }
    return categories || null;
  };

  const handleCancelFiles = () => {
    cancelEvaluate();
    modelFileRef.current?.cancelRequest();
  };

  const generateNameValue = (
    item: any,
    modelName: string,
    manual?: boolean
  ) => {
    if (item.name === currentSelectedModel.current.name) {
      return manual ? modelName : form.current?.getFieldValue?.('name');
    }
    return modelName;
  };

  const currentModelDuringEvaluate = (item: any) => {
    return (
      evaluateStateRef.current.state === EvaluateProccess.form &&
      item.name === currentSelectedModel.current.name
    );
  };

  const handleOnSelectModel = async (item: any, manual?: boolean) => {
    // If the item is empty or the same as the selected model, do nothing

    handleCancelFiles();
    if (
      _.isEmpty(item) ||
      (item.isGGUF === selectedModel.isGGUF && item.name === selectedModel.name)
    ) {
      return;
    }
    console.log('handleOnSelectModel:', item, selectedModel);
    setIsGGUF(item.isGGUF);
    clearCahceFormValues();
    unlockWarningStatus();
    setEvaluteState({
      state: EvaluateProccess.model,
      requestModelId: updateRequestModelId()
    });
    updateSelectedModel(item);

    // TODO
    form.current?.resetFields(resetFields);
    const modelInfo = onSelectModel(item, props.source);
    form.current?.setFieldsValue?.({
      ...defaultFormValues,
      ...modelInfo,
      categories: getCategory(item)
    });

    let warningStatus: MessageStatus = {
      show: true,
      title: '',
      type: 'transition',
      message: intl.formatMessage({ id: 'models.form.evaluating' })
    };

    if (item.isGGUF) {
      warningStatus.type = 'danger';
      warningStatus.message = 'GGUF model is not supported.';
    }
    setWarningStatus(warningStatus, { override: true });
  };

  const handleOnSelectModelAfterEvaluate = (item: any, manual?: boolean) => {
    if (currentModelDuringEvaluate(item)) {
      return;
    }

    if (manual) {
      form.current?.resetFields(resetFields);
    }
    console.log('isgguf==================> select 2', item.isGGUF);
    // If the item is empty
    setIsGGUF(item.isGGUF);
    updateSelectedModel(item);
    setEvaluteState({
      state: EvaluateProccess.model,
      requestModelId: updateRequestModelId()
    });
    handleCancelFiles();
    const modelInfo = onSelectModel(item, props.source);

    if (
      evaluateStateRef.current.state === EvaluateProccess.model &&
      item.evaluated
    ) {
      handleShowCompatibleAlert(item.evaluateResult);

      const newFormValues = {
        ...(manual
          ? { ...defaultFormValues }
          : _.omit(form.current?.form?.getFieldsValue?.(), [
              ...dropFieldsFromForm
            ])),
        ...getDefaultSpec(item),
        ...modelInfo,
        name: generateNameValue(item, modelInfo.name, manual),
        categories: getCategory(item)
      };

      console.log('newFormValues:', newFormValues);

      form.current?.form?.setFieldsValue?.(newFormValues);

      handleOnValuesChangeBefore({
        changedValues: {},
        allValues: newFormValues,
        source: props.source
      });
    }
  };

  const handleOnOk = async (allValues: FormData) => {
    console.log('handleOnOk:', allValues);
    onOk(allValues);
  };

  const handleSubmitAnyway = async () => {
    submitAnyway.current = true;
    form.current?.submit?.();
  };

  const handleSumit = () => {
    form.current?.submit?.();
  };

  const handleSetIsGGUF = async (flag: boolean) => {
    console.log('isgguf==================>', flag);
    setIsGGUF(flag);
  };

  const handleBackendChange = async (backend: string) => {
    setIsGGUF(false);

    const data = form.current.form.getFieldsValue?.();
    const res = handleBackendChangeBefore(data);
    if (res.show) {
      return;
    }
    if (data.local_path || props.source !== modelSourceMap.local_path_value) {
      // TODO confirm wheather it is gguf by model file not by backend
      handleOnValuesChange?.({
        changedValues: {},
        // allValues:
        //   backend === backendOptionsMap.llamaBox
        //     ? data
        //     : _.omit(data, [
        //         'cpu_offloading',
        //         'distributed_inference_across_workers'
        //       ]),
        allValues: data,
        source: props.source
      });
    }
  };

  const onValuesChange = async (changedValues: any, allValues: any) => {
    handleOnValuesChange?.({
      changedValues,
      allValues,
      source: props.source
    });
  };

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const initClusterId = () => {
    if (initialValues?.cluster_id) {
      return initialValues.cluster_id;
    }
    const cluster_id =
      clusterList?.find((item) => item.provider === ProviderValueMap.Docker)
        ?.value || clusterList?.[0]?.value;

    return cluster_id;
  };

  const handleOnOpen = () => {
    if (props.deploymentType === 'modelFiles') {
      form.current?.form?.setFieldsValue({
        ...props.initialValues
      });
      handleOnValuesChange?.({
        changedValues: {},
        allValues: {
          ...props.initialValues
        },
        source: source
      });
    } else {
      let backend = checkOnlyAscendNPU([])
        ? backendOptionsMap.ascendMindie
        : backendOptionsMap.vllm;

      form.current?.setFieldsValue?.({
        backend,
        cluster_id: initClusterId()
      });
    }
  };

  const showExtraButton = useMemo(() => {
    return warningStatus.show && warningStatus.type !== 'success';
  }, [warningStatus.show, warningStatus.type]);

  // This is only a placeholder for querying the model or file during the transition period.
  const displayEvaluateStatus = (
    params: MessageStatus,
    options?: WarningStausOptions
  ) => {
    setWarningStatus(
      {
        show: params.show,
        title: '',
        type: 'transition',
        message: intl.formatMessage({ id: 'models.form.evaluating' })
      },
      options
    );
  };

  useEffect(() => {
    if (open) {
      handleOnOpen();
      form.current?.getGPUOptionList?.({
        clusterId: initClusterId()
      });
      form.current?.getBackendOptions?.({
        cluster_id: initClusterId()
      });
    } else {
      cancelEvaluate();
      clearCahceFormValues();
    }
    return () => {
      setSelectedModel({});
      setWarningStatus({
        show: false,
        title: '',
        message: []
      });
    };
  }, [open, clusterList, initialValues?.cluster_id]);

  return (
    <GSDrawer
      title={title}
      open={open}
      onClose={handleCancel}
      destroyOnHidden={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      zIndex={2000}
      styles={{
        body: {
          height: 'calc(100vh - 57px)',
          padding: '16px 0',
          overflowX: 'hidden'
        },
        content: {
          borderRadius: '6px 0 0 6px'
        }
      }}
      width={width}
      footer={false}
    >
      <Container>
        {SEARCH_SOURCE.includes(props.source) &&
          deploymentType === 'modelList' && (
            <>
              <ColWrapper>
                <SearchModel
                  hasLinuxWorker={hasLinuxWorker}
                  modelSource={props.source}
                  onSelectModel={handleOnSelectModel}
                  onSelectModelAfterEvaluate={handleOnSelectModelAfterEvaluate}
                  clusterId={
                    form.current?.getFieldValue?.('cluster_id') ||
                    initClusterId()
                  }
                  displayEvaluateStatus={displayEvaluateStatus}
                  gpuOptions={[]}
                ></SearchModel>
                <Separator></Separator>
              </ColWrapper>
              <ColWrapper>
                <ColumnWrapper styles={{ container: { paddingTop: 0 } }}>
                  <ModelCard
                    selectedModel={selectedModel}
                    onCollapse={setCollapsed}
                    collapsed={collapsed}
                    modelSource={props.source}
                    setIsGGUF={handleSetIsGGUF}
                  ></ModelCard>
                  {isGGUF && <GGUFResult></GGUFResult>}
                </ColumnWrapper>
                <Separator></Separator>
              </ColWrapper>
            </>
          )}

        <FormWrapper>
          <ColumnWrapper
            paddingBottom={warningStatus.show ? 170 : 50}
            styles={{
              container: { paddingTop: 0 }
            }}
            footer={
              <>
                <CompatibilityAlert
                  showClose={true}
                  onClose={() => {
                    setWarningStatus({
                      show: false,
                      message: ''
                    });
                  }}
                  warningStatus={warningStatus}
                  contentStyle={{ paddingInline: 0 }}
                ></CompatibilityAlert>
                <ModalFooter
                  onCancel={handleCancel}
                  onOk={handleSumit}
                  showOkBtn={!showExtraButton}
                  extra={
                    showExtraButton && (
                      <Button
                        type="primary"
                        onClick={handleSubmitAnyway}
                        disabled={isGGUF}
                      >
                        {intl.formatMessage({
                          id: 'models.form.submit.anyway'
                        })}
                      </Button>
                    )
                  }
                  style={ModalFooterStyle}
                ></ModalFooter>
              </>
            }
          >
            <>
              {SEARCH_SOURCE.includes(source) &&
                deploymentType === 'modelList' && (
                  <TitleWrapper>
                    {intl.formatMessage({ id: 'models.form.configurations' })}
                  </TitleWrapper>
                )}
              <DataForm
                formKey={deployFormKeyMap.deployment}
                initialValues={initialValues}
                source={source}
                action={action}
                clusterList={clusterList}
                onOk={handleOnOk}
                ref={form}
                isGGUF={isGGUF}
                onBackendChange={handleBackendChange}
                onValuesChange={onValuesChange}
              ></DataForm>
            </>
          </ColumnWrapper>
        </FormWrapper>
      </Container>
    </GSDrawer>
  );
};

export default AddModal;
