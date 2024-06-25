import { request } from '@umijs/max';
import { ListItem } from '../config/types';

export const WORKERS_API = '/workers';

export async function queryWorkersList(
  params: Global.Pagination & { query?: string }
) {
  return request<Global.PageResponse<ListItem>>(`${WORKERS_API}`, {
    methos: 'GET',
    params
  });
}
