export type ImagePullPolicy = 'Always' | 'IfNotPresent' | 'Never';

// instance form data
export interface FormData {
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    type: string;
    image: string;
    imagePullPolicy: ImagePullPolicy;
    displayName: string;
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
      accelerator?: string;
    };
    description: string;
    volume: {
      ephemeral?: {
        capacity?: string;
      };
      persistent?: {
        name: string;
      };
    };
    sshPublicKey: {
      name: string;
    };
  };
}

export type InstanceServicePortProtocol = 'TCP' | 'UDP';

export interface InstanceStatus {
  hostIPs?: {
    ip: string;
  }[];
  phase?: string;
  phaseMessage?: string;
  podIPs?: {
    ip: string;
  }[];
  ports?: {
    port: number;
    nodePort?: number;
    protocol?: InstanceServicePortProtocol;
  }[];
}

// instance list item
export interface ListItem extends Omit<FormData, 'metadata'> {
  id: number;
  status?: InstanceStatus;
  metadata: {
    name: string;
    namespace?: string;
    uid: string;
    resourceVersion: string;
    creationTimestamp: string;
    annotations?: Record<string, string>;
    managedFields?: {
      manager: string;
      operation: string;
      apiVersion: string;
      time: string;
      fieldsType: string;
      fieldsV1: Record<string, any>;
    }[];
  };
}

type Quality =
  | `${number}`
  | `${number}Ki`
  | `${number}Mi`
  | `${number}Gi`
  | `${number}Ti`;

export interface InstanceTypeResource {
  capacity?: Quality;
  onceMaxRequest?: Quality;
  remaining?: Quality;
}

export interface InstanceTypeStatus {
  accelerator: InstanceTypeResource;
  cpu: InstanceTypeResource;
  localStorage: InstanceTypeResource;
  phase: string;
  phaseMessage?: string;
  ram: InstanceTypeResource;
}

export interface InstanceTypeMetadata {
  name: string;
  namespace?: string;
  uid?: string;
  resourceVersion?: string;
  creationTimestamp?: string;
  generateName?: string;
  generation?: number;
  finalizers?: string[];
}

export interface InstanceTypeSpec {
  acceleratable: boolean;
  group: string;
  computeCapability?: string;
  family?: string;
  manufacturer?: string;
  memory?: string;
  product?: string;
  sliced?: number;
}

export interface InstanceTypeItem {
  apiVersion: string;
  kind: string;
  id: number;
  metadata: InstanceTypeMetadata;
  spec: InstanceTypeSpec;
  status: InstanceTypeStatus;
}

export interface InstanceEventObjectReference {
  apiVersion?: string;
  fieldPath?: string;
  kind?: string;
  name?: string;
  namespace?: string;
  resourceVersion?: string;
  uid?: string;
}

export interface InstanceEventSource {
  component?: string;
  host?: string;
}

export interface InstanceEventSeries {
  count?: number;
  lastObservedTime?: string;
}

export interface InstanceEventItem {
  action?: string;
  apiVersion?: string;
  count?: number;
  eventTime?: string;
  firstTimestamp?: string;
  involvedObject: InstanceEventObjectReference;
  kind?: string;
  lastTimestamp?: string;
  message?: string;
  metadata: {
    name?: string;
    namespace?: string;
    uid?: string;
    resourceVersion?: string;
    creationTimestamp?: string;
  };
  reason?: string;
  related?: InstanceEventObjectReference;
  reportingComponent?: string;
  reportingInstance?: string;
  series?: InstanceEventSeries;
  source?: InstanceEventSource;
  type?: string;
}

export interface InstanceEvents {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    resourceVersion?: string;
  };
  items: InstanceEventItem[];
}

export interface InstanceLogQueryParams {
  follow?: boolean;
  limitBytes?: number;
  sinceSeconds?: number;
  tailLines?: number;
  timestamps?: boolean;
  pretty?: string;
}

export type InstanceLog = string;
