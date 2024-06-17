import BarChart from '@/components/bar-chart';
import HBar from '@/components/bar-chart/h-bar';
import ContentWrapper from '@/components/content-wrapper';
import DividerLine from '@/components/divider-line';
import PageTools from '@/components/page-tools';
import { generateRandomArray } from '@/utils';
import { PageContainer } from '@ant-design/pro-components';
import { Col, Row } from 'antd';
import GPUUtilization from './components/gpu-utilization';
import Overview from './components/over-view';
import UtilizationOvertime from './components/utilization-overtime';

const times = [
  'june 1',
  'june 2',
  'june 3',
  'june 4',
  'june 5',
  'june 6',
  'june 7'
];

const users = ['Jim', 'Lucy', 'Lily', 'Tom', 'Jack', 'Rose', 'Jerry'];
const projects = [
  'copilot-dev',
  'rag-wiki',
  'smart-auto-agent',
  'office-auto-docs',
  'smart-customer-service'
];

const APIRequestData = generateRandomArray({
  length: times.length,
  max: 100,
  min: 0,
  offset: 10
});

const TokensData = generateRandomArray({
  length: times.length,
  max: 2000,
  min: 200,
  offset: 200
});

const usersData = generateRandomArray({
  length: users.length,
  max: 100,
  min: 0,
  offset: 10
});

const projectsData = generateRandomArray({
  length: projects.length,
  max: 100,
  min: 0,
  offset: 10
});

const userDataList = usersData
  .map((val, i) => {
    return {
      time: users[i],
      value: val
    };
  })
  .sort((a, b) => b.value - a.value);

const projectDataList = projectsData
  .map((val, i) => {
    return {
      time: projects[i],
      value: val
    };
  })
  .sort((a, b) => b.value - a.value);

const dataList = APIRequestData.map((val, i) => {
  console.log('val', val);
  return {
    time: times[i],
    value: val
  };
});
const tokenUsage = TokensData.map((val, i) => {
  console.log('val', val);
  return {
    time: times[i],
    value: val
  };
});
const Dashboard: React.FC = () => {
  return (
    <>
      <PageContainer ghost title={false}>
        <Overview></Overview>
      </PageContainer>
      <DividerLine></DividerLine>
      <PageContainer ghost title="System Load">
        <UtilizationOvertime></UtilizationOvertime>
      </PageContainer>
      <DividerLine></DividerLine>
      <PageContainer ghost title={false}>
        <Row gutter={20} style={{ marginTop: '0px' }}>
          <Col span={12}>
            <PageTools
              marginBottom={10}
              marginTop={0}
              left={
                <div
                  style={{
                    height: '34px',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center'
                  }}
                >
                  VRAM
                </div>
              }
            ></PageTools>
            <GPUUtilization></GPUUtilization>
          </Col>
          <Col span={12}>
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
      <Row gutter={10}>
        <Col span={12}>
          <ContentWrapper
            contentStyle={{ paddingRight: 0 }}
            title={<span style={{ lineHeight: '48px' }}>API Request</span>}
          >
            <BarChart data={dataList} xField="time" yField="value"></BarChart>
          </ContentWrapper>
        </Col>
        <Col span={12}>
          <ContentWrapper
            contentStyle={{ paddingRight: 0 }}
            title={<span style={{ lineHeight: '48px' }}>Tokens</span>}
          >
            <BarChart data={tokenUsage} xField="time" yField="value"></BarChart>
          </ContentWrapper>
        </Col>
      </Row>
      <Row gutter={10}>
        <Col span={12}>
          <ContentWrapper
            contentStyle={{ paddingRight: 0 }}
            title={<span style={{ lineHeight: '48px' }}>Top Users</span>}
          >
            <HBar
              data={userDataList}
              xField="time"
              yField="value"
              height={360}
            ></HBar>
          </ContentWrapper>
        </Col>
        <Col span={12}>
          <ContentWrapper
            contentStyle={{ paddingRight: 0 }}
            title={<span style={{ lineHeight: '48px' }}>Top Projects</span>}
          >
            <HBar
              data={projectDataList}
              xField="time"
              yField="value"
              height={300}
            ></HBar>
          </ContentWrapper>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;
