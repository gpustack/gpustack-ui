import { CheckboxField, CollapsePanel, InputNumber } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from 'react';
import ModelSelect from '../../components/model-select';
import ParamsFields from '../../components/params-fields';
import { FormContext } from '../../config/form-context';
import { ParamsSchema } from '../../config/types';
import { getVideoMediaRules, isValidVideoMediaUrl } from '../media-inputs';
import AdvancedParametersField from './advanced-parameters-field';
import ReferenceInputs from './reference-inputs';
import ReferenceMediaInput from './reference-media-input';
import VideoSizeFields from './video-size-fields';

const ADVANCED_CONFIG = 'advanced_config';
const advancedFields = new Set([
  'task',
  'firstFrame',
  'lastFrame',
  'references',
  'referenceImage',
  'advancedParameters'
]);

type ParamsSettingsProps = {
  ref?: any;
  parametersTitle?: React.ReactNode;
  showModelSelector?: boolean;
  modelList?: Global.BaseOption<string>[];
  onValuesChange?: (changeValues: any, value: Record<string, any>) => void;
  onModelChange?: (model: string) => void;
  onFinish?: (values: any) => void;
  onFinishFailed?: (errorInfo: any) => void;
  initialValues?: Record<string, any>; // for initial values when switch model, aviod update values from setParams
  meta?: Record<string, any>;
  paramsConfig?: ParamsSchema[];
};

const ParamsSettings: React.FC<ParamsSettingsProps> = forwardRef(
  (
    {
      onValuesChange,
      onModelChange,
      onFinish,
      onFinishFailed,
      parametersTitle,
      initialValues,
      modelList,
      showModelSelector = true,
      meta,
      paramsConfig
    },
    ref
  ) => {
    const intl = useIntl();
    const [form] = Form.useForm();
    const [activeKey, setActiveKey] = useState<string | string[]>([]);
    const advancedOpen = activeKey.includes(ADVANCED_CONFIG);
    const taskConfig = paramsConfig?.find(({ name }) => name === 'task');
    const basicParamsConfig = paramsConfig?.filter(
      ({ name }) =>
        !['task', 'aspectRatio', 'size', 'width', 'height'].includes(name)
    );
    const task = Form.useWatch('task', form) ?? initialValues?.task;
    const randomSeed =
      Form.useWatch('random_seed', form) ?? initialValues?.random_seed;
    const mediaRules = getVideoMediaRules(meta, task);
    const showTaskSelector = taskConfig && taskConfig.options?.length !== 1;
    const showReferenceImage = !meta?.video && task !== 't2va';
    const showMediaInputs = task !== 't2va' && Boolean(mediaRules.max_items);

    useImperativeHandle(ref, () => ({
      form,
      getFieldsValue: form.getFieldsValue,
      setFieldsValue: form.setFieldsValue,
      async validateFields() {
        try {
          return await form.validateFields();
        } catch (error) {
          if (isAdvancedError(error)) setActiveKey([ADVANCED_CONFIG]);
          throw error;
        }
      }
    }));

    const handleOnFinish = (values: any) => {
      onFinish?.(values);
    };

    const handleOnFinishFailed = (errorInfo: any) => {
      if (isAdvancedError(errorInfo)) setActiveKey([ADVANCED_CONFIG]);
      onFinishFailed?.(errorInfo);
    };

    const handleOnValuesChange = (
      changed: Record<string, any>,
      values: Record<string, any>
    ) => {
      const normalized = Object.fromEntries(
        Object.entries(changed).map(([key, value]) => [
          key,
          value?.target?.checked ?? value?.target?.value ?? value
        ])
      );
      form.setFieldsValue(normalized);
      onValuesChange?.(normalized, { ...values, ...normalized });
    };

    useEffect(() => {
      form.setFieldsValue(initialValues);
    }, [initialValues]);

    return (
      <FormContext.Provider
        value={{
          meta,
          modelList: modelList || [],
          onValuesChange: onValuesChange,
          onModelChange: onModelChange
        }}
      >
        <Form
          form={form}
          onValuesChange={handleOnValuesChange}
          onFinish={handleOnFinish}
          onFinishFailed={handleOnFinishFailed}
          initialValues={initialValues}
        >
          <ModelSelect
            title={parametersTitle}
            showModelSelector={showModelSelector}
          ></ModelSelect>
          <ParamsFields paramsConfig={basicParamsConfig} />
          <VideoSizeFields paramsConfig={paramsConfig} />
          <Form.Item
            name="seed"
            rules={[{ type: 'integer', min: 0, max: Number.MAX_SAFE_INTEGER }]}
          >
            <InputNumber
              disabled={randomSeed}
              min={0}
              max={Number.MAX_SAFE_INTEGER}
              precision={0}
              label={intl.formatMessage({ id: 'playground.image.params.seed' })}
            />
          </Form.Item>
          <Form.Item
            name="random_seed"
            valuePropName="checked"
            style={{ marginBottom: 'var(--ant-margin)' }}
          >
            <CheckboxField
              label={intl.formatMessage({
                id: 'playground.image.params.randomseed'
              })}
            />
          </Form.Item>
          {taskConfig && !showTaskSelector && (
            <Form.Item
              name="task"
              hidden
              rules={taskConfig.rules}
              getValueProps={(value) => ({ value: value ?? '' })}
            >
              <input type="hidden" />
            </Form.Item>
          )}
          <CollapsePanel
            activeKey={activeKey}
            onChange={setActiveKey}
            items={[
              {
                key: ADVANCED_CONFIG,
                label: intl.formatMessage({ id: 'resources.form.advanced' }),
                forceRender: true,
                children: (
                  <>
                    {taskConfig && showTaskSelector && (
                      <ParamsFields paramsConfig={[taskConfig]} />
                    )}
                    {showMediaInputs && <ReferenceInputs rules={mediaRules} />}
                    {showReferenceImage && (
                      <Form.Item
                        name="referenceImage"
                        rules={[
                          {
                            validator: async (_, value?: File | string) => {
                              if (isValidVideoMediaUrl(value)) return;
                              throw new Error(
                                intl.formatMessage({
                                  id: 'playground.params.refImage.invalid'
                                })
                              );
                            }
                          }
                        ]}
                      >
                        <ReferenceMediaInput />
                      </Form.Item>
                    )}
                    <AdvancedParametersField active={advancedOpen} />
                  </>
                )
              }
            ]}
          />
        </Form>
      </FormContext.Provider>
    );
  }
);

function isAdvancedError(error: unknown) {
  return (error as { errorFields?: { name: string[] }[] })?.errorFields?.some(
    ({ name }) => advancedFields.has(name[0])
  );
}

export default ParamsSettings;
