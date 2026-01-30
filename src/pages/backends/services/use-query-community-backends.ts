import { useState } from 'react';
import { queryBackendsList } from '../apis';

const useQueryCommunityBackends = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [dataList, setDataList] = useState<any[]>([]);

  const fetchCommunityBackends = async (params?: any) => {
    try {
      setLoading(true);
      const response = await queryBackendsList({
        page: -1,
        community: 1,
        ...params
      });
      setDataList(response.items || []);
    } catch (error) {
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };
  return {
    loading,
    dataList,
    fetchCommunityBackends
  };
};
export default useQueryCommunityBackends;
