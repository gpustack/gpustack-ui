import GroupedInfoTooltipContent, {
  type GroupedInfoTooltipRow as InfoRowProps
} from '@/pages/_components/grouped-info-tooltip-content';
import { convertFileSize } from '@/utils';
import {
  AimOutlined,
  DatabaseFilled,
  HddFilled,
  InfoCircleOutlined,
  PieChartFilled,
  ThunderboltFilled
} from '@ant-design/icons';
import { AutoTooltip, IconFont, TextAttribute } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import { CACHE_METRICS_WINDOW, isPDModel } from '../../config';
import { useDeploymentsContext } from '../../config/deploments-context';
import {
  DistributedServerItem,
  ModelInstanceListItem
} from '../../config/types';
import { useGPUTypeDisplayName } from '../../hooks/use-gpu-type-display-name';
import '../../style/instance-item.less';
import { calcTotalVram } from '../../utils';
import { configurationChangeMessage } from '../../utils/instance-recreation';
import { roleLabel } from '../pd/role-status';
import {
  formatGPUTypeAllocation,
  getGPUTypeClusterId,
  getGPUTypeSelector
} from './vgpu-info';
import { workloadInfoEntries } from './workload-info';
import WorkloadInfoContent from './workload-info-content';
export interface NameCellProps {
  record: ModelInstanceListItem;
  modelData: any;
  // undefined = not read (no cache service, or metrics unavailable);
  // null = read but the engine reports no lookups in the window
  cacheHitRate?: number | null;
  defaultOpenId?: string;
  showWorkerInfo?: boolean;
  showRole?: boolean;
  styles?: {
    label?: React.CSSProperties;
  };
}

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

  const { workerList = [] } = useDeploymentsContext();
  const workloads = workloadInfoEntries(record, workerList);

  let workerIp = '-';
  if (record.worker_ip) {
    workerIp =
      workloads === null && record.port
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
  const cpuOnly = !gpuIndexes.length && !calcTotalVram(record);
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

  // An instance that claims no accelerator — a managed PD router is the case
  // that produced this — has nothing to say in either GPU row. Rendered anyway
  // they read as a fault: `GPU Index: []` looks like a list that failed to load
  // and `Allocated VRAM: 0` like an allocation that came back empty, when the
  // truth is that neither was ever asked for. One line that says so replaces
  // both.
  const gpuRows: InfoRowProps[] = cpuOnly
    ? [
        {
          label: 'models.form.roles.cpuonly',
          icon: <IconFont type="icon-filled-gpu" />,
          value: ''
        }
      ]
    : [
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

  return (
    <>
      <GroupedInfoTooltipContent
        groups={[backendRows, workerRows, gpuRows, cacheRows]}
      />
      {workloads !== null && (
        <WorkloadInfoContent entries={workloads} record={record} />
      )}
    </>
  );
};

const WorkerInfo = (props: {
  title: React.ReactNode;
  defaultOpen: boolean;
  hasWorkloads: boolean;
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
          root: props.hasWorkloads
            ? { width: 'max-content', maxWidth: 'calc(100vw - 32px)' }
            : undefined,
          container: {
            width: 'max-content',
            ...(props.hasWorkloads ? { maxWidth: 'calc(100vw - 32px)' } : {})
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
  showRole = true,
  styles
}) => {
  const intl = useIntl();
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
      {showRole && !!record.role && (
        <TextAttribute>{roleLabel(intl, record.role)}</TextAttribute>
      )}
      {/* `stale` is model-level: the group is one generation at a time, and the
          per-instance truth (`spec_digest` against the model's current digest)
          needs a digest the API does not expose yet. */}
      {!!modelData?.stale && (
        <Tooltip
          title={intl.formatMessage({
            id: configurationChangeMessage(isPDModel(modelData), true)
          })}
        >
          <TextAttribute variant="outlined">
            {intl.formatMessage({ id: 'models.stale.tag' })}
          </TextAttribute>
        </Tooltip>
      )}
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
            hasWorkloads={record.distributed_servers?.workloads != null}
            defaultOpen={defaultOpenId === record.name}
          ></WorkerInfo>
        </span>
      )}
    </span>
  );
};

export default NameCell;
