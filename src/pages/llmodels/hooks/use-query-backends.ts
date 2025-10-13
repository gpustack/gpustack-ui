import { backendOptionsAtom } from '@/atoms/models';
import { useAtom } from 'jotai';
import { queryBackendList } from '../apis';

export default function useQueryBackends() {
  const [backendOptions, setBackendOptions] = useAtom(backendOptionsAtom);

  const getBackendOptions = async (params?: { cluster_id: number }) => {
    try {
      const res = await queryBackendList(params);
      const list = res?.items?.map((item) => {
        return {
          value: item.backend_name,
          label: item.backend_show_name,
          default_backend_param: item.default_backend_param || [],
          default_version: item.default_version,
          versions: (item.versions || []).map((version) => ({
            label: version,
            value: version
          }))
        };
      });
      if (res?.items) {
        setBackendOptions(list || []);
      }
    } catch (error) {
      // ignore
      setBackendOptions([]);
    }
  };

  return {
    backendOptions,
    getBackendOptions
  };
}
