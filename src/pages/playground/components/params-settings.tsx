import SealInput from '@/components/seal-form/seal-input';
import { INPUT_WIDTH } from '@/constants';
import { Button, Form, Space } from 'antd';

type ParamsSettingsProps = {
  seed?: number;
  stopSequence?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  repeatPenalty?: number;
  repeatLastN?: number;
  tfsZ?: number;
  contextLength?: number;
  maxTokens?: number;
};

const ParamsSettings: React.FC = () => {
  const initialValues = {
    seed: 1,
    stopSequence: 1,
    temperature: 1,
    topK: 1,
    topP: 1,
    repeatPenalty: 1,
    repeatLastN: 1,
    tfsZ: 1,
    contextLength: 256,
    maxTokens: 256
  };
  const [form] = Form.useForm();

  const handleOnFinish = (values: any) => {
    console.log('handleOnFinish', values);
  };

  const handleOnFinishFailed = (errorInfo: any) => {
    console.log('handleOnFinishFailed', errorInfo);
  };

  return (
    <Form
      name="modelparams"
      form={form}
      onFinish={handleOnFinish}
      onFinishFailed={handleOnFinishFailed}
    >
      <Form.Item<ParamsSettingsProps> name="seed" rules={[{ required: true }]}>
        <SealInput.Input
          label="Seed"
          style={{ width: INPUT_WIDTH.default }}
        ></SealInput.Input>
      </Form.Item>
      <Form.Item<ParamsSettingsProps>
        name="stopSequence"
        rules={[{ required: true }]}
      >
        <SealInput.Input
          label="Stop Sequence"
          style={{ width: INPUT_WIDTH.default }}
        ></SealInput.Input>
      </Form.Item>
      <Form.Item<ParamsSettingsProps>
        name="temperature"
        rules={[{ required: true }]}
      >
        <SealInput.Input
          label="Temperature"
          style={{ width: INPUT_WIDTH.default }}
        ></SealInput.Input>
      </Form.Item>
      <Form.Item<ParamsSettingsProps> name="topK" rules={[{ required: true }]}>
        <SealInput.Input
          label="TopK"
          style={{ width: INPUT_WIDTH.default }}
        ></SealInput.Input>
      </Form.Item>
      <Form.Item<ParamsSettingsProps> name="topP" rules={[{ required: true }]}>
        <SealInput.Input
          label="TopP"
          style={{ width: INPUT_WIDTH.default }}
        ></SealInput.Input>
      </Form.Item>
      <Form.Item<ParamsSettingsProps>
        name="repeatPenalty"
        rules={[{ required: true }]}
      >
        <SealInput.Input
          label="Repeat Penalty"
          style={{ width: INPUT_WIDTH.default }}
        ></SealInput.Input>
      </Form.Item>
      <Form.Item<ParamsSettingsProps>
        name="repeatLastN"
        rules={[{ required: true }]}
      >
        <SealInput.Input
          label="Repeat Last N"
          style={{ width: INPUT_WIDTH.default }}
        ></SealInput.Input>
      </Form.Item>
      <Form.Item<ParamsSettingsProps> name="tfsZ" rules={[{ required: true }]}>
        <SealInput.Input
          label="TFSZ"
          style={{ width: INPUT_WIDTH.default }}
        ></SealInput.Input>
      </Form.Item>
      <Form.Item<ParamsSettingsProps>
        name="contextLength"
        rules={[{ required: true }]}
      >
        <SealInput.Input
          label="Context Length"
          style={{ width: INPUT_WIDTH.default }}
        ></SealInput.Input>
      </Form.Item>
      <Form.Item<ParamsSettingsProps>
        name="maxTokens"
        rules={[{ required: true }]}
      >
        <SealInput.Input
          label="Max Tokens"
          style={{ width: INPUT_WIDTH.default }}
        ></SealInput.Input>
      </Form.Item>
      <Form.Item noStyle>
        <Space
          size={20}
          align="end"
          style={{ width: '100%', display: 'flex', justifyContent: 'end' }}
        >
          <Button>Cancel</Button>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ParamsSettings;
