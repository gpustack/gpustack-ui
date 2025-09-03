import icons from '@/components/icon-font/icons';
import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';

export const ClusterStatusValueMap = {
  Provisioning: 0,
  Ready: 3,
  ProvisionedNotReady: 1
};

export const ClusterStatusLabelMap = {
  [ClusterStatusValueMap.Provisioning]: 'Provisioning',
  [ClusterStatusValueMap.Ready]: 'Ready',
  [ClusterStatusValueMap.ProvisionedNotReady]: 'Provisioned Not Ready'
};

export const ClusterStatus: Record<string, StatusType> = {
  [ClusterStatusValueMap.Provisioning]: StatusMaps.transitioning,
  [ClusterStatusValueMap.Ready]: StatusMaps.success,
  [ClusterStatusValueMap.ProvisionedNotReady]: StatusMaps.error
};

export const ProviderValueMap = {
  Kubernetes: 'Kubernetes',
  DigitalOcean: 'DigitalOcean',
  Custom: 'Custom'
};

export const ProviderLabelMap = {
  [ProviderValueMap.Kubernetes]: 'Kubernetes',
  [ProviderValueMap.DigitalOcean]: 'Digital Ocean',
  [ProviderValueMap.Custom]: 'Custom'
};

export const generateRegisterCommand = (params: {
  server: string;
  clusterId: number;
  registrationToken: string;
}) => {
  return `curl -k -L '${params.server}/v1/clusters/${params.clusterId}/manifests' \\
--header 'Authorization: Bearer ${params.registrationToken}' | kubectl apply -f -`;
};

export const addActions = [
  {
    label: 'clusters.provider.custom',
    locale: true,
    value: ProviderValueMap.Custom,
    key: ProviderValueMap.Custom,
    icon: icons.Docker
  },
  {
    label: 'Kubernetes',
    locale: false,
    value: ProviderValueMap.Kubernetes,
    key: ProviderValueMap.Kubernetes,
    icon: icons.KubernetesOutlined
  },
  {
    label: 'Digital Ocean',
    locale: false,
    value: ProviderValueMap.DigitalOcean,
    key: ProviderValueMap.DigitalOcean,
    icon: icons.DigitalOcean
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
    provider: ProviderValueMap.Custom,
    locale: true,
    icon: icons.Docker
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
    icon: icons.Catalog
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

export const regionList: {
  label: string;
  datacenter: string;
  value: string;
  icon: string;
}[] = [
  { label: 'New York', datacenter: 'Datacenter 1', value: 'nyc1', icon: '🇺🇸' },
  { label: 'New York', datacenter: 'Datacenter 2', value: 'nyc2', icon: '🇺🇸' },
  { label: 'New York', datacenter: 'Datacenter 3', value: 'nyc3', icon: '🇺🇸' },
  { label: 'Toronto', datacenter: 'Datacenter 1', value: 'tor1', icon: '🇨🇦' },
  {
    label: 'San Francisco',
    datacenter: 'Datacenter 1',
    value: 'sfo1',
    icon: '🇺🇸'
  },
  {
    label: 'San Francisco',
    datacenter: 'Datacenter 2',
    value: 'sfo2',
    icon: '🇺🇸'
  },
  {
    label: 'San Francisco',
    datacenter: 'Datacenter 3',
    value: 'sfo3',
    icon: '🇺🇸'
  },
  { label: 'Atlanta', datacenter: 'Datacenter 1', value: 'atl1', icon: '🇺🇸' },
  { label: 'Singapore', datacenter: 'Datacenter 1', value: 'sgp1', icon: '🇸🇬' },
  { label: 'Bangalore', datacenter: 'Datacenter 1', value: 'blr1', icon: '🇮🇳' },
  { label: 'London', datacenter: 'Datacenter 1', value: 'lon1', icon: '🇬🇧' },
  { label: 'Amsterdam', datacenter: 'Datacenter 2', value: 'ams2', icon: '🇳🇱' },
  { label: 'Amsterdam', datacenter: 'Datacenter 3', value: 'ams3', icon: '🇳🇱' },
  { label: 'Frankfurt', datacenter: 'Datacenter 1', value: 'fra1', icon: '🇩🇪' },
  { label: 'Sydney', datacenter: 'Datacenter 1', value: 'syd1', icon: '🇦🇺' }
];

export const CloudOptionItems = [
  {
    label: 'Volumes',
    key: 'volumes'
  }
];
