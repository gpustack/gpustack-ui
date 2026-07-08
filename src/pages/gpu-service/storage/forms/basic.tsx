import PluginExtraFields from '@/components/plugin-extra-fields';
import { PageAction, validateLabelNameRegxFor63 } from '@/config';
import {
  Input as CInput,
  InputNumber,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form } from 'antd';
import { useContext } from 'react';
import { FormContext } from '../config/form-context';
import { FormData } from '../config/types';

const Basic = ({
  action,
  open,
  showOrgScope = true,
  onOrgScopeChange
}: {
  action: string;
  open: boolean;
  // Hosts that already fix the tenant scope elsewhere (e.g. the instance
  // create form, which owns the org picker) hide this slot so the storage
  // is created in the surrounding scope rather than a second, conflicting
  // one.
  showOrgScope?: boolean;
  // Fired on a user selection in the create-scope picker so the host can
  // reload the org-scoped storage-type list.
  onOrgScopeChange?: (orgId: number | null | undefined) => void;
}) => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const { storageClassList } = useContext(FormContext);

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
      {showOrgScope && (
        <PluginExtraFields
          name="CreateOrgScopeField"
          context={{ action, onChange: onOrgScopeChange }}
        />
      )}
      <Flex gap={16}>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData>
            name={['spec', 'type']}
            rules={[
              {
                required: true,
                message: getRuleMessage('select', 'gpuservice.storage.type')
              }
            ]}
          >
            <SealSelect
              disabled={action === PageAction.EDIT}
              label={intl.formatMessage({ id: 'gpuservice.storage.type' })}
              required
              options={storageClassList}
            />
          </Form.Item>
        </div>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData>
            name={['spec', 'capacity']}
            normalize={(value) => (value ? `${value}Gi` : undefined)}
            getValueProps={(value) => ({
              value: value ? String(value).replace(/Gi$/, '') : ''
            })}
            rules={[
              {
                required: true,
                message: getRuleMessage('input', 'gpuservice.storage.capacity')
              }
            ]}
          >
            <InputNumber
              disabled={action === PageAction.EDIT}
              label={intl.formatMessage({
                id: 'gpuservice.storage.persistentVolume.capacity'
              })}
              required
            />
          </Form.Item>
        </div>
      </Flex>
    </>
  );
};

export default Basic;
