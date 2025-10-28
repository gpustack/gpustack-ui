import LabelSelector from '@/components/label-selector';
import { LabelSelectorContext } from '@/components/label-selector/context';
import SealInputNumber from '@/components/seal-form/input-number';
import SealCascader from '@/components/seal-form/seal-cascader';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import { PageAction } from '@/config';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React from 'react';
import GPUCard from '../components/gpu-card';
import {
  gpusCountTypeMap,
  placementStrategyOptions,
  scheduleList,
  ScheduleValueMap
} from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

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

const gpuAllocateTypeTips = [
  {
    title: {
      text: 'models.form.gpusAllocationType.auto',
      locale: true
    },
    tips: 'models.form.gpusAllocationType.auto.tips'
  },
  {
    title: {
      text: 'models.form.gpusAllocationType.custom',
      locale: true
    },
    tips: 'models.form.gpusAllocationType.custom.tips'
  }
];

const ScheduleTypeForm: React.FC = () => {
  const intl = useIntl();
  const {
    onValuesChange,
    action,
    gpuOptions,
    workerLabelOptions,
    initialValues
  } = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const scheduleType = Form.useWatch('scheduleType', form);
  const gpusCountType = Form.useWatch('gpusCountType', form);
  const wokerSelector = Form.useWatch('worker_selector', form);

  const handleScheduleTypeChange = (value: string) => {
    if (value === ScheduleValueMap.Auto) {
      onValuesChange?.({}, form.getFieldsValue());
    }
  };

  const handleGpusCountTypeChange = (val: string) => {
    if (val === gpusCountTypeMap.Custom) {
      form.setFieldValue(['gpu_selector', 'gpus_per_replica'], 1);
    }

    onValuesChange?.({}, form.getFieldsValue());
  };

  const handleGpuSelectorChange = (value: any[]) => {
    if (value.length > 0) {
      onValuesChange?.({}, form.getFieldsValue());
    }
  };

  const handleOnStepReplicaStep = (
    value: number | string | null,
    info: { offset: number | string | null; type: 'up' | 'down' }
  ) => {
    let newValue = value;
    const isPowerOfTwo = (n: number) => (n & (n - 1)) === 0 && n !== 0; // check power of two
    if (!isPowerOfTwo(value as number)) {
      if (info.type === 'up') {
        newValue = Math.pow(2, Math.ceil(Math.log2(value as number)));
      } else {
        newValue = Math.pow(2, Math.floor(Math.log2(value as number)));
      }
    }
    form.setFieldValue(['gpu_selector', 'gpus_per_replica'], newValue);
    onValuesChange?.({}, form.getFieldsValue());
  };

  const handleOnStepReplica = async (value: number | string | null) => {
    if (value === null) {
      await new Promise((resolve) => {
        setTimeout(resolve, 200);
      });
      form.setFieldValue(['gpu_selector', 'gpus_per_replica'], 1);
      return;
    }

    const isPowerOfTwo = (n: number) => (n & (n - 1)) === 0 && n !== 0; // check power of two
    if (!isPowerOfTwo(value as number)) {
      const newValue = Math.pow(2, Math.round(Math.log2(value as number)));
      form.setFieldValue(['gpu_selector', 'gpus_per_replica'], newValue);
      onValuesChange?.({}, form.getFieldsValue());
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
            <Form.Item
              name="gpusCountType"
              hidden={
                action === PageAction.EDIT &&
                !!initialValues?.gpu_selector?.gpus_per_replica
              }
            >
              <SealSelect
                onChange={handleGpusCountTypeChange}
                label={intl.formatMessage({
                  id: 'models.form.gpusAllocationType'
                })}
                description={
                  <TooltipList list={gpuAllocateTypeTips}></TooltipList>
                }
                options={[
                  {
                    label: intl.formatMessage({
                      id: 'models.form.gpusAllocationType.auto'
                    }),
                    value: gpusCountTypeMap.Auto
                  },
                  {
                    label: intl.formatMessage({
                      id: 'models.form.gpusAllocationType.custom'
                    }),
                    value: gpusCountTypeMap.Custom
                  }
                ]}
              ></SealSelect>
            </Form.Item>
            {gpusCountType === gpusCountTypeMap.Custom && (
              <Form.Item name={['gpu_selector', 'gpus_per_replica']}>
                <SealInputNumber
                  label={intl.formatMessage({
                    id: 'models.form.gpusperreplica'
                  })}
                  min={1}
                  step={1}
                  onChange={handleOnStepReplica}
                  onStep={handleOnStepReplicaStep}
                />
              </Form.Item>
            )}
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
    </>
  );
};

export default ScheduleTypeForm;
