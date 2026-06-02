import PluginExtraFields from '@/components/plugin-extra-fields';
import { PageAction, validateLabelNameRegxFor63 } from '@/config';
import {
  Input as CInput,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { StorageTypeKindOptions } from '../config';
import { FormData } from '../config/types';

const Basic = ({ action }: { action: string }) => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();

  return (
    <>
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
      <PluginExtraFields name="CreateOrgScopeField" context={{ action }} />
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
