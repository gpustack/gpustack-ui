export interface UsageFilterItem {
  identity: {
    value: {
      cluster_name: string;
      model_name: string | null;
      user_name: string;
      api_key_name: string | null;
      access_key: string | null;
      api_key_is_custom: boolean | null;
      provider_type: string | null;
      provider_name: string | null;
    };
    current: {
      model_id: string | null;
      user_id: number | null;
      api_key_id: string | null;
    };
  };
  label: string;
  deleted: boolean;
}

export interface TimeSeriesSummary {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  api_requests: number;
  models_called: number;
}

export interface TimeLineItem {
  date: string;
  value: number;
}

export type TimeSeriesItem = UsageFilterItem & {
  timeline: TimeLineItem[];
};

export interface TimeSeriesData {
  summary: TimeSeriesSummary;
  metric: 'string';
  group_by: 'string';
  granularity: 'string';
  series: TimeSeriesItem[];
}

export type BreakdownItem = {
  cluster_name: string;
  model_name: string;
  user_name: string;
  api_key_name: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  api_requests: number;
  input_cached_tokens: number;
  avg_tokens_per_request: number;
  models_called: number;
  api_keys_used: number;
  last_active: string;
  provider_type: string;
  provider_name: string;
  user: UsageFilterItem;
  model: UsageFilterItem;
  api_key: UsageFilterItem;
  date: {
    value: string;
    label: string;
  };
};

export interface UsageBreakdownResponse {
  summary: TimeSeriesSummary;
  group_by: string[];
  granularity: string;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPage: number;
  };
  items: BreakdownItem[];
}

export interface UsageMeta {
  filters: {
    models: UsageFilterItem[];
    users: UsageFilterItem[];
    api_keys: UsageFilterItem[];
  };
}

export type FilterOptionType = Omit<UsageFilterItem, 'label' | 'deleted'>;
