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
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState
} from 'react';
import { queryGPUList } from '../apis';
import {
  HuggingFaceTaskMap,
  ModelscopeTaskMap,
  backendOptionsMap,
  modelSourceMap,
  modelTaskMap,
  ollamaModelOptions
} from '../config';
import { HuggingFaceModels, ModelScopeModels } from '../config/audio-catalog';
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
  const [modelTask, setModelTask] = useState<Record<string, any>>({
    type: '',
    value: '',
    text2speech: false,
    speech2text: false
  });

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
        title: '',
        label: ` ${item.name}(${item.worker_name})[
            ${intl.formatMessage({ id: 'resources.table.index' })}:${item.index}]`,
        value: item.id
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
        },
        resetFields() {
          form.resetFields();
        }
      };
    },
    []
  );

  const identifyModelTask = () => {
    let data = null;
    if (props.source === modelSourceMap.huggingface_value) {
      data = HuggingFaceModels.find(
        (item) =>
          `${item.org}/${item.name}`.indexOf(props.selectedModel.name) > -1 ||
          props.selectedModel.name?.indexOf(`${item.org}/${item.name}`) > -1
      );
    }
    if (props.source === modelSourceMap.modelscope_value) {
      data = ModelScopeModels.find(
        (item) =>
          `${item.org}/${item.name}`.indexOf(props.selectedModel.name) > -1 ||
          props.selectedModel.name?.indexOf(`${item.org}/${item.name}`) > -1
      );
    }
    if (data) {
      return modelTaskMap.audio;
    }
    return '';
  };
  const handleOnSelectModel = () => {
    let name = _.split(props.selectedModel.name, '/').slice(-1)[0];
    const reg = /(-gguf)$/i;
    name = _.toLower(name).replace(reg, '');

    const modelTaskType = identifyModelTask();

    const modelTask =
      HuggingFaceTaskMap.audio.includes(props.selectedModel.task) ||
      ModelscopeTaskMap.audio.includes(props.selectedModel.task)
        ? modelTaskMap.audio
        : '';

    setModelTask({
      value: props.selectedModel.task,
      type: modelTaskType || modelTask,
      text2speech:
        HuggingFaceTaskMap[modelTaskMap.textToSpeech] ===
          props.selectedModel.task ||
        ModelscopeTaskMap[modelTaskMap.textToSpeech] ===
          props.selectedModel.task,
      speech2text:
        HuggingFaceTaskMap[modelTaskMap.speechToText] ===
          props.selectedModel.task ||
        ModelscopeTaskMap[modelTaskMap.speechToText] ===
          props.selectedModel.task
    });

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
    let backend = backendOptionsMap.llamaBox;
    if (!isEndwithGGUF) {
      backend = backendOptionsMap.vllm;
    }
    props.onBackendChange?.(backend);
    form.setFieldValue('backend', backend);
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
            disabled={false}
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

  const handleBackendChange = useCallback((val: string) => {
    if (val === backendOptionsMap.llamaBox) {
      form.setFieldsValue({
        distributed_inference_across_workers: true,
        cpu_offloading: true
      });
    }
    form.setFieldValue('backend_version', '');
  }, []);

  const handleOk = (formdata: FormData) => {
    let data = _.cloneDeep(formdata);
    if (data.categories) {
      data.categories = [data.categories];
    } else {
      data.categories = [];
    }
    onOk({
      ..._.omit(data, ['scheduleType'])
    });
  };

  useEffect(() => {
    if (action === PageAction.EDIT) return;
    if (modelTask.type === modelTaskMap.audio) {
      form.setFieldValue('backend', backendOptionsMap.voxBox);
    } else {
      form.setFieldValue(
        'backend',
        isGGUF ? backendOptionsMap.llamaBox : backendOptionsMap.vllm
      );
    }
  }, [isGGUF, modelTask]);

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
        categories: null,
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
      <Form.Item name="backend">
        <SealSelect
          onChange={handleBackendChange}
          label={intl.formatMessage({ id: 'models.form.backend' })}
          description={
            <div>
              <div>
                1. {intl.formatMessage({ id: 'models.form.backend.llamabox' })}
              </div>
              <div>
                2. {intl.formatMessage({ id: 'models.form.backend.vllm' })}
              </div>
              <div>
                3. {intl.formatMessage({ id: 'models.form.backend.voxbox' })}
              </div>
            </div>
          }
          options={[
            {
              label: `llama-box`,
              value: backendOptionsMap.llamaBox,
              disabled:
                props.source === modelSourceMap.local_path_value
                  ? false
                  : !isGGUF
            },
            {
              label: 'vLLM',
              value: backendOptionsMap.vllm,
              disabled:
                props.source === modelSourceMap.local_path_value
                  ? false
                  : isGGUF
            },
            {
              label: 'vox-box',
              value: backendOptionsMap.voxBox,
              disabled: props.source === modelSourceMap.ollama_library_value
            }
          ]}
          disabled={
            action === PageAction.EDIT &&
            props.source !== modelSourceMap.local_path_value
          }
        ></SealSelect>
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
