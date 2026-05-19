import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrgNamespace } from '@/atoms/user';
import { PageAction } from '@/config';
import {
  Input as CInput,
  InputNumber as CInputNumber,
  LabelInfo,
  Select,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Form, Radio } from 'antd';
import { useAtomValue } from 'jotai';
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

const StorageVolume = ({
  disabled,
  action
}: {
  disabled?: boolean;
  action: PageActionType;
}) => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const { fetchData: createStorage } = useCreateStorage();
  const { detailData: storageData, fetchData: fetchStorage } =
    useQueryStorage();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [storageMode, setStorageMode] = useState<string>(
    StorageModeValueMap.Temporary
  );

  const form = Form.useFormInstance<FormData>();

  const currentCluster = useAtomValue(currentClusterAtom);
  const namespace = getCurrentOrgNamespace(currentCluster?.owner_principal_id);

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
    <FieldBlock>
      <Flex
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6
        }}
      >
        <Radio.Group
          disabled={disabled}
          style={{ marginBottom: 12 }}
          value={storageMode}
          onChange={(e) => handleModeChange(e.target.value)}
          options={[
            {
              label: (
                <LabelInfo
                  description={intl.formatMessage({
                    id: 'gpuservice.storage.temporary.tips'
                  })}
                  label={
                    <span className="text-primary">
                      {intl.formatMessage({
                        id: 'gpuservice.storage.temporary'
                      })}
                    </span>
                  }
                />
              ),
              value: StorageModeValueMap.Temporary
            },
            {
              label: (
                <LabelInfo
                  description={intl.formatMessage({
                    id: 'gpuservice.storage.persistentVolume.tips'
                  })}
                  label={
                    <span className="text-primary">
                      {intl.formatMessage({
                        id: 'gpuservice.storage.persistentVolume'
                      })}
                    </span>
                  }
                />
              ),
              value: StorageModeValueMap.Existing
            }
          ]}
        />
        {action === PageAction.CREATE &&
          storageMode === StorageModeValueMap.Existing && (
            <Button
              type="link"
              size="small"
              style={{ marginBottom: 6 }}
              onClick={() => setOverlayOpen(true)}
            >
              {intl.formatMessage({ id: 'gpuservice.storage.add' })}
            </Button>
          )}
      </Flex>
      <div data-field="storage"></div>

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
            disabled={disabled}
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
            disabled={disabled}
            min={1}
            precision={0}
            label={intl.formatMessage({
              id: 'gpuservice.storage.tempCapacity'
            })}
            required
          />
        </Form.Item>
      )}
      <Form.Item<FormData>
        name={['spec', 'volumeMount']}
        rules={[
          {
            required: true,
            message: getRuleMessage('input', 'gpuservice.template.mountPath')
          }
        ]}
      >
        <CInput.Input
          required
          label={intl.formatMessage({
            id: 'gpuservice.template.mountPath'
          })}
          placeholder={intl.formatMessage({
            id: 'clusters.volume.mountPath.format'
          })}
          disabled={disabled}
        />
      </Form.Item>

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
