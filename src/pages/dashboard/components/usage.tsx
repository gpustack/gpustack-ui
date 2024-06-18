import ColumnBar from '@/components/charts/column-bar';
import HBar from '@/components/charts/h-bar';
import PageTools from '@/components/page-tools';
import { generateRandomArray } from '@/utils';
import { PageContainer } from '@ant-design/pro-components';
import { Col, DatePicker, Row } from 'antd';

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

const Usage = () => {
  const handleSelectDate = (dateString: string) => {
    console.log('dateString============', dateString);
  };
  return (
    <>
      <PageContainer ghost title="Usage">
        <PageTools
          marginBottom={10}
          marginTop={0}
          left={false}
          right={
            <DatePicker onChange={handleSelectDate} style={{ width: 300 }} />
          }
        />
      </PageContainer>
      <Row style={{ width: '100%' }}>
        <Col span={12}>
          <PageContainer title={false}>
            <ColumnBar
              title="API Request"
              data={dataList}
              xField="time"
              yField="value"
              height={360}
            ></ColumnBar>
          </PageContainer>
        </Col>
        <Col span={12}>
          <PageContainer title={false}>
            <ColumnBar
              title="Tokens"
              data={tokenUsage}
              xField="time"
              yField="value"
              height={360}
            ></ColumnBar>
          </PageContainer>
        </Col>
      </Row>
      <Row style={{ width: '100%' }}>
        <Col span={12}>
          <PageContainer title={false}>
            <HBar
              title="Top Users"
              data={userDataList}
              xField="time"
              yField="value"
              height={400}
            ></HBar>
          </PageContainer>
        </Col>
        <Col span={12}>
          <PageContainer title={false}>
            <HBar
              title="Top Projects"
              data={projectDataList}
              xField="time"
              yField="value"
              height={400}
            ></HBar>
          </PageContainer>
        </Col>
      </Row>
    </>
  );
};

export default Usage;
