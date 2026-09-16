import { TemplateCard } from '@gpustack/core-ui';
import { GaugeChart } from '@gpustack/core-ui/charts';
import { useSearchParams } from '@umijs/max';
import { Col, Row, theme } from 'antd';
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
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--ant-color-text);
  margin-block: 24px 16px;
`;

interface ClusterDetailProps {
  data: ClusterListItem | null;
}

// Takes the colour as a resolved value rather than reading a token itself,
// because this lands in an ECharts option and ECharts paints to canvas.
// `ctx.fillStyle = 'var(--ant-color-text)'` is not an error — it is silently
// IGNORED, leaving whatever colour was set last, which for a fresh text draw is
// `#000000`. So the CSS variable this briefly used looked like a fix for the
// hardcoded `#000` that preceded it, and rendered exactly the same black on
// black in the dark theme.
//
// Anything that reaches a chart option has to be a real colour string; only
// DOM-rendered parts of a chart (the tooltip's HTML) can carry a token.
const getTitleConfig = (colorText: string) => ({
  textStyle: {
    color: colorText,
    fontSize: 14,
    fontWeight: 500
  },
  top: -5
});

// Only the radius is local. The threshold zones used to be overridden here with
// three more hardcoded `rgba(...)` stops — a FIFTH private copy of the product's
// green/amber/red, and the reason this page's gauges and the dashboard's did not
// look alike. They now come from the shared gauge config.
const gaugeConfig = {
  radius: '100%'
};

const formatValue = (value: number) => {
  return _.round(value || 0, 1);
};

const CardHeight = 336;

const ClusterMetrics = () => {
  const chartHeight = 160;
  // Resolved here rather than in the module-level config: the token's value
  // changes with the theme, so reading it inside the component is also what
  // makes these titles follow a light/dark switch.
  const { token } = theme.useToken();
  const titleConfig = getTitleConfig(token.colorText);
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
          <TemplateCard height={CardHeight} clickable={false} ghost>
            <TrendChart
              data={detailContent?.history}
              metrics={['vram']}
              metricsMap={metricsMap}
              title="VRAM"
            ></TrendChart>
          </TemplateCard>
        </Col>
        <Col span={12}>
          <TemplateCard height={CardHeight} clickable={false} ghost>
            <TrendChart
              data={detailContent?.history}
              metrics={['ram']}
              metricsMap={metricsMap}
              title="RAM"
            ></TrendChart>
          </TemplateCard>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <TemplateCard height={CardHeight} clickable={false} ghost>
            <TrendChart
              data={detailContent?.history}
              metrics={['cpu']}
              metricsMap={metricsMap}
              title="CPU"
            ></TrendChart>
          </TemplateCard>
        </Col>
        <Col span={12}>
          <TemplateCard height={CardHeight} clickable={false} ghost>
            <TrendChart
              data={detailContent?.history}
              metrics={['gpu']}
              metricsMap={metricsMap}
              title="GPU"
            ></TrendChart>
          </TemplateCard>
        </Col>
      </Row>
    </div>
  );
};

export default ClusterMetrics;
