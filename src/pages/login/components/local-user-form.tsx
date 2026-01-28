import HighlightCode from '@/components/highlight-code';
import SealInput from '@/components/seal-form/seal-input';
import externalLinks from '@/constants/external-links';
import {
  InfoCircleOutlined,
  LockOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Divider, Form, FormInstance } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => {
  return {
    commandInfo: css`
      .content {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 12px;
        .icon {
          padding-top: 2px;
          color: ${token.colorInfo};
          font-size: 16px;
        }
        .info {
          line-height: 1.5;
          color: ${token.colorTextSecondary};
          font-size: 14px;
        }
      }
    `
  };
});

interface LocalUserFormProps {
  handleLogin: (values: any) => void;
  form: FormInstance;
  loading?: boolean;
  loginOption: {
    saml: boolean;
    oidc: boolean;
    first_time_setup: boolean;
    get_initial_password_command: string;
  };
}

const LocalUserForm: React.FC<LocalUserFormProps> = (props) => {
  const { handleLogin, form, loginOption } = props;
  const intl = useIntl();
  const { styles } = useStyles();

  const renderCommandInfo = () => {
    if (!loginOption?.first_time_setup) {
      return null;
    }
    return (
      <div className={styles.commandInfo}>
        <Divider style={{ marginTop: 16, marginBottom: 12 }} />
        <div className="content">
          <InfoCircleOutlined className="icon" />
          <span className="info">
            {intl.formatMessage({ id: 'users.login.getInitialPassword' })}
          </span>
        </div>
        <HighlightCode
          theme="dark"
          code={loginOption.get_initial_password_command}
          copyValue={loginOption.get_initial_password_command}
          lang="bash"
        ></HighlightCode>
      </div>
    );
  };

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
        loading={props.loading}
        style={{ height: '48px', fontSize: '14px' }}
      >
        {intl.formatMessage({ id: 'common.button.login' })}
      </Button>
      {renderCommandInfo()}
    </Form>
  );
};

export default LocalUserForm;
