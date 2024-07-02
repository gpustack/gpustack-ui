import CardWrapper from '@/components/card-wrapper';
import AreaChart from '@/components/charts/area';
import ColumnBar from '@/components/charts/column-bar';
import HBar from '@/components/charts/h-bar';
import PageTools from '@/components/page-tools';
import breakpoints from '@/config/breakpoints';
import useWindowResize from '@/hooks/use-window-resize';
import { generateRandomArray } from '@/utils';
import { useIntl } from '@umijs/max';
import { Col, DatePicker, Row } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { DashboardContext } from '../config/dashboard-context';

const { RangePicker } = DatePicker;
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
  max: 1000,
  min: 10,
  offset: 0
});

const TokensData = generateRandomArray({
  length: times.length,
  max: 2000,
  min: 0,
  offset: 500
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
  return {
    time: times[i],
    value: val
  };
});
const tokenUsage = TokensData.map((val, i) => {
  return {
    time: times[i],
    value: val
  };
});

const getCurrentMonthDays = () => {
  const now = dayjs();
  const firstDayOfMonth = now.startOf('month');
  const dateRange = [];
  let currentDate = firstDayOfMonth;

  while (currentDate.isBefore(now) || currentDate.isSame(now, 'day')) {
    dateRange.push(currentDate.format('YYYY-MM-DD'));
    currentDate = currentDate.add(1, 'day');
  }
  return dateRange;
};

const Usage = () => {
  const intl = useIntl();
  const { size } = useWindowResize();
  const [paddingRight, setPaddingRight] = useState<string>('20px');
  const [requestData, setRequestData] = useState<
    { time: string; value: number }[]
  >([]);
  const [tokenData, setTokenData] = useState<{ time: string; value: number }[]>(
    []
  );
  const [userData, setUserData] = useState<{ name: string; value: number }[]>(
    []
  );
  const [dateRange, setDateRange] = useState<string[]>(getCurrentMonthDays());

  const data = useContext(DashboardContext)?.model_usage || {};

  console.log('dateRange', dateRange);
  const handleSelectDate = (dateString: string) => {};

  const generateData = () => {
    const requestList: { time: string; value: number }[] = [];
    const tokenList: {
      time: string;
      value: number;
      name: string;
      color: string;
    }[] = [];
    const userList: {
      name: string;
      value: number;
      type: string;
      color: string;
    }[] = [];

    _.each(data.api_request_history, (item: any) => {
      requestList.push({
        time: dayjs(item.timestamp * 1000).format('YYYY-MM-DD'),
        value: item.value
      });
    });

    _.each(dateRange, (date: string) => {
      // tokens data
      const item = _.find(data.completion_token_history, (item: any) => {
        return dayjs(item.timestamp * 1000).format('YYYY-MM-DD') === date;
      });
      if (!item) {
        tokenList.push({
          time: date,
          name: 'completion_token',
          color: 'rgba(84, 204, 152,0.8)',
          value: 0
        });
      } else {
        tokenList.push({
          time: dayjs(item.timestamp * 1000).format('YYYY-MM-DD'),
          name: 'completion_token',
          color: 'rgba(84, 204, 152,0.8)',
          value: item.value
        });
      }

      const promptItem = _.find(data.prompt_token_history, (item: any) => {
        return dayjs(item.timestamp * 1000).format('YYYY-MM-DD') === date;
      });
      if (!promptItem) {
        tokenList.push({
          time: date,
          name: 'prompt_token',
          color: 'rgba(0, 170, 173, 0.8)',
          value: 0
        });
      } else {
        tokenList.push({
          time: dayjs(promptItem.timestamp * 1000).format('YYYY-MM-DD'),
          name: 'prompt_token',
          color: 'rgba(0, 170, 173, 0.8)',
          value: promptItem.value
        });
      }

      // api request data
      const requestItem = _.find(data.api_request_history, (item: any) => {
        return dayjs(item.timestamp * 1000).format('YYYY-MM-DD') === date;
      });

      if (!requestItem) {
        requestList.push({
          time: date,
          value: 0
        });
      } else {
        requestList.push({
          time: dayjs(requestItem.timestamp * 1000).format('YYYY-MM-DD'),
          value: requestItem.value
        });
      }
    });

    _.each(data.top_users, (item: any) => {
      userList.push({
        name: item.username,
        type: 'completion_token',
        color: 'rgba(84, 204, 152,0.8)',
        value: item.completion_token_count
      });
      userList.push({
        name: item.username,
        type: 'prompt_token',
        color: 'rgba(0, 170, 173, 0.8)',
        value: item.prompt_token_count
      });
    });

    setRequestData(requestList);
    setTokenData(tokenList);
    setUserData(userList);
  };

  const labelFormatter = (v: any) => {
    return dayjs(v).format('MM-DD');
  };

  useEffect(() => {
    if (size.width < breakpoints.xl) {
      setPaddingRight('0');
    } else {
      setPaddingRight('20px');
    }
  }, [size.width]);

  useEffect(() => {
    generateData();
  }, [data]);

  return (
    <>
      <PageTools
        style={{ margin: '26px 0px' }}
        left={
          <span style={{ fontSize: 'var(--font-size-large)' }}>
            {intl.formatMessage({ id: 'dashboard.usage' })}
          </span>
        }
        right={
          <DatePicker
            onChange={handleSelectDate}
            style={{ width: 300 }}
            picker="month"
          />
        }
      />
      <Row style={{ width: '100%' }} gutter={[0, 20]}>
        <Col
          xs={24}
          sm={24}
          md={24}
          lg={24}
          xl={16}
          style={{ paddingRight: paddingRight }}
        >
          <CardWrapper style={{ width: '100%' }}>
            <Row style={{ width: '100%' }}>
              <Col span={12}>
                <AreaChart
                  title={intl.formatMessage({ id: 'dashboard.apirequest' })}
                  data={requestData}
                  xField="time"
                  yField="value"
                  height={360}
                  labelFormatter={labelFormatter}
                ></AreaChart>
              </Col>
              <Col span={12}>
                <ColumnBar
                  title={intl.formatMessage({ id: 'dashboard.tokens' })}
                  data={tokenData}
                  group={false}
                  colorField="name"
                  stack={true}
                  xField="time"
                  legend={false}
                  yField="value"
                  height={360}
                  labelFormatter={labelFormatter}
                ></ColumnBar>
              </Col>
            </Row>
          </CardWrapper>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={8}>
          <CardWrapper>
            <HBar
              title={intl.formatMessage({ id: 'dashboard.topusers' })}
              data={userData}
              stack={true}
              legend={false}
              showYAxis={false}
              colorField="type"
              xField="name"
              yField="value"
              height={360}
            ></HBar>
          </CardWrapper>
        </Col>
      </Row>
    </>
  );
};

export default Usage;
