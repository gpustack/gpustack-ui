import LabelSelector from '@/components/label-selector';
import SealAutoComplete from '@/components/seal-form/auto-complete';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { InfoCircleOutlined, RightOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Checkbox, Collapse, Form, Select, Tooltip, Typography } from 'antd';
import _ from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo
} from 'react';
import {
  modelSourceMap,
  ollamaModelOptions,
  placementStrategyOptions
} from '../config';
import { FormData } from '../config/types';
import dataformStyles from '../style/data-form.less';
import GPUCard from './gpu-card';

interface DataFormProps {
  ref?: any;
  source: string;
  action: PageActionType;
  repo: string;
  onOk: (values: FormData) => void;
}

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
  }
];

const gpuOptions = [
  {
    label: 'NVIDIA A100',
    value: '1',
    index: 0,
    worker_name: 'mbp-1.local',
    worker: {
      GPU: {
        name: 'A100',
        count: 1,
        memory: 16384
      },
      CPU: {
        count: 16,
        memory: 16384
      },
      os: {
        name: 'Ubuntu 20.04',
        version: '20.04'
      },
      name: 'mbp-1.local',
      address: '192.168.1.1'
    }
  },
  {
    label: 'NVIDIA H100',
    value: '2',
    index: 1,
    worker_name: 'mbp-2.local',
    worker: {
      GPU: {
        name: 'H100',
        count: 1,
        memory: 16384
      },
      CPU: {
        count: 16,
        memory: 16384
      },
      os: {
        name: 'Ubuntu 20.04',
        version: '20.04'
      },
      name: 'mbp-2.local',
      address: '192.168.1.2'
    }
  },
  {
    label: 'NVIDIA A100',
    value: '3',
    index: 2,
    worker_name: 'mbp-3.local',
    worker: {
      GPU: {
        name: 'A100',
        count: 1,
        memory: 16384
      },
      CPU: {
        count: 16,
        memory: 16384
      },
      os: {
        name: 'Ubuntu 20.04',
        version: '20.04'
      },
      name: 'mbp-3.local',
      address: '192.168.1.3'
    }
  },
  {
    label: 'NVIDIA H100',
    value: '4',
    index: 3,
    worker_name: 'mbp-4.local',
    worker: {
      GPU: {
        name: 'H100',
        count: 1,
        memory: 16384
      },
      CPU: {
        count: 16,
        memory: 16384
      },
      os: {
        name: 'Ubuntu 20.04',
        version: '20.04'
      },
      name: 'mbp-4.local',
      address: '192.168.1.4'
    }
  }
];

