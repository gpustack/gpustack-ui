import { PasswordReg } from '@/config';
import { INPUT_WIDTH } from '@/constants';
import useSubmitLock from '@/hooks/use-submit-lock';
import { updatePassword } from '@/pages/login/apis';
import { Input as CInput, FormButtons } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import React from 'react';

interface FormData {
  new_password: string;
  current_password: string;
  confirm_password?: string;
}

interface ModifyPasswordFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

const ModifyPasswordForm: React.FC<ModifyPasswordFormProps> = ({
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const { guard, run, release } = useSubmitLock();

  const handleSubmit = () => {
    guard(() => form.submit());
  };

  const onFinish = async (values: FormData) => {
    await run(async () => {
      await updatePassword({
        new_password: values.new_password,
        current_password: values.current_password
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      onSuccess?.();
    });
  };

  return (
    <Form
      name="modifyPasswordForm"
      form={form}
      onFinish={onFinish}
      onFinishFailed={release}
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
          style={{ width: INPUT_WIDTH.default }}
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
          style={{ width: INPUT_WIDTH.default }}
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
          style={{ width: INPUT_WIDTH.default }}
          label={intl.formatMessage({ id: 'users.password.confirm' })}
        />
      </Form.Item>
      <FormButtons htmlType="submit" onCancel={onCancel} showCancel />
    </Form>
  );
};

ModifyPasswordForm.displayName = 'ModifyPasswordForm';

export default ModifyPasswordForm;
