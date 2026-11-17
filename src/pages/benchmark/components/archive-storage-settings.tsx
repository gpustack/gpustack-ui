import { useSubmitLock } from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import {
  Alert,
  Button,
  Descriptions,
  Flex,
  InputNumber,
  Modal,
  Skeleton,
  Switch,
  Typography,
  message
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import {
  queryArtifactStorageCapacity,
  updateArtifactStorageCapacity
} from '../apis';
import type { ArtifactStorageCapacity } from '../config/artifact-storage-types';
import {
  capacityGiBValue,
  capacityLimitBytes,
  formatCapacityBytes
} from '../utils/artifact-capacity';

export default function ArchiveStorageSettings() {
  const { canSeeAdmin } = useAccess();
  const intl = useIntl();
  const { loading: saving, guard, run } = useSubmitLock();
  const sequence = useRef(0);
  const request = useRef<AbortController>();
  const [state, setState] = useState<{
    open: boolean;
    loading: boolean;
    data: ArtifactStorageCapacity | null;
    error: 'loadFailed' | 'saveFailed' | 'permission' | null;
    unlimited: boolean;
    limit: string | null;
    invalid: boolean;
  }>({
    open: false,
    loading: false,
    data: null,
    error: null,
    unlimited: true,
    limit: null,
    invalid: false
  });
  const t = (key: string, values?: Record<string, number | string>) =>
    intl.formatMessage({ id: `benchmark.storage.${key}` }, values);

  useEffect(() => {
    if (!canSeeAdmin) {
      sequence.current++;
      request.current?.abort();
      setState((current) => ({ ...current, open: false, data: null }));
    }
    return () => {
      sequence.current++;
      request.current?.abort();
    };
  }, [canSeeAdmin]);

  const load = async () => {
    if (!canSeeAdmin) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const current = ++sequence.current;
    setState((previous) => ({
      ...previous,
      open: true,
      loading: true,
      data: null,
      error: null,
      invalid: false
    }));
    try {
      const data = await queryArtifactStorageCapacity(controller.signal);
      if (current !== sequence.current || controller.signal.aborted) return;
      setState({
        open: true,
        loading: false,
        data,
        error: null,
        unlimited: data.unlimited,
        limit: data.max_bytes ? capacityGiBValue(data.max_bytes) : null,
        invalid: false
      });
    } catch (error) {
      if (current !== sequence.current || controller.signal.aborted) return;
      const denied = [401, 403].includes((error as any)?.response?.status);
      setState((previous) => ({
        ...previous,
        loading: false,
        data: null,
        error: denied ? 'permission' : 'loadFailed'
      }));
    }
  };

  const close = () => {
    sequence.current++;
    request.current?.abort();
    setState((previous) => ({ ...previous, open: false }));
  };
  const save = () => {
    if (!state.data || state.loading || state.error === 'permission') return;
    const bytes = capacityLimitBytes(state.unlimited, state.limit);
    if (bytes == null) {
      setState((previous) => ({ ...previous, invalid: true }));
      return;
    }
    guard(() => {
      void run(async () => {
        const current = sequence.current;
        try {
          await updateArtifactStorageCapacity(bytes);
          if (current !== sequence.current) return;
          message.success(intl.formatMessage({ id: 'common.message.success' }));
          close();
        } catch (error) {
          if (current !== sequence.current) return;
          const denied = [401, 403].includes((error as any)?.response?.status);
          setState((previous) => ({
            ...previous,
            error: denied ? 'permission' : 'saveFailed'
          }));
        }
      });
    });
  };

  if (!canSeeAdmin) return null;
  const bytes = capacityLimitBytes(state.unlimited, state.limit);
  const invalid =
    state.invalid || (!state.unlimited && state.limit != null && bytes == null);
  const belowUsage =
    !!state.data && bytes != null && bytes > 0 && bytes < state.data.used_bytes;
  const canSave =
    !!state.data &&
    !state.loading &&
    !invalid &&
    bytes != null &&
    state.error !== 'permission';

  return (
    <>
      <Button onClick={() => void load()}>{t('title')}</Button>
      <Modal
        title={t('title')}
        open={state.open}
        width={480}
        onCancel={close}
        onOk={save}
        okText={intl.formatMessage({ id: 'common.button.save' })}
        cancelText={intl.formatMessage({ id: 'common.button.cancel' })}
        okButtonProps={{ disabled: !canSave }}
        confirmLoading={saving}
        maskClosable={false}
        destroyOnHidden
      >
        <Flex vertical gap="middle">
          {state.loading && <Skeleton active paragraph={{ rows: 3 }} />}
          {!!state.error && (
            <Alert
              type="error"
              title={t(state.error)}
              showIcon
              action={
                state.error === 'loadFailed' ? (
                  <Button size="small" onClick={() => void load()}>
                    {t('reload')}
                  </Button>
                ) : undefined
              }
            />
          )}
          {!!state.data && (
            <>
              <Descriptions
                size="small"
                column={1}
                items={[
                  {
                    key: 'used',
                    label: t('used'),
                    children: formatCapacityBytes(state.data.used_bytes)
                  },
                  {
                    key: 'remaining',
                    label: t('remaining'),
                    children:
                      state.data.remaining_bytes == null
                        ? t('unlimited')
                        : formatCapacityBytes(state.data.remaining_bytes)
                  }
                ]}
              />
              {!belowUsage &&
                ['warning', 'full'].includes(state.data.state) && (
                  <Alert
                    type={state.data.state === 'full' ? 'error' : 'warning'}
                    title={t(state.data.state, {
                      threshold: state.data.warning_threshold_percent
                    })}
                    showIcon
                  />
                )}
              <Flex align="center" justify="space-between" gap="small">
                <label htmlFor="benchmark-storage-unlimited">
                  {t('unlimited')}
                </label>
                <Switch
                  id="benchmark-storage-unlimited"
                  checked={state.unlimited}
                  disabled={saving || state.error === 'permission'}
                  onChange={(unlimited) =>
                    setState((previous) => ({
                      ...previous,
                      unlimited,
                      invalid: false
                    }))
                  }
                />
              </Flex>
              {!state.unlimited && (
                <Flex vertical gap="small">
                  <label htmlFor="benchmark-storage-limit">{t('limit')}</label>
                  <InputNumber<string>
                    id="benchmark-storage-limit"
                    aria-label={t('limit')}
                    aria-invalid={invalid}
                    aria-describedby="benchmark-storage-limit-help"
                    stringMode
                    changeOnBlur={false}
                    value={state.limit}
                    min="0.000000000931322574615478515625"
                    max="8388607.999999999068677425384521484375"
                    step="1"
                    suffix="GiB"
                    disabled={saving || state.error === 'permission'}
                    status={invalid ? 'error' : undefined}
                    style={{ width: '100%' }}
                    onChange={(limit) =>
                      setState((previous) => ({
                        ...previous,
                        limit,
                        invalid: false
                      }))
                    }
                    onInput={(limit) =>
                      setState((previous) => ({
                        ...previous,
                        limit,
                        invalid: false
                      }))
                    }
                  />
                  {invalid && (
                    <Typography.Text type="danger" role="alert">
                      {t('invalid')}
                    </Typography.Text>
                  )}
                </Flex>
              )}
              {belowUsage && (
                <Alert type="warning" title={t('belowUsage')} showIcon />
              )}
              <Typography.Text
                type="secondary"
                id="benchmark-storage-limit-help"
              >
                {t('policy')}
              </Typography.Text>
              <Typography.Text type="secondary">{t('scope')}</Typography.Text>
            </>
          )}
        </Flex>
      </Modal>
    </>
  );
}
