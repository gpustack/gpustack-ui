import { request } from '@umijs/max';

export const DASHBOARD_API = '/dashboard';

export async function queryDashboardData() {
  return request(DASHBOARD_API);
}

export async function queryDashboardUsageData() {
  // return request(`${DASHBOARD_API}/usage`);
  return {};
}
