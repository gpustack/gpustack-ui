// columns.ts
import AutoTooltip from '@/components/auto-tooltip';
import IconFont from '@/components/icon-font';
import { tableSorter } from '@/config/settings';
import { ListItem as workerListItem } from '@/pages/resources/config/types';
import { convertFileSize } from '@/utils';
import { ThunderboltFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useMemo } from 'react';
import ActionsCell from '../components/instance-cells/actions-cell';
import DistributeInfoCell from '../components/instance-cells/distribute-info-cell';
import DownloadingStatusCell from '../components/instance-cells/downloading-status-cell';
import InstanceStatusCell from '../components/instance-cells/instance-status-cell';
import NameCell, {
  NameCellProps
} from '../components/instance-cells/name-cell';
import { ModelInstanceListItem as ListItem } from '../config/types';
import { calcTotalVram } from '../utils';

const WorkerInfoContent: React.FC<NameCellProps> = ({ record, modelData }) => {
  let workerIp = '-';
  if (record.worker_ip) {
    workerIp = record.port
      ? `${record.worker_ip}:${record.port}`
      : record.worker_ip;
  }
  return (
    <div>
      <div>{record.worker_name}</div>
      {/* <div className="flex-center">
        <HddFilled className="m-r-5 text-tertiary" style={{ fontSize: 12 }} />
        <span className="text-secondary">{workerIp}</span>
      </div> */}
      <div className="flex-center">
        <IconFont
          type="icon-filled-gpu"
          className="m-r-5 text-quaternary"
          style={{ fontSize: 12 }}
        />
        <span className="text-quaternary">
          GPU:[
          {_.join(
            record.gpu_indexes?.sort?.((a, b) => a - b),
            ','
          )}
          ]
        </span>
      </div>
      {/* <div className="flex-center">
        <ThunderboltFilled
          className="m-r-5 text-tertiary"
          style={{ fontSize: 12 }}
        />
        <span className="text-secondary">
          {record?.backend || modelData?.backend || ''}
          {record.backend_version || modelData?.backend_version
            ? `(${record.backend_version || modelData?.backend_version})`
            : ''}
        </span>
      </div> */}
    </div>
  );
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

  const renderWorkerCell = (text: number, record: ListItem) => {
    if (text) {
      return (
        <WorkerInfoContent
          record={record}
          modelData={{
            backend: record.backend,
            backend_version: record.backend_version
          }}
        ></WorkerInfoContent>
      );
    }
    return null;
  };

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        sorter: tableSorter(1),
        minWidth: 160,
        render: (value: string, record: ListItem) => (
          <>
            <NameCell
              showWorkerInfo={false}
              record={record}
              modelData={{
                backend: record.backend,
                backend_version: record.backend_version
              }}
            ></NameCell>
            <div className="flex-center">
              <ThunderboltFilled
                className="m-r-5 text-quaternary"
                style={{ fontSize: 12, position: 'relative', top: 2 }}
              />
              <span className="text-quaternary">
                {record?.backend || record?.backend || ''}
                {record.backend_version || record?.backend_version
                  ? `(${record.backend_version || record?.backend_version})`
                  : ''}
              </span>
            </div>
          </>
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
        render: (text, record) => (
          <div className="flex-center gap-8">
            <AutoTooltip ghost>{renderWorkerCell(text, record)}</AutoTooltip>
            <DistributeInfoCell
              record={record}
              workerList={workerList}
            ></DistributeInfoCell>
          </div>
        )
      },
      {
        title: intl.formatMessage({ id: 'models.table.vram.allocated' }),
        dataIndex: 'allocated_vram',
        sorter: tableSorter(6),
        render: (text, record) => (
          <AutoTooltip ghost>
            {convertFileSize(
              record.computed_resource_claim?.vram ? calcTotalVram(record) : 0,
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
        width: 120,
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
