import { systemConfigAtom } from '@/atoms/system';
import { setAtomStorage } from '@/atoms/utils';
import { SystemConfig } from '@/pages/cluster-management/config/types';
import { request } from '@umijs/max';

export const SYSTEM_CONFIG_API = '/config';

export const fetchSystemConfig = async () => {
  try {
    const data = await request<SystemConfig>(`${SYSTEM_CONFIG_API}`, {
      method: 'GET'
    });
    setAtomStorage(systemConfigAtom, {
      ...(data || {}),
      showMonitoring:
        !!data?.grafana_url || data?.disable_builtin_observability === false
    });
  } catch (error) {
    // handle error if needed
    setAtomStorage(systemConfigAtom, {});
  }
};
