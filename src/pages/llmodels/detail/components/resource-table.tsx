import { EyeOutlined } from '@ant-design/icons';
import {
  DropdownButtons,
  Table as SealTable,
  SectionTitle,
  type TableOrder
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Typography } from 'antd';
import { useState, type CSSProperties } from 'react';
import { useDetail } from '../config/context';
import type { ResourceDevice } from '../config/types';
import { displayValue } from '../utils/metrics';
import { gpuDeviceLabel, sortResourceDevices } from '../utils/resources';
import HelpTooltip from './help-tooltip';
import { AvailabilityNotice, RequestNotice } from './metric-state';

const ResourceTable = ({
  showTitle = true,
  compact = false
}: {
  showTitle?: boolean;
  compact?: boolean;
}) => {
  const intl = useIntl();
  const { resources, instances, inspectDevice } = useDetail();
  const [order, setOrder] = useState<'ascend' | 'descend' | null>(null);
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const devices = sortResourceDevices(resources.data?.devices || [], order);
  const instanceLabels = (ids: number[]) =>
    ids.map((id) => {
      const instance = instances.data?.find((item) => item.id === id);
      return `${instance?.name || `#${id}`} · ${instance ? instance.role || t('inference') : t('unknown')}`;
    });
  const compactText = (value: string, tooltip: string = value) => (
    <Typography.Text
      ellipsis={{ tooltip }}
      style={{ width: '100%', whiteSpace: 'nowrap' }}
    >
      {value}
    </Typography.Text>
  );
  return (
    <Flex
      vertical
      gap={12}
      style={
        compact
          ? ({ '--seal-table-row-min-height': '52px' } as CSSProperties)
          : undefined
      }
    >
      {showTitle && (
        <Flex justify="space-between" align="center" gap={12}>
          <Flex align="center" gap={4}>
            <SectionTitle>{t('resourceInventory')}</SectionTitle>
            <HelpTooltip
              label={t('resourceInventory')}
              content={
                <Flex vertical gap={8}>
                  <span>{t('sharedHardware')}</span>
                  <span>{t('liveResourceSnapshot')}</span>
                </Flex>
              }
            />
          </Flex>
          <Typography.Text type="secondary">{t('current')}</Typography.Text>
        </Flex>
      )}
      <RequestNotice state={resources} />
      <AvailabilityNotice
        available={resources.data?.available}
        reason={resources.data?.reason}
        history
      />
      <SealTable
        rowKey="id"
        dataSource={devices}
        loading={resources.loading}
        onTableSort={(sort: TableOrder | TableOrder[]) =>
          setOrder((Array.isArray(sort) ? sort[0]?.order : sort.order) || null)
        }
        columns={[
          {
            dataIndex: 'model_instance_ids',
            title: `${t('instance')} / ${t('role')}`,
            minWidth: 190,
            render: (ids: number[]) =>
              compact ? (
                compactText(instanceLabels(ids).join(', '))
              ) : (
                <Flex vertical gap={4}>
                  {ids.map((id) => {
                    const instance = instances.data?.find(
                      (item) => item.id === id
                    );
                    return (
                      <div key={id}>
                        {instance?.name || `#${id}`}
                        <Typography.Text type="secondary">
                          {' '}
                          ·{' '}
                          {instance
                            ? instance.role || t('inference')
                            : t('unknown')}
                        </Typography.Text>
                      </div>
                    );
                  })}
                </Flex>
              )
          },
          {
            dataIndex: 'worker_name',
            title: 'Worker',
            minWidth: 150,
            render: (name: string) => (compact ? compactText(name) : name)
          },
          {
            dataIndex: 'name',
            title: 'GPU',
            minWidth: compact ? 220 : 180,
            render: (_: unknown, device: ResourceDevice) =>
              compact ? (
                compactText(
                  `${gpuDeviceLabel(device, t('chip'))} · ${device.name}`,
                  `${gpuDeviceLabel(device, t('chip'))} · ${device.name} · ${t(device.scope === 'partition' ? 'partition' : 'physicalGPU')}`
                )
              ) : (
                <Flex vertical gap={4}>
                  <span>
                    {device.name} · {gpuDeviceLabel(device, t('chip'))}
                  </span>
                  <Typography.Text type="secondary">
                    {t(
                      device.scope === 'partition' ? 'partition' : 'physicalGPU'
                    )}
                  </Typography.Text>
                </Flex>
              )
          },
          {
            dataIndex: 'gpu_utilization',
            title: t('metric.gpu_utilization'),
            minWidth: 130,
            sorter: true,
            sortOrder: order,
            render: (_: unknown, device: ResourceDevice) =>
              `${displayValue(device.current?.gpu_utilization, 'percent')} %`
          },
          {
            dataIndex: 'gpu_memory',
            title: t('metric.gpu_memory_used'),
            minWidth: 160,
            render: (_: unknown, device: ResourceDevice) =>
              `${displayValue(device.current?.gpu_memory_used, 'bytes')} / ${displayValue(device.current?.gpu_memory_total, 'bytes')} GiB`
          },
          ...(compact
            ? [
                {
                  dataIndex: 'gpu_power',
                  title: t('metric.gpu_power'),
                  minWidth: 100,
                  render: (_: unknown, device: ResourceDevice) =>
                    `${displayValue(device.current?.gpu_power, 'watts')} W`
                },
                {
                  dataIndex: 'gpu_temperature',
                  title: t('metric.gpu_temperature'),
                  minWidth: 100,
                  render: (_: unknown, device: ResourceDevice) =>
                    `${displayValue(device.current?.gpu_temperature, 'celsius')} °C`
                }
              ]
            : []),
          {
            dataIndex: 'history_available',
            title: t('history'),
            minWidth: 150,
            render: (available: boolean) => {
              const label = t(
                available ? 'historyAvailable' : 'historyUnavailable'
              );
              return compact ? compactText(label) : label;
            }
          },
          {
            dataIndex: 'id',
            title: t('actions'),
            minWidth: 100,
            render: (_: unknown, device: ResourceDevice) => (
              <DropdownButtons
                items={[
                  {
                    key: 'details',
                    label: 'modelMonitoring.viewDetails',
                    icon: <EyeOutlined />
                  }
                ]}
                onSelect={(action) => {
                  if (action === 'details') inspectDevice(device);
                }}
              />
            )
          }
        ]}
        scroll={{ x: true }}
      />
    </Flex>
  );
};
export default ResourceTable;
