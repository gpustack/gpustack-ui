import useCreatorColumn from '@/pages/gpu-service/hooks/use-creator-column';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import { ExportOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  CopyButton,
  DropdownButtons,
  StatusTag
} from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import { Button } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import _ from 'lodash';
import { Fragment, useMemo } from 'react';
import { parseJsonSafe } from '../../utils';
import UtilizationCell from '../components/utilization-cell';
import {
  GaugeColumnOrder,
  GaugeLabelIdMap,
  InstanceStatusLabelMap,
  rowActionList,
  status
} from '../config';
import {
  InstanceMetricsMap,
  InstanceTypeSnapshotSpec,
  ListItem
} from '../config/types';
import { renderInstanceType } from '../utils/render-instance-type';

// GPU / VRAM gauges belong to accelerated instance types only. The flag lives
// in the type snapshot persisted in the row's description — the same source the
// Instance Type column renders from.
const isAcceleratable = (record: ListItem) =>
  !!parseJsonSafe<{ spec?: InstanceTypeSnapshotSpec }>(
    record?.description || '{}',
    {}
  ).spec?.acceleratable;

const buildRowActions = (record: ListItem) => {
  return rowActionList
    .filter((action) => (action.show ? action.show(record) : true))
    .map(({ show, disabled, ...action }) => ({
      ...action,
      props: {
        ...action.props,
        disabled: disabled
          ? disabled(record)
          : (action.props?.disabled ?? false)
      }
    }));
};

type ConnectEntry =
  | {
      type: 'ssh';
      key: string;
      command: string;
      name: string;
      protocol: string;
    }
  | {
      type: 'http';
      key: string;
      port: number;
      url: string;
      name: string;
      protocol: string;
    };

const getConnectEntries = (record: ListItem): ConnectEntry[] => {
  const ip = record.status?.accessAddresses?.[0];
  const ports = record.status?.ports || [];
  const configPorts = record.spec?.ports || [];

  if (!ip) {
    return [];
  }

  return ports
    .filter((p) => p.nodePort)
    .map<ConnectEntry>((p) => {
      const isSsh =
        (p.protocol === 'TCP' && p.port === 22) ||
        _.includes(_.toLower(p.name), 'ssh');
      if (isSsh) {
        return {
          type: 'ssh',
          name: 'SSH',
          key: `ssh-${p.nodePort}`,
          protocol: _.toUpper(p.protocol),
          command: `ssh root@${ip} -p ${p.nodePort}`
        };
      }
      const configPort = configPorts.find((port) => port.port === p.port);
      // accessParams is generic query-param metadata from the spec (e.g. a
      // Jupyter token): serialize whatever keys it carries onto the URL.
      const accessParams = configPort?.accessParams;
      const query =
        _.isPlainObject(accessParams) && !_.isEmpty(accessParams)
          ? `?${new URLSearchParams(accessParams).toString()}`
          : '';
      return {
        type: 'http',
        name: configPort?.name || _.toUpper(p.protocol),
        key: `http-${p.nodePort}`,
        port: p.port,
        protocol: _.toUpper(p.protocol),
        url: `http://${ip}:${p.nodePort}${query}`
      };
    });
};

interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  clusterList: Global.BaseOption<number>[];
  sortOrder: string[];
  // name → capacity (e.g. "20Gi") for referenced persistent volumes, so the
  // Disk → Persistent row can show the size instead of just the PV name.
  pvCapacityByName?: Record<string, string>;
  // instance id → utilization gauges, polled page-wide by
  // use-query-instance-metrics. Rows with no entry render "--".
  metrics: InstanceMetricsMap;
}

