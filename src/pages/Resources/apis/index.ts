import { request } from '@umijs/max';
import { ListItem } from '../config/types';

export const NODES_API = '/nodes';

export async function queryNodesList(
  params: Global.Pagination & { query?: string }
) {
  return request<Global.PageResponse<ListItem>>(`${NODES_API}`, {
    methos: 'GET',
    params
  });
}
