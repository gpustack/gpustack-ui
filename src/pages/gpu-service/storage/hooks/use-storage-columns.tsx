import useCreatorColumn from '@/pages/gpu-service/hooks/use-creator-column';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import { AutoTooltip, DropdownButtons, StatusTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import type { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { rowActionList, status, StoragePhaseLabelMap } from '../config';
import { ListItem } from '../config/types';

interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  storageClassList: Global.BaseOption<string>[];
  sortOrder: string[];
}

const useStorageColumns = ({
  handleSelect,
  storageClassList,
  sortOrder
}: ColumnsHookProps): ColumnsType<ListItem> => {
  const intl = useIntl();
  const pluginCols = usePluginListColumns('gpuStorage');
  const creatorCols = useCreatorColumn<ListItem>('gpuStorage');
  return useMemo(() => {
    const pluginRendered = pluginCols.map((c) => ({
      title: intl.formatMessage({ id: c.titleId }),
      key: c.key,
      ellipsis: { showTitle: false },
      render: (_text: any, record: ListItem) => c.render(record)
    }));
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        ellipsis: {
          showTitle: false
        },
        render: (text: string, record: ListItem) => (
          <AutoTooltip
            ghost
            style={{ maxWidth: 360 }}
            title={<span>{record.displayName || text}</span>}
          >
            <span className="text-primary">{record.displayName || text}</span>
          </AutoTooltip>
        )
      },
      ...pluginRendered,
      {
        title: intl.formatMessage({ id: 'common.table.type' }),
        dataIndex: ['spec', 'type'],
        key: 'type',
        sorter: false,
        render: (value: string) => {
          return (
            <AutoTooltip ghost>
              {storageClassList.find((item) => item.value === value)?.label ||
                '-'}
            </AutoTooltip>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.storage.capacity' }),
        dataIndex: ['spec', 'capacity'],
        key: 'capacity',
        sorter: false,
        render: (value: string) => (value ? value.replace(/Gi$/, 'GB') : '-')
      },
      {
        // A volume is created independently and keeps being metered while
        // nothing is attached. That is intended, but without this column an
        // idle-but-billed volume is indistinguishable from one in use, and the
        // user cannot tell whether deleting it is safe. Every holder is listed,
        // whatever its phase — a Stopped instance holds the volume just as a
        // running one does, and blocks its reclaim. The phase itself is not
        // rendered; see the cell below for why.
        title: intl.formatMessage({
          id: 'gpuservice.storage.attachedInstances'
        }),
        dataIndex: 'attachedInstances',
        key: 'attachedInstances',
        sorter: false,
        ellipsis: { showTitle: false },
        render: (_value: unknown, record: ListItem) => {
          const attached = record.attachedInstances;
          // Nothing attached reads as an empty cell, the same dash every other
          // column uses. This drops the distinction from "not resolved" (a
          // server too old to send the field), which was defensive: the pair is
          // released together, and if it ever happened the finalizer still
          // blocks the delete with a reason naming the holder.
          if (!attached?.length) return <span>-</span>;
          // Names only. The phase is load-bearing in exactly one case — a
          // Stopped instance holds the volume just as a running one does — and
          // that is where it appears: the blocked-delete message names the
          // holder AND its phase. Here it would be "(Ready)" on nearly every
          // row, which pushed the real content past the column's width.
          // Drop nameless entries rather than joining a blank into the list:
          // the name is the whole point of the column, and an unnamed holder
          // would render as a stray comma.
          const names = attached.map((item) => item.name).filter(Boolean);
          if (!names.length) return <span>-</span>;
          const label = names.join(', ');
          return (
            <AutoTooltip ghost style={{ maxWidth: 260 }} title={label}>
              {label}
            </AutoTooltip>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: ['status', 'phase'],
        key: 'status',
        sorter: false,
        render: (value: string, record: ListItem) =>
          value ? (
            <StatusTag
              statusValue={{
                status: status[value],
                text: StoragePhaseLabelMap[value] || value,
                message: record?.status?.phaseMessage || ''
              }}
            ></StatusTag>
          ) : (
            '-'
          )
      },
      ...creatorCols,
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        sorter: false,
        ellipsis: {
          showTitle: false
        },
        render: (text: string) => (
          <AutoTooltip ghost>
            {text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        key: 'operation',
        dataIndex: 'operation',
        render: (_text, record) => (
          <DropdownButtons
            items={rowActionList}
            onSelect={(val) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [
    handleSelect,
    sortOrder,
    storageClassList,
    intl,
    pluginCols,
    creatorCols
  ]);
};

export default useStorageColumns;
