import { PageAction } from '@/config';
import {
  Input as CInput,
  InputNumber as CInputNumber,
  CheckboxField,
  LabelInfo,
  Select,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Form, Radio } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { FormData as StorageFormData } from '../../storage/config/types';
import useCreateStorage from '../../storage/services/use-create-storage';
import useQueryStorage from '../../storage/services/use-query-storage';
import useQueryStorageTypes from '../../storage-types/services/use-query-storage-types';
import { DEFAULT_PV_CAPACITY_GB, StorageModeValueMap } from '../config';
import { FormData } from '../config/types';
import StorageOverlay from './storage-overlay';

const DEFAULT_TEMP_CAPACITY_GB = 50;

const detectMode = (volume?: FormData['spec']['volume']) => {
  if (volume?.persistentTemplate) {
    return { mode: StorageModeValueMap.Persistent, releaseWithInstance: true };
  }
  if (volume?.persistent) {
    return { mode: StorageModeValueMap.Persistent, releaseWithInstance: false };
  }
  return { mode: StorageModeValueMap.Temporary, releaseWithInstance: false };
};

const StorageVolume = ({
  disabled,
  action
}: {
  disabled?: boolean;
  action: PageActionType;
}) => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance<FormData>();
  const currentVolume = Form.useWatch(['spec', 'volume'], form);
  const [storageMode, setStorageMode] = useState<string>(
    StorageModeValueMap.Temporary
  );
  const [releaseWithInstance, setReleaseWithInstance] = useState<boolean>(false);

  useEffect(() => {
    if (!currentVolume) return;
    const detected = detectMode(currentVolume);
    setStorageMode(detected.mode);
    setReleaseWithInstance(detected.releaseWithInstance);
  }, [currentVolume]);

  const { fetchData: createStorage } = useCreateStorage();
  const { detailData: storageData, fetchData: fetchStorage } =
    useQueryStorage();
  const { detailData: storageTypesData, fetchData: fetchStorageTypes } =
    useQueryStorageTypes();
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    fetchStorage({ page: 1, perPage: 100 });
    fetchStorageTypes({ page: 1, perPage: 100 });
  }, []);

  const storageOptions = useMemo(
    () =>
      (storageData?.items || []).map((item) => ({
        label: `${item.name} / ${item.spec?.capacity ?? '-'}`,
        value: item.name
      })),
    [storageData]
  );

  const storageTypeOptions = useMemo(
    () =>
      (storageTypesData?.items || []).map((item) => ({
        label: item.displayName || item.name,
        value: item.name
      })),
    [storageTypesData]
  );

  const applyMode = (mode: string, release: boolean) => {
    if (mode === StorageModeValueMap.Temporary) {
      form.setFieldValue(['spec', 'volume'], {
        ephemeral: { capacity: `${DEFAULT_TEMP_CAPACITY_GB}Gi` }
      });
      return;
    }
    if (release) {
      form.setFieldValue(['spec', 'volume'], {
        persistentTemplate: {
          spec: { type: '', capacity: `${DEFAULT_PV_CAPACITY_GB}Gi` },
          releaseWithInstance: true
        }
      });
      return;
    }
    form.setFieldValue(['spec', 'volume'], { persistent: { name: '' } });
  };

  const handleModeChange = (mode: string) => {
    setStorageMode(mode);
    applyMode(mode, releaseWithInstance);
  };

  const handleReleaseChange = (e: any) => {
    const next = !!e?.target?.checked;
    setReleaseWithInstance(next);
    applyMode(storageMode, next);
  };

  const handleCreateStorage = async (values: StorageFormData) => {
    try {
      await createStorage({ data: values });
      await fetchStorage({ page: 1, perPage: 100 });
      form.setFieldValue(['spec', 'volume'], {
        persistent: { name: values.name }
      });
      setOverlayOpen(false);
    } catch (error) {
      // ignore
    }
  };

  return (
    <>
      <div data-field="storage"></div>
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
            value: StorageModeValueMap.Persistent
          }
        ]}
      />

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

      {storageMode === StorageModeValueMap.Persistent && (
        <>
          <Flex
            style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}
          >
            <CheckboxField
              disabled={disabled}
              checked={releaseWithInstance}
              onChange={handleReleaseChange}
              label={intl.formatMessage({
                id: 'gpuservice.storage.persistentVolume.releaseWithInstance'
              })}
            />
            {action === PageAction.CREATE && !releaseWithInstance && (
              <Button
                type="link"
                size="small"
                onClick={() => setOverlayOpen(true)}
              >
                {intl.formatMessage({ id: 'gpuservice.storage.add' })}
              </Button>
            )}
          </Flex>

          {releaseWithInstance ? (
            <>
              <Form.Item
                name={['spec', 'volume', 'persistentTemplate', 'spec', 'type']}
                rules={[
                  {
                    required: true,
                    message: getRuleMessage('select', 'gpuservice.storageType')
                  }
                ]}
              >
                <Select
                  required
                  disabled={disabled}
                  label={intl.formatMessage({ id: 'gpuservice.storageType' })}
                  options={storageTypeOptions}
                />
              </Form.Item>
              <Form.Item
                name={[
                  'spec',
                  'volume',
                  'persistentTemplate',
                  'spec',
                  'capacity'
                ]}
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
                      id: 'gpuservice.storage.persistentVolume.capacity.required'
                    })
                  }
                ]}
              >
                <CInputNumber
                  required
                  disabled={disabled}
                  min={1}
                  precision={0}
                  label={intl.formatMessage({
                    id: 'gpuservice.storage.persistentVolume.capacity'
                  })}
                />
              </Form.Item>
            </>
          ) : (
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
        </>
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
        onCancel={() => setOverlayOpen(false)}
        onSubmit={handleCreateStorage}
      />
    </>
  );
};

export default StorageVolume;
