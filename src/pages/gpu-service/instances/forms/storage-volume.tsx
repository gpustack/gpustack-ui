import { useModel } from '@@/plugin-model';
import { InputNumber as CInputNumber, Select } from '@gpustack/core-ui';
import { Button, Flex, Form, Radio } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { FormData as StorageFormData } from '../../storage/config/types';
import useCreateStorage from '../../storage/services/use-create-storage';
import useQueryStorage from '../../storage/services/use-query-storage';
import { StorageModeValueMap } from '../config';
import { FormData, InstanceVolume } from '../config/types';
import StorageOverlay from './storage-overlay';

const FieldBlock = styled.div`
  margin-bottom: 24px;
`;

const DEFAULT_TEMP_CAPACITY_GB = 50;

const StorageVolume = () => {
  const { initialState } = useModel('@@initialState');
  const { fetchData: createStorage } = useCreateStorage();
  const { detailData: storageData, fetchData: fetchStorage } =
    useQueryStorage();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [storageMode, setStorageMode] = useState<string>(
    StorageModeValueMap.Existing
  );

  const form = Form.useFormInstance<FormData>();
  const volume = Form.useWatch(['spec', 'volume'], form) as
    | InstanceVolume
    | undefined;

  const namespace = initialState?.currentUser?.org_name || 'default';

  useEffect(() => {
    fetchStorage({});
  }, []);

  // const storageMode = useMemo(() => {
  //   if (volume?.ephemeral && !volume?.persistent) {
  //     return StorageModeValueMap.Temporary;
  //   }
  //   return StorageModeValueMap.Existing;
  // }, [volume?.ephemeral, volume?.persistent]);

  const storageOptions = useMemo(
    () =>
      (storageData?.items || []).map((item) => ({
        label: `${item.metadata?.name} / ${item.spec?.capacity ?? '-'}`,
        value: item.metadata?.name
      })),
    [storageData]
  );

  const handleModeChange = (mode: string) => {
    console.log('selected storage mode', mode);
    if (mode === StorageModeValueMap.Existing) {
      form.setFieldValue(['spec', 'volume'], { persistent: { name: '' } });
    } else {
      form.setFieldValue(['spec', 'volume'], {
        ephemeral: { capacity: `${DEFAULT_TEMP_CAPACITY_GB}Gi` }
      });
    }
    setStorageMode(mode);
  };

  const handleCreateStorage = async (values: StorageFormData) => {
    try {
      await createStorage({ data: values });
      await fetchStorage({});
      form.setFieldValue(['spec', 'volume'], {
        persistent: { name: values.metadata.name }
      });
      setOverlayOpen(false);
    } catch (error) {
      // ignore
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
        <Radio.Group
          style={{ marginBottom: 12 }}
          value={storageMode}
          onChange={(e) => handleModeChange(e.target.value)}
          options={[
            { label: '持久存储', value: StorageModeValueMap.Existing },
            { label: '临时存储', value: StorageModeValueMap.Temporary }
          ]}
        />
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
          name={['spec', 'volume', 'persistent', 'name']}
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
          name={['spec', 'volume', 'ephemeral', 'capacity']}
          getValueProps={(val) => ({
            value: val
              ? Number(String(val).replace(/Gi$/i, '')) || undefined
              : undefined
          })}
          normalize={(val) => (val ? `${val}Gi` : '')}
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
