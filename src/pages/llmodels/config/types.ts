export interface ListItem {
  source: string;
  backend: string;
  categories?: string[];
  reranker: boolean;
  image_only?: boolean;
  huggingface_repo_id: string;
  huggingface_file_name: string;
  backend_version?: string;
  huggingface_filename: string;
  ollama_library_model_name: string;
  model_scope_file_path: string;
  model_scope_model_id: string;
  embedding_only?: boolean;
  ready_replicas: number;
  speech_to_text?: boolean;
  text_to_speech?: boolean;
  enable_model_route?: boolean;
  replicas: number;
  s3Address: string;
  lora_list: Array<{
    huggingface_filename: string;
    local_path: string;
    lora_name: string;
    lora_repo_name: string;
    model_file_id: string;
    model_scope_file_path: string;
    path: string;
    source: string;
  }>;
  owner_principal_id?: number;
  name: string;
  description: string;
  id: number;
  cluster_id: number;
  local_path?: string;
  created_at: string;
  updated_at: string;
  // Built-in values are 'public' | 'authed' | 'allowed_users';
  // additional values (e.g. 'allowed_principals') may be contributed
  // by plugins via `accessControl.prependedPolicies` or by
  // overriding the default via `accessControl.allowedUsersOverride`.
  // The `(string & {})` tail keeps literal autocomplete for the
  // built-ins while still accepting plugin-defined values.
  access_policy: 'public' | 'authed' | 'allowed_users' | (string & {});
  native_anthropic_api?: boolean;
  generic_proxy?: boolean;
  gpu_selector?: {
    gpu_ids: string[];
    gpus_per_replica?: number;
  };
  gpu_type_selector?: GPUTypeSelector | null;
  worker_selector?: object;

  // --- PD: user intent ---
  roles?: RoleSpec[] | null;
  disaggregation?: DisaggregationSpec | null;
  /**
   * How far apart this group's members may sit. Beside `roles` rather than
   * inside `disaggregation`, mirroring the backend: gather describes the
   * relationship between *members*, and members come from `roles`.
   *
   * A layer without a strategy is refused server-side, so the two always move
   * together.
   */
  gather?: {
    strategy?: 'MustGather' | 'PreferGather' | null;
    layer?: string | null;
  } | null;

  // --- PD: server-owned status, read-only ---
  //
  // `state` answers exactly one question: can this serve. It is NOT
  // `ready_replicas > 0` under PD — a 3P1D whose router is down is four
  // running instances and zero service. Being up but worse than asked for
  // lives beside it in `degradations`, never inside it, so `state === 'running'`
  // is the servability gate everywhere with no per-shape special case.
  state?: string | null;
  state_message?: string | null;
  // Per-role detail for the row's hover panel, and the source of the replica
  // column's denominator under PD.
  role_status?: Record<string, RoleStatus> | null;
  // A member predates the config it is shown with. Orthogonal to `state`: a
  // stale group is usually still serving.
  stale?: boolean | null;
  // `DegradationValueMap` values, and a list because they coexist.
  degradations?: string[] | null;
  // A restart the server is still carrying out, cleared once the rebuilt group
  // is running. Present so the Restart entry can be disabled for that window —
  // a second teardown deletes the replacements the first one just built.
  restarting_since?: string | null;
}

// One window's answer for one disaggregated group, from `GET
// /models/{id}/pd-metrics`. Fetched on expand: it is the only figure that
// costs a Prometheus round trip, and a collapsed row does not show it.
export interface PDMetrics {
  // False carries why nothing could be measured. Never conflated with a bad
  // measurement: "we cannot tell" and "PD stopped working" call for opposite
  // reactions.
  available: boolean;
  reason?: string | null;
  window_seconds?: number | null;
  // `effective` | `aggregated` | `idle` | `unmeasurable`.
  status?: string | null;
  // Around 1.0 on a healthy pair; near 0 while requests are still routed is
  // the silent collapse into aggregated serving.
  kv_transfers_per_request?: number | null;
  // Counted at the router, the only place a request is counted once: engine
  // counters double under PD because every request traverses both roles.
  routed_request_count?: number | null;
  // `router_per_worker` | `router_total` | `none`.
  request_count_source?: string | null;
  // New KV tokens the RECEIVING role computed per request, at the tail.
  //
  // 🔴 A healthy reading is BELOW 1.0, not 0: vLLM's first bucket is `le=1.0`
  // and `histogram_quantile` interpolates inside whichever bucket it lands in,
  // so a group that recomputed nothing reports `quantile × 1.0` (0.95 / 0.99,
  // measured). Rendering that would alarm on a perfect deployment, which is
  // why the panel only surfaces this once it clears the first bucket.
  recomputed_tokens_p95?: number | null;
  recomputed_tokens_p99?: number | null;
  kv_transfer?: PDKVTransferMetrics | null;
  // Keyed by role name. Whatever the series carried — a group with no decode
  // replica yet shows the roles it has rather than an invented empty one.
  roles?: Record<string, PDRoleMetrics> | null;
  // Keyed by the router's `worker` label, which is the upstream engine URL and
  // NOT a GPUStack worker: one host runs several members of an xPyD group, so
  // keying on the host would collapse exactly the members this tells apart.
  // Absent for a member the router never dispatched to — the absence is the
  // finding, and a zero row would claim it was measured.
  members?: Record<string, PDMemberMetrics> | null;
  // [timestamp, value]; a null value is a gap, which is not a zero.
  kv_transfers_per_request_series?: (number | null)[][];
  kv_transfer_bytes_per_second_series?: (number | null)[][];
  // The share of requests whose KV can stay inside one host, from where the
  // members actually landed.
  //
  // 🔑 The one figure here that is NOT measured — it is placement arithmetic,
  // so it is present even when `available` is false, and it needs no traffic
  // to be true. Same source as the `pairing_remote` degradation, which is this
  // value at exactly zero.
  //
  // 🔴 The deploy form shows `1/x`, which is only a FLOOR: it knows the
  // replica count the user typed, not how many machines the solver spread the
  // group over, and the true value is driven by the latter. This is the
  // answer, so it is the one worth showing beside the floor.
  pairing_locality?: number | null;
}

