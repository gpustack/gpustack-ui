// columns.ts
import { tableSorter } from '@/config/settings';
import { ListItem as workerListItem } from '@/pages/resources/config/types';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import { convertFileSize } from '@/utils';
import { PartitionOutlined, ThunderboltFilled } from '@ant-design/icons';
import { AutoTooltip, IconFont } from '@gpustack/core-ui';
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
import {
  formatGPUTypeAllocation,
  getGPUTypeClusterId,
  getGPUTypeSelector
} from '../components/instance-cells/vgpu-info';
import {
  DistributedServerItem,
  ModelInstanceListItem as ListItem,
  ListItem as ModelListItem
} from '../config/types';
import { useGPUTypeDisplayName } from '../hooks/use-gpu-type-display-name';
import { calcTotalVram } from '../utils';

const WorkerInfoContent: React.FC<
  NameCellProps & { workerList: workerListItem[] }
> = ({ record, modelData, workerList }) => {
  const intl = useIntl();
  let workerIp = '-';
  const distributed_servers = record.distributed_servers;
  const severList: DistributedServerItem[] =
    distributed_servers?.subordinate_workers || [];

  // vGPU (InstanceType) allocation, e.g. "A10 (50% VRAM / 50% Compute)";
  // empty for non-vGPU instances, which render exactly as before.
  const gpuTypeSelector = getGPUTypeSelector(record, modelData);
  const gpuTypeDisplayName = useGPUTypeDisplayName(
    getGPUTypeClusterId(record, modelData),
    gpuTypeSelector?.type
  );
  const vgpuAllocation = formatGPUTypeAllocation(
    intl,
    gpuTypeSelector,
    gpuTypeDisplayName
  );

  if (record.worker_ip) {
    workerIp = record.port
      ? `${record.worker_ip}:${record.port}`
      : record.worker_ip;
  }

  return (
    <div>
      <div>{record.worker_name}</div>
      {severList.length > 0 ? (
        <DistributeInfoCell
          record={record}
          workerList={workerList}
          gpuTypeSelector={getGPUTypeSelector(record, modelData)}
        ></DistributeInfoCell>
      ) : (
        <>
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
          {vgpuAllocation && (
            <div className="flex-center">
              <PartitionOutlined
                className="m-r-5 text-quaternary"
                style={{ fontSize: 12 }}
              />
              <span className="text-quaternary">
                {intl.formatMessage({ id: 'models.table.vgpu' })}:{' '}
                {vgpuAllocation}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const useInstancesColumns = (options: {
  workerList: workerListItem[];
  modelList: ModelListItem[];
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
  const { workerList, clusterList, modelList, handleSelect, onCellClick } =
    options;
  const pluginCols = usePluginListColumns('modelInstances');

  // Key the parent-model lookup once per render instead of a linear find
  // per row (O(instances x models) on large lists).
  const modelById = useMemo(
    () => new Map(modelList.map((model) => [model.id, model])),
    [modelList]
  );

  const renderWorkerCell = (text: number, record: ListItem) => {
    if (text) {
      // The instance payload does not echo gpu_type_selector; it lives on
      // the parent model, already fetched into modelList.
      const modelData = modelById.get(record.model_id);
      return (
        <WorkerInfoContent
          workerList={workerList}
          record={record}
          modelData={{
            backend: record.backend,
            backend_version: record.backend_version,
            gpu_type_selector: modelData?.gpu_type_selector
          }}
        ></WorkerInfoContent>
      );
    }
    return null;
  };

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
              styles={{
                label: {
                  color: 'var(--ant-color-text)'
                }
              }}
            ></NameCell>
            <div className="flex-center">
              <ThunderboltFilled
                className="m-r-5 text-quaternary"
                style={{ fontSize: 12, position: 'relative', top: 2 }}
              />
              <span className="text-quaternary">
                {record?.backend || ''}
                {record.backend_version ? `(${record.backend_version})` : ''}
              </span>
            </div>
          </>
        )
      },
      ...pluginRendered,
      {
        title: intl.formatMessage({ id: 'clusters.title' }),
        dataIndex: 'cluster_id',
        width: 200,
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
          </div>
        )
      },
      {
        title: intl.formatMessage({ id: 'models.table.vram.allocated' }),
        dataIndex: 'allocated_vram',
        sorter: tableSorter(6),
        width: 160,
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
            <InstanceStatusCell record={record} onSelect={handleSelect} />
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
            modelData={modelById.get(record.model_id) as ModelListItem}
            onSelect={handleSelect}
          ></ActionsCell>
        )
      }
    ];
  }, [
    handleSelect,
    onCellClick,
    workerList,
    clusterList,
    modelById,
    intl,
    pluginCols
  ]);
};

export default useInstancesColumns;
