import { InputNumber as CInputNumber, Select } from '@gpustack/core-ui';
import { Button, Flex, Form, Radio } from 'antd';
import styled from 'styled-components';
import { mockStorageData } from '../../storage/config/mock-data';
import { StorageModeValueMap } from '../config';
import { FormData } from '../config/types';

const FieldBlock = styled.div`
  margin-bottom: 24px;
`;

const StorageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 12px;
`;

const StorageVolume = () => {
  const form = Form.useFormInstance<FormData>();
  const storageMode = Form.useWatch('storage_mode', form);

  return (
    <FieldBlock data-field="storage">
      <Flex
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6
        }}
      >
        <Form.Item<FormData>
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
              {
                label: '持久存储',
                value: StorageModeValueMap.Existing
              },
              { label: '临时存储', value: StorageModeValueMap.Temporary }
            ]}
          />
        </Form.Item>
        <Button type="link" size="small" style={{ marginBottom: 6 }}>
          添加存储
        </Button>
      </Flex>

      {storageMode === StorageModeValueMap.Existing && (
        <Form.Item<FormData>
          name="storage_id"
          rules={[
            {
              required: true,
              message: '请选择预存储卷'
            }
          ]}
        >
          <Select
            label="持久卷"
            required
            options={mockStorageData.map((item) => ({
              label: `${item.metadata?.name} / ${item.spec?.capacity ?? '-'}`,
              value: item.id
            }))}
          />
        </Form.Item>
      )}

      {storageMode === StorageModeValueMap.Temporary && (
        <Form.Item<FormData>
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
