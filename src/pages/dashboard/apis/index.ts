import { request } from '@umijs/max';
import qs from 'query-string';

export const DASHBOARD_API = '/dashboard';

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
  options?: {
    token?: any;
  }
) {
  return request<T>(`${DASHBOARD_API}/usage?${qs.stringify(params)}`, {
    method: 'GET',
    cancelToken: options?.token
  });
}
