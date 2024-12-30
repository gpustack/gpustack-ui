import FieldWrapper from '@/components/seal-form/field-wrapper';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { INPUT_WIDTH } from '@/constants';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form, InputNumber, Slider, Tooltip } from 'antd';
import _ from 'lodash';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo
} from 'react';
import { ParamsSchema } from '../config/types';
import CustomLabelStyles from '../style/custom-label.less';

type ParamsSettingsFormProps = {
  top_n?: number;
  model?: string;
};

type ParamsSettingsProps = {
  ref?: any;
  parametersTitle?: React.ReactNode;
  selectedModel?: string;
  showModelSelector?: boolean;
  params?: Record<string, any>;
  model?: string;
  modelList: Global.BaseOption<string>[];
  onValuesChange?: (changeValues: any, value: Record<string, any>) => void;
  setParams: (params: any) => void;
  onModelChange?: (model: string) => void;
  globalParams?: Record<string, any>;
  paramsConfig?: ParamsSchema[];
  initialValues?: Record<string, any>;
  extra?: React.ReactNode[];
};

const ParamsSettings: React.FC<ParamsSettingsProps> = forwardRef(
  (
    {
      setParams,
      onValuesChange,
      onModelChange,
      parametersTitle,
      selectedModel,
      globalParams,
      initialValues,
      paramsConfig,
      modelList,
      params,
      showModelSelector = true,
      extra
    },
    ref
  ) => {
    const intl = useIntl();
    const [form] = Form.useForm();
    const formId = useId();

    useImperativeHandle(ref, () => ({
      form
    }));

    useEffect(() => {
      let model = selectedModel || '';

      if (showModelSelector) {
        model = model || _.get(modelList, '[0].value');
      }

      form.setFieldsValue({
        model: model,
        ...initialValues
      });
      setParams({
        model: model,
        ...initialValues
      });
      onModelChange?.(model);
    }, [modelList, showModelSelector, selectedModel, initialValues]);

    const handleModelChange = useCallback(
      (value: string) => {
        onModelChange?.(value);
      },
      [onModelChange]
    );

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

    const renderLabel = useCallback(
      (args: { field: string; label: string; description: string }) => {
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
      },
      [form, handleFieldValueChange]
    );

    const renderDescription = useCallback(
      (item: ParamsSchema) => {
        if (!item.description) {
          return null;
        }
        if (item.description.html) {
          return (
            <div
              className="m-t-5"
              dangerouslySetInnerHTML={{
                __html: intl.formatMessage({ id: item.description.text })
              }}
            ></div>
          );
        }
        return intl.formatMessage({ id: item.description.text });
      },
      [intl]
    );
    const renderFields = useMemo(() => {
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
        if (item.type === 'TextArea') {
          return (
            <Form.Item name={item.name} rules={item.rules} key={item.name}>
              <SealInput.TextArea
                {...item.attrs}
                style={{ width: '100%' }}
                label={
                  item.label.isLocalized
                    ? intl.formatMessage({ id: item.label.text })
                    : item.label.text
                }
              ></SealInput.TextArea>
            </Form.Item>
          );
        }
        if (item.type === 'Select') {
          return (
            <Form.Item name={item.name} rules={item.rules} key={item.name}>
              <SealSelect
                {...item.attrs}
                description={renderDescription(item)}
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
        if (item.type === 'Slider') {
          return (
            <Form.Item name={item.name} rules={item.rules} key={item.name}>
              <FieldWrapper
                label={renderLabel({
                  field: item.name,
                  label: item.label.isLocalized
                    ? intl.formatMessage({ id: item.label.text })
                    : item.label.text,
                  description: item.description?.isLocalized
                    ? intl.formatMessage({ id: item.description?.text })
                    : item.description?.text || ''
                })}
                style={{ padding: '20px 2px 0' }}
                variant="borderless"
              >
                <Slider
                  {...item.attrs}
                  style={{ marginBottom: 0, marginTop: 16, marginInline: 0 }}
                  tooltip={{ open: false }}
                  value={form.getFieldValue(item.name) || undefined}
                  onChange={(val) => handleFieldValueChange(val, item.name)}
                ></Slider>
              </FieldWrapper>
            </Form.Item>
          );
        }
        return null;
      });
    }, [paramsConfig, params, renderDescription, intl]);

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
                {parametersTitle || (
                  <span>
                    {intl.formatMessage({ id: 'playground.parameters' })}
                  </span>
                )}
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
                  onChange={handleModelChange}
                  showSearch={true}
                  options={modelList}
                  label={intl.formatMessage({ id: 'playground.model' })}
                ></SealSelect>
              </Form.Item>
            </>
          }
          {renderFields}
          {extra}
        </div>
      </Form>
    );
  }
);

export default memo(ParamsSettings);
