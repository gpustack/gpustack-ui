import DropdownButtons from '@/components/drop-down-buttons';
import GaugeChart from '@/components/echarts/gauge';
import IconFont from '@/components/icon-font';
import StatusTag from '@/components/status-tag';
import ThemeTag from '@/components/tags-wrapper/theme-tag';
import Card from '@/components/templates/card';
import { PageAction } from '@/config';
import {
  DeleteOutlined,
  EditOutlined,
  KubernetesOutlined
} from '@ant-design/icons';
import { Card as ACard, Col, Collapse, Row } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import {
  ClusterStatus,
  ClusterStatusLabelMap,
  ProviderLabelMap,
  ProviderValueMap
} from '../config';
import { ClusterListItem as ListItem, NodePoolListItem } from '../config/types';
import AddPool from './add-pool';
import RegisterCluster from './register-cluster';
import WorkerPools from './worker-pools';

const actionItems = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: <EditOutlined />
  },
  {
    key: 'details',
    label: 'common.button.view',
    icon: <IconFont type="icon-detail-info" className="font-size-16" />
  },
  {
    key: 'add_worker',
    label: 'Add Worker',
    provider: ProviderValueMap.Custom,
    locale: false,
    icon: <IconFont type="icon-docker" />
  },
  {
    key: 'register_cluster',
    label: 'Register Cluster',
    provider: ProviderValueMap.Kubernetes,
    locale: false,
    icon: <KubernetesOutlined />
  },
  {
    key: 'addPool',
    label: 'Add Node Pool',
    provider: ProviderValueMap.DigitalOcean,
    locale: false,
    icon: <IconFont type="icon-catalog1" />
  },
  {
    key: 'delete',
    label: 'common.button.delete',
    icon: <DeleteOutlined />,
    props: {
      danger: true
    }
  }
];

const CollapseTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-middle);
  font-weight: 500;
  color: var(--ant-color-text);
  height: 32px;
  cursor: pointer;
`;

const Content = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  .chart-wrapper {
    flex: 1;
  }
`;

const CardWrapper = styled(ACard)`
  text-align: center;
  box-shadow: none !important;
  flex: 1;
  .ant-card {
    box-shadow: none;
  }
  .ant-card-body {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding: 6px 10px;
  }

  .label {
    font-weight: 400;
    margin-bottom: 12px;
    font-size: var(--font-size-middle);
    color: var(--ant-color-text-secondary);
  }
  .value {
    font-weight: 600;
    color: var(--ant-color-text);
    font-size: var(--font-size-large);
  }
`;

const CardBox = styled.div`
  display: flex;
  gap: 16px;
  flex: 1;
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  cursor: default;

  .title {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 8px;

    .text {
      display: flex;
      align-items: center;
      font-size: var(--font-size-middle);
      font-weight: 500;
      color: var(--ant-color-text);
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
  }
`;

const CollapseWrapper = styled(Collapse)`
  width: 100%;
  border: none;
  border-radius: 0;
  border-top: 1px solid var(--ant-color-split);
  background-color: var(--ant-color-fill-quaternary);
  .ant-collapse-content {
    border-top: 1px solid var(--ant-color-split);
  }
  .ant-collapse-header {
    font-size: var(--font-size-middle);
    padding-block: 10px !important;
    .ant-collapse-expand-icon {
      margin-left: 0 !important;
    }
  }
  table .ant-table-thead tr {
    background-color: transparent !important;
    th {
      border-bottom: 1px solid var(--ant-color-split) !important;
      font-weight: 500 !important;
    }
  }
`;

const SubTitle = styled.div`
  font-size: var(--font-size-middle);
  font-weight: 500;
  color: var(--ant-color-text);
  margin-block: 24px 16px;
`;

interface CardProps {
  data: ListItem;
  onSelect?: (key: string, row: ListItem) => void;
}

const gaugeConfig = {
  radius: '100%',
  progress: {
    show: true,
    roundCap: false,
    width: 8
  },
  axisLine: {
    roundCap: false,
    lineStyle: {
      width: 8,
      color: [
        [0.5, 'rgba(84, 204, 152, 80%)'],
        [0.8, 'rgba(250, 173, 20, 80%)'],
        [1, 'rgba(255, 77, 79, 80%)']
      ]
    }
  }
};

