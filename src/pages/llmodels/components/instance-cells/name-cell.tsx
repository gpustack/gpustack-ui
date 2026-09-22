import { convertFileSize } from '@/utils';
import {
  AimOutlined,
  DatabaseFilled,
  HddFilled,
  InfoCircleOutlined,
  PieChartFilled,
  ThunderboltFilled
} from '@ant-design/icons';
import { AutoTooltip, IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import _ from 'lodash';
import React, { useEffect } from 'react';
import { CACHE_METRICS_WINDOW } from '../../config';
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
  // undefined = not read (no cache service, or metrics unavailable);
  // null = read but the engine reports no lookups in the window
  cacheHitRate?: number | null;
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
  // values the label's own message interpolates (e.g. the window a rate
  // was measured over)
  labelValues?: Record<string, string | number>;
  // a subordinate line under the value (e.g. how a total is spread)
  hint?: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({
  label,
  icon,
  value,
  labelValues,
  hint
}) => {
  const intl = useIntl();
  return (
    <Flex vertical gap={2}>
      <Flex align="flex-start" justify="space-between" gap={16}>
        <Flex align="center" gap={6} className="label">
          {icon}
          <span>{intl.formatMessage({ id: label }, labelValues)}</span>
        </Flex>
        <span className="value">{value}</span>
      </Flex>
      {hint && <span className="hint">{hint}</span>}
    </Flex>
  );
};

// A rate the engine reported; null means it looked nothing up in the
// window (an idle instance), which is not a zero-percent hit rate.
const formatHitRate = (value: number | null | undefined) =>
  value == null ? '-' : `${_.round(value * 100, 1)}%`;

const WorkerInfoContent: React.FC<NameCellProps> = ({
  record,
  modelData,
  cacheHitRate
}) => {
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

  // "152 GiB" split so the unit stays subordinate to the figure.
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

  // Three groups, each answering one question: what serves the instance, where
  // it runs, what it claims.
  const backendRows: InfoRowProps[] = [
    {
      label: 'models.form.backend',
      icon: <ThunderboltFilled />,
      value: backend
    }
  ];

  // Only the main worker — its label changes when the instance is distributed.
  // The per-worker breakdown belongs to the "across workers" tooltip on the
  // same row.
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
    }
  ];

  const gpuRows: InfoRowProps[] = [
    {
      label: 'models.table.gpuindex',
      icon: <IconFont type="icon-filled-gpu" />,
      value: gpuIndexes.length ? `[${_.join(gpuIndexes, ', ')}]` : '-'
    },
    {
      label: 'models.table.vram.allocated',
      icon: <PieChartFilled />,
      value: (
        <>
          {vramValue}
          {vramUnit && <span className="metric-unit">{vramUnit}</span>}
        </>
      ),
      // a cross-worker claim is instance-wide, so say what it covers
      hint: isDistributed
        ? intl.formatMessage(
            { id: 'models.instance.workergpu' },
            { n: workerCount, m: gpuCount }
          )
        : undefined
    },
    ...(vgpuAllocation
      ? [
          {
            label: 'models.table.vgpu',
            icon: <IconFont type="icon-sliced-filled" />,
            value: vgpuAllocation
          }
        ]
      : [])
  ];

  // What the shared cache does for this instance, where the instance is.
  // The rate is absent unless it was read: no cache service, or metrics
  // unavailable.
  const cacheRows: InfoRowProps[] = [
    ...(record.cache_config?.cache_service_name
      ? [
          {
            label: 'models.kvCache.service',
            icon: <DatabaseFilled />,
            value: record.cache_config.cache_service_name
          }
        ]
      : []),
    ...(cacheHitRate !== undefined
      ? [
          {
            label: 'models.kvCache.hitRate',
            icon: <AimOutlined />,
            value: formatHitRate(cacheHitRate),
            labelValues: {
              window: intl.formatMessage({
                id: CACHE_METRICS_WINDOW.labelKey
              })
            }
          }
        ]
      : [])
  ];

  const groups = [backendRows, workerRows, gpuRows, cacheRows].filter(
    (rows) => rows.length > 0
  );

  return (
    <div className={styles.card}>
      {groups.map((rows, index) => (
        <React.Fragment key={rows[0].label}>
          {index > 0 && <div className="divider"></div>}
          <Flex vertical gap={6}>
            {rows.map((row) => (
              <InfoRow key={row.label} {...row}></InfoRow>
            ))}
          </Flex>
        </React.Fragment>
      ))}
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
  cacheHitRate,
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
                cacheHitRate={cacheHitRate}
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
