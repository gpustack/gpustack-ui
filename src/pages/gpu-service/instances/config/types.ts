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

// instance list item
export interface ListItem extends FormData {
  id: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
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

export interface InstanceTypeResource {
  capacity?: string;
  onceMaxRequest?: string;
  remaining?: string;
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
  name: string;
  spec: InstanceTypeSpec;
  status: InstanceTypeStatus;
}