const CardItem: React.FC<CardProps> = (props) => {
  const chartHeight = 160;
  const { data, onSelect } = props;
  const [show, setShow] = React.useState(false);
  const [addPoolStatus, setAddPoolStatus] = React.useState({
    open: false,
    action: PageAction.CREATE,
    title: '',
    provider: 'digitalocean'
  });
  const [registerClusterStatus, setRegisterClusterStatus] = React.useState({
    open: false
  });

  // cluster action handler
  const handleOnSelect = (key: string) => {
    if (key === 'addPool') {
      setAddPoolStatus({
        open: true,
        action: PageAction.CREATE,
        title: 'Add Worker Pool',
        provider: data.provider
      });
      return;
    }

    if (key === 'register_cluster') {
      setRegisterClusterStatus({
        open: true
      });
      return;
    }
    onSelect?.(key, data);
  };

  // pool action handler
  const handleOnAction = (action: string, record: NodePoolListItem) => {
    if (action === 'edit') {
      setAddPoolStatus({
        open: true,
        action: PageAction.CREATE,
        title: 'Edit Worker Pool',
        provider: data.provider
      });
    }
  };

  const actions = useMemo(() => {
    return actionItems.filter((item) => {
      if (item.provider) {
        return item.provider === data.provider;
      }
      return true;
    });
  }, [data.provider]);

  return (
    <Card
      height={'auto'}
      clickable={false}
      ghost
      footer={
        <CollapseWrapper
          onChange={() => setShow(!show)}
          expandIconPosition="end"
          expandIcon={({ isActive }) => (
            <IconFont type="icon-down" rotate={isActive ? 0 : -90} />
          )}
          items={[
            {
              key: '1',
              label: 'More Information',
              children: (
                <>
                  <div className="chart-wrapper">
                    <Row gutter={16} style={{ width: '100%' }}>
                      <Col span={6}>
                        <GaugeChart
                          title="GPU Utilization"
                          value={85}
                          height={chartHeight}
                          gaugeConfig={gaugeConfig}
                        />
                      </Col>
                      <Col span={6}>
                        <GaugeChart
                          title="CPU Utilization"
                          value={50}
                          height={chartHeight}
                          gaugeConfig={gaugeConfig}
                        />
                      </Col>
                      <Col span={6}>
                        <GaugeChart
                          title="RAM Utilization"
                          value={70}
                          height={chartHeight}
                          gaugeConfig={gaugeConfig}
                        />
                      </Col>
                      <Col span={6}>
                        <GaugeChart
                          title="VRAM Utilization"
                          value={60}
                          height={chartHeight}
                          gaugeConfig={gaugeConfig}
                        />
                      </Col>
                    </Row>
                  </div>
                  {data.provider === ProviderValueMap.DigitalOcean && (
                    <>
                      <SubTitle>Worker Pools</SubTitle>
                      <WorkerPools
                        provider={data.provider}
                        workerPools={data.worker_pools}
                        height={show ? 'auto' : 0}
                        onAction={handleOnAction}
                      />
                    </>
                  )}
                </>
              )
            }
          ]}
        ></CollapseWrapper>
      }
    >
      <Inner>
        <div className="title">
          <span className="flex-center gap-8">
            <span className="text">{data.name}</span>
            <ThemeTag>{ProviderLabelMap[data.provider]}</ThemeTag>
            <StatusTag
              statusValue={{
                status: ClusterStatus[data.status],
                text: ClusterStatusLabelMap[data.status]
              }}
            />
          </span>
          <span>
            <DropdownButtons
              items={actions}
              onSelect={handleOnSelect}
            ></DropdownButtons>
          </span>
        </div>
        <Content>
          <CardBox>
            <CardWrapper bordered={false}>
              <div className="label">Workers</div>
              <div className="value">1/1</div>
            </CardWrapper>
            <CardWrapper bordered={false}>
              <div className="label">GPUs</div>
              <div className="value">12</div>
            </CardWrapper>
            <CardWrapper bordered={false}>
              <div className="label">Deployments</div>
              <div className="value">2</div>
            </CardWrapper>
          </CardBox>
        </Content>
      </Inner>
      <AddPool
        provider={addPoolStatus.provider}
        open={addPoolStatus.open}
        action={addPoolStatus.action}
        title={addPoolStatus.title}
        onCancel={() => {
          setAddPoolStatus({
            open: false,
            action: PageAction.CREATE,
            title: '',
            provider: 'digitalocean'
          });
        }}
        onOk={() => {
          setAddPoolStatus({
            open: false,
            action: addPoolStatus.action,
            title: '',
            provider: 'digitalocean'
          });
        }}
      ></AddPool>
      <RegisterCluster
        title="Register Cluster"
        open={registerClusterStatus.open}
        data={data}
        onCancel={() => {
          setRegisterClusterStatus({
            open: false
          });
        }}
      ></RegisterCluster>
    </Card>
  );
};

export default CardItem;
