import { backendOptionsAtom } from '@/atoms/models';
import { useIntl } from '@umijs/max';
import { useAtom } from 'jotai';
import { queryBackendList } from '../apis';
import { backendOptionsMap } from '../config/backend-parameters';
import { BackendGroupOption } from '../config/types';

export default function useQueryBackends() {
  const [backendOptions, setBackendOptions] = useAtom(backendOptionsAtom);
  const intl = useIntl();

  const getBackendOptions = async (params?: { cluster_id: number }) => {
    try {
      const res = await queryBackendList(params);
      const list: BackendGroupOption[] = res?.items?.map((item) => {
        return {
          value: item.backend_name,
          label:
            item.backend_name === backendOptionsMap.custom
              ? intl.formatMessage({ id: 'backend.quickConfig' })
              : item.backend_name,
          title:
            item.backend_name === backendOptionsMap.custom
              ? intl.formatMessage({ id: 'backend.quickConfig' })
              : item.backend_name.replace(/-custom$/, ''),
          default_backend_param: item.default_backend_param || [],
          default_version: item.default_version,
          isBuiltIn: item.is_built_in,
          versions: (item.versions || []).map((vItem) => ({
            label: vItem.version,
            value: vItem.version,
            title: vItem.version.replace(/-custom$/, '')
          }))
        };
      });
      const builtInBackends = list?.filter((item) => item.isBuiltIn);
      const customBackends = list?.filter((item) => !item.isBuiltIn);

      const options = [];

      if (builtInBackends && builtInBackends.length > 0) {
        options.push({
          label: intl.formatMessage({ id: 'backend.builtin' }),
          options: builtInBackends
        });
      }

      if (customBackends && customBackends.length > 0) {
        options.push({
          label: intl.formatMessage({ id: 'backend.custom' }),
          options: customBackends
        });
      }

      if (res?.items) {
        setBackendOptions(options);
      }
      return list || [];
    } catch (error) {
      // ignore
      setBackendOptions([]);
      return [];
    }
  };

  return {
    backendOptions,
    getBackendOptions
  };
}
