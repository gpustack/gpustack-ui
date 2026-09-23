import { topologyLayerLabel } from '../../config';
import {
  NODE_LAYER,
  RACK_LAYER,
  TopologyLayerView,
  TopologyView,
  TopologyWorker,
  WorkerLocation
} from '../../config/types';

/** A column of the location table: one rung of the chain. */
export interface LocationField {
  id: string;
  /**
   * The layer's canonical name (`rack`, `accelerator_domain`, …), which is what
   * the per-field message maps are keyed by. Carried beside the id because the
   * id is an opaque registry number — looking a hint up by it silently found
   * nothing and every built-in field rendered bare.
   */
  name: string;
  /** Already translated; custom layers pass their name through. */
  label: string;
  builtin: boolean;
  /** Some worker resolves a value here. */
  active: boolean;
  primaryKey: string | null;
  labelKeys: string[];
}

type Intl = { formatMessage: (d: { id: string }) => string };

export const fieldLayers = (view: TopologyView) =>
  view.layers.filter((layer) => layer.id !== NODE_LAYER);

// 🔴 `acceleratorLayers()` / `acceleratorFields()` are gone with the second
// chain. They existed to fold a server's `accelerator_layers` — or, older
// still, its single `accelerator_domain` — into a chain the rest of the UI
// could read. There is one chain now, so a domain arrives as an ordinary
// `layers[]` entry and needs no adapter. No fallback is kept: a server that
// still sends the old fields is simply read for `layers`, and its accelerator
// declaration is ignored (that is the agreed behaviour, not a gap).

const toField =
  (intl: Intl) =>
  (layer: TopologyLayerView): LocationField => ({
    id: layer.id,
    name: layer.name,
    // `displayName ?? t(name)`. The builtin/custom split that used to be here
    // is gone: both kinds carry a canonical name now, and a custom layer
    // called `accelerator_domain` gets the translation just like a builtin.
    label: topologyLayerLabel(intl, layer),
    builtin: layer.builtin,
    active: layer.active,
    primaryKey: layer.primary_key,
    labelKeys: layer.label_keys || []
  });

/** Every field a cluster has, root to leaf, host excluded. */
export const allFields = (intl: Intl, view: TopologyView): LocationField[] =>
  fieldLayers(view).map(toField(intl));

/**
 * The rack always, because it is what the onboarding tells people to fill
 * first and an empty table has nowhere to write; everything else once some
 * worker has a value.
 *
 * By the layer's id, not the string `'rack'`: a field's id is the registry
 * number, so the literal never matched and a fresh cluster — where nothing is
 * active yet — opened on a table with no writable column at all, which is the
 * one state the onboarding walks the user through.
 */
export const shownByDefault = (field: LocationField) =>
  field.active || field.id === RACK_LAYER;

/** What a cluster's table shows before anyone touches the column picker. */
export const visibleFields = (intl: Intl, view: TopologyView) =>
  allFields(intl, view).filter(shownByDefault);

export const isFilled = (worker: TopologyWorker, field: string) =>
  !!worker.location?.[field]?.value;

export const isDiscovered = (location?: WorkerLocation | null) =>
  location?.source === 'discovered' || location?.source === 'node';

/** Hand-filled on top of a value the device reported; clearing brings it back. */
export const isOverride = (location?: WorkerLocation | null) =>
  location?.source === 'user' && !!location.discovered_value;

export const shownValue = (location?: WorkerLocation | null) =>
  location?.display || location?.value || '';

/**
 * Existing values of one column, most-used first. What the in-cell dropdown
 * offers: an operator filling rack nine of twelve is far more likely to want
 * "R3" than to be inventing a new name.
 */
export const valueOptions = (workers: TopologyWorker[], field: string) => {
  const counts = new Map<string, number>();
  workers.forEach((worker) => {
    const value = worker.location?.[field]?.value;
    if (value) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ value, count }));
};

/**
 * Resolve a field's value from a worker's own labels and discovered facts,
 * the same any-of walk the server does. For the Workers list, which polls on
 * its own and must not add a request per row; labels win over facts because
 * a hand-filled value is what the operator expects to see.
 */
export const resolveLocation = (
  worker: {
    labels?: Record<string, string> | null;
    status?: { topology_facts?: Record<string, string> | null } | null;
  },
  labelKeys: string[]
): WorkerLocation | null => {
  const labels = worker.labels || {};
  const facts = worker.status?.topology_facts || {};
  for (const key of labelKeys) {
    if (labels[key]) {
      return {
        value: labels[key],
        source: 'user',
        key,
        discovered_value: facts[key] || null
      };
    }
  }
  for (const key of labelKeys) {
    if (facts[key]) {
      return { value: facts[key], source: 'discovered', key };
    }
  }
  return null;
};

/** A field's any-of keys. */
export const layerKeys = (view: TopologyView | undefined, field: string) =>
  view?.layers.find((layer: TopologyLayerView) => layer.id === field)
    ?.label_keys || [];