export interface PDMemberMetrics {
  prefill_requests?: number | null;
  decode_requests?: number | null;
  // Dispatches the router saw fail, counted BEFORE its own retry. Non-zero
  // while every request returned 200 is the share of traffic a retry covered
  // up, and a retry that keeps landing on one bad decode is invisible in a
  // total — which is why this is per member.
  decode_errors?: number | null;
}

export interface PDKVTransferMetrics {
  count?: number | null;
  // Which role's counter this came from — a connector property, not a choice.
  counted_on_role?: string | null;
  // Bytes over time spent transferring, not per wall-clock second.
  bytes_per_second?: number | null;
  // Falling here precedes a slowdown: smaller chunks, more overhead.
  bytes_per_transfer?: number | null;
  // The tail is where a degrading path shows first; a mean hides it.
  seconds_p50?: number | null;
  seconds_p95?: number | null;
  seconds_p99?: number | null;
  // Prompt tokens that arrived over the wire, read off the ENGINE rather than
  // the connector — so this exists for every connector, including the ones
  // that export no byte or duration counters at all.
  external_tokens?: number | null;
  // The same over wall clock. Multiply by the budget endpoint's
  // `bytes_per_token` for a derived bandwidth — the conversion the removed
  // group summary panel did, for connectors that export no byte counter.
  external_tokens_per_second?: number | null;
  failures?: number | null;
  // Requests dropped between the two hops. Null (not 0) where the connector
  // exports no such counter.
  leases_expired?: number | null;
}

// Per role because that is the premise of PD: prefill owns TTFT, decode owns
// TPOT, and a figure averaged across both describes neither.
export interface PDRoleMetrics {
  // The only objective signal for whether the ratio is right, and which way.
  pending_requests?: number | null;
  running_requests?: number | null;
  time_to_first_token_seconds?: number | null;
  time_per_output_token_seconds?: number | null;
}

// How much bandwidth this model's KV transfer needs, from `POST
// /models/kv-transfer-budget`. Derived from the model's own config, so it is
// answerable before a deployment exists — and, with `measured` filled in from
// the group's own transfer rate, it turns "0.42 GB/s" from a reading into a
// judgement about whether the link is fast enough for what is running on it.
export interface KVTransferBudget {
  seq_len: number;
  kv_cache_dtype: string;
  bytes_per_token: number;
  bytes_per_request: number;

  layers: number;
  kv_heads?: number | null;
  head_dim?: number | null;
  // Set instead of kv_heads/head_dim on MLA models, which store one compressed
  // latent rather than per-head K and V. It is what makes them an order of
  // magnitude cheaper to disaggregate, so it is reported rather than folded
  // into the byte count.
  latent_dim?: number | null;

  // What is left of the TTFT budget once prefill has taken its share — the
  // window the transfer has to fit inside, and the denominator of the
  // requirement.
  transfer_budget_ms: number;
  required_bandwidth_bytes_per_second: number;
  // Common links scored against this model: a bare "you need 4.5 GB/s" is not
  // actionable to someone who does not know what their NIC delivers.
  reference_links: KVTransferReferenceLink[];
  measured?: KVTransferMeasuredComparison | null;
}

export interface KVTransferReferenceLink {
  name: string;
  bandwidth_bytes_per_second: number;
  transfer_ms: number;
  sufficient: boolean;
}

