import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { convertFileSize } from '@/utils';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  SimpleTable,
  ThemeTag,
  TooltipOverlayScroller,
  type ColumnProps
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';
import {
  DistributedServerItem,
  DistributedServers,
  GPUTypeSelector,
  ModelInstanceListItem
} from '../../config/types';
import { useGPUTypeDisplayName } from '../../hooks/use-gpu-type-display-name';
import { formatGPUTypeAllocation } from './vgpu-info';

const GPUIndexWrapper = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

interface DistributeInfoCellProps {
  record: ModelInstanceListItem;
  workerList: WorkerListItem[];
  // The parent model's gpu_type_selector; when set (vGPU deployment) the
  // tooltip table gains a vGPU column. Same for every worker — each holds
  // one slice of the same InstanceType.
  gpuTypeSelector?: GPUTypeSelector | null;
}

const renderGpuIndexs = (gpuIndexes: number[]) => {
  return (
    <GPUIndexWrapper>
      {_.chunk(gpuIndexes, 8).map((item: number[], index: number) => {
        return <span key={index}>{item.join(',')}</span>;
      })}
    </GPUIndexWrapper>
  );
};

const distributeCols: ColumnProps[] = [
  {
    title: 'Worker',
    key: 'worker_name',
    style: {
      wordBreak: 'break-word'
    }
  },
  {
    title: 'IP',
    key: 'worker_ip',
    render: ({ row }) => {
      return row.port ? `${row.worker_ip}:${row.port}` : row.worker_ip;
    }
  },
  {
    title: 'models.table.gpuindex',
    locale: true,
    key: 'gpu_index',
    render: ({ row }) => {
      const list = row.gpu_index?.sort((a: number, b: number) => a - b) || [];
      return row.is_main ? (
        <>
          {renderGpuIndexs(list)}
          <span>(main)</span>
        </>
      ) : (
        renderGpuIndexs(list)
      );
    }
  },
  {
    title: 'models.table.vram.allocated',
    locale: true,
    key: 'vram',
    render: ({ rowIndex, row, dataList }) => {
      return convertFileSize(row.vram, 1);
    }
  }
];

const calcTotalVram = (vram: Record<string, number>) => {
  return _.sum(_.values(vram));
};

const DistributedServerList: React.FC<DistributeInfoCellProps> = ({
  record,
  workerList,
  gpuTypeSelector
}) => {
  const intl = useIntl();
  const serverList: DistributedServerItem[] =
    record?.distributed_servers?.subordinate_workers || [];

  // vGPU allocation label (e.g. "A10 (1g.2gb)"); empty for non-vGPU models,
  // in which case the table renders exactly as before (no extra column).
  const gpuTypeDisplayName = useGPUTypeDisplayName(
    record?.cluster_id,
    gpuTypeSelector?.type
  );
  const vgpuAllocation = formatGPUTypeAllocation(
    intl,
    gpuTypeSelector,
    gpuTypeDisplayName
  );

  const columns = React.useMemo(() => {
    if (!vgpuAllocation) {
      return distributeCols;
    }
    const vgpuCol: ColumnProps = {
      title: 'models.table.vgpu',
      locale: true,
      key: 'vgpu',
      style: {
        wordBreak: 'break-word'
      }
    };
    // Insert after the GPU index column, before allocated VRAM.
    return [...distributeCols.slice(0, 3), vgpuCol, ...distributeCols.slice(3)];
  }, [vgpuAllocation]);

  const list = _.map(serverList, (item: DistributedServerItem) => {
    const data = _.find(workerList, { id: item.worker_id });
    return {
      worker_name: data?.name,
      worker_ip: data?.ip,
      port: '',
      is_main: false,
      vram: calcTotalVram(item.computed_resource_claim?.vram || {}),
      gpu_index: _.keys(item.computed_resource_claim?.vram)
        .map((i: string) => Number(i))
        .sort((a: number, b: number) => a - b),
      vgpu: vgpuAllocation
    };
  });

  const mainWorker = [
    {
      worker_name: `${record.worker_name}`,
      worker_ip: `${record.worker_ip}`,
      port: '',
      vram: calcTotalVram(record.computed_resource_claim?.vram || {}),
      is_main: true,
      gpu_index: record.gpu_indexes?.sort((a: number, b: number) => a - b),
      vgpu: vgpuAllocation
    }
  ];

  return (
    <div>
      <SimpleTable
        rowKey="worker_name"
        columns={columns}
        dataSource={[...mainWorker, ...list]}
      ></SimpleTable>
    </div>
  );
};

const DistributeInfoCell: React.FC<{
  record: ModelInstanceListItem;
  workerList: WorkerListItem[];
  gpuTypeSelector?: GPUTypeSelector | null;
}> = ({ record, workerList, gpuTypeSelector }) => {
  const intl = useIntl();
  const distributed_servers: DistributedServers | undefined =
    record?.distributed_servers;

  const serverList: DistributedServerItem[] =
    distributed_servers?.subordinate_workers || [];

  if (!serverList.length) {
    return null;
  }
  return (
    <TooltipOverlayScroller
      toolTipProps={{
        styles: {
          container: {
            width: 'max-content',
            maxWidth: '520px',
            minWidth: '400px'
          }
        }
      }}
      title={
        <DistributedServerList
          record={record}
          workerList={workerList}
          gpuTypeSelector={gpuTypeSelector}
        ></DistributedServerList>
      }
    >
      <span>
        <ThemeTag
          opacity={0.75}
          color="processing"
          style={{
            marginRight: 0,
            display: 'flex',
            alignItems: 'center',
            maxWidth: 'max-content',
            minWidth: 50,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            borderRadius: 12
          }}
        >
          <InfoCircleOutlined className="m-r-5" />
          {intl.formatMessage({
            id: 'models.table.acrossworker'
          })}
        </ThemeTag>
      </span>
    </TooltipOverlayScroller>
  );
};

export default DistributeInfoCell;
