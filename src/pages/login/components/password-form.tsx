import { userAtom } from '@/atoms/user';
import SealInput from '@/components/seal-form/seal-input';
import { PasswordReg } from '@/config';
import { GlobalOutlined, LockOutlined } from '@ant-design/icons';
import { SelectLang, history, useIntl } from '@umijs/max';
import { Button, Form, message } from 'antd';
import { useAtom } from 'jotai';
import { updatePassword } from '../apis';

const PasswordForm: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm();

  const [userInfo, setUserInfo] = useAtom(userAtom);
  const gotoDefaultPage = (userInfo: any) => {
    const pathname =
      userInfo && userInfo?.is_admin ? '/dashboard' : '/playground';
    history.push(pathname);
  };

  const handleSubmit = async (values: any) => {
    console.log('values', values, form);
    try {
      await updatePassword({
        new_password: values.new_password,
        current_password: values.current_password
      });

      await setUserInfo({
        ...userInfo,
        require_password_change: false
      });
      gotoDefaultPage(userInfo);
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      console.log('error====', error);
    }
  };

  return (
    <div>
      <div style={{ position: 'fixed', right: 0, top: 0, padding: '0 20px' }}>
        <SelectLang icon={<GlobalOutlined />} reload={false} />
      </div>
      <Form
        form={form}
        style={{ width: '400px', margin: '0 auto', paddingTop: '5%' }}
        onFinish={handleSubmit}
      >
        <h2 className="justify-center m-b-20">
          {intl.formatMessage({ id: 'users.password.modify.title' })}
        </h2>

        <Form.Item
          name="current_password"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                {
                  name: intl.formatMessage({ id: 'users.form.currentpassword' })
                }
              )
            }
          ]}
        >
          <SealInput.Password
            prefix={<LockOutlined />}
            label={intl.formatMessage({ id: 'users.form.currentpassword' })}
          />
        </Form.Item>
        <Form.Item
          name="new_password"
          rules={[
            {
              required: true,
              pattern: PasswordReg,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                { name: intl.formatMessage({ id: 'users.form.newpassword' }) }
              )
            }
          ]}
        >
          <SealInput.Password
            prefix={<LockOutlined />}
            label={intl.formatMessage({ id: 'users.form.newpassword' })}
          />
        </Form.Item>

        <Button htmlType="submit" type="primary" block>
          {intl.formatMessage({ id: 'common.button.submit' })}
        </Button>
      </Form>
    </div>
  );
};

export default PasswordForm;