const DataForm: React.FC<DataFormProps> = forwardRef((props, ref) => {
  const { action, repo, onOk } = props;
  const [form] = Form.useForm();
  const intl = useIntl();
  const wokerSelector = Form.useWatch('worker_selector', form);
  // const [scheduleType, setScheduleType] = React.useState(false); // false: auto, true: manual

  const scheduleType = Form.useWatch('scheduleType', form);

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

  const placementStrategyTips = [
    {
      title: 'Spread',
      tips: intl.formatMessage({
        id: 'resources.form.spread.tips'
      })
    },
    {
      title: 'Binpack',
      tips: intl.formatMessage({
        id: 'resources.form.binpack.tips'
      })
    }
  ];

  const scheduleTypeTips = [
    {
      title: intl.formatMessage({
        id: 'models.form.scheduletype.auto'
      }),
      tips: intl.formatMessage({
        id: 'models.form.scheduletype.auto.tips'
      })
    },
    {
      title: intl.formatMessage({
        id: 'models.form.scheduletype.manual'
      }),
      tips: intl.formatMessage({
        id: 'models.form.scheduletype.manual.tips'
      })
    }
  ];

  const handleOnSelectModel = () => {
    console.log('repo=============', repo);
    if (!repo) {
      return;
    }
    let name = _.split(repo, '/').slice(-1)[0];
    const reg = /(-gguf)$/i;
    name = _.toLower(name).replace(reg, '');

    if (props.source === modelSourceMap.huggingface_value) {
      form.setFieldsValue({
        huggingface_repo_id: repo,
        name: name
      });
    } else {
      form.setFieldsValue({
        ollama_library_model_name: repo,
        name: name
      });
    }
  };

  const handleWorkerLabelsChange = useCallback(
    (labels: Record<string, any>) => {
      form.setFieldValue('worker_selector', labels);
    },
    []
  );

  const renderHuggingfaceFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="huggingface_repo_id"
          key="huggingface_repo_id"
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
        <Form.Item<FormData>
          name="huggingface_filename"
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
            disabled={action === PageAction.EDIT}
            label={intl.formatMessage({ id: 'model.form.ollama.model' })}
            placeholder={intl.formatMessage({ id: 'model.form.ollamaholder' })}
            required
            options={ollamaModelOptions}
          ></SealAutoComplete>
        </Form.Item>
      </>
    );
  };

  const renderFieldsBySource = () => {
    switch (props.source) {
      case modelSourceMap.huggingface_value:
        return renderHuggingfaceFields();
      case modelSourceMap.ollama_library_value:
        return renderOllamaModelFields();
      case modelSourceMap.s3_value:
        return renderS3Fields();
      default:
        return null;
    }
  };

  const renderSelectTips = (list: Array<{ title: string; tips: string }>) => {
    return (
      <div>
        {list.map((item, index) => {
          return (
            <div className="m-b-8" key={index}>
              <Typography.Title
                level={5}
                style={{
                  color: 'var(--color-white-1)',
                  marginRight: 10
                }}
              >
                {item.title}:
              </Typography.Title>
              <Typography.Text style={{ color: 'var(--color-white-1)' }}>
                {item.tips}
              </Typography.Text>
            </div>
          );
        })}
      </div>
    );
  };

  const collapseItems = useMemo(() => {
    const children = (
      <>
        <Form.Item name="scheduleType">
          <SealSelect
            label={intl.formatMessage({ id: 'models.form.scheduletype' })}
            description={renderSelectTips(scheduleTypeTips)}
            options={[
              {
                label: intl.formatMessage({
                  id: 'models.form.scheduletype.auto'
                }),
                value: 'auto'
              },
              {
                label: intl.formatMessage({
                  id: 'models.form.scheduletype.manual'
                }),
                value: 'manual'
              }
            ]}
          ></SealSelect>
        </Form.Item>
        {scheduleType === 'auto' && (
          <Form.Item<FormData> name="placement_strategy">
            <SealSelect
              label={intl.formatMessage({
                id: 'resources.form.placementStrategy'
              })}
              options={placementStrategyOptions}
              description={renderSelectTips(placementStrategyTips)}
            ></SealSelect>
          </Form.Item>
        )}
        {scheduleType === 'auto' && (
          <Form.Item<FormData> name="worker_selector">
            <LabelSelector
              label={intl.formatMessage({
                id: 'resources.form.workerSelector'
              })}
              labels={wokerSelector}
              onChange={handleWorkerLabelsChange}
              description={
                <span>
                  {intl.formatMessage({
                    id: 'resources.form.workerSelector.description'
                  })}
                </span>
              }
            ></LabelSelector>
          </Form.Item>
        )}
        {scheduleType === 'manual' && (
          <Form.Item<FormData> name="gpu_selector">
            <SealSelect label="GPU Selector">
              {gpuOptions.map((item) => (
                <Select.Option key={item.value} value={item.value}>
                  <GPUCard data={item}></GPUCard>
                </Select.Option>
              ))}
            </SealSelect>
          </Form.Item>
        )}
        <div style={{ marginBottom: 22, paddingLeft: 10 }}>
          <Form.Item<FormData>
            name="partial_offload"
            valuePropName="checked"
            style={{ padding: '0 10px', marginBottom: 0 }}
            noStyle
          >
            <Checkbox className="p-l-6">
              <Tooltip
                title={intl.formatMessage({
                  id: 'models.form.partialoffload.tips'
                })}
              >
                <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
                  {intl.formatMessage({
                    id: 'resources.form.enablePartialOffload'
                  })}
                </span>
                <InfoCircleOutlined
                  className="m-l-4"
                  style={{ color: 'var(--ant-color-text-tertiary)' }}
                />
              </Tooltip>
            </Checkbox>
          </Form.Item>
        </div>
        {scheduleType === 'auto' && (
          <div style={{ marginBottom: 22, paddingLeft: 10 }}>
            <Form.Item<FormData>
              name="distributed_inference_across_workers"
              valuePropName="checked"
              style={{ padding: '0 10px', marginBottom: 0 }}
              noStyle
            >
              <Checkbox className="p-l-6">
                <Tooltip
                  title={intl.formatMessage({
                    id: 'models.form.distribution.tips'
                  })}
                >
                  <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
                    {intl.formatMessage({
                      id: 'resources.form.enableDistributedInferenceAcrossWorkers'
                    })}
                  </span>
                  <InfoCircleOutlined
                    className="m-l-4"
                    style={{ color: 'var(--ant-color-text-tertiary)' }}
                  />
                </Tooltip>
              </Checkbox>
            </Form.Item>
          </div>
        )}
      </>
    );
    return [
      {
        key: '1',
        label: (
          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
            {intl.formatMessage({ id: 'resources.form.advanced' })}
          </span>
        ),
        children
      }
    ];
  }, [scheduleType]);

  useEffect(() => {
    handleOnSelectModel();
  }, [repo]);

  return (
    <Form
      name="deployModel"
      form={form}
      onFinish={onOk}
      preserve={false}
      style={{ padding: '16px 24px' }}
      clearOnDestroy={true}
      initialValues={{
        replicas: 1,
        source: props.source,
        placement_strategy: 'spread',
        partial_offload: true,
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
      {renderFieldsBySource()}
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

      <Collapse
        expandIconPosition="start"
        bordered={false}
        ghost
        className={dataformStyles['advanced-collapse']}
        expandIcon={({ isActive }) => (
          <RightOutlined
            rotate={isActive ? 90 : 0}
            style={{ fontSize: '12px', marginLeft: -8 }}
          />
        )}
        items={collapseItems}
      ></Collapse>
    </Form>
  );
});

export default React.memo(DataForm);
