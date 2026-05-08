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
    accessMode: AccessModeType;
    capacity: string;
    type: string;
  };
}

export interface ListItem extends FormData {
  id: number;
  created_at?: string;
  updated_at?: string;
}
