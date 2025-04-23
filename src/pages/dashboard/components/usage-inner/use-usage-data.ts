import dayjs from 'dayjs';
import _ from 'lodash';
import { useMemo } from 'react';

const baseColorMap = {
  baseL2: 'rgba(13,171,219,0.8)',
  baseL1: 'rgba(0,34,255,0.8)',
  base: 'rgba(0,85,255,0.8)',
  baseR1: 'rgba(0,255,233,0.8)',
  baseR2: 'rgba(48,0,255,0.8)',
  baseR3: 'rgba(85,167,255,0.8)'
};

interface RequestTokenData {
  requestData: {
    name: string;
    color: string;
    areaStyle: any;
    data: { time: string; value: number }[];
  }[];
  tokenData: {
    data: { time: string; value: number }[];
  }[];
  xAxisData: string[];
}

interface TopUserData {
  userData: { name: string; value: number }[];
  topUserList: string[];
}

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

const getLast30Days = () => {
  const dates: string[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    dates.push(date);
  }

  return dates;
};

const getAdjustedDateRange = (startDate: number, endDate: number): string[] => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const diff = end.diff(start, 'day') + 1;

  const targetRange = 30;
  const diffDays = targetRange - diff;

  let preDays = Math.ceil(diffDays / 2);
  let postDays = Math.floor(diffDays / 2);

  // if the difference is more than 30 days, adjust the start and end dates
  if (diff >= targetRange) {
    return Array.from({ length: targetRange }, (_, i) =>
      end.subtract(i, 'day').format('YYYY-MM-DD')
    ).reverse();
  }

  const adjustedStart = start.subtract(preDays, 'day');
  const adjustedEnd = end.add(postDays, 'day');

  const totalDays = adjustedEnd.diff(adjustedStart, 'day') + 1;

  const dateRange: string[] = [];

  for (let i = 0; i < totalDays; i++) {
    dateRange.push(adjustedStart.add(i, 'day').format('YYYY-MM-DD'));
  }

  console.log('dateRange', dateRange, diff);

  return dateRange;
};

const findByDate = (list: any[], date: string) => {
  return list.find(
    (item) => dayjs(item.timestamp * 1000).format('YYYY-MM-DD') === date
  );
};

export default function useUseageData(data: any) {
  const usageData = useMemo<{
    requestTokenData: RequestTokenData;
    topUserData: TopUserData;
  }>(() => {
    let topUserData: TopUserData = {
      userData: [],
      topUserList: []
    };

    let requestTokenData: RequestTokenData = {
      requestData: [],
      tokenData: [],
      xAxisData: []
    };

    const startDate = _.get(data?.api_request_history, '0.timestamp', 0);
    const endDate = _.get(
      data?.api_request_history || [],
      data?.api_request_history?.length - 1,
      0
    ).timestamp;

    const currentMonthDays = getAdjustedDateRange(
      startDate * 1000,
      endDate * 1000
    );

    const completionTokenHistory = data.completion_token_history || [];
    const promptTokenHistory = data.prompt_token_history || [];
    const apiRequestHistory = data.api_request_history || [];
    const topUsers = data.top_users || [];

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
    const promptData: any = {
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

    _.each(currentMonthDays, (date: string) => {
      // tokens data

      const item = findByDate(data.completion_token_history || [], date);
      if (!item) {
        completionData.data.push({
          time: date,
          value: 0
        });
      } else {
        completionData.data.push({
          value: item.value,
          time: dayjs(item.timestamp * 1000).format('YYYY-MM-DD')
        });
      }

      const promptItem = findByDate(data.prompt_token_history || [], date);
      if (!promptItem) {
        promptData.data.push({
          value: 0,
          time: date
        });
      } else {
        promptData.data.push({
          value: promptItem.value,
          time: dayjs(promptItem.timestamp * 1000).format('YYYY-MM-DD')
        });
      }

      // ============== api request data =================

      const requestItem = findByDate(data.api_request_history || [], date);

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
      topUserData = {
        userData: [],
        topUserList: []
      };
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

      topUserData = {
        userData: [topUserCompletion, topUserPrompt],
        topUserList: _.uniq(users)
      };
    }

    requestTokenData = {
      requestData: [requestList],
      tokenData: [completionData, promptData],
      xAxisData: currentMonthDays
    };

    return {
      requestTokenData,
      topUserData
    };
  }, [data]);

  return usageData;
}
