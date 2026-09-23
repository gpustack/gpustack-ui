import { useEffect, useState } from 'react';
import { LocationField, shownByDefault } from '../location';

const KEY_PREFIX = 'gpustack.topology.columns.';

interface ColumnPrefs {
  /** Only the columns someone toggled; the rest follow `shownByDefault`. */
  fields: Record<string, boolean>;
  gpus: boolean;
  source: boolean;
}

/** Source is off by default: the lock icon in the cell already says "auto". */
const DEFAULTS: ColumnPrefs = { fields: {}, gpus: true, source: false };

const read = (clusterId?: number | null): ColumnPrefs => {
  if (!clusterId) {
    return DEFAULTS;
  }
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${clusterId}`);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

export interface UseColumnPrefs {
  isShown: (field: LocationField) => boolean;
  setShown: (id: string, shown: boolean) => void;
  /** A deleted layer must not leave a stale toggle behind. */
  forget: (id: string) => void;
  gpus: boolean;
  source: boolean;
  setGpus: (shown: boolean) => void;
  setSource: (shown: boolean) => void;
}

/**
 * Which columns the table shows, per cluster, in localStorage. Stored as
 * overrides rather than the full set so a field that becomes active later —
 * a colleague filled it — appears without anyone having to re-tick it.
 */
const useColumnPrefs = (clusterId?: number | null): UseColumnPrefs => {
  const [prefs, setPrefs] = useState<ColumnPrefs>(() => read(clusterId));

  useEffect(() => {
    setPrefs(read(clusterId));
  }, [clusterId]);

  const update = (next: ColumnPrefs) => {
    setPrefs(next);
    if (clusterId) {
      localStorage.setItem(`${KEY_PREFIX}${clusterId}`, JSON.stringify(next));
    }
  };

  return {
    isShown: (field) => prefs.fields[field.id] ?? shownByDefault(field),
    setShown: (id, shown) =>
      update({ ...prefs, fields: { ...prefs.fields, [id]: shown } }),
    forget: (id) => {
      const { [id]: _dropped, ...fields } = prefs.fields;
      update({ ...prefs, fields });
    },
    gpus: prefs.gpus,
    source: prefs.source,
    setGpus: (gpus) => update({ ...prefs, gpus }),
    setSource: (source) => update({ ...prefs, source })
  };
};

export default useColumnPrefs;