export interface KVTransferMeasuredComparison {
  bandwidth_bytes_per_second: number;
  // Measured over required. Thresholds are ratios rather than absolute GB/s
  // because an MLA model and a 70B GQA model differ by 10x in what they need.
  ratio: number;
  transfer_ms: number;
  // `sufficient` | `tight` | `insufficient`.
  verdict: string;
  // Populated only on `insufficient`, where they are the point; attached to a
  // sufficient link they would read as a warning about something that is fine.
  remedies?: string[];
}

// ---------------------------------------------------------------------------
// Prefill/decode disaggregation.
//
// A model with `roles` set is a *group*: one pool, one router, one generation
// at a time. `roles` alone is plain multi-role orchestration; both together is
// PD. `roles` absent is every model that exists today, and that path must stay
// byte-for-byte what it is.
// ---------------------------------------------------------------------------

// One role's overrides. Every deployment field left undefined inherits the
// Model-level field of the same name, which is what lets a homogeneous 1P1D
// be "flip a switch and type two numbers" rather than three full forms. The
// override surface is the *whole* of `backend_parameters` and `env` on
// purpose: measured on Ascend 910B2, prefill and decode differ in nearly every
// performance-related parameter.
export interface RoleSpec {
  name: string;
  replicas: number;
  backend?: string | null;
  backend_version?: string | null;
  image_name?: string | null;
  run_command?: string | null;
  backend_parameters?: string[] | null;
  env?: Record<string, any> | null;
  gpu_selector?: {
    gpu_ids?: string[];
    gpus_per_replica?: number;
  } | null;
  worker_selector?: Record<string, any> | null;
  // The only entry point for a heterogeneous group, and the precondition for
  // gang admission.
  gpu_type_selector?: GPUTypeSelector | null;
  extended_kv_cache?: Record<string, any> | null;
  dependencies?: string[] | null;
  // Router only, and role-own rather than an override: there is no
  // Model-level counterpart to inherit from, because prefill and decode get
  // their footprint from sizing. Left empty the router still gets a floor.
  resources?: {
    // Cores. Enforced on the container; not a placement dimension yet.
    cpu?: number | null;
    // Bytes on the wire, GiB in the field — and this one *is* subtracted from
    // the worker when choosing where to place the router.
    memory?: number | null;
  } | null;
}

// The form's shape for a role: `RoleSpec` plus the per-group override
// switches, which are UI-only and stripped before submit. A switch left off
// means the group's fields submit as null, so the form and the payload are the
// same shape and nothing has to guess which fields to drop.
export interface RoleFormItem extends RoleSpec {
  overrides?: Record<string, boolean>;
  // Router only: "managed by the system" versus hand-written.
  managed?: boolean;
}

export interface DisaggregationSpec {
  mode: string;
  readiness?: 'any_per_role' | 'all';
  kv_load_failure_policy?: 'fail' | 'recompute';
}

// Per-role readiness detail, carried on the model row rather than computed per
// request: the list endpoint returns models without their instances, and the
// list needs per-role detail on a row the user has not expanded.
export interface RoleStatus {
  desired: number;
  ready: number;
  /**
   * Members of this role inside their scale-down drain window, whatever their
   * state.
   *
   * Not derivable from `ready` and `desired`: a draining member need not be
   * running. Victim selection scores a broken member zero and picks it first,
   * so "draining and also ERROR" is the ordinary case.
   *
   * Printed beside the fraction because it is the one member a reader cannot
   * account for — a role scaled from 3 to 1 reads «1 / 1» above three rows,
   * and the merely-unready ones are already the gap between `ready` and
   * `desired`.
   *
   * Optional: a server that predates the field sends nothing, and the only
   * consequence is the dot staying green through a window, exactly as before.
   */
  draining?: number;
}

// `POST /v2/models/{id}/restart`. The endpoint converges the model onto its
// current spec rather than cycling processes, so "nothing to do" is a success:
// `restarted: false` means the members already run that spec (or there are
// none), which is why the caller has to read this instead of the status code.
export interface ModelRestartResult {
  spec_digest: string;
  restarted: boolean;
  deleted_instances?: string[];
  message?: string | null;
}

// One entry of `GET /v2/pd-modes`. Deliberately loose below the fields the UI
// reads: the catalog's whole point is that adding an engine is a YAML change,
// so the UI must not mirror its full schema.
/** One catalog entry's verdict for the current engine × accelerator pair. */
export interface PDModeEligibility {
  name: string;
  eligible: boolean;
  // The derived answer. At most one entry carries it.
  recommended: boolean;
  // Why it cannot be picked here. Rendered inline next to the disabled
  // option — an option the user cannot pick still tells them the capability
  // exists and what it would take to reach it.
  //
  // `ineligible_reason` is English prose assembled on the server; render the
  // code instead and keep the prose as the fallback for a server older than
  // the code, exactly as `unresolved_code` is handled.
  ineligible_reason?: string | null;
  // `backend_mismatch` | `vendor_mismatch`.
  ineligible_code?: string | null;
  // Pre-joined substitutions, so the client never has to decide how a list of
  // engines or vendors should read. `backend` may be an empty string when the
  // caller has not picked an engine yet — that half-sentence is the client's.
  ineligible_params?: Record<string, string> | null;
}

