import GaugeChart from '@/components/charts/gauge';
import PageTools from '@/components/page-tools';
import { PageContainer } from '@ant-design/pro-components';
import { Col, DatePicker, Row } from 'antd';
import ResourceUtilization from './resource-utilization';

const SystemLoad = () => {
  const handleSelectDate = (date: string) => {
    console.log('dateString============', date);
  };

  return (
    <PageContainer ghost title="System Load">
      <div className="system-load">
        <PageTools
          marginBottom={10}
          marginTop={0}
          left={false}
          right={
            <DatePicker onChange={handleSelectDate} style={{ width: 300 }} />
          }
        />
        <ResourceUtilization />
        <Row style={{ width: '100%' }}>
          <Col span={6}>
            <GaugeChart
              title="GPU Compute Utilization"
              total={100}
              target={20}
              // height={320}
              thresholds={[50, 70, 100]}
              rangColor={['#54cc98', '#ffd666', '#ff7875']}
            ></GaugeChart>
          </Col>
          <Col span={6}>
            <GaugeChart
              title="GPU Memory Utilization"
              total={100}
              target={30}
              // height={320}
              thresholds={[50, 70, 100]}
              rangColor={['#54cc98', '#ffd666', '#ff7875']}
            ></GaugeChart>
          </Col>
          <Col span={6}>
            <GaugeChart
              title="CPU Compute Utilization"
              total={100}
              target={40}
              // height={320}
              thresholds={[50, 70, 100]}
              rangColor={['#54cc98', '#ffd666', '#ff7875']}
            ></GaugeChart>
          </Col>
          <Col span={6}>
            <GaugeChart
              title="CPU Memory Utilization"
              total={100}
              target={70}
              // height={320}
              thresholds={[50, 70, 100]}
              rangColor={['#54cc98', '#ffd666', '#ff7875']}
            ></GaugeChart>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default SystemLoad;
