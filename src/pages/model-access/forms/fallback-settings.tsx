import SealInput from '@/components/seal-form/seal-input';
import { Checkbox, Form, Typography } from 'antd';

const FallbackSettings: React.FC<{
  currentData?: any;
  onFinish: (data: any) => void;
}> = ({ currentData, onFinish }) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      onFinish={onFinish}
      initialValues={currentData}
      layout="vertical"
    >
      <Form.Item name="name">
        <SealInput.Input disabled label="Model Name"></SealInput.Input>
      </Form.Item>
      <Form.Item name="endpoint">
        <SealInput.Input disabled label="Endpoint"></SealInput.Input>
      </Form.Item>
      <Form.Item name="endpoint">
        <SealInput.Input disabled label="Endpoint Target"></SealInput.Input>
      </Form.Item>
      <Form.Item name="fallback_endpoint">
        <Typography.Title
          level={5}
          style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}
        >
          Fallback Status
        </Typography.Title>
        <Checkbox.Group
          options={[
            {
              label: '4xx',
              value: '4xx'
            },
            {
              label: '5xx',
              value: '5xx'
            }
          ]}
        />
      </Form.Item>
    </Form>
  );
};
export default FallbackSettings;
