import FieldWrapper from '@/components/seal-form/field-wrapper';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { INPUT_WIDTH } from '@/constants';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form, InputNumber, Slider, Tooltip } from 'antd';
import _ from 'lodash';
import { useEffect, useId, useState } from 'react';
import CustomLabelStyles from '../style/custom-label.less';

type ParamsSettingsFormProps = {
  seed?: number;
  stop?: number;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  model?: string;
};

type ParamsSettingsProps = {
  selectedModel?: string;
  showModelSelector?: boolean;
  params?: ParamsSettingsFormProps;
  model?: string;
  modelList: Global.BaseOption<string>[];
  onValuesChange?: (changeValues: any, value: Record<string, any>) => void;
  setParams: (params: any) => void;
  globalParams?: ParamsSettingsFormProps;
};

const ParamsSettings: React.FC<ParamsSettingsProps> = ({
  selectedModel,
  setParams,
  globalParams,
  onValuesChange,
  model,
  modelList,
  showModelSelector = true
}) => {
  const intl = useIntl();
  const [ModelList, setModelList] = useState([]);
  const initialValues = {
    seed: null,
    stop: null,
    temperature: 1,
    top_p: 1,
    max_tokens: 1024,
    ...globalParams
  };
  const [form] = Form.useForm();
  const formId = useId();

  useEffect(() => {
    if (showModelSelector) {
      form.setFieldsValue({
        model: selectedModel || _.get(modelList, '[0].value'),
        ...initialValues
      });
      setParams({
        model: selectedModel || _.get(modelList, '[0].value'),
        ...initialValues
      });
    } else {
      form.setFieldsValue({
        model: selectedModel || '',
        ...initialValues
      });
      setParams({
        model: selectedModel || '',
        ...initialValues
      });
    }
  }, [modelList, showModelSelector, selectedModel]);

  const handleOnFinish = (values: any) => {
    console.log('handleOnFinish', values);
  };

  const handleOnFinishFailed = (errorInfo: any) => {
    console.log('handleOnFinishFailed', errorInfo);
  };

  const handleValuesChange = (changedValues: any, allValues: any) => {
    console.log('changedValues===', changedValues);
    setParams?.(allValues);
    onValuesChange?.(changedValues, allValues);
  };
  const handleFieldValueChange = (val: any, field: string) => {
    const values = form.getFieldsValue();
    form.setFieldsValue({
      ...values,
      [field]: val
    });
    setParams({
      ...values,
      [field]: val
    });
    onValuesChange?.(
      { [field]: val },
      {
        ...values,
        [field]: val
      }
    );
  };

  const handleResetParams = () => {
    form.setFieldsValue(initialValues);
    setParams(initialValues);
  };

  useEffect(() => {
    form.setFieldsValue(globalParams);
  }, [globalParams]);

  const renderLabel = (args: {
    field: string;
    label: string;
    description: string;
  }) => {
    return (
      <span
        className={CustomLabelStyles.label}
        style={{ width: INPUT_WIDTH.mini }}
      >
        <span className="text">
          {args.description ? (
            <Tooltip title={args.description}>
              <span> {args.label}</span>
              <span className="m-l-5">
                <InfoCircleOutlined />
              </span>
            </Tooltip>
          ) : (
            <span>{args.label}</span>
          )}
        </span>

        <InputNumber
          className="label-val"
          variant="outlined"
          size="small"
          value={form.getFieldValue(args.field)}
          controls={false}
          onChange={(val) => handleFieldValueChange(val, args.field)}
        ></InputNumber>
      </span>
    );
  };

  return (
    <Form
      name={formId}
      form={form}
      onValuesChange={handleValuesChange}
      onFinish={handleOnFinish}
      onFinishFailed={handleOnFinishFailed}
    >
      <div>
        {showModelSelector && (
          <>
            <h3 className="m-b-20 m-l-10 font-size-14">
              {intl.formatMessage({ id: 'playground.model' })}
            </h3>
            <Form.Item<ParamsSettingsFormProps>
              name="model"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage(
                    {
                      id: 'common.form.rule.select'
                    },
                    { name: intl.formatMessage({ id: 'playground.model' }) }
                  )
                }
              ]}
            >
              <SealSelect
                showSearch
                options={modelList}
                label={intl.formatMessage({ id: 'playground.model' })}
              ></SealSelect>
            </Form.Item>
          </>
        )}
        <h3 className="m-b-20 m-l-10 flex-between flex-center font-size-14">
          <span>{intl.formatMessage({ id: 'playground.parameters' })}</span>
        </h3>
        <Form.Item<ParamsSettingsFormProps>
          name="temperature"
          rules={[{ required: false }]}
        >
          <FieldWrapper
            label={renderLabel({
              field: 'temperature',
              label: 'Temperature',
              description: intl.formatMessage({
                id: 'playground.params.temperature.tips'
              })
            })}
            style={{ padding: '20px 2px 0' }}
            variant="borderless"
          >
            <Slider
              defaultValue={1}
              max={2}
              step={0.1}
              style={{ marginBottom: 0, marginTop: 16, marginInline: 0 }}
              tooltip={{ open: false }}
              value={form.getFieldValue('temperature') || undefined}
              onChange={(val) => handleFieldValueChange(val, 'temperature')}
            ></Slider>
          </FieldWrapper>
        </Form.Item>
        <Form.Item<ParamsSettingsFormProps>
          name="max_tokens"
          rules={[{ required: false }]}
        >
          <FieldWrapper
            label={renderLabel({
              field: 'max_tokens',
              label: 'Max Tokens',
              description: intl.formatMessage({
                id: 'playground.params.maxtokens.tips'
              })
            })}
            style={{ padding: '20px 2px 0' }}
            variant="borderless"
          >
            <Slider
              defaultValue={1024}
              max={2048}
              step={1}
              style={{ marginBottom: 0, marginTop: 16, marginInline: 0 }}
              tooltip={{ open: false }}
              value={form.getFieldValue('max_tokens') || undefined}
              onChange={(val) => handleFieldValueChange(val, 'max_tokens')}
            ></Slider>
          </FieldWrapper>
        </Form.Item>
        <Form.Item<ParamsSettingsFormProps>
          name="top_p"
          rules={[{ required: false }]}
        >
          <FieldWrapper
            label={renderLabel({
              field: 'top_p',
              label: 'Top P',
              description: intl.formatMessage({
                id: 'playground.params.topp.tips'
              })
            })}
            style={{ padding: '20px 2px 0' }}
            variant="borderless"
          >
            <Slider
              defaultValue={1}
              max={1}
              step={0.1}
              style={{ marginBottom: 0, marginTop: 16, marginInline: 0 }}
              tooltip={{ open: false }}
              value={form.getFieldValue('top_p') || undefined}
              onChange={(val) => handleFieldValueChange(val, 'top_p')}
            ></Slider>
          </FieldWrapper>
        </Form.Item>
        <Form.Item<ParamsSettingsFormProps>
          name="seed"
          rules={[{ required: false }]}
        >
          <SealInput.Number
            label="Seed"
            min={0}
            description={intl.formatMessage({
              id: 'playground.params.seed.tips'
            })}
            style={{ width: INPUT_WIDTH.mini }}
          ></SealInput.Number>
        </Form.Item>
        <Form.Item<ParamsSettingsFormProps>
          name="stop"
          rules={[{ required: false }]}
          normalize={(value) => {
            return value || null;
          }}
        >
          <SealInput.Input
            allowClear
            label="Stop Sequence"
            description={intl.formatMessage({
              id: 'playground.params.stop.tips'
            })}
            style={{ width: INPUT_WIDTH.mini }}
          ></SealInput.Input>
        </Form.Item>
      </div>
    </Form>
  );
};

export default ParamsSettings;
