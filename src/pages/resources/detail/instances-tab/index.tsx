import { HelpTooltip } from '@/pages/_components/monitoring';
import ViewLogsModal from '@/pages/llmodels/components/view-logs-modal';
import { InstanceStatusMapValue, status } from '@/pages/llmodels/config';
import type { ModelInstanceListItem } from '@/pages/llmodels/config/types';
import { gpuDeviceLabel } from '@/pages/llmodels/detail/utils/resources';
import useViewInstanceLogs from '@/pages/llmodels/hooks/use-view-instance-logs';
import { RightOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  DropdownButtons,
  IconFont,
  Table as SealTable,
  StatusTag,
  TextAttribute,
  type TableColumnProps
} from '@gpustack/core-ui';
import { Button, Flex, Input, Typography } from 'antd';
import { useState } from 'react';
import styles from '../components/detail.module.less';
import { useResource } from '../config/context';
import type { ResourceAssociation } from '../config/types';
import { useResourceIntl } from '../hooks/use-resource-intl';
import { resourceHref } from '../utils/navigation';
import InstancePlacementCell from './instance-placement-cell';
import {
  groupResourceModels,
  resourceModelRows,
  type ResourceModelRow
} from './model-groups';
import groupStyles from './model-groups.module.less';

export default function InstancesTab({
  compact = false
}: {
  compact?: boolean;
}) {
  const { detail, scope, target } = useResource();
  const grouped = !compact;
  const [collapsedModels, setCollapsedModels] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const {
    openViewLogsModal,
    closeViewLogsModal,
    openViewLogsModalStatus: logs
  } = useViewInstanceLogs();
  const t = useResourceIntl();
  const data = detail.data!;
  const rows = data.instances.filter(
    (i) =>
      !search ||
      `${i.name} ${i.model_name}`.toLowerCase().includes(search.toLowerCase())
  );
  const groups = groupResourceModels(data.instances, search);
  const columns: TableColumnProps[] = [
    {
      dataIndex: 'name',
      title: t('instance'),
      minWidth: 180,
      span: 3,
      render: (value: string, i: ResourceAssociation) => (
        <Flex align="center" gap={8} style={{ minWidth: 0 }}>
          <AutoTooltip ghost>{value}</AutoTooltip>
          <InstancePlacementCell instance={i} />
        </Flex>
      )
    },
    {
      dataIndex: 'model_name',
      title: t('model'),
      minWidth: 130,
      span: 2,
      render: (name: string, i: ResourceAssociation) => (
        <Typography.Link
          href={`#/models/deployments/detail?id=${i.model_id}`}
          className={styles.ellipsis}
        >
          <AutoTooltip ghost>{name}</AutoTooltip>
        </Typography.Link>
      )
    },
    {
      dataIndex: 'state',
      title: t('status'),
      width: 125,
      render: (value: string, i: ResourceAssociation) => (
        <StatusTag
          statusValue={{
            status: status[value] || status.unknown,
            text: InstanceStatusMapValue[value] || value,
            message: i.state_message || ''
          }}
        />
      )
    },
    {
      dataIndex: 'role',
      title: t('role'),
      width: 95,
      render: (value: string) =>
        value ? value[0].toUpperCase() + value.slice(1) : t('inference')
    },
    {
      dataIndex: 'gpu_device_ids',
      title: t('devices'),
      minWidth: 140,
      span: 2,
      render: (ids: string[]) => (
        <Flex gap={8} wrap>
          {ids.map((id) => {
            const d = data.devices.find((d) => d.id === id);
            return d ? (
              <Typography.Link
                key={id}
                href={resourceHref(
                  {
                    kind: 'gpu',
                    id: String(data.worker.id),
                    deviceId: id
                  },
                  scope
                )}
              >
                {gpuDeviceLabel(d, t('chip'))}
              </Typography.Link>
            ) : null;
          })}
          {!ids.length && '—'}
        </Flex>
      )
    },
    {
      dataIndex: 'actions',
      title: t('actions'),
      width: 110,
      render: (_: unknown, i: ResourceAssociation) => (
        <DropdownButtons
          items={[
            {
              key: 'viewlog',
              label: 'common.button.viewlog',
              icon: <IconFont type="icon-logs" />
            }
          ]}
          onSelect={(action) => {
            if (action === 'viewlog')
              openViewLogsModal(i as unknown as ModelInstanceListItem);
          }}
        />
      )
    }
  ];
  const groupedColumns = columns
    .filter(
      (column) =>
        column.dataIndex !== 'model_name' &&
        (target.kind === 'worker' || column.dataIndex !== 'gpu_device_ids')
    )
    .map((column) => ({
      ...column,
      title: column.dataIndex === 'name' ? t('modelOrInstance') : column.title,
      minWidth: column.dataIndex === 'name' ? 280 : column.minWidth,
      render: (_: unknown, row: ResourceModelRow) => {
        if (row.kind === 'model') {
          if (column.dataIndex !== 'name') return null;
          const expanded = !collapsedModels.includes(row.group.modelId);
          return (
            <Flex align="center" gap={8} className={groupStyles.modelGroup}>
              <Button
                type="text"
                size="small"
                icon={<RightOutlined rotate={expanded ? 90 : 0} />}
                aria-label={t(expanded ? 'collapseModel' : 'expandModel')}
                aria-expanded={expanded}
                onClick={() =>
                  setCollapsedModels((ids) =>
                    expanded
                      ? [...ids, row.group.modelId]
                      : ids.filter((id) => id !== row.group.modelId)
                  )
                }
              />
              <Typography.Link
                href={`#/models/deployments/detail?id=${row.group.modelId}`}
                className={styles.ellipsis}
              >
                <AutoTooltip ghost>{row.group.name}</AutoTooltip>
              </Typography.Link>
              <TextAttribute>
                {t('instanceCount', { count: row.group.instances.length })}
              </TextAttribute>
            </Flex>
          );
        }
        if (column.dataIndex === 'name')
          return (
            <Flex
              align="center"
              gap={8}
              style={{
                paddingInlineStart: 'var(--ant-padding-xl)',
                minWidth: 0
              }}
            >
              <AutoTooltip ghost>{row.instance.name}</AutoTooltip>
              <InstancePlacementCell instance={row.instance} />
            </Flex>
          );
        return column.render?.(
          row.instance[column.dataIndex as keyof ResourceAssociation],
          row.instance
        );
      }
    }));
  return (
    <Flex
      vertical
      gap={16}
      className={`${styles.table} ${grouped ? groupStyles.grouped : ''}`}
    >
      {!compact && (
        <Flex gap={12} align="center" wrap>
          <Input.Search
            placeholder={t('searchInstances')}
            aria-label={t('searchInstances')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (grouped && e.target.value.trim()) setCollapsedModels([]);
            }}
            allowClear
            style={{ width: 300, maxWidth: '100%' }}
          />
          <Typography.Text type="secondary">
            {grouped
              ? t('modelsInstancesCount', {
                  models: groups.length,
                  instances: groups.reduce(
                    (sum, group) => sum + group.instances.length,
                    0
                  )
                })
              : t('instanceCount', { count: rows.length })}
          </Typography.Text>
          <HelpTooltip
            label={t('relatedInstances')}
            content={t('associationHelp')}
          />
        </Flex>
      )}
      <SealTable
        loading={detail.loading}
        rowKey="id"
        scroll={{ x: true }}
        dataSource={grouped ? resourceModelRows(groups, collapsedModels) : rows}
        columns={
          grouped
            ? groupedColumns
            : columns.filter(
                (column) =>
                  target.kind === 'worker' ||
                  column.dataIndex !== 'gpu_device_ids'
              )
        }
      />
      {logs.open &&
        data.instances.some(
          (instance) => instance.id === logs.currentData.id
        ) && (
          <ViewLogsModal
            open
            url={logs.currentData.url}
            id={logs.currentData.id}
            modelId={logs.currentData.modelId}
            tail={logs.currentData.tail}
            status={logs.currentData.status}
            onCancel={closeViewLogsModal}
          />
        )}
    </Flex>
  );
}