/**
 * The server's answer to "which recipe does this deployment get".
 *
 * `mode` null means the answer is a question, and the three shapes need
 * different handling: accelerators not known yet (wait), no built-in recipe
 * for this pair (offer Custom), or several vendor partitions could host the
 * group (ask which — `candidate_vendors`).
 */
/**
 * `PDModeUnresolvedCode` on the server. A union rather than an enum, because
 * this is the shape of a response: a server newer than this client can send a
 * code that is not listed here, and the render falls back to the prose.
 */
export type PDUnresolvedCode =
  | 'vendor_not_in_cluster'
  | 'vendors_unknown'
  | 'no_built_in_recipe'
  | 'multiple_vendors'
  | 'no_preferred_recipe';

export interface PDModeResolution {
  mode?: string | null;
  vendor?: string | null;
  /**
   * The server's English prose. Rendered only as the fallback for a server
   * that predates `unresolved_code` — on its own it put an English sentence
   * in the middle of an otherwise localized form.
   */
  unresolved_reason?: string | null;
  /** `PDModeUnresolvedCode` — the same reason, translated by this client. */
  unresolved_code?: PDUnresolvedCode | null;
  /** Interpolation values, pre-joined by the server into display strings. */
  unresolved_params?: Record<string, string> | null;
  candidate_vendors: string[];
  cluster_vendors: string[];
  options: PDModeEligibility[];
}

export interface PDTunableArg {
  flag: string;
  default?: string | null;
  // Known-good values, for a select. Advisory rather than closed: the two
  // shipped routers disagree about their own strategy sets between wheel and
  // repository at the same version number, so a value outside this list is
  // still submitted.
  options?: string[];
  value_type?: 'string' | 'int' | 'float';
  min?: number | null;
  max?: number | null;
  description?: string | null;
}

/**
 * What the platform writes into one prefill or decode member.
 *
 * Read-only to the form in every branch: these are rendered from placement
 * facts the form does not have, which is why the values still carry their
 * `{{...}}` placeholders here. Deliberately isomorphic to a cache provider's
 * `injection` block — same vocabulary, same rendering rules.
 */
export interface PDRoleInjection {
  // Port bands the scheduler allocates. Not displayed on their own: each one
  // is referenced by an `args` or `env` entry as `{{ports.<name>}}`, which is
  // where a reader meets it in the form the engine will see.
  ports?: { name: string; count?: number; inject_to?: string }[] | null;
  // The KV connector descriptor, structured because that is the shape the
  // extended-KV-cache assembler consumes. Reaches the engine as one
  // `--kv-transfer-config` JSON blob.
  connector?: Record<string, any> | null;
  env?: Record<string, string> | null;
  args?: string[] | null;
  // Host paths bind-mounted into the member. Ascend's `/etc/hccn.conf` is the
  // shipped case: without it cross-host transfers fail on every rank while
  // same-host ones succeed.
  host_mounts?: string[] | null;
  files?: Record<string, any> | null;
}

export interface PDMode {
  name: string;
  display_name: string;
  description?: string;
  backends: string[];
  // One semver RANGE for the whole recipe (`">=0.20.0"`), not a map keyed by
  // engine — `backends` above already says which engines this recipe targets,
  // and a recipe that needed a different floor per engine would be two
  // recipes. It was typed as a map here and nothing ever read it, so the wrong
  // shape cost nothing until the first consumer arrived.
  //
  // Absent means "no declared floor", which is not the same as "any version
  // works": `custom` injects nothing and has nothing to declare, so it carries
  // no range rather than an open one.
  backend_versions?: string | null;
  // Which accelerators this recipe fits. Absent only on `custom`, which
  // injects nothing and must stay selectable on every accelerator — an
  // unsupported engine × accelerator pair means "no built-in recipe", never
  // "no PD".
  gpu_filters?: {
    vendor?: string[];
    compute_capability?: string | null;
    vendor_variant?: string[];
  } | null;
  preferred?: boolean;
  // The KV transport alone ("NIXL", "Mooncake"). Used by the derived
  // one-liner, where the engine has already been named — `display_name`
  // carries the engine too, because the picker lists several engines' recipes
  // side by side and there it has to say *which* NIXL.
  transport?: string | null;
  // Keyed by role name (`prefill`, `decode`). Empty on `custom`, which injects
  // nothing.
  roles?: Record<string, PDRoleInjection>;
  router?: {
    protocol?: string;
    image?: string | null;
    // The invocation, in three parts that mean three different things to the
    // form. `command` is all of them concatenated and stays the read-only
    // one-liner; the parts are what let the editor say which half is ours.
    entrypoint?: string[] | null;
    // Addresses, ports and the transport handshake — rendered from placement
    // facts the form does not have. Shown greyed out and refused at
    // admission, because `--prefill` / `--decode` are `action="append"` in
    // both shipped routers: a second one adds a peer rather than replacing
    // the injected one.
    connection_args?: string[] | null;
    // Strategy and resilience defaults. Overridable, because repeated flags
    // are last-wins for all of them.
    tunable_args?: PDTunableArg[] | null;
    command?: string[] | string | null;
    health_path?: string | null;
    capabilities?: Record<string, boolean>;
    peers?: Record<string, any>;
  } | null;
  kv_lease?: {
    connector?: string;
    param?: string | null;
    inject_to?: string | null;
    settable?: boolean;
    engine_default?: number | null;
    gpustack_default?: number | null;
    expired_metric?: string | null;
    description?: string | null;
  } | null;
}

