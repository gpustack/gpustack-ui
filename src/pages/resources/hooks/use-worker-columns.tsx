import { systemConfigAtom } from '@/atoms/system';
import { GPUStackVersionAtom } from '@/atoms/user';
import { tableSorter } from '@/config/settings';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import { convertFileSize } from '@/utils';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  InfoCircleOutlined,
  SafetyOutlined,
  ToolOutlined
} from '@ant-design/icons';
import {
  AutoTooltip,
  DropdownButtons,
  GrafanaIcon,
  IconFont,
  InfoColumn,
  LabelCell,
  ProgressBar,
  StatusTag,
  type TableColumnProps
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import { useAtom, useAtomValue } from 'jotai';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import semverCoerce from 'semver/functions/coerce';
import semverGt from 'semver/functions/gt';
import { status, WorkerStatusMap, WorkerStatusMapValue } from '../config';
import { Filesystem, GPUDeviceItem, ListItem } from '../config/types';
import workerCss from '../styles/worker.less';
const ActionList = [
  { label: 'common.button.edit', key: 'edit', icon: <EditOutlined /> },
  {
    label: 'resources.metrics.details',
    key: 'metrics',
    icon: (
      <span className="flex-center">
        <GrafanaIcon style={{ width: 14, height: 14 }}></GrafanaIcon>
      </span>
    )
  },
  // {
  //   label: 'common.button.detail',
  //   key: 'details',
  //   icon: <FileTextOutlined></FileTextOutlined>
  // },
  {
    label: 'resources.worker.download.privatekey',
    key: 'download_ssh_key',
    icon: <DownloadOutlined />
  },
  {
    label: 'resources.worker.maintenance.enable',
    key: 'star_maintenance',
    icon: <ToolOutlined />
  },
  {
    label: 'resources.worker.maintenance.disable',
    key: 'stop_maintenance',
    icon: <SafetyOutlined />
  },
  // {
  //   label: 'common.button.logs',
  //   locale: false,
  //   key: 'logs',
  //   icon: <IconFont type="icon-logs" />
  // },
  // { label: 'common.button.terminal', key: 'terminal', icon: <CodeOutlined /> },
  {
    label: 'common.button.delete',
    key: 'delete',
    props: { danger: true },
    icon: <DeleteOutlined />
  }
];

const fieldList = [
  {
    label: 'resources.table.total',
    key: 'total',
    locale: true,
    render: (val: any) => convertFileSize(val, 0)
  },
  {
    label: 'resources.table.used',
    key: 'used',
    locale: true,
    render: (val: any) => convertFileSize(val, 0)
  },
  {
    label: 'resources.table.allocated',
    key: 'allocated',
    locale: true,
    render: (val: any) => convertFileSize(val, 0)
  }
];

const showUpgrade = (
  workerVersion: string,
  currentVersion: string
): boolean => {
  const w_ver = semverCoerce(workerVersion);
  const c_ver = semverCoerce(currentVersion);

  return !!w_ver && !!c_ver && semverGt(c_ver, w_ver);
};

const formateUtilization = (val1: number, val2: number): number =>
  val1 && val2 ? _.round((val1 / val2) * 100, 0) : 0;

const calcStorage = (files: Filesystem[]) => {
  const mountRoot = _.find(
    files,
    (item: Filesystem) => item.mount_point === '/'
  );
  return mountRoot ? formateUtilization(mountRoot.used, mountRoot.total) : 0;
};

const GPUCell = ({ devices }: { devices: GPUDeviceItem[] }) => (
  <span className="flex-column gap-5" style={{ width: '100%' }}>
    {_.map(
      _.sortBy(devices || [], ['index']),
      (item: GPUDeviceItem, index: number) => (
        <span className="flex-center" key={index}>
          <span
            className="m-r-5"
            style={{ display: 'flex', width: 25, lineHeight: 1 }}
          >
            [{item.index}]
          </span>
          {item.core ? (
            <ProgressBar percent={_.round(item.core?.utilization_rate, 0)} />
          ) : (
            '-'
          )}
        </span>
      )
    )}
  </span>
);

// index + ProgressBar
const VRAMItem = ({
  item,
  autoOpen
}: {
  item: GPUDeviceItem;
  autoOpen: boolean;
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(autoOpen);
  }, [autoOpen]);

  const percent = item.memory?.used
    ? _.round(item.memory?.utilization_rate, 0)
    : _.round((item.memory?.allocated / item.memory?.total) * 100, 0);

  return (
    <Tooltip
      title={<InfoColumn fieldList={fieldList} data={item.memory} />}
      open={open}
      onOpenChange={setOpen}
    >
      <span className="flex-center" style={{ cursor: 'pointer' }}>
        <span
          className="m-r-5"
          style={{ display: 'flex', width: 25, lineHeight: 1.2 }}
        >
          <span
            style={{
              paddingBottom: 2,
              borderBottom: '1px dashed var(--ant-blue-6)'
            }}
          >
            [{item.index}]
          </span>
        </span>
        <ProgressBar percent={percent} />
      </span>
    </Tooltip>
  );
};

