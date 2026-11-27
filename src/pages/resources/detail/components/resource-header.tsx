import { HelpTooltip } from '@/pages/_components/monitoring';
import { displayMetricValue } from '@/pages/llmodels/detail/utils/metrics';
import { gpuDeviceLabel } from '@/pages/llmodels/detail/utils/resources';
import { CardWrapper, StatusTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import {
  Button,
  Col,
  Descriptions,
  Flex,
  message,
  Row,
  Typography
} from 'antd';
import { useState } from 'react';
import { updateWorker } from '../../apis';
import UpdateLabels from '../../components/update-labels';
import WorkerSSHModal from '../../components/worker-ssh-modal';
import { status, WorkerStatusMapValue } from '../../config';
import type { WorkerLabelsFormPayload } from '../../config/types';
import { useResource } from '../config/context';
import { useResourceIntl } from '../hooks/use-resource-intl';
import { deviceHardware } from '../utils/device-hardware';
import { reportedGPUCount } from '../utils/metrics';
import { resourceHref } from '../utils/navigation';
import styles from './detail.module.less';

const ResourceHeader = () => {
  const { detail, target, scope, refresh, setTab } = useResource();
  const [editing, setEditing] = useState(false),
    [ssh, setSSH] = useState(false);
  const intl = useIntl();
  const t = useResourceIntl();
  const data = detail.data!;
  const worker = data.worker;
  const device = data.devices.find((d) => d.id === data.selected_device_id);
  const raw = deviceHardware(device, worker.status?.gpu_devices);
  const save = async (values: WorkerLabelsFormPayload) => {
    await updateWorker(worker.id, values);
    setEditing(false);
    message.success(t('saved'));
    void refresh();
  };
  const gpuSummaryGroups = device
    ? [
        [
          {
            key: 'worker',
            label: intl.formatMessage({ id: 'resources.worker' }),
            children: (
              <Typography.Link
                href={resourceHref(
                  { kind: 'worker', id: String(worker.id) },
                  scope
                )}
              >
                {worker.name}
              </Typography.Link>
            )
          },
          {
            key: 'cluster',
            label: t('cluster'),
            children: data.cluster_name || '—'
          },
          {
            key: 'uuid',
            label: t('gpuUuid'),
            children: raw?.uuid || '—'
          }
        ],
        [
          {
            key: 'memory',
            label: t('physicalTotal'),
            children: displayMetricValue(
              device.current?.gpu_memory_total,
              'bytes'
            )
          },
          {
            key: 'allocated',
            label: (
              <Flex align="center" gap={4}>
                <span>{t('allocatedMemory')}</span>
                <HelpTooltip
                  label={t('allocatedMemory')}
                  content={t('memoryHelp')}
                />
              </Flex>
            ),
            children: displayMetricValue(raw?.memory?.allocated, 'bytes')
          },
          {
            key: 'instances',
            label: t('relatedInstances'),
            children: (
              <Button
                type="link"
                size="small"
                onClick={() => setTab('instances')}
                style={{
                  paddingInline: 0,
                  height: 'auto',
                  whiteSpace: 'normal',
                  textAlign: 'end'
                }}
              >
                {t('instanceCount', { count: data.instances.length })}
              </Button>
            )
          }
        ]
      ]
    : [];
  return (
    <Flex vertical gap={16}>
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
          {!device && (
            <Flex gap={8} align="center" wrap className={styles.meta}>
              <span>{data.cluster_name || '—'}</span>
              <span>·</span>
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
              <span>·</span>
              <span>
                {t('instanceCount', { count: data.instances.length })}
              </span>
            </Flex>
          )}
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
            <Button
              href={resourceHref(
                { kind: 'worker', id: String(worker.id) },
                scope
              )}
            >
              {t('viewWorker')}
            </Button>
          )}
        </Flex>
      </Flex>
      {device && (
        <Row gutter={[16, 16]}>
          {gpuSummaryGroups.map((items) => (
            <Col key={items[0].key} xs={24} lg={12}>
              <CardWrapper style={{ paddingBlock: 16, height: '100%' }}>
                <Descriptions
                  size="small"
                  column={1}
                  colon={false}
                  styles={{
                    label: {
                      alignItems: 'center',
                      minHeight: 28,
                      maxWidth: '45%',
                      overflowWrap: 'anywhere'
                    },
                    content: {
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      minWidth: 0,
                      overflowWrap: 'anywhere',
                      textAlign: 'end',
                      fontVariantNumeric: 'tabular-nums'
                    }
                  }}
                  items={items}
                />
              </CardWrapper>
            </Col>
          ))}
        </Row>
      )}
      {target.kind === 'worker' && data.can_edit && (
        <UpdateLabels
          open={editing}
          gpuDevices={worker.status?.gpu_devices}
          data={{
            name: worker.name,
            labels: worker.labels || {},
            kv_transfer_ifname: worker.kv_transfer_ifname
          }}
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
    </Flex>
  );
};
export default ResourceHeader;
