import useCreatorColumn from '@/pages/gpu-service/hooks/use-creator-column';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import { ExportOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  CopyButton,
  DropdownButtons,
  StatusTag,
  type TableColumnProps
} from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import { Button } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { Fragment, useMemo } from 'react';
import { parseJsonSafe } from '../../utils';
import UtilizationCell from '../components/utilization-cell';
import {
  GaugeColumnOrder,
  GaugeLabelIdMap,
  InstanceStatusLabelMap,
  MetricsPollablePhases,
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

// Whether a sample can exist for this row at all — the poller's own rule, so a
// row it skips (stopped, stopping, still initializing) renders a bare "--"
// rather than an empty ring waiting for a figure that is never coming.
const isMeasurable = (record: ListItem) =>
  _.includes(MetricsPollablePhases, record?.status?.phase || '');

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
}: ColumnsHookProps): TableColumnProps[] => {
  const intl = useIntl();
  const access = useAccess();
  const pluginCols = usePluginListColumns('gpuInstances');
  const creatorCols = useCreatorColumn<ListItem>('gpuInstances');

  // No column sets a `span`, so SealTable gives every one `1fr` and they divide
  // whatever width is left once the floors below are satisfied. What each
  // column carries instead is a `minWidth` floor — the table scrolls
  // horizontally (`scroll={{ x: true }}` widens the row to the sum of the
  // floors), so the floors are what decide when scrolling starts. A column
  // whose content is a fixed size takes `width` instead and stays pinned.
  //
  // Every column also needs a unique `dataIndex`: SealTable keys each cell by
  // it and hands `render` the row's value at that key. It is a flat property
  // lookup, not a path — a dotted `dataIndex` resolves to `undefined`, so those
  // columns read what they need off `record` and the value only serves as the
  // sort field the backend receives.
  return useMemo<TableColumnProps[]>(() => {
    const pluginRendered = pluginCols.map((c) => ({
      title: intl.formatMessage({ id: c.titleId }),
      dataIndex: c.key,
      key: c.key,
      minWidth: 120,
      render: (_text: any, record: ListItem) => c.render(record)
    }));
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        minWidth: 180,
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
        dataIndex: 'connect',
        key: 'connect',
        minWidth: 120,
        render: (_text: any, record: ListItem) => {
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
        dataIndex: 'status.phase',
        key: 'status',
        minWidth: 140,
        render: (_text: any, record: ListItem) => {
          const value = record?.status?.phase || '';
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
        dataIndex: 'spec.type',
        key: 'type',
        // The widest cell in the table — a resource summary plus its tags — so
        // it gets a floor rather than a fixed width and keeps its share of any
        // leftover room.
        maxWidth: 300,
        minWidth: 150,
        render: (_text: any, record: ListItem) =>
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
      ...GaugeColumnOrder.map((gaugeKey) => ({
        title: intl.formatMessage({ id: GaugeLabelIdMap[gaugeKey] }),
        dataIndex: `utilization-${gaugeKey}`,
        key: `utilization-${gaugeKey}`,
        // `width`, not `minWidth`: the content is a fixed GAUGE_SIZE gauge, so
        // the column has nothing to gain from extra room and stays pinned. The
        // cell's own inline padding eats 32 of this, and a header that outgrows
        // what is left truncates through AutoTooltip.
        width: 80,
        render: (_text: any, record: ListItem) => (
          <UtilizationCell
            gaugeKey={gaugeKey}
            values={metrics[record.id]}
            hasAccelerators={isAcceleratable(record)}
            measurable={isMeasurable(record)}
          />
        )
      })),
      ...pluginRendered,
      // SealTable has no `hidden` column flag (antd's `Table` does), so a column
      // the viewer may not see drops out of the array instead.
      ...(access.canSeeAdmin
        ? [
            {
              title: intl.formatMessage({ id: 'clusters.title' }),
              dataIndex: 'clusterId',
              key: 'clusterId',
              minWidth: 140,
              render: (id: number) => (
                <AutoTooltip ghost maxWidth={240}>
                  {_.find(clusterList, { value: id })?.label || id || '-'}
                </AutoTooltip>
              )
            }
          ]
        : []),
      // The shared creator column is written for antd `Table` and carries no
      // `dataIndex`; give it one here rather than pushing SealTable's
      // requirement onto the three sibling pages that still use antd.
      ...creatorCols.map((c) => ({
        ...c,
        dataIndex: 'creator',
        minWidth: 140
      })),
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
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
        width: 110,
        render: (_text: any, record: ListItem) => {
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
