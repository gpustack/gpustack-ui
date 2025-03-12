import AutoTooltip from '@/components/auto-tooltip';
import LabelSelector from '@/components/label-selector';
import ListInput from '@/components/list-input';
import SealCascader from '@/components/seal-form/seal-cascader';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import { PageActionType } from '@/config/types';
import { QuestionCircleOutlined, RightOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import {
  Checkbox,
  Collapse,
  Empty,
  Form,
  FormInstance,
  Tooltip,
  Typography
} from 'antd';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import {
  backendOptionsMap,
  backendParamsHolderTips,
  modelCategories,
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
  const { form, isGGUF, gpuOptions, source } = props;
  const intl = useIntl();
  const wokerSelector = Form.useWatch('worker_selector', form);
  const EnviromentVars = Form.useWatch('env', form);
  const scheduleType = Form.useWatch('scheduleType', form);
  const backend = Form.useWatch('backend', form);
  const backend_parameters = Form.useWatch('backend_parameters', form);
  const categories = Form.useWatch('categories', form);
  const backend_version = Form.useWatch('backend_version', form);
  const placement_strategy = Form.useWatch('placement_strategy', form);
  const gpuSelectorIds = Form.useWatch(['gpu_selector', 'gpu_ids'], form);
  const worker_selector = Form.useWatch('worker_selector', form);

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
    if (backend === backendOptionsMap.llamaBox) {
      return llamaConfig;
    }
    if (backend === backendOptionsMap.vllm) {
      return vllmConfig;
    }
    return [];
  }, [backend]);

  const backendParamsTips = useMemo(() => {
    if (backend === backendOptionsMap.llamaBox) {
      return {
        backend: 'llama-box',
        releases: 'https://github.com/gpustack/llama-box/releases',
        link: 'https://github.com/gpustack/llama-box?tab=readme-ov-file#usage'
      };
    }
    if (backend === backendOptionsMap.vllm) {
      return {
        backend: 'vLLM',
        releases: 'https://github.com/vllm-project/vllm/releases',
        link: 'https://docs.vllm.ai/en/stable/serving/openai_compatible_server.html#cli-reference'
      };
    }
    return null;
  }, [backend]);

  const handleWorkerLabelsChange = useCallback(
    (labels: Record<string, any>) => {
      form.setFieldValue('worker_selector', labels);
    },
    []
  );
  const handleEnviromentVarsChange = useCallback(
    (labels: Record<string, any>) => {
      form.setFieldValue('env', labels);
    },
    []
  );

  const handleBackendParametersChange = useCallback((list: string[]) => {
    form.setFieldValue('backend_parameters', list);
  }, []);

  const handleGPUSelectorChange = (gpuIds: any[]) => {
    // only handle for vllm, pick the last selected group
    if (
      backend === backendOptionsMap.llamaBox ||
      backend === backendOptionsMap.voxBox ||
      !gpuIds?.length
    ) {
      return;
    }
    const lastGroupName = gpuIds[gpuIds.length - 1][0];

    const lastGroupItems = gpuIds.filter((item) => item[0] === lastGroupName);
    form.setFieldValue(['gpu_selector', 'gpu_ids'], lastGroupItems);
  };

  const gpuOptionRender = (data: any) => {
    if (data.value === '__EMPTY__') {
      return (
        <Empty
          image={false}
          style={{
            height: 100,
            alignSelf: 'center',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          description={intl.formatMessage({
            id: 'common.search.empty'
          })}
        ></Empty>
      );
    }
    let width: any = {
      maxWidth: 140,
      minWidth: 140
    };
    if (!data.parent) {
      width = undefined;
    }
    if (data.parent) {
      return (
        <AutoTooltip ghost {...width}>
          {data.label}
        </AutoTooltip>
      );
    }
    return <GPUCard data={data}></GPUCard>;
  };

  const collapseItems = useMemo(() => {
    const children = (
      <>
        <Form.Item<FormData> name="categories">
          <SealSelect
            allowNull
            label={intl.formatMessage({
              id: 'models.form.categories'
            })}
            options={modelCategories}
          ></SealSelect>
        </Form.Item>
        <Form.Item name="scheduleType">
          <SealSelect
            label={intl.formatMessage({ id: 'models.form.scheduletype' })}
            description={<TooltipList list={scheduleTypeTips}></TooltipList>}
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
                description={
                  <TooltipList list={placementStrategyTips}></TooltipList>
                }
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
          <>
            <Form.Item
              name={['gpu_selector', 'gpu_ids']}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage(
                    {
                      id: 'common.form.rule.select'
                    },
                    {
                      name: intl.formatMessage({
                        id: 'models.form.gpuselector'
                      })
                    }
                  )
                }
              ]}
            >
              <SealCascader
                required
                showSearch
                expandTrigger="hover"
                multiple={backend !== backendOptionsMap.voxBox}
                popupClassName="cascader-popup-wrapper gpu-selector"
                maxTagCount={1}
                label={intl.formatMessage({ id: 'models.form.gpuselector' })}
                options={gpuOptions}
                showCheckedStrategy="SHOW_CHILD"
                value={form.getFieldValue(['gpu_selector', 'gpu_ids'])}
                tagRender={(props) => {
                  return (
                    <AutoTooltip
                      className="m-r-4"
                      closable={props.closable}
                      onClose={props.onClose}
                      maxWidth={240}
                    >
                      {props.label}
                    </AutoTooltip>
                  );
                }}
                optionRender={gpuOptionRender}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
              ></SealCascader>
            </Form.Item>
          </>
        )}

        <Form.Item name="backend_version">
          <SealInput.Input
            label={intl.formatMessage({ id: 'models.form.backendVersion' })}
            description={intl.formatMessage({
              id: 'models.form.backendVersion.tips'
            })}
            labelExtra={
              backendParamsTips?.releases && (
                <span
                  style={{
                    marginLeft: 5
                  }}
                >
                  (
                  <Typography.Link
                    style={{ lineHeight: 1 }}
                    href={backendParamsTips?.releases}
                    target="_blank"
                  >
                    {intl.formatMessage({ id: 'models.form.releases' })}
                  </Typography.Link>
                  )
                </span>
              )
            }
          ></SealInput.Input>
        </Form.Item>

        <Form.Item<FormData> name="backend_parameters">
          <ListInput
            placeholder={
              backendParamsHolderTips[backend]
                ? intl.formatMessage({
                    id: backendParamsHolderTips[backend].holder
                  })
                : ''
            }
            btnText="common.button.addParams"
            label={intl.formatMessage({
              id: 'models.form.backend_parameters'
            })}
            dataList={form.getFieldValue('backend_parameters') || []}
            onChange={handleBackendParametersChange}
            options={paramsConfig}
            labelExtra={
              backendParamsTips?.link && (
                <span style={{ marginLeft: 5 }}>
                  (
                  <Typography.Link
                    style={{ lineHeight: 1 }}
                    href={backendParamsTips?.link}
                    target="_blank"
                  >
                    {intl.formatMessage({
                      id: 'models.form.moreparameters'
                    })}
                  </Typography.Link>
                  )
                </span>
              )
            }
          ></ListInput>
        </Form.Item>
        <Form.Item<FormData>
          name="env"
          rules={[
            () => ({
              validator(rule, value) {
                if (_.keys(value).length > 0) {
                  if (_.some(_.keys(value), (k: string) => !value[k])) {
                    return Promise.reject(
                      intl.formatMessage(
                        {
                          id: 'common.validate.value'
                        },
                        {
                          name: intl.formatMessage({
                            id: 'common.text.variable'
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
              id: 'models.form.env'
            })}
            labels={EnviromentVars}
            btnText="common.button.vars"
            onChange={handleEnviromentVarsChange}
          ></LabelSelector>
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
                  <QuestionCircleOutlined
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
                  <QuestionCircleOutlined
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
    backend_parameters,
    isGGUF,
    categories,
    backend_version,
    placement_strategy,
    gpuSelectorIds,
    EnviromentVars,
    worker_selector
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
