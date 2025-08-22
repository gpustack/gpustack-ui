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
    label: 'Custom',
    locale: false,
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

export const poolActionList = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: icons.EditOutlined
  },
  {
    key: 'details',
    label: 'common.button.view',
    icon: icons.DetailInfo
  },
  {
    key: 'add_worker',
    label: 'Add Worker',
    provider: ProviderValueMap.Custom,
    locale: false,
    icon: icons.Docker
  },
  {
    key: 'register_cluster',
    label: 'Register Cluster',
    provider: ProviderValueMap.Kubernetes,
    locale: false,
    icon: icons.KubernetesOutlined
  },
  {
    key: 'addPool',
    label: 'Add Node Pool',
    provider: ProviderValueMap.DigitalOcean,
    locale: false,
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
