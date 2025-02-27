import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import IconFont from '@/components/icon-font';
import RowChildren from '@/components/seal-table/components/row-children';
import SimpleTabel from '@/components/simple-table';
import StatusTag from '@/components/status-tag';
import { HandlerOptions } from '@/hooks/use-chunk-fetch';
import useDownloadStream from '@/hooks/use-download-stream';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import {
  DeleteOutlined,
  DownloadOutlined,
  HddFilled,
  InfoCircleOutlined,
  ThunderboltFilled
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
    title: 'models.table.gpuindex',
    locale: true,
    key: 'gpu_index'
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

const InstanceItem: React.FC<InstanceItemProps> = ({
  instanceData,
  workerList,
  modelData,
  handleChildSelect
}) => {
  const [api, contextHolder] = notification.useNotification();
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
    (data: HandlerOptions & { filename: string; duration?: number }) => {
      api.open({
        duration: data.duration,
        message: renderMessage(data.filename),
        key: data.filename,
        description: <Progress percent={data.percent} size="small"></Progress>
      });
    },
    []
  );

  const renderWorkerInfo = useMemo(() => {
    let workerIp = '-';
    if (instanceData.worker_ip) {
      workerIp = instanceData.port
        ? `${instanceData.worker_ip}:${instanceData.port}`
        : instanceData.worker_ip;
    }
    return (
      <div>
        <div>{instanceData.worker_name}</div>
        <div className="flex-center">
          <HddFilled className="m-r-5" />
          {workerIp}
        </div>
        <div className="flex-center">
          <IconFont type="icon-filled-gpu" className="m-r-5" />
          {intl.formatMessage({ id: 'models.table.gpuindex' })}: [
          {_.join(instanceData.gpu_indexes?.sort?.(), ',')}]
        </div>
        <div className="flex-center">
          <ThunderboltFilled className="m-r-5" />
          {intl.formatMessage({ id: 'models.form.backend' })}:{' '}
          {modelData?.backend || ''}
          {modelData.backend_version ? `(${modelData.backend_version})` : ''}
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
        gpu_index: item.gpu_index
      };
    });

    const mainWorker = [
      {
        worker_name: `${instanceData.worker_name}`,
        worker_ip: `${instanceData.worker_ip}`,
        port: '',
        gpu_index: `${instanceData.gpu_indexes?.sort?.()} (main)`
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
                <Tooltip title={renderWorkerInfo}>
                  <span className="server-info">
                    <InfoCircleOutlined />
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
                      width: '400px'
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
