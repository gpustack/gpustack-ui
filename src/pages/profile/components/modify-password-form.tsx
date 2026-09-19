import { PasswordReg } from '@/config';
import { Input as CInput } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { forwardRef, useImperativeHandle } from 'react';
import { FormData } from '../config/types';

interface ModifyPasswordFormProps {
  onFinish: (values: FormData) => void;
  onFinishFailed?: () => void;
}

/**
 * Fields only. The submit lock, the request and the buttons belong to the modal
 * that hosts it (modify-password-modal), the same split every other form in the
 * product uses — the host owns the footer, so the form must not draw one.
 */
const ModifyPasswordForm = forwardRef<any, ModifyPasswordFormProps>(
  ({ onFinish, onFinishFailed }, ref) => {
    const [form] = Form.useForm();
    const intl = useIntl();

    useImperativeHandle(ref, () => form, [form]);

    return (
      <Form
        name="modifyPasswordForm"
        form={form}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        preserve={false}
      >
        <Form.Item<FormData>
          name="current_password"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                {
                  name: intl.formatMessage({
                    id: 'users.form.currentpassword'
                  })
                }
              )
            }
          ]}
        >
          <CInput.Password
            autoComplete="current-password"
            label={intl.formatMessage({ id: 'users.form.currentpassword' })}
            required
          />
        </Form.Item>
        <Form.Item<FormData>
          name="new_password"
          rules={[
            {
              required: true,
              pattern: PasswordReg,
              message: intl.formatMessage({
                id: 'users.form.rule.password'
              })
            }
          ]}
        >
          <CInput.Password
            autoComplete="new-password"
            label={intl.formatMessage({ id: 'users.form.newpassword' })}
            required
          />
        </Form.Item>
        <Form.Item
          name="confirm_password"
          dependencies={['new_password']}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'users.password.confirm.empty'
              })
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    intl.formatMessage({ id: 'users.password.confirm.error' })
                  )
                );
              }
            })
          ]}
        >
          <CInput.Password
            required
            autoComplete="new-password"
            label={intl.formatMessage({ id: 'users.password.confirm' })}
          />
        </Form.Item>
      </Form>
    );
  }
);

ModifyPasswordForm.displayName = 'ModifyPasswordForm';

export default ModifyPasswordForm;
