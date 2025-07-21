import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { PageActionType } from '@/config/types';
import { createAxiosToken } from '@/hooks/use-chunk-request';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { queryCatalogItemSpec } from '../apis';
import {
  backendOptionsMap,
  defaultFormValues,
  modelCategoriesMap,
  sourceOptions
} from '../config';
import { FormContext } from '../config/form-context';
import { CatalogSpec, FormData, ListItem, SourceType } from '../config/types';
import {
  checkOnlyAscendNPU,
  useCheckCompatibility,
  useGenerateFormEditInitialValues
} from '../hooks';
import ColumnWrapper from './column-wrapper';
import CompatibilityAlert from './compatible-alert';
import DataForm from './data-form';

const pickFieldsFromSpec = [
  'backend_version',
  'backend_parameters',
  'env',
  'size',
  'quantization'
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

const backendOptions = [
  {
    label: `llama-box`,
    value: backendOptionsMap.llamaBox
  },
  {
    label: 'vLLM',
    value: backendOptionsMap.vllm
  },
  {
    label: 'Ascend Mindie',
    value: backendOptionsMap.ascendMindie
  },
  {
    label: 'vox-box',
    value: backendOptionsMap.voxBox
  }
];

const quantiCapitMap: Record<string, string> = {
  F16: 'FP16',
  f16: 'FP16',
  F32: 'FP32',
  f32: 'FP32'
};

const defaultQuant = ['Q4_K_M'];
const EmbeddingRerankFirstQuant = ['FP16', 'F16'];
const AscendNPUQuant_F16 = ['F16', 'FP16'];
const AscendNPUQuant_Q8 = ['Q8_0'];

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
    generateGPUIds,
    cancelEvaluate,
    submitAnyway,
    handleOnValuesChange,
    warningStatus
  } = useCheckCompatibility();
  const intl = useIntl();
  const { getGPUList } = useGenerateFormEditInitialValues();
  const form = useRef<any>({});
  const [gpuOptions, setGpuOptions] = useState<any[]>([]);
  const [isGGUF, setIsGGUF] = useState<boolean>(false);
  const [sourceList, setSourceList] = useState<any[]>([]);
  const [backendList, setBackendList] = useState<any[]>([]);
  const [sizeOptions, setSizeOptions] = useState<any[]>([]);
  const [quantizationOptions, setQuantizationOptions] = useState<any[]>([]);
  const sourceGroupMap = useRef<any>({});
  const axiosToken = useRef<any>(null);
  const selectSpecRef = useRef<CatalogSpec>({} as CatalogSpec);
  const specListRef = useRef<any[]>([]);
  const hasF16Ref = useRef<boolean>(false);

  const handleSumit = () => {
    form.current?.submit?.();
  };

  const handleSubmitAnyway = async () => {
    submitAnyway.current = true;
    form.current?.submit?.();
  };

  // use for size change and quantization change
  const pickSomeFieldsValue = (defaultSpec: CatalogSpec) => {
    const formData = form.current?.getFieldsValue();
    const currentData = _.pick(formData, Object.keys(defaultFormValues));

    // if the backend_parameters is empty, use the defaultSpec.backend_parameters
    return currentData;
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

  const getDefaultQuant = (data: {
    category: string;
    quantOption: string;
    backend: string;
    condidateQuant?: string[];
  }) => {
    if (
      data.category === modelCategoriesMap.embedding ||
      data.category === modelCategoriesMap.reranker
    ) {
      return EmbeddingRerankFirstQuant.includes(_.toUpper(data.quantOption));
    }

    if (
      data.backend === backendOptionsMap.llamaBox &&
      checkOnlyAscendNPU(gpuOptions)
    ) {
      return hasF16Ref.current
        ? AscendNPUQuant_F16.includes(_.toUpper(data.quantOption))
        : AscendNPUQuant_Q8.includes(_.toUpper(data.quantOption));
    }

    return defaultQuant.includes(_.toUpper(data.quantOption));
  };

  const getModelSpec = (data: {
    backend: string;
    size: number;
    quantization: string;
  }) => {
    const spec = _.find(specListRef.current, (item: CatalogSpec) => {
      if (data.size && data.quantization) {
        return (
          item.size === data.size &&
          item.backend === data.backend &&
          item.quantization === data.quantization
        );
      }
      if (data.size) {
        return item.size === data.size && item.backend === data.backend;
      }
      if (data.quantization) {
        return (
          item.quantization === data.quantization &&
          item.backend === data.backend
        );
      }
      return item.backend === data.backend;
    });
    selectSpecRef.current = spec;
    return {
      ..._.pick(spec, pickFieldsFromSpec),
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

  const handleSetSizeOptions = (data: { backend: string }) => {
    const sizeGroup = _.groupBy(
      _.filter(specListRef.current, (item: CatalogSpec) => {
        return item.backend === data.backend;
      }),
      'size'
    );

    const sizeList = _.keys(sizeGroup)
      .map((size: string) => {
        return {
          label: `${size}B`,
          value: _.toNumber(size)
        };
      })
      .filter((item: any) => item.value);
    const result = _.sortBy(sizeList, 'value');
    setSizeOptions(result);
    return result;
  };

  const handleSetQuantizationOptions = (data: {
    size: number;
    backend: string;
  }) => {
    const sizeGroup = _.filter(specListRef.current, (item: CatalogSpec) => {
      return item.size === data.size && item.backend === data.backend;
    });

    const quantizationList = _.map(sizeGroup, (item: CatalogSpec) => {
      return {
        label:
          quantiCapitMap[item.quantization] ?? _.toUpper(item.quantization),
        value: item.quantization
      };
    });
    const result = _.uniqBy(quantizationList, 'value');
    setQuantizationOptions(result);
    return result;
  };

  const handleSetBackendOptions = () => {
    const backendGroup = _.groupBy(specListRef.current, 'backend');

    const backendList = _.filter(backendOptions, (item: any) => {
      return backendGroup[item.value];
    });
    setBackendList(backendList);
    return backendList;
  };

  const handleCheckCompatibility = async (formData: FormData) => {
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
    handleSetSizeOptions({
      backend: defaultSpec.backend
    });
    handleSetQuantizationOptions({
      size: defaultSpec.size,
      backend: defaultSpec.backend
    });
    // set form value
    initFormDataBySource(defaultSpec);
    handleCheckFormData();
  };

  const checkSize = (list: any[]) => {
    return (
      _.find(
        list,
        (item: { label: string; value: string }) =>
          item.value === form.current.getFieldValue('size')
      )?.value || _.get(list, '0.value', 0)
    );
  };

  const checkQuantization = (list: any[]) => {
    return (
      _.find(
        list,
        (item: { label: string; value: string }) =>
          item.value === form.current.getFieldValue('quantization')
      )?.value ||
      _.find(list, (item: { label: string; value: string }) =>
        getDefaultQuant({
          category: _.get(current, 'categories.0', ''),
          quantOption: item.value,
          backend: form.current.getFieldValue('backend')
        })
      )?.value ||
      _.get(list, '0.value', '')
    );
  };

  const onValuesChange = async (changedValues: any, allValues: any) => {
    const data = {
      ..._.omit(selectSpecRef.current, ['name']),
      ...allValues
    };
    handleOnValuesChange?.({
      changedValues,
      allValues: data,
      source: props.source
    });
  };

  const handleBackendChange = (backend: string) => {
    if (backend === backendOptionsMap.llamaBox) {
      setIsGGUF(true);
    } else {
      setIsGGUF(false);
    }
    const sizeList = handleSetSizeOptions({
      backend: backend
    });

    const size = checkSize(sizeList);

    const quantizaList = handleSetQuantizationOptions({
      size: size,
      backend: backend
    });

    const quantization = checkQuantization(quantizaList);

    const data = getModelSpec({
      backend: backend,
      size: size,
      quantization: quantization
    });

    form.current.setFieldsValue({
      ...defaultFormValues,
      ...data
    });
    handleCheckFormData();
  };

  const fetchSpecData = async () => {
    try {
      axiosToken.current?.cancel?.();
      axiosToken.current = createAxiosToken();
      const res: any = await queryCatalogItemSpec(
        {
          id: current.id
        },
        {
          token: axiosToken.current.token
        }
      );
      const groupList = _.groupBy(res.items, 'source');

      sourceGroupMap.current = groupList;

      specListRef.current = res.items;

      const sources = _.filter(sourceOptions, (item: any) => {
        return groupList[item.value];
      });

      const list = _.sortBy(res.items, 'size');

      hasF16Ref.current = _.some(res.items, (item: CatalogSpec) => {
        return AscendNPUQuant_F16.includes(_.toUpper(item.quantization));
      });

      const defaultSpec =
        _.find(list, (item: CatalogSpec) => {
          return getDefaultQuant({
            category: _.get(current, 'categories.0', ''),
            quantOption: item.quantization,
            backend: item.backend
          });
        }) || _.get(res.items, `0`, {});

      selectSpecRef.current = defaultSpec;
      setSourceList(sources);
      handleSetBackendOptions();
      handleSetSizeOptions({
        backend: defaultSpec.backend
      });
      handleSetQuantizationOptions({
        size: defaultSpec.size,
        backend: defaultSpec.backend
      });
      initFormDataBySource(defaultSpec);

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
        name
      });
      handleCheckCompatibility(allValues);
    } catch (error) {
      // ignore
    }
  };

  const handleOnQuantizationChange = (val: string) => {
    const data = getModelSpec({
      backend: form.current.getFieldValue('backend'),
      size: form.current.getFieldValue('size'),
      quantization: val
    });
    form.current.setFieldsValue({
      ...data,
      ...pickSomeFieldsValue(data)
    });
    handleCheckFormData();
  };

  const handleOnSizeChange = (val: number) => {
    // TODO
    form.current.setFieldValue(defaultFormValues);
    const list = handleSetQuantizationOptions({
      backend: form.current.getFieldValue('backend'),
      size: val
    });

    const quantization = checkQuantization(list);

    const data = getModelSpec({
      backend: form.current.getFieldValue('backend'),
      size: val,
      quantization: quantization
    });

    // set form data
    form.current.setFieldsValue({
      ...defaultFormValues,
      ...data
    });
    handleCheckFormData();
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
    if (open) {
      fetchSpecData();
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

  useEffect(() => {
    getGPUList().then((data) => {
      setGpuOptions(data);
    });
  }, []);

  return (
    <GSDrawer
      title={
        <div className="flex-between flex-center">
          <span
            style={{
              color: 'var(--ant-color-text)',
              fontWeight: 'var(--font-weight-medium)',
              fontSize: 'var(--font-size-middle)'
            }}
          >
            {title}
          </span>
          <Button type="text" size="small" onClick={handleCancel}>
            <CloseOutlined></CloseOutlined>
          </Button>
        </div>
      }
      open={open}
      onClose={handleCancel}
      destroyOnClose={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
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
      <FormContext.Provider
        value={{
          isGGUF: isGGUF,
          byBuiltIn: true,
          sizeOptions: sizeOptions,
          quantizationOptions: quantizationOptions,
          pageAction: action,
          onSizeChange: handleOnSizeChange,
          onQuantizationChange: handleOnQuantizationChange,
          onValuesChange: onValuesChange
        }}
      >
        <FormWrapper>
          <ColumnWrapper
            paddingBottom={
              warningStatus.show
                ? Array.isArray(warningStatus.message)
                  ? 150
                  : 125
                : 50
            }
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
                      <Button type="primary" onClick={handleSubmitAnyway}>
                        {intl.formatMessage({
                          id: 'models.form.submit.anyway'
                        })}
                      </Button>
                    )
                  }
                  style={{
                    padding: '16px 24px',
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
                selectedModel={{}}
                onOk={handleOk}
                ref={form}
                isGGUF={isGGUF}
                sourceDisable={false}
                backendOptions={backendList}
                sourceList={sourceList}
                gpuOptions={gpuOptions}
                onBackendChange={handleBackendChange}
                onSourceChange={handleSourceChange}
                onValuesChange={onValuesChange}
              ></DataForm>
            </>
          </ColumnWrapper>
        </FormWrapper>
      </FormContext.Provider>
    </GSDrawer>
  );
};

export default AddModal;
