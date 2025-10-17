import AutoTooltip from '@/components/auto-tooltip';
import ProgressBar from '@/components/progress-bar';
import InfoColumn from '@/components/simple-table/info-column';
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
}): ColumnsType<GPUDeviceItem> => {
  const { clusterList, loadend, firstLoad } = props;
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        width: 240,
        render: (text: string, record: GPUDeviceItem) => (
          <AutoTooltip ghost maxWidth={240}>
            {text}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.index' }),
        dataIndex: 'index',
        render: (text: string, record: GPUDeviceItem) => <span>{text}</span>
      },
      {
        title: intl.formatMessage({ id: 'clusters.title' }),
        dataIndex: 'cluster_id',
        ellipsis: {
          showTitle: false
        },
        render: (text: number, record: GPUDeviceItem) => (
          <AutoTooltip ghost>
            {clusterList.find((item) => item.value === text)?.label}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.worker' }),
        dataIndex: 'worker_name',
        ellipsis: {
          showTitle: false
        },
        render: (text: string, record: GPUDeviceItem) => (
          <AutoTooltip ghost>{text}</AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.vender' }),
        dataIndex: 'vendor'
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
        dataIndex: 'gpuUtil',
        key: 'gpuUtil',
        render: (text: number, record: GPUDeviceItem) => {
          return (
            <>
              {record.core ? (
                <ProgressBar
                  percent={_.round(record.core?.utilization_rate, 2)}
                ></ProgressBar>
              ) : (
                '-'
              )}
            </>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'resources.table.vramutilization' }),
        dataIndex: 'VRAM',
        key: 'VRAM',
        render: (text: number, record: GPUDeviceItem, index: number) => {
          return (
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
          );
        }
      }
    ];
  }, [intl, clusterList, loadend, firstLoad]);
};

export default useGPUColumns;
