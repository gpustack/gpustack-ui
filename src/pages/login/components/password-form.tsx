import SealInput from '@/components/seal-form/seal-input';
import { GlobalOutlined, LockOutlined } from '@ant-design/icons';
import { SelectLang, history, useIntl, useModel } from '@umijs/max';
import { Button, Form, message } from 'antd';
import { useEffect } from 'react';
import { updatePassword } from '../apis';

const PasswordForm: React.FC = () => {
  const { globalState, setGlobalState } = useModel('global');
  const [currentUser, setCurrentUser] = useState(null);
  const intl = useIntl();
  const [form] = Form.useForm();

  useEffect(() => {
    console.log('initstate===', {
      globalState
    });
  }, []);
  const gotoDefaultPage = (userInfo: any) => {
    const pathname = userInfo?.is_admin ? '/dashboard' : '/playground';
    history.push(pathname);
  };

  const handleSubmit = async (values: any) => {
    console.log('values', values, form);
    try {
      await updatePassword({
        new_password: values.new_password,
        comfirm_password: values.comfirm_password
      });
      gotoDefaultPage(currentUser);
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
        <div>修改密码</div>

        <Form.Item
          name="new_password"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                { name: intl.formatMessage({ id: 'common.form.password' }) }
              )
            }
          ]}
        >
          <SealInput.Password
            prefix={<LockOutlined />}
            label={intl.formatMessage({ id: 'common.form.password' })}
          />
        </Form.Item>
        <Form.Item
          name="comfirm_password"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                { id: 'common.form.rule.input' },
                { name: intl.formatMessage({ id: 'common.form.password' }) }
              )
            }
          ]}
        >
          <SealInput.Password
            prefix={<LockOutlined />}
            label={intl.formatMessage({ id: 'common.form.password' })}
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
