import externalLinks from '@/constants/external-links';
import {
  InfoCircleOutlined,
  LockOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SoundOutlined,
  UserOutlined
} from '@ant-design/icons';
import { HighlightCode, IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import {
  Button,
  Divider,
  Flex,
  Form,
  FormInstance,
  Input,
  Tooltip
} from 'antd';
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
    passwordWrapper: css`
      position: relative;
      .forgot-password {
        position: absolute;
        right: 0;
        top: 74px;
      }
    `,
    captchaButton: css`
      height: 44px;
      width: 130px;
      flex-shrink: 0;
      padding: 0;
      overflow: hidden;
      background-color: ${token.colorFillQuaternary};
    `,
    captchaAudioButton: css`
      width: 44px;
      height: 44px;
      flex: 0 0 44px;
    `,
    captchaInput: css`
      flex: 1;
      min-width: 0;
      margin-bottom: 0;
    `,
    captchaImage: css`
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    `,
    captchaTip: css`
      margin-top: 6px;
      color: ${token.colorTextTertiary};
      font-size: 12px;
      line-height: 1.5;
    `,
    captchaError: css`
      margin-top: 6px;
      color: ${token.colorError};
      font-size: 12px;
      line-height: 1.5;
    `,
    captchaAudio: css`
      display: block;
      width: 100%;
      height: 40px;
      margin-top: 8px;
    `
  };
});

interface LocalUserFormProps {
  handleLogin: (values: any) => void;
  form: FormInstance;
  loading?: boolean;
  loginOption: {
    first_time_setup: boolean;
    get_initial_password_command: string;
  };
  // CAPTCHA is optional: rendered only when the server enables it.
  captchaEnabled: boolean;
  captchaImage: string;
  captchaAudio: string;
  captchaLoading: boolean;
  captchaAudioLoading: boolean;
  captchaError: boolean;
  captchaAudioError: boolean;
  onRefreshCaptcha: () => void | Promise<boolean>;
  onLoadCaptchaAudio: () => void | Promise<boolean>;
}

const LocalUserForm: React.FC<LocalUserFormProps> = (props) => {
  const {
    handleLogin,
    form,
    loginOption,
    captchaEnabled,
    captchaImage,
    captchaAudio,
    captchaLoading,
    captchaAudioLoading,
    captchaError,
    captchaAudioError,
    onRefreshCaptcha,
    onLoadCaptchaAudio
  } = props;
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

  const renderCaptcha = () => {
    if (!captchaEnabled) {
      return null;
    }
    return (
      <Form.Item
        label={intl.formatMessage({ id: 'common.form.captcha' })}
        style={{ marginBottom: 20 }}
        extra={
          <span
            className={captchaError ? styles.captchaError : styles.captchaTip}
          >
            {intl.formatMessage({
              id: captchaError
                ? 'common.login.captcha.error'
                : 'common.login.captcha.tip'
            })}
          </span>
        }
      >
        <Flex gap={8} vertical>
          <Form.Item
            className={styles.captchaInput}
            name="captcha"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  { id: 'common.form.rule.input' },
                  {
                    name: intl.formatMessage({ id: 'common.form.captcha' })
                  }
                )
              }
            ]}
          >
            <Input
              autoComplete="off"
              autoCapitalize="characters"
              disabled={!captchaImage}
              maxLength={6}
              prefix={<SafetyCertificateOutlined />}
              spellCheck={false}
              style={{ height: 44 }}
              placeholder={intl.formatMessage({
                id: 'common.login.captcha.holder'
              })}
            />
          </Form.Item>
          <Flex gap={8}>
            <Tooltip
              title={intl.formatMessage({ id: 'common.button.refresh' })}
            >
              <Button
                aria-label={intl.formatMessage({ id: 'common.button.refresh' })}
                className={styles.captchaButton}
                htmlType="button"
                icon={captchaImage ? undefined : <ReloadOutlined />}
                loading={captchaLoading}
                onClick={onRefreshCaptcha}
              >
                {captchaImage && (
                  <img
                    className={styles.captchaImage}
                    src={captchaImage}
                    alt=""
                  />
                )}
              </Button>
            </Tooltip>
            <Tooltip
              title={intl.formatMessage({
                id: 'common.login.captcha.audio.listen'
              })}
            >
              <Button
                aria-label={intl.formatMessage({
                  id: 'common.login.captcha.audio.listen'
                })}
                className={styles.captchaAudioButton}
                disabled={!captchaImage}
                htmlType="button"
                icon={<SoundOutlined />}
                loading={captchaAudioLoading}
                onClick={onLoadCaptchaAudio}
              />
            </Tooltip>
          </Flex>
        </Flex>
        {captchaAudio && (
          <audio
            aria-label={intl.formatMessage({
              id: 'common.login.captcha.audio.label'
            })}
            autoPlay
            className={styles.captchaAudio}
            controls
            src={captchaAudio}
          />
        )}
        {captchaAudioError && (
          <div aria-live="polite" className={styles.captchaError} role="alert">
            {intl.formatMessage({
              id: 'common.login.captcha.audio.error'
            })}
          </div>
        )}
      </Form.Item>
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
      styles={{
        label: {
          width: '100%',
          lineHeight: '24px'
        }
      }}
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
          prefix={<UserOutlined />}
          style={{ height: 44 }}
          placeholder={intl.formatMessage({
            id: 'common.login.username.holder'
          })}
        />
      </Form.Item>
      <div className={`${styles.passwordWrapper} password-wrapper`}>
        <Form.Item
          style={{
            marginBottom: 20
          }}
          name="password"
          label={
            <Flex
              align="center"
              justify="space-between"
              style={{ width: '100%' }}
            >
              <span>{intl.formatMessage({ id: 'common.form.password' })}</span>
            </Flex>
          }
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
            autoComplete="current-password"
            prefix={<LockOutlined />}
            style={{ height: 44 }}
            placeholder={intl.formatMessage({
              id: 'common.login.password.holder'
            })}
          />
        </Form.Item>
        <Button
          type="link"
          size="small"
          className="forgot-password"
          style={{ fontSize: 12, padding: 0 }}
          href={externalLinks.resetPassword}
          target="_blank"
        >
          {intl.formatMessage({ id: 'common.button.forgotpassword' })}
        </Button>
      </div>
      {renderCaptcha()}
      <Button
        htmlType="submit"
        type="primary"
        block
        disabled={captchaEnabled && !captchaImage}
        loading={props.loading}
        icon={<IconFont type="icon-login" />}
        style={{ height: '44px', fontSize: '14px', marginTop: 20 }}
      >
        {intl.formatMessage({ id: 'common.button.login' })}
      </Button>
      {renderCommandInfo()}
    </Form>
  );
};

export default LocalUserForm;