// `POST /models/import`. The plan comes back the same shape either way: on a
// dry run `items` is empty, otherwise it holds the rows as written.
export type DeploymentAction = 'create' | 'update' | 'unchanged';

export interface DeploymentChange {
  // The document's own field name, e.g. `gpu_selector`. See
  // `deployment-field-labels` for the wording.
  field: string;
  current?: any;
  desired?: any;
}

export interface DeploymentPlanEntry {
  index: number;
  name?: string;
  // Absent when the entry could not be parsed, leaving nothing to plan.
  action?: DeploymentAction;
  // The entry as the document describes it, which the preview row renders.
  desired: Record<string, any>;
  // The deployment this entry would replace, projected onto the same fields
  // in the same order, so the two render as a YAML diff. Empty for a create.
  current: Record<string, any>;
  // The entry as the file spells it, sent only when it failed to validate —
  // exactly when `desired` is empty. What the editor falls back to, so an
  // invalid entry can still be fixed where it is.
  raw: Record<string, any>;
  changes: DeploymentChange[];
  errors: string[];
}

export interface DeploymentImportResult {
  dry_run: boolean;
  // No entry has errors. What gates the confirm button.
  valid: boolean;
  entries: DeploymentPlanEntry[];
  items: ListItem[];
}

// vGPU scheduling (issue #5192): deploy onto a GPU provided by a
// gpustack-operator InstanceType. Mutually exclusive with `gpu_selector`.
// Percentages 1-100 request a soft slice; both 0 request a whole card from
// the type pool; `accelerator_partitioned_profile` requests a hardware
// partition (e.g. MIG) and is mutually exclusive with the percentages.
export interface GPUTypeSelector {
  type?: string | null;
  accelerator_sliced_memory_percentage?: number | null;
  accelerator_sliced_cores_percentage?: number | null;
  accelerator_partitioned_profile?: string | null;
}

export type DeployFormKey = 'deployment' | 'catalog';

/**
 * An entry of the deploy form's cluster dropdown. `provider` is what tells the
 * form which GPU sources the target supports (ProviderValueMap).
 */
export type ClusterOption = Global.BaseOption<
  number,
  {
    provider: string;
    state: string;
    is_default: boolean;
    gpu_instance_enabled?: boolean;
    owner_principal_id?: number;
    workers: number;
    ready_workers: number;
    gpus: number;
  }
>;

export type SourceType =
  | 'huggingface'
  | 'model_scope'
  | 'local_path'
  | 'ollama_library';

export interface LoraListItem {
  lora_name: string;
  lora_repo_name: string;
  source: 'huggingface' | 'model_scope';
  huggingface_filename: string;
  model_scope_file_path: string;
  local_path: string;
  path: string;
  model_file_id: number;
}
export interface FormData {
  image_name?: string;
  run_command?: string;
  enable_model_route?: boolean;
  backend: string;
  native_anthropic_api?: boolean;
  restart_on_error?: boolean;
  env?: Record<string, any>;
  size?: number;
  quantization?: number;
  categories?: string[];
  backend_parameters?: string[];
  backend_version?: string;
  source: SourceType;
  huggingface_repo_id: string;
  huggingface_filename: string;
  s3_address: string;
  ollama_library_model_name: string;
  distributed_inference_across_workers?: boolean;
  lora_list: LoraListItem[];
  local_path?: string;
  model_scope_model_id?: string;
  model_scope_file_path?: string;
  generic_proxy?: boolean;
  gpu_selector?: {
    gpu_ids?: string[];
    gpu_type?: string;
    gpu_count?: number;
    gpus_per_replica?: number;
  };
  gpu_type_selector?: GPUTypeSelector | null;
  placement_strategy?: string;
  cpu_offloading?: boolean;
  worker_selector?: object;
  scheduleType?: string;
  // Which GPU source the manual mode picks from (ManualGPUModeMap): whole
  // cards or an InstanceType pool. UI-only, stripped before submit.
  manualGpuMode?: string;
  name: string;
  replicas: number;
  description: string;
  optimize_long_prompt: boolean;
  enable_speculative_decoding: boolean;
  cluster_id: number;
  extended_kv_cache: {
    enabled: boolean;
    // absent mode means 'local' (legacy deployments)
    mode?: 'local' | 'shared';
    cache_service_id?: number | null;
    chunk_size: number;
    ram_ratio: number;
    ram_size: number;
  };
  speculative_config: {
    enabled: boolean;
    algorithm: string;
    draft_model: string;
    num_draft_tokens: number;
    ngram_min_match_length: number;
    ngram_max_match_length: number;
  };
  scaling_schedule?: ScalingSchedule | null;
  max_context_len: number;

