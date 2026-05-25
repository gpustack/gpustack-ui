import { PageAction } from '@/config';
import {
  CheckboxField,
  Input as CInput,
  ListInput,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form } from 'antd';
import { FormData } from '../config/types';

const S3Form = ({ action }: { action: string }) => {
  console.log('action', action);
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();

  return (
    <>
      <Form.Item<FormData>
        name={['spec', 's3', 'endpoint']}
        rules={[
          {
            required: true,
            message: getRuleMessage(
              'input',
              'gpuservice.storageType.s3.endpoint'
            )
          },
          {
            pattern: /^https?:\/\//,
            message: intl.formatMessage({
              id: 'gpuservice.storageType.s3.endpoint.rule'
            })
          }
        ]}
      >
        <CInput.Input
          required
          label={intl.formatMessage({
            id: 'gpuservice.storageType.s3.endpoint'
          })}
          placeholder="http | https://..."
        />
      </Form.Item>
      <Flex gap={16}>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData> name={['spec', 's3', 'region']}>
            <CInput.Input
              label={intl.formatMessage({
                id: 'gpuservice.storageType.s3.region'
              })}
            />
          </Form.Item>
        </div>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData> name={['spec', 's3', 'bucket']}>
            <CInput.Input
              description={intl.formatMessage({
                id: 'gpuservice.storageType.s3.bucket.tips'
              })}
              label={intl.formatMessage({
                id: 'gpuservice.storageType.s3.bucket'
              })}
            />
          </Form.Item>
        </div>
      </Flex>
      <Form.Item<FormData> name={['spec', 's3', 'accessKey']}>
        <CInput.Input
          label={intl.formatMessage({
            id: 'gpuservice.storageType.s3.accessKey'
          })}
        />
      </Form.Item>
      <Form.Item<FormData> name={['spec', 's3', 'secretKey']}>
        <CInput.Password
          label={intl.formatMessage({
            id: 'gpuservice.storageType.s3.secretKey'
          })}
        />
      </Form.Item>
      <Form.Item<FormData>
        name={['spec', 's3', 'insecure']}
        valuePropName="checked"
        style={{ marginBottom: 12 }}
      >
        <CheckboxField
          description={intl.formatMessage({
            id: 'gpuservice.storageType.s3.insecure.tips'
          })}
          label={intl.formatMessage({
            id: 'gpuservice.storageType.s3.insecure'
          })}
        />
      </Form.Item>
      <Form.Item<FormData> name={['spec', 's3', 'mountOptions']}>
        <ListInput
          disabled={action === PageAction.EDIT}
          label={intl.formatMessage({
            id: 'gpuservice.storageType.mountOptions'
          })}
          btnText={intl.formatMessage({ id: 'common.button.addParams' })}
        />
      </Form.Item>
    </>
  );
};

export default S3Form;
