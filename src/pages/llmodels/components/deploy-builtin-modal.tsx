import ModalFooter from '@/components/modal-footer';
import { PageActionType } from '@/config/types';
import { createAxiosToken } from '@/hooks/use-chunk-request';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Drawer } from 'antd';
import _ from 'lodash';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { queryCatalogItemSpec } from '../apis';
import {
  backendOptionsMap,
  modelCategoriesMap,
  modelSourceMap,
  sourceOptions
} from '../config';
import { CatalogSpec, FormData, ListItem } from '../config/types';
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

const defaultQuant = ['Q4_K_M'];
const EmbeddingRerankFirstQuant = ['FP16'];
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

  const form = useRef<any>({});
  const intl = useIntl();

  const [isGGUF, setIsGGUF] = useState<boolean>(false);
  const [sourceList, setSourceList] = useState<any[]>([]);
  const [backendList, setBackendList] = useState<any[]>([]);
  const [sizeOptions, setSizeOptions] = useState<any[]>([]);
  const [quantizationOptions, setQuantizationOptions] = useState<any[]>([]);
  const sourceGroupMap = useRef<any>({});
  const axiosToken = useRef<any>(null);
  const selectSpecRef = useRef<CatalogSpec>({} as CatalogSpec);

  const handleSumit = () => {
    form.current?.submit?.();
  };

  const getDefaultQuant = (data: { category: string; quantOption: string }) => {
    if (
      data.category === modelCategoriesMap.embedding ||
      data.category === modelCategoriesMap.reranker
    ) {
      return EmbeddingRerankFirstQuant.includes(data.quantOption);
    }
    return defaultQuant.includes(data.quantOption);
  };

  const getModelFile = (spec: CatalogSpec) => {
    let modelInfo = {};
    if (spec.source === modelSourceMap.huggingface_value) {
      modelInfo = {
        huggingface_repo_id: spec?.huggingface_repo_id,
        huggingface_filename: spec?.huggingface_filename
      };
    }

    if (spec.source === modelSourceMap.modelscope_value) {
      modelInfo = {
        model_scope_model_id: spec?.model_scope_model_id,
        model_scope_file_path: spec?.model_scope_file_path
      };
    }

    if (spec.source === modelSourceMap.ollama_library_value) {
      modelInfo = {
        ollama_library_model_name: spec?.ollama_library_model_name
      };
    }

    if (spec.source === modelSourceMap.local_path_value) {
      modelInfo = {
        local_path: spec?.local_path
      };
    }
    return modelInfo;
  };

  const getModelSpec = (data: {
    source: string;
    backend: string;
    size: number;
    quantization: string;
  }) => {
    const groupList = sourceGroupMap.current[data.source];
    const spec = _.find(groupList, (item: CatalogSpec) => {
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

  const handleSetSizeOptions = (data: { source: string; backend: string }) => {
    const groupList = sourceGroupMap.current[source];
    const list = _.filter(groupList, (item: CatalogSpec) => item.size);
    const sizeGroup = _.groupBy(
      _.filter(list, (item: CatalogSpec) => {
        return item.backend === data.backend;
      }),
      'size'
    );

    const sizeList = _.keys(sizeGroup).map((size: string) => {
      return {
        label: `${size}B`,
        value: _.toNumber(size)
      };
    });
    setSizeOptions(sizeList);
    return sizeList;
  };

  const handleSetQuantizationOptions = (data: {
    source: string;
    size: number;
    backend: string;
  }) => {
    const groupList = sourceGroupMap.current[data.source];
    console.log('groupList====', data, groupList);
    const sizeGroup = _.filter(groupList, (item: CatalogSpec) => {
      return item.size === data.size && item.backend === data.backend;
    });

    const quantizationList = _.map(sizeGroup, (item: CatalogSpec) => {
      return {
        label: item.quantization,
        value: item.quantization
      };
    });
    setQuantizationOptions(quantizationList);
    return quantizationList;
  };

  const handleSetBackendOptions = (source: string) => {
    const groupList = sourceGroupMap.current[source];
    const backendGroup = _.groupBy(groupList, 'backend');
    console.log('backendGroup====', backendGroup, source);

    const backendList = _.filter(backendOptions, (item: any) => {
      return backendGroup[item.value];
    });
    setBackendList(backendList);
    return backendList;
  };

  const handleSourceChange = (source: string) => {
    const defaultSpec = _.get(sourceGroupMap.current, `${source}.0`, {});
    console.log('source====', source, defaultSpec);
    initFormDataBySource(defaultSpec);
    handleSetSizeOptions({
      source: source,
      backend: defaultSpec.backend
    });
    handleSetQuantizationOptions({
      source: source,
      size: defaultSpec.size,
      backend: defaultSpec.backend
    });
    // set form value
    initFormDataBySource(defaultSpec);
  };

  const handleBackendChange = (backend: string) => {
    if (backend === backendOptionsMap.vllm) {
      setIsGGUF(false);
    }

    if (backend === backendOptionsMap.llamaBox) {
      setIsGGUF(true);
    }
    const sizeList = handleSetSizeOptions({
      source: form.current.getFieldValue('source'),
      backend: backend
    });
    const quantizaList = handleSetQuantizationOptions({
      source: form.current.getFieldValue('source'),
      size: _.get(sizeList, '0.value', 0),
      backend: backend
    });

    const data = getModelSpec({
      source: form.current.getFieldValue('source'),
      backend: backend,
      size: _.get(sizeList, '0.value', 0),
      quantization:
        _.find(quantizaList, (item: { label: string; value: string }) =>
          getDefaultQuant({
            category: _.get(current, 'categories.0', ''),
            quantOption: item.value
          })
        )?.value || _.get(quantizaList, '0.value', '')
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

      const sources = _.filter(sourceOptions, (item: any) => {
        return groupList[item.value];
      });
      const source = _.get(sources, '0.value', '');
      const defaultSpec =
        _.find(groupList[source], (item: CatalogSpec) => {
          return getDefaultQuant({
            category: _.get(current, 'categories.0', ''),
            quantOption: item.quantization
          });
        }) || _.get(groupList, `${source}.0`, {});

      setSourceList(sources);
      handleSetBackendOptions(source);
      handleSetSizeOptions({
        source: source,
        backend: defaultSpec.backend
      });
      handleSetQuantizationOptions({
        source: source,
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
      source: form.current.getFieldValue('source'),
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
      source: form.current.getFieldValue('source'),
      backend: form.current.getFieldValue('backend'),
      size: val
    });

    const data = getModelSpec({
      source: form.current.getFieldValue('source'),
      backend: form.current.getFieldValue('backend'),
      size: val,
      quantization:
        _.find(list, (item: { label: string; value: string }) =>
          getDefaultQuant({
            category: _.get(current, 'categories.0', ''),
            quantOption: item.value
          })
        )?.value || _.get(list, '0.value', '')
    });

    // set form data
    form.current.setFieldsValue({
      ...data
    });
  };

  const handleOk = (values: FormData) => {
    onOk({
      ...values,
      ...getModelFile(selectSpecRef.current)
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
