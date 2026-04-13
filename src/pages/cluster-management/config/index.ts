import { StatusMaps } from '@/config';
import { GPUSTACK_API_BASE_URL } from '@/config/settings';
import { StatusType } from '@/config/types';
import { GPUsConfigs } from '@/pages/resources/config/gpu-driver';
import icons from '@gpustack/core-ui/lib/components/icon-font/icons';

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
  [ProviderValueMap.Docker]: 'Docker'
};

export const generateK8sRegisterCommand = (params: {
  currentGPU?: string;
  server: string;
  clusterId: number | null;
  registrationToken: string;
}) => {
  const runtime = GPUsConfigs[params.currentGPU || '']?.runtime || '';
  return `curl -k -L '${params.server}/${GPUSTACK_API_BASE_URL}/clusters/${params.clusterId}/manifests${runtime ? `?runtime=${runtime}` : ''}' \\
--header 'Authorization: Bearer ${params.registrationToken}' | kubectl apply -f -`;
};

export const instanceTypeFieldMap = {
  vram: 'VRAM',
  vcpus: 'vCPUs',
  ram: 'RAM',
  bootDisk: 'Boot Disk',
  scratchDisk: 'Scratch Disk',
  minDiskSize: 'Min Disk Size',
  size: 'Size'
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
