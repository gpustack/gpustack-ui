export type ImagePullPolicy = 'Always' | 'IfNotPresent' | 'Never';

export interface InstanceEnvVar {
  name: string;
  value?: string;
}

export interface InstancePort {
  port: number;
  protocol?: string;
}

export interface InstanceResources {
  cpu?: string;
  ram?: string;
  localStorage?: string;
  accelerator?: string;
}

export interface InstanceVolume {
  ephemeral?: {
    capacity?: string;
  };
  persistent?: {
    name: string;
  };
}

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
    ports: InstancePort[];
    env: InstanceEnvVar[];
    volumeMount: string;
    resources: InstanceResources;
    description: string;
    volume: InstanceVolume;
    sshPublicKey: {
      name: string;
    };
  };
}

export interface ManagedField {
  manager: string;
  operation: string;
  apiVersion: string;
  time: string;
  fieldsType: string;
  fieldsV1: Record<string, any>;
}

export interface Metadata {
  name: string;
  namespace?: string;
  uid: string;
  resourceVersion: string;
  creationTimestamp: string;
  annotations?: Record<string, string>;
  managedFields?: ManagedField[];
}

// instance list item
export interface ListItem extends Omit<FormData, 'metadata'> {
  id: number;
  status?: string;
  metadata: Metadata;
}

export interface InstanceItem {
  id: number;
  name: string;
  vram: number; // GiB
  ram: number; // GiB
  vCPU: number; // cores
  gpu_count: number;
  status: string; // available, unavailable
}

export interface InstanceTypeSpec {
  acceleratable: boolean;
  computeCapability?: string;
  family?: string;
  group: string;
  manufacturer?: string;
  memory?: string;
  product?: string;
  sliced?: number;
}

type Quality = `${number}Ki` | `${number}Gi`;

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

export interface InstanceTypeItem {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
  };
  id: number;
  spec: InstanceTypeSpec;
  status: InstanceTypeStatus;
}