const useInstancesColumns = ({
  handleSelect,
  clusterList,
  sortOrder,
  pvCapacityByName,
  metrics
}: ColumnsHookProps): ColumnsType<ListItem> => {
  const intl = useIntl();
  const access = useAccess();
  const pluginCols = usePluginListColumns('gpuInstances');
  const creatorCols = useCreatorColumn<ListItem>('gpuInstances');

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
        key: 'name',
        sorter: true,
        ellipsis: {
          showTitle: false
        },
        render: (text: string, record: ListItem) => (
          <AutoTooltip
            ghost
            title={<span>{record.displayName || text}</span>}
            maxWidth={300}
          >
            <span className="text-primary">{record.displayName || text}</span>
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.instance.connect' }),
        key: 'connect',
        ellipsis: {
          showTitle: false
        },
        render: (_text, record: ListItem) => {
          const entries = getConnectEntries(record);

          if (entries.length === 0) {
            return '-';
          }

          return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'max-content max-content',
                rowGap: 6,
                columnGap: 8,
                alignItems: 'center'
              }}
            >
              {entries.map((entry) => (
                <Fragment key={entry.key}>
                  <span
                    className="text-tertiary"
                    style={{
                      fontSize: 12,
                      maxWidth: 80,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {entry.type === 'ssh'
                      ? 'SSH'
                      : entry.name || entry.protocol}
                  </span>
                  {entry.type === 'ssh' ? (
                    <CopyButton
                      text={entry.command}
                      type="link"
                      size="small"
                      tips={intl.formatMessage({
                        id: 'gpuservice.instance.connect.copySshCommand'
                      })}
                      style={{
                        padding: '0 6px',
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: 4,
                        backgroundColor: 'var(--ant-color-fill-tertiary)',
                        fontSize: 12
                      }}
                    />
                  ) : (
                    <Button
                      type="link"
                      size="small"
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0 6px',
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        backgroundColor: 'var(--ant-color-fill-tertiary)'
                      }}
                    >
                      <span>{entry.port}</span>
                      <ExportOutlined style={{ fontSize: 10, marginLeft: 4 }} />
                    </Button>
                  )}
                </Fragment>
              ))}
            </div>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: ['status', 'phase'],
        key: 'status',
        sorter: false,
        ellipsis: {
          showTitle: false
        },
        render: (value: string, record: ListItem) => {
          return (
            <StatusTag
              statusValue={{
                status: status[value],
                text: InstanceStatusLabelMap[value] || value,
                message: record?.status?.phaseMessage || ''
              }}
            ></StatusTag>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.instance.section.type' }),
        dataIndex: ['spec', 'type'],
        key: 'type',
        sorter: false,
        ellipsis: {
          showTitle: false
        },
        width: 300,
        render: (_text: string, record: ListItem) =>
          renderInstanceType(record, { intl, pvCapacityByName })
      },
      // One column per gauge rather than one cell holding all five: the header
      // names the resource, so the cell is nothing but the ring — no label
      // repeated down every row — and every row's reading for a given resource
      // lands at the same x, so a busy instance is found by scanning a column
      // instead of reading five labels per row.
      //
      // Flat columns, not a grouped "Utilization" header: a group turns the
      // whole table's header into two rows (every other column rowSpan=2),
      // which is a lot of table to restructure for these five. The gauge's
      // percent is what says "utilization" here, and the Instance Type column
      // is where the requested resources are read.
      //
      // No `ellipsis`, unlike the text columns around them: it would apply to
      // the header too, and truncating a one-word header that names what the
      // column measures (with no title attribute to hover, given
      // showTitle: false) loses more than it saves. The cells need it even less
      // — a gauge is fixed-width and never overflows.
      ...GaugeColumnOrder.map((gaugeKey) => ({
        title: intl.formatMessage({ id: GaugeLabelIdMap[gaugeKey] }),
        key: `utilization-${gaugeKey}`,
        // A 50px gauge takes 82px once cell padding is counted; the rest is
        // header room, since "Storage" runs to 9 characters in some locales.
        width: 100,
        render: (_text: string, record: ListItem) => (
          <UtilizationCell
            gaugeKey={gaugeKey}
            values={metrics[record.id]}
            hasAccelerators={isAcceleratable(record)}
          />
        )
      })),
      ...pluginRendered,
      {
        title: intl.formatMessage({ id: 'clusters.title' }),
        dataIndex: 'clusterId',
        hidden: !access.canSeeAdmin,
        ellipsis: {
          showTitle: false
        },
        render: (id: number) => (
          <AutoTooltip ghost maxWidth={240}>
            {_.find(clusterList, { value: id })?.label || id || '-'}
          </AutoTooltip>
        )
      },
      ...creatorCols,
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        sorter: false,
        ellipsis: {
          showTitle: false
        },
        width: 180,
        render: (text: string) => (
          <AutoTooltip ghost>
            {text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        key: 'operation',
        dataIndex: 'operation',
        ellipsis: {
          showTitle: false
        },
        render: (_text, record) => {
          return (
            <DropdownButtons
              items={buildRowActions(record)}
              onSelect={(val) => handleSelect(val, record)}
            />
          );
        }
      }
    ];
  }, [
    handleSelect,
    sortOrder,
    clusterList,
    intl,
    pvCapacityByName,
    metrics,
    pluginCols,
    creatorCols
  ]);
};

export default useInstancesColumns;
