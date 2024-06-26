import CardWrapper from '@/components/card-wrapper';
import FormButtons from '@/components/form-buttons';
import SealInput from '@/components/seal-form/seal-input';
import { PasswordReg } from '@/config';
import { INPUT_WIDTH } from '@/constants';
import { updatePassword } from '@/pages/login/apis';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { StrictMode } from 'react';

interface ProfileProps {
  username?: string;
  new_password: string;
  current_password: string;
}
const Profile: React.FC = () => {
  const [form] = Form.useForm();
  const intl = useIntl();

  const newpasswordValue = Form.useWatch('new_password', form);

  const handleOnFinish = async (values: any) => {
    try {
      await updatePassword(values);
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {}
  };

  const handleOnFinishFailed = (errorInfo: any) => {
    console.log('handleOnFinishFailed', errorInfo);
  };
  const handleCancel = () => {
    form.resetFields();
  };

  return (
    <StrictMode>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({ id: 'users.form.updatepassword' })
        }}
        extra={[]}
      >
        <CardWrapper
          style={{ padding: '32px', marginTop: '70px', width: 'max-content' }}
        >
          <Form
            style={{ width: '524px' }}
            name="profileForm"
            form={form}
            onFinish={handleOnFinish}
            onFinishFailed={handleOnFinishFailed}
          >
            {/* <Form.Item<ProfileProps>
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
              required
              style={{ width: INPUT_WIDTH.default }}
            ></SealInput.Input>
          </Form.Item> */}
            <Form.Item<ProfileProps>
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
              <SealInput.Password
                label={intl.formatMessage({ id: 'users.form.currentpassword' })}
                required
                style={{ width: INPUT_WIDTH.default }}
              ></SealInput.Password>
            </Form.Item>
            <Form.Item<ProfileProps>
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
                label={intl.formatMessage({ id: 'users.form.newpassword' })}
                required
                style={{ width: INPUT_WIDTH.default }}
              ></SealInput.Password>
            </Form.Item>
            <FormButtons
              htmlType="submit"
              onCancel={handleCancel}
              showCancel={false}
            ></FormButtons>
          </Form>
        </CardWrapper>
      </PageContainer>
    </StrictMode>
  );
};

export default Profile;
