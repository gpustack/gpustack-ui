import LabelSelector from '@/components/label-selector';
import SealInputNumber from '@/components/seal-form/input-number';
import SealInput from '@/components/seal-form/seal-input';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import { ProviderType } from '../config';
import { NodePoolFormData as FormData } from '../config/types';
import VolumesConfig from './volumes-config';

type AddModalProps = {
  ref: any;
  name?: string;
  action: PageActionType;
  provider: ProviderType; // 'kubernetes' | 'custom' | 'digitalocean';
  currentData?: FormData | null;
  onFinish: (values: FormData) => void;
};
const PoolForm: React.FC<AddModalProps> = forwardRef(
  ({ action, name = 'workerPoolForm', onFinish, currentData }, ref) => {
    const cloudOptionsRef = useRef<any>(null);
    const [form] = Form.useForm();
    const intl = useIntl();
    const { getRuleMessage } = useAppUtils();

    useEffect(() => {
      if (currentData) {
        console.log('currentData===========1=', currentData);
        form.setFieldsValue({
          ...currentData
        });
      }
    }, [currentData]);

    useImperativeHandle(ref, () => ({
      resetFields: () => {
        form.resetFields();
      },
      submit: () => {
        form.submit();
      },
      setFieldsValue: (values: any) => {
        form.setFieldsValue(values);
      },
      getFieldsValue: () => {
        return form.getFieldsValue();
      },
      validateFields: async () => {
        return await form.validateFields();
      }
    }));

    return (
      <Form
        name={name}
        form={form}
        onFinish={onFinish}
        preserve={false}
        scrollToFirstError={true}
        initialValues={{
          replicas: 1,
          batch_size: 1
        }}
      >
        <Form.Item<FormData>
          name="instance_type"
          rules={[
            {
              required: true,
              message: getRuleMessage(
                'input',
                'clusters.workerpool.instanceType'
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({
              id: 'clusters.workerpool.instanceType'
            })}
            required
          ></SealInput.Input>
        </Form.Item>
        <Form.Item<FormData>
          name="replicas"
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'clusters.workerpool.replicas')
            }
          ]}
        >
          <SealInputNumber
            label={intl.formatMessage({ id: 'clusters.workerpool.replicas' })}
            required
          ></SealInputNumber>
        </Form.Item>
        <Form.Item<FormData>
          name="batch_size"
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'clusters.workerpool.batchSize')
            }
          ]}
        >
          <SealInputNumber
            label={intl.formatMessage({ id: 'clusters.workerpool.batchSize' })}
            required
          ></SealInputNumber>
        </Form.Item>
        <Form.Item<FormData>
          name="os_image"
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'clusters.workerpool.osImage')
            }
          ]}
        >
          <SealInput.Input
            disabled={action === PageAction.EDIT}
            label={intl.formatMessage({ id: 'clusters.workerpool.osImage' })}
            required
          ></SealInput.Input>
        </Form.Item>

        <Form.Item<FormData>
          name="labels"
          rules={[
            ({ getFieldValue }) => ({
              validator(rule, value) {
                if (_.keys(value).length > 0) {
                  if (_.some(_.keys(value), (k: string) => !value[k])) {
                    return Promise.reject(
                      intl.formatMessage(
                        {
                          id: 'common.validate.value'
                        },
                        {
                          name: 'labels'
                        }
                      )
                    );
                  }
                }
                return Promise.resolve();
              }
            })
          ]}
        >
          <LabelSelector
            label={intl.formatMessage({ id: 'resources.table.labels' })}
            labels={form.getFieldValue('labels') || {}}
            btnText={intl.formatMessage({ id: 'common.button.addLabel' })}
          ></LabelSelector>
        </Form.Item>
        <VolumesConfig ref={cloudOptionsRef}></VolumesConfig>
      </Form>
    );
  }
);

export default PoolForm;
