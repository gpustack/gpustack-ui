import { useQueryData } from '@/hooks/use-query-data-list';
import { useModel } from '@@/plugin-model';
import { useState } from 'react';
import { queryUsageMetaData } from '../apis';
import { GroupOption, groupToOptions } from '../config';
import { UsageFilterItem, UsageMeta } from '../config/types';

type UserOptionType = UsageFilterItem & {
  value: string;
};

type RouteOptionType = UsageFilterItem & {
  value: string;
};

// The multi-select keys options by ``value``; two entries sharing a display
// name (e.g. an active model and a deleted one with the same name) must get
// DIFFERENT values or selecting one selects the other. Prefer the real id;
// id-less (deleted) entries fall back to a per-row token so they stay
// independently selectable.
const optionValue = (
  id: string | number | null | undefined,
  index: number
): string => (id != null ? `id:${id}` : `row:${index}`);

export default function useQueryUsageMetaData() {
  const { detailData, loading, cancelRequest, fetchData } =
    useQueryData<UsageMeta>({
      fetchDetail: queryUsageMetaData,
      key: 'usageMetaData'
    });
  const { initialState } = useModel('@@initialState');
  const [result, setResult] = useState<{
    users: UserOptionType[];
    api_keys: GroupOption<UsageFilterItem>[];
    routes: RouteOptionType[];
  }>({
    users: [],
    api_keys: [],
    routes: []
  });

  // Current account first, deleted entries last, everything else keeps its
  // incoming order (sort is stable).
  const sortUsers = (users: UsageFilterItem[]) => {
    const currentUserId = initialState?.currentUser?.id;
    const rank = (u: UsageFilterItem) =>
      currentUserId && u.identity.current?.user_id === currentUserId
        ? 0
        : u.deleted
          ? 2
          : 1;
    return [...users].sort((a, b) => rank(a) - rank(b));
  };

  const queryMetaData = async () => {
    const res = await fetchData({});
    const sortedUsers = sortUsers(res?.filters?.users || []);
    const data = {
      users:
        sortedUsers.map((item, index) => ({
          value: optionValue(item.identity.current?.user_id, index),
          isCurrent:
            item.identity.current?.user_id === initialState?.currentUser?.id,
          ...item
        })) || [],
      api_keys: groupToOptions(res?.filters?.api_keys || [], {
        getGroupKey: (item) => item.identity.value.user_name || 'unknown_user',
        getGroupType: (item) =>
          item.identity.value.api_key_is_custom ? 'custom' : 'default',
        getChild: (item, index) => ({
          ...item,
          value: optionValue(item.identity.current?.api_key_id, index),
          label: item.identity.value.api_key_name || ''
        })
        // Deleted keys sink to the bottom within each user group.
      }).map((group) => ({
        ...group,
        children: [...group.children].sort(
          (a, b) => Number(!!(a as any).deleted) - Number(!!(b as any).deleted)
        )
      })),
      // Deleted models sink to the bottom of the dropdown.
      routes:
        (res?.filters?.routes || [])
          .map((item, index) => ({
            ...item,
            value: optionValue(item.identity.current?.route_id, index)
          }))
          .sort((a, b) => Number(!!a.deleted) - Number(!!b.deleted)) || []
    };
    setResult(data);
  };

  return {
    detailData: result,
    loading,
    cancelRequest,
    fetchData: queryMetaData
  };
}
