import SealInput from '@/components/seal-form/seal-input';
import externalLinks from '@/constants/external-links';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Form, FormInstance } from 'antd';

interface LocalUserFormProps {
  handleLogin: (values: any) => void;
  form: FormInstance;
}

const LocalUserForm: React.FC<LocalUserFormProps> = (props) => {
  const { handleLogin, form } = props;
  const intl = useIntl();

  return (
    <Form
      form={form}
      style={{ width: '360px', margin: '0 auto' }}
      onFinish={handleLogin}
    >
      <Form.Item
        name="username"
        rules={[
          {
            required: true,
            message: intl.formatMessage(
              { id: 'common.form.rule.input' },
              {
                name: intl.formatMessage({ id: 'common.form.username' })
              }
            )
          }
        ]}
      >
        <SealInput.Input
          label={intl.formatMessage({ id: 'common.form.username' })}
          prefix={<UserOutlined />}
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          {
            required: true,
            message: intl.formatMessage(
              { id: 'common.form.rule.input' },
              {
                name: intl.formatMessage({ id: 'common.form.password' })
              }
            )
          }
        ]}
      >
        <SealInput.Password
          prefix={<LockOutlined />}
          label={intl.formatMessage({ id: 'common.form.password' })}
        />
      </Form.Item>
      <div
        className="flex-center flex-between"
        style={{
          marginBottom: 24
        }}
      >
        <Form.Item noStyle name="autoLogin" valuePropName="checked">
          <Checkbox style={{ marginLeft: 5 }}>
            <span style={{ color: 'var(--ant-color-text-secondary)' }}>
              {intl.formatMessage({ id: 'common.login.rember' })}
            </span>
          </Checkbox>
        </Form.Item>
        <Button
          type="link"
          size="small"
          href={externalLinks.resetPassword}
          target="_blank"
          style={{ padding: 0 }}
        >
          {intl.formatMessage({ id: 'common.button.forgotpassword' })}
        </Button>
      </div>
      <Button
        htmlType="submit"
        type="primary"
        block
        style={{ height: '48px', fontSize: '14px' }}
      >
        {intl.formatMessage({ id: 'common.button.login' })}
      </Button>
    </Form>
  );
};

export default LocalUserForm;
