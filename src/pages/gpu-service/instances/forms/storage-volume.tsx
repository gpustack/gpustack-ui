import { getCurrentOrganizationId } from '@/atoms/user';
import { InputNumber as CInputNumber, Select } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Form, Radio } from 'antd';
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

const DEFAULT_TEMP_CAPACITY_GB = 50;

const StorageVolume = () => {
  const intl = useIntl();
  const { fetchData: createStorage } = useCreateStorage();
  const { detailData: storageData, fetchData: fetchStorage } =
    useQueryStorage();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [storageMode, setStorageMode] = useState<string>(
    StorageModeValueMap.Temporary
  );

  const form = Form.useFormInstance<FormData>();

  const namespace = getCurrentOrganizationId();

  useEffect(() => {
    fetchStorage({});
  }, []);

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
            {
              label: intl.formatMessage({ id: 'gpuservice.storage.temporary' }),
              value: StorageModeValueMap.Temporary
            },
            {
              label: intl.formatMessage({
                id: 'gpuservice.storage.persistent'
              }),
              value: StorageModeValueMap.Existing
            }
          ]}
        />
        <Button
          type="link"
          size="small"
          style={{ marginBottom: 6 }}
          onClick={() => setOverlayOpen(true)}
        >
          {intl.formatMessage({ id: 'gpuservice.storage.add' })}
        </Button>
      </Flex>

      {storageMode === StorageModeValueMap.Existing && (
        <Form.Item
          name={['spec', 'volume', 'persistent', 'name']}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'gpuservice.storage.persistentVolume.required'
              })
            }
          ]}
        >
          <Select
            label={intl.formatMessage({
              id: 'gpuservice.storage.persistentVolume'
            })}
            required
            options={storageOptions}
          />
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
              message: intl.formatMessage({
                id: 'gpuservice.storage.tempCapacity.required'
              })
            }
          ]}
        >
          <CInputNumber
            min={1}
            precision={0}
            label={intl.formatMessage({
              id: 'gpuservice.storage.tempCapacity'
            })}
            required
          />
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
