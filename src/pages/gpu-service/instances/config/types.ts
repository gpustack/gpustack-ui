export type ImagePullPolicy = 'Always' | 'IfNotPresent' | 'Never';

type QuanityCPU = `${number}m` | string;

type QuanityMemory =
  | `${number}Ki`
  | `${number}Mi`
  | `${number}Gi`
  | `${number}Ti`
  | string;

type QuanityLocalStorage =
  | `${number}Ki`
  | `${number}Mi`
  | `${number}Gi`
  | `${number}Ti`
  | string;

// instance form data
export interface FormData {
  name: string;
  clusterId?: number | null;
  owner_principal_id?: number | null;
  displayName?: string | null;
  description?: string | null;
  enable_ssh?: boolean;
  storageMode?: string;
  spec: {
    type: string;
    image: string;
    imagePullPolicy: ImagePullPolicy;
    command: string[];
    ports: {
      port: number;
      protocol?: string;
      name?: string;
    }[];
    env: {
      name: string;
      value?: string;
    }[];
    volumeMount: string;
    resources: {
      cpu: string | null | number;
      ram: string | null | number;
      localStorage: string | null | number;
      accelerator: number | string | null;
      // Sliced (percentage) mode only. Memory (VRAM) percentage bound to the
      // 10-100 selector + free input; cores (compute) percentage bound to the
      // "100% compute" checkbox (100 when checked, mirrors memory otherwise).
      acceleratorSlicedMemoryPercentage?: number;
      acceleratorSlicedCoresPercentage?: number;
    };
    volume: {
      ephemeral?: {
        capacity?: string;
      };
      persistent?: {
        name: string;
      };
      persistentTemplate?: {
        name?: string;
        spec: {
          type: string;
          capacity: string;
        };
        releaseWithInstance?: boolean;
      };
    };
    sshPublicKeys?: { name: string }[];
  };
}

export type InstanceServicePortProtocol = 'TCP' | 'UDP';

export interface InstanceIP {
  ip: string;
}

export interface InstanceServicePort {
  port: number;
  name: string;
  nodePort?: number;
  protocol?: InstanceServicePortProtocol;
}

export interface InstanceStatusAllocationItem {
  id: string;
  manufacturer: string;
  accelerators: [
    {
      id: string;
      index: number;
      mode: string;
      allocated: number;
    }
  ];
}

export interface InstanceStatus {
  namespace?: string;
  phase?: string;
  phaseMessage?: string;
  nodeName?: string;
  accessAddresses?: string[];
  hostIPs?: InstanceIP[];
  podIPs?: InstanceIP[];
  ports?: InstanceServicePort[];
  allocations?: InstanceStatusAllocationItem[];
}

// instance list item
export interface ListItem extends FormData {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  creator_id?: number | null;
  clusterId: number;
  status?: InstanceStatus | null;
}

// =========== Instance Types ===========

export interface InstanceTypeResource {
  onceMaxRequest: string;
  remaining: string;
  capacity: string;
}

export interface InstanceTypeCandidate {
  cluster: string;
  name: string;
  accelerator?: InstanceTypeResource | null;
  cpu?: InstanceTypeResource | null;
  // Shared-mode available resource (not shown in the GPU Instance form).
  acceleratorShared?: InstanceTypeResource | null;
  // Sliced-mode available resource.
  acceleratorSliced?: InstanceTypeResource | null;
  // This candidate's sliced (partitioning) capability.
  acceleratorSlicedDetail?: AcceleratorSlicedDetail | null;
  phase?: 'Active' | 'Inactive' | 'Draining' | null;
}

// Per-mode maxima as plain number strings — the shape of the aggregated
// status.onceMaxRequest / status.remaining AND of tier onceMaxRequest /
// remaining (they are identical in the API). accelerator counts whole cards,
// acceleratorShared / acceleratorSliced are percentages, cpu is cores. The
// API carries no ram / localStorage here — RAM caps derive from
// spec.unitResources, disk from spec.localStorage.
export interface InstanceTypeOverviewResource {
  accelerator?: `${number}` | null;
  acceleratorShared?: `${number}` | null;
  acceleratorSliced?: `${number}` | null;
  cpu?: QuanityCPU | null;
}

export interface InstanceTypeTier {
  onceMaxRequest: InstanceTypeOverviewResource;
  remaining?: InstanceTypeOverviewResource | null;
  // The tier's aggregated sliced (partitioning) capability.
  acceleratorSlicedDetail?: AcceleratorSlicedDetail | null;
  candidates?: InstanceTypeCandidate[] | null;
}

export interface CPUCache {
  l1i?: string | null;
  l1d?: string | null;
  l2?: string | null;
  l3?: string | null;
}

export interface CPUInfo {
  physicalCores?: string | null;
  threadsPerPhysicalCore?: string | null;
  logicalCores?: string | null;
  stepping?: string | null;
  clockSpeed?: string | null;
  maxClockSpeed?: string | null;
  cacheLine?: string | null;
  cache?: CPUCache | null;
  manufacturer?: string | null;
  product?: string | null;
  family?: string | null;
}

