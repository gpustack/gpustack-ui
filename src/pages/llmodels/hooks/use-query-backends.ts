import { backendOptionsAtom } from '@/atoms/models';
import { useIntl } from '@umijs/max';
import { useAtom } from 'jotai';
import { queryBackendList } from '../apis';
import { backendOptionsMap } from '../config/backend-parameters';
import { BackendOption } from '../config/types';

export default function useQueryBackends() {
  const [backendOptions, setBackendOptions] = useAtom(backendOptionsAtom);
  const intl = useIntl();

  const getBackendOptions = async (params?: { cluster_id: number }) => {
    try {
      const res = await queryBackendList(params);
      const list: BackendOption[] = res?.items?.map((item) => {
        return {
          value: item.backend_name,
          label:
            item.backend_name === backendOptionsMap.custom
              ? intl.formatMessage({ id: 'backend.custom' })
              : item.backend_name,
          title:
            item.backend_name === backendOptionsMap.custom
              ? intl.formatMessage({ id: 'backend.custom' })
              : item.backend_name.replace(/-custom$/, ''),
          default_backend_param: item.default_backend_param || [],
          default_version: item.default_version,
          isBuiltIn: item.is_built_in,
          versions: (item.versions || []).map((vItem, index) => ({
            label: vItem.version,
            value: vItem.version,
            is_deprecated: vItem.is_deprecated,
            title: vItem.version.replace(/-custom$/, '')
          }))
        };
      });

      if (res?.items) {
        setBackendOptions(list);
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
