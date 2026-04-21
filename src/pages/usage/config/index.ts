import { UsageFilterItem } from './types';

export const groupByOptions = [
  // {
  //   value: null,
  //   label: 'None'
  // },
  {
    value: 'model',
    label: 'usage.filter.group.model'
  },
  {
    value: 'user',
    label: 'usage.filter.group.user'
  },
  {
    value: 'api_key',
    label: 'usage.filter.group.apikey'
  }
];

export const granularities = [
  {
    value: 'day',
    label: 'usage.filter.granularity.day'
  },
  {
    value: 'week',
    label: 'usage.filter.granularity.week'
  },
  {
    value: 'month',
    label: 'usage.filter.granularity.month'
  }
];

export const metricOptions = [
  {
    value: 'input_tokens',
    label: 'usage.filter.inputTokens'
  },
  {
    value: 'output_tokens',
    label: 'usage.filter.outputTokens'
  },
  {
    value: 'total_tokens',
    label: 'usage.filter.totalTokens'
  },
  {
    value: 'api_requests',
    label: 'usage.filter.apiRequests'
  }
];

interface TimelineItem {
  date: string;
  value: number;
}

interface SourceItem {
  label: string;
  timeline: TimelineItem[];
}

export const transformTimelineToTable = (data: SourceItem[]) => {
  const dateMap: Record<string, Record<string, number | string>> = {};

  data.forEach((item) => {
    const label = item.label;

    item.timeline.forEach(({ date, value }) => {
      if (!dateMap[date]) {
        dateMap[date] = { date };
      }

      dateMap[date][label] = value;
    });
  });

  return Object.values(dateMap).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );
};

export const generateColumns = (data: SourceItem[]) => {
  return [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date'
    },
    ...data.map((item) => ({
      title: item.label,
      dataIndex: item.label,
      key: item.label
    }))
  ];
};

interface DataItem {
  identity: {
    value: {
      provider_name: string | null;
      provider_type: string | null;
      model_name: string;
    };
  };
  label: string;
}

interface GroupedOption {
  value: string;
  label: string;
  providerType: string;
  children: {
    label: string;
    value: string;
    identity: UsageFilterItem['identity'];
  }[];
}

export interface GroupOption<TChild> {
  value: string | number | null;
  label: string;
  type: string;
  isParent: boolean;
  children: (TChild & { value: string })[];
}

export function groupToOptions<T, TChild>(
  data: T[],
  options: {
    getGroupKey: (item: T) => string;
    getGroupType: (item: T) => string;
    getChild: (item: T) => TChild;
  }
): GroupOption<TChild>[] {
  const groupedMap = new Map<string, GroupOption<TChild>>();

  data.forEach((item) => {
    const groupKey = options.getGroupKey(item);
    const groupType = options.getGroupType(item);

    if (!groupedMap.has(groupKey)) {
      groupedMap.set(groupKey, {
        value: groupKey,
        label: groupKey,
        type: groupType,
        isParent: true,
        children: []
      });
    }

    const child = options.getChild(item) as TChild & { value: string };
    groupedMap.get(groupKey)!.children.push(child);
  });

  return Array.from(groupedMap.values());
}
