import { useQueryDataList } from '@/hooks/use-query-data-list';
import { useModel } from '@@/plugin-model';
import { queryUsersList } from '../apis';
import { ListItem } from '../config/types';

export const useQueryUserList = (optons?: {
  getLabel?: (item: ListItem) => string;
  getValue?: (item: ListItem) => any;
}) => {
  const { initialState } = useModel('@@initialState');
  const { dataList, loading, fetchData, cancelRequest } = useQueryDataList<
    ListItem,
    Global.SearchParams
  >({
    key: 'userList',
    fetchList: queryUsersList,
    getLabel: optons?.getLabel,
    getValue: optons?.getValue
  });

  const fetchUserList = (params: Global.SearchParams) => {
    if (!initialState?.currentUser?.is_admin) return;
    return fetchData({
      ...params
    });
  };

  return {
    dataList,
    loading,
    fetchData: fetchUserList,
    cancelRequest
  };
};

export default useQueryUserList;
