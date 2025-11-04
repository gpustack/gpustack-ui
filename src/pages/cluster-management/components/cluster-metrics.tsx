import GaugeChart from '@/components/echarts/gauge';
import Card from '@/components/templates/card';
import { useSearchParams } from '@umijs/max';
import { Col, Row } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { queryClusterDetail } from '../apis';
import { ClusterListItem } from '../config/types';
import TrendChart from './trend-chart';

const metricsMap = {
  cpu: {
    label: 'CPU',
    type: 'CPU',
    intl: false,
    color: 'rgba(250, 173, 20,.8)'
  },
  ram: {
    label: 'RAM',
    type: 'RAM',
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
    label: 'VRAM',
    type: 'VRAM',
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

const titleConfig = {
  textStyle: {
    color: '#000',
    fontSize: 14,
    fontWeight: 600
  },
  top: -5
};

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

const ClusterMetrics = () => {
  const chartHeight = 160;
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const provider = searchParams.get('provider');
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

  const getClusterDetail = async () => {
    if (!id) {
      return;
    }
    try {
      const response = await queryClusterDetail({
        cluster_id: id
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
    if (id) {
      getClusterDetail();
    }
  }, [id]);

  return (
    <div>
      <div className="chart-wrapper">
        <Row gutter={16} style={{ width: '100%' }}>
          <Col span={6}>
            <GaugeChart
              title={{
                text: 'GPU Utilization',
                ...titleConfig
              }}
              value={formatValue(detailContent.current.gpu)}
              height={chartHeight}
              gaugeConfig={gaugeConfig}
            />
          </Col>
          <Col span={6}>
            <GaugeChart
              title={{
                text: 'CPU Utilization',
                ...titleConfig
              }}
              value={formatValue(detailContent.current.cpu)}
              height={chartHeight}
              gaugeConfig={gaugeConfig}
            />
          </Col>
          <Col span={6}>
            <GaugeChart
              title={{
                text: 'RAM Utilization',
                ...titleConfig
              }}
              value={formatValue(detailContent.current.ram)}
              height={chartHeight}
              gaugeConfig={gaugeConfig}
            />
          </Col>
          <Col span={6}>
            <GaugeChart
              title={{
                text: 'VRAM Utilization',
                ...titleConfig
              }}
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
              metrics={['vram']}
              metricsMap={metricsMap}
              title="VRAM"
            ></TrendChart>
          </Card>
        </Col>
        <Col span={12}>
          <Card height={CardHeight} clickable={false} ghost>
            <TrendChart
              data={detailContent?.history}
              metrics={['ram']}
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
    </div>
  );
};

export default ClusterMetrics;
