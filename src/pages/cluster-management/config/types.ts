import { ProviderType } from '.';

export interface CredentialFormData {
  name: string;
  provider: string;
  key: string;
  secret: string;
  description?: string;
  id?: number;
}

export type ClusterStatusType = 'provisioning' | 'provisioned' | 'ready';

export interface CredentialListItem {
  id: number;
  name: string;
  provider: ProviderType;
  access_key: string;
  secret_key: string;
  description?: string;
  owner_principal_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface NodePoolFormData {
  name: string;
  instance_type: string;
  os_image: string;
  image_name: string;
  replicas: number;
  batch_size: number;
  labels: Record<string, string>;
  cloud_options: Record<string, any>;
  instance_spec: Record<string, any>;
}

export interface NodePoolListItem extends NodePoolFormData {
  id: number;
  instance_type: string;
  replicas: number;
  workers: number;
  ready_workers?: number;
  batch_size: number;
  labels: Record<string, string>;
  cloud_options: Record<string, any>;
  os_image: string;
  created_at: string;
  updated_at: string;
  cluster_id: number;
}
export interface VolumeMount {
  name: string;
  mountPath: string;
  readOnly: boolean;
  volumeSource: {
    hostPath: {
      path: string;
      type: string;
    };
    persistentVolumeClaim: {
      claimName: string;
      readOnly: boolean;
    };
    configMap: {
      name: string;
      optional: boolean;
    };
  };
}

export interface ImageCredential {
  registry: string;
  username: string;
  password: string;
}

export interface GpuInstanceOptions {
  // The mere presence of `gpuInstanceOptions` on `k8s_options` signals
  // "GPU instances enabled" for the cluster — absence opts the cluster out,
  // so there's no separate boolean flag on the wire.
  //
  // Every knob mirrors a GPUStack Operator setting of the same name and is
  // tri-state: absent (or `null`) means GPUStack does not manage that setting
  // and the cluster keeps its own value — a different instruction from an
  // explicit `false`. The backend drops nulls when persisting, so `null` is
  // how the form says "not managed".
  //
  // Keeps its legacy name — renaming it to the operator's
  // `instance-access-static-address` would break the payload for every
  // existing client, so the mismatch stays confined to this one field.
  gpuInstancesAccessStaticAddress?: string | null;
  // Operator `instance-type-derived-from-node` (operator default: true).
  gpuInstanceTypeDerivedFromNode?: boolean | null;
  // Operator `instance-type-mixed-on-node` (operator default: true).
  gpuInstanceTypeMixedOnNode?: boolean | null;
}

export interface K8sOptions {
  // Backend serializes K8sOptions with camelCase aliases (by_alias=True on
  // the SQL JSON column). The top-level `k8s_options` field on the cluster
  // stays snake_case, but everything inside follows the backend wire shape.
  volumeMounts?: VolumeMount[];
  imageCredentials?: ImageCredential[];
  // Base nodeSelector applied to every worker DaemonSet; each per-runtime
  // DaemonSet additionally gets a vendor PCI-presence label merged on top at
  // render time, so per-vendor overrides are no longer configured here.
  nodeSelector?: Record<string, string>;
  // Override for the gpustack-operator container image. Falls back to the
  // server's default when unset.
  operatorImage?: string | null;
  // GPU-instance support knobs; presence enables GPU instance handling.
  gpuInstanceOptions?: GpuInstanceOptions;
  // Kubernetes namespace the cluster's manifests render into. Falls back to
  // `gpustack-system` at render time when unset.
  namespace?: string | null;
  // Raw GPUStack Helm chart values, keyed exactly as the chart keys them and
  // passed through untranslated — the escape hatch for anything the chart and
  // its subcharts expose that has no dedicated option here. Merged key-by-key
  // over the values the server derives, so the other options still apply
  // underneath. Arbitrarily nested; `null` means "not set" (never send `{}`,
  // which persists as an empty object).
  helmValues?: Record<string, any> | null;
}

export interface ClusterListItem {
  name: string;
  display_name: string;
  is_default: boolean;
  description: string;
  worker_config: Record<string, any>;
  // Per-cluster default container registry, promoted out of worker_config to
  // a top-level column on the backend (image resolution / registration token
  // read it directly). Falls back to the server default when unset.
  system_default_container_registry?: string | null;
  // Externally reachable GPUStack Server URL the workers register against.
  // Unset means the platform's `server_external_url` is used instead.
  server_url?: string | null;
  provider: ProviderType;
  credential_id: number;
  created_at: string;
  zone: string;
  region: string;
  gpus: number;
  models: number;
  workers: number;
  ready_workers: number;
  id: number;
  state: ClusterStatusType;
  state_message: string;
  worker_pools: NodePoolListItem[];
  k8s_options?: K8sOptions;
  // Stored alongside k8s_options and handled identically. Absent is not a
  // degraded state: it means no layers declared, which the tree already
  // handles by giving every worker a leaf of its own under the root.
  topology?: ClusterTopology | null;
  // Backend ClusterPublic carries this; admin-"All" namespace
  // resolution falls back to the cluster's owner Org name.
  owner_principal_id?: number;
}

export interface ClusterFormData {
  name: string;
  description: string;
  provider: ProviderType;
  is_default?: boolean;
  credential_id: number;
  zone: string;
  region: string;
  // Empty means "follow the platform's external URL" — the field normalizes a
  // cleared input to null so an edit can drop a previously set override.
  server_url?: string | null;
  worker_config?: Record<string, any>;
  system_default_container_registry?: string | null;
  worker_pools?: NodePoolFormData[];
  k8s_options?: K8sOptions;
}

export interface SystemConfig {
  disable_builtin_observability?: boolean;
  debug: boolean;
  grafana_url?: string;
  server_external_url: string | null;
  system_default_container_registry: string | null;
  showMonitoring?: boolean;
  // Platform-wide business timezone (IANA name) resolved from GPUSTACK_TIMEZONE.
  timezone?: string;
}

// --------------------------------------------------------------------------
// Topology: where this cluster's workers sit, and how far apart.
//
// The wire form of `ClusterTopology` is camelCase, matching the neighbouring
// `k8s_options` blob — the backend declares aliases for exactly this. The
// read models (`TopologyView` and friends) are snake_case like every other
// response body.
// --------------------------------------------------------------------------

/**
 * The built-in leaf. It takes the worker's *name* rather than a label, which is
 * why the tightest gather choice exists even for a cluster that has declared
 * nothing — and why a missing label can only cost resolution, never
 * schedulability.
 */
export const NODE_LAYER = 'builtin-000004';

/**
 * The leaf's canonical name, and so its i18n key. Separate from the id for the
 * same reason every other rung's is: the id is a registry number and has no
 * translation.
 */
export const NODE_LAYER_NAME = 'host';

/**
 * The rack rung's id.
 *
 * Named rather than written out at each use. It is the default grouping and
 * the one rung the empty-state guidance talks about, and with ids opaque a
 * literal `'builtin-000003'` in a component says nothing about racks.
 */
export const RACK_LAYER = 'builtin-000003';

// 🔴 The accelerator domain is no longer a model of its own. It was, twice:
// first as a flat dimension beside the tree (`ACCELERATOR_DOMAIN`,
// `TopologyView.accelerator_domain`), then as a second chain of the same type
// (`acceleratorLayers` / `accelerator_tree` / a `chain` marker on every field).
// Both are gone, and neither should come back as a compatibility path.
//
// The argument for a second dimension was that the domain nests in no fixed
// place — inside a host on an 8-card server, across sixteen racks on a
// CloudMatrix384. Review found that too weak to pay for: as long as a domain's
// boundary is a run of *adjacent racks* it is simply a rung of the one chain,
// and on all four generations it is (NVL72 = 1 rack, NVL36×2 = 2,
// CloudMatrix384 = 16, Atlas 950 = 160). Where the domain is smaller than a
// machine (910B2), "same domain" and "same host" mean the same thing to PD,
// and the built-in leaf already covers that.
//
// So a domain is now a layer an operator adds, pointed at whichever key their
// fleet publishes. The keys survive as *suggestions* in the add-layer dialog
// (the server's `known_keys`), and `TopologyFieldLabelMap` still carries a
// display name for the `accelerator_domain` id — an operator who names the
// layer that gets «加速器域» for free. Nothing else treats it specially.

/** The domain a worker lands in when every one of a layer's label keys misses. */
export const UNCLASSIFIED = '<unclassified>';

export type GatherStrategy = 'MustGather' | 'PreferGather';

export interface TopologyLayer {
  /**
   * Stable identity, fixed at creation and never changed: `builtin-NNNNNN` for
   * a vocabulary rung, `custom-<6 hex>` for one the operator added.
   * `parentLayer` and a model's `gather.layer` point at this, which is why a
   * rename writes `displayName` instead of touching it.
   */
  id: string;
  /**
   * Canonical name — the vocabulary slug (`rack`) for a built-in rung, the
   * operator's original wording for a custom one. Set once at creation and
   * never rewritten: it is the i18n lookup key, so putting a *translated*
   * label here would freeze the row into whichever UI language last saved it.
   */
  name: string;
  /**
   * What the operator renamed this layer to. Absent means never renamed,
   * which is the only way to say so — the effective label is
   * `displayName ?? t(name)`. Shown verbatim and never translated: these are
   * the operator's words, not ours.
   */
  displayName?: string | null;
  /**
   * Built-in rungs only: do not group by this layer even though workers carry
   * its label. Distinct from a layer nobody filled in, which is a fact about
   * the data and returns the moment someone writes the label; this is a
   * decision and does not. A custom layer is deleted rather than disabled.
   */
  disabled?: boolean;
  /**
   * any-of, tried in order, first present wins. The same physical layer is
   * spelled differently by every vendor and cloud, and a mixed fleet must not
   * have to be relabelled before topology works at all.
   */
  labelKeys?: string[];
  /**
   * A chain rather than an ordered list: inserting a layer into a list
   * renumbers every layer below it, and these names are referenced from saved
   * model configurations. Unset means "hangs off the cluster root".
   */
  parentLayer?: string | null;
}

export interface ClusterTopology {
  /**
   * One chain, root to leaf. Empty means vocabulary mode. Entries are custom
   * layers plus any vocabulary field whose keys were customised
   * (`name` == the vocabulary id).
   *
   * No `acceleratorLayers` / `acceleratorDomain` sibling: the column is JSON
   * with `extra="ignore"`, so an old cluster's declaration is dropped on read
   * and there is deliberately no migration. A stale accelerator declaration
   * simply stops having an effect.
   */
  layers?: TopologyLayer[];
  /**
   * No `defaultGatherStrategy` / `defaultGatherLayer` either. The cluster used
   * to carry a gather default that models without one inherited; it was never
   * exposed in this UI, and a deployment could be refused for a floor its own
   * form never showed. Gone from the server too — the deploy form's own
   * 拓扑亲和性 field is now the only source.
   */
}

export interface TopologyVocabularyField {
  id: string;
  /** Server fallback only; the UI has an i18n name for every builtin id. */
  name: string;
}

export interface TopologyKnownKey {
  key: string;
  vendor: string;
  /** Which field ids this key is a sensible source for. */
  fits: string[];
  note?: string | null;
}

export interface TopologyLayerView {
  id: string;
  /** Canonical name; the i18n key. See `TopologyLayer.name`. */
  name: string;
  /** The operator's own wording, if they set one. Never translated. */
  display_name?: string | null;
  builtin: boolean;
  /** Switched off by the operator; in this list so the panel can switch it back. */
  disabled?: boolean;
  /** At least one worker resolves a value here; only active layers form the tree. */
  active: boolean;
  label_keys: string[];
  /** The key a hand-filled value is written to; null for custom layers. */
  primary_key: string | null;
  domains: number;
  classified: number;
  unclassified: number;
  /**
   * Models whose gather layer is this one; deleting it would strand them.
   * Older servers omit the field, and the UI then asks the models API itself.
   */
  referenced_by_models?: string[];
}

export type LocationSource = 'user' | 'discovered' | 'node';

export interface WorkerLocation {
  value: string;
  source: LocationSource;
  /** Which any-of key produced the value. */
  key: string;
  /** Still carried when a hand-filled value overrides it: clearing restores it. */
  discovered_value?: string | null;
  /** A human name for an auto value (a switch's system name over its chassis id). */
  display?: string | null;
}

export interface TopologyWorker {
  id: number;
  name: string;
  state: string;
  gpus: number;
  free_gpus: number;
  /** Keyed by field id; fields with no value are absent. */
  location: Record<string, WorkerLocation>;
  /** The worker's own labels, so key counts need no second request. */
  labels?: Record<string, string>;
}

export interface TopologyDomain {
  layer: string;
  name: string;
  /** Its label keys all missed. Rendered as a prompt to act, not as a domain. */
  unclassified?: boolean;
  /** Which of the layer's any-of keys actually matched here. */
  matched_label_key?: string | null;
  workers: number;
  gpus: number;
  /** GPUs with nothing allocated. The number "can my 2P2D fit here" needs. */
  free_gpus: number;
  /** Carried only on the unclassified bucket and the leaf — see the API doc. */
  worker_ids?: number[];
  children?: TopologyDomain[];
}

export interface TopologySuggestion {
  key: string;
  workers: number;
  distinct_values: number;
  looks_like: string;
}

/** Everything the topology drawer needs for its first paint, in one response. */
export interface TopologyView {
  vocabulary: {
    fields: TopologyVocabularyField[];
    known_keys: TopologyKnownKey[];
  };
  /** Root-to-leaf, every vocabulary field plus custom layers, the host last. */
  layers: TopologyLayerView[];
  workers: TopologyWorker[];
  /** The one tree, built from `layers`. */
  tree: TopologyDomain;
  suggestions: TopologySuggestion[];
}

export interface LocationAssignment {
  worker_ids: number[];
  /** A vocabulary field id or a custom layer name. */
  layer: string;
  /** null deletes the field's own key and lets a discovered value show again. */
  value: string | null;
}

export interface LocationsResponse {
  /** The inverse operation, ready to be posted back verbatim as the undo. */
  previous: LocationAssignment[];
  topology: TopologyView;
}
