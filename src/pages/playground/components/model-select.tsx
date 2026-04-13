import { Select as SealSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { useFormContext } from '../config/form-context';

const ModelSelect: React.FC<{
  title?: React.ReactNode;
  showModelSelector?: boolean;
}> = ({ title, showModelSelector = true }) => {
  const intl = useIntl();
  const { onModelChange, modelList } = useFormContext();
  return (
    <>
      <h3 className="m-b-20  font-size-14 line-24 font-500">
        {title || (
          <span>{intl.formatMessage({ id: 'playground.parameters' })}</span>
        )}
      </h3>
      {showModelSelector && (
        <Form.Item
          name="model"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.select'
                },
                {
                  name: intl.formatMessage({ id: 'playground.model' })
                }
              )
            }
          ]}
        >
          <SealSelect
            required
            description={intl.formatMessage({
              id: 'playground.model.noavailable.tips2'
            })}
            onChange={onModelChange}
            showSearch={true}
            options={modelList}
            label={intl.formatMessage({ id: 'playground.model' })}
          ></SealSelect>
        </Form.Item>
      )}
    </>
  );
};

export default ModelSelect;
