import FieldWrapper from '@/components/seal-form/field-wrapper';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { INPUT_WIDTH } from '@/constants';
import { queryModelsList } from '@/pages/llmodels/apis';
import { Form, Slider } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';

type ParamsSettingsFormProps = {
  seed?: number;
  stop?: number;
  temperature?: number;
  top_p?: number;
  model?: string;
  max_tokens?: number;
};

type ParamsSettingsProps = {
  onClose?: () => void;
  selectedModel?: string;
  params?: ParamsSettingsFormProps;
  setParams: (params: any) => void;
};
// const dataList = [
//   { value: 'llama3:latest', label: 'llama3:latest' },
//   { value: 'wangfuyun/AnimateLCM', label: 'wangfuyun/AnimateLCM' },
//   { value: 'Revanthraja/Text_to_Vision', label: 'Revanthraja/Text_to_Vision' }
// ];

const ParamsSettings: React.FC<ParamsSettingsProps> = ({
  onClose,
  selectedModel,
  setParams
}) => {
  const [ModelList, setModelList] = useState([]);
  const initialValues = {
    seed: null,
    stop: null,
    temperature: 1,
    top_p: 1,
    max_tokens: 1024
  };
  const [form] = Form.useForm();

  useEffect(() => {
    const getModelList = async () => {
      try {
        const params = {
          page: 1,
          perPage: 100
        };
        const res = await queryModelsList(params);
        const list = _.map(res.items || [], (item: any) => {
          return {
            value: item.name,
            label: item.name
          };
        });
        setModelList(list);
        form.setFieldsValue({
          model: selectedModel || _.get(list, '[0].value'),
          ...initialValues
        });
        setParams({
          model: selectedModel || _.get(list, '[0].value'),
          ...initialValues
        });
      } catch (error) {
        setModelList([]);
        form.setFieldsValue({
          model: selectedModel || '',
          ...initialValues
        });
        setParams({
          model: selectedModel || '',
          ...initialValues
        });
      }
    };
    getModelList();
  }, []);

  const handleOnFinish = (values: any) => {
    console.log('handleOnFinish', values);
  };

  const handleOnFinishFailed = (errorInfo: any) => {
    console.log('handleOnFinishFailed', errorInfo);
  };

  const handleCancel = () => {
    form.resetFields();
    onClose?.();
  };

  const handleValuesChange = (changedValues: any, allValues: any) => {
    console.log('handleValuesChange', changedValues, allValues);
    setParams?.(allValues);
  };

  return (
    <Form
      name="modelparams"
      form={form}
      onValuesChange={handleValuesChange}
      onFinish={handleOnFinish}
      onFinishFailed={handleOnFinishFailed}
    >
      <div>
        <h3 className="m-b-20 m-l-10">Model</h3>
        <Form.Item<ParamsSettingsFormProps>
          name="model"
          rules={[{ required: true }]}
        >
          <SealSelect options={ModelList} label="Model"></SealSelect>
        </Form.Item>
        <h3 className="m-b-20 m-l-10">Parameters</h3>
        <Form.Item<ParamsSettingsFormProps>
          name="temperature"
          rules={[{ required: true }]}
        >
          <FieldWrapper label="Temperature">
            <Slider
              defaultValue={1}
              max={2}
              step={0.1}
              style={{ marginBottom: 0 }}
              tooltip={{ open: true }}
            ></Slider>
          </FieldWrapper>
        </Form.Item>
        <Form.Item<ParamsSettingsFormProps>
          name="max_tokens"
          rules={[{ required: true }]}
        >
          <SealInput.Number
            label="Max Tokens"
            style={{ width: INPUT_WIDTH.mini }}
          ></SealInput.Number>
        </Form.Item>
        <Form.Item<ParamsSettingsFormProps>
          name="top_p"
          rules={[{ required: true }]}
        >
          <FieldWrapper label="Top P">
            <Slider
              defaultValue={1}
              max={1}
              step={0.1}
              style={{ marginBottom: 0 }}
              tooltip={{ open: true }}
            ></Slider>
          </FieldWrapper>
        </Form.Item>
        <Form.Item<ParamsSettingsFormProps>
          name="seed"
          rules={[{ required: true }]}
        >
          <SealInput.Number
            label="Seed"
            style={{ width: INPUT_WIDTH.mini }}
          ></SealInput.Number>
        </Form.Item>
        <Form.Item<ParamsSettingsFormProps>
          name="stop"
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
