export type ImagePullPolicy = 'Always' | 'IfNotPresent' | 'Never';

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
      cpu?: string;
      ram?: string;
      localStorage?: string;
      // Stored in the form as a number so NumberSelection's strict
      // equality picks up the active item. Serialized to a string at the
      // API boundary in handleFinish.
      accelerator?: number | string;
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

export interface InstanceStatus {
  namespace?: string;
  phase?: string;
  phaseMessage?: string;
  hostIPs?: InstanceIP[];
  podIPs?: InstanceIP[];
  ports?: InstanceServicePort[];
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

export interface InstanceTypeTier {
  onceMaxRequest: string;
  candidates?: InstanceTypeCandidate[] | null;
}

export interface InstanceTypeRemainingResource {
  accelerator?: string | null;
  cpu: string;
  ram: string;
  localStorage: string;
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
}

export interface InstanceTypeStatus {
  remaining: InstanceTypeRemainingResource;
  acceleratorTiers?: InstanceTypeTier[] | null;
}

export interface InstanceTypeItem {
  name: string;
  spec: InstanceTypeSpec;
  disabled?: boolean;
  maxAccelerator?: number;
  status: InstanceTypeStatus;
}

// =========== Events / logs (placeholder) ===========
// The /v2/gpu-instances API does not yet expose log/event endpoints. These
// shapes are retained as minimal placeholders so disabled UI continues to
// compile until backend support lands.

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
