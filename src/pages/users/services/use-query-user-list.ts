import { useQueryDataList } from '@/hooks/use-query-data-list';
import { useAccess } from '@umijs/max';
import { queryUserDirectory } from '../apis';
import { ListItem } from '../config/types';

// Backed by `/user-directory`, which the BE opens to platform admin AND
// Org owners (the admin-only `/users` endpoint would 403 the latter).
// `canSeeOrgAdmin` mirrors the same gate on the FE so non-admin Org
// owners can populate user pickers without hitting an error.
export const useQueryUserList = (optons?: {
  getLabel?: (item: ListItem) => string;
  getValue?: (item: ListItem) => any;
}) => {
  const access = useAccess();
  const { dataList, loading, fetchData, cancelRequest } = useQueryDataList<
    ListItem,
    Global.SearchParams
  >({
    key: 'userList',
    fetchList: queryUserDirectory,
    getLabel: optons?.getLabel,
    getValue: optons?.getValue
  });

  const fetchUserList = (params: Global.SearchParams) => {
    if (!access.canSeeOrgAdmin) return;
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
