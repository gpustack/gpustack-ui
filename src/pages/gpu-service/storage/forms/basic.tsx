import {
  Input as CInput,
  InputNumber,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { Flex, Form } from 'antd';
import { useEffect } from 'react';
import { FormData } from '../config/types';
import useQueryStorageClass from '../services/use-query-storage-class';

const Basic = ({ open }: { open: boolean }) => {
  const { getRuleMessage } = useAppUtils();
  const { storageClassList, fetchData, loading } = useQueryStorageClass();

  useEffect(() => {
    if (open) {
      fetchData({});
    }
  }, [open]);

  return (
    <>
      <Form.Item<FormData>
        name={['metadata', 'name']}
        rules={[
          {
            required: true,
            message: getRuleMessage('input', '名称')
          }
        ]}
      >
        <CInput.Input label="名称" required />
      </Form.Item>
      <Flex gap={16}>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData>
            name={['spec', 'type']}
            rules={[
              {
                required: true,
                message: getRuleMessage('select', '存储类型')
              }
            ]}
          >
            <SealSelect
              label="存储类型"
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
                message: getRuleMessage('input', '容量')
              }
            ]}
          >
            <InputNumber label="容量" required />
          </Form.Item>
        </div>
      </Flex>
    </>
  );
};

export default Basic;
