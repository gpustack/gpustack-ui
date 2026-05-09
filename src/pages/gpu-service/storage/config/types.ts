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
  managedFields?: ManagedField[];
}

export interface ListItem extends Omit<FormData, 'metadata'> {
  id: number;
  metadata: Metadata;
}

export interface StorageClassItem {
  metadata: Metadata;
  provisioner: string;
  reclaimPolicy: 'Delete' | 'Retain';
  volumeBindingMode: 'Immediate' | 'WaitForFirstConsumer';
}
