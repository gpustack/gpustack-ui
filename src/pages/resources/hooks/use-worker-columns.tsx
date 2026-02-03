import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import IconFont from '@/components/icon-font';
import LabelsCell from '@/components/label-cell';
import ProgressBar from '@/components/progress-bar';
import InfoColumn from '@/components/simple-table/info-column';
import StatusTag from '@/components/status-tag';
import { tableSorter } from '@/config/settings';
import { convertFileSize } from '@/utils';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  InfoCircleOutlined,
  SafetyOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import _ from 'lodash';
import { useMemo } from 'react';
import styled from 'styled-components';
import { status, WorkerStatusMap, WorkerStatusMapValue } from '../config';
import { Filesystem, GPUDeviceItem, ListItem } from '../config/types';

const IPWrapper = styled.span`
  display: flex;
  flex-direction: column;
  .item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 8px;
    .label {
      text-align: right;
      font-size: 13px;
      display: flex;
      align-items: center;
      color: var(--ant-color-text-tertiary);
    }
  }
`;

const ActionList = [
  { label: 'common.button.edit', key: 'edit', icon: <EditOutlined /> },
  {
    label: 'resources.metrics.details',
    key: 'metrics',
    icon: <IconFont type="icon-metrics" />
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
    return true;
  });
};

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
  <span className="flex-column flex-gap-2">
    {_.map(
      _.sortBy(devices || [], ['index']),
      (item: GPUDeviceItem, index: number) => (
        <span className="flex-center" key={index}>
          <span className="m-r-5" style={{ display: 'flex', width: 25 }}>
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

const VRAMCell = ({
  devices,
  intl,
  rIndex,
  loadend,
  firstLoad
}: {
  devices: GPUDeviceItem[];
  intl: any;
  rIndex: number;
  loadend: boolean;
  firstLoad: boolean;
}) => (
  <span className="flex-column flex-gap-2">
    {_.map(
      _.sortBy(devices || [], ['index']),
      (item: GPUDeviceItem, index: number) => (
        <span key={index} className="flex-center">
          <span className="m-r-5" style={{ display: 'flex', width: 25 }}>
            [{item.index}]
          </span>
          <ProgressBar
            defaultOpen={rIndex === 0 && index === 0 && loadend && firstLoad}
            percent={
              item.memory?.used
                ? _.round(item.memory?.utilization_rate, 0)
                : _.round(
                    (item.memory?.allocated / item.memory?.total) * 100,
                    0
                  )
            }
            label={<InfoColumn fieldList={fieldList} data={item.memory} />}
          />
          {item.memory.is_unified_memory && (
            <Tooltip
              title={intl.formatMessage({ id: 'resources.table.unified' })}
            >
              <InfoCircleOutlined
                className="m-l-5"
                style={{ color: 'var(--ant-blue-5)' }}
              />
            </Tooltip>
          )}
        </span>
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
  sourceType,
  handleSelect
}: {
  clusterData: {
    list: Global.BaseOption<number>[];
    data: Record<number, string>;
  };
  loadend: boolean;
  firstLoad: boolean;
  sortOrder: string[];
  sourceType: string;
  handleSelect: (action: string, record: ListItem) => void;
}): ColumnsType<ListItem> => {
  const intl = useIntl();

  const renderIP = (text: string, record: ListItem) => {
    if (record.advertise_address === record.ip) {
      return record.ip;
    }

    if (
      record.advertise_address !== record.ip &&
      record.advertise_address &&
      record.ip
    ) {
      return (
        <IPWrapper>
          <span className="item">
            <span>{record.ip}</span>
            <span className="label">{`(${intl.formatMessage({ id: 'clusters.table.ip.internal' })})`}</span>
            <span> {record.advertise_address}</span>
            <span className="label">{`(${intl.formatMessage({ id: 'clusters.table.ip.external' })})`}</span>
          </span>
        </IPWrapper>
      );
    }
    return record.ip || record.advertise_address || '';
  };

  return useMemo<ColumnsType<ListItem>>(
    () => [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        width: 100,
        sorter: tableSorter(1),
        render: (text: string) => (
          <AutoTooltip ghost maxWidth={200}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.labels' }),
        dataIndex: 'labels',
        width: 200,
        render: (_, record) => <LabelsCell labels={record.labels} />
      },
      {
        title: intl.formatMessage({ id: 'clusters.title' }),
        dataIndex: 'cluster_id',
        hidden: sourceType === 'cluster',
        render: (id: number) => (
          <AutoTooltip ghost maxWidth={240}>
            {_.get(clusterData.data, id, '')}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: 'state',
        sorter: tableSorter(2),
        render: (_, record) => (
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
        sorter: tableSorter(3),
        render: (text: string, record) => (
          <AutoTooltip ghost maxWidth={240}>
            {renderIP(text, record)}
          </AutoTooltip>
        )
      },
      {
        title: 'CPU',
        dataIndex: 'status.cpu.utilization_rate',
        sorter: tableSorter(4),
        render: (text: string, record) =>
          statusAvailable(record) ? (
            <ProgressBar
              percent={_.round(record?.status?.cpu?.utilization_rate, 0)}
            />
          ) : (
            <HolderStatus />
          )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.memory' }),
        dataIndex: 'status.memory.utilization_rate',
        sorter: tableSorter(5),
        render: (_, record) =>
          statusAvailable(record) ? (
            <ProgressBar
              percent={formateUtilization(
                record?.status?.memory?.used,
                record?.status?.memory?.total
              )}
              label={
                <InfoColumn fieldList={fieldList} data={record.status.memory} />
              }
            />
          ) : (
            <HolderStatus />
          )
      },
      {
        title: 'GPU',
        dataIndex: 'gpu',
        render: (_, record) =>
          statusAvailable(record) ? (
            <GPUCell devices={record?.status?.gpu_devices} />
          ) : (
            <HolderStatus />
          )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.vram' }),
        dataIndex: 'vram',
        render: (_, record, rIndex) =>
          statusAvailable(record) ? (
            <VRAMCell
              devices={record?.status?.gpu_devices}
              intl={intl}
              rIndex={rIndex}
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
        render: (_, record) =>
          statusAvailable(record) ? (
            <StorageCell files={record.status?.filesystem} />
          ) : (
            <HolderStatus />
          )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        key: 'operation',
        render: (_, record) => (
          <DropdownButtons
            items={setActions(record)}
            onSelect={(val) => handleSelect(val, record)}
          />
        )
      }
    ],
    [intl, sourceType, sortOrder, clusterData, loadend, firstLoad, handleSelect]
  );
};

export default useWorkerColumns;
