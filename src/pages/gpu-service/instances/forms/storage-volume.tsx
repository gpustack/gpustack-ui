import { InputNumber as CInputNumber, Select } from '@gpustack/core-ui';
import { Button, Flex, Form, Radio } from 'antd';
import { useEffect } from 'react';
import styled from 'styled-components';
import { mockStorageData } from '../../storage/config/mock-data';
import { StorageModeValueMap } from '../config';
import { FormData } from '../config/types';

const FieldBlock = styled.div`
  margin-bottom: 24px;
`;

type StorageHolderFields = {
  storage_mode?: string;
  storage_name?: string;
  local_storage_size_gb?: number;
};

const StorageVolume = () => {
  const form = Form.useFormInstance<FormData & StorageHolderFields>();
  const storageMode = Form.useWatch('storage_mode', form) as string | undefined;
  const storageName = Form.useWatch('storage_name', form) as string | undefined;
  const localSize = Form.useWatch('local_storage_size_gb', form) as
    | number
    | undefined;

  useEffect(() => {
    if (storageMode === StorageModeValueMap.Existing) {
      form.setFieldValue(['spec', 'volume'], {
        persistent: { name: storageName || '' }
      });
    } else if (storageMode === StorageModeValueMap.Temporary) {
      form.setFieldValue(['spec', 'volume'], {
        ephemeral: {
          capacity: localSize ? `${localSize}Gi` : ''
        }
      });
    }
  }, [form, storageMode, storageName, localSize]);

  return (
    <FieldBlock data-field="storage">
      <Flex
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6
        }}
      >
        <Form.Item
          name="storage_mode"
          style={{ marginBottom: 12 }}
          rules={[
            {
              required: true,
              message: '请选择存储卷'
            }
          ]}
        >
          <Radio.Group
            options={[
              { label: '持久存储', value: StorageModeValueMap.Existing },
              { label: '临时存储', value: StorageModeValueMap.Temporary }
            ]}
          />
        </Form.Item>
        <Button type="link" size="small" style={{ marginBottom: 6 }}>
          添加存储
        </Button>
      </Flex>

      {storageMode === StorageModeValueMap.Existing && (
        <Form.Item
          name="storage_name"
          rules={[
            {
              required: true,
              message: '请选择持久卷'
            }
          ]}
        >
          <Select
            label="持久卷"
            required
            options={mockStorageData.map((item) => ({
              label: `${item.metadata?.name} / ${item.spec?.capacity ?? '-'}`,
              value: item.metadata?.name
            }))}
          />
        </Form.Item>
      )}

      {storageMode === StorageModeValueMap.Temporary && (
        <Form.Item
          name="local_storage_size_gb"
          rules={[
            {
              required: true,
              message: '请输入本地临时存储容量'
            }
          ]}
        >
          <CInputNumber min={1} precision={0} label="存储容量 (GB)" required />
        </Form.Item>
      )}
    </FieldBlock>
  );
};

export default StorageVolume;
