import PageTools from '@/components/page-tools';

import { useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import _ from 'lodash';
import { memo, useCallback, useContext } from 'react';
import { DashboardContext } from '../../config/dashboard-context';
import RequestTokenInner from './request-token-inner';

const baseColorMap = {
  baseL2: 'rgba(13,171,219,0.8)',
  baseL1: 'rgba(0,34,255,0.8)',
  base: 'rgba(0,85,255,0.8)',
  baseR1: 'rgba(0,255,233,0.8)',
  baseR2: 'rgba(48,0,255,0.8)',
  baseR3: 'rgba(85,167,255,0.8)'
};

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

const UsageInner: React.FC<{ paddingRight: string }> = ({ paddingRight }) => {
  const intl = useIntl();
  const currentDate = dayjs();
  const currentMonthDays = getCurrentMonthDays();
  let requestData: {
    name: string;
    color: string;
    areaStyle: any;
    data: { time: string; value: number }[];
  }[] = [];
  let tokenData: { time: string; value: number }[] = [];
  let userData: { name: string; value: number }[] = [];
  const xAxisData: string[] = currentMonthDays;
  let topUserList: string[] = [];

  const { model_usage } = useContext(DashboardContext);
  const data = model_usage || {};

  const handleSelectDate = (date: any) => {
    // fetchData?.();
  };

  const generateData = useCallback(() => {
    const requestList: {
      name: string;
      color: string;
      areaStyle: any;
      data: { time: string; value: number }[];
    } = {
      name: 'API requests',
      areaStyle: {},
      color: baseColorMap.base,
      data: []
    };

    const completionData: any = {
      name: 'Completion tokens',
      color: baseColorMap.base,
      data: []
    };
    const prompData: any = {
      name: 'Prompt tokens',
      color: baseColorMap.baseR3,
      data: []
    };

    const topUserPrompt: any = {
      name: 'Prompt tokens',
      color: baseColorMap.baseR3,
      data: []
    };
    const topUserCompletion: any = {
      name: 'Completion tokens',
      color: baseColorMap.base,
      data: []
    };

    _.each(xAxisData, (date: string) => {
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
    if (!data.top_users?.length) {
      userData = [];
      topUserList = [];
    } else {
      const users: string[] = [];
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
      topUserList = _.uniq(users);
      userData = [topUserCompletion, topUserPrompt];
    }

    requestData = [requestList];
    tokenData = [completionData, prompData];
  }, [data, xAxisData]);

  generateData();

  return (
    <>
      <PageTools />
      <RequestTokenInner
        requestData={requestData}
        xAxisData={xAxisData}
        tokenData={tokenData}
        paddingRight={paddingRight}
      ></RequestTokenInner>
    </>
  );
};

export default memo(UsageInner);
