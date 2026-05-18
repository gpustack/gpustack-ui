import { PageAction, validateLabelNameRegxFor63 } from '@/config';
import { PageActionType } from '@/config/types';
import { Input as CInput } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { FormData } from '../config/types';

const Basic = ({
  action,
  disabled
}: {
  action: PageActionType;
  disabled?: boolean;
}) => {
  const intl = useIntl();
  return (
    <>
      <Form.Item<FormData>
        data-field="name"
        name={['metadata', 'name']}
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'gpuservice.instance.name.required'
            })
          },
          {
            pattern: validateLabelNameRegxFor63,
            message: intl.formatMessage({ id: 'gpuservice.form.rule.name' })
          }
        ]}
      >
        <CInput.Input
          disabled={disabled || action === PageAction.EDIT}
          label={intl.formatMessage({ id: 'gpuservice.instance.name' })}
          required
        />
      </Form.Item>
      <Form.Item<FormData> name={['spec', 'description']}>
        <CInput.TextArea
          disabled={disabled}
          label={intl.formatMessage({ id: 'common.table.description' })}
          scaleSize
        />
      </Form.Item>
    </>
  );
};

export default Basic;
