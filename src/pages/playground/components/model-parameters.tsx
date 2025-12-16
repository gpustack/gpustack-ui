import FieldComponent from '@/components/seal-form/field-component';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo
} from 'react';
import { ParamsSchema } from '../config/types';

type ParamsSettingsProps = {
  ref?: any;
  style?: React.CSSProperties;
  onValuesChange?: (changeValues: any, value: Record<string, any>) => void;
  paramsConfig?: ParamsSchema[];
  initialValues?: Record<string, any>;
  extra?: React.ReactNode;
};

const ParamsSettings: React.FC<ParamsSettingsProps> = forwardRef(
  ({ onValuesChange, style, paramsConfig, initialValues, extra }, ref) => {
    const intl = useIntl();
    const [form] = Form.useForm();
    const formId = useId();

    useImperativeHandle(ref, () => ({
      form
    }));

    useEffect(() => {
      form.setFieldsValue({
        ...initialValues
      });
    }, [initialValues]);

    const handleOnFinish = (values: any) => {
      console.log('handleOnFinish', values);
    };

    const handleOnFinishFailed = (errorInfo: any) => {
      console.log('handleOnFinishFailed', errorInfo);
    };

    const handleValuesChange = useCallback(
      (changedValues: any, allValues: any) => {
        onValuesChange?.(changedValues, allValues);
      },
      [onValuesChange]
    );

    const renderFields = useMemo(() => {
      if (!paramsConfig) {
        return null;
      }
      const formValues = form?.getFieldsValue();
      return paramsConfig?.map((item: ParamsSchema) => {
        return (
          <Form.Item name={item.name} rules={item.rules} key={item.name}>
            <FieldComponent
              disabled={
                item.disabledConfig
                  ? item.disabledConfig?.when?.(formValues)
                  : item.disabled
              }
              description={
                item.description?.isLocalized
                  ? intl.formatMessage({ id: item.description.text })
                  : item.description?.text
              }
              onChange={null}
              {..._.omit(item, [
                'name',
                'rules',
                'disabledConfig',
                'description'
              ])}
            ></FieldComponent>
          </Form.Item>
        );
      });
    }, [paramsConfig, intl]);

    return (
      <Form
        style={{ ...style }}
        name={formId}
        form={form}
        onValuesChange={handleValuesChange}
        onFinish={handleOnFinish}
        onFinishFailed={handleOnFinishFailed}
      >
        <div>
          {renderFields}
          {extra}
        </div>
      </Form>
    );
  }
);

export default ParamsSettings;