  // --- PD ---
  // UI-only: which of the Segmented's modes is selected. Stripped before
  // submit; `disaggregation` is what carries the intent.
  pdMode?: string;
  roles?: RoleFormItem[] | null;
  disaggregation?: DisaggregationSpec | null;
  /**
   * How far apart this group's members may sit. Beside `roles` rather than
   * inside `disaggregation`, mirroring the backend: gather describes the
   * relationship between *members*, and members come from `roles`.
   *
   * A layer without a strategy is refused server-side, so the two always move
   * together.
   */
  gather?: {
    strategy?: 'MustGather' | 'PreferGather' | null;
    layer?: string | null;
  } | null;
}

export interface ScalingScheduleRule {
  start_cron: string;
  duration_seconds?: number | null;
  replicas: number;
  name?: string;
}

export interface ScalingSchedule {
  enabled: boolean;
  baseline_replicas?: number | null;
  rules: ScalingScheduleRule[];
}

interface ComputedResourceClaim {
  offload_layers: number;
  total_layers: number;
  ram: number;
  vram: Record<string, number>;
}

export interface DistributedServerItem {
  pid: number;
  port: number;
  // Numeric on the wire (ModelInstanceSubordinateWorker.worker_id), so it
  // matches a worker's `id` by identity in the worker-list lookup.
  worker_id: number;
  computed_resource_claim: ComputedResourceClaim;
}

export interface DistributedServers {
  subordinate_workers: DistributedServerItem[];
}
// What the attached cache service did for one deployment's instances over
// the requested window, from the inference engine's own external-cache
// counters. available=false carries why no numbers can be read (the
// deployment uses no cache service, observability is off, Prometheus is
// unreachable); an engine that exports no counters keeps an empty row.
export interface ModelCacheMetrics {
  available: boolean;
  reason?: string;
  window?: number;
  instances: {
    model_instance_name?: string;
    worker_name?: string;
    hit_tokens?: number | null;
    queried_tokens?: number | null;
    hit_rate?: number | null;
  }[];
}

export interface ModelInstanceListItem {
  // --- PD ---
  // Which role of the parent Model this instance serves; absent for a plain
  // single-role deployment.
  role?: string | null;
  // Shared by every member of one group. A group is a *generation*, not a
  // replica index — pairing binds to this rather than to peer addresses,
  // because serving ports were measured to change on every rebuild.
  group_id?: string | null;
  // The generation this instance was created from. Differing from the model's
  // current digest is what makes the model stale.
  spec_digest?: string | null;
  named_ports?: Record<string, { base: number; count: number }> | null;
  backend?: string;
  cluster_id: number;
  // Inherited from the parent Model's owner_principal_id on the
  // wire so per-row tenant filtering works without joining.
  owner_principal_id?: number | null;
  backend_version?: string;
  source: string;
  categories?: string[];
  huggingface_repo_id: string;
  huggingface_filename: string;
  ollama_library_model_name: string;
  distributed_servers?: DistributedServers;
  computed_resource_claim?: ComputedResourceClaim;
  injected_backend_parameters?: string[];
  // Present only for shared-KV-cache deployments; injected=false means the
  // instance started without the shared cache and fell back to local mode.
  // The hit rate is not part of the instance: it is read per deployment
  // from ModelCacheMetrics and passed alongside.
  cache_config?: {
    injected: boolean;
    reason?: string;
    cache_service_name?: string;
    cache_service_id?: number;
    // present-tense view of the recorded endpoint: false when the cache
    // the engine started with has since gone away or moved
    endpoint_live?: boolean | null;
  };
  s3_address: string;
  worker_id: number;
  gpu_indexes?: number[];
  worker_ip: string;
  gpu_index: number;
  // Echoed from the parent Model when it was deployed via an InstanceType
  // (vGPU); drives the slice/partition display on the instance row.
  gpu_type_selector?: GPUTypeSelector | null;
  pid: number;
  port: number;
  name: string;
  state: string;
  state_message: string;
  /**
   * When scale-down picked this member, or null.
   *
   * It is still `running` and still answering the decodes already pulling from
   * it; what it no longer does is take new work, because the router dropped it
   * from its member list the moment this was set. The state column renders
   * that rather than the bare `running` the row would otherwise show for the
   * whole window and then vanish out of without a word.
   */
  draining_since?: string | null;
  download_progress: number;
  model_id: number;
  model_name: string;
  worker_name: string;
  id: number;
  created_at: string;
  updated_at: string;
  draft_model_source: {
    source: string;
    huggingface_repo_id: string;
    huggingface_filename: string;
    model_scope_model_id: string;
    model_scope_file_path: string;
    local_path: string;
  };
  draft_model_download_progress: 0;
  draft_model_resolved_path: string;
}

