import { topologyLayerLabel } from '../../../config';
import {
  ClusterTopology,
  TopologyLayer,
  TopologyLayerView,
  TopologyView
} from '../../../config/types';
import { fieldLayers } from '../location';

/** One rung of the mapping being edited: a vocabulary field or a custom layer. */
export interface DraftLayer {
  /** Stable identity. `builtin-NNNNNN` or `custom-<6 hex>`; never edited. */
  id: string;
  /**
   * Canonical name — the vocabulary slug, or a custom layer's original
   * wording. The i18n key, carried through to the wire untouched: a rename
   * writes `displayName`, never this.
   */
  name: string;
  /** The operator's own wording. Undefined means never renamed. */
  displayName?: string | null;
  /** What to show: `displayName` if set, otherwise the translated `name`. */
  label: string;
  builtin: boolean;
  /** Some worker resolves a value under the saved mapping. */
  active: boolean;
  /** Switched off by the operator; not the same as "nobody filled it in". */
  disabled: boolean;
  labelKeys: string[];
  /** Locked, always first, where hand-filled values land. Null for custom layers. */
  primaryKey: string | null;
  /**
   * This rung departs from the vocabulary, so it has to be written out.
   *
   * ⚠️ Not just "keys edited". A rename or a disable is equally a departure,
   * and a built-in rung is only serialised when this is true — so leaving
   * either out would drop the change on save and bounce the layer back to its
   * default the next time the drawer opened.
   */
  customised: boolean;
}

/**
 * The mapping being edited: one chain, root to leaf, host excluded.
 *
 * 🔴 It briefly held a second `acceleratorChain` of the same type, plus a
 * `chainOf` / `withChain` pair to say which one an edit was about. Review
 * collapsed the two into one, so an accelerator domain is now just a rung of
 * `chain` like any other — and a `Draft` is again a list, not a pair of lists
 * every caller has to choose between.
 */
export interface Draft {
  chain: DraftLayer[];
}

const toDraftLayer =
  (
    intl: { formatMessage: (d: { id: string }) => string },
    savedIds: Set<string>
  ) =>
  (layer: TopologyLayerView): DraftLayer => ({
    id: layer.id,
    name: layer.name,
    displayName: layer.display_name,
    label: topologyLayerLabel(intl, layer),
    builtin: layer.builtin,
    active: layer.active,
    disabled: !!layer.disabled,
    labelKeys: layer.label_keys || [],
    primaryKey: layer.primary_key,
    customised: savedIds.has(layer.id)
  });

export const draftFromView = (
  intl: { formatMessage: (d: { id: string }) => string },
  view: TopologyView,
  saved: ClusterTopology | null | undefined
): Draft => {
  const savedIds = new Set((saved?.layers || []).map((layer) => layer.id));
  return { chain: fieldLayers(view).map(toDraftLayer(intl, savedIds)) };
};

/**
 * One chain → wire. Lists only what departs from the vocabulary — custom
 * layers and builtins with edited keys — each pointing at its predecessor in
 * the *full* chain, vocabulary neighbours included. An empty list is the
 * vocabulary mode the backend treats as the default.
 */
const chainToWire = (rungs: DraftLayer[]): TopologyLayer[] =>
  rungs
    .map((layer, index) => ({ layer, index }))
    .filter(({ layer }) => !layer.builtin || layer.customised)
    .map(({ layer, index }) => ({
      id: layer.id,
      // Passed straight through, never recomputed from what is on screen.
      // `label` is `name` run through the current UI language, so writing
      // that here would store «机柜» for a Chinese operator and hand it to
      // every other reader — and the server refuses a built-in rung whose
      // name is not its slug precisely to catch this.
      name: layer.name,
      displayName: layer.displayName || null,
      disabled: layer.disabled,
      labelKeys: layer.labelKeys,
      parentLayer: index === 0 ? null : rungs[index - 1].id
    }));

/**
 * Draft → wire. Any `acceleratorLayers` / `acceleratorDomain` a stored spec
 * still carries is dropped rather than spread through: echoing a stale copy
 * back would write it to the cluster again on every save, and the server has
 * stopped reading it.
 */
export const toWire = (
  draft: Draft,
  saved?: ClusterTopology | null
): ClusterTopology => {
  const {
    acceleratorLayers: _droppedLayers,
    acceleratorDomain: _droppedDomain,
    ...rest
  } = (saved || {}) as ClusterTopology & {
    acceleratorLayers?: unknown;
    acceleratorDomain?: unknown;
  };
  return { ...rest, layers: chainToWire(draft.chain) };
};

/**
 * The id a layer created right now gets.
 *
 * Generated client-side rather than asked for: the whole edit is staged and
 * only reaches the cluster on Save, so a server-allocated number would mean a
 * round trip per "add layer" and a hole in the sequence for every one the
 * operator then cancelled. Six random hex digits collide at a rate no cluster
 * will ever see, and collisions are caught anyway — the server refuses
 * duplicate ids.
 *
 * Never derived from what the operator typed. That was the old behaviour and
 * it is the whole reason renaming was impossible: a typo became a permanent
 * identity referenced from saved model configurations.
 */
export const newCustomLayerId = (): string => {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(
    ''
  );
  return `custom-${hex}`;
};

/** A brand-new custom rung, before it is spliced into the chain. */
export const newCustomLayer = (
  name: string,
  labelKeys: string[]
): DraftLayer => ({
  id: newCustomLayerId(),
  // What the operator typed is the canonical name, not the id. It doubles as
  // the i18n key, which is what keeps the old convenience alive: call a layer
  // `accelerator_domain` and it still gets a translated header for free.
  name,
  displayName: null,
  label: name,
  builtin: false,
  active: false,
  disabled: false,
  labelKeys,
  primaryKey: null,
  customised: true
});

export const insertLayer = (
  draft: Draft,
  layer: DraftLayer,
  index: number
): Draft => {
  const rungs = [...draft.chain];
  rungs.splice(index, 0, layer);
  return { ...draft, chain: rungs };
};

export const removeLayer = (draft: Draft, id: string): Draft => ({
  ...draft,
  chain: draft.chain.filter((layer) => layer.id !== id)
});

/**
 * Rename a rung, or clear the override when `displayName` is null.
 *
 * `customised` flips either way, and that is load-bearing rather than
 * bookkeeping: `chainToWire` only serialises a built-in rung when it is set,
 * so a rename that left it alone would be dropped on save and the layer would
 * be back to its default the next time the drawer opened.
 */
export const renameLayer = (
  draft: Draft,
  id: string,
  displayName: string | null,
  label: string
): Draft => ({
  ...draft,
  chain: draft.chain.map((layer) =>
    layer.id === id ? { ...layer, displayName, label, customised: true } : layer
  )
});

/** Switch a built-in rung off, or back on. Same `customised` rule as above. */
export const setLayerDisabled = (
  draft: Draft,
  id: string,
  disabled: boolean
): Draft => ({
  ...draft,
  chain: draft.chain.map((layer) =>
    layer.id === id ? { ...layer, disabled, customised: true } : layer
  )
});
