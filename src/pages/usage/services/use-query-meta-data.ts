import { useQueryData } from '@/hooks/use-query-data-list';
import { useModel } from '@umijs/max';
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

// Organizations and groups are grouped by entity id rather than snapshots.
const optionValue = (
  id: string | number | null | undefined,
  index: number
): string => (id != null ? `id:${id}` : `row:${index}`);

type UsageDimension = 'route' | 'user' | 'api_key';

// Match the backend's identity fields: one entity id can have several
// historical names or API key snapshots. Labels, deletion state and row
// order must not change the value used for selection and virtual-list keys.
const usageOptionValue = (
  dimension: UsageDimension,
  { current, value }: UsageFilterItem['identity']
): string => {
  const fields =
    dimension === 'route'
      ? [current?.route_id, value.route_name]
      : dimension === 'user'
        ? [current?.user_id, value.user_name]
        : [
            current?.api_key_id,
            current?.user_id,
            value.user_name,
            value.api_key_name,
            value.access_key,
            value.api_key_is_custom
          ];
  return JSON.stringify(fields.map((field) => field ?? null));
};

const usageOptions = (items: UsageFilterItem[], dimension: UsageDimension) => {
  const options = new Map<string, UsageFilterItem & { value: string }>();
  items.forEach((item) => {
    const value = usageOptionValue(dimension, item.identity);
    // Identical wire identities have the same filtering semantics, including
    // legacy API key rows whose current identity is absent.
    if (!options.has(value)) {
      options.set(value, { ...item, value });
    }
  });
  return Array.from(options.values());
};

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
    organizations: RouteOptionType[];
    user_groups: RouteOptionType[];
  }>({
    users: [],
    api_keys: [],
    routes: [],
    organizations: [],
    user_groups: []
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
      users: usageOptions(sortedUsers, 'user').map((item) => ({
        ...item,
        isCurrent:
          item.identity.current?.user_id === initialState?.currentUser?.id
      })),
      api_keys: groupToOptions(
        usageOptions(res?.filters?.api_keys || [], 'api_key'),
        {
          getGroupKey: (item) =>
            item.identity.value.user_name || 'unknown_user',
          getGroupType: (item) =>
            item.identity.value.api_key_is_custom ? 'custom' : 'default',
          getChild: (item) => ({
            ...item,
            label: item.identity.value.api_key_name || ''
          })
          // Deleted keys sink to the bottom within each user group.
        }
      ).map((group) => ({
        ...group,
        children: [...group.children].sort(
          (a, b) => Number(!!(a as any).deleted) - Number(!!(b as any).deleted)
        )
      })),
      // Deleted models sink to the bottom of the dropdown.
      routes: usageOptions(res?.filters?.routes || [], 'route').sort(
        (a, b) => Number(!!a.deleted) - Number(!!b.deleted)
      ),
      // Platform-wide "All" view only (backend returns these empty otherwise).
      // Deleted orgs sink to the bottom; groups are never flagged deleted.
      organizations:
        (res?.filters?.organizations || [])
          .map((item, index) => ({
            ...item,
            value: optionValue(item.identity.current?.organization_id, index)
          }))
          .sort((a, b) => Number(!!a.deleted) - Number(!!b.deleted)) || [],
      user_groups:
        (res?.filters?.user_groups || []).map((item, index) => ({
          ...item,
          value: optionValue(item.identity.current?.group_id, index)
        })) || []
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
