import { ProviderValueMap } from '@/pages/cluster-management/config';
import {
  LabelInfo,
  LabelSelector,
  LabelSelectorProvider,
  Cascader as SealCascader,
  Select as SealSelect,
  TooltipList,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form, InputNumber, Segmented } from 'antd';
import { createStyles } from 'antd-style';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';
import GPUCard from '../components/gpu-card';
import {
  ManualGPUModeMap,
  placementStrategyOptions,
  scheduleList,
  ScheduleValueMap
} from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import { backendOptionsMap } from '../constants/backend-parameters';
import '../style/gpu-selector.less';
import VGPUTypeForm from './vgpu-type';

const InputWrapper = styled.div`
  padding: 8px 4px;
`;

// The manual mode's GPU source lives in a bordered section whose switch sits in
// the title row, mirroring the Scheduled Scaling section of the same form.
const useStyles = createStyles(({ css }) => ({
  sectionCard: css`
    border: 1px solid var(--ant-color-border);
    border-radius: 6px;
    padding: 12px 12px 0px;
    margin-bottom: 12px;
    .section-title {
      margin-bottom: 12px;
      font-size: 14px;
      color: var(--ant-color-text);
    }
  `
}));

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
  const { styles } = useStyles();
  const {
    onValuesChange,
    action,
    gpuOptions,
    workerLabelOptions,
    clearCacheFormValues,
    initialValues,
    clusterList
  } = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const scheduleType = Form.useWatch('scheduleType', form);
  const manualGpuMode = Form.useWatch('manualGpuMode', form);
  const clusterId = Form.useWatch('cluster_id', form);
  const GPUsPerReplicas = Form.useWatch(
    ['gpu_selector', 'gpus_per_replica'],
    form
  );

  // vGPU slicing requests an InstanceType out of the cluster's own catalog,
  // and a Docker cluster publishes none — so whole cards are the only GPU
  // source there: hide the switch and read the mode as Full GPU whatever the
  // field carries. Committing the field itself belongs to the cluster handler
  // (applyClusterScopedOptions); this keeps the section in step even for a
  // stored selection that never went through it.
  const isDockerCluster =
    clusterList?.find((item) => item.value === clusterId)?.provider ===
    ProviderValueMap.Docker;
  const gpuMode = isDockerCluster ? ManualGPUModeMap.FullGPU : manualGpuMode;

  // Single commit path for the Full GPU / vGPU tab: the two GPU sources are
  // mutually exclusive, so seed the one the tab owns and null the other —
  // otherwise the abandoned tab's selector rides the submit.
  const commitManualGpuMode = (mode: string) => {
    form.setFieldValue('manualGpuMode', mode);
    if (mode === ManualGPUModeMap.VGPU) {
      form.setFieldValue('gpu_selector', null);
      form.setFieldValue('gpu_type_selector', {
        type: null,
        accelerator_sliced_memory_percentage: 0,
        accelerator_sliced_cores_percentage: 0,
        accelerator_partitioned_profile: null
      });
    } else {
      form.setFieldValue('gpu_selector', {
        gpu_ids: [],
        gpus_per_replica: null
      });
      form.setFieldValue('gpu_type_selector', null);
    }
  };

  const handleScheduleTypeChange = async (value: string) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    if (value === ScheduleValueMap.Auto) {
      form.setFieldValue('gpu_selector', null);
      form.setFieldValue('gpu_type_selector', null);
      onValuesChange?.({}, form.getFieldsValue());
    } else if (value === ScheduleValueMap.Manual) {
      // Entering manual seeds whichever source its tab currently points at —
      // on Docker there is no tab, so it is always whole cards.
      commitManualGpuMode(
        isDockerCluster
          ? ManualGPUModeMap.FullGPU
          : form.getFieldValue('manualGpuMode') || ManualGPUModeMap.FullGPU
      );
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
          <div className={styles.sectionCard}>
            {/* Which GPU source manual scheduling picks from: whole cards out
              of the cluster's inventory, or a slice of a GPU out of an
              InstanceType pool (vGPU), where the slice request lives. */}
            <Flex
              className="section-title"
              align="center"
              justify="space-between"
            >
              <LabelInfo
                label={intl.formatMessage({ id: 'models.form.gpuallocation' })}
              ></LabelInfo>
              {/* Hidden rather than unmounted on Docker: under preserve={false}
                unmounting a field resets it to the form's initialValue, which
                on an edit of a vGPU deployment is VGPU — the submit would then
                take the vGPU path (dropping the whole cards the user picked)
                for a cluster that cannot serve it. */}
              <Form.Item name="manualGpuMode" noStyle hidden={isDockerCluster}>
                <Segmented
                  size="middle"
                  type="rounded"
                  style={{ fontSize: 12 }}
                  onChange={commitManualGpuMode}
                  options={[
                    {
                      label: intl.formatMessage({
                        id: 'models.form.gpumode.full'
                      }),
                      value: ManualGPUModeMap.FullGPU
                    },
                    {
                      label: intl.formatMessage({
                        id: 'models.form.gpumode.slicing'
                      }),
                      value: ManualGPUModeMap.VGPU
                    }
                  ]}
                />
              </Form.Item>
            </Flex>
            {gpuMode === ManualGPUModeMap.VGPU ? (
              <VGPUTypeForm />
            ) : (
              <>
                <Form.Item
                  data-field="gpu_selector.gpu_ids"
                  name={['gpu_selector', 'gpu_ids']}
                  style={{
                    marginBottom: 16
                  }}
                  rules={[
                    {
                      required: true,
                      message: getRuleMessage(
                        'select',
                        'models.form.gpuselector'
                      )
                    }
                  ]}
                >
                  <SealCascader
                    required
                    showSearch
                    expandTrigger="click"
                    multiple={
                      form.getFieldValue('backend') !== backendOptionsMap.voxBox
                    }
                    classNames={{
                      popup: {
                        root: 'cascader-popup-wrapper gpu-selector'
                      }
                    }}
                    styles={{
                      popup: {
                        listItem: {
                          maxWidth: 'unset'
                        }
                      }
                    }}
                    maxTagCount={1}
                    label={intl.formatMessage({
                      id: 'models.form.gpuselector'
                    })}
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
                  name={['gpu_selector', 'gpus_per_replica']}
                  style={{ marginBottom: 12 }}
                >
                  <SealSelect
                    label={intl.formatMessage({
                      id: 'models.form.gpusperreplica'
                    })}
                    allowNull
                    options={[
                      {
                        label: intl.formatMessage({
                          id: 'common.options.auto'
                        }),
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
                            value={
                              GPUsPerReplicas === -1 ? null : GPUsPerReplicas
                            }
                            onChange={handleGpusPerReplicasChange}
                          />
                        </InputWrapper>
                      </div>
                    )}
                  />
                </Form.Item>
              </>
            )}
          </div>
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
          <LabelSelectorProvider value={{ options: workerLabelOptions }}>
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
          </LabelSelectorProvider>
        </>
      )}
    </>
  );
};

export default ScheduleTypeForm;
