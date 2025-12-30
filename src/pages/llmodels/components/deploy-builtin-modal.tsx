import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { PageActionType } from '@/config/types';
import { createAxiosToken } from '@/hooks/use-chunk-request';
import { ClusterStatusValueMap } from '@/pages/cluster-management/config';
import { useIntl } from '@umijs/max';
import { Button, message } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import ColumnWrapper from '../../_components/column-wrapper';
import { queryCatalogItemSpec } from '../apis';
import { DeployFormKeyMap, sourceOptions } from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { CatalogFormContext } from '../config/form-context';
import { CatalogSpec, FormData, ListItem, SourceType } from '../config/types';
import { generateGPUIds } from '../config/utils';
import DataForm from '../forms';
import { useCheckCompatibility } from '../hooks';
import useFormInitialValues from '../hooks/use-form-initial-values';
import CompatibilityAlert from './compatible-alert';

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

const pickFieldsFromSpec = [
  'env',
  'size',
  'source',
  'quantization',
  'backend_version',
  'backend_parameters',
  'backend',
  'extended_kv_cache',
  'speculative_config'
];

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  data?: ListItem;
  source: SourceType;
  width?: string | number;
  current?: any;
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const FormWrapper = styled.div`
  display: flex;
  flex: 1;
  height: 100%;
  maxwidth: 100%;
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
  const axiosToken = useRef<any>(null);
  const selectSpecRef = useRef<CatalogSpec>({} as CatalogSpec);
  const specListRef = useRef<any[]>([]);
  const noCompatibleGPUsRef = useRef<boolean>(false);

  const handleSumit = () => {
    form.current?.submit?.();
  };

  const handleSubmitAnyway = async () => {
    if (noCompatibleGPUsRef.current) {
      message.error(intl.formatMessage({ id: 'models.catalog.nogpus.tips' }));
      return;
    }
    submitAnyway.current = true;
    form.current?.submit?.();
  };

  const generateSubmitData = (formData: FormData) => {
    const gpuSelector = generateGPUIds(formData);
    const data = {
      ..._.omit(selectSpecRef.current, ['name']),
      ...formData,
      ...gpuSelector
    };

    return data;
  };

  const getModelSpec = (data: {
    mode?: string;
    backend: string;
    size: number;
    quantization: string;
  }) => {
    const defaultSpec = _.find(
      specListRef.current,
      (item: CatalogSpec) => item.mode === data.mode
    );
    selectSpecRef.current = defaultSpec;
    return {
      ..._.pick(defaultSpec, pickFieldsFromSpec),
      categories: _.get(current, 'categories.0', null)
    };
  };

  const initFormDataBySource = (data: CatalogSpec) => {
    selectSpecRef.current = data;
    form.current?.setFieldsValue({
      ..._.omit(data, ['name']),
      categories: _.get(current, 'categories.0', null)
    });
  };

  const handleCheckCompatibility = async (formData: FormData) => {
    // no compatible gpus, do nothing
    if (noCompatibleGPUsRef.current) {
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
    const defaultSpec = _.get(sourceGroupMap.current, `${source}.0`, {});
    initFormDataBySource(defaultSpec);

    // set form value
    initFormDataBySource(defaultSpec);
    handleCheckFormData();
  };

  const onValuesChange = async (changedValues: any, allValues: any) => {
    const data = {
      ..._.omit(selectSpecRef.current, ['name']),
      ...allValues
    };

    // no compatible gpus, do nothing
    if (noCompatibleGPUsRef.current) {
      return;
    }
    handleOnValuesChange?.({
      changedValues,
      allValues: data,
      source: props.source
    });
  };

  const handleBackendChange = (backend: string) => {
    handleCheckFormData();
  };

  const initClusterId = (): number => {
    const defaultCluster = clusterList?.find((item) => item.is_default);
    if (defaultCluster) {
      return defaultCluster.value;
    }
    const cluster_id =
      clusterList?.find((item) => item.state === ClusterStatusValueMap.Ready)
        ?.value || clusterList?.[0]?.value;

    return cluster_id as number;
  };

  const fetchSpecData = async (clusterId: number) => {
    try {
      axiosToken.current?.cancel?.();
      axiosToken.current = createAxiosToken();
      const res: any = await queryCatalogItemSpec(
        {
          id: current.id,
          cluster_id: clusterId
        },
        {
          token: axiosToken.current.token
        }
      );
      const groupList = _.groupBy(res.items, 'source');

      const modes: string[] = res.items?.map((item: CatalogSpec) => {
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

      specListRef.current = res.items;

      const sources = _.filter(sourceOptions, (item: any) => {
        return groupList[item.value];
      });

      const list = _.sortBy(res.items, 'size');

      const defaultSpec =
        _.find(
          list,
          (item: CatalogSpec) => item.mode === modeDataList[0]?.value
        ) || {};

      selectSpecRef.current = defaultSpec;

      setModeList(modeDataList);
      setSourceList(sources);
      initFormDataBySource({
        ...defaultSpec,
        cluster_id: clusterId
      });

      const name = _.toLower(current.name).replace(/\s/g, '-') || '';
      form.current.setFieldValue('name', name);

      if (defaultSpec.backend === backendOptionsMap.llamaBox) {
        setIsGGUF(true);
      } else {
        setIsGGUF(false);
      }
      const allValues = generateSubmitData({
        ...defaultSpec,
        categories: _.get(current, 'categories.0', null),
        cluster_id: clusterId,
        name
      });

      // If no avaliable gpus for the model, show warning message
      if (!res.items.length) {
        noCompatibleGPUsRef.current = true;
        setWarningStatus({
          show: true,
          type: 'warning',
          message: intl.formatMessage({ id: 'models.catalog.nogpus.tips' })
        });
        return;
      }
      noCompatibleGPUsRef.current = false;
      handleCheckCompatibility(allValues);
    } catch (error) {
      // ignore
    }
  };

  const handleOnModeChange = (val: string) => {
    const data = getModelSpec({
      mode: val,
      backend: form.current.getFieldValue('backend'),
      size: 0,
      quantization: ''
    });

    console.log('mode change data:', data);

    form.current.setFieldsValue({
      ...data
    });
    handleCheckFormData();
  };

  const handleOnClusterChange = async (clusterId: number) => {
    await fetchSpecData(clusterId);
  };

  const handleOk = async (values: FormData) => {
    const data = {
      ..._.omit(selectSpecRef.current, ['name']),
      ...values
    };
    onOk(data);
  };

  const handleCancel = () => {
    onCancel?.();
    axiosToken.current?.cancel?.();
  };

  const showExtraButton = useMemo(() => {
    return warningStatus.show && warningStatus.type !== 'success';
  }, [warningStatus.show, warningStatus.type]);

  useEffect(() => {
    getClusterList();
    getWorkerList();
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const clusterId = initClusterId();
        fetchSpecData(clusterId);
        form.current?.getGPUOptionList?.({
          clusterId: clusterId
        });
        form.current?.getBackendOptions?.({
          cluster_id: clusterId
        });
      }, 100);
    }
    return () => {
      axiosToken.current?.cancel?.();
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
      maskClosable={false}
      keyboard={false}
      styles={{
        wrapper: { width: width }
      }}
      footer={false}
    >
      <CatalogFormContext.Provider
        value={{
          sizeOptions: [],
          quantizationOptions: [],
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
                  showOkBtn={!showExtraButton}
                  extra={
                    showExtraButton && (
                      <Button type="primary" onClick={handleSubmitAnyway}>
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
                fields={[]}
                source={source}
                action={action}
                onOk={handleOk}
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
