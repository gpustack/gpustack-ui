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
  const form = Form.useFormInstance<FormData>();
  const { getRuleMessage } = useAppUtils();
  const disabled = action === PageAction.EDIT;

  const handleEndpointBlur = (e: any) => {
    const value: string = e.target.value;
    if (!value) return;

    // Auto-fill region based on endpoint if it's an AWS S3 endpoint
    const awsMatch = value.match(
      /^https?:\/\/s3[.-]([a-z0-9-]+)\.amazonaws\.com/
    );
    if (awsMatch) {
      const region = awsMatch[1];
      form.setFieldValue(['spec', 's3', 'region'], region);
    }
  };

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
          disabled={disabled}
          label={intl.formatMessage({
            id: 'gpuservice.storageType.s3.endpoint'
          })}
          description={intl.formatMessage({
            id: 'gpuservice.storageType.s3.endpoint.tips'
          })}
          onBlur={handleEndpointBlur}
          placeholder="https://s3.<region>.amazonaws.com"
        />
      </Form.Item>
      <Flex gap={16}>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData> name={['spec', 's3', 'region']}>
            <CInput.Input
              disabled={disabled}
              label={intl.formatMessage({
                id: 'gpuservice.storageType.s3.region'
              })}
            />
          </Form.Item>
        </div>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData>
            name={['spec', 's3', 'bucket']}
            rules={[
              {
                required: true,
                message: getRuleMessage(
                  'input',
                  'gpuservice.storageType.s3.bucket'
                )
              }
            ]}
          >
            <CInput.Input
              required
              disabled={disabled}
              description={
                <Flex orientation="vertical" gap={4} align="start">
                  <span>
                    {intl.formatMessage({
                      id: 'gpuservice.storageType.s3.bucket.tips1'
                    })}
                  </span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: intl.formatMessage({
                        id: 'gpuservice.storageType.s3.bucket.tips2'
                      })
                    }}
                  />
                </Flex>
              }
              label={intl.formatMessage({
                id: 'gpuservice.storageType.s3.bucket'
              })}
            />
          </Form.Item>
        </div>
      </Flex>
      <Form.Item<FormData> name={['spec', 's3', 'accessKey']}>
        <CInput.Input
          disabled={disabled}
          label={intl.formatMessage({
            id: 'gpuservice.storageType.s3.accessKey'
          })}
        />
      </Form.Item>
      <Form.Item<FormData> name={['spec', 's3', 'secretKey']}>
        <CInput.Password
          disabled={disabled}
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
          disabled={disabled}
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
          disabled={disabled}
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
