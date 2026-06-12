export type StorageTypeKind = 'nfs' | 's3';

export interface StorageTypeNFS {
  server: string;
  share: string;
  subDirectory?: string | null;
  mountPermissions?: string | null;
  mountOptions?: string[] | null;
}

export interface StorageTypeS3 {
  endpoint: string;
  region?: string | null;
  insecure?: boolean | null;
  accessKey?: string | null;
  secretKey?: string | null;
  bucket?: string | null;
  mountOptions?: string[] | null;
}

export interface FormData {
  name: string;
  owner_principal_id?: number | null;
  displayName?: string | null;
  description?: string | null;
  type: StorageTypeKind;
  spec: {
    nfs?: StorageTypeNFS | null;
    s3?: StorageTypeS3 | null;
  };
}

export interface ListItem {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  owner_principal_id?: number | null;
  creator_id?: number | null;
  displayName?: string | null;
  description?: string | null;
  name: string;
  spec: {
    nfs?: StorageTypeNFS | null;
    s3?: Omit<StorageTypeS3, 'secretKey'> | null;
  };
}
