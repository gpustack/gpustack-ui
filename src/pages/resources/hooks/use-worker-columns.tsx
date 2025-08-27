import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import IconFont from '@/components/icon-font';
import ProgressBar from '@/components/progress-bar';
import InfoColumn from '@/components/simple-table/info-column';
import StatusTag from '@/components/status-tag';
import { convertFileSize } from '@/utils';
import {
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import _ from 'lodash';
import { useMemo } from 'react';
import styled from 'styled-components';
import { WorkerStatusMapValue, status } from '../config';
import { Filesystem, GPUDeviceItem, ListItem } from '../config/types';

const LabelsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const ActionList = [
  { label: 'common.button.edit', key: 'edit', icon: <EditOutlined /> },
  {
    label: 'common.button.logs',
    locale: false,
    key: 'logs',
    icon: <IconFont type="icon-logs" />
  },
  { label: 'Terminal', locale: false, key: 'terminal', icon: <CodeOutlined /> },
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

const formateUtilization = (val1: number, val2: number): number =>
  val1 && val2 ? _.round((val1 / val2) * 100, 0) : 0;

const calcStorage = (files: Filesystem[]) => {
  const mountRoot = _.find(
    files,
    (item: Filesystem) => item.mount_point === '/'
  );
  return mountRoot ? formateUtilization(mountRoot.used, mountRoot.total) : 0;
};

const LabelsCell = ({ labels }: { labels: Record<string, any> }) => (
  <LabelsWrapper>
    {_.map(labels, (value: string, key: string) => (
      <AutoTooltip
        key={key}
        className="m-r-0"
        maxWidth={155}
        style={{ paddingInline: 8, borderRadius: 12 }}
      >
        <span>{key}</span>
        <span>:{value}</span>
      </AutoTooltip>
    ))}
  </LabelsWrapper>
);

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
  dataSource,
  extraStatus
}: {
  devices: GPUDeviceItem[];
  intl: any;
  rIndex: number;
  dataSource: any;
  extraStatus: any;
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
            defaultOpen={
              rIndex === 0 &&
              index === 0 &&
              dataSource.loadend &&
              extraStatus.firstLoad
            }
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

const useWorkerColumns = ({
  clusterData,
  dataSource,
  extraStatus,
  handleSelect
}: {
  clusterData: {
    list: Global.BaseOption<number>[];
    data: Record<number, string>;
  };
  dataSource: any;
  extraStatus: any;
  handleSelect: (action: string, record: ListItem) => void;
}): ColumnsType<ListItem> => {
  const intl = useIntl();

  return useMemo<ColumnsType<ListItem>>(
    () => [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        width: 100,
        render: (text: string) => (
          <AutoTooltip ghost maxWidth={240}>
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
        render: (id: number) => (
          <AutoTooltip ghost maxWidth={240}>
            {_.get(clusterData.data, id, '')}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: 'state',
        render: (_, record) => (
          <StatusTag
            maxTooltipWidth={400}
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
        render: (text: string) => (
          <AutoTooltip ghost maxWidth={240}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: 'CPU',
        dataIndex: 'cpu',
        render: (text: string, record) => (
          <ProgressBar
            percent={_.round(record?.status?.cpu?.utilization_rate, 0)}
          />
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.memory' }),
        dataIndex: 'memory',
        render: (_, record) => (
          <ProgressBar
            percent={formateUtilization(
              record?.status?.memory?.used,
              record?.status?.memory?.total
            )}
            label={
              <InfoColumn fieldList={fieldList} data={record.status.memory} />
            }
          />
        )
      },
      {
        title: 'GPU',
        dataIndex: 'gpu',
        render: (_, record) => <GPUCell devices={record?.status?.gpu_devices} />
      },
      {
        title: intl.formatMessage({ id: 'resources.table.vram' }),
        dataIndex: 'vram',
        render: (_, record, rIndex) => (
          <VRAMCell
            devices={record?.status?.gpu_devices}
            intl={intl}
            rIndex={rIndex}
            dataSource={dataSource}
            extraStatus={extraStatus}
          />
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.disk' }),
        dataIndex: 'storage',
        render: (_, record) => <StorageCell files={record.status?.filesystem} />
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        key: 'operation',
        render: (_, record) => (
          <DropdownButtons
            items={ActionList}
            onSelect={(val) => handleSelect(val, record)}
          />
        )
      }
    ],
    [intl, clusterData, dataSource, extraStatus, handleSelect]
  );
};

export default useWorkerColumns;
