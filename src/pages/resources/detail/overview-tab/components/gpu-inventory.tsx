import { HelpTooltip } from '@/pages/_components/monitoring';
import type { ResourceDevice } from '@/pages/llmodels/detail/config/types';
import { displayValue } from '@/pages/llmodels/detail/utils/metrics';
import { gpuDeviceLabel } from '@/pages/llmodels/detail/utils/resources';
import { LineChartOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  DropdownButtons,
  Table as SealTable,
  SectionTitle
} from '@gpustack/core-ui';
import { Flex, Typography } from 'antd';
import type { CSSProperties } from 'react';
import styles from '../../components/detail.module.less';
import { useResource } from '../../config/context';
import { useResourceIntl } from '../../hooks/use-resource-intl';
import { resourceHref } from '../../utils/navigation';

export default function GPUInventory() {
  const { detail, scope } = useResource();
  const t = useResourceIntl();
  const data = detail.data!;
  const gpuHref = (device: ResourceDevice, tab?: 'instances' | 'monitoring') =>
    resourceHref(
      { kind: 'gpu', id: String(data.worker.id), deviceId: device.id },
      scope,
      tab
    );
  return (
    <Flex
      vertical
      gap={12}
      className={styles.table}
      style={{ '--seal-table-row-min-height': '52px' } as CSSProperties}
    >
      <Flex align="center" justify="space-between" gap={12}>
        <Flex align="center" gap={4}>
          <SectionTitle>{t('gpuResources')}</SectionTitle>
          <HelpTooltip label={t('gpuResources')} content={t('inventoryHelp')} />
        </Flex>
        <Typography.Text type="secondary">{t('current')}</Typography.Text>
      </Flex>
      <SealTable
        loading={detail.loading}
        rowKey="id"
        dataSource={data.devices}
        scroll={{ x: true }}
        columns={[
          {
            dataIndex: 'name',
            title: 'GPU',
            minWidth: 160,
            span: 2,
            render: (_: unknown, d: ResourceDevice) => (
              <Flex vertical gap={0} style={{ minWidth: 0 }}>
                <Typography.Link
                  href={gpuHref(d)}
                  style={{ fontSize: 13, lineHeight: '18px' }}
                >
                  {gpuDeviceLabel(d, t('chip'))}
                </Typography.Link>
                <span
                  className={`${styles.ellipsis} ${styles.deviceName}`}
                  title={d.name}
                >
                  {d.name}
                </span>
              </Flex>
            )
          },
          {
            dataIndex: 'model_instance_ids',
            title: t('relatedInstances'),
            minWidth: 120,
            render: (ids: number[], d: ResourceDevice) => (
              <Typography.Link
                className={styles.numeric}
                href={gpuHref(d, 'instances')}
              >
                {t('instanceCount', { count: ids.length })}
              </Typography.Link>
            )
          },
          {
            dataIndex: 'gpu_utilization',
            title: t('gpuUtilization'),
            minWidth: 110,
            render: (_: unknown, d: ResourceDevice) => (
              <span className={styles.numeric}>
                {displayValue(d.current?.gpu_utilization)} %
              </span>
            )
          },
          {
            dataIndex: 'gpu_memory',
            title: t('memoryUsedTotal'),
            minWidth: 165,
            span: 2,
            render: (_: unknown, d: ResourceDevice) => (
              <span className={styles.numeric}>
                {displayValue(d.current?.gpu_memory_used, 'bytes')} /{' '}
                {displayValue(d.current?.gpu_memory_total, 'bytes')} GiB
              </span>
            )
          },
          {
            dataIndex: 'allocated',
            title: t('allocatedMemory'),
            minWidth: 135,
            render: (_: unknown, d: ResourceDevice) => (
              <span className={styles.numeric}>
                {displayValue(
                  data.worker.status?.gpu_devices?.find(
                    (g) => g.index === d.index
                  )?.memory?.allocated,
                  'bytes'
                )}{' '}
                GiB
              </span>
            )
          },
          {
            dataIndex: 'power',
            title: t('gpuPower'),
            minWidth: 95,
            render: (_: unknown, d: ResourceDevice) =>
              `${displayValue(d.current?.gpu_power)} W`
          },
          {
            dataIndex: 'temperature',
            title: t('gpuTemperature'),
            minWidth: 95,
            render: (_: unknown, d: ResourceDevice) =>
              `${displayValue(d.current?.gpu_temperature)} °C`
          },
          {
            dataIndex: 'action',
            title: t('actions'),
            width: 110,
            render: (_: unknown, d: ResourceDevice) => {
              const actions = [
                {
                  key: 'monitoring',
                  label: 'resourceDetail.viewMonitoring',
                  icon: <LineChartOutlined />,
                  props: { href: gpuHref(d, 'monitoring') }
                }
              ];
              return <DropdownButtons items={actions} onSelect={() => {}} />;
            }
          }
        ]}
      />
      {!data.devices.length && (
        <AutoTooltip ghost>
          {t(
            Array.isArray(data.worker.status?.gpu_devices) &&
              data.worker.status.gpu_devices.length === 0
              ? 'noGPU'
              : 'noGPUReported'
          )}
        </AutoTooltip>
      )}
    </Flex>
  );
}
