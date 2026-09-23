import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import React from 'react';
import KVCacheForm from '../kv-cache';
import { RoleSection } from './override-section';

interface RoleKVCacheProps {
  /** The role's index in `roles`, i.e. the Form path this section writes to. */
  index: number;
  /** Reason a cache cannot be configured for this role; shown, not hidden. */
  disabledReason?: string;
}

/**
 * A role's KV cache.
 *
 * The one field group that deliberately does NOT inherit from the model, which
 * is the opposite of every other group here and needs its reasons on the
 * record:
 *
 * 1. The benefit is asymmetric. A cache on the prefill side skips the prefill
 *    compute for whatever it hits; on the decode side it is only a fallback. A
 *    model-level setting applied to both hands decode a "save to all" cost and
 *    a doubled descriptor count for nothing, while the user believes they
 *    gained something.
 * 2. The `custom` pd mode's mutual exclusion is per role: that mode needs
 *    `--kv-transfer-config` in the engine parameters, and a cache would fight
 *    it. A model-level switch cannot express "this role only".
 *
 * The section is the model-level `KVCacheForm` rendered at this role's Form
 * path, so a role gets the same merged choice the model has — the in-process
 * cache or a specific cache service — with no second control to keep in step.
 * Two of its inputs stay model-level on purpose: the cluster (a role does not
 * pick its own) and, when a role inherits its engine, the engine that decides
 * whether sharing is possible at all.
 */
const RoleKVCache: React.FC<RoleKVCacheProps> = ({ index, disabledReason }) => {
  const intl = useIntl();

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
    <KVCacheForm namePrefix={['roles', index]} section={section}></KVCacheForm>
  );
};

export default RoleKVCache;
