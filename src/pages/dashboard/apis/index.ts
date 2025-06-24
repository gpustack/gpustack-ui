import { request } from '@umijs/max';
import qs from 'query-string';

export const DASHBOARD_API = '/dashboard';

export const DASHBOARD_USAGE_API = `${DASHBOARD_API}/usage`;
export const DASHBOARD_STATS_API = `${DASHBOARD_API}/usage/stats`;

export async function queryDashboardData() {
  return request(DASHBOARD_API);
}

export async function queryDashboardUsageData<T>(
  params: {
    start_date: string;
    end_date: string;
    model_ids?: number[];
    user_ids?: number[];
    raw?: boolean;
  },
  options: {
    url: string;
    token?: any;
  }
) {
  return request<T>(`${options.url}?${qs.stringify(params)}`, {
    method: 'GET',
    cancelToken: options?.token
  });
}
