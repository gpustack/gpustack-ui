import { PageActionType } from '@/config/types';
import {
  ColumnWrapper,
  createAxiosToken,
  GSDrawer,
  ModalFooter
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, message } from 'antd';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { queryCatalogItemSpec } from '../../apis';
import {
  DeployFormKeyMap,
  mergeBackendParameters,
  sourceOptions
} from '../../config';
import { CatalogFormContext } from '../../config/form-context';
import {
  BackendOption,
  CatalogSpec,
  FormData,
  ListItem,
  SourceType
} from '../../config/types';
import { backendOptionsMap } from '../../constants/backend-parameters';
import DataForm from '../../forms';
import { useCheckCompatibility } from '../../hooks';
import useFormInitialValues from '../../hooks/use-form-initial-values';
import { generateGPUIds } from '../../utils';
import CompatibilityAlert from '../compatible-alert';
import { getCatalogFormValues } from './catalog-form-values';
import { resolveRuntimeChoice } from './runtime-choice';

const ModesMap: Record<string, string> = {
  latency: 'models.form.mode.latency',
  standard: 'models.form.mode.baseline',
  throughput: 'models.form.mode.throughput'
};

const ModesTipsMap: Record<string, string> = {
  latency: 'models.form.mode.latency.tips',
  standard: 'models.form.mode.baseline.tips',
  throughput: 'models.form.mode.throughput.tips'
};

// Stable empty defaults: inline `[]` literals would be a new reference on every
// render, invalidating the context value and the form's `fields` prop.
const EMPTY_SIZE_OPTIONS: Global.BaseOption<number>[] = [];
const EMPTY_QUANTIZATION_OPTIONS: Global.BaseOption<string>[] = [];
const EMPTY_FIELDS: string[] = [];

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  data?: ListItem;
  source: SourceType;
  width?: string | number;
  current?: any;
  onOk: (values: FormData) => void | Promise<void>;
  onCancel: () => void;
};

type CatalogSpecRequest = {
  clusterId: number;
  axiosToken: ReturnType<typeof createAxiosToken>;
  gpuOptionsController: AbortController;
  ready: boolean;
  noCompatibleGPUs: boolean;
  backendOptions: BackendOption[];
};

const FormWrapper = styled.div`
  display: flex;
  flex: 1;
  height: 100%;
  max-width: 100%;
`;

