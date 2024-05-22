import DividerLine from '@/components/divider-line';
import PageTools from '@/components/page-tools';
import { PageContainer } from '@ant-design/pro-components';
import { Col, Row } from 'antd';
import GPUUtilization from './components/gpu-utilization';
import ModelBills from './components/model-bills';
import ModelNodes from './components/model-nodes';
import Overview from './components/over-view';
import UtilizationOvertime from './components/utilization-overtime';

const Dashboard: React.FC = () => {
  return (
    <>
      <PageContainer ghost title={false}>
        <Overview></Overview>
      </PageContainer>
      <DividerLine></DividerLine>
      <PageContainer ghost title={false}>
        <Row gutter={20} style={{ marginTop: '0px' }}>
          <Col span={17}>
            <ModelNodes></ModelNodes>
          </Col>
          <Col span={7}>
            <PageTools
              marginBottom={10}
              marginTop={0}
              left={
                <div
                  style={{
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  GPU Utilization
                </div>
              }
            ></PageTools>
            <GPUUtilization></GPUUtilization>
          </Col>
        </Row>
      </PageContainer>
      <DividerLine></DividerLine>
      <PageContainer ghost title={false}>
        <div style={{ marginTop: '0px' }}>
          <ModelBills></ModelBills>
        </div>
      </PageContainer>
      <DividerLine></DividerLine>
      <PageContainer ghost title={false}>
        <div style={{ marginTop: '0px' }}>
          <UtilizationOvertime></UtilizationOvertime>
        </div>
      </PageContainer>
    </>
  );
};

export default Dashboard;
