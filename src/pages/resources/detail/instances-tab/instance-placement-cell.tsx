import { InfoCircleOutlined } from '@ant-design/icons';
import {
  SimpleTable,
  ThemeTag,
  TooltipOverlayScroller,
  type ColumnProps
} from '@gpustack/core-ui';
import { Flex } from 'antd';
import { useState } from 'react';
import type { ResourceAssociation, ResourcePlacement } from '../config/types';
import { useResourceIntl } from '../hooks/use-resource-intl';
import styles from './instance-placement-cell.module.less';

export default function InstancePlacementCell({
  instance
}: {
  instance: ResourceAssociation;
}) {
  const t = useResourceIntl();
  const [open, setOpen] = useState(false);
  const placements = instance.placements || [];
  const acrossWorkers = instance.spans_workers || placements.length > 1;
  const gpuCount = placements.reduce(
    (total, p) => total + p.gpu_indexes.length,
    0
  );
  if (!acrossWorkers && Math.max(gpuCount, instance.gpu_device_ids.length) < 2)
    return null;
  const label = t(acrossWorkers ? 'distributed' : 'multiGPU');
  const columns: ColumnProps[] = [
    {
      key: 'worker_name',
      title: 'Worker',
      render: ({ row }: { row: ResourcePlacement }) => (
        <Flex vertical gap={4}>
          <span>{row.worker_name}</span>
          {row.is_main && (
            <span className={styles.secondary}>{t('mainWorker')}</span>
          )}
        </Flex>
      )
    },
    {
      key: 'worker_ip',
      title: 'IP',
      render: ({ row }) => row.worker_ip || '—'
    },
    {
      key: 'gpu_indexes',
      title: 'GPU',
      render: ({ row }: { row: ResourcePlacement }) =>
        row.gpu_indexes.length ? `GPU ${row.gpu_indexes.join(', ')}` : '—'
    }
  ];
  return (
    <TooltipOverlayScroller
      maxHeight={280}
      toolTipProps={{
        open,
        onOpenChange: setOpen,
        trigger: ['hover', 'focus'],
        styles: {
          root: { width: 'max-content', maxWidth: 'calc(100vw - 32px)' },
          container: { width: 'max-content', maxWidth: 'calc(100vw - 32px)' }
        }
      }}
      title={
        <Flex vertical gap={8} className={styles.content}>
          {!!placements.length && (
            <SimpleTable
              rowKey="worker_id"
              columns={columns}
              dataSource={placements}
            />
          )}
          {instance.placements_complete !== true && (
            <span className={styles.notice}>{t('placementsUnavailable')}</span>
          )}
        </Flex>
      }
    >
      <button
        type="button"
        className={styles.trigger}
        aria-label={t('instancePlacement', { name: instance.name })}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
      >
        <ThemeTag
          opacity={0.75}
          color="processing"
          style={{ marginInlineEnd: 0, borderRadius: 12 }}
        >
          <Flex component="span" gap={4} align="center">
            <InfoCircleOutlined />
            {label}
          </Flex>
        </ThemeTag>
      </button>
    </TooltipOverlayScroller>
  );
}
