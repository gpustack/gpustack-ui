import { StatusMaps } from '@/config';
import { GPUSTACK_API_BASE_URL } from '@/config/settings';
import { StatusType } from '@/config/types';
import { GPUsConfigs } from '@/pages/resources/config/gpu-driver';
import { icons } from '@gpustack/core-ui';

export const ClusterStatusValueMap = {
  Provisioning: 'provisioning',
  Ready: 'ready',
  Provisioned: 'provisioned',
  Pending: 'pending'
};

export const ClusterStatusLabelMap = {
  [ClusterStatusValueMap.Provisioning]: 'Provisioning',
  [ClusterStatusValueMap.Ready]: 'Ready',
  [ClusterStatusValueMap.Provisioned]: 'Provisioned',
  [ClusterStatusValueMap.Pending]: 'Pending'
};

export const ClusterStatus: Record<string, StatusType> = {
  [ClusterStatusValueMap.Provisioning]: StatusMaps.transitioning,
  [ClusterStatusValueMap.Ready]: StatusMaps.success,
  [ClusterStatusValueMap.Provisioned]: StatusMaps.transitioning,
  [ClusterStatusValueMap.Pending]: StatusMaps.transitioning
};

export const ProviderValueMap = {
  Kubernetes: 'Kubernetes',
  DigitalOcean: 'DigitalOcean',
  // Matches the backend's `ClusterProvider` enum, which is what
  // `cluster.provider` / `cloud_credential.provider` store.
  Shuihua: 'Shuihua',
  Docker: 'Docker',
  HuaweiCloud: 'HuaweiCloud',
  AliCloud: 'AlibabaCloud',
  TencentCloud: 'TencentCloud',
  AWS: 'AWS'
};

export type ProviderType = keyof typeof ProviderValueMap | null | undefined;

export const ProviderLabelMap = {
  [ProviderValueMap.Kubernetes]: 'Kubernetes',
  [ProviderValueMap.DigitalOcean]: 'DigitalOcean',
  // Display-only brand name; the API identity is the bare `Shuihua` above.
  [ProviderValueMap.Shuihua]: 'SHUIHUA FUTURE',
  [ProviderValueMap.Docker]: 'Docker'
};

/**
 * Mirrors the backend's `DOCKER_HUB_REGISTRY_HOSTS` (`routes/clusters.py`).
 * Shuihua instances cannot reach Docker Hub, so a registry resolving to one of
 * these hosts is rejected on submit — we check it in the form to fail fast.
 */
export const DOCKER_HUB_REGISTRY_HOSTS = [
  'docker.io',
  'index.docker.io',
  'registry-1.docker.io',
  'registry.hub.docker.com'
];

/**
 * The registry host, as the backend's `is_docker_hub_registry` compares it:
 * scheme, port and path dropped. `https://docker.io/library` and
 * `docker.io:443` are the same unreachable host as a bare `docker.io`, and the
 * point of checking here is to say so before the submit does.
 */
