import FieldWrapper from '@/components/seal-form/field-wrapper';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { INPUT_WIDTH } from '@/constants';
import { Form, Slider } from 'antd';
import { useState } from 'react';

type ParamsSettingsProps = {
  seed?: number;
  stopSequence?: number;
  temperature?: number;
  topP?: number;
  model?: string;
  maxTokens?: number;
};
const dataList = [
  { value: 'llama3:latest', label: 'llama3:latest' },
  { value: 'wangfuyun/AnimateLCM', label: 'wangfuyun/AnimateLCM' },
  { value: 'Revanthraja/Text_to_Vision', label: 'Revanthraja/Text_to_Vision' }
];

const ParamsSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [ModelList, setModelList] = useState(dataList);
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

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Form
      name="modelparams"
      form={form}
      onFinish={handleOnFinish}
      onFinishFailed={handleOnFinishFailed}
    >
      <div>
        <h3 className="m-b-20 m-l-10">Model</h3>
        <Form.Item<ParamsSettingsProps>
          name="model"
          rules={[{ required: true }]}
        >
          <SealSelect options={ModelList} label="Model"></SealSelect>
        </Form.Item>
        <h3 className="m-b-20 m-l-10">Parameters</h3>
        <Form.Item<ParamsSettingsProps>
          name="temperature"
          rules={[{ required: true }]}
        >
          <FieldWrapper label="Temperature">
            <Slider defaultValue={50}></Slider>
          </FieldWrapper>
        </Form.Item>
        <Form.Item<ParamsSettingsProps>
          name="maxTokens"
          rules={[{ required: true }]}
        >
          <SealInput.Input
            label="Max Tokens"
            style={{ width: INPUT_WIDTH.mini }}
          ></SealInput.Input>
        </Form.Item>
        <Form.Item<ParamsSettingsProps>
          name="topP"
          rules={[{ required: true }]}
        >
          <FieldWrapper label="Top P">
            <Slider defaultValue={50}></Slider>
          </FieldWrapper>
        </Form.Item>
        <Form.Item<ParamsSettingsProps>
          name="seed"
          rules={[{ required: true }]}
        >
          <SealInput.Input
            label="Seed"
            style={{ width: INPUT_WIDTH.mini }}
          ></SealInput.Input>
        </Form.Item>
        <Form.Item<ParamsSettingsProps>
          name="stopSequence"
          rules={[{ required: true }]}
        >
          <SealInput.Input
            label="Stop Sequence"
            style={{ width: INPUT_WIDTH.mini }}
          ></SealInput.Input>
        </Form.Item>
      </div>
    </Form>
  );
};

export default ParamsSettings;
