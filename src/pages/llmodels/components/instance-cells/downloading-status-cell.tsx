import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { SimpleTable, StatusTag, type ColumnProps } from '@gpustack/core-ui';
import { Progress, Tooltip } from 'antd';
import _ from 'lodash';
import { InstanceStatusMap, status } from '../../config';
import { generateSource } from '../../config/button-actions';
import {
  DistributedServerItem,
  DistributedServers,
  ModelInstanceListItem
} from '../../config/types';
import { backendOptionsMap } from '../../constants/backend-parameters';

interface DownloadingStatusProps {
  distributed_servers?: DistributedServers;
  workerList: WorkerListItem[];
  record: ModelInstanceListItem;
  backend?: string;
}

const statusColumn: ColumnProps[] = [
  {
    title: 'models.table.download.progress',
    locale: true,
    key: 'download_progress',
    render: ({ row }) => {
      return (
        <StatusTag
          download={{
            percent: row.download_progress
          }}
          statusValue={{
            status: row.download_progress
              ? status[InstanceStatusMap.Running]
              : status[InstanceStatusMap.Initializing],
            text: row.download_progress,
            message: ''
          }}
        />
      );
    }
  }
];
const downloadList: ColumnProps[] = [
  {
    title: 'resources.worker',
    locale: true,
    key: 'worker_name',
    width: 280
  },
  ...statusColumn
];

const draftModelDownloadList: ColumnProps[] = [
  {
    title: 'models.form.draftModel',
    locale: true,
    key: 'draft_model',
    style: {
      wordBreak: 'break-word'
    },
    width: 280
  },
  ...statusColumn
];

const DownloadingTips = (props: {
  severList: any[];
  record: ModelInstanceListItem;
  workerList: WorkerListItem[];
}) => {
  const { severList, record, workerList } = props;
  if (!severList.length && !record.draft_model_download_progress) {
    return null;
  }
  const list = _.map(severList, (item: any) => {
    const data = _.find(workerList, { id: item.worker_id });
    return {
      worker_name: data?.name,
      worker_ip: data?.ip,
      download_progress: _.round(item.download_progress, 2)
    };
  });

  const mainWorker = [
    {
      worker_name: `${record.worker_name}`,
      worker_ip: `${record.worker_ip}`,
      download_progress: _.round(record.download_progress, 2)
    }
  ];

  const draftModelList = [];
  if (record.draft_model_download_progress > 0) {
    draftModelList.push({
      draft_model: generateSource(record.draft_model_source),
      download_progress: _.round(record.draft_model_download_progress, 2)
    });
  }

  return (
    <div>
      {severList.length > 0 && (
        <SimpleTable
          columns={downloadList}
          dataSource={[...mainWorker, ...list]}
          rowKey="worker_name"
          theme="light"
        ></SimpleTable>
      )}

      {draftModelList.length > 0 && (
        <SimpleTable
          columns={draftModelDownloadList}
          dataSource={[...draftModelList]}
          rowKey="worker_name"
          theme="light"
        ></SimpleTable>
      )}
    </div>
  );
};

const DownloadingStatus: React.FC<DownloadingStatusProps> = (props) => {
  const { distributed_servers, workerList, record, backend } = props;

  const severList: DistributedServerItem[] =
    distributed_servers?.subordinate_workers || [];

  const isWorkerNotDownloading =
    record.state !== InstanceStatusMap.Downloading ||
    !severList.length ||
    backend === backendOptionsMap.llamaBox;

  const isDraftModeNotDownloading =
    !record.draft_model_download_progress ||
    record.draft_model_download_progress >= 100;

  if (isWorkerNotDownloading && isDraftModeNotDownloading) {
    return null;
  }
  return (
    <Tooltip
      arrow={true}
      styles={{
        container: {
          width: 360,
          backgroundColor: 'var(--color-spotlight-bg)'
        }
      }}
      classNames={{
        root: 'light-downloading-tooltip'
      }}
      title={
        <DownloadingTips
          severList={severList}
          workerList={workerList}
          record={record}
        ></DownloadingTips>
      }
    >
      <Progress
        showInfo={false}
        type="circle"
        size={16}
        strokeColor="var(--ant-color-success)"
        percent={
          _.find(severList, (item: any) => item.download_progress < 100)
            ?.download_progress ||
          record.draft_model_download_progress ||
          0
        }
      />
    </Tooltip>
  );
};

export default DownloadingStatus;
