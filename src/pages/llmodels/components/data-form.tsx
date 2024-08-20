import SealAutoComplete from '@/components/seal-form/auto-complete';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { modelSourceMap, ollamaModelOptions } from '../config';
import { FormData } from '../config/types';

interface DataFormProps {
  ref?: any;
  source: string;
  action: PageActionType;
  repo: string;
  onOk: (values: FormData) => void;
}

const sourceOptions = [
  {
    label: 'Hugging Face',
    value: modelSourceMap.huggingface_value,
    key: 'huggingface'
  },
  {
    label: 'Ollama Library',
    value: modelSourceMap.ollama_library_value,
    key: 'ollama_library'
  }
];

const DataForm: React.FC<DataFormProps> = forwardRef((props, ref) => {
  const { action, repo, onOk } = props;
  const [form] = Form.useForm();
  const intl = useIntl();

  const handleSumit = () => {
    form.submit();
  };

  useImperativeHandle(
    ref,
    () => {
      return {
        submit: handleSumit,
        setFieldsValue: (values: FormData) => {
          form.setFieldsValue(values);
        },
        setFieldValue: (name: string, value: any) => {
          form.setFieldValue(name, value);
        },
        getFieldValue: (name: string) => {
          return form.getFieldValue(name);
        }
      };
    },
    []
  );

  const handleOnSelectModel = () => {
    console.log('repo=============', repo);
    if (!repo) {
      return;
    }
    let name = _.split(repo, '/').slice(-1)[0];
    const reg = /(-gguf)$/i;
    name = _.toLower(name).replace(reg, '');

    if (props.source === modelSourceMap.huggingface_value) {
      form.setFieldsValue({
        huggingface_repo_id: repo,
        name: name
      });
    } else {
      form.setFieldsValue({
        ollama_library_model_name: repo,
        name: name
      });
    }
  };

  const renderHuggingfaceFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="huggingface_repo_id"
          key="huggingface_repo_id"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.form.repoid' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({ id: 'models.form.repoid' })}
            required
            disabled={true}
          ></SealInput.Input>
        </Form.Item>
        <Form.Item<FormData>
          name="huggingface_filename"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.form.filename' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({ id: 'models.form.filename' })}
            required
            disabled={true}
          ></SealInput.Input>
        </Form.Item>
      </>
    );
  };

  const renderS3Fields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="s3_address"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.form.s3address' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({
              id: 'models.form.s3address'
            })}
            required
          ></SealInput.Input>
        </Form.Item>
      </>
    );
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
            disabled={action === PageAction.EDIT}
            label={intl.formatMessage({ id: 'model.form.ollama.model' })}
            placeholder={intl.formatMessage({ id: 'model.form.ollamaholder' })}
            required
            options={ollamaModelOptions}
          ></SealAutoComplete>
        </Form.Item>
      </>
    );
  };

  const renderFieldsBySource = () => {
    switch (props.source) {
      case modelSourceMap.huggingface_value:
        return renderHuggingfaceFields();
      case modelSourceMap.ollama_library_value:
        return renderOllamaModelFields();
      case modelSourceMap.s3_value:
        return renderS3Fields();
      default:
        return null;
    }
  };

  useEffect(() => {
    handleOnSelectModel();
  }, [repo]);

  return (
    <Form
      name="deployModel"
      form={form}
      onFinish={onOk}
      preserve={false}
      style={{ padding: '16px 24px' }}
      clearOnDestroy={true}
      initialValues={{ replicas: 1, source: props.source }}
    >
      <Form.Item<FormData>
        name="name"
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
        <SealInput.Input
          label={intl.formatMessage({
            id: 'common.table.name'
          })}
          required
        ></SealInput.Input>
      </Form.Item>
      <Form.Item<FormData>
        name="source"
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
        {
          <SealSelect
            disabled={true}
            label={intl.formatMessage({
              id: 'models.form.source'
            })}
            options={sourceOptions}
            required
          ></SealSelect>
        }
      </Form.Item>
      {renderFieldsBySource()}
      <Form.Item<FormData>
        name="replicas"
        rules={[
          {
            required: true,
            message: intl.formatMessage(
              {
                id: 'common.form.rule.input'
              },
              {
                name: intl.formatMessage({ id: 'models.form.replicas' })
              }
            )
          }
        ]}
      >
        <SealInput.Number
          style={{ width: '100%' }}
          label={intl.formatMessage({
            id: 'models.form.replicas'
          })}
          required
          min={0}
        ></SealInput.Number>
      </Form.Item>
      <Form.Item<FormData> name="description">
        <SealInput.TextArea
          label={intl.formatMessage({
            id: 'common.table.description'
          })}
        ></SealInput.TextArea>
      </Form.Item>
    </Form>
  );
});

export default React.memo(DataForm);
