import { convertFileSize } from '@/utils';
import {
  HddFilled,
  InfoCircleOutlined,
  PartitionOutlined,
  PieChartFilled,
  ThunderboltFilled
} from '@ant-design/icons';
import { AutoTooltip, IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import _ from 'lodash';
import React, { useEffect } from 'react';
import {
  DistributedServerItem,
  ModelInstanceListItem
} from '../../config/types';
import { useGPUTypeDisplayName } from '../../hooks/use-gpu-type-display-name';
import '../../style/instance-item.less';
import { calcTotalVram } from '../../utils';
import {
  formatGPUTypeAllocation,
  getGPUTypeClusterId,
  getGPUTypeSelector
} from './vgpu-info';
export interface NameCellProps {
  record: ModelInstanceListItem;
  modelData: any;
  defaultOpenId?: string;
  showWorkerInfo?: boolean;
  styles?: {
    label?: React.CSSProperties;
  };
}

// Every colour here is a `--color-white-*` token rather than `--ant-color-text-*`:
// the card lives inside a Tooltip, whose background stays dark in both themes.
// Same pair the distributed-servers table uses, so the two popups on one row read
// alike — label at tertiary, value at secondary.
const useStyles = createStyles(({ css }) => ({
  card: css`
    min-width: 240px;
    font-size: 13px;
    line-height: 1.5;

    .divider {
      margin: 10px 0;
      border-top: 1px solid var(--color-white-light-1);
    }
    .label {
      flex: none;
      color: var(--color-white-tertiary);
    }
    .label .anticon {
      font-size: 12px;
      color: var(--color-white-quaternary);
    }
    /* Right column: values hug the right edge so they line up. */
    .value {
      color: var(--color-white-secondary);
      word-break: break-all;
      text-align: right;
    }
    .hint {
      font-size: 12px;
      color: var(--color-white-quaternary);
      text-align: right;
    }
    .metric {
      font-size: 14px;
      font-weight: 500;
      line-height: 1.2;
      color: var(--color-white-secondary);
    }
    .metric-unit {
      margin-left: 4px;
      font-size: 12px;
      font-weight: 400;
      color: var(--color-white-tertiary);
    }
  `
}));

interface InfoRowProps {
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, icon, value }) => {
  const intl = useIntl();
  return (
    <Flex align="flex-start" justify="space-between" gap={16}>
      <Flex align="center" gap={6} className="label">
        {icon}
        <span>{intl.formatMessage({ id: label })}</span>
      </Flex>
      <span className="value">{value}</span>
    </Flex>
  );
};

const WorkerInfoContent: React.FC<NameCellProps> = ({ record, modelData }) => {
  const intl = useIntl();
  const { styles } = useStyles();

  // vGPU (InstanceType) allocation; empty for non-vGPU instances.
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

  const subordinateWorkers =
    record.distributed_servers?.subordinate_workers || [];
  const isDistributed = subordinateWorkers.length > 0;

  let workerIp = '-';
  if (record.worker_ip) {
    workerIp = record.port
      ? `${record.worker_ip}:${record.port}`
      : record.worker_ip;
  }

  const gpuIndexes = [...(record.gpu_indexes || [])].sort((a, b) => a - b);

  const backendVersion = record.backend_version || modelData?.backend_version;
  const backend = `${record?.backend || modelData?.backend || '-'}${
    backendVersion ? ` (${backendVersion})` : ''
  }`;

  // "152 GiB" split so the figure can carry the display weight and the unit
  // stays subordinate to it.
  const [vramValue, vramUnit] = String(
    convertFileSize(calcTotalVram(record), 1)
  ).split(' ');

  // A cross-worker instance spreads its claim over the main worker plus every
  // subordinate, so both the VRAM total and the card count are instance-wide.
  const workerCount = subordinateWorkers.length + 1;
  const gpuCount =
    gpuIndexes.length +
    _.sumBy(
      subordinateWorkers,
      (item: DistributedServerItem) =>
        _.keys(item.computed_resource_claim?.vram || {}).length
    );

  // The last group describes the main worker — only its label changes when the
  // instance is distributed. The per-worker breakdown of a distributed
  // instance belongs to the "across workers" tooltip on the same row.
  const workerRows: InfoRowProps[] = [
    {
      label: isDistributed
        ? 'models.instance.mainworker'
        : 'models.instance.worker',
      icon: <IconFont type="icon-server-fill" />,
      value: record.worker_name
    },
    {
      label: 'models.instance.workerip',
      icon: <HddFilled />,
      value: workerIp
    },
    {
      label: 'models.table.gpuindex',
      icon: <IconFont type="icon-filled-gpu" />,
      value: gpuIndexes.length ? `[${_.join(gpuIndexes, ', ')}]` : '-'
    },
    ...(vgpuAllocation
      ? [
          {
            label: 'models.table.vgpu',
            icon: <PartitionOutlined />,
            value: vgpuAllocation
          }
        ]
      : [])
  ];

  return (
    <div className={styles.card}>
      <Flex vertical gap={2}>
        <Flex align="baseline" justify="space-between" gap={16}>
          <Flex align="center" gap={6} className="label">
            <PieChartFilled />
            <span>
              {intl.formatMessage({ id: 'models.table.vram.allocated' })}
            </span>
          </Flex>
          <span className="metric">
            {vramValue}
            {vramUnit && <span className="metric-unit">{vramUnit}</span>}
          </span>
        </Flex>
        {isDistributed && (
          <span className="hint">
            {intl.formatMessage(
              { id: 'models.instance.workergpu' },
              { n: workerCount, m: gpuCount }
            )}
          </span>
        )}
      </Flex>
      <div className="divider"></div>
      <InfoRow
        label="models.form.backend"
        icon={<ThunderboltFilled />}
        value={backend}
      ></InfoRow>
      <div className="divider"></div>
      <Flex vertical gap={6}>
        {workerRows.map((row) => (
          <InfoRow key={row.label} {...row}></InfoRow>
        ))}
      </Flex>
    </div>
  );
};

const WorkerInfo = (props: {
  title: React.ReactNode;
  defaultOpen: boolean;
}) => {
  const [open, setOpen] = React.useState(props.defaultOpen);

  useEffect(() => {
    if (props.defaultOpen) {
      setTimeout(() => {
        setOpen(false);
      }, 1000);
    }
  }, [props.defaultOpen]);

  return (
    <span className="server-info-wrapper">
      <Tooltip
        open={open}
        onOpenChange={setOpen}
        title={props.title}
        styles={{
          container: {
            width: 'max-content'
          }
        }}
      >
        <span className="server-info">
          <InfoCircleOutlined />
        </span>
      </Tooltip>
    </span>
  );
};

const NameCell: React.FC<NameCellProps> = ({
  record,
  modelData,
  defaultOpenId,
  showWorkerInfo = true,
  styles
}) => {
  return (
    <span
      className="instance-name flex-center"
      style={{ gap: 4, width: '100%' }}
    >
      <AutoTooltip title={record.name} ghost maxWidth={'calc(100% - 16px)'}>
        <span className="m-r-5" style={styles?.label}>
          {record.name}
        </span>
      </AutoTooltip>
      {!!record.worker_id && showWorkerInfo && (
        <span>
          <WorkerInfo
            title={
              <WorkerInfoContent
                record={record}
                modelData={modelData}
              ></WorkerInfoContent>
            }
            defaultOpen={defaultOpenId === record.name}
          ></WorkerInfo>
        </span>
      )}
    </span>
  );
};

export default NameCell;
