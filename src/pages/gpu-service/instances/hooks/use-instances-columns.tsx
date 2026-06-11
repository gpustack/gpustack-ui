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
import InstanceTypeCell from '../components/instance-type-cell';
import {
  formatMemoryDisplay,
  InstanceStatusLabelMap,
  rowActionList,
  status
} from '../config';
import { InstanceTypeSpec, ListItem } from '../config/types';

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

const toGB = (v?: string | number) =>
  v ? `${v}`.replace('Gi', ' GB').replace('Mi', ' MB') : '-';

const buildResourcesData = (
  instanceType: {
    spec: InstanceTypeSpec;
  },
  options: {
    count: number;
  }
) => {
  const unitResourcesParsed = instanceType?.spec?.unitResourcesParsed;
  const acceleratable = instanceType?.spec?.acceleratable;
  const { count = 0 } = options;

  if (acceleratable) {
    return {
      accelerator: _.toString(count),
      cpu: unitResourcesParsed?.cpu?.cores
        ? count * unitResourcesParsed?.cpu?.cores
        : undefined,
      ram: unitResourcesParsed?.ram?.value
        ? count * unitResourcesParsed?.ram?.value
        : undefined
    };
  }
  return {};
};

const formatResources = (
  instanceTypeSpec: { spec: InstanceTypeSpec },
  record: ListItem
) => {
  const resources = buildResourcesData(instanceTypeSpec, {
    count: _.toNumber(record.spec?.resources?.accelerator) || 0
  });

  if (!record.spec?.resources?.accelerator) {
    return {
      cpu: record.spec?.resources?.cpu
        ? `${record.spec?.resources?.cpu} vCPU`
        : '-',
      ram: record.spec?.resources?.ram
        ? toGB(record.spec?.resources?.ram)
        : '-',
      localStorage: record.spec?.resources?.localStorage
        ? toGB(record.spec?.resources?.localStorage)
        : '-'
    };
  }

  // VRAM = per-card GPU memory (a single card's size; not aggregated across
  // cards — the model's marquee spec).
  const vram = formatMemoryDisplay((instanceTypeSpec.spec as any)?.memory);

  return {
    cpu: resources.cpu ? `${resources.cpu} vCPU` : '-',
    ram: resources.ram ? `${resources.ram} GB` : '-',
    vram,
    localStorage: record.spec?.resources?.localStorage
      ? toGB(record.spec?.resources?.localStorage)
      : undefined
  };
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
      return isSsh
        ? {
            type: 'ssh',
            name: 'SSH',
            key: `ssh-${p.nodePort}`,
            protocol: _.toUpper(p.protocol),
            command: `ssh root@${ip} -p ${p.nodePort}`
          }
        : {
            type: 'http',
            name:
              configPorts.find((port) => port.port === p.port)?.name ||
              _.toUpper(p.protocol),
            key: `http-${p.nodePort}`,
            port: p.port,
            protocol: _.toUpper(p.protocol),
            url: `http://${ip}:${p.nodePort}`
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
}

const useInstancesColumns = ({
  handleSelect,
  clusterList,
  sortOrder,
  pvCapacityByName
}: ColumnsHookProps): ColumnsType<ListItem> => {
  const intl = useIntl();
  const access = useAccess();
  const pluginCols = usePluginListColumns('gpuInstances');

  const renderInstanceType = (record: ListItem) => {
    const description =
      parseJsonSafe<any>(record?.description || '{}', {}).spec || {};
    const resources = formatResources({ spec: description }, record);
    const accelerator = record.spec?.resources?.accelerator;
    const title = description.acceleratable
      ? `${description.product} x ${accelerator}`
      : 'CPU';

    const volume = (record.spec as any)?.volume;
    // Spec popover grouped by category (GPU / CPU / Memory / Disk), mirroring
    // the Deployments instance info icon: dark tooltip, per-category icon,
    // instance name as the title. Rows with no value are dropped.
    type Section = {
      icon: string;
      name: string;
      rows: [string | null, string | undefined][];
    };
    const sections: Section[] = [];
    if (description.acceleratable) {
      sections.push({
        icon: 'icon-gpu',
        name: 'GPU',
        rows: [
          [
            intl.formatMessage({ id: 'gpuservice.table.count' }),
            accelerator ? `${accelerator}` : undefined
          ],
          [
            intl.formatMessage({ id: 'gpuservice.instance.section.type' }),
            description.product
          ],
          [
            intl.formatMessage({ id: 'gpuservice.instance.memory' }),
            resources.vram
          ]
        ]
      });
    }
    sections.push({
      icon: 'icon-cpu',
      name: 'CPU',
      rows: [[null, resources.cpu]]
    });
    sections.push({
      icon: 'icon-ram-02',
      name: intl.formatMessage({ id: 'gpuservice.instance.ram' }),
      rows: [[null, resources.ram]]
    });
    sections.push({
      icon: 'icon-hard-disk',
      name: intl.formatMessage({ id: 'gpuservice.instance.disk' }),
      rows: [
        [
          intl.formatMessage({ id: 'gpuservice.instance.disk.system' }),
          resources.localStorage
        ],
        [
          intl.formatMessage({ id: 'gpuservice.instance.disk.ephemeral' }),
          toGB(volume?.ephemeral?.capacity)
        ],
        [
          intl.formatMessage({ id: 'gpuservice.instance.disk.persistent' }),
          toGB(volume?.persistentTemplate?.spec?.capacity) ||
            toGB(pvCapacityByName?.[volume?.persistent?.name]) ||
            volume?.persistent?.name
        ]
      ]
    });

    return (
      <InstanceTypeCell title={title} name={record.name} sections={sections} />
    );
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
        render: (_text: string, record: ListItem) => renderInstanceType(record)
      },
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
    pluginCols
  ]);
};

export default useInstancesColumns;
