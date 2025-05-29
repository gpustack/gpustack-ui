import dayjs from 'dayjs';
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

const getLast30Days = () => {
  const dates: string[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    dates.push(date);
  }

  return dates;
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
    const dateRange = getLast30Days();

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
      areaStyle: {
        color: 'rgba(13,171,219,0.15)'
      },
      color: baseColorMap.baseR1,
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
