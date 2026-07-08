import { getGPUStackPlugin } from '@/plugins';
import { ThemeTag } from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import useUserDirectory from '../hooks/use-user-directory';

/**
 * Owner tag for template cards, disambiguating same-name templates in
 * the admin's cross-tenant view. Renders nothing for non-admin callers
 * (gated on `canSeeAdmin`) and when a plugin provides its own
 * `OwnerScopeTag` slot.
 */
const OwnerTag: React.FC<{ ownerId?: number | null }> = ({ ownerId }) => {
  const intl = useIntl();
  const access = useAccess();
  const pluginOwnsTag = !!getGPUStackPlugin()?.components?.OwnerScopeTag;
  const show = !!access.canSeeAdmin && !pluginOwnsTag;
  const users = useUserDirectory(show);

  if (!show) {
    return null;
  }

  if (ownerId == null) {
    return (
      <ThemeTag color="gold" style={{ fontWeight: 400 }}>
        {intl.formatMessage({ id: 'gpuservice.owner.global' })}
      </ThemeTag>
    );
  }

  const username = users.get(ownerId);
  if (!username) {
    // Directory still loading, or a non-USER principal (built-in
    // platform principal) — nothing meaningful to show on a card.
    return null;
  }

  return (
    <ThemeTag color="blue" style={{ fontWeight: 400 }}>
      {username}
    </ThemeTag>
  );
};

export default OwnerTag;
