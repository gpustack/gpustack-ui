import { PageAction } from '@/config';
import { Input as CInput, ListInput, useAppUtils } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { FormData } from '../config/types';

const NFSForm = ({ action }: { action: string }) => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const disabled = action === PageAction.EDIT;

  return (
    <>
      <Form.Item<FormData>
        name={['spec', 'nfs', 'server']}
        rules={[
          {
            required: true,
            message: getRuleMessage(
              'input',
              'gpuservice.storageType.nfs.server'
            )
          }
        ]}
      >
        <CInput.Input
          required
          disabled={disabled}
          description={intl.formatMessage({
            id: 'gpuservice.storageType.nfs.server.tips'
          })}
          label={intl.formatMessage({
            id: 'gpuservice.storageType.nfs.server'
          })}
        />
      </Form.Item>
      <Form.Item<FormData>
        name={['spec', 'nfs', 'share']}
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'gpuservice.storageType.nfs.share')
          }
        ]}
      >
        <CInput.Input
          required
          disabled={disabled}
          description={intl.formatMessage({
            id: 'gpuservice.storageType.nfs.share.tips'
          })}
          label={intl.formatMessage({ id: 'gpuservice.storageType.nfs.share' })}
        />
      </Form.Item>
      <Form.Item<FormData> name={['spec', 'nfs', 'subDirectory']}>
        <CInput.Input
          disabled={disabled}
          label={intl.formatMessage({
            id: 'gpuservice.storageType.nfs.subDirectory'
          })}
        />
      </Form.Item>
      <Form.Item<FormData> name={['spec', 'nfs', 'mountPermissions']}>
        <CInput.Input
          disabled={disabled}
          placeholder="0755,0777,..."
          description={intl.formatMessage({
            id: 'gpuservice.storageType.nfs.mountPermissions.tips'
          })}
          label={intl.formatMessage({
            id: 'gpuservice.storageType.nfs.mountPermissions'
          })}
        />
      </Form.Item>
      <Form.Item<FormData> name={['spec', 'nfs', 'mountOptions']}>
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

export default NFSForm;
