import { PageAction, validateLabelNameRegxFor63 } from '@/config';
import { PageActionType } from '@/config/types';
import { Input as CInput, useAppUtils } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import OwnerPrincipalIdField from '../../../_components/owner-principal-id-field';
import { FormData } from '../config/types';
import formStyles from '../styles/instances.module.less';

const Basic = ({
  action,
  disabled
}: {
  action: PageActionType;
  disabled?: boolean;
}) => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  return (
    <>
      <OwnerPrincipalIdField name="owner_principal_id" />
      <Form.Item<FormData>
        data-field="name"
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
          disabled={disabled || action === PageAction.EDIT}
          label={intl.formatMessage({ id: 'common.table.name' })}
          required
        />
      </Form.Item>
      <Form.Item<FormData> name="displayName">
        <CInput.Input
          trim={false}
          disabled={false}
          label={intl.formatMessage({ id: 'common.table.displayName' })}
        />
      </Form.Item>
      <div className={formStyles.command}>
        <Form.Item<FormData> name="description" hidden>
          <CInput.TextArea
            disabled={false}
            label={intl.formatMessage({ id: 'common.table.description' })}
            scaleSize
          />
        </Form.Item>
      </div>
    </>
  );
};

export default Basic;
