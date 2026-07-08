import useCreatorColumn from '@/pages/gpu-service/hooks/use-creator-column';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import { FolderOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  DropdownButtons,
  IconFont,
  StatusTag,
  ThemeTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import type { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import {
  rowActionList,
  status,
  StorageTypeKindLabelMap,
  StorageTypePhaseLabelMap
} from '../config';
import { ListItem } from '../config/types';

interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  sortOrder: string[];
}

const getKindLabel = (record: ListItem) => {
  if (record.spec?.nfs)
    return (
      <ThemeTag
        style={{ width: 'fit-content' }}
        color="cyan"
        icon={<FolderOutlined />}
      >
        {StorageTypeKindLabelMap.nfs}
      </ThemeTag>
    );
  if (record.spec?.s3)
    return (
      <ThemeTag
        style={{ width: 'fit-content' }}
        color="green"
        icon={<IconFont type="icon-database" />}
      >
        {StorageTypeKindLabelMap.s3}
      </ThemeTag>
    );
  return '-';
};

const useStorageTypeColumns = ({
  handleSelect,
  sortOrder
}: ColumnsHookProps): ColumnsType<ListItem> => {
  const intl = useIntl();
  const pluginCols = usePluginListColumns('gpuStorageTypes');
  const creatorCols = useCreatorColumn<ListItem>('gpuStorageTypes');
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
        ellipsis: { showTitle: false },
        render: (text: string, record: ListItem) => (
          <AutoTooltip
            ghost
            minWidth={20}
            title={<span>{record.displayName || text}</span>}
          >
            <span className="text-primary">{record.displayName || text}</span>
          </AutoTooltip>
        )
      },
      ...pluginRendered,
      {
        title: intl.formatMessage({ id: 'common.table.type' }),
        key: 'kind',
        sorter: false,
        render: (_text, record) => getKindLabel(record)
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
                text: StorageTypePhaseLabelMap[value] || value,
                message: record?.status?.phaseMessage || ''
              }}
            ></StatusTag>
          ) : (
            '-'
          )
      },
      ...creatorCols,
      // {
      //   title: intl.formatMessage({ id: 'common.table.description' }),
      //   dataIndex: 'description',
      //   key: 'description',
      //   sorter: false,
      //   ellipsis: { showTitle: false },
      //   render: (text: string) => (
      //     <AutoTooltip ghost minWidth={20}>
      //       {text || '-'}
      //     </AutoTooltip>
      //   )
      // },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        sorter: false,
        ellipsis: { showTitle: false },
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
  }, [handleSelect, sortOrder, intl, pluginCols, creatorCols]);
};

export default useStorageTypeColumns;