// Sliced (partitioning) capability descriptor. Replaces the removed
// `spec.sliceable` boolean: a type is sliceable when logical (soft) slicing
// reports capacity or physical (e.g. MIG) profiles exist — see
// isSliceableDetail in ./index. Appears as status.detail.slicedDetail and as
// tier / candidate `acceleratorSlicedDetail` in the aggregated view.
export interface AcceleratorSlicedLogicalDetail {
  coresPercentageOvercommit?: boolean;
  // Max soft slices per card; 0 → soft slicing unsupported.
  count?: number | null;
}

export interface AcceleratorSlicedPhysicalDetailProfile {
  name?: string | null;
  count?: number | null;
}

export interface AcceleratorSlicedPhysicalDetail {
  profiles?: AcceleratorSlicedPhysicalDetailProfile[] | null;
  count?: number | null;
}

export interface AcceleratorSlicedDetail {
  logical?: AcceleratorSlicedLogicalDetail | null;
  physical?: AcceleratorSlicedPhysicalDetail | null;
}

// status.detail — the observed hardware descriptor. The API moved these off
// spec (spec keeps user-defined fields only). The whole object is absent until
// the operator backfills status, and every response is exclude_none — treat
// every key as possibly missing.
export interface InstanceTypeDetail {
  // Device identity.
  manufacturer?: string | null;
  product?: string | null;
  family?: string | null;
  // Host node CPU (flat fields, as opposed to the nested `cpu` below).
  physicalCores?: string | null;
  threadsPerPhysicalCore?: string | null;
  logicalCores?: string | null;
  stepping?: string | null;
  clockSpeed?: string | null;
  maxClockSpeed?: string | null;
  cacheLine?: string | null;
  cache?: CPUCache | null;
  // Accelerator hardware.
  memory?: string | null;
  cores?: string | null;
  computeCapability?: string | null;
  slicedDetail?: AcceleratorSlicedDetail | null;
  // The accelerator's own CPU (distinct from the flat host CPU fields above).
  cpu?: CPUInfo | null;
}

// Mirrors the API spec object exactly (user-defined fields only — observed
// hardware lives on status.detail), plus two UI-computed enrichments filled by
// use-query-instance-types whose names exist nowhere in the API.
export interface InstanceTypeSpec {
  displayName?: string | null;
  acceleratorGroup?: string | null;
  generalGroup?: string | null;
  acceleratable?: boolean;
  os?: string;
  arch?: string;
  localStorage?: QuanityLocalStorage;
  unitResources?: {
    cpu: QuanityCPU;
    ram: QuanityMemory;
  };
  // ---- UI-computed (not part of the API contract) ----
  // spec.unitResources parsed to numbers.
  unitResourcesParsed?: {
    cpu: {
      cores?: number;
      unit: string;
      num: number;
    } | null;
    ram: {
      value: number;
      unit: string;
      num: number;
    } | null;
  };
  // Max requestable unit (card / core) count, derived from status.
  maxComputeUnitCount?: number;
}

// Flat spec snapshot persisted in a GPU instance's `description` field at
// create time (see utils/instance-description.ts) and reused as the display
// model of the type card / metadata section. It merges the definition spec
// with the observed hardware from status.detail and the derived `sliceable`.
// The flat shape is a UI document format — do NOT confuse it with the API
// InstanceTypeSpec; it stays flat for compatibility with snapshots persisted
// by older instances.
export interface InstanceTypeSnapshotSpec extends InstanceTypeSpec {
  manufacturer?: string | null;
  product?: string | null;
  family?: string | null;
  memory?: string | null;
  sliceable?: boolean;
  // Accelerator CPU identity only (from status.detail.cpu).
  cpu?: Pick<CPUInfo, 'manufacturer' | 'product' | 'family'> | null;
}

export interface InstanceTypeStatus {
  detail?: InstanceTypeDetail | null;
  onceMaxRequest: InstanceTypeOverviewResource;
  remaining?: InstanceTypeOverviewResource | null;
  tiers?: InstanceTypeTier[] | null;
}

export interface InstanceTypeItem {
  name: string;
  spec: InstanceTypeSpec;
  disabled?: boolean;
  status: InstanceTypeStatus;
}

export interface InstanceEventItem {
  type?: string;
  reason?: string;
  message?: string;
  count?: number;
  eventTime?: string;
  firstTimestamp?: string;
  lastTimestamp?: string;
  reportingComponent?: string;
  reportingInstance?: string;
  source?: {
    component?: string;
    host?: string;
  };
  series?: {
    count?: number;
    lastObservedTime?: string;
  };
  metadata?: {
    name?: string;
    namespace?: string;
  };
}

export interface InstanceEvents {
  items: InstanceEventItem[];
}

export type InstanceLog = string;

export interface InstanceLogQueryParams {
  follow?: boolean;
  limitBytes?: number;
  sinceSeconds?: number;
  tailLines?: number;
  timestamps?: boolean;
  pretty?: string;
}
