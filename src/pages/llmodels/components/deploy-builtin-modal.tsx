import ModalFooter from '@/components/modal-footer';
import { PageActionType } from '@/config/types';
import { createAxiosToken } from '@/hooks/use-chunk-request';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer } from 'antd';
import _ from 'lodash';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { queryCatalogItemSpec } from '../apis';
import {
  backendOptionsMap,
  modelCategoriesMap,
  sourceOptions
} from '../config';
import { CatalogSpec, FormData, ListItem } from '../config/types';
import { useGenerateFormEditInitialValues } from '../hooks';
import ColumnWrapper from './column-wrapper';
import DataForm from './data-form';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  data?: ListItem;
  source: string;
  width?: string | number;
  current?: any;
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

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

  const handleSumit = () => {
    form.current?.submit?.();
  };

  const getDefaultQuant = (data: { category: string; quantOption: string }) => {
    if (
      data.category === modelCategoriesMap.embedding ||
      data.category === modelCategoriesMap.reranker
    ) {
      return EmbeddingRerankFirstQuant.includes(_.toUpper(data.quantOption));
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
      ..._.omit(spec, ['name']),
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
          quantOption: item.value
        })
      )?.value ||
      _.get(list, '0.value', '')
    );
  };

  const handleBackendChange = (backend: string) => {
    if (backend === backendOptionsMap.vllm) {
      setIsGGUF(false);
    }

    if (backend === backendOptionsMap.llamaBox) {
      setIsGGUF(true);
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
      ...data
    });
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

      const defaultSpec =
        _.find(list, (item: CatalogSpec) => {
          return getDefaultQuant({
            category: _.get(current, 'categories.0', ''),
            quantOption: item.quantization
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
      form.current.setFieldValue(
        'name',
        _.toLower(current.name).replace(/\s/g, '-') || ''
      );
      if (defaultSpec.backend === backendOptionsMap.vllm) {
        setIsGGUF(false);
      }

      if (defaultSpec.backend === backendOptionsMap.llamaBox) {
        setIsGGUF(true);
      }
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
      ...data
    });
  };

  const handleOnSizeChange = (val: number) => {
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
      ...data
    });
  };

  const handleOk = (values: FormData) => {
    onOk({
      ..._.omit(selectSpecRef.current, ['name']),
      ...values
    });
  };

  const handleCancel = useCallback(() => {
    onCancel?.();
    axiosToken.current?.cancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (open) {
      fetchSpecData();
    }
    return () => {
      axiosToken.current?.cancel?.();
    };
  }, [open, current]);

  useEffect(() => {
    getGPUList().then((data) => {
      setGpuOptions(data);
    });
  }, []);

  return (
    <Drawer
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
      <div style={{ display: 'flex', height: '100%' }}>
        <ColumnWrapper
          footer={
            <ModalFooter
              onCancel={handleCancel}
              onOk={handleSumit}
              style={{
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            ></ModalFooter>
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
              byBuiltIn={true}
              sourceDisable={false}
              backendOptions={backendList}
              sourceList={sourceList}
              quantizationOptions={quantizationOptions}
              sizeOptions={sizeOptions}
              gpuOptions={gpuOptions}
              onBackendChange={handleBackendChange}
              onSourceChange={handleSourceChange}
              onQuantizationChange={handleOnQuantizationChange}
              onSizeChange={handleOnSizeChange}
            ></DataForm>
          </>
        </ColumnWrapper>
      </div>
    </Drawer>
  );
};

export default memo(AddModal);
