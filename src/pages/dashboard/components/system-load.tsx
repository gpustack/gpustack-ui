import CardWrapper from '@/components/card-wrapper';
import LiquidChart from '@/components/charts/liquid';
import PageTools from '@/components/page-tools';
import { Col, DatePicker, Row } from 'antd';
import ResourceUtilization from './resource-utilization';

const SystemLoad = () => {
  const colors = [
    'linear-gradient(90deg, rgba(84, 204, 152,.8) 0%, rgba(84, 204, 152,0.5) 50%,  rgba(84, 204, 152,.8) 100%)',
    'linear-gradient(90deg, rgba(255, 214, 102,.8) 0%, rgba(255, 214, 102,0.5) 50%,  rgba(255, 214, 102,.8) 100%)',
    'linear-gradient(90deg, rgba(255, 120, 117,.8) 0%, rgba(255, 120, 117,0.5) 50%,  rgba(255, 120, 117,.8) 100%)'
  ];

  const thresholds = [0.5, 0.7, 1];
  const height = 400;

  const handleSelectDate = (date: string) => {};

  return (
    <div>
      <div className="system-load">
        <PageTools
          style={{ margin: '32px 8px' }}
          left={
            <span style={{ fontSize: 'var(--font-size-large)' }}>
              System Load
            </span>
          }
          right={
            <DatePicker onChange={handleSelectDate} style={{ width: 300 }} />
          }
        />
        <Row style={{ width: '100%' }} gutter={[0, 20]}>
          <Col span={16} style={{ paddingRight: '20px' }}>
            <CardWrapper style={{ height: height }}>
              <ResourceUtilization />
            </CardWrapper>
          </Col>
          <Col span={8}>
            <CardWrapper style={{ height: '400px' }}>
              <Row style={{ height: height }}>
                <Col span={12} style={{ height: height / 2 - 10 }}>
                  <LiquidChart
                    title="GPU Compute Utilization"
                    percent={0.2}
                    thresholds={thresholds}
                    rangColor={colors}
                  ></LiquidChart>
                </Col>
                <Col span={12} style={{ height: height / 2 - 10 }}>
                  <LiquidChart
                    title="GPU Memory Utilization"
                    percent={0.3}
                    thresholds={thresholds}
                    rangColor={colors}
                  ></LiquidChart>
                </Col>
                <Col span={12} style={{ height: height / 2 - 10 }}>
                  <LiquidChart
                    title="CPU Compute Utilization"
                    percent={0.8}
                    thresholds={thresholds}
                    rangColor={colors}
                  ></LiquidChart>
                </Col>
                <Col span={12} style={{ height: height / 2 - 10 }}>
                  <LiquidChart
                    title="CPU Memory Utilization"
                    percent={0.7}
                    thresholds={thresholds}
                    rangColor={colors}
                  ></LiquidChart>
                </Col>
              </Row>
            </CardWrapper>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SystemLoad;
