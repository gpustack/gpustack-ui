import { PageAction, validateLabelNameRegxFor63 } from '@/config';
import { Input as CInput, Textarea, useAppUtils } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import OwnerPrincipalIdField from '../../../_components/owner-principal-id-field';
import { FormData } from '../config/types';

const Basic = ({ action }: { action: string }) => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();

  return (
    <>
      <OwnerPrincipalIdField name="owner_principal_id" />
      <Form.Item<FormData>
        name="name"
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'common.table.name')
          },
          {
            pattern: validateLabelNameRegxFor63,
            message: intl.formatMessage({ id: 'gpuservice.form.rule.name' })
          }
        ]}
      >
        <CInput.Input
          disabled={action === PageAction.EDIT}
          label={intl.formatMessage({ id: 'common.table.name' })}
          required
        />
      </Form.Item>
      <Form.Item<FormData> name="displayName">
        <CInput.Input
          label={intl.formatMessage({ id: 'common.table.displayName' })}
        />
      </Form.Item>
      <Form.Item<FormData> name="description">
        <Textarea
          scaleSize={true}
          label={intl.formatMessage({ id: 'common.table.description' })}
        />
      </Form.Item>
      <Form.Item<FormData>
        name={['spec', 'data']}
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'gpuservice.publicKey.label')
          }
        ]}
      >
        <Textarea
          required
          alwaysFocus
          label={intl.formatMessage({ id: 'gpuservice.publicKey.label' })}
          placeholder={intl.formatMessage({
            id: 'gpuservice.publicKey.placeholder'
          })}
          trim={false}
          autoSize={{ minRows: 6, maxRows: 12 }}
        />
      </Form.Item>
    </>
  );
};

export default Basic;
