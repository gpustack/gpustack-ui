import {
  buildInstanceTypeRecordFromMiB,
  renderInstanceType
} from '@/pages/gpu-service/instances/utils/render-instance-type';
import { useIntl } from '@umijs/max';
import { useMemo } from 'react';
import { ResourceBreakdownItem } from '../../apis/resource';
import { instanceTypeLabel } from '../../utils/format-instance-type';
import { parseRollup } from '../../utils/time-buckets';

type GroupKey = 'gpu_type' | 'instance' | 'user';

/**
 * Column factory for the GPU-instances breakdown tables, shared by the in-tab
 * table and the export preview. Columns adapt to the active grouping. Sort
 * indicators are uncontrolled (antd manages the header arrows); the table
 * reports changes through its `onChange`.
 */
const useInstancesColumns = (groupKey: GroupKey) => {
  const intl = useIntl();

  return useMemo(() => {
    const baseValueCols = [
      {
        title: intl.formatMessage({ id: 'usage.metric.gpuHours' }),
        dataIndex: 'gpu_hours',
        key: 'gpu_hours',
        sorter: true,
        render: (v: number) => (v ?? 0).toFixed(2)
      },
      {
        title: intl.formatMessage({ id: 'usage.metric.instanceHours' }),
        dataIndex: 'instance_hours',
        key: 'instance_hours',
        sorter: true,
        render: (v: number) => (v ?? 0).toFixed(2)
      }
    ];
    // Instance Types breakdown: the pretty product name (or flavor slug for
    // older rows; "CPU Only" when no GPU cards) plus a CPU + RAM spec popover —
    // rendered through the canonical renderer so the formatting matches the GPU
    // Instances list, but limited to the CPU/RAM categories.
    const instanceTypeColType = {
      title: intl.formatMessage({ id: 'usage.table.instanceType' }),
      dataIndex: 'gpu_type',
      key: 'gpu_type',
      render: (_v: string, row: ResourceBreakdownItem) =>
        renderInstanceType(
          buildInstanceTypeRecordFromMiB({
            name: row.instance_name,
            product: row.product || row.gpu_type,
            gpuCount: row.gpu_count,
            unitCpuMilli: row.unit_cpu_milli,
            unitMemoryMib: row.unit_memory_mib,
            vramMib: row.vram_mib
          }),
          {
            intl,
            categories: ['cpu', 'ram'],
            title:
              !!row.gpu_count || !!row.vram_mib
                ? instanceTypeLabel(row)
                : 'CPU Only'
          }
        )
    };
    // Instances breakdown: render through the canonical GPU Instances list
    // renderer so the label + spec popover are identical. The breakdown row
    // carries flat MiB fields, so adapt it into the ListItem shape first.
    const instanceTypeColInstance = {
      title: intl.formatMessage({ id: 'usage.table.instanceType' }),
      dataIndex: 'gpu_type',
      key: 'gpu_type',
      render: (_v: string, row: ResourceBreakdownItem) =>
        renderInstanceType(
          buildInstanceTypeRecordFromMiB({
            name: row.instance_name,
            product: row.product || row.gpu_type,
            gpuCount: row.gpu_count,
            unitCpuMilli: row.unit_cpu_milli,
            unitMemoryMib: row.unit_memory_mib,
            vramMib: row.vram_mib,
            localStorageMib: row.local_storage_mib,
            ephemeralMib: row.ephemeral_mib,
            persistentMib: row.persistent_mib
          }),
          { intl }
        )
    };
    // Last Active = the last active day. The backend sends a rollup-tz instant
    // with its offset; parseRollup keeps that wall clock (no browser-tz convert),
    // consistent with the trend chart buckets. Shown date-only.
    const lastActiveCol = {
      title: intl.formatMessage({ id: 'usage.table.lastActive' }),
      dataIndex: 'last_active',
      key: 'last_active',
      render: (v?: string) => (v ? parseRollup(v).format('YYYY-MM-DD') : '-')
    };
    if (groupKey === 'gpu_type') {
      return [
        instanceTypeColType,
        ...baseValueCols,
        {
          title: intl.formatMessage({ id: 'usage.metric.activeInstances' }),
          dataIndex: 'active_instances',
          key: 'active_instances'
        },
        lastActiveCol
      ];
    }
    if (groupKey === 'instance') {
      return [
        {
          title: intl.formatMessage({ id: 'usage.table.instance' }),
          dataIndex: 'instance_name',
          key: 'instance_name'
        },
        instanceTypeColInstance,
        ...baseValueCols,
        lastActiveCol
      ];
    }
    // user tab
    return [
      {
        title: intl.formatMessage({ id: 'usage.table.user' }),
        dataIndex: 'user_name',
        key: 'user_name'
      },
      ...baseValueCols,
      lastActiveCol
    ];
  }, [groupKey, intl]);
};

export default useInstancesColumns;
