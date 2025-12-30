import AutoTooltip from '@/components/auto-tooltip';
import { TooltipOverlayScroller } from '@/components/overlay-scroller';
import SimpleTabel, { ColumnProps } from '@/components/simple-table';
import InfoColumn from '@/components/simple-table/info-column';
import StatusTag from '@/components/status-tag';
import ThemeTag from '@/components/tags-wrapper/theme-tag';
import {
  InstanceStatusMap,
  InstanceStatusMapValue,
  status
} from '@/pages/llmodels/config';
import {
  DistributedServerItem,
  ModelInstanceListItem as ListItem,
  ModelInstanceListItem
} from '@/pages/llmodels/config/types';
import { convertFileSize } from '@/utils';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import _ from 'lodash';
import { useMemo } from 'react';
import styled from 'styled-components';

const GPUIndexWrapper = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StatusWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const fieldList = [
  {
    label: 'CPU',
    key: 'cpuoffload',
    locale: false
  },
  {
    label: 'GPU',
    key: 'gpuoffload',
    locale: false
  }
];

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
    title: 'resources.worker',
    locale: true,
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
      const list = _.sortBy(row.gpu_index, (item: number) => item);
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

const renderDistributedServer = (
  severList: any[],
  instanceData: ModelInstanceListItem
) => {
  // const list = _.map(severList, (item: any) => {
  //   const data = _.find(workerList, { id: item.worker_id });
  //   return {
  //     worker_name: data?.name,
  //     worker_ip: data?.ip,
  //     port: '',
  //     is_main: false,
  //     vram: calcTotalVram(item.computed_resource_claim?.vram || {}),
  //     gpu_index: _.keys(item.computed_resource_claim?.vram)
  //   };
  // });

  const mainWorker = [
    {
      worker_name: `${instanceData.worker_name}`,
      worker_ip: `${instanceData.worker_ip}`,
      port: '',
      vram: calcTotalVram(instanceData.computed_resource_claim?.vram || {}),
      is_main: true,
      gpu_index: instanceData.gpu_indexes
    }
  ];

  return (
    <div>
      <SimpleTabel
        rowKey="worker_name"
        columns={distributeCols}
        dataSource={[...mainWorker]}
      ></SimpleTabel>
    </div>
  );
};

const DistributionInfo: React.FC<{
  instanceData: ModelInstanceListItem;
}> = ({ instanceData }) => {
  const intl = useIntl();
  const distributed_servers = instanceData.distributed_servers;
  const severList: DistributedServerItem[] =
    distributed_servers?.subordinate_workers || [];

  if (!severList.length) {
    return null;
  }

  return (
    <TooltipOverlayScroller
      toolTipProps={{
        trigger: 'hover',
        styles: {
          container: {
            width: 'max-content',
            maxWidth: '520px',
            minWidth: '400px'
          }
        }
      }}
      title={renderDistributedServer(severList, instanceData)}
    >
      <ThemeTag
        opacity={0.75}
        color="processing"
        style={{
          marginRight: 0,
          display: 'flex',
          alignItems: 'center',
          maxWidth: '100%',
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
    </TooltipOverlayScroller>
  );
};

const OffloadInfo: React.FC<{
  instanceData: ListItem;
}> = (props) => {
  const intl = useIntl();
  const { instanceData } = props;
  const total_layers = instanceData.computed_resource_claim?.total_layers;
  const offload_layers = instanceData.computed_resource_claim?.offload_layers;
  if (total_layers === offload_layers || !total_layers) {
    return null;
  }

  const offloadData = {
    cpuoffload: `${
      _.subtract(
        instanceData.computed_resource_claim?.total_layers,
        instanceData.computed_resource_claim?.offload_layers
      ) || 0
    } ${intl.formatMessage({
      id: 'models.table.layers'
    })}`,
    gpuoffload: `${instanceData.computed_resource_claim?.offload_layers} ${intl.formatMessage(
      {
        id: 'models.table.layers'
      }
    )}`
  };
  return (
    <Tooltip
      styles={{
        container: {
          paddingInline: 12
        }
      }}
      title={<InfoColumn fieldList={fieldList} data={offloadData}></InfoColumn>}
    >
      <ThemeTag
        opacity={0.75}
        color="cyan"
        style={{
          display: 'flex',
          alignItems: 'center',
          maxWidth: '100%',
          minWidth: 50,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          borderRadius: 12
        }}
      >
        <InfoCircleOutlined className="m-r-5" />
        {intl.formatMessage({
          id: 'models.table.cpuoffload'
        })}
      </ThemeTag>
    </Tooltip>
  );
};

const InstanceStatusTag: React.FC<{
  instanceData: ListItem;
}> = (props) => {
  const intl = useIntl();
  const { instanceData } = props;
  if (!instanceData.state) {
    return null;
  }
  return (
    <>
      <StatusTag
        download={
          instanceData.state === InstanceStatusMap.Downloading
            ? { percent: instanceData.download_progress }
            : undefined
        }
        extra={
          instanceData.state === InstanceStatusMap.Error &&
          instanceData.worker_id ? (
            <Button type="link" size="small" style={{ paddingLeft: 0 }}>
              {intl.formatMessage({ id: 'models.list.more.logs' })}
            </Button>
          ) : null
        }
        statusValue={{
          status:
            instanceData.state === InstanceStatusMap.Downloading &&
            instanceData.download_progress === 100
              ? status[InstanceStatusMap.Running]
              : status[instanceData.state],
          text: InstanceStatusMapValue[instanceData.state],
          message:
            instanceData.state === InstanceStatusMap.Downloading &&
            instanceData.download_progress === 100
              ? ''
              : instanceData.state_message
        }}
      />
    </>
  );
};

const useInstanceColumns = (props: {
  clusterList: Global.BaseOption<number>[];
}): ColumnsType<ListItem> => {
  const { clusterList } = props;
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'resources.model.instance' }),
        dataIndex: 'name',
        width: 240,
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost maxWidth={240}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.worker' }),
        dataIndex: 'worker_name',
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost>{text}</AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'models.title' }),
        dataIndex: 'model_name',
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost>{text}</AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'clusters.title' }),
        dataIndex: 'cluster_id',
        render: (text: number, record: ListItem) => (
          <AutoTooltip ghost>
            {clusterList.find((item) => item.value === text)?.label}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: 'state',
        render: (text: string, record: ListItem) => (
          <StatusWrapper>
            <OffloadInfo instanceData={record} />
            <DistributionInfo instanceData={record} />
            <InstanceStatusTag instanceData={record} />
          </StatusWrapper>
        )
      }
    ];
  }, [intl, clusterList]);
};

export default useInstanceColumns;
