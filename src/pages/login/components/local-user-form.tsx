import externalLinks from '@/constants/external-links';
import {
  InfoCircleOutlined,
  LockOutlined,
  UserOutlined
} from '@ant-design/icons';
import { HighlightCode, IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Divider, Flex, Form, FormInstance, Input } from 'antd';
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
    `,
    password: css`
      .ant-input-suffix {
        display: flex;
        flex-direction: row-reverse;
        .reset-link {
          padding: 0;
          font-size: 12px;
          color: ${token.colorTextSecondary};
        }
        .ant-divider {
          margin-left: 2px;
        }
        .reset-link:hover {
          color: var(--ant-color-link-hover);
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
      // Same shape Buttons uses: 360px design width, capped at the
      // parent's inner width so the form doesn't overflow on the
      // enterprise cover layout (272px inner).
      layout="vertical"
      requiredMark={false}
      style={{ width: '360px', maxWidth: '100%', margin: '0 auto' }}
      onFinish={handleLogin}
    >
      <Form.Item
        name="username"
        label={intl.formatMessage({ id: 'common.form.username' })}
        style={{
          marginBottom: 20
        }}
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
        <Input
          autoComplete="username"
          placeholder={intl.formatMessage({
            id: 'common.login.username.holder'
          })}
          prefix={<UserOutlined />}
          style={{ height: 44 }}
        />
      </Form.Item>
      <Form.Item
        style={{
          marginBottom: 20
        }}
        name="password"
        label={intl.formatMessage({ id: 'common.form.password' })}
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
        <Input.Password
          className={styles.password}
          autoComplete="current-password"
          prefix={<LockOutlined />}
          style={{ height: 44 }}
          placeholder={intl.formatMessage({
            id: 'common.login.password.holder'
          })}
          suffix={
            <Flex align="center" gap={0}>
              <Button
                type="link"
                size="small"
                className="reset-link"
                href={externalLinks.resetPassword}
                target="_blank"
              >
                {intl.formatMessage({ id: 'common.button.forgotpassword' })}
              </Button>
              <Divider orientation="vertical" />
            </Flex>
          }
        />
      </Form.Item>
      <Button
        htmlType="submit"
        type="primary"
        block
        loading={props.loading}
        icon={<IconFont type="icon-login" />}
        style={{ height: '44px', fontSize: '14px', marginTop: 16 }}
      >
        {intl.formatMessage({ id: 'common.button.login' })}
      </Button>
      {renderCommandInfo()}
    </Form>
  );
};

export default LocalUserForm;
