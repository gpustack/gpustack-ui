import IconFont from '@/components/icon-font';
import SealAutoComplete from '@/components/seal-form/auto-complete';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import useAppUtils from '@/hooks/use-app-utils';
import { ModelFileFormData as FormData } from '@/pages/resources/config/types';
import { useIntl } from '@umijs/max';
import { Form, Typography } from 'antd';
import _ from 'lodash';
import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import OllamaTips from '../components/ollama-tips';
import {
  localPathTipsList,
  modelSourceMap,
  ollamaModelOptions,
  sourceOptions
} from '../config';

interface TargetFormProps {
  ref?: any;
  workersList: Global.BaseOption<number>[];
  source: string;
  onOk: (values: any) => void;
}

const TargetForm: React.FC<TargetFormProps> = forwardRef((props, ref) => {
  const { onOk, source, workersList } = props;
  const { getRuleMessage } = useAppUtils();
  const intl = useIntl();
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => ({
    form
  }));

  const handleOk = (values: any) => {
    const data = _.pickBy(values, (val: string) => val);
    onOk(data);
  };

  const handleOnLocalPathBlur = (e: any) => {
    let { value } = e.target;

    // remove all the backslashes and slashes at the end of the string
    value = value.replace(/(\\|\/)+$/, '');
    form.setFieldsValue({
      local_path: value
    });
  };

  const renderLocalPathFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="local_path"
          key="local_path"
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'models.form.filePath')
            }
          ]}
        >
          <SealInput.Input
            required
            label={intl.formatMessage({ id: 'models.form.filePath' })}
            onBlur={handleOnLocalPathBlur}
            description={<TooltipList list={localPathTipsList}></TooltipList>}
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
              message: getRuleMessage('input', 'models.table.name')
            }
          ]}
        >
          <SealAutoComplete
            allowClear
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

  const renderFieldsBySource = useMemo(() => {
    if (props.source === modelSourceMap.ollama_library_value) {
      return renderOllamaModelFields();
    }

    if (props.source === modelSourceMap.local_path_value) {
      return renderLocalPathFields();
    }

    return null;
  }, [props.source, intl]);

  return (
    <div>
      {source === modelSourceMap.ollama_library_value && (
        <OllamaTips></OllamaTips>
      )}
      <Form
        form={form}
        onFinish={handleOk}
        preserve={false}
        style={{ padding: '16px 24px' }}
        clearOnDestroy={true}
        initialValues={{
          source: source
        }}
      >
        <Form.Item<FormData>
          name="source"
          rules={[
            {
              required: true,
              message: getRuleMessage('select', 'models.form.source')
            }
          ]}
        >
          {
            <SealSelect
              disabled
              label={intl.formatMessage({
                id: 'models.form.source'
              })}
              options={sourceOptions}
              required
            ></SealSelect>
          }
        </Form.Item>
        {renderFieldsBySource}
        <Form.Item
          name="worker_id"
          rules={[
            {
              required: true,
              message: getRuleMessage('select', 'worker', false)
            }
          ]}
        >
          {
            <SealSelect
              label="Worker"
              options={workersList}
              required
            ></SealSelect>
          }
        </Form.Item>
        {source !== modelSourceMap.local_path_value && (
          <Form.Item<FormData>
            name="local_dir"
            rules={[
              {
                required: false,
                message: getRuleMessage(
                  'input',
                  'resources.modelfiles.form.localdir'
                )
              }
            ]}
          >
            <SealInput.Input
              description={
                <span
                  dangerouslySetInnerHTML={{
                    __html: intl.formatMessage({
                      id: 'resources.modelfiles.form.localdir.tips'
                    })
                  }}
                ></span>
              }
              label={intl.formatMessage({
                id: 'resources.modelfiles.form.localdir'
              })}
            ></SealInput.Input>
          </Form.Item>
        )}
      </Form>
    </div>
  );
});

export default TargetForm;