const registryHost = (registry: string) =>
  registry
    .trim()
    .replace(/^[a-z][a-z\d+.-]*:\/\//i, '')
    .replace(/^\/+/, '')
    .split('/')[0]
    .split(':')[0]
    .toLowerCase();

export const isDockerHubRegistry = (registry: string) =>
  DOCKER_HUB_REGISTRY_HOSTS.includes(registryHost(registry));

/**
 * Registries a Shuihua instance can actually pull GPUStack images from.
 *
 * Suggestions, *not* a whitelist: the backend only denies Docker Hub hosts, so
 * a company's own Harbor / mirror has to stay typeable — which is why the
 * field is an AutoComplete rather than a Select.
 */
export const SHUIHUA_REGISTRY_SUGGESTIONS = [
  'quay.io',
  'swr.cn-south-1.myhuaweicloud.com'
];

/**
 * Compact display name for tight slots — currently only the create wizard's
 * step-0 subtitle, which sits inline right after the step title. Falls back to
 * the full brand name, so a provider only needs an entry here when that name
 * is too long for the slot.
 */
export const ProviderShortLabelMap: Record<string, string> = {
  [ProviderValueMap.Shuihua]: 'SHUIHUA'
};

export const getProviderShortLabel = (
  provider?: ProviderType | string | null
) =>
  (provider &&
    (ProviderShortLabelMap[provider] || ProviderLabelMap[provider])) ||
  provider ||
  '';

/**
 * Providers whose clusters GPUStack provisions through a cloud API: they are
 * created against a cloud credential + region and get their workers from node
 * pools, instead of a worker registration command (Docker / Kubernetes).
 *
 * Everything that used to be hardcoded as `provider === DigitalOcean` — the
 * credential/region form block, the node-pool wizard step, the expandable
 * pool rows, the "Add Node Pool" row action — is keyed off this list, so a new
 * cloud provider only has to be added here plus in `cloudProviderAdapters`.
 */
export const CloudProviderList = [
  ProviderValueMap.DigitalOcean,
  ProviderValueMap.Shuihua
];

export const isCloudProvider = (provider?: ProviderType | string | null) =>
  !!provider && CloudProviderList.includes(provider as string);

/**
 * Example shown in the "GPUStack Server URL" field's tip, per provider. A
 * Kubernetes worker reaches the server through an in-cluster Service, so its
 * example is a Service DNS name; every other provider's workers are plain
 * hosts on the network — a Docker daemon or a cloud instance — and dial an
 * `ip:port` instead.
 */
export const getServerUrlExample = (provider?: ProviderType | string | null) =>
  provider === ProviderValueMap.Kubernetes
    ? 'http://gpustack-server-cluster-ip.gpustack-system.svc:30080'
    : 'http://192.168.1.100:80';

export const generateK8sRegisterCommand = (params: {
  // Either a single GPU driver key (legacy single-select) or an array of
  // keys (multi-vendor mode). Both feed into a list of runtimes for the
  // ?runtime=... query parameters the backend accepts (repeatable).
  currentGPU?: string;
  currentGPUs?: string[];
  server: string;
  clusterId: number | null;
  registrationToken: string;
}) => {
  const keys =
    params.currentGPUs && params.currentGPUs.length > 0
      ? params.currentGPUs
      : params.currentGPU
        ? [params.currentGPU]
        : [];
  const runtimes = keys
    .map((k) => GPUsConfigs[k]?.runtime)
    .filter((r): r is string => !!r);
  const query = runtimes.map((r) => `runtime=${r}`).join('&');
  return `curl -k -L '${params.server}/${GPUSTACK_API_BASE_URL}/clusters/${params.clusterId}/manifests${query ? `?${query}` : ''}' \\
--header 'Authorization: Bearer ${params.registrationToken}' | kubectl apply -f -`;
};

// Labels for the keys a provider may report in an instance type's `specInfo`
// (see `cloudProviderAdapters`); an unmapped key falls back to the key itself.
export const instanceTypeFieldMap = {
  vram: 'VRAM',
  vcpus: 'vCPUs',
  ram: 'RAM',
  bootDisk: 'Boot Disk',
  scratchDisk: 'Scratch Disk',
  minDiskSize: 'Min Disk Size',
  size: 'Size',
  // Shuihua reports a spec template's model, price and stock instead of a
  // hardware breakdown.
  gpuModel: 'GPU Model',
  pricePerHour: 'Price',
  remaining: 'Remaining'
};

export const vendorIconMap = {
  amd: 'icon-amd',
  nvidia: 'icon-nvidia1',
  rockyLinux: 'icon-rocky-linux',
  almaLinux: 'icon-alma-linux',
  ubuntu: 'icon-ubuntu',
  centOs: 'icon-centos',
  debian: 'icon-debian',
  fedora: 'icon-fedora'
};

export const credentialActionList = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: icons.EditOutlined
  },
  {
    key: 'delete',
    props: {
      danger: true
    },
    label: 'common.button.delete',
    icon: icons.DeleteOutlined
  }
];

export const CloudOptionItems = [
  {
    label: 'Volumes',
    key: 'volumes'
  }
];

export const hostTypeOptions = [
  {
    label: 'clusters.volume.hostPath.type.directory',
    locale: true,
    value: 'Directory'
  },
  {
    label: 'clusters.volume.hostPath.type.directoryOrCreate',
    locale: true,
    value: 'DirectoryOrCreate'
  },
  {
    label: 'clusters.volume.hostPath.type.file',
    locale: true,
    value: 'File'
  },
  {
    label: 'clusters.volume.hostPath.type.fileOrCreate',
    locale: true,
    value: 'FileOrCreate'
  },
  {
    label: 'clusters.volume.hostPath.type.socket',
    locale: true,
    value: 'Socket'
  },
  {
    label: 'clusters.volume.hostPath.type.charDevice',
    locale: true,
    value: 'CharDevice'
  },
  {
    label: 'clusters.volume.hostPath.type.blockDevice',
    locale: true,
    value: 'BlockDevice'
  }
];

export const sourceTypeOptions = [
  {
    label: 'clusters.volume.sourceType.hostPath',
    locale: true,
    value: 'hostPath'
  },
  {
    label: 'clusters.volume.sourceType.pvc',
    locale: true,
    value: 'persistentVolumeClaim'
  }
  // {
  //   label: 'clusters.volume.sourceType.configMap',
  //   locale: true,
  //   value: 'configMap'
  // }
];
