import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { INPUT_WIDTH } from '@/constants';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form, InputNumber, Tooltip } from 'antd';
import _ from 'lodash';
import { memo, useCallback, useEffect, useId } from 'react';
import { ParamsSchema } from '../config/types';
import CustomLabelStyles from '../style/custom-label.less';

type ParamsSettingsFormProps = {
  top_n?: number;
  model?: string;
};

type ParamsSettingsProps = {
  selectedModel?: string;
  showModelSelector?: boolean;
  params?: Record<string, any>;
  model?: string;
  modelList: Global.BaseOption<string>[];
  onValuesChange?: (changeValues: any, value: Record<string, any>) => void;
  setParams: (params: any) => void;
  globalParams?: Record<string, any>;
  paramsConfig?: ParamsSchema[];
  initialValues?: Record<string, any>;
};

const ParamsSettings: React.FC<ParamsSettingsProps> = ({
  setParams,
  onValuesChange,
  selectedModel,
  globalParams,
  initialValues,
  paramsConfig,
  modelList,
  showModelSelector = true
}) => {
  const intl = useIntl();
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
  }, [modelList, showModelSelector, selectedModel, initialValues]);

  const handleOnFinish = (values: any) => {
    console.log('handleOnFinish', values);
  };

  const handleOnFinishFailed = (errorInfo: any) => {
    console.log('handleOnFinishFailed', errorInfo);
  };

  const handleValuesChange = useCallback(
    (changedValues: any, allValues: any) => {
      setParams?.(allValues);
      onValuesChange?.(changedValues, allValues);
    },
    [onValuesChange, setParams]
  );
  const handleFieldValueChange = useCallback(
    (val: any, field: string) => {
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
    },
    [form, setParams, onValuesChange]
  );

  useEffect(() => {
    form.setFieldsValue(globalParams);
  }, [globalParams]);

  const renderFields = useCallback(() => {
    console.log('paramsConfig:', paramsConfig);
    if (!paramsConfig?.length) {
      return null;
    }
    return paramsConfig.map((item: ParamsSchema) => {
      if (item.type === 'InputNumber') {
        return (
          <Form.Item name={item.name} rules={item.rules} key={item.name}>
            <SealInput.Number
              {...item.attrs}
              style={{ width: '100%' }}
              label={
                item.label.isLocalized
                  ? intl.formatMessage({ id: item.label.text })
                  : item.label.text
              }
            ></SealInput.Number>
          </Form.Item>
        );
      }
      if (item.type === 'Select') {
        return (
          <Form.Item name={item.name} rules={item.rules} key={item.name}>
            <SealSelect
              options={item.options}
              label={
                item.label.isLocalized
                  ? intl.formatMessage({ id: item.label.text })
                  : item.label.text
              }
            ></SealSelect>
          </Form.Item>
        );
      }
      return null;
    });
  }, [paramsConfig]);

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
        {
          <>
            <h3 className="m-b-20 m-l-10 font-size-14 line-24">
              <span>{intl.formatMessage({ id: 'playground.parameters' })}</span>
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
                showSearch={true}
                options={modelList}
                label={intl.formatMessage({ id: 'playground.model' })}
              ></SealSelect>
            </Form.Item>
          </>
        }
        {renderFields()}
      </div>
    </Form>
  );
};

export default memo(ParamsSettings);
