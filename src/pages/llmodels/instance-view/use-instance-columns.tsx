// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import { tableSorter } from '@/config/settings';
import { ListItem as workerListItem } from '@/pages/resources/config/types';
import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useMemo } from 'react';
import ActionsCell from '../components/instance-cells/actions-cell';
import DistributeInfoCell from '../components/instance-cells/distribute-info-cell';
import DownloadingStatusCell from '../components/instance-cells/downloading-status-cell';
import InstanceStatusCell from '../components/instance-cells/instance-status-cell';
import NameCell from '../components/instance-cells/name-cell';
import { ModelInstanceListItem as ListItem } from '../config/types';

const calcTotalVram = (vram: Record<string, number>) => {
  return _.sum(_.values(vram));
};

const useProviderColumns = (options: {
  workerList: workerListItem[];
  clusterList: Global.BaseOption<
    number,
    {
      provider: string;
      state: string;
      is_default: boolean;
    }
  >[];
  handleSelect: (val: string, record: ListItem) => void;
  onCellClick?: (record: ListItem, dataIndex: string) => void;
}): ColumnsType<ListItem> => {
  const intl = useIntl();
  const { workerList, clusterList, handleSelect, onCellClick } = options;

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        sorter: tableSorter(1),
        minWidth: 160,
        render: (value: string, record: ListItem) => (
          <NameCell
            record={record}
            modelData={{
              backend: record.backend,
              backend_version: record.backend_version
            }}
          ></NameCell>
        )
      },
      {
        title: intl.formatMessage({ id: 'clusters.title' }),
        dataIndex: 'cluster_id',
        minWidth: 200,
        render: (text: number) => (
          <AutoTooltip ghost>
            {text
              ? clusterList.find((cluster) => cluster.value === text)?.label
              : ''}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.worker' }),
        dataIndex: 'worker_id',
        minWidth: 200,
        render: (text, record) => (
          <AutoTooltip ghost>
            {text &&
            (!record.distributed_servers?.subordinate_workers ||
              !record.distributed_servers?.subordinate_workers.length)
              ? workerList.find((worker) => worker.id === text)?.name
              : ''}
            <DistributeInfoCell
              record={record}
              workerList={workerList}
            ></DistributeInfoCell>
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'models.table.vram.allocated' }),
        dataIndex: 'allocated_vram',
        sorter: tableSorter(6),
        render: (text, record) => (
          <AutoTooltip ghost>
            {convertFileSize(
              record.computed_resource_claim?.vram
                ? calcTotalVram(record.computed_resource_claim?.vram)
                : 0,
              1
            )}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: 'state',
        width: 160,
        render: (text: string, record: ListItem) => (
          <span style={{ gap: 4 }} className="flex-center">
            <InstanceStatusCell record={record} onSelect={() => {}} />
            <DownloadingStatusCell
              backend={record?.backend}
              distributed_servers={record.distributed_servers}
              workerList={[]}
              record={record}
            ></DownloadingStatusCell>
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        sorter: tableSorter(6),
        span: 3,
        render: (text, record) => (
          <AutoTooltip ghost>
            {dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        dataIndex: 'operations',
        span: 3,
        minWidth: 120,
        render: (value: string, record: ListItem) => (
          <ActionsCell
            record={record}
            modelData={{
              categories: record.categories || []
            }}
            onSelect={handleSelect}
          ></ActionsCell>
        )
      }
    ];
  }, [handleSelect, onCellClick, workerList, clusterList]);
};

export default useProviderColumns;
