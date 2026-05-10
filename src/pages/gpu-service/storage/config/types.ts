export type AccessModeType =
  | 'ReadOnlyMany'
  | 'ReadWriteMany'
  | 'ReadWriteOnce'
  | 'ReadWriteOncePod';

export type ReClaimPolicyType = 'Retain' | 'Delete' | 'Recycle';
export interface FormData {
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    capacity: string;
    type: string;
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
  finalizers?: string[];
  managedFields?: ManagedField[];
}

export interface ListItem {
  metadata: Metadata;
  spec: {
    type: string;
    capacity: string;
    accessMode: AccessModeType;
  };
  status: {
    phase: 'Available' | 'Unavailable' | 'Pending';
    volume: {
      name: string;
    };
  };
}

export interface StorageClassItem {
  metadata: Metadata;
  provisioner: string;
  reclaimPolicy: 'Delete' | 'Retain';
  volumeBindingMode: 'Immediate' | 'WaitForFirstConsumer';
}
