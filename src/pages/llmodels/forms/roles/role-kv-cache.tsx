import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import React from 'react';
import { RoleValueMap } from '../../config';
import { PDMode } from '../../config/types';
import KVCacheForm from '../kv-cache';
import { RoleSection } from './override-section';

interface RoleKVCacheProps {
  mode?: PDMode;
  role?: string;
  /** The role's index in `roles`, i.e. the Form path this section writes to. */
  index: number;
  /** Reason a cache cannot be configured for this role; shown, not hidden. */
  disabledReason?: string;
}

/** A role's cache selection, filtered by the mode's provider and role recipes.
 * The shared field group writes at this role's path. Cluster and inherited
 * backend values remain model-level because they determine service eligibility.
 */
const RoleKVCache: React.FC<RoleKVCacheProps> = ({
  index,
  disabledReason,
  mode,
  role
}) => {
  const intl = useIntl();

  // Keep stored Decode cache settings intact without mounting editable fields
  // or the cache form's service-selection effects.
  if (role === RoleValueMap.Decode) {
    return null;
  }

  const section = {
    label: intl.formatMessage({ id: 'models.form.roles.group.cache' }),
    description: intl.formatMessage({ id: 'models.form.roles.cache.tips' })
  };

  // The card is drawn by whoever owns the switch. `KVCacheForm` puts the
  // switch in the title row, so it draws its own; the disabled branch has no
  // switch to place and draws the card here.
  if (disabledReason) {
    return (
      <RoleSection label={section.label} description={section.description}>
        <Alert
          type="warning"
          showIcon
          message={disabledReason}
          style={{ marginBottom: 12 }}
        ></Alert>
      </RoleSection>
    );
  }

  return (
    <KVCacheForm
      namePrefix={['roles', index]}
      section={section}
      mode={mode}
      role={role}
    ></KVCacheForm>
  );
};

export default RoleKVCache;
