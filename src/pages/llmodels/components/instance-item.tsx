import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import IconFont from '@/components/icon-font';
import RowChildren from '@/components/seal-table/components/row-children';
import SimpleTabel from '@/components/simple-table';
import StatusTag from '@/components/status-tag';
import { HandlerOptions } from '@/hooks/use-chunk-fetch';
import useDownloadStream from '@/hooks/use-download-stream';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { convertFileSize } from '@/utils';
import {
  DeleteOutlined,
  DownloadOutlined,
  HddFilled,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import {
  Button,
  Col,
  Divider,
  Progress,
  Row,
  Tag,
  Tooltip,
  notification
} from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { MODEL_INSTANCE_API } from '../apis';
import { InstanceStatusMap, InstanceStatusMapValue, status } from '../config';
import { ModelInstanceListItem } from '../config/types';
import '../style/instance-item.less';

interface InstanceItemProps {
  instanceData: ModelInstanceListItem;
  workerList: WorkerListItem[];
  modelData?: any;
  handleChildSelect: (val: string, item: ModelInstanceListItem) => void;
}

const childActionList = [
  {
    label: 'common.button.viewlog',
    key: 'viewlog',
    status: [
      InstanceStatusMap.Initializing,
      InstanceStatusMap.Running,
      InstanceStatusMap.Error,
      InstanceStatusMap.Starting,
      InstanceStatusMap.Downloading
    ],
    icon: <IconFont type="icon-logs" />
  },
  {
    label: 'common.button.downloadLog',
    key: 'download',
    status: [
      InstanceStatusMap.Initializing,
      InstanceStatusMap.Running,
      InstanceStatusMap.Error,
      InstanceStatusMap.Starting,
      InstanceStatusMap.Downloading
    ],
    icon: <DownloadOutlined />
  },
  {
    label: 'common.button.delrecreate',
    key: 'delete',
    props: {
      danger: true
    },
    icon: <DeleteOutlined />
  }
];

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
    title: 'models.form.backend',
    locale: true,
    key: 'backend'
  },
  {
    title: 'models.table.gpuindex',
    locale: true,
    key: 'gpu_index'
  },
  {
    title: 'resources.table.memory',
    locale: true,
    key: 'ram'
  }
];

const renderMessage = (title: string) => {
  return (
    <div
      style={{
        width: 300,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      }}
    >
      {title}
    </div>
  );
};

const InfoItem = (props: { label: string; value: any; width?: number }) => {
  const { label, value, width } = props;
  const Wrapper = styled.div`
    .info-item {
      width: ${width ? `${width}px` : '100%'};
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 4px 8px;
      background-color: var(--color-gray-fill-3);
      border-radius: 4px;
      .value {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
        color: var(--color-white-quaternary);
        .index {
          color: var(--ant-color-text-light-solid);
        }
      }
    }
  `;
  return (
    <Wrapper>
      <div className="info-item">
        <span className="label">{label}</span>
        <span className="value">{value}</span>
      </div>
    </Wrapper>
  );
};

