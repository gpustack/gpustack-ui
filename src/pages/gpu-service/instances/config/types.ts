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

type Quality = `${number}Ki` | `${number}Gi`;

export interface InstanceTypeResource {
  capacity?: Quality;
  onceMaxRequest?: Quality;
  remaining?: Quality;
}

export interface InstanceTypeItem {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
  };
  id: number;
  spec: {
    acceleratable: boolean;
    computeCapability?: string;
    family?: string;
    group: string;
    manufacturer?: string;
    memory?: string;
    product?: string;
    sliced?: number;
  };
  status: {
    accelerator: InstanceTypeResource;
    cpu: InstanceTypeResource;
    localStorage: InstanceTypeResource;
    phase: string;
    phaseMessage?: string;
    ram: InstanceTypeResource;
  };
}
