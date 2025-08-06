import DropdownButtons from '@/components/drop-down-buttons';
import GaugeChart from '@/components/echarts/gauge';
import IconFont from '@/components/icon-font';
import StatusTag from '@/components/status-tag';
import Card from '@/components/templates/card';
import {
  DeleteOutlined,
  EditOutlined,
  KubernetesOutlined
} from '@ant-design/icons';
import { Card as ACard, Button, Col, Row, Tag } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import {
  ClusterStatus,
  ClusterStatusLabelMap,
  ProviderLabelMap,
  ProviderValueMap
} from '../config';
import { ClusterListItem as ListItem } from '../config/types';
import WorkerPools from './worker-pools';

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
  box-shadow: none;
  .ant-card {
    box-shadow: none;
  }
  .ant-card-body {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
  }

  .label {
    font-weight: 500;
    font-size: var(--font-size-middle);
  }
  .value {
    font-weight: 500;
    color: var(--ant-color-text);
  }
`;

const actionItems = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: <EditOutlined />
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

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  cursor: default;

  .title {
    margin-bottom: 16px;
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

interface CardProps {
  data: ListItem;
  onSelect?: (key: string, row: ListItem) => void;
}

const CardItem: React.FC<CardProps> = (props) => {
  const { data, onSelect } = props;
  const [show, setShow] = React.useState(false);

  const handleOnSelect = (key: string) => {
    console.log('Selected action:', key);
    onSelect?.(key, data);
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
    <Card height={'auto'} clickable={false} ghost>
      <Inner>
        <div className="title">
          <span className="flex-center gap-8">
            <span className="text">{data.name}</span>
            <Tag style={{ borderRadius: 4 }}>
              {ProviderLabelMap[data.provider]}
            </Tag>
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
          <div className="flex gap-16">
            <CardWrapper bordered={false}>
              <div className="label">Workers</div>
              <div className="value">1</div>
            </CardWrapper>
            <CardWrapper bordered={false}>
              <div className="label">GPUs</div>
              <div className="value">12</div>
            </CardWrapper>
            <CardWrapper bordered={false}>
              <div className="label">Deployments</div>
              <div className="value">2</div>
            </CardWrapper>
          </div>
          <div className="chart-wrapper">
            <Row gutter={16} style={{ width: '100%' }}>
              <Col span={6}>
                <GaugeChart title="GPU Utilization" value={85} height={160} />
              </Col>
              <Col span={6}>
                <GaugeChart title="CPU Utilization" value={50} height={160} />
              </Col>
              <Col span={6}>
                <GaugeChart title="RAM Utilization" value={70} height={160} />
              </Col>
              <Col span={6}>
                <GaugeChart title="VRAM Utilization" value={60} height={160} />
              </Col>
            </Row>
          </div>
        </Content>
        {data.provider === ProviderValueMap.DigitalOcean && (
          <>
            <CollapseTitle>
              <Button
                type="text"
                size="small"
                icon={<IconFont type="icon-down" rotate={show ? 0 : -90} />}
                onClick={() => setShow(!show)}
              >
                Worker Pools
              </Button>
            </CollapseTitle>
            <WorkerPools
              provider={data.provider}
              dataSource={data.worker_pools}
              height={show ? 'auto' : 0}
            />
          </>
        )}
      </Inner>
    </Card>
  );
};

export default CardItem;
