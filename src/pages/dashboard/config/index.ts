import {
  BreakdownItem,
  UsageBreakdownResponse
} from '@/pages/usage/config/types';

export const overviewConfigs = [
  {
    key: 'cluster_count',
    label: 'dashboard.clusters',
    backgroundColor: 'var(--color-white-1)'
  },
  {
    key: 'worker_count',
    label: 'dashboard.workers',
    backgroundColor: 'var(--color-white-1)'
  },
  {
    key: 'gpu_count',
    label: 'dashboard.totalgpus',
    backgroundColor: 'var(--color-white-1)'
  },

  {
    key: 'model_count',
    label: 'dashboard.deployments',
    backgroundColor: 'var(--color-white-1)'
  },
  {
    key: 'model_instance_count',
    label: 'models.form.replicas',
    backgroundColor: 'var(--color-white-1)'
  }
];

export const baseColorMap = {
  baseL2: 'rgba(13,171,219,0.8)',
  baseL1: 'rgba(0,34,255,0.8)',
  base: 'rgba(0,85,255,0.8)',
  baseR1: 'rgb(102, 214, 224)',
  baseR2: 'rgba(48,0,255,0.8)',
  baseR3: 'rgba(85,167,255,0.8)'
};

export type UsageGroupBy = 'model' | 'route' | 'user' | 'api_key';
export type UsageMetric = 'total_tokens' | 'api_requests';

export interface UsageChartDatum {
  name: string;
  value: number;
}

export interface DashboardUsageCommonParams {
  start_date: string;
  end_date: string;
  scope: string;
  granularity: string;
  filters: Record<string, any>;
}

export const usageChartHeight = 300;
export const usageChartCardHeight = usageChartHeight + 52;

export const usageRankMaxItems = 10;
export const usageRankDefaultHeight = 460;
export const usageRankMinHeight = 300;
export const usageRankItemHeight = 46;

export const getUsageRankHeight = (count: number) => {
  const safeCount = Math.min(Math.max(count, 0), usageRankMaxItems);
  return Math.max(
    usageRankMinHeight,
    usageRankDefaultHeight -
      (usageRankMaxItems - safeCount) * usageRankItemHeight
  );
};

export const getUsageRankSlotCount = (height: number) => {
  return Math.max(Math.floor(height / usageRankItemHeight), 1);
};

export const buildUsageLabel = (item: BreakdownItem, groupBy: UsageGroupBy) => {
  const rawItem = item as any;
  const groupItem = rawItem[groupBy];
  const identityValue = groupItem?.identity?.value;
  const groupValue = groupItem?.value;

  if (typeof groupItem === 'string') {
    return groupItem;
  }

  if (groupBy === 'model') {
    const providerName =
      identityValue?.provider_name || groupValue?.provider_name;
    const modelName =
      identityValue?.model_name ||
      groupValue?.model_name ||
      rawItem.model_name ||
      rawItem.model;

    if (providerName && modelName) {
      return `${providerName}/${modelName}`;
    }

    return groupItem?.label || modelName || '-';
  }

  if (groupBy === 'route') {
    return (
      groupItem?.label ||
      identityValue?.route_name ||
      groupValue?.route_name ||
      '-'
    );
  }

  return (
    groupItem?.label ||
    identityValue?.user_name ||
    identityValue?.api_key_name ||
    identityValue?.access_key ||
    groupValue?.user_name ||
    groupValue?.api_key_name ||
    groupValue?.access_key ||
    rawItem.user_name ||
    rawItem.api_key_name ||
    rawItem.access_key ||
    rawItem[groupBy] ||
    '-'
  );
};

export const getUsageResponseItems = (
  data: UsageBreakdownResponse | null | undefined
) => {
  const response = data as any;
  return response?.items || response?.data?.items || [];
};

export const getUsageResponseSeries = (
  data: UsageBreakdownResponse | null | undefined
) => {
  const response = data as any;
  return response?.series || response?.data?.series || [];
};

export const getUsageMetricValue = (item: any, metric: UsageMetric) => {
  return Number(
    item?.[metric] ??
      item?.metrics?.[metric] ??
      item?.summary?.[metric] ??
      item?.value ??
      0
  );
};

export const aggregateUsageByGroup = (
  data: UsageBreakdownResponse | null | undefined,
  groupBy: UsageGroupBy,
  metric: UsageMetric
): UsageChartDatum[] => {
  const itemMap = new Map<string, number>();
  const items = getUsageResponseItems(data);

  items.forEach((item: BreakdownItem) => {
    const name = buildUsageLabel(item, groupBy);
    itemMap.set(
      name,
      (itemMap.get(name) || 0) + getUsageMetricValue(item, metric)
    );
  });

  if (!items.length) {
    getUsageResponseSeries(data).forEach((item: any) => {
      const name = item.label || buildUsageLabel(item, groupBy);
      const value = (item.timeline || []).reduce(
        (sum: number, point: any) => {
          return sum + getUsageMetricValue(point, metric);
        },
        getUsageMetricValue(item, metric)
      );

      itemMap.set(name, (itemMap.get(name) || 0) + value);
    });
  }

  if (!itemMap.size) {
    return [];
  }

  const hasPositiveValue = Array.from(itemMap.values()).some(
    (value) => value > 0
  );

  if (!hasPositiveValue) {
    return [];
  }

  return Array.from(itemMap.entries())
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
};

export const getUsageSummaryData = (
  dataList: Array<UsageBreakdownResponse | null | undefined>
) => {
  return dataList.find((item) => {
    const summary = item?.summary || (item as any)?.data?.summary;
    return summary;
  });
};

export const getUsageSummary = (
  data: UsageBreakdownResponse | null | undefined
) => {
  return data?.summary || (data as any)?.data?.summary;
};

export const toUsagePieData = (
  data: UsageBreakdownResponse | null | undefined,
  groupBy: UsageGroupBy,
  metric: UsageMetric
): UsageChartDatum[] => {
  return aggregateUsageByGroup(data, groupBy, metric);
};

export const toUsageRankData = (
  data: UsageBreakdownResponse | null | undefined,
  groupBy: UsageGroupBy,
  seriesName: string,
  color: string
) => {
  const items = aggregateUsageByGroup(data, groupBy, 'total_tokens');
  const names = items.map((item) => item.name);

  return {
    names,
    series: [
      {
        name: seriesName,
        color,
        data: items.map((item) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            borderRadius: [2, 2, 2, 2]
          }
        }))
      }
    ]
  };
};
