import { displayValue } from '@/pages/llmodels/detail/utils/metrics';
import { gpuDeviceLabel } from '@/pages/llmodels/detail/utils/resources';
import { BaseSelect, StatusTag } from '@gpustack/core-ui';
import { history } from '@umijs/max';
import { Button, Flex, message, Typography } from 'antd';
import { useState } from 'react';
import { updateWorker } from '../../apis';
import UpdateLabels from '../../components/update-labels';
import WorkerSSHModal from '../../components/worker-ssh-modal';
import { status, WorkerStatusMapValue } from '../../config';
import type { WorkerLabelsFormData } from '../../config/types';
import { useResource } from '../config/context';
import { useResourceIntl } from '../hooks/use-resource-intl';
import { reportedGPUCount } from '../utils/metrics';
import { resourceHref } from '../utils/navigation';
import styles from './detail.module.less';

const ResourceHeader = () => {
  const { detail, target, scope, refresh, tab } = useResource();
  const [editing, setEditing] = useState(false),
    [ssh, setSSH] = useState(false);
  const t = useResourceIntl();
  const data = detail.data!;
  const worker = data.worker;
  const device = data.devices.find((d) => d.id === data.selected_device_id);
  const save = async (values: WorkerLabelsFormData) => {
    await updateWorker(worker.id, { name: values.name, labels: values.labels });
    setEditing(false);
    message.success(t('saved'));
    void refresh();
  };
  return (
    <>
      <Flex gap={16} justify="space-between" align="start" wrap>
        <Flex vertical gap={6} className={styles.identity}>
          <Flex gap={12} align="center" wrap>
            <h1 className={styles.title}>
              {device
                ? `${gpuDeviceLabel(device, t('chip'))} · ${device.name}`
                : worker.name}
            </h1>
            <StatusTag
              statusValue={{
                status: status[worker.state] || status.not_ready,
                text: WorkerStatusMapValue[worker.state] || worker.state,
                message: worker.state_message
              }}
            />
          </Flex>
          <Flex gap={8} align="center" wrap className={styles.meta}>
            {device && (
              <>
                <Typography.Link
                  href={resourceHref(
                    { kind: 'worker', id: String(worker.id) },
                    scope
                  )}
                >
                  {worker.name}
                </Typography.Link>
                <span>·</span>
              </>
            )}
            <span>{data.cluster_name || '—'}</span>
            <span>·</span>
            {device ? (
              <span>
                {displayValue(device.current?.gpu_memory_total, 'bytes')} GiB
              </span>
            ) : (
              <>
                <span>{worker.ip || worker.advertise_address || '—'}</span>
                <span>·</span>
                <span>
                  {t('gpuCount', {
                    count:
                      reportedGPUCount(
                        worker.status?.gpu_devices,
                        data.devices.length
                      ) ?? '—'
                  })}
                </span>
              </>
            )}
            <span>·</span>
            <span>{t('instanceCount', { count: data.instances.length })}</span>
          </Flex>
        </Flex>
        <Flex gap={8} className={styles.actions}>
          {target.kind === 'worker' ? (
            <>
              {data.can_edit && !!worker.ssh_key_id && (
                <Button onClick={() => setSSH(true)}>{t('ssh')}</Button>
              )}
              {data.can_edit && (
                <Button onClick={() => setEditing(true)}>{t('edit')}</Button>
              )}
            </>
          ) : (
            <Flex gap={8} wrap>
              {data.devices.length > 1 && (
                <BaseSelect
                  aria-label={t('switchGPU')}
                  value={device?.id}
                  options={data.devices.map((d) => ({
                    value: d.id,
                    label: `${gpuDeviceLabel(d, t('chip'))} · ${d.name}`
                  }))}
                  style={{ width: 220, maxWidth: '100%' }}
                  onChange={(id: string) =>
                    history.push(
                      resourceHref(
                        { kind: 'gpu', id: String(worker.id), deviceId: id },
                        scope,
                        tab
                      ).slice(1)
                    )
                  }
                />
              )}
              <Button
                href={resourceHref(
                  { kind: 'worker', id: String(worker.id) },
                  scope
                )}
              >
                {t('viewWorker')}
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>
      {target.kind === 'worker' && data.can_edit && (
        <UpdateLabels
          open={editing}
          data={{ name: worker.name, labels: worker.labels || {} }}
          onCancel={() => setEditing(false)}
          onOk={save}
        />
      )}
      {ssh && data.can_edit && (
        <WorkerSSHModal
          open
          currentData={worker}
          onClose={() => setSSH(false)}
        />
      )}
    </>
  );
};
export default ResourceHeader;
