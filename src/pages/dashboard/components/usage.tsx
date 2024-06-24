import CardWrapper from '@/components/card-wrapper';
import ColumnBar from '@/components/charts/column-bar';
import HBar from '@/components/charts/h-bar';
import PageTools from '@/components/page-tools';
import { generateRandomArray } from '@/utils';
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
  const bgColor = '#fff';
  const handleSelectDate = (dateString: string) => {
    console.log('dateString============', dateString);
  };

  return (
    <>
      <PageTools
        style={{ margin: '32px 8px' }}
        left={<span style={{ fontSize: 'var(--font-size-large)' }}>Usage</span>}
        right={
          <DatePicker onChange={handleSelectDate} style={{ width: 300 }} />
        }
      />
      <Row style={{ width: '100%' }} gutter={[0, 20]}>
        <Col span={14} style={{ paddingRight: '20px' }}>
          <CardWrapper>
            <Row>
              <Col span={12}>
                <ColumnBar
                  title="API Request"
                  data={dataList}
                  xField="time"
                  yField="value"
                  height={360}
                ></ColumnBar>
              </Col>
              <Col span={12}>
                <ColumnBar
                  title="Tokens"
                  data={tokenUsage}
                  xField="time"
                  yField="value"
                  height={360}
                ></ColumnBar>
              </Col>
            </Row>
          </CardWrapper>
        </Col>
        <Col span={10}>
          <CardWrapper>
            <Row>
              <Col span={12}>
                <HBar
                  title="Top Users"
                  data={userDataList}
                  xField="time"
                  yField="value"
                  height={360}
                ></HBar>
              </Col>
              <Col span={12}>
                <HBar
                  title="Top Projects"
                  data={projectDataList}
                  xField="time"
                  yField="value"
                  height={360}
                ></HBar>
              </Col>
            </Row>
          </CardWrapper>
        </Col>
      </Row>
      {/* <Row style={{ width: '100%', marginTop: '20px' }} gutter={[0, 20]}>
        <Col span={12} style={{ paddingRight: '20px' }}>
          <CardWrapper></CardWrapper>
        </Col>
        <Col span={12}>
          <CardWrapper
            style={{
              background: bgColor,
              borderRadius: 'var(--border-radius-base)'
            }}
          ></CardWrapper>
        </Col>
      </Row> */}
    </>
  );
};

export default Usage;
