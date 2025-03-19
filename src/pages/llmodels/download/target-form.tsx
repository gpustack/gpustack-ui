import IconFont from '@/components/icon-font';
import SealAutoComplete from '@/components/seal-form/auto-complete';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { ModelFile as FormData } from '@/pages/resources/config/types';
import { useIntl } from '@umijs/max';
import { Form, Typography } from 'antd';
import React from 'react';
import { modelSourceMap, ollamaModelOptions } from '../config';

interface TargetFormProps {
  source: string;
  onOk: (values: any) => void;
}

const TargetForm: React.FC<TargetFormProps> = (props) => {
  const { onOk, source } = props;
  const intl = useIntl();
  const [form] = Form.useForm();

  const handleOk = (values: any) => {
    onOk(values);
  };

  const renderOllamaModelFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="ollama_library_model_name"
          key="ollama_library_model_name"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.table.name' }) }
              )
            }
          ]}
        >
          <SealAutoComplete
            filterOption
            defaultActiveFirstOption
            disabled={false}
            options={ollamaModelOptions}
            description={
              <span>
                <span>
                  {intl.formatMessage({ id: 'models.form.ollamalink' })}
                </span>
                <Typography.Link
                  className="flex-center"
                  href="https://www.ollama.com/library"
                  target="_blank"
                >
                  <IconFont
                    type="icon-external-link"
                    className="font-size-14"
                  ></IconFont>
                </Typography.Link>
              </span>
            }
            label={intl.formatMessage({ id: 'model.form.ollama.model' })}
            placeholder={intl.formatMessage({ id: 'model.form.ollamaholder' })}
            required
          ></SealAutoComplete>
        </Form.Item>
      </>
    );
  };

  return (
    <Form
      name="deployModel"
      form={form}
      onFinish={handleOk}
      preserve={false}
      style={{ padding: '16px 24px' }}
      clearOnDestroy={true}
      initialValues={{}}
    >
      {source === modelSourceMap.ollama_library_value &&
        renderOllamaModelFields()}
      <Form.Item
        name="worker"
        rules={[
          {
            required: true,
            message: intl.formatMessage(
              {
                id: 'common.form.rule.select'
              },
              { name: intl.formatMessage({ id: 'models.form.source' }) }
            )
          }
        ]}
      >
        {<SealSelect label="Worker" options={[]} required></SealSelect>}
      </Form.Item>
      <Form.Item
        name="local_path"
        rules={[
          {
            required: true,
            message: intl.formatMessage(
              {
                id: 'common.form.rule.input'
              },
              { name: intl.formatMessage({ id: 'common.table.name' }) }
            )
          }
        ]}
      >
        <SealInput.Input label={'Path'} required></SealInput.Input>
      </Form.Item>
    </Form>
  );
};

export default TargetForm;
