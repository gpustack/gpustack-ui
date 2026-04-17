export const groupByOptions = [
  {
    value: '',
    label: 'None'
  },
  {
    value: 'model',
    label: 'Model'
  },
  {
    value: 'user',
    label: 'User'
  },
  {
    value: 'api_key',
    label: 'API Key'
  }
];

export const granularities = [
  {
    value: 'day',
    label: 'Day'
  },
  {
    value: 'week',
    label: 'Week'
  },
  {
    value: 'month',
    label: 'Month'
  }
];

export const metricOptions = [
  {
    value: 'input_tokens',
    label: 'Input Tokens'
  },
  {
    value: 'output_tokens',
    label: 'Output Tokens'
  },
  {
    value: 'total_tokens',
    label: 'Total Tokens'
  },
  {
    value: 'api_requests',
    label: 'API Requests'
  }
];

export const scopeOptions = [
  {
    value: 'all',
    label: 'All Users'
  },
  {
    value: 'self',
    label: 'My Usage'
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