export interface ModelInstanceFormData {
  model_id: number;
  model_name: string;
  source: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
}

export interface GPUListItem {
  name: string;
  uuid: string;
  vendor: string;
  index: number;
  core: {
    total: number;
    utilization_rate: number;
  };
  memory: {
    total: number;
    utilization_rate: number;
    is_unified_memory: boolean;
    used: number;
    allocated: number;
  };
  temperature: number;
  id: string;
  worker_id: number;
  worker_name: string;
  worker_ip: string;
}

export interface CatalogItem {
  name: string;
  id: number;
  description: string;
  deployment_notes?: string;
  home: string;
  icon: string;
  categories: string[];
  capabilities: string[];
  size: number;
  size_unit: string;
  activated_size: number;
  licenses: string[];
  release_date: string;
  // Which source materialized this entry. Absent / builtin / official all mean
  // platform-owned content, which carries no badge.
  source_name?: string;
  source_type?: string;
}

export interface CatalogSpec {
  source: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
  ollama_library_model_name: string;
  model_scope_model_id: string;
  model_scope_file_path: string;
  local_path: string;
  name: string;
  description: string;
  meta: Record<string, any>;
  replicas: number;
  ready_replicas: number;
  categories: any[];
  placement_strategy: string;
  cpu_offloading: boolean;
  mode: string;
  distributed_inference_across_workers: boolean;
  worker_selector: Record<string, any>;
  gpu_selector: {
    gpu_ids: string[];
    gpus_per_replica: number;
  };
  extended_kv_cache: {
    enabled: boolean;
    // absent mode means 'local' (legacy deployments)
    mode?: 'local' | 'shared';
    cache_service_id?: number | null;
    chunk_size: number;
    max_local_cpu_size: number;
    remote_url: string;
  };
  speculative_config: {
    enabled: boolean;
    algorithm: string;
    draft_model: string;
    num_draft_tokens: number;
    ngram_min_match_length: number;
    ngram_max_match_length: number;
  };
  backend: string;
  backend_version: string;
  backend_parameters: any[];
  quantization: string;
  size: number;
}

export interface EvaluateSpec {
  source?: string;
  cluster_id?: number;
  huggingface_repo_id?: string;
  huggingface_filename?: string;
  ollama_library_model_name?: string;
  model_scope_model_id?: string;
  model_scope_file_path?: string;
  local_path?: string;
  name?: string;
  description?: string;
  meta?: Record<string, any>;
  replicas?: number;
  ready_replicas?: number;
  categories?: any[];
  placement_strategy?: string;
  cpu_offloading?: boolean;
  distributed_inference_across_workers?: boolean;
  worker_selector?: Record<string, any>;
  gpu_selector?: {
    gpu_ids: string[];
    gpus_per_replica: number;
  };
  backend?: string;
  backend_version?: string;
  backend_parameters?: any[];
  env?: Record<string, any>;
  distributable?: boolean;
  quantization?: string;
  size?: number;
}

export interface EvaluateResult {
  compatible: boolean;
  compatibility_messages: string[];
  scheduling_messages: string[];
  default_spec: Record<string, any>;
  error?: boolean;
  error_message?: string;
  resource_claim?: {
    ram: number;
    vram: number;
  };
  cluster_id?: number;
  resource_claim_by_cluster_id?: {
    [key: number]: {
      ram: number;
      vram: number;
    };
  };
  // Only a PD (role-bearing) deployment gets these, and then the claim above
  // is the WHOLE group's — every replica of every role plus the router —
  // rather than one instance's. A plain deployment leaves them undefined and
  // its claim keeps meaning exactly what it always did.
  role_resource_claims?: RoleResourceClaim[];
  role_resource_claims_by_cluster_id?: {
    [key: number]: RoleResourceClaim[];
  };
  // The mirror image of the two above, sent when a PD deployment does NOT fit.
  // There is no placement to read a claim off then, so these are what each
  // role asked for — and how many of it the cluster was measured to hold.
  role_resource_demands_by_cluster_id?: {
    [key: number]: RoleResourceDemand[];
  };
}

export interface RoleResourceClaim {
  role: string;
  replicas: number;
  // This role's whole demand, every replica summed.
  ram: number;
  vram: number;
  // What ONE member costs, absent when the members disagree (a role spread
  // over two accelerator types sizes differently on each).
  per_replica?: {
    ram: number;
    vram: number;
  } | null;
}

