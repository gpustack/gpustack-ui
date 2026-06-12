import { getGPUStackPlugin } from '@/plugins';
import { AutoTooltip } from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import { useMemo } from 'react';
import useUserDirectory from './use-user-directory';

type CreatorAware = {
  creator_id?: number | null;
  owner_principal_id?: number | null;
};

// Concrete column shape rather than antd's `ColumnsType` union:
// spreading a union-typed array into a page's column literal breaks
// contextual typing for the sibling inline columns (their render
// params degrade to implicit `any`), while a concrete object type
// composes cleanly — same contract the plugin columns use.
type CreatorColumn<T> = {
  title: string;
  key: string;
  ellipsis: { showTitle: false };
  render: (text: any, record: T) => React.ReactNode;
};

export const CreatorLabel: React.FC<{
  record: CreatorAware;
  users: Map<number, string>;
}> = ({ record, users }) => {
  // Legacy rows predate `creator_id`. A personal-scope row's creator
  // IS its owner, so the owner id doubles as the fallback — the same
  // derivation the backend migration backfills with; keeping it here
  // covers servers that haven't run the migration yet.
  const id = record.creator_id ?? record.owner_principal_id;
  const username = id != null ? users.get(id) : undefined;
  if (username) {
    return (
      <AutoTooltip ghost maxWidth={240}>
        {username}
      </AutoTooltip>
    );
  }
  // Unresolvable: the directory is still loading, or a legacy row
  // whose only attribution is a non-USER principal (platform-owned).
  return <span>-</span>;
};

/**
 * "Creator" column for the GPU-service list pages, attributing each
 * row to the user who created it — disambiguates same-name rows from
 * different users in the admin's cross-tenant view, and reads as a
 * plain username for admin-created rows too. Returns `[]` for
 * non-admin callers (their lists only ever contain their own rows)
 * and when a plugin registers list columns for `pageKey` — the
 * plugin's own attribution column covers the same ground.
 */
const useCreatorColumn = <T extends CreatorAware>(
  pageKey: string
): CreatorColumn<T>[] => {
  const intl = useIntl();
  const access = useAccess();
  const pluginOwnsSlot = !!(
    getGPUStackPlugin()?.listExtraColumns as Record<string, unknown> | undefined
  )?.[pageKey];
  const show = !!access.canSeeAdmin && !pluginOwnsSlot;
  const users = useUserDirectory(show);

  return useMemo(() => {
    if (!show) return [];
    return [
      {
        title: intl.formatMessage({ id: 'gpuservice.creator' }),
        key: 'creator',
        ellipsis: { showTitle: false as const },
        render: (_text: any, record: T) => (
          <CreatorLabel record={record} users={users} />
        )
      }
    ];
  }, [show, users, intl]);
};

export default useCreatorColumn;
