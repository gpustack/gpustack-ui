import LabelSelector from '@/components/label-selector';
import ListInput from '@/components/list-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { InfoCircleOutlined, RightOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';

import {
  Checkbox,
  Collapse,
  Form,
  FormInstance,
  Select,
  Tooltip,
  Typography
} from 'antd';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import {
  backendOptionsMap,
  modelSourceMap,
  placementStrategyOptions
} from '../config';
import llamaConfig from '../config/llama-config';
import { FormData } from '../config/types';
import vllmConfig from '../config/vllm-config';
import dataformStyles from '../style/data-form.less';
import GPUCard from './gpu-card';

interface AdvanceConfigProps {
  isGGUF: boolean;
  form: FormInstance;
  gpuOptions: Array<any>;
  action: PageActionType;
  source: string;
}

const AdvanceConfig: React.FC<AdvanceConfigProps> = (props) => {
  const { form, gpuOptions, isGGUF, action, source } = props;

  const intl = useIntl();
  const wokerSelector = Form.useWatch('worker_selector', form);
  const scheduleType = Form.useWatch('scheduleType', form);
  const backend = Form.useWatch('backend', form);

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

  const paramsConfig = useMemo(() => {
    return backend === backendOptionsMap.llamaBox ? llamaConfig : vllmConfig;
  }, [backend]);

  const backendParamsTips = useMemo(() => {
    if (backend === backendOptionsMap.llamaBox) {
      return {
        backend: 'llama-box',
        link: 'https://github.com/gpustack/llama-box?tab=readme-ov-file#usage'
      };
    }
    return {
      backend: 'vLLM',
      link: 'https://docs.vllm.ai/en/stable/serving/openai_compatible_server.html#command-line-arguments-for-the-server'
    };
  }, [backend]);

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

  const handleWorkerLabelsChange = useCallback(
    (labels: Record<string, any>) => {
      form.setFieldValue('worker_selector', labels);
    },
    []
  );

  const handleBackendParametersChange = useCallback((list: string[]) => {
    form.setFieldValue('backend_parameters', list);
  }, []);

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
          <>
            <Form.Item<FormData> name="placement_strategy">
              <SealSelect
                label={intl.formatMessage({
                  id: 'resources.form.placementStrategy'
                })}
                options={placementStrategyOptions}
                description={renderSelectTips(placementStrategyTips)}
              ></SealSelect>
            </Form.Item>
            <Form.Item<FormData>
              name="worker_selector"
              rules={[
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (
                      getFieldValue('scheduleType') === 'auto' &&
                      _.keys(value).length > 0
                    ) {
                      if (_.some(_.keys(value), (k: string) => !value[k])) {
                        return Promise.reject(
                          intl.formatMessage(
                            {
                              id: 'common.validate.value'
                            },
                            {
                              name: intl.formatMessage({
                                id: 'models.form.selector'
                              })
                            }
                          )
                        );
                      }
                    }
                    return Promise.resolve();
                  }
                })
              ]}
            >
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
          </>
        )}
        {scheduleType === 'manual' && (
          <Form.Item<FormData>
            name="gpu_selector"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  {
                    id: 'common.form.rule.select'
                  },
                  {
                    name: 'gpu_selector'
                  }
                )
              }
            ]}
          >
            <SealSelect label="GPU Selector" required>
              {gpuOptions.map((item) => (
                <Select.Option key={item.value} value={item.value}>
                  <GPUCard data={item}></GPUCard>
                </Select.Option>
              ))}
            </SealSelect>
          </Form.Item>
        )}
        <Form.Item name="backend">
          <SealSelect
            label={intl.formatMessage({ id: 'models.form.backend' })}
            options={[
              {
                label: `llama-box(llama.cpp)`,
                value: backendOptionsMap.llamaBox,
                disabled:
                  source === modelSourceMap.local_path_value ? false : !isGGUF
              },
              {
                label: 'vLLM',
                value: backendOptionsMap.vllm,
                disabled:
                  source === modelSourceMap.local_path_value ? false : isGGUF
              }
            ]}
            disabled={
              action === PageAction.EDIT &&
              source !== modelSourceMap.local_path_value
            }
          ></SealSelect>
        </Form.Item>
        <Form.Item<FormData> name="backend_parameters">
          <ListInput
            placeholder={
              backend === backendOptionsMap.llamaBox
                ? intl.formatMessage({
                    id: 'models.form.backend_parameters.llamabox.placeholder'
                  })
                : intl.formatMessage({
                    id: 'models.form.backend_parameters.vllm.placeholder'
                  })
            }
            btnText="common.button.addParams"
            label={intl.formatMessage({ id: 'models.form.backend_parameters' })}
            dataList={form.getFieldValue('backend_parameters') || []}
            onChange={handleBackendParametersChange}
            options={paramsConfig}
            description={
              <span>
                {intl.formatMessage(
                  { id: 'models.form.backend_parameters.vllm.tips' },
                  { backend: backendParamsTips.backend }
                )}{' '}
                <Typography.Link
                  style={{ color: 'var(--ant-blue-4)' }}
                  href={backendParamsTips.link}
                  target="_blank"
                >
                  {intl.formatMessage({ id: 'common.text.here' })}
                </Typography.Link>
              </span>
            }
          ></ListInput>
        </Form.Item>
        {backend === backendOptionsMap.llamaBox && (
          <div style={{ paddingBottom: 22, paddingLeft: 10 }}>
            <Form.Item<FormData>
              name="cpu_offloading"
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
        )}
        {scheduleType === 'auto' && backend === backendOptionsMap.llamaBox && (
          <div style={{ paddingBottom: 22, paddingLeft: 10 }}>
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
        forceRender: true,
        children
      }
    ];
  }, [
    form,
    source,
    intl,
    gpuOptions,
    paramsConfig,
    scheduleType,
    wokerSelector,
    backend,
    isGGUF
  ]);

  return (
    <Collapse
      expandIconPosition="start"
      bordered={false}
      ghost
      destroyInactivePanel={false}
      className={dataformStyles['advanced-collapse']}
      expandIcon={({ isActive }) => (
        <RightOutlined
          rotate={isActive ? 90 : 0}
          style={{ fontSize: '12px' }}
        />
      )}
      items={collapseItems}
    ></Collapse>
  );
};

export default React.memo(AdvanceConfig);