const AddModal: React.FC<AddModalProps> = (props) => {
  const {
    title,
    open,
    onOk,
    onCancel,
    source,
    action,
    current,
    width = 600
  } = props || {};
  const {
    setWarningStatus,
    handleDoEvalute,
    cancelEvaluate,
    clearCacheFormValues,
    submitAnyway,
    handleOnValuesChange,
    warningStatus
  } = useCheckCompatibility();
  const { getClusterList, getWorkerList, clusterList } = useFormInitialValues();
  const intl = useIntl();
  const form = useRef<any>({});
  const [isGGUF, setIsGGUF] = useState<boolean>(false);
  const [sourceList, setSourceList] = useState<any[]>([]);
  const [modeList, setModeList] = useState<
    Global.BaseOption<string, { isBuiltIn: boolean; tips: string }>[]
  >([]);
  const sourceGroupMap = useRef<any>({});
  const specRequestRef = useRef<CatalogSpecRequest | null>(null);
  const specListRef = useRef<CatalogSpec[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [specLoading, setSpecLoading] = useState(false);
  const submitloadingRef = useRef<boolean>(false);

  const isSpecReady = () => {
    const request = specRequestRef.current;
    return (
      !!request?.ready &&
      request.clusterId === form.current?.getFieldValue?.('cluster_id')
    );
  };

  const handleSumit = () => {
    if (submitloadingRef.current || !isSpecReady()) {
      return;
    }
    submitloadingRef.current = true;
    form.current?.submit?.();
  };

  const handleSubmitAnyway = async () => {
    if (!isSpecReady()) {
      return;
    }
    if (specRequestRef.current?.noCompatibleGPUs) {
      message.error(intl.formatMessage({ id: 'models.catalog.nogpus.tips' }));
      return;
    }
    submitAnyway.current = true;
    handleSumit();
  };

  const onFinishFailed = () => {
    submitloadingRef.current = false;
  };

  const generateSubmitData = (formData: FormData) => {
    const gpuSelector = generateGPUIds(formData);
    return getCatalogFormValues(form.current, {
      ..._.omit(formData, ['scheduleType', 'manualGpuMode', 'pdMode']),
      ...gpuSelector
    });
  };

  const getModelSpec = (mode: string) => {
    const defaultSpec = _.find(
      specListRef.current,
      (item: CatalogSpec) => item.mode === mode
    );
    return {
      ..._.omit(defaultSpec, ['name']),
      categories: _.get(current, 'categories.0', null)
    };
  };

  const applyCatalogSpec = (data: Partial<CatalogSpec>) => {
    const runtimeChoice = resolveRuntimeChoice(data);
    const defaultBackendParams = specRequestRef.current?.backendOptions.find(
      (item) => item.value === data.backend
    )?.default_backend_param;
    form.current?.applyCatalogSpec({
      ..._.omit(data, ['name', ...Object.keys(runtimeChoice)]),
      backend_parameters: mergeBackendParameters(
        defaultBackendParams,
        data.backend_parameters ?? []
      ),
      categories: _.get(current, 'categories.0', null)
    });
    form.current?.applyRuntimeChoice(runtimeChoice);
  };

  const warnIfNoCompatibleGPUs = () => {
    if (!specRequestRef.current?.noCompatibleGPUs) {
      return false;
    }
    cancelEvaluate();
    clearCacheFormValues();
    setWarningStatus({
      show: true,
      type: 'warning',
      message: intl.formatMessage({ id: 'models.catalog.nogpus.tips' })
    });
    return true;
  };

  const handleCheckCompatibility = async (formData: FormData) => {
    if (warnIfNoCompatibleGPUs()) {
      return;
    }
    handleDoEvalute(formData);
  };

  const handleCheckFormData = () => {
    const values = form.current?.getFieldsValue();
    const allValues = generateSubmitData(values);
    handleCheckCompatibility(allValues);
  };

  const handleSourceChange = (source: string) => {
    if (!isSpecReady()) return;
    const defaultSpec = _.get(sourceGroupMap.current, `${source}.0`, {});
    // set form value
    applyCatalogSpec(defaultSpec);
    handleCheckFormData();
  };

  const onValuesChange = async (changedValues: any, allValues: any) => {
    if (!isSpecReady() || specRequestRef.current?.noCompatibleGPUs) {
      return;
    }
    handleOnValuesChange?.({
      changedValues,
      allValues: getCatalogFormValues(form.current, allValues),
      source: props.source
    });
  };

  const handleBackendChange = (backend: string) => {
    if (!isSpecReady()) return;
    const defaultBackendParameters =
      specRequestRef.current?.backendOptions.find(
        (item) => item.value === backend
      )?.default_backend_param;

    form.current?.setFieldsValue({
      backend_parameters: mergeBackendParameters(
        defaultBackendParameters,
        form.current?.getFieldValue('backend_parameters') || []
      )
    });

    handleCheckFormData();
  };

  const cancelSpecRequest = () => {
    const request = specRequestRef.current;
    specRequestRef.current = null;
    request?.axiosToken.cancel();
    request?.gpuOptionsController.abort();
    setSpecLoading(false);
  };

  const handleOnClusterChange = async (clusterId: number) => {
    if (!open || current?.id == null) return;

    cancelSpecRequest();
    cancelEvaluate();
    clearCacheFormValues();
    setWarningStatus({ show: false, title: '', message: [] });
    const request: CatalogSpecRequest = {
      clusterId,
      axiosToken: createAxiosToken(),
      gpuOptionsController: new AbortController(),
      ready: false,
      noCompatibleGPUs: false,
      backendOptions: []
    };
    const isCurrent = () =>
      specRequestRef.current === request &&
      form.current?.getFieldValue?.('cluster_id') === clusterId;
    specRequestRef.current = request;
    setSpecLoading(true);
    form.current
      ?.getGPUOptionList?.({
        clusterId,
        signal: request.gpuOptionsController.signal
      })
      ?.catch(() => {});
    try {
      const [{ items }, backendOptions] = await Promise.all([
        queryCatalogItemSpec(
          { id: current.id, cluster_id: clusterId },
          { cancelToken: request.axiosToken.token }
        ),
        form.current.getBackendOptions({ cluster_id: clusterId }, isCurrent)
      ]);
      if (!isCurrent() || backendOptions == null) return;

      request.backendOptions = backendOptions;
      request.noCompatibleGPUs = !items.length;
      const groupList = _.groupBy(items, 'source');

      const modes = items.map((item) => {
        return item.mode;
      });

      const modeDataList = [...new Set(modes)].map((key: string) => {
        return {
          label: _.get(ModesMap, key, key || ''),
          isBuiltIn: ModesMap[key] ? true : false,
          value: key,
          tips: _.get(ModesTipsMap, key, '')
        };
      });

      sourceGroupMap.current = groupList;

      specListRef.current = items;

      const sources = _.filter(sourceOptions, (item: any) => {
        return groupList[item.value];
      });

      const list = _.sortBy(items, 'size');

      const defaultSpec: Partial<CatalogSpec> =
        _.find(
          list,
          (item: CatalogSpec) => item.mode === modeDataList[0]?.value
        ) || {};

      setModeList(modeDataList);
      setSourceList(sources);
      applyCatalogSpec({ ...defaultSpec, cluster_id: clusterId });

      if (defaultSpec.backend === backendOptionsMap.llamaBox) {
        setIsGGUF(true);
      } else {
        setIsGGUF(false);
      }
      const name = _.toLower(current.name).replace(/\s/g, '-') || '';
      form.current.setFieldValue('name', name);
      const allValues = generateSubmitData(form.current.getFieldsValue(true));
      request.ready = true;
      handleCheckCompatibility(allValues);
    } catch (error) {
      // The request remains unready if either lookup fails.
    } finally {
      if (specRequestRef.current === request) {
        setSpecLoading(false);
      }
    }
  };

  const handleOnModeChange = (val: string) => {
    if (!isSpecReady()) return;
    const data = getModelSpec(val);

    applyCatalogSpec(data);
    handleCheckFormData();
  };

  const handleOk = async (values: FormData) => {
    const data = getCatalogFormValues(form.current, values);
    if (
      !isSpecReady() ||
      data.cluster_id !== specRequestRef.current?.clusterId ||
      warnIfNoCompatibleGPUs()
    ) {
      submitloadingRef.current = false;
      return;
    }
    setLoading(true);
    try {
      await onOk(data);
    } finally {
      setLoading(false);
      submitloadingRef.current = false;
    }
  };

  const handleCancel = () => {
    cancelSpecRequest();
    onCancel?.();
  };

  const showExtraButton =
    warningStatus.show && warningStatus.type !== 'success';

  useEffect(() => {
    getClusterList();
    getWorkerList();
  }, []);

  useEffect(() => {
    // BasicForm normally seeds the cluster. A retained selection can already
    // be present when the drawer opens or its catalog entry changes.
    const clusterId = form.current?.getFieldValue?.('cluster_id');
    if (open && clusterId != null && !specRequestRef.current) {
      handleOnClusterChange(clusterId);
    }
    return () => {
      cancelSpecRequest();
      cancelEvaluate();
      setWarningStatus({
        show: false,
        title: '',
        message: []
      });
    };
  }, [open, current]);

  return (
    <GSDrawer
      title={title}
      open={open}
      onClose={handleCancel}
      destroyOnHidden={true}
      closeIcon={false}
      mask={{
        closable: false
      }}
      keyboard={false}
      styles={{
        wrapper: { width: width }
      }}
      footer={false}
    >
      <CatalogFormContext.Provider
        value={{
          sizeOptions: EMPTY_SIZE_OPTIONS,
          quantizationOptions: EMPTY_QUANTIZATION_OPTIONS,
          modeList: modeList,
          onModeChange: handleOnModeChange
        }}
      >
        <FormWrapper>
          <ColumnWrapper
            styles={{
              container: {
                paddingBlock: 0
              }
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
                  contentStyle={{ paddingInline: '0 6px' }}
                ></CompatibilityAlert>
                <ModalFooter
                  onCancel={handleCancel}
                  onOk={handleSumit}
                  loading={loading || specLoading}
                  okBtnProps={{ disabled: !isSpecReady() }}
                  showOkBtn={!showExtraButton}
                  extra={
                    showExtraButton && (
                      <Button
                        type="primary"
                        loading={specLoading}
                        disabled={!isSpecReady()}
                        onClick={handleSubmitAnyway}
                      >
                        {intl.formatMessage({
                          id: 'models.form.submit.anyway'
                        })}
                      </Button>
                    )
                  }
                  style={{
                    padding: '16px 24px 8px',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}
                ></ModalFooter>
              </>
            }
          >
            <>
              <DataForm
                fields={EMPTY_FIELDS}
                source={source}
                action={action}
                onOk={handleOk}
                onFinishFailed={onFinishFailed}
                ref={form}
                isGGUF={isGGUF}
                formKey={DeployFormKeyMap.CATALOG}
                sourceDisable={false}
                sourceList={sourceList}
                clusterList={clusterList}
                onClusterChange={handleOnClusterChange}
                onBackendChange={handleBackendChange}
                onSourceChange={handleSourceChange}
                onValuesChange={onValuesChange}
                clearCacheFormValues={clearCacheFormValues}
              ></DataForm>
            </>
          </ColumnWrapper>
        </FormWrapper>
      </CatalogFormContext.Provider>
    </GSDrawer>
  );
};

export default AddModal;
