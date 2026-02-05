import AutoTooltip from '@/components/auto-tooltip';
import ProgressBar from '@/components/progress-bar';
import InfoColumn from '@/components/simple-table/info-column';
import { tableSorter } from '@/config/settings';
import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
import { ColumnsType } from 'antd/lib/table';
import _ from 'lodash';
import { useMemo } from 'react';
import { GPUDeviceItem } from '../config/types';

const fieldList = [
  {
    label: 'resources.table.total',
    key: 'total',
    locale: true,
    render: (val: any) => {
      return convertFileSize(val, 0);
    }
  },
  {
    label: 'resources.table.used',
    key: 'used',
    locale: true,
    render: (val: any) => {
      return convertFileSize(val, 0);
    }
  },
  {
    label: 'resources.table.allocated',
    key: 'allocated',
    locale: true,
    render: (val: any) => {
      return convertFileSize(val, 0);
    }
  }
];

const useGPUColumns = (props: {
  loadend: boolean;
  firstLoad: boolean;
  clusterList: Global.BaseOption<number>[];
  sortOrder: string[];
}): ColumnsType<GPUDeviceItem> => {
  const { clusterList, loadend, firstLoad, sortOrder } = props;
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        width: 240,
        minWidth: 32,
        sorter: tableSorter(1),
        render: (text: string, record: GPUDeviceItem) => (
          <AutoTooltip ghost maxWidth={240}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.index' }),
        dataIndex: 'index',
        sorter: tableSorter(2),
        render: (text: string, record: GPUDeviceItem) => <span>{text}</span>
      },
      {
        title: intl.formatMessage({ id: 'clusters.title' }),
        dataIndex: 'cluster_id',
        sorter: tableSorter(3),
        render: (text: number, record: GPUDeviceItem) => (
          <AutoTooltip ghost>
            {clusterList.find((item) => item.value === text)?.label}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.worker' }),
        dataIndex: 'worker_name',
        sorter: tableSorter(4),
        render: (text: string, record: GPUDeviceItem) => (
          <AutoTooltip ghost>{text}</AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.vendor' }),
        dataIndex: 'vendor',
        sorter: tableSorter(5)
      },
      {
        title: `${intl.formatMessage({ id: 'resources.table.temperature' })} (°C)`,
        dataIndex: 'temperature',
        render: (text: number, record: GPUDeviceItem) => (
          <span>{text ? _.round(text, 1) : '-'}</span>
        )
      },
      {
        title: `${intl.formatMessage({ id: 'resources.table.utilization' })}`,
        dataIndex: 'core.utilization_rate',
        key: 'core.utilization_rate',
        sorter: tableSorter(6),
        render: (text: number, record: GPUDeviceItem) => {
          return (
            <span className="flex-center flex-full">
              {record.core ? (
                <ProgressBar
                  percent={_.round(record.core?.utilization_rate, 2)}
                ></ProgressBar>
              ) : (
                '-'
              )}
            </span>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'resources.table.vramutilization' }),
        dataIndex: 'memory.utilization_rate',
        key: 'memory.utilization_rate',
        sorter: tableSorter(7),
        render: (text: number, record: GPUDeviceItem, index: number) => {
          return (
            <span className="flex-center flex-full">
              <ProgressBar
                defaultOpen={index === 0 && loadend && firstLoad}
                percent={
                  record.memory?.used
                    ? _.round(record.memory?.utilization_rate, 0)
                    : _.round(
                        record.memory?.allocated / record.memory?.total,
                        0
                      ) * 100
                }
                label={
                  <InfoColumn
                    fieldList={fieldList}
                    data={record.memory}
                  ></InfoColumn>
                }
              ></ProgressBar>
            </span>
          );
        }
      }
    ];
  }, [intl, clusterList, loadend, firstLoad]);
};

export default useGPUColumns;
