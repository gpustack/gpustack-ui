import IconFont from '@/components/icon-font';
import LabelSelector from '@/components/label-selector';
import ListInput from '@/components/list-input';
import CheckboxField from '@/components/seal-form/checkbox-field';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Collapse, Form, FormInstance, Typography } from 'antd';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import {
  backendLabelMap,
  backendParamsHolderTips,
  backendTipsList,
  getBackendParamsTips,
  modelCategories,
  modelSourceMap,
  placementStrategyOptions,
  ScheduleValueMap
} from '../config';
import BackendParameters, {
  backendOptionsMap
} from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import dataformStyles from '../style/data-form.less';
import Performance from './performance';

interface AdvanceConfigProps {
  isGGUF: boolean;
  form: FormInstance;
  gpuOptions: Array<any>;
  action: PageActionType;
  source: string;
  backendOptions?: Global.BaseOption<string>[];
  handleBackendChange?: (value: string) => void;
}

const placementStrategyTips = [
  {
    title: 'Spread',
    tips: 'resources.form.spread.tips'
  },
  {
    title: 'Binpack',
    tips: 'resources.form.binpack.tips'
  }
];

const AdvanceConfig: React.FC<AdvanceConfigProps> = (props) => {
  const { form, isGGUF, gpuOptions, source, backendOptions, action } = props;
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
  const { onValuesChange } = useFormContext();

  const paramsConfig = useMemo(() => {
    return _.get(BackendParameters, backend, []);
  }, [backend]);

  const backendParamsTips = useMemo(() => {
    return getBackendParamsTips(backend);
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

  const handleBackendParametersOnBlur = () => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  const handleDeleteBackendParameters = (index: number) => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  const onSelectorChange = (field: string, allowEmpty?: boolean) => {
    const workerSelector = form.getFieldValue(field);
    // check if all keys have values
    const hasEmptyValue = _.some(_.keys(workerSelector), (k: string) => {
      return !workerSelector[k];
    });
    if (!hasEmptyValue || allowEmpty) {
      onValuesChange?.({}, form.getFieldsValue());
    }
  };

  const handleSelectorOnBlur = () => {
    onSelectorChange('worker_selector');
  };

  const handleDeleteWorkerSelector = (index: number) => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  const handleEnvSelectorOnBlur = () => {
    onSelectorChange('env', true);
  };

  const handleDeleteEnvSelector = (index: number) => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  const handleBackendVersionOnBlur = () => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  const handleScheduleTypeChange = (value: string) => {
    if (value === ScheduleValueMap.Auto) {
      onValuesChange?.({}, form.getFieldsValue());
    }
  };

  const handleBeforeGpuSelectorChange = (gpuIds: any[]) => {};

  const handleGpuSelectorChange = (value: any[]) => {
    handleBeforeGpuSelectorChange(value);
    onValuesChange?.({}, form.getFieldsValue());
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
        <Form.Item name="backend" rules={[{ required: true }]}>
          <SealSelect
            required
            onChange={props.handleBackendChange}
            label={intl.formatMessage({ id: 'models.form.backend' })}
            description={<TooltipList list={backendTipsList}></TooltipList>}
            options={
              backendOptions ?? [
                {
                  label: backendLabelMap[backendOptionsMap.vllm],
                  value: backendOptionsMap.vllm,
                  disabled:
                    props.source === modelSourceMap.local_path_value
                      ? false
                      : isGGUF
                },
                {
                  label: backendLabelMap[backendOptionsMap.ascendMindie],
                  value: backendOptionsMap.ascendMindie,
                  disabled:
                    props.source === modelSourceMap.local_path_value
                      ? false
                      : isGGUF
                },
                {
                  label: backendLabelMap[backendOptionsMap.voxBox],
                  value: backendOptionsMap.voxBox,
                  disabled:
                    props.source === modelSourceMap.local_path_value
                      ? false
                      : props.source === modelSourceMap.ollama_library_value ||
                        isGGUF
                }
              ]
            }
            disabled={
              action === PageAction.EDIT &&
              props.source !== modelSourceMap.local_path_value
            }
          ></SealSelect>
        </Form.Item>
        {scheduleType === ScheduleValueMap.Auto && (
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
                      getFieldValue('scheduleType') === ScheduleValueMap.Auto &&
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
                onBlur={handleSelectorOnBlur}
                onDelete={handleDeleteWorkerSelector}
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

        <Form.Item name="backend_version">
          <SealInput.Input
            placeholder={
              backendParamsTips?.version
                ? `${intl.formatMessage({ id: 'common.help.eg' })} ${backendParamsTips?.version}`
                : ''
            }
            onBlur={handleBackendVersionOnBlur}
            label={intl.formatMessage({ id: 'models.form.backendVersion' })}
            description={intl.formatMessage(
              {
                id: 'models.form.backendVersion.tips'
              },
              {
                backend: backendLabelMap[backend],
                version: backendParamsTips?.version
                  ? `(${intl.formatMessage({ id: 'common.help.eg' })} ${backendParamsTips?.version})`
                  : '',
                link: backendParamsTips?.releases && (
                  <span
                    style={{
                      marginLeft: 5
                    }}
                  >
                    <Typography.Link
                      className="flex-center"
                      style={{ display: 'inline' }}
                      href={backendParamsTips?.releases}
                      target="_blank"
                    >
                      <span>
                        {intl.formatMessage({ id: 'models.form.releases' })}
                      </span>
                      <IconFont
                        type="icon-external-link"
                        className="font-size-14 m-l-4"
                      ></IconFont>
                    </Typography.Link>
                  </span>
                )
              }
            )}
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
            btnText={intl.formatMessage({ id: 'common.button.addParams' })}
            label={intl.formatMessage({
              id: 'models.form.backend_parameters'
            })}
            dataList={form.getFieldValue('backend_parameters') || []}
            onChange={handleBackendParametersChange}
            onBlur={handleBackendParametersOnBlur}
            onDelete={handleDeleteBackendParameters}
            options={paramsConfig}
            description={
              backendParamsTips.link && (
                <span>
                  {backend === backendOptionsMap.ascendMindie && (
                    <span>
                      {intl.formatMessage({ id: 'models.backend.mindie.310p' })}
                    </span>
                  )}
                  <span style={{ marginLeft: 5 }}>
                    {intl.formatMessage(
                      { id: 'models.form.backend_parameters.vllm.tips' },
                      { backend: backendParamsTips.backend || '' }
                    )}{' '}
                    <Typography.Link
                      style={{ display: 'inline' }}
                      className="flex-center"
                      href={backendParamsTips.link}
                      target="_blank"
                    >
                      <span>
                        {intl.formatMessage({ id: 'common.text.here' })}
                      </span>
                      <IconFont
                        type="icon-external-link"
                        className="font-size-14 m-l-4"
                      ></IconFont>
                    </Typography.Link>
                  </span>
                </span>
              )
            }
          ></ListInput>
        </Form.Item>
        <Form.Item<FormData> name="env">
          <LabelSelector
            label={intl.formatMessage({
              id: 'models.form.env'
            })}
            labels={EnviromentVars}
            btnText={intl.formatMessage({ id: 'common.button.vars' })}
            onBlur={handleEnvSelectorOnBlur}
            onDelete={handleDeleteEnvSelector}
            onChange={handleEnviromentVarsChange}
          ></LabelSelector>
        </Form.Item>

        {scheduleType === ScheduleValueMap.Auto &&
          [backendOptionsMap.vllm, backendOptionsMap.ascendMindie].includes(
            backend
          ) && (
            <div style={{ paddingBottom: 22, paddingLeft: 10 }}>
              <Form.Item<FormData>
                name="distributed_inference_across_workers"
                valuePropName="checked"
                style={{ padding: '0 10px', marginBottom: 0 }}
                noStyle
              >
                <CheckboxField
                  description={intl.formatMessage({
                    id: 'models.form.distribution.tips'
                  })}
                  label={intl.formatMessage({
                    id: 'resources.form.enableDistributedInferenceAcrossWorkers'
                  })}
                ></CheckboxField>
              </Form.Item>
            </div>
          )}
        <div style={{ paddingBottom: 22, paddingLeft: 10 }}>
          <Form.Item<FormData>
            name="restart_on_error"
            valuePropName="checked"
            style={{ padding: '0 10px', marginBottom: 0 }}
            noStyle
          >
            <CheckboxField
              description={intl.formatMessage({
                id: 'models.form.restart.onerror.tips'
              })}
              label={intl.formatMessage({
                id: 'models.form.restart.onerror'
              })}
            ></CheckboxField>
          </Form.Item>
        </div>
      </>
    );
    return [
      {
        key: '2',
        label: (
          <span
            style={{ fontWeight: 'var(--font-weight-medium)' }}
            className="font-size-14"
          >
            Performance
          </span>
        ),
        forceRender: true,
        children: <Performance></Performance>
      },
      // {
      //   key: '3',
      //   label: (
      //     <span
      //       style={{ fontWeight: 'var(--font-weight-medium)' }}
      //       className="font-size-14"
      //     >
      //       Scaling
      //     </span>
      //   ),
      //   forceRender: true,
      //   children: <Scaling></Scaling>
      // },
      {
        key: '1',
        label: (
          <span
            style={{ fontWeight: 'var(--font-weight-medium)' }}
            className="font-size-14"
          >
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
      accordion
      destroyOnHidden={false}
      className={dataformStyles['advanced-collapse']}
      expandIcon={({ isActive }) => (
        <IconFont
          type="icon-down"
          rotate={isActive ? 0 : -90}
          style={{ fontSize: '14px' }}
        ></IconFont>
      )}
      items={collapseItems}
    ></Collapse>
  );
};

export default AdvanceConfig;
