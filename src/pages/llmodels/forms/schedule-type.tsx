import LabelSelector from '@/components/label-selector';
import { LabelSelectorContext } from '@/components/label-selector/context';
import SealCascader from '@/components/seal-form/seal-cascader';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form, InputNumber } from 'antd';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';
import GPUCard from '../components/gpu-card';
import {
  placementStrategyOptions,
  scheduleList,
  ScheduleValueMap
} from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const InputWrapper = styled.div`
  padding: 8px 4px;
`;

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

const scheduleTypeTips = [
  {
    title: {
      text: 'models.form.scheduletype.auto',
      locale: true
    },
    tips: 'models.form.scheduletype.auto.tips'
  },
  {
    title: {
      text: 'models.form.scheduletype.manual',
      locale: true
    },
    tips: 'models.form.scheduletype.manual.tips'
  }
];

const GPUsPerReplicaTips = [
  {
    title: {
      text: 'common.options.auto',
      locale: true
    },
    tips: 'models.form.gpusAllocationType.auto.tips'
  }
];

const ScheduleTypeForm: React.FC = () => {
  const intl = useIntl();
  const {
    onValuesChange,
    action,
    gpuOptions,
    workerLabelOptions,
    clearCacheFormValues,
    initialValues
  } = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const scheduleType = Form.useWatch('scheduleType', form);
  const workerSelector = Form.useWatch('worker_selector', form);
  const GPUsPerReplicas = Form.useWatch(
    ['gpu_selector', 'gpus_per_replica'],
    form
  );

  const handleScheduleTypeChange = async (value: string) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    if (value === ScheduleValueMap.Auto) {
      onValuesChange?.({}, form.getFieldsValue());
    } else if (value === ScheduleValueMap.Manual) {
      form.setFieldValue('gpu_selector', {
        gpu_ids: [],
        gpus_per_replica: null
      });
    }
  };

  const handleGpusPerReplicasChange = (val: string | number | null) => {
    if (val === null) {
      form.setFieldValue(['gpu_selector', 'gpus_per_replica'], null);
    } else {
      form.setFieldValue(['gpu_selector', 'gpus_per_replica'], val);
    }

    onValuesChange?.({}, form.getFieldsValue());
  };

  const handleGpuSelectorChange = (value: any[]) => {
    if (value.length > 0) {
      onValuesChange?.({}, form.getFieldsValue());
    } else {
      clearCacheFormValues?.();
    }
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

  const handleWorkerLabelsChange = (labels: Record<string, any>) => {
    form.setFieldValue('worker_selector', labels);
  };

  const handleSelectorOnBlur = () => {
    onSelectorChange('worker_selector');
  };

  const handleDeleteWorkerSelector = (index: number) => {
    onValuesChange?.({}, form.getFieldsValue());
  };

  return (
    <>
      <Form.Item name="scheduleType" data-field="scheduleType">
        <SealSelect
          onChange={handleScheduleTypeChange}
          label={intl.formatMessage({ id: 'models.form.scheduletype' })}
          description={<TooltipList list={scheduleTypeTips}></TooltipList>}
          options={scheduleList}
        ></SealSelect>
      </Form.Item>
      {scheduleType === ScheduleValueMap.SpecificGPUType && (
        <>
          <Form.Item name={['gpu_selector', 'gpu_type']}>
            <SealSelect
              label={intl.formatMessage({ id: 'models.form.gpuType' })}
              options={[]}
            ></SealSelect>
          </Form.Item>
          <Form.Item name={['gpu_selector', 'gpu_count']}>
            <SealSelect
              label={intl.formatMessage({ id: 'models.form.gpuCount' })}
              options={[]}
            ></SealSelect>
          </Form.Item>
        </>
      )}
      {scheduleType === ScheduleValueMap.Manual &&
        !form.getFieldValue('fix_gpu_type') && (
          <>
            <Form.Item
              data-field="gpu_selector.gpu_ids"
              name={['gpu_selector', 'gpu_ids']}
              rules={[
                {
                  required: true,
                  message: getRuleMessage('select', 'models.form.gpuselector')
                }
              ]}
            >
              <SealCascader
                required
                showSearch
                expandTrigger="hover"
                multiple={
                  form.getFieldValue('backend') !== backendOptionsMap.voxBox
                }
                classNames={{
                  popup: {
                    root: 'cascader-popup-wrapper gpu-selector'
                  }
                }}
                maxTagCount={1}
                label={intl.formatMessage({ id: 'models.form.gpuselector' })}
                options={gpuOptions}
                showCheckedStrategy="SHOW_CHILD"
                value={form.getFieldValue(['gpu_selector', 'gpu_ids'])}
                optionNode={GPUCard}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                notFoundContent={intl.formatMessage({
                  id: 'models.form.gpus.notfound'
                })}
                onChange={handleGpuSelectorChange}
              ></SealCascader>
            </Form.Item>
            <Form.Item name={['gpu_selector', 'gpus_per_replica']}>
              <SealSelect
                label={intl.formatMessage({
                  id: 'models.form.gpusperreplica'
                })}
                allowNull
                options={[
                  {
                    label: intl.formatMessage({ id: 'common.options.auto' }),
                    value: null
                  },
                  { label: '1', value: 1 },
                  { label: '2', value: 2 },
                  { label: '4', value: 4 },
                  { label: '8', value: 8 },
                  { label: '16', value: 16 }
                ]}
                description={
                  <TooltipList list={GPUsPerReplicaTips}></TooltipList>
                }
                popupRender={(originNode) => (
                  <div>
                    {originNode}
                    <InputWrapper>
                      <InputNumber
                        min={1}
                        max={64}
                        step={1}
                        style={{ width: '100%' }}
                        defaultValue={
                          GPUsPerReplicas === -1 ? null : GPUsPerReplicas
                        }
                        placeholder={intl.formatMessage({
                          id: 'models.form.gpuPerReplica.tips'
                        })}
                        value={GPUsPerReplicas === -1 ? null : GPUsPerReplicas}
                        onChange={handleGpusPerReplicasChange}
                      />
                    </InputWrapper>
                  </div>
                )}
              />
            </Form.Item>
          </>
        )}
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
                      scheduleType === ScheduleValueMap.Auto &&
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
                labels={workerSelector}
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
    </>
  );
};

export default ScheduleTypeForm;
