import React from 'react';

import KVCacheForm from './kv-cache';
import SpeculativeDecode from './speculative-decode';

/**
 * Model-level performance settings.
 *
 * 🔴 Not rendered at all under PD — the mount site drops the whole collapse
 * item (`forms/index.tsx`), so there is no prop here to ask about it. Both of
 * its controls stop being model-level when a group exists:
 *
 * - **The extended KV cache** is force-cleared when PD turns on, because its
 *   benefit is asymmetric — prefill saves real compute on a hit, decode only
 *   gets a fallback whose prompt KV arrives over the connector anyway. A
 *   model-level setting hands decode a cost it cannot use. It moves to the
 *   roles, where the two sides can differ.
 * - **Speculative decoding** has no `RoleSpec` field, so it cannot differ per
 *   role at all. It moves to the group-level block, which says so.
 */
const Performance: React.FC = () => {
  return (
    <>
      <div data-field="extended_kv_cache.enabled"></div>

      <KVCacheForm></KVCacheForm>
      <SpeculativeDecode></SpeculativeDecode>
    </>
  );
};

export default Performance;
