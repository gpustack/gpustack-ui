import GaugeChart from '@/components/echarts/gauge';
import Card from '@/components/templates/card';
import { PageAction } from '@/config';
import { Col, Row } from 'antd';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { queryClusterDetail } from '../apis';
import { ProviderValueMap } from '../config';
import { ClusterListItem, NodePoolListItem } from '../config/types';
import AddPool from './add-pool';
import TrendChart from './trend-chart';
import WorkerPools from './worker-pools';

const metricsMap = {
  cpu: {
    label: 'CPU',
    type: 'CPU',
    intl: false,
    color: 'rgba(250, 173, 20,.8)'
  },
  ram: {
    label: 'Used',
    type: 'Used',
    intl: false,
    color: 'rgba(114, 46, 209,.8)'
  },
  allocated: {
    label: 'Allocated',
    type: 'Allocated',
    intl: false,
    color: 'rgba(250, 173, 20,.8)'
  },
  gpu: {
    label: 'GPU',
    type: 'GPU',
    intl: false,
    color: 'rgba(84, 204, 152,.8)'
  },
  vram: {
    label: 'Used',
    type: 'Used',
    intl: false,
    color: 'rgba(255, 107, 179, 80%)'
  }
};

const SubTitle = styled.div`
  font-size: var(--font-size-middle);
  font-weight: 700;
  color: var(--ant-color-text);
  margin-block: 24px 16px;
`;

interface ClusterDetailProps {
  data: ClusterListItem | null;
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

const formatValue = (value: number) => {
  return _.round(value || 0, 1);
};

const CardHeight = 336;

const ClusterDetail: React.FC<ClusterDetailProps> = ({ data }) => {
  const chartHeight = 160;
  const [show, setShow] = React.useState(false);
  const [addPoolStatus, setAddPoolStatus] = React.useState({
    open: false,
    action: PageAction.CREATE,
    title: '',
    provider: ProviderValueMap.DigitalOcean
  });
  const [detailContent, setDetailContent] = useState<{
    current: {
      cpu: number;
      ram: number;
      gpu: number;
      vram: number;
    };
    history: Record<string, { timestamp: number; value: number }[]>;
  }>({
    current: {
      cpu: 0,
      ram: 0,
      gpu: 0,
      vram: 0
    },
    history: {}
  });

  // pool action handler
  const handleOnAction = (action: string, record: NodePoolListItem) => {
    if (action === 'edit') {
      setAddPoolStatus({
        open: true,
        action: PageAction.CREATE,
        title: 'Edit Worker Pool',
        provider: data!.provider
      });
    }
  };

  const getClusterDetail = async () => {
    if (!data) {
      return;
    }
    try {
      const response = await queryClusterDetail({
        cluster_id: data!.id
      });
      setDetailContent({
        current: response.system_load?.current,
        history: response.system_load?.history
      });
      // handle response
    } catch (error) {
      setDetailContent({
        current: {
          cpu: 0,
          ram: 0,
          gpu: 0,
          vram: 0
        },
        history: {}
      });
    }
  };

  useEffect(() => {
    if (data?.id) {
      getClusterDetail();
    }
  }, [data?.id]);

  return (
    <div>
      <div className="chart-wrapper">
        <Row gutter={16} style={{ width: '100%' }}>
          <Col span={6}>
            <GaugeChart
              title="GPU Utilization"
              value={formatValue(detailContent.current.gpu)}
              height={chartHeight}
              gaugeConfig={gaugeConfig}
            />
          </Col>
          <Col span={6}>
            <GaugeChart
              title="CPU Utilization"
              value={formatValue(detailContent.current.cpu)}
              height={chartHeight}
              gaugeConfig={gaugeConfig}
            />
          </Col>
          <Col span={6}>
            <GaugeChart
              title="RAM Utilization"
              value={formatValue(detailContent.current.ram)}
              height={chartHeight}
              gaugeConfig={gaugeConfig}
            />
          </Col>
          <Col span={6}>
            <GaugeChart
              title="VRAM Utilization"
              value={formatValue(detailContent.current.vram)}
              height={chartHeight}
              gaugeConfig={gaugeConfig}
            />
          </Col>
        </Row>
      </div>
      <SubTitle>System Load</SubTitle>
      <Row style={{ marginBottom: 16 }} gutter={16}>
        <Col span={12}>
          <Card height={CardHeight} clickable={false} ghost>
            <TrendChart
              data={detailContent?.history}
              metrics={['vram', 'allocated']}
              metricsMap={metricsMap}
              title="VRAM"
            ></TrendChart>
          </Card>
        </Col>
        <Col span={12}>
          <Card height={CardHeight} clickable={false} ghost>
            <TrendChart
              data={detailContent?.history}
              metrics={['ram', 'allocated']}
              metricsMap={metricsMap}
              title="RAM"
            ></TrendChart>
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Card height={CardHeight} clickable={false} ghost>
            <TrendChart
              data={detailContent?.history}
              metrics={['cpu']}
              metricsMap={metricsMap}
              title="CPU"
            ></TrendChart>
          </Card>
        </Col>
        <Col span={12}>
          <Card height={CardHeight} clickable={false} ghost>
            <TrendChart
              data={detailContent?.history}
              metrics={['gpu']}
              metricsMap={metricsMap}
              title="GPU"
            ></TrendChart>
          </Card>
        </Col>
      </Row>
      {data?.provider === ProviderValueMap.DigitalOcean && (
        <>
          <SubTitle>Worker Pools</SubTitle>
          <WorkerPools
            provider={data?.provider}
            workerPools={data?.worker_pools}
            height={show ? 'auto' : 0}
            onAction={handleOnAction}
          />
        </>
      )}
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
            provider: ProviderValueMap.DigitalOcean
          });
        }}
        onOk={() => {
          setAddPoolStatus({
            open: false,
            action: addPoolStatus.action,
            title: '',
            provider: ProviderValueMap.DigitalOcean
          });
        }}
      ></AddPool>
    </div>
  );
};

export default ClusterDetail;
