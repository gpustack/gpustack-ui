import { ProviderType } from '.';

export interface CredentialFormData {
  name: string;
  provider: string;
  key: string;
  secret: string;
  description?: string;
  id?: number;
}

export type ClusterStatusType = 'provisioning' | 'provisioned' | 'ready';

export interface CredentialListItem {
  id: number;
  name: string;
  provider: ProviderType;
  access_key: string;
  secret_key: string;
  description?: string;
  owner_principal_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface NodePoolFormData {
  name: string;
  instance_type: string;
  os_image: string;
  image_name: string;
  replicas: number;
  batch_size: number;
  labels: Record<string, string>;
  cloud_options: Record<string, any>;
  instance_spec: Record<string, any>;
}

export interface NodePoolListItem extends NodePoolFormData {
  id: number;
  instance_type: string;
  replicas: number;
  workers: number;
  ready_workers?: number;
  batch_size: number;
  labels: Record<string, string>;
  cloud_options: Record<string, any>;
  os_image: string;
  created_at: string;
  updated_at: string;
  cluster_id: number;
}
export interface VolumeMount {
  name: string;
  mountPath: string;
  readOnly: boolean;
  volumeSource: {
    hostPath: {
      path: string;
      type: string;
    };
    persistentVolumeClaim: {
      claimName: string;
      readOnly: boolean;
    };
    configMap: {
      name: string;
      optional: boolean;
    };
  };
}

export interface ImageCredential {
  registry: string;
  username: string;
  password: string;
}

export interface GpuInstanceOptions {
  // The mere presence of `gpuInstanceOptions` on `k8s_options` signals
  // "GPU instances enabled" for the cluster — absence opts the cluster out,
  // so there's no separate boolean flag on the wire.
  gpuInstancesAccessStaticAddress?: string | null;
}

export interface K8sOptions {
  // Backend serializes K8sOptions with camelCase aliases (by_alias=True on
  // the SQL JSON column). The top-level `k8s_options` field on the cluster
  // stays snake_case, but everything inside follows the backend wire shape.
  volumeMounts?: VolumeMount[];
  imageCredentials?: ImageCredential[];
  // Base nodeSelector applied to every worker DaemonSet; each per-runtime
  // DaemonSet additionally gets a vendor PCI-presence label merged on top at
  // render time, so per-vendor overrides are no longer configured here.
  nodeSelector?: Record<string, string>;
  // Override for the gpustack-operator container image. Falls back to the
  // server's default when unset.
  operatorImage?: string | null;
  // GPU-instance support knobs; presence enables GPU instance handling.
  gpuInstanceOptions?: GpuInstanceOptions;
  // Kubernetes namespace the cluster's manifests render into. Falls back to
  // `gpustack-system` at render time when unset.
  namespace?: string | null;
}

export interface ClusterListItem {
  name: string;
  display_name: string;
  is_default: boolean;
  description: string;
  worker_config: Record<string, any>;
  // Per-cluster default container registry, promoted out of worker_config to
  // a top-level column on the backend (image resolution / registration token
  // read it directly). Falls back to the server default when unset.
  system_default_container_registry?: string | null;
  provider: ProviderType;
  credential_id: number;
  created_at: string;
  zone: string;
  region: string;
  gpus: number;
  models: number;
  workers: number;
  ready_workers: number;
  id: number;
  state: ClusterStatusType;
  state_message: string;
  worker_pools: NodePoolListItem[];
  k8s_options?: K8sOptions;
  // Backend ClusterPublic carries this; admin-"All" namespace
  // resolution falls back to the cluster's owner Org name.
  owner_principal_id?: number;
}

export interface ClusterFormData {
  name: string;
  description: string;
  provider: ProviderType;
  is_default?: boolean;
  credential_id: number;
  zone: string;
  region: string;
  server_url?: string;
  worker_config?: Record<string, any>;
  system_default_container_registry?: string | null;
  worker_pools?: NodePoolFormData[];
  k8s_options?: K8sOptions;
}

export interface SystemConfig {
  disable_builtin_observability?: boolean;
  debug: boolean;
  grafana_url?: string;
  server_external_url: string | null;
  system_default_container_registry: string | null;
  showMonitoring?: boolean;
}
