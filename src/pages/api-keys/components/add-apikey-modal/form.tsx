import Password from '@/components/seal-form/password';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { accessScopeOptions, expirationOptions } from '../../config';
import { FormData, ListItem } from '../../config/types';
import AllowModelsForm from './allow-models';

const APIKeyForm: React.FC<{
  action: PageActionType;
  currentData?: Partial<ListItem> | null;
  onValuesChange?: (changedValues: any, allValues: any) => void;
}> = ({ action, currentData, onValuesChange }) => {
  const intl = useIntl();

  const optionRender = (option: any) => {
    return (
      <span className="flex-center gap-4">
        {option.label}
        {option.data.description && (
          <span className="text-tertiary">[{option.data.description}]</span>
        )}
      </span>
    );
  };

  return (
    <>
      <Form.Item<FormData>
        name="name"
        rules={[
          {
            required: true,
            message: intl.formatMessage(
              { id: 'common.form.rule.input' },
              {
                name: intl.formatMessage({ id: 'common.table.name' })
              }
            )
          }
        ]}
      >
        <SealInput.Input
          trim
          disabled={action === PageAction.EDIT}
          label={intl.formatMessage({ id: 'common.table.name' })}
          required
        ></SealInput.Input>
      </Form.Item>
      {action === PageAction.CREATE && (
        <Form.Item<FormData> name="custom">
          <Password
            trim
            autoComplete="new-password"
            label={intl.formatMessage({ id: 'playground.params.custom' })}
          ></Password>
        </Form.Item>
      )}
      <Form.Item<FormData>
        name="scope"
        normalize={(value) => (value ? [value] : [])}
        getValueProps={(value) => ({
          value: Array.isArray(value) ? value[0] : value
        })}
      >
        <SealSelect
          optionRender={optionRender}
          options={accessScopeOptions}
          label={intl.formatMessage({ id: 'models.table.accessScope' })}
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData>
        name="expires_in"
        rules={[
          {
            required: true,
            message: intl.formatMessage(
              { id: 'common.form.rule.select' },
              {
                name: intl.formatMessage({
                  id: 'apikeys.form.expiretime'
                })
              }
            )
          }
        ]}
      >
        <SealSelect
          disabled={action === PageAction.EDIT}
          options={expirationOptions}
          label={intl.formatMessage({ id: 'apikeys.form.expiretime' })}
          required
        ></SealSelect>
      </Form.Item>
      <Form.Item<FormData> name="description" rules={[{ required: false }]}>
        <SealInput.TextArea
          scaleSize={true}
          label={intl.formatMessage({ id: 'common.table.description' })}
        ></SealInput.TextArea>
      </Form.Item>
      <AllowModelsForm
        currentData={currentData}
        action={action}
        onValuesChange={onValuesChange}
      ></AllowModelsForm>
    </>
  );
};

export default APIKeyForm;