// `rIndex` is the row's position in the current page. SealTable's `render`
// signature is `(text, record)` — no row index argument — but the row context
// merges `rowIndex` into the record it hands the cell, so the caller reads it
// off `record.rowIndex`.
const VRAMCell = ({
  devices,
  rIndex,
  loadend,
  firstLoad
}: {
  devices: GPUDeviceItem[];
  rIndex: number;
  loadend: boolean;
  firstLoad: boolean;
}) => (
  <span className="flex-column flex-gap-2" style={{ width: '100%' }}>
    {_.map(
      _.sortBy(devices || [], ['index']),
      (item: GPUDeviceItem, index: number) => (
        <VRAMItem
          key={index}
          item={item}
          autoOpen={rIndex === 0 && index === 0 && loadend && firstLoad}
        />
      )
    )}
  </span>
);

const StorageCell = ({ files }: { files: Filesystem[] }) => {
  const mountRoot = _.find(
    files,
    (item: Filesystem) => item.mount_point === '/'
  );
  return (
    <ProgressBar
      percent={calcStorage(files)}
      label={
        mountRoot ? (
          <InfoColumn
            fieldList={fieldList.filter((f) => f.key !== 'allocated')}
            data={mountRoot}
          />
        ) : (
          0
        )
      }
    />
  );
};

const statusAvailable = (record: ListItem) => {
  return (
    WorkerStatusMap.initializing !== record.state &&
    WorkerStatusMap.provisioning !== record.state &&
    record.status
  );
};

const HolderStatus = () => {
  return <span>N/A</span>;
};

