import { InfoCircleOutlined } from '@ant-design/icons';
import { AutoTooltip, DropdownButtons, StatusTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Table, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import {
  ServiceStateLabelMap,
  ServiceStatus,
  instanceActionItems
} from '../config';
import { CacheServiceInstanceItem } from '../config/types';
import { InstanceInfoContent } from './instance-rows';
import SubTitle from './sub-title';

interface ServiceInstancesProps {
  instances: CacheServiceInstanceItem[];
  workerNameMap: Record<number, string>;
  workerIpMap: Record<number, string>;
  // the service's provider version and per-instance RAM capacity, both
  // shown in the info tooltip
  version?: string;
  ramSize?: number;
  onRecreate: (instance: CacheServiceInstanceItem) => void;
  onViewLogs: (instance: CacheServiceInstanceItem) => void;
}

// per-worker instances of a managed cache service, with per-instance
// delete-and-recreate and log access
const ServiceInstances: React.FC<ServiceInstancesProps> = ({
  instances,
  workerNameMap,
  workerIpMap,
  version,
  ramSize,
  onRecreate,
  onViewLogs
}) => {
  const intl = useIntl();

  const handleSelect = (val: string, record: CacheServiceInstanceItem) => {
    if (val === 'delete') {
      onRecreate(record);
    } else if (val === 'viewlogs') {
      onViewLogs(record);
    }
  };

  const columns = [
    {
      title: intl.formatMessage({ id: 'common.table.name' }),
      dataIndex: 'name',
      render: (value: string, record: CacheServiceInstanceItem) => (
        <span className="flex-center" style={{ gap: 4 }}>
          <AutoTooltip ghost minWidth={20}>
            {value}
          </AutoTooltip>
          <Tooltip
            title={
              <InstanceInfoContent
                item={record}
                workerName={workerNameMap[record.worker_id]}
                workerIp={workerIpMap[record.worker_id]}
                version={version}
                ramSize={ramSize}
              />
            }
            styles={{
              container: {
                width: 'max-content',
                maxWidth: '400px'
              }
            }}
          >
            <InfoCircleOutlined />
          </Tooltip>
        </span>
      )
    },
    {
      title: intl.formatMessage({ id: 'common.table.status' }),
      dataIndex: 'state',
      render: (value: string, record: CacheServiceInstanceItem) => (
        <StatusTag
          statusValue={{
            status: ServiceStatus[value],
            text: ServiceStateLabelMap[value],
            message: record.state_message || undefined
          }}
        />
      )
    },
    {
      title: intl.formatMessage({ id: 'common.table.createTime' }),
      dataIndex: 'created_at',
      render: (value: string) =>
        value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: intl.formatMessage({ id: 'common.table.operation' }),
      dataIndex: 'operations',
      render: (value: string, record: CacheServiceInstanceItem) => (
        <DropdownButtons
          items={instanceActionItems(record)}
          onSelect={(val) => handleSelect(val, record)}
        ></DropdownButtons>
      )
    }
  ];

  return (
    <div>
      <SubTitle>
        {intl.formatMessage({ id: 'kvCache.detail.instances' })}
      </SubTitle>
      <Table
        rowKey="id"
        tableLayout="fixed"
        columns={columns}
        dataSource={instances}
        pagination={false}
      ></Table>
    </div>
  );
};

export default ServiceInstances;
