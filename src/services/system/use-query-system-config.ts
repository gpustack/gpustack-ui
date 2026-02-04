import { useQueryData } from '@/hooks/use-query-data-list';
import { SystemConfig } from '@/pages/cluster-management/config/types';
import { request } from '@umijs/max';

export const SYSTEM_CONFIG_API = '/config';

const useQuerySystemConfig = () => {
  async function querySystemConfig() {
    return request<SystemConfig>(`${SYSTEM_CONFIG_API}`, {
      method: 'GET'
    });
  }
  const { detailData, loading, cancelRequest, fetchData } =
    useQueryData<SystemConfig>({
      key: 'system-config',
      fetchDetail: querySystemConfig
    });

  return {
    systemConfig: detailData,
    loading,
    cancelRequest,
    fetchSystemConfig: fetchData
  };
};

export default useQuerySystemConfig;
