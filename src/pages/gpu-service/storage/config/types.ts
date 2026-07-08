export interface FormData {
  name: string;
  owner_principal_id?: number | null;
  displayName?: string | null;
  description?: string | null;
  spec: {
    type: string;
    capacity: string;
  };
}

// Per `GPUInstancePersistentVolumeUpdate`, only displayName / description /
// owner_principal_id are mutable post-create.
export interface UpdateData {
  owner_principal_id?: number | null;
  displayName?: string | null;
  description?: string | null;
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
    type: string;
    capacity: string;
  };
  status?: {
    phase?: string | null;
    phaseMessage?: string | null;
  } | null;
}

export interface StorageClassNFS {
  server: string;
  share: string;
  subDirectory?: string | null;
  mountPermissions?: string | null;
  mountOptions?: string[] | null;
}

export interface StorageClassS3 {
  endpoint: string;
  region?: string | null;
  insecure?: boolean | null;
  accessKey?: string | null;
  bucket?: string | null;
  mountOptions?: string[] | null;
}

export interface StorageClassItem {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  owner_principal_id?: number | null;
  displayName?: string | null;
  description?: string | null;
  name: string;
  spec: {
    nfs?: StorageClassNFS | null;
    s3?: StorageClassS3 | null;
  };
}
