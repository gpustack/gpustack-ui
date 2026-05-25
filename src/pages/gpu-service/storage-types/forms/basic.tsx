import { PageAction, validateLabelNameRegxFor63 } from '@/config';
import {
  Input as CInput,
  Select as SealSelect,
  Textarea,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import OwnerPrincipalIdField from '../../../_components/owner-principal-id-field';
import { StorageTypeKindOptions } from '../config';
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
          trim={false}
          label={intl.formatMessage({ id: 'common.table.displayName' })}
        />
      </Form.Item>
      <Form.Item<FormData> name="description">
        <Textarea
          scaleSize={true}
          trim={false}
          label={intl.formatMessage({ id: 'common.table.description' })}
        />
      </Form.Item>
      <Form.Item<FormData>
        name="type"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'gpuservice.storageType.kind')
          }
        ]}
      >
        <SealSelect
          disabled={action === PageAction.EDIT}
          label={intl.formatMessage({ id: 'gpuservice.storageType.kind' })}
          required
          options={StorageTypeKindOptions}
        />
      </Form.Item>
    </>
  );
};

export default Basic;
