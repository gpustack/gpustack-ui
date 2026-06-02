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

const Basic = ({ action, open }: { action: string; open: boolean }) => {
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
      <PluginExtraFields name="CreateOrgScopeField" context={{ action }} />
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