const InstanceItem: React.FC<InstanceItemProps> = ({
  instanceData,
  workerList,
  modelData,
  handleChildSelect
}) => {
  const [api, contextHolder] = notification.useNotification({
    stack: { threshold: 1 }
  });
  const { downloadStream } = useDownloadStream();
  const intl = useIntl();
  const actionItems = useMemo(() => {
    return _.filter(childActionList, (action: any) => {
      if (action.key === 'viewlog' || action.key === 'download') {
        return action.status.includes(instanceData.state);
      }
      return true;
    });
  }, [instanceData]);

  const createFileName = (name: string) => {
    const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
    const fileName = `${name}_${timestamp}.txt`;
    return fileName;
  };

  const downloadNotification = useCallback(
    (
      data: HandlerOptions & {
        filename: string;
        duration?: number;
        chunkRequestRef: any;
      }
    ) => {
      api.open({
        duration: data.duration,
        message: renderMessage(data.filename),
        key: data.filename,
        closeIcon: (
          <span>{intl.formatMessage({ id: 'common.button.cancel' })}</span>
        ),
        description: <Progress percent={data.percent} size="small"></Progress>,
        onClose() {
          data.chunkRequestRef?.current?.abort();
          notification.destroy?.(data.filename);
        }
      });
    },
    []
  );

  const displayGPUs = (vrams: Record<string, number>) => {
    return (
      <span className="flex-column">
        {Object.keys(vrams)
          ?.sort?.()
          .map((index) => {
            return (
              <span key={index}>
                [{index}] {''}
                {convertFileSize(vrams?.[index], 0)}
              </span>
            );
          })}
      </span>
    );
  };

  const renderWorkerInfo = useMemo(() => {
    let workerIp = '-';
    if (instanceData.worker_ip) {
      workerIp = instanceData.port
        ? `${instanceData.worker_ip}:${instanceData.port}`
        : instanceData.worker_ip;
    }
    let backend = modelData?.backend || '';
    if (modelData.backend_version) {
      backend += ` (${modelData.backend_version})`;
    }
    const vrams = instanceData.computed_resource_claim?.vram || {};
    return (
      <div>
        <div style={{ marginBottom: 5 }}>
          <HddFilled className="m-r-5" />
          {instanceData.worker_name}
        </div>
        <div className="flex m-b-6 gap-6">
          <InfoItem label="IP" value={workerIp} width={180}></InfoItem>
          <InfoItem
            width={90}
            label={intl.formatMessage({ id: 'models.form.backend' })}
            value={backend}
          ></InfoItem>
        </div>
        <div className="flex gap-6">
          <InfoItem
            width={180}
            label={intl.formatMessage({ id: 'models.table.gpuindex' })}
            value={Object.keys(vrams)
              ?.sort?.()
              .map((index) => {
                return (
                  <span className="flex-1" key={index}>
                    <span className="index">
                      [{index}] {''}
                    </span>
                    {convertFileSize(vrams?.[index], 0)}
                  </span>
                );
              })}
          ></InfoItem>
          <InfoItem
            width={90}
            label={intl.formatMessage({ id: 'resources.table.memory' })}
            value={convertFileSize(
              instanceData.computed_resource_claim?.ram,
              0
            )}
          ></InfoItem>
        </div>
      </div>
    );
  }, [modelData, instanceData, intl]);

  const renderDistributionInfo = useMemo(() => {
    const rpcServerList = instanceData.distributed_servers?.rpc_servers || [];
    const list = _.map(rpcServerList, (item: any) => {
      const data = _.find(workerList, { id: item.worker_id });
      return {
        worker_name: data?.name,
        worker_ip: data?.ip,
        port: '',
        ram: convertFileSize(item.computed_resource_claim?.ram, 0),
        gpu_index: displayGPUs(item.computed_resource_claim?.vram || {})
      };
    });

    const mainWorker = [
      {
        worker_name: `${instanceData.worker_name} (main)`,
        worker_ip: `${instanceData.worker_ip}`,
        port: '',
        ram: convertFileSize(instanceData.computed_resource_claim?.ram, 0),
        gpu_index: displayGPUs(instanceData.computed_resource_claim?.vram || {})
      }
    ];

    return (
      <div>
        <SimpleTabel
          columns={distributeCols}
          dataSource={[...mainWorker, ...list]}
        ></SimpleTabel>
      </div>
    );
  }, [workerList, instanceData, intl]);

  const handleOnSelect = useCallback(
    (val: string) => {
      console.log('handleOnSelect', val);
      if (val === 'download') {
        downloadStream({
          url: `${MODEL_INSTANCE_API}/${instanceData.id}/logs`,
          filename: createFileName(instanceData.name),
          downloadNotification
        });
      } else {
        handleChildSelect(val, instanceData);
      }
    },
    [handleChildSelect, instanceData]
  );

  return (
    <>
      {contextHolder}
      <div style={{ borderRadius: 'var(--ant-table-header-border-radius)' }}>
        <RowChildren>
          <Row style={{ width: '100%' }} align="middle">
            <Col
              span={5}
              style={{
                paddingInline: 'var(--ant-table-cell-padding-inline)'
              }}
            >
              <span className="flex-center instance-name">
                <AutoTooltip title={instanceData.name} ghost>
                  <span className="m-r-5">{instanceData.name}</span>
                </AutoTooltip>
                <Tooltip
                  title={renderWorkerInfo}
                  overlayInnerStyle={{
                    width: 'max-content',
                    maxWidth: '400px'
                  }}
                >
                  <span className="server-info">
                    <InfoCircleOutlined className="m-r-2" />{' '}
                    {intl.formatMessage({ id: 'common.button.moreInfo' })}
                  </span>
                </Tooltip>
              </span>
            </Col>
            <Col span={6}>
              <span
                style={{
                  paddingLeft: '58px',
                  flexWrap: 'wrap',
                  gap: '5px'
                }}
                className="flex align-center"
              >
                {instanceData.computed_resource_claim?.total_layers !==
                  instanceData.computed_resource_claim?.offload_layers && (
                  <Tooltip
                    title={
                      <span className="flex flex-center">
                        <span>
                          CPU:{' '}
                          {_.subtract(
                            instanceData.computed_resource_claim?.total_layers,
                            instanceData.computed_resource_claim?.offload_layers
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
                          {instanceData.computed_resource_claim?.offload_layers}{' '}
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
                        display: 'flex',
                        alignItems: 'center',
                        maxWidth: '100%',
                        minWidth: 50,
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        opacity: 0.75,
                        borderRadius: 12
                      }}
                    >
                      <InfoCircleOutlined className="m-r-5" />
                      {intl.formatMessage({
                        id: 'models.table.cpuoffload'
                      })}
                    </Tag>
                  </Tooltip>
                )}
                {instanceData?.distributed_servers?.rpc_servers?.length && (
                  <Tooltip
                    overlayInnerStyle={{
                      width: 'max-content',
                      maxWidth: '500px',
                      minWidth: '400px'
                    }}
                    title={renderDistributionInfo}
                  >
                    <Tag
                      color="processing"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        maxWidth: '100%',
                        minWidth: 50,
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        opacity: 0.75,
                        borderRadius: 12
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
                {instanceData.state && (
                  <StatusTag
                    download={
                      instanceData.state === InstanceStatusMap.Downloading
                        ? { percent: instanceData.download_progress }
                        : undefined
                    }
                    extra={
                      instanceData.state === InstanceStatusMap.Error &&
                      instanceData.worker_id ? (
                        <Button
                          type="link"
                          size="small"
                          style={{ paddingLeft: 0 }}
                          onClick={() =>
                            handleChildSelect('viewlog', instanceData)
                          }
                        >
                          {intl.formatMessage({
                            id: 'models.list.more.logs'
                          })}
                        </Button>
                      ) : null
                    }
                    statusValue={{
                      status:
                        instanceData.state === InstanceStatusMap.Downloading &&
                        instanceData.download_progress === 100
                          ? status[InstanceStatusMap.Running]
                          : (status[instanceData.state] as any),
                      text: InstanceStatusMapValue[instanceData.state],
                      message:
                        instanceData.state === InstanceStatusMap.Downloading &&
                        instanceData.download_progress === 100
                          ? ''
                          : instanceData.state_message
                    }}
                  ></StatusTag>
                )}
              </span>
            </Col>
            <Col span={5}>
              <span style={{ paddingLeft: 45 }} className="flex">
                {dayjs(instanceData.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </span>
            </Col>
            <Col span={4}>
              <div style={{ paddingLeft: 39 }}>
                <DropdownButtons
                  items={actionItems}
                  onSelect={handleOnSelect}
                ></DropdownButtons>
              </div>
            </Col>
          </Row>
        </RowChildren>
      </div>
    </>
  );
};
export default React.memo(InstanceItem);
