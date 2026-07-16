import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { AutoTooltip, ExpandedRowGrid } from '@gpustack/core-ui';
import dayjs from 'dayjs';
import React from 'react';
import { ModelInstanceListItem } from '../../config/types';
import '../../style/instance-item.less';
import ActionsCell from '../instance-cells/actions-cell';
import CPUOffloadingCell from '../instance-cells/cpu-offloading-cell';
import DistributeInfoCell from '../instance-cells/distribute-info-cell';
import DownloadingStatusCell from '../instance-cells/downloading-status-cell';
import InstanceStatusCell from '../instance-cells/instance-status-cell';
import NameCell from '../instance-cells/name-cell';

interface InstanceItemProps {
  instanceData: ModelInstanceListItem;
  workerList: WorkerListItem[];
  modelData?: any;
  defaultOpenId: string;
  // Column grid shared from the parent SealTable so this child row aligns
  // its cells to the parent columns instead of guessing paddings.
  gridTemplate?: string;
  prefixWidth?: number;
  columns?: any[];
  handleChildSelect: (val: string, item: ModelInstanceListItem) => void;
}

const InstanceItem: React.FC<InstanceItemProps> = ({
  instanceData,
  workerList,
  modelData,
  defaultOpenId,
  gridTemplate,
  prefixWidth = 0,
  columns,
  handleChildSelect
}) => {
  // The child row shares the parent's column grid; cells flow left-to-right and
  // only declare a span, so there is no dependency on parent column keys.
  // Parent layout: name (1) | middle plugin/source region | replicas,
  // created_at, operation (last 3). The middle absorbs whatever columns sit
  // between name and replicas (cluster_id, source, any plugin column).
  const columnCount = columns?.length ?? 0;
  const middleSpan = Math.max(columnCount - 4, 1);

  return (
    <ExpandedRowGrid
      gridTemplate={gridTemplate}
      prefixWidth={prefixWidth}
      style={{ color: 'var(--ant-color-text-secondary)' }}
    >
      <ExpandedRowGrid.Cell span={1}>
        <NameCell
          record={instanceData}
          modelData={modelData}
          defaultOpenId={defaultOpenId}
        ></NameCell>
      </ExpandedRowGrid.Cell>
      <ExpandedRowGrid.Cell
        span={middleSpan}
        style={{ flexWrap: 'wrap', gap: 8 }}
      >
        <CPUOffloadingCell record={instanceData}></CPUOffloadingCell>
        <DistributeInfoCell
          record={instanceData}
          workerList={workerList}
        ></DistributeInfoCell>
      </ExpandedRowGrid.Cell>
      <ExpandedRowGrid.Cell span={1} style={{ gap: 4 }}>
        <InstanceStatusCell
          record={instanceData}
          onSelect={handleChildSelect}
        />
        <DownloadingStatusCell
          backend={modelData?.backend}
          distributed_servers={instanceData.distributed_servers}
          workerList={workerList}
          record={instanceData}
        ></DownloadingStatusCell>
      </ExpandedRowGrid.Cell>
      <ExpandedRowGrid.Cell span={1}>
        <AutoTooltip ghost>
          {dayjs(instanceData.created_at).format('YYYY-MM-DD HH:mm:ss')}
        </AutoTooltip>
      </ExpandedRowGrid.Cell>
      <ExpandedRowGrid.Cell span={1}>
        <ActionsCell
          record={instanceData}
          modelData={modelData}
          onSelect={handleChildSelect}
        ></ActionsCell>
      </ExpandedRowGrid.Cell>
    </ExpandedRowGrid>
  );
};
export default InstanceItem;
