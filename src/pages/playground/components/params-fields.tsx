import FieldComponent from '@/components/seal-form/field-component';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React from 'react';
import { useFormContext } from '../config/form-context';
import { ParamsSchema } from '../config/types';

interface ParamsFieldsProps {
  paramsConfig?: ParamsSchema[];
}

const ParamsFields: React.FC<ParamsFieldsProps> = ({ paramsConfig = [] }) => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { meta } = useFormContext();

  const renderDescription = (description: any) => {
    let desc = description?.text;
    if (description?.isLocalized) {
      desc = intl.formatMessage({ id: description?.text });
    }
    if (description?.html) {
      return <div dangerouslySetInnerHTML={{ __html: desc }}></div>;
    }

    return desc;
  };

  return paramsConfig?.map((item: ParamsSchema) => {
    const comProps = {
      ...item.attrs,
      label: item.label.isLocalized
        ? intl.formatMessage({ id: item.label.text })
        : item.label.text
    };
    // if no disabledConfig, render directly
    if (!item.disabledConfig) {
      return (
        <Form.Item
          name={item.name}
          rules={item.rules}
          key={item.name}
          dependencies={item.dependencies}
          {...item.formItemAttrs}
        >
          <FieldComponent
            {...comProps}
            disabled={item.disabled}
            description={renderDescription(item.description)}
            onChange={null}
            {..._.omit(item, [
              'name',
              'rules',
              'formItemAttrs',
              'dependencies',
              'disabledConfig',
              'description',
              'initAttrs'
            ])}
            {...item.initAttrs?.(meta)}
          />
        </Form.Item>
      );
    }

    // if has disabledConfig, wrap with another Form.Item to listen the dependencies change
    return (
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) => {
          return (
            item.disabledConfig?.depends.some(
              (dep) => prevValues[dep] !== currentValues[dep]
            ) ?? false
          );
        }}
        key={item.name}
      >
        {() => (
          <Form.Item
            name={item.name}
            rules={item.rules}
            dependencies={item.dependencies}
            {...item.formItemAttrs}
          >
            <FieldComponent
              {...comProps}
              disabled={item.disabledConfig?.when(form.getFieldsValue())}
              description={renderDescription(item.description)}
              onChange={null}
              {..._.omit(item, [
                'name',
                'rules',
                'formItemAttrs',
                'dependencies',
                'disabledConfig',
                'description',
                'initAttrs'
              ])}
              {...item.initAttrs?.(meta)}
            />
          </Form.Item>
        )}
      </Form.Item>
    );
  });
};

export default ParamsFields;
