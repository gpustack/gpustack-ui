import { PageAction, validateLabelNameRegxFor63 } from '@/config';
import {
  Input as CInput,
  InputNumber,
  Select as SealSelect,
  Textarea,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form } from 'antd';
import { useEffect } from 'react';
import OwnerPrincipalIdField from '../../../_components/owner-principal-id-field';
import { FormData } from '../config/types';
import useQueryStorageClass from '../services/use-query-storage-class';

const Basic = ({ open, action }: { open: boolean; action: string }) => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const { storageClassList, fetchData, loading } = useQueryStorageClass();

  useEffect(() => {
    if (open) {
      fetchData({ page: 1, perPage: 100 });
    }
  }, [open]);

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
          trim={false}
          scaleSize={true}
          label={intl.formatMessage({ id: 'common.table.description' })}
        />
      </Form.Item>
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
              loading={loading}
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
