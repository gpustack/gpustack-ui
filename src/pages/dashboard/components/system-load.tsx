import CardWrapper from '@/components/card-wrapper';
import GaugeChart from '@/components/charts/gauge';
import PageTools from '@/components/page-tools';
import { Col, DatePicker, Row } from 'antd';
import ResourceUtilization from './resource-utilization';

const SystemLoad = () => {
  const colors = [
    'rgba(84, 204, 152,.8)',
    'rgba(255, 214, 102,.8)',
    'rgba(255, 120, 117,.8)'
  ];
  const handleSelectDate = (date: string) => {
    console.log('dateString============', date);
  };

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
        <CardWrapper>
          <ResourceUtilization />
        </CardWrapper>
        <Row style={{ width: '100%', marginTop: '40px' }} gutter={[20, 20]}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <CardWrapper>
              <GaugeChart
                title="GPU Compute Utilization"
                total={100}
                target={20}
                // height={320}
                thresholds={[50, 70, 100]}
                rangColor={colors}
              ></GaugeChart>
            </CardWrapper>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <CardWrapper>
              <GaugeChart
                title="GPU Memory Utilization"
                total={100}
                target={30}
                // height={320}
                thresholds={[50, 70, 100]}
                rangColor={colors}
              ></GaugeChart>
            </CardWrapper>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <CardWrapper>
              <GaugeChart
                title="CPU Compute Utilization"
                total={100}
                target={40}
                // height={320}
                thresholds={[50, 70, 100]}
                rangColor={colors}
              ></GaugeChart>
            </CardWrapper>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <CardWrapper>
              <GaugeChart
                title="CPU Memory Utilization"
                total={100}
                target={70}
                // height={320}
                thresholds={[50, 70, 100]}
                rangColor={colors}
              ></GaugeChart>
            </CardWrapper>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SystemLoad;
