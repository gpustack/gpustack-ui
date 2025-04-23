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

  return dateRange;
};

const generateValueMap = (list: { timestamp: number; value: number }[]) => {
  return new Map(
    list.map((item) => [
      dayjs(item.timestamp * 1000).format('YYYY-MM-DD'),
      item.value
    ])
  );
};

const generateData = (dateRage: string[], valueMap: Map<string, number>) => {
  return dateRage.map((date) => {
    const value = valueMap.get(date) || 0;
    return {
      time: date,
      value: value
    };
  });
};

export default function useUseageData(data: any) {
  const usageData = useMemo<{
    requestTokenData: RequestTokenData;
    topUserData: TopUserData;
  }>(() => {
    const startDate = _.get(data?.api_request_history, '0.timestamp', 0);
    const endDate = _.get(
      data?.api_request_history || [],
      data?.api_request_history?.length - 1,
      0
    ).timestamp;

    const dateRange = getAdjustedDateRange(startDate * 1000, endDate * 1000);

    const completionTokenHistory = data.completion_token_history || [];
    const promptTokenHistory = data.prompt_token_history || [];
    const apiRequestHistory = data.api_request_history || [];
    const topUsers = data.top_users || [];

    if (!completionTokenHistory.length) {
      return {
        requestTokenData: {
          requestData: [],
          tokenData: [],
          xAxisData: []
        },
        topUserData: {
          userData: [],
          topUserList: []
        }
      };
    }

    // ========== API request ==============
    const requestList: {
      name: string;
      color: string;
      areaStyle: any;
      data: { time: string; value: number }[];
    } = {
      name: 'API requests',
      areaStyle: {},
      color: baseColorMap.base,
      data: generateData(dateRange, generateValueMap(apiRequestHistory))
    };

    // =========== token usage data ==============
    const completionData: any = {
      name: 'Completion tokens',
      color: baseColorMap.base,
      data: generateData(dateRange, generateValueMap(completionTokenHistory))
    };
    const promptData: any = {
      name: 'Prompt tokens',
      color: baseColorMap.baseR3,
      data: generateData(dateRange, generateValueMap(promptTokenHistory))
    };

    // ========== top user data ==============
    const topUserPrompt: any = {
      name: 'Prompt tokens',
      color: baseColorMap.baseR3,
      data: [] as { name: string; value: number }[]
    };
    const topUserCompletion: any = {
      name: 'Completion tokens',
      color: baseColorMap.base,
      data: [] as { name: string; value: number }[]
    };

    const topUserNames = topUsers.map((item: any) => {
      topUserPrompt.data.push({
        name: item.username,
        value: item.prompt_token_count
      });
      topUserCompletion.data.push({
        name: item.username,
        value: item.completion_token_count
      });
      return item.username;
    });

    return {
      requestTokenData: {
        requestData: [requestList],
        tokenData: [completionData, promptData],
        xAxisData: dateRange
      },
      topUserData: {
        userData: [topUserCompletion, topUserPrompt],
        topUserList: [...new Set(topUserNames)] as string[]
      }
    };
  }, [data]);

  return usageData;
}
