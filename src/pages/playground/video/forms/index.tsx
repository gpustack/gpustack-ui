import { CollapsePanel, Input } from '@gpustack/core-ui';
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
import ReferenceImageInput from './reference-image-input';

const ADVANCED_CONFIG = 'advanced_config';

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
    const [activeKey, setActiveKey] = useState<string | string[]>(
      ADVANCED_CONFIG
    );

    useImperativeHandle(ref, () => ({
      form,
      getFieldsValue: form.getFieldsValue,
      setFieldsValue: form.setFieldsValue
    }));

    const handleOnFinish = (values: any) => {
      onFinish?.(values);
    };

    const handleOnFinishFailed = (errorInfo: any) => {
      onFinishFailed?.(errorInfo);
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
          onValuesChange={onValuesChange}
          onFinish={handleOnFinish}
          onFinishFailed={handleOnFinishFailed}
          initialValues={initialValues}
        >
          <ModelSelect
            title={parametersTitle}
            showModelSelector={showModelSelector}
          ></ModelSelect>
          <ParamsFields paramsConfig={paramsConfig}></ParamsFields>
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
                    <Form.Item
                      name="referenceImage"
                      hidden={meta?.video?.family === 'minimax_h3'}
                      rules={[
                        {
                          validator: async (_, value?: File | string) => {
                            const link =
                              typeof value === 'string' ? value.trim() : '';
                            if (!link) return;

                            try {
                              const url = new URL(link);
                              if (
                                /^https?:\/\//i.test(link) &&
                                !url.username &&
                                !url.password
                              )
                                return;
                            } catch {
                              // Report malformed URLs with the same field error.
                            }
                            throw new Error(
                              intl.formatMessage({
                                id: 'playground.params.refImage.invalid'
                              })
                            );
                          }
                        }
                      ]}
                    >
                      <ReferenceImageInput />
                    </Form.Item>
                    <Form.Item
                      name="extra_body"
                      getValueProps={(value) => ({ value: value ?? '' })}
                      rules={[
                        {
                          validator: async (_, value?: string) => {
                            if (!value?.trim()) return;
                            try {
                              const parsed = JSON.parse(value);
                              if (
                                parsed !== null &&
                                typeof parsed === 'object' &&
                                !Array.isArray(parsed)
                              )
                                return;
                            } catch {
                              // Report invalid JSON with the same field error.
                            }
                            throw new Error(
                              intl.formatMessage({
                                id: 'playground.video.extraParams.invalid'
                              })
                            );
                          }
                        }
                      ]}
                    >
                      <Input.TextArea
                        allowClear
                        autoSize={{ minRows: 3, maxRows: 12 }}
                        label={intl.formatMessage({
                          id: 'playground.video.extraParams'
                        })}
                        description={intl.formatMessage({
                          id: 'playground.video.extraParams.tips'
                        })}
                      />
                    </Form.Item>
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

export default ParamsSettings;
