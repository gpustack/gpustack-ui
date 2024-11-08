import IconFont from '@/components/icon-font';
import SealAutoComplete from '@/components/seal-form/auto-complete';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Form, Tooltip, Typography } from 'antd';
import _ from 'lodash';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState
} from 'react';
import { queryGPUList } from '../apis';
import {
  backendOptionsMap,
  modelSourceMap,
  ollamaModelOptions
} from '../config';
import { FormData, GPUListItem } from '../config/types';
import AdvanceConfig from './advance-config';

interface DataFormProps {
  ref?: any;
  source: string;
  action: PageActionType;
  selectedModel: any;
  isGGUF: boolean;
  onOk: (values: FormData) => void;
  onBackendChange?: (value: string) => void;
}

const SEARCH_SOURCE = [
  modelSourceMap.huggingface_value,
  modelSourceMap.modelscope_value
];

const DataForm: React.FC<DataFormProps> = forwardRef((props, ref) => {
  const { action, isGGUF, onOk } = props;
  const [form] = Form.useForm();
  const intl = useIntl();
  const [gpuOptions, setGpuOptions] = useState<
    Array<GPUListItem & { label: string; value: string }>
  >([]);

  const sourceOptions = [
    {
      label: 'Hugging Face',
      value: modelSourceMap.huggingface_value,
      key: 'huggingface'
    },
    {
      label: 'Ollama Library',
      value: modelSourceMap.ollama_library_value,
      key: 'ollama_library'
    },
    {
      label: 'ModelScope',
      value: modelSourceMap.modelscope_value,
      key: 'model_scope'
    },
    {
      label: intl.formatMessage({ id: 'models.form.localPath' }),
      value: modelSourceMap.local_path_value,
      key: 'local_path'
    }
  ];

  const getGPUList = async () => {
    const data = await queryGPUList();
    const list = _.map(data.items, (item: GPUListItem) => {
      return {
        ...item,
        label: item.name,
        value: `${item.worker_name}-${item.name}-${item.index}`
      };
    });
    setGpuOptions(list);
  };

  useEffect(() => {
    getGPUList();
  }, []);

  const handleSumit = () => {
    form.submit();
  };

  useImperativeHandle(
    ref,
    () => {
      return {
        submit: handleSumit,
        setFieldsValue: (values: FormData) => {
          form.setFieldsValue(values);
        },
        setFieldValue: (name: string, value: any) => {
          form.setFieldValue(name, value);
        },
        getFieldValue: (name: string) => {
          return form.getFieldValue(name);
        }
      };
    },
    []
  );

  const handleOnSelectModel = () => {
    let name = _.split(props.selectedModel.name, '/').slice(-1)[0];
    const reg = /(-gguf)$/i;
    name = _.toLower(name).replace(reg, '');

    if (SEARCH_SOURCE.includes(props.source)) {
      form.setFieldsValue({
        repo_id: props.selectedModel.name,
        name: name
      });
    } else {
      form.setFieldsValue({
        ollama_library_model_name: props.selectedModel.name,
        name: name
      });
    }
  };

  const handleLocalPathBlur = (e: any) => {
    const value = e.target.value;
    const isEndwithGGUF = _.endsWith(value, '.gguf');
    if (isEndwithGGUF) {
      props.onBackendChange?.(backendOptionsMap.llamaBox);
    } else {
      props.onBackendChange?.(backendOptionsMap.vllm);
    }
  };

  const renderHuggingfaceFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="repo_id"
          key="repo_id"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.form.repoid' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({ id: 'models.form.repoid' })}
            required
            disabled={true}
          ></SealInput.Input>
        </Form.Item>
        {isGGUF && (
          <Form.Item<FormData>
            name="file_name"
            key="file_name"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  {
                    id: 'common.form.rule.input'
                  },
                  { name: intl.formatMessage({ id: 'models.form.filename' }) }
                )
              }
            ]}
          >
            <SealInput.Input
              label={intl.formatMessage({ id: 'models.form.filename' })}
              required
              disabled={true}
            ></SealInput.Input>
          </Form.Item>
        )}
      </>
    );
  };

  const renderS3Fields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="s3_address"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.form.s3address' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({
              id: 'models.form.s3address'
            })}
            required
          ></SealInput.Input>
        </Form.Item>
      </>
    );
  };

  const renderOllamaModelFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="ollama_library_model_name"
          key="ollama_library_model_name"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.table.name' }) }
              )
            }
          ]}
        >
          <SealAutoComplete
            filterOption
            defaultActiveFirstOption
            disabled={action === PageAction.EDIT}
            options={ollamaModelOptions}
            label={intl.formatMessage({ id: 'model.form.ollama.model' })}
            placeholder={intl.formatMessage({ id: 'model.form.ollamaholder' })}
            addAfter={
              <Typography.Link
                href="https://www.ollama.com/library"
                target="_blank"
              >
                <Tooltip
                  title={intl.formatMessage({ id: 'models.form.ollamalink' })}
                  placement="topRight"
                >
                  <IconFont
                    type="icon-external-link"
                    className="font-size-14"
                  ></IconFont>
                </Tooltip>
              </Typography.Link>
            }
            required
          ></SealAutoComplete>
        </Form.Item>
      </>
    );
  };

  const renderLocalPathFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="local_path"
          key="local_path"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.form.filePath' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            onBlur={handleLocalPathBlur}
            label={intl.formatMessage({ id: 'models.form.filePath' })}
            required
          ></SealInput.Input>
        </Form.Item>
      </>
    );
  };

  const renderFieldsBySource = useMemo(() => {
    if (SEARCH_SOURCE.includes(props.source)) {
      return renderHuggingfaceFields();
    }

    if (props.source === modelSourceMap.ollama_library_value) {
      return renderOllamaModelFields();
    }

    if (props.source === modelSourceMap.s3_value) {
      return renderS3Fields();
    }
    if (props.source === modelSourceMap.local_path_value) {
      return renderLocalPathFields();
    }

    return null;
  }, [props.source, isGGUF, intl]);

  const handleOk = (formdata: FormData) => {
    const gpu = _.find(gpuOptions, (item: any) => {
      return item.value === formdata.gpu_selector;
    });
    if (gpu) {
      onOk({
        ..._.omit(formdata, ['scheduleType']),
        gpu_selector: {
          gpu_name: gpu.name,
          gpu_index: gpu.index,
          worker_name: gpu.worker_name
        }
      });
    } else {
      onOk({
        ..._.omit(formdata, ['scheduleType'])
      });
    }
  };

  useEffect(() => {
    if (action === PageAction.CREATE) {
      form.setFieldValue(
        'backend',
        isGGUF ? backendOptionsMap.llamaBox : backendOptionsMap.vllm
      );
    }
  }, [isGGUF]);
  useEffect(() => {
    handleOnSelectModel();
  }, [props.selectedModel.name]);

  return (
    <Form
      name="deployModel"
      form={form}
      onFinish={handleOk}
      preserve={false}
      style={{ padding: '16px 24px' }}
      clearOnDestroy={true}
      initialValues={{
        replicas: 1,
        source: props.source,
        placement_strategy: 'spread',
        cpu_offloading: true,
        scheduleType: 'auto',
        distributed_inference_across_workers: true
      }}
    >
      <Form.Item<FormData>
        name="name"
        rules={[
          {
            required: true,
            message: intl.formatMessage(
              {
                id: 'common.form.rule.input'
              },
              { name: intl.formatMessage({ id: 'common.table.name' }) }
            )
          }
        ]}
      >
        <SealInput.Input
          label={intl.formatMessage({
            id: 'common.table.name'
          })}
          required
        ></SealInput.Input>
      </Form.Item>
      {
        <Form.Item<FormData>
          name="source"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.select'
                },
                { name: intl.formatMessage({ id: 'models.form.source' }) }
              )
            }
          ]}
        >
          {
            <SealSelect
              disabled={true}
              label={intl.formatMessage({
                id: 'models.form.source'
              })}
              options={sourceOptions}
              required
            ></SealSelect>
          }
        </Form.Item>
      }

      {renderFieldsBySource}
      <Form.Item<FormData>
        name="replicas"
        rules={[
          {
            required: true,
            message: intl.formatMessage(
              {
                id: 'common.form.rule.input'
              },
              {
                name: intl.formatMessage({ id: 'models.form.replicas' })
              }
            )
          }
        ]}
      >
        <SealInput.Number
          style={{ width: '100%' }}
          label={intl.formatMessage({
            id: 'models.form.replicas'
          })}
          required
          min={0}
        ></SealInput.Number>
      </Form.Item>
      <Form.Item<FormData> name="description">
        <SealInput.TextArea
          label={intl.formatMessage({
            id: 'common.table.description'
          })}
        ></SealInput.TextArea>
      </Form.Item>
      <AdvanceConfig
        form={form}
        gpuOptions={gpuOptions}
        isGGUF={isGGUF}
        action={action}
        source={props.source}
      ></AdvanceConfig>
    </Form>
  );
});

export default React.memo(DataForm);
