import LabelSelector from '@/components/label-selector';
import SealSelect from '@/components/seal-form/seal-select';
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
import React, { useCallback, useMemo } from 'react';
import { placementStrategyOptions } from '../config';
import { FormData } from '../config/types';
import dataformStyles from '../style/data-form.less';
import GPUCard from './gpu-card';

interface AdvanceConfigProps {
  form: FormInstance;
  gpuOptions: Array<any>;
}

const AdvanceConfig: React.FC<AdvanceConfigProps> = (props) => {
  const { form, gpuOptions } = props;

  const intl = useIntl();
  const wokerSelector = Form.useWatch('worker_selector', form);
  const scheduleType = Form.useWatch('scheduleType', form);

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

  return (
    <Collapse
      expandIconPosition="start"
      bordered={false}
      ghost
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

export default AdvanceConfig;