export interface RoleResourceDemand {
  role: string;
  replicas: number;
  // How many of this role's replicas the cluster was measured to hold, with
  // nothing else of the group standing in. Every role is measured that same
  // way, so the counts compare with each other — and a breakdown where every
  // role is individually satisfied is itself the answer: the members do not
  // fit TOGETHER.
  placeable: number;
  // This role's whole ask, every replica summed.
  ram: number;
  vram: number;
  // What ONE member costs, absent when no selector ever priced the role (no
  // worker was eligible for it, so none ever ran). Not the claims' meaning of
  // absent: a demand is one price per role, so members cannot disagree.
  per_replica?: {
    ram: number;
    vram: number;
  } | null;
}

export interface BackendGroupOption {
  value: string;
  label: string;
  title?: string;
  default_backend_param: string[];
  default_version: string;
  isBuiltIn: boolean;
  versions: { label: string; value: string; title?: string }[];
}

export interface BackendGroupItem {
  value: string;
  label: string;
  title?: string;
  default_backend_param: string[];
  default_version: string;
  isBuiltIn: boolean;
  backend_source: string;
  enabled: boolean;
  common_parameters?: string[];
  parameter_format?: 'space' | 'equal' | null;
  versions: {
    label: string;
    value: string;
    title?: string;
    env?: Record<string, any>;
    is_deprecated: boolean;
  }[];
}

export interface BackendOption {
  value: string;
  label: string;
  title?: string;
  default_backend_param: string[];
  default_version: string;
  isBuiltIn: boolean;
  backend_source: string;
  default_env?: Record<string, any>;
  enabled: boolean;
  common_parameters?: string[];
  parameter_format?: 'space' | 'equal' | null;
  // Which managed source produced the entry — null for the packaged content and
  // for anything a user added by hand, neither of which carries a badge.
  source_name?: string;
  source_type?: string;
  versions: {
    label: string;
    value: string;
    title?: string;
    env?: Record<string, any>;
    is_deprecated: boolean;
  }[];
}

export interface AccessControlFormData {
  // See `RouteItem.access_policy` for why plugin-defined values are
  // accepted alongside the built-ins. The OSS "specific users" entry
  // now writes `allowed_principals` (with a user-only grant list);
  // `allowed_users` remains accepted as the deprecated released value.
  access_policy: 'public' | 'authed' | 'allowed_users' | (string & {});
  // Omitted when the caller isn't managing the user list (the
  // principal-based override, or authed/public) so the server leaves
  // existing grants untouched; an explicit (possibly empty) list
  // replaces the route's USER-kind grants.
  users?: { id: number }[];
  // Full grant set (any kind) submitted by the principal-based override
  // on save — replaces the route's entire grant set. OSS leaves it unset
  // (it manages users via `users`).
  principals?: {
    principal_type: string;
    principal_id: number;
    principal_name?: string;
    principal_display_name?: string;
  }[];
}

export interface BackendItem {
  backend_name: string;
  from_config: boolean;
  default_version: string;
  default_backend_param: string[];
  is_built_in: boolean;
  backend_source: string;
  enabled: boolean;
  common_parameters?: string[];
  parameter_format?: 'space' | 'equal' | null;
  source_name?: string;
  source_type?: string;
  versions: {
    version: string;
    env?: Record<string, any>;
    is_deprecated: boolean;
  }[];
}

export interface DraftModelItem {
  source: string;
  huggingface_repo_id: string;
  huggingface_filename: string;
  ollama_library_model_name: string;
  model_scope_model_id: string;
  model_scope_file_path: string;
  local_path: string;
  name: string;
  algorithm: string;
}

export interface InstanceRestartCount {
  main_worker_id: number;
  workers: {
    worker_id: number;
    name: string;
    restarts: {
      previous: boolean;
      started_at: string;
      containers: string[];
    }[];
    error?: string | null;
  }[];
}

export interface ModelLoraAdapterResult {
  lora_list: Array<{
    is_local: boolean;
    lora_repo_name: string;
    source: 'huggingface' | 'model_scope' | 'local_path';
  }>;
}

/**
 * Which roles of a draft cannot fit on one machine, and how wide the widest
 * machine in the chosen cluster is.
 *
 * 🔴 `roles` empty means «no, OR not knowable», and the two must render
 * identically. The server answers empty for a width the engine was never told,
 * a fleet it cannot read, and a backend whose width it cannot ask for — so an
 * empty answer is the cue to show whatever the form showed before this could be
 * asked at all, never a third «unknown» state. That distinction is what the
 * removed `gather-feasibility` probe got wrong.
 */
export interface SpanningPreview {
  roles: { name: string; gpus: number }[];
  widest_worker_gpus: number;
}
