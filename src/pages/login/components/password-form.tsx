import { initialPasswordAtom, userAtom } from '@/atoms/user';
import { resetStorageUserSettings } from '@/atoms/utils';
import SealInput from '@/components/seal-form/seal-input';
import { PasswordReg } from '@/config';
import {
  CRYPT_TEXT,
  IS_FIRST_LOGIN,
  writeState
} from '@/utils/localstore/index';
import { LockOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Form, message } from 'antd';
import CryptoJS from 'crypto-js';
import { useAtom } from 'jotai';
import { updatePassword } from '../apis';
import { checkDefaultPage } from '../utils';

const PasswordForm: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm();

  const [userInfo, setUserInfo] = useAtom(userAtom);
  const [initialPassword, setInitialPassword] = useAtom(initialPasswordAtom);
  const gotoDefaultPage = async (userInfo: any) => {
    checkDefaultPage(userInfo, false);
  };

  const decryptPassword = (password: string) => {
    const bytes = CryptoJS.AES?.decrypt?.(password, CRYPT_TEXT);
    const res = bytes.toString(CryptoJS.enc.Utf8);
    return res;
  };

  const handleSubmit = async (values: any) => {
    try {
      await updatePassword({
        new_password: values.new_password,
        current_password: decryptPassword(initialPassword)
      });

      await setUserInfo({
        ...(userInfo || {}),
        require_password_change: false
      });
      setInitialPassword('');
      // Reset first login flag
      resetStorageUserSettings();
      writeState(IS_FIRST_LOGIN, null);
      gotoDefaultPage(userInfo);
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      console.log('error====', error);
    }
  };

  return (
    <div>
      <Form
        form={form}
        style={{ width: '360px', margin: '0 auto' }}
        onFinish={handleSubmit}
      >
        <h2 className="justify-center m-b-20 flex-column flex-center">
          <span>
            {' '}
            {intl.formatMessage({ id: 'users.password.modify.title' })}
          </span>
          <span
            style={{
              padding: '6px 0',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-normal)',
              color: 'var(--ant-color-text-tertiary)'
            }}
          >
            {intl.formatMessage({ id: 'users.password.modify.description' })}
          </span>
        </h2>
        <Form.Item
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
          <SealInput.Password
            prefix={<LockOutlined />}
            label={intl.formatMessage({ id: 'users.form.newpassword' })}
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
          <SealInput.Password
            prefix={<LockOutlined />}
            label={intl.formatMessage({ id: 'users.password.confirm' })}
          />
        </Form.Item>

        <Button
          htmlType="submit"
          type="primary"
          block
          style={{ height: '48px', fontSize: '14px', marginTop: 10 }}
        >
          {intl.formatMessage({ id: 'common.button.submit' })}
        </Button>
      </Form>
    </div>
  );
};

export default PasswordForm;