const useWorkerColumns = ({
  clusterData,
  loadend,
  firstLoad,
  sortOrder,
  source,
  handleSelect
}: {
  clusterData: {
    list: Global.BaseOption<number>[];
    data: Record<number, string>;
  };
  source?: string;
  loadend: boolean;
  firstLoad: boolean;
  sortOrder: string[];
  handleSelect: (action: string, record: ListItem) => void;
}): TableColumnProps[] => {
  const intl = useIntl();
  const systemConfig = useAtomValue(systemConfigAtom);
  const [version] = useAtom(GPUStackVersionAtom);
  const pluginCols = usePluginListColumns('workers');

  const renderIP = (text: string, record: ListItem) => {
    if (record.advertise_address === record.ip) {
      return <span className="text-primary">{record.ip}</span>;
    }

    if (
      record.advertise_address !== record.ip &&
      record.advertise_address &&
      record.ip
    ) {
      return (
        <span className={workerCss.ipWrapper}>
          <span className={workerCss.item}>
            <span className="text-primary">{record.ip}</span>
            <span
              className={workerCss.label}
            >{`(${intl.formatMessage({ id: 'clusters.table.ip.internal' })})`}</span>
            <span className="text-primary">{record.advertise_address}</span>
            <span
              className={workerCss.label}
            >{`(${intl.formatMessage({ id: 'clusters.table.ip.external' })})`}</span>
          </span>
        </span>
      );
    }
    return (
      <span className="text-primary">
        {record.ip || record.advertise_address || ''}
      </span>
    );
  };

  const setActions = (row: ListItem) => {
    return ActionList.filter((action) => {
      if (action.key === 'download_ssh_key') {
        return !!row.ssh_key_id;
      }
      if (action.key === 'star_maintenance') {
        return !row.maintenance?.enabled;
      }
      if (action.key === 'stop_maintenance') {
        return row.maintenance?.enabled;
      }

      if (action.key === 'metrics') {
        return systemConfig?.showMonitoring;
      }
      return true;
    });
  };

  const renderVersionInfo = (record: ListItem) => {
    const shouldUpgrade = showUpgrade(record.worker_version, version.version);

    const defaultVersionInfo = (
      <span className="flex-center gap-4">
        <span>
          {intl.formatMessage(
            { id: 'resources.worker.version' },
            { version: record.worker_version }
          )}
        </span>
      </span>
    );

    const upgradeVersionInfo = (
      <span className="flex-center gap-8">
        <span>
          {intl.formatMessage(
            { id: 'resources.worker.version' },
            { version: record.worker_version }
          )}
        </span>
        <span>
          {intl.formatMessage(
            { id: 'resources.server.version' },
            { version: version.version }
          )}
        </span>
      </span>
    );

    return (
      <Tooltip
        title={
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 13
            }}
          >
            {shouldUpgrade && (
              <span
                style={{
                  color: 'var(--ant-color-warning)'
                }}
              >
                {intl.formatMessage({
                  id: 'resoureces.worker.upgrade.tips'
                })}
              </span>
            )}
            {shouldUpgrade ? upgradeVersionInfo : defaultVersionInfo}
            <span className="flex-center gap-4">
              <span>
                {intl.formatMessage(
                  {
                    id: 'resources.driver.version'
                  },
                  {
                    version: _.get(
                      record,
                      'status.gpu_devices[0].driver_version'
                    )
                  }
                )}
              </span>
            </span>
          </div>
        }
      >
        <span>
          {shouldUpgrade ? (
            <IconFont
              type="icon-upgrade"
              style={{ color: 'var(--ant-color-warning)' }}
            ></IconFont>
          ) : (
            <InfoCircleOutlined style={{ color: 'var(--ant-blue-5)' }} />
          )}
        </span>
      </Tooltip>
    );
  };

  return useMemo<TableColumnProps[]>(() => {
    // No column sets a `span`: SealTable gives every column `1fr`, so they
    // divide the width evenly and the layout stays stable as plugins add or
    // drop a column. What each column does carry is a `minWidth` floor — this
    // table has ~11 columns and scrolls horizontally (`scroll={{ x: true }}`
    // widens the row out to the sum of those floors), so the floors decide
    // when scrolling starts and the even split only shares whatever width is
    // left over beyond them.
    const pluginRendered = pluginCols.map((c) => ({
      title: intl.formatMessage({ id: c.titleId }),
      dataIndex: c.key,
      key: c.key,
      // Honour a span only when the plugin explicitly asks for one.
      minWidth: 120,
      render: (_text: any, record: ListItem) => c.render(record)
    }));

    const columns: TableColumnProps[] = [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        minWidth: 150,
        sorter: tableSorter(1),
        render: (text: string, record: ListItem) => (
          <div className={workerCss.name}>
            <AutoTooltip ghost maxWidth={200} title={text}>
              <span className="name-text">{text}</span>
            </AutoTooltip>
            {renderVersionInfo(record)}
          </div>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.labels' }),
        dataIndex: 'labels',
        minWidth: 180,
        render: (_text: any, record: ListItem) => (
          <LabelCell labels={record.labels} />
        )
      },
      ...pluginRendered,
      {
        title: intl.formatMessage({ id: 'clusters.title' }),
        dataIndex: 'cluster_id',
        minWidth: 120,
        render: (id: number) => (
          <AutoTooltip ghost maxWidth={240}>
            {_.get(clusterData.data, id, '')}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: 'state',
        minWidth: 130,
        sorter: tableSorter(2),
        render: (_text: any, record: ListItem) => (
          <StatusTag
            maxTooltipWidth={400}
            suffix={record.provision_progress}
            statusValue={{
              status: status[record.state] as any,
              text: WorkerStatusMapValue[record.state],
              message: record.state_message
            }}
          />
        )
      },
      {
        title: 'IP',
        dataIndex: 'ip',
        minWidth: 160,
        sorter: tableSorter(3),
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost maxWidth={240}>
            {renderIP(text, record)}
          </AutoTooltip>
        )
      },
      {
        // Kept as the backend's sort field: SealTable reports the sorted
        // column by `dataIndex`, which becomes the `sort_by` param.
        title: 'CPU',
        dataIndex: 'status.cpu.utilization_rate',
        minWidth: 110,
        sorter: tableSorter(4),
        render: (_text: any, record: ListItem) => (
          <span className="flex-center flex-full">
            {statusAvailable(record) ? (
              <ProgressBar
                percent={_.round(record?.status?.cpu?.utilization_rate, 0)}
              />
            ) : (
              <HolderStatus />
            )}
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.memory' }),
        dataIndex: 'status.memory.utilization_rate',
        minWidth: 110,
        sorter: tableSorter(5),
        render: (_text: any, record: ListItem) => (
          <span className="flex-center flex-full">
            {statusAvailable(record) ? (
              <ProgressBar
                percent={formateUtilization(
                  record?.status?.memory?.used,
                  record?.status?.memory?.total
                )}
                label={
                  <InfoColumn
                    fieldList={fieldList}
                    data={record.status.memory}
                  />
                }
              />
            ) : (
              <HolderStatus />
            )}
          </span>
        )
      },
      {
        title: 'GPU',
        dataIndex: 'gpu',
        minWidth: 100,
        render: (_text: any, record: ListItem) =>
          statusAvailable(record) ? (
            <GPUCell devices={record?.status?.gpu_devices} />
          ) : (
            <HolderStatus />
          )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.vram' }),
        dataIndex: 'vram',
        minWidth: 100,
        render: (_text: any, record: ListItem & { rowIndex?: number }) =>
          statusAvailable(record) ? (
            <VRAMCell
              devices={record?.status?.gpu_devices}
              rIndex={record.rowIndex ?? 0}
              loadend={loadend}
              firstLoad={firstLoad}
            />
          ) : (
            <HolderStatus />
          )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.disk' }),
        dataIndex: 'storage',
        minWidth: 100,
        render: (_text: any, record: ListItem) => (
          <span className="flex-center flex-full">
            {statusAvailable(record) ? (
              <StorageCell files={record.status?.filesystem} />
            ) : (
              <HolderStatus />
            )}
          </span>
        )
      }
    ];

    // SealTable has no `hidden` column flag (antd's `Table` does), so the
    // cluster-detail view drops the operation column from the array.
    if (source === 'clusterDetail') {
      return columns;
    }

    return [
      ...columns,
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        // Every column needs a unique `dataIndex`: SealTable keys each cell
        // by it, and duplicate keys make React misplace cell DOM on
        // reconciliation. The value itself is unused here.
        dataIndex: 'operation',
        key: 'operation',
        width: 110,
        render: (_text: any, record: ListItem) => (
          <DropdownButtons
            items={setActions(record)}
            onSelect={(val) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [
    intl,
    sortOrder,
    clusterData,
    loadend,
    source,
    firstLoad,
    handleSelect,
    pluginCols,
    // read by `setActions` (metrics entry) and `renderVersionInfo`; `pluginCols`
    // now has a pinned identity, so the memo really holds and these have to be
    // listed to keep the action list and version tooltip reactive
    systemConfig?.showMonitoring,
    version.version
  ]);
};

export default useWorkerColumns;
