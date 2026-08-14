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

// One GPU instance currently referencing a volume.
export interface AttachedInstance {
  id: number;
  name?: string | null;
  // On the wire, deliberately not rendered by the list column: the reference is
  // not phase-filtered (a *Stopped* instance holds the volume and blocks its
  // reclaim just as a running one does), so being listed at all is what the
  // reader needs — the phase would read "(Ready)" on nearly every row. It is
  // shown where it is load-bearing: the blocked-delete message. See the
  // Attached Instances cell in ``use-storage-columns``.
  phase?: string | null;
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
  // Read-only, resolved by the API. A volume has its own lifecycle: it is
  // created independently and keeps being metered while nothing is attached.
  // That is intended, but it used to be invisible — an idle-but-billed volume
  // looked exactly like one in use, and there was no way to tell whether
  // deleting it was safe.
  //
  // ``undefined`` = not resolved (an older server); ``[]`` = confirmed nothing
  // attached. Only the second justifies telling the user the volume is idle.
  //
  // camelCase because that is what the wire carries: this model is serialized
  // with the camel alias generator, same as ``displayName`` / ``phaseMessage``
  // above (the timestamp mixin's fields stay snake_case, hence the mix).
  attachedInstances?: AttachedInstance[] | null;
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
