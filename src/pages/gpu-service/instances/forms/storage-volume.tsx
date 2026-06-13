import { PageAction } from '@/config';
import { PlusOutlined } from '@ant-design/icons';
import {
  Input as CInput,
  InputNumber as CInputNumber,
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
import { StorageModeValueMap } from '../config';
import { FormData } from '../config/types';
import StorageOverlay from './storage-overlay';

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
  const form = Form.useFormInstance<FormData>();
  const storageMode = Form.useWatch('storageMode', form);
  const { fetchData: createStorage } = useCreateStorage();
  const { detailData: storageData, fetchData: fetchStorage } =
    useQueryStorage();
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    const initStorage = async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 200);
      });
      fetchStorage({ page: -1 });
    };
    initStorage();
  }, []);

  const storageOptions = useMemo(
    () =>
      (storageData?.items || []).map((item) => ({
        label: `${item.displayName || item.name} / ${item.spec?.capacity ?? '-'}`,
        value: item.name
      })),
    [storageData]
  );

  const applyMode = (mode: string) => {
    if (mode === StorageModeValueMap.Temporary) {
      form.setFieldValue(
        ['spec', 'volume', 'ephemeral', 'capacity'],
        form.getFieldValue(['spec', 'volume', 'ephemeral', 'capacity']) ||
          DEFAULT_TEMP_CAPACITY_GB
      );
      return;
    }
    form.setFieldValue(
      ['spec', 'volume', 'persistent', 'name'],
      form.getFieldValue(['spec', 'volume', 'persistent', 'name']) ||
        (storageOptions[0]?.value as string)
    );
  };

  const handleModeChange = (mode: string) => {
    applyMode(mode);
  };

  const handleCreateStorage = async (values: StorageFormData) => {
    try {
      await createStorage({ data: values });
      await fetchStorage({ page: -1 });
      form.setFieldValue(['spec', 'volume', 'persistent', 'name'], values.name);
      setOverlayOpen(false);
    } catch (error) {
      // ignore
    }
  };

  return (
    <>
      <div data-field="storage"></div>
      <Flex
        align="center"
        justify="space-between"
        style={{ marginBottom: 16, paddingTop: 8 }}
      >
        <Form.Item name="storageMode" noStyle>
          <Radio.Group
            disabled={disabled}
            value={storageMode}
            style={{ display: 'flex', gap: 12 }}
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
        </Form.Item>
        {action === PageAction.CREATE &&
          storageMode === StorageModeValueMap.Persistent && (
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setOverlayOpen(true)}
            >
              {intl.formatMessage({ id: 'gpuservice.storage.add' })}
            </Button>
          )}
      </Flex>

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
              showSearch
              label={intl.formatMessage({
                id: 'gpuservice.form.storage.select'
              })}
              required
              options={storageOptions}
            />
          </Form.Item>
        </>
      )}

      <Form.Item<FormData>
        name={['spec', 'volumeMount']}
        style={{
          marginBottom: 12
        }}
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
