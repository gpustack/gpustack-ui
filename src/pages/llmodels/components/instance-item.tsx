import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import RowChildren from '@/components/seal-table/components/row-children';
import SimpleTabel from '@/components/simple-table';
import StatusTag from '@/components/status-tag';
import {
  GPUDeviceItem,
  ListItem as WorkerListItem
} from '@/pages/resources/config/types';
import {
  DeleteOutlined,
  FieldTimeOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Col, Divider, Row, Space, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import React, { useCallback } from 'react';
import { InstanceStatusMap, InstanceStatusMapValue, status } from '../config';
import { ModelInstanceListItem } from '../config/types';

interface InstanceItemProps {
  list: ModelInstanceListItem[];
  gpuDeviceList: GPUDeviceItem[];
  workerList: WorkerListItem[];
  modelData?: any;
  handleChildSelect: (
    val: string,
    item: ModelInstanceListItem,
    list: ModelInstanceListItem[]
  ) => void;
}

const InstanceItem: React.FC<InstanceItemProps> = ({
  list,
  workerList,
  modelData,
  handleChildSelect
}) => {
  const intl = useIntl();

  const distributeCols = [
    {
      title: 'Worker',
      key: 'worker_name'
    },
    {
      title: 'IP',
      key: 'worker_ip',
      render: ({ row }: { row: ModelInstanceListItem }) => {
        return row.port ? `${row.worker_ip}:${row.port}` : row.worker_ip;
      }
    },
    {
      title: intl.formatMessage({ id: 'models.table.gpuindex' }),
      key: 'gpu_index'
    }
  ];

  const childActionList = [
    {
      label: 'common.button.viewlog',
      key: 'viewlog',
      status: [
        InstanceStatusMap.Running,
        InstanceStatusMap.Error,
        InstanceStatusMap.Downloading
      ],
      icon: <FieldTimeOutlined />
    },
    {
      label: 'common.button.delete',
      key: 'delete',
      props: {
        danger: true
      },
      icon: <DeleteOutlined />
    }
  ];

  const setChildActionList = useCallback((item: ModelInstanceListItem) => {
    return _.filter(childActionList, (action: any) => {
      if (action.key === 'viewlog') {
        return action.status.includes(item.state);
      }
      return true;
    });
  }, []);

  const renderWorkerInfo = (item: ModelInstanceListItem) => {
    let workerIp = '-';
    if (item.worker_ip) {
      workerIp = item.worker_ip;
    }
    return (
      <div>
        <div>{item.worker_name}</div>
        <div>{workerIp}</div>
        <div>
          {intl.formatMessage({ id: 'models.table.gpuindex' })}: [
          {_.join(item.gpu_indexes?.sort?.(), ',')}]
        </div>
        <div>
          {intl.formatMessage({ id: 'models.form.backend' })}:{' '}
          {modelData?.backend || ''}
        </div>
      </div>
    );
  };

  const renderDistributionInfo = (row: ModelInstanceListItem) => {
    const rpcServerList = row.distributed_servers?.rpc_servers || [];
    const list = _.map(rpcServerList, (item: any) => {
      const data = _.find(workerList, { id: item.worker_id });
      return {
        worker_name: data?.name,
        worker_ip: data?.ip,
        port: data?.port,
        gpu_index: item.gpu_index
      };
    });

    const mainWorker = [
      {
        worker_name: `${row.worker_name}`,
        worker_ip: `${row.worker_ip}`,
        port: row.port,
        gpu_index: `${row.gpu_indexes?.sort?.()} (main)`
      }
    ];

    return (
      <div>
        <h3 style={{ margin: 0 }}>
          {intl.formatMessage({ id: 'models.table.backend' })}
        </h3>
        <SimpleTabel
          columns={distributeCols}
          dataSource={[...mainWorker, ...list]}
        ></SimpleTabel>
      </div>
    );
  };

  return (
    <Space size={16} direction="vertical" style={{ width: '100%' }}>
      {_.map(list, (item: ModelInstanceListItem, index: number) => {
        return (
          <div
            className="_2Q2Yw"
            key={`${item.id}`}
            style={{ borderRadius: 'var(--ant-table-header-border-radius)' }}
          >
            <RowChildren key={`${item.id}_row`}>
              <Row style={{ width: '100%' }} align="middle">
                <Col
                  span={5}
                  style={{
                    paddingInline: 'var(--ant-table-cell-padding-inline)'
                  }}
                >
                  <span className="flex-center">
                    <AutoTooltip title={item.name} ghost>
                      <span className="m-r-5">{item.name}</span>
                    </AutoTooltip>
                    <Tooltip title={renderWorkerInfo(item)}>
                      <InfoCircleOutlined />
                    </Tooltip>
                  </span>
                </Col>
                <Col span={6}>
                  <span
                    style={{ paddingLeft: '58px' }}
                    className="flex align-center"
                  >
                    {item.computed_resource_claim?.total_layers !==
                      item.computed_resource_claim?.offload_layers && (
                      <Tooltip
                        title={
                          <span className="flex flex-center">
                            <span>
                              CPU:{' '}
                              {_.subtract(
                                item.computed_resource_claim?.total_layers,
                                item.computed_resource_claim?.offload_layers
                              ) || 0}{' '}
                              {intl.formatMessage({
                                id: 'models.table.layers'
                              })}
                            </span>
                            <Divider
                              type="vertical"
                              style={{
                                borderColor: '#fff',
                                opacity: 0.5
                              }}
                            ></Divider>
                            <span>
                              GPU:{' '}
                              {item.computed_resource_claim?.offload_layers}{' '}
                              {intl.formatMessage({
                                id: 'models.table.layers'
                              })}
                            </span>
                          </span>
                        }
                      >
                        <Tag
                          color="cyan"
                          style={{
                            opacity: 0.75
                          }}
                        >
                          <InfoCircleOutlined className="m-r-5" />
                          {intl.formatMessage({
                            id: 'models.table.cpuoffload'
                          })}
                        </Tag>
                      </Tooltip>
                    )}
                    {item?.distributed_servers?.rpc_servers?.length && (
                      <Tooltip
                        overlayInnerStyle={{
                          width: '400px'
                        }}
                        title={renderDistributionInfo(item)}
                      >
                        <Tag
                          color="processing"
                          style={{
                            opacity: 0.75
                          }}
                        >
                          <InfoCircleOutlined className="m-r-5" />
                          {intl.formatMessage({
                            id: 'models.table.acrossworker'
                          })}
                        </Tag>
                      </Tooltip>
                    )}
                  </span>
                </Col>
                <Col span={4}>
                  <span
                    style={{ paddingLeft: '62px' }}
                    className="flex justify-center"
                  >
                    {item.state && (
                      <StatusTag
                        download={
                          item.state === InstanceStatusMap.Downloading
                            ? { percent: item.download_progress }
                            : undefined
                        }
                        statusValue={{
                          status:
                            item.state === InstanceStatusMap.Downloading &&
                            item.download_progress === 100
                              ? status[InstanceStatusMap.Running]
                              : (status[item.state] as any),
                          text: InstanceStatusMapValue[item.state],
                          message:
                            item.state === InstanceStatusMap.Downloading &&
                            item.download_progress === 100
                              ? ''
                              : item.state_message
                        }}
                      ></StatusTag>
                    )}
                  </span>
                </Col>
                <Col span={5}>
                  <span style={{ paddingLeft: 45 }} className="flex">
                    {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </Col>
                <Col span={4}>
                  <div style={{ paddingLeft: 39 }}>
                    <DropdownButtons
                      items={setChildActionList(item)}
                      onSelect={(val: string) =>
                        handleChildSelect(val, item, list)
                      }
                    ></DropdownButtons>
                  </div>
                </Col>
              </Row>
            </RowChildren>
          </div>
        );
      })}
    </Space>
  );
};
export default React.memo(InstanceItem);
