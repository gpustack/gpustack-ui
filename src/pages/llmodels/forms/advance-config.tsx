import LabelSelector from '@/components/label-selector';
import { LabelSelectorContext } from '@/components/label-selector/context';
import CheckboxField from '@/components/seal-form/checkbox-field';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { useCallback } from 'react';
import {
  modelCategories,
  placementStrategyOptions,
  ScheduleValueMap
} from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import Backend from '../forms/backend';
import BackendParametersList from '../forms/backend-parameters-list';
import ScheduleTypeForm from '../forms/schedule-type';

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

const AdvanceConfig = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const wokerSelector = Form.useWatch('worker_selector', form);
  const EnviromentVars = Form.useWatch('env', form);
  const scheduleType = Form.useWatch('scheduleType', form);
  const backend = Form.useWatch('backend', form);
  const { onValuesChange, workerLabelOptions } = useFormContext();

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

  return (
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
      <ScheduleTypeForm></ScheduleTypeForm>
      <Backend></Backend>
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
          <LabelSelectorContext.Provider
            value={{ options: workerLabelOptions }}
          >
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
                isAutoComplete
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
          </LabelSelectorContext.Provider>
        </>
      )}

      <BackendParametersList></BackendParametersList>
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
          <div style={{ paddingBottom: 22 }}>
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
      <div style={{ paddingBottom: 22 }}>
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
};

export default AdvanceConfig;
