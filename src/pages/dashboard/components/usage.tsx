import CardWrapper from '@/components/card-wrapper';
import BarChart from '@/components/echarts/bar-chart';
import HBar from '@/components/echarts/h-bar';
import LineChart from '@/components/echarts/line-chart';
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

const baseColorMap = {
  baseL2: 'rgba(13,171,219,0.8)',
  baseL1: 'rgba(0,34,255,0.8)',
  base: 'rgba(0,123,255,0.8)',
  baseR1: 'rgba(0,255,233,0.8)',
  baseR2: 'rgba(48,0,255,0.8)',
  baseR3: 'rgba(85,167,255,0.8)'
};
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
  const daysInMonth = now.daysInMonth();
  const year = dayjs().year();
  const month = dayjs().month() + 1;

  const dates = [];
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD'));
  }
  return dates;
};

const Usage = () => {
  const intl = useIntl();
  const { size } = useWindowResize();
  const [paddingRight, setPaddingRight] = useState<string>('20px');
  const [requestData, setRequestData] = useState<
    {
      name: string;
      color: string;
      areaStyle: any;
      data: { time: string; value: number }[];
    }[]
  >([]);

  const currentMonthDays = getCurrentMonthDays();
  const [tokenData, setTokenData] = useState<{ time: string; value: number }[]>(
    []
  );
  const [userData, setUserData] = useState<{ name: string; value: number }[]>(
    []
  );
  const [xAxisData, setXAxisData] = useState<string[]>(currentMonthDays);
  const [dateRange, setDateRange] = useState<string[]>(currentMonthDays);
  const [topUserList, setTopUseList] = useState<string[]>([]);

  const data = useContext(DashboardContext)?.model_usage || {};

  const handleSelectDate = (dateString: string) => {};

  const generateData = () => {
    const requestList: {
      name: string;
      color: string;
      areaStyle: any;
      data: { time: string; value: number }[];
    } = {
      name: 'API Request',
      areaStyle: {},
      color: baseColorMap.base,
      data: []
    };

    const completionData: any = {
      name: 'completion_token',
      color: baseColorMap.base,
      data: []
    };
    const prompData: any = {
      name: 'prompt_token',
      color: baseColorMap.baseR3,
      data: []
    };

    const topUserPrompt: any = {
      name: 'prompt_token',
      color: baseColorMap.baseR3,
      data: []
    };
    const topUserCompletion: any = {
      name: 'completion_token',
      color: baseColorMap.base,
      data: []
    };
    const users: string[] = [];

    _.each(dateRange, (date: string) => {
      // tokens data
      const item = _.find(data.completion_token_history, (item: any) => {
        return dayjs(item.timestamp * 1000).format('YYYY-MM-DD') === date;
      });
      if (!item) {
        completionData.data.push({
          titme: date,
          value: 0
        });
      } else {
        completionData.data.push({
          value: item.value,
          time: dayjs(item.timestamp * 1000).format('YYYY-MM-DD')
        });
      }

      const promptItem = _.find(data.prompt_token_history, (item: any) => {
        return dayjs(item.timestamp * 1000).format('YYYY-MM-DD') === date;
      });
      if (!promptItem) {
        prompData.data.push({
          value: 0,
          time: date
        });
      } else {
        prompData.data.push({
          value: promptItem.value,
          time: dayjs(promptItem.timestamp * 1000).format('YYYY-MM-DD')
        });
      }

      // ============== api request data =================
      const requestItem = _.find(data.api_request_history, (item: any) => {
        return dayjs(item.timestamp * 1000).format('YYYY-MM-DD') === date;
      });

      if (!requestItem) {
        requestList.data.push({
          time: date,
          value: 0
        });
      } else {
        requestList.data.push({
          time: dayjs(requestItem.timestamp * 1000).format('YYYY-MM-DD'),
          value: requestItem.value
        });
      }
    });

    // ========== top users ============

    _.each(data.top_users, (item: any) => {
      users.push(item.username);
      topUserPrompt.data.push({
        name: item.username,
        value: item.prompt_token_count
      });
      topUserCompletion.data.push({
        name: item.username,
        value: item.completion_token_count
      });
    });

    console.log('usage=============', {
      requestList,
      xAxisData
    });

    setRequestData([requestList]);
    setUserData([topUserCompletion, topUserPrompt]);
    setTopUseList(users);
    setTokenData([completionData, prompData]);
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
                <LineChart
                  title={intl.formatMessage({ id: 'dashboard.apirequest' })}
                  seriesData={requestData}
                  xAxisData={xAxisData}
                  xField="time"
                  yField="value"
                  height={360}
                  color={baseColorMap.baseR3}
                  labelFormatter={labelFormatter}
                ></LineChart>
              </Col>
              <Col span={12}>
                <BarChart
                  title={intl.formatMessage({ id: 'dashboard.tokens' })}
                  seriesData={tokenData}
                  xAxisData={xAxisData}
                  height={360}
                  labelFormatter={labelFormatter}
                ></BarChart>
              </Col>
            </Row>
          </CardWrapper>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={8}>
          <CardWrapper>
            <HBar
              title={intl.formatMessage({ id: 'dashboard.topusers' })}
              seriesData={userData}
              xAxisData={topUserList}
              height={360}
            ></HBar>
          </CardWrapper>
        </Col>
      </Row>
    </>
  );
};

export default Usage;
