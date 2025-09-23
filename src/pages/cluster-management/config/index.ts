import icons from '@/components/icon-font/icons';
import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import React from 'react';

export const ClusterStatusValueMap = {
  Provisioning: 0,
  Ready: 3,
  Provisioned: 1
};

export const ClusterStatusLabelMap = {
  [ClusterStatusValueMap.Provisioning]: 'Provisioning',
  [ClusterStatusValueMap.Ready]: 'Ready',
  [ClusterStatusValueMap.Provisioned]: 'Provisioned'
};

export const ClusterStatus: Record<string, StatusType> = {
  [ClusterStatusValueMap.Provisioning]: StatusMaps.transitioning,
  [ClusterStatusValueMap.Ready]: StatusMaps.success,
  [ClusterStatusValueMap.Provisioned]: StatusMaps.transitioning
};

export const ProviderValueMap = {
  Kubernetes: 'Kubernetes',
  DigitalOcean: 'DigitalOcean',
  Docker: 'Docker',
  HuaweiCloud: 'HuaweiCloud',
  AliCloud: 'AliCloud',
  TencentCloud: 'TencentCloud'
};

export type ProviderType = keyof typeof ProviderValueMap | null | undefined;

export const ProviderLabelMap = {
  [ProviderValueMap.Kubernetes]: 'Kubernetes',
  [ProviderValueMap.DigitalOcean]: 'DigitalOcean',
  [ProviderValueMap.Docker]: 'Docker'
};

export const generateRegisterCommand = (params: {
  server: string;
  clusterId: number;
  registrationToken: string;
}) => {
  return `curl -k -L '${params.server}/v1/clusters/${params.clusterId}/manifests' \\
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

export const providerList = [
  {
    label: 'clusters.provider.custom',
    locale: true,
    value: ProviderValueMap.Docker,
    key: ProviderValueMap.Docker,
    icon: React.cloneElement(icons.Docker, {
      style: { color: 'var(--ant-color-primary)' }
    }),
    group: 'Self-Managed'
  },
  {
    label: 'Kubernetes',
    locale: false,
    value: ProviderValueMap.Kubernetes,
    key: ProviderValueMap.Kubernetes,
    icon: React.cloneElement(icons.KubernetesOutlined, {
      style: { color: 'var(--ant-color-primary)' }
    }),
    group: 'Self-Managed'
  },
  {
    label: 'DigitalOcean',
    locale: false,
    value: ProviderValueMap.DigitalOcean,
    key: ProviderValueMap.DigitalOcean,
    icon: React.cloneElement(icons.DigitalOcean, {
      style: {
        color: 'var(--ant-color-primary)'
      }
    }),
    group: 'Cloud Provider'
  },
  {
    label: 'Huawei Cloud',
    locale: false,
    disabled: true,
    value: ProviderValueMap.HuaweiCloud,
    key: ProviderValueMap.HuaweiCloud,
    icon: icons.HuaweiCloud,
    description: 'Comming soon',
    group: 'Cloud Provider'
  },
  {
    label: 'Ali Cloud',
    locale: false,
    disabled: true,
    value: ProviderValueMap.AliCloud,
    key: ProviderValueMap.AliCloud,
    icon: icons.AliCloud,
    description: 'Comming soon',
    group: 'Cloud Provider'
  },
  {
    label: 'Tencent Cloud',
    locale: false,
    disabled: true,
    value: ProviderValueMap.TencentCloud,
    key: ProviderValueMap.TencentCloud,
    icon: icons.TencentCloud,
    description: 'Comming soon',
    group: 'Cloud Provider'
  }
];

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

export const clusterActionList = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: icons.EditOutlined
  },
  {
    key: 'add_worker',
    label: 'resources.button.create',
    provider: ProviderValueMap.Docker,
    locale: true,
    icon: icons.DockerOutlined
  },
  {
    key: 'register_cluster',
    label: 'clusters.button.register',
    provider: ProviderValueMap.Kubernetes,
    locale: true,
    icon: icons.KubernetesOutlined
  },
  {
    key: 'addPool',
    label: 'clusters.button.addNodePool',
    provider: ProviderValueMap.DigitalOcean,
    locale: true,
    icon: icons.Catalog1
  },
  {
    key: 'delete',
    label: 'common.button.delete',
    icon: icons.DeleteOutlined,
    props: {
      danger: true
    }
  }
];

export const CloudOptionItems = [
  {
    label: 'Volumes',
    key: 'volumes'
  }
];
