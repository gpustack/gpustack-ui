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
  accelerator: InstanceTypeResource;
  cpu: InstanceTypeResource;
  ram: InstanceTypeResource;
  localStorage: InstanceTypeResource;
}

export interface InstanceTypeTierOnceMaxRequestResource {
  accelerator?: string;
  cpu: QuanityCPU;
  ram: QuanityMemory;
  localStorage: QuanityLocalStorage;
}

export interface InstanceTypeTier {
  onceMaxRequest: InstanceTypeTierOnceMaxRequestResource;
  candidates?: InstanceTypeCandidate[] | null;
}

export interface InstanceTypeOnceMaxRequestResource {
  accelerator?: `${number}` | null;
  cpu: QuanityCPU;
  ram: QuanityMemory;
  localStorage: QuanityLocalStorage;
}

export interface InstanceTypeSpec {
  group: string;
  acceleratable: boolean;
  manufacturer: string;
  product?: string | null;
  memory?: string | null;
  family?: string | null;
  computeCapability?: string | null;
  sliced?: string | null;
  maxComputeUnitCount?: number;
  unitResources?: {
    cpu: QuanityCPU;
    ram: QuanityMemory;
  };
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
}

export interface InstanceTypeStatus {
  onceMaxRequest: InstanceTypeOnceMaxRequestResource;
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
