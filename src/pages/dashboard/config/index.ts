import {
  BreakdownItem,
  UsageBreakdownResponse
} from '@/pages/usage/config/types';
import { withDeletedMark } from '@/pages/usage/utils/deleted-label';
import { getIntl } from '@umijs/max';

// group dimension → the id field inside ``identity.current`` (the backend nulls
// it for deleted entities, so the marker degrades to just "[Deleted]").
const GROUP_ID_KEY: Record<
  UsageGroupBy,
  'model_id' | 'route_id' | 'user_id' | 'api_key_id'
> = {
  model: 'model_id',
  route: 'route_id',
  user: 'user_id',
  api_key: 'api_key_id'
};

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

  let baseLabel: string;
  if (groupBy === 'model') {
    const providerName =
      identityValue?.provider_name || groupValue?.provider_name;
    const modelName =
      identityValue?.model_name ||
      groupValue?.model_name ||
      rawItem.model_name ||
      rawItem.model;

    baseLabel =
      providerName && modelName
        ? `${providerName}/${modelName}`
        : groupItem?.label || modelName || '-';
  } else if (groupBy === 'route') {
    baseLabel =
      groupItem?.label ||
      identityValue?.route_name ||
      groupValue?.route_name ||
      '-';
  } else {
    baseLabel =
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
      '-';
  }

  // Mark deleted entities in the chart legend / tooltip as text (a legend can't
  // render a tag), matching the usage tabs. The id degrades to just "[Deleted]"
  // when the backend nulls ``identity.current`` for a deleted entity.
  const deletedWord = getIntl().formatMessage({ id: 'usage.table.deleted' });
  const id = groupItem?.identity?.current?.[GROUP_ID_KEY[groupBy]];
  return withDeletedMark(baseLabel, groupItem?.deleted, deletedWord, id);
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

export type UsageTokenMetric = 'input_tokens' | 'output_tokens';

export interface UsageTokenSeriesDef {
  name: string;
  key: UsageTokenMetric;
  color: string;
}

// Aggregates each group's input/output tokens into a stacked HBarChart shape,
// so a single bar shows prompt (input) and completion (output) tokens side by
// side. Rows sharing a group (e.g. the same user across dates) are summed, then
// ranked by combined tokens and capped at the top 10.
export const toUsageTokenBreakdownData = (
  data: UsageBreakdownResponse | null | undefined,
  groupBy: UsageGroupBy,
  seriesDefs: UsageTokenSeriesDef[]
) => {
  const itemMap = new Map<string, { total: number; values: number[] }>();
  const items = getUsageResponseItems(data);

  items.forEach((item: BreakdownItem) => {
    const name = buildUsageLabel(item, groupBy);
    const entry = itemMap.get(name) || {
      total: 0,
      values: seriesDefs.map(() => 0)
    };

    seriesDefs.forEach((def, index) => {
      const value = Number((item as any)?.[def.key] ?? 0);
      entry.values[index] += value;
      entry.total += value;
    });

    itemMap.set(name, entry);
  });

  const ranked = Array.from(itemMap.entries())
    .filter(([, entry]) => entry.total > 0)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  const names = ranked.map(([name]) => name);

  // Round only the outer ends of the stacked bar; the seam where the input and
  // output segments meet stays square ([topLeft, topRight, bottomRight, bottomLeft]).
  const radius = 2;
  const getBorderRadius = (index: number, count: number) => {
    if (count <= 1) {
      return [radius, radius, radius, radius];
    }
    if (index === 0) {
      return [radius, 0, 0, radius];
    }
    if (index === count - 1) {
      return [0, radius, radius, 0];
    }
    return [0, 0, 0, 0];
  };

  return {
    names,
    series: seriesDefs.map((def, index) => ({
      name: def.name,
      color: def.color,
      data: ranked.map(([name, entry]) => ({
        name,
        value: entry.values[index],
        itemStyle: {
          borderRadius: getBorderRadius(index, seriesDefs.length)
        }
      }))
    }))
  };
};
