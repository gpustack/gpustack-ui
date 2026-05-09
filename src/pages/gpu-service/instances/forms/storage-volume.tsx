import { useModel } from '@@/plugin-model';
import { InputNumber as CInputNumber, Select } from '@gpustack/core-ui';
import { Button, Flex, Form, message, Radio } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { FormData as StorageFormData } from '../../storage/config/types';
import useCreateStorage from '../../storage/services/use-create-storage';
import useQueryStorage from '../../storage/services/use-query-storage';
import { StorageModeValueMap } from '../config';
import { FormData } from '../config/types';
import StorageOverlay from './storage-overlay';

const FieldBlock = styled.div`
  margin-bottom: 24px;
`;

type StorageHolderFields = {
  storage_mode?: string;
  storage_name?: string;
  local_storage_size_gb?: number;
};

const StorageVolume = () => {
  const { initialState } = useModel('@@initialState');
  const namespace = initialState?.currentUser?.org_name || 'default';

  const form = Form.useFormInstance<FormData & StorageHolderFields>();
  const storageMode = Form.useWatch('storage_mode', form) as string | undefined;
  const storageName = Form.useWatch('storage_name', form) as string | undefined;
  const localSize = Form.useWatch('local_storage_size_gb', form) as
    | number
    | undefined;

  const [overlayOpen, setOverlayOpen] = useState(false);

  const { fetchData: createStorage } = useCreateStorage();
  const { detailData: storageData, fetchData: fetchStorage } = useQueryStorage();

  useEffect(() => {
    fetchStorage({});
  }, [fetchStorage]);

  const storageOptions = useMemo(
    () =>
      (storageData?.items || []).map((item) => ({
        label: `${item.metadata?.name} / ${item.spec?.capacity ?? '-'}`,
        value: item.metadata?.name
      })),
    [storageData]
  );

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

  const handleCreateStorage = async (values: StorageFormData) => {
    try {
      await createStorage({ data: values });
      await fetchStorage({});
      form.setFieldValue('storage_name', values.metadata.name);
      setOverlayOpen(false);
      message.success('操作成功');
    } catch (error) {
      message.error('操作失败');
    }
  };

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
        <Button
          type="link"
          size="small"
          style={{ marginBottom: 6 }}
          onClick={() => setOverlayOpen(true)}
        >
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
          <Select label="持久卷" required options={storageOptions} />
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

      <StorageOverlay
        open={overlayOpen}
        namespace={namespace}
        onCancel={() => setOverlayOpen(false)}
        onSubmit={handleCreateStorage}
      />
    </FieldBlock>
  );
};

export default StorageVolume;
