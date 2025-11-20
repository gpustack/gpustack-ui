import icons from '@/components/icon-font/icons';
import React from 'react';
import { ProviderValueMap } from '.';

export default [
  {
    label: 'Docker',
    locale: false,
    value: ProviderValueMap.Docker,
    key: ProviderValueMap.Docker,
    icon: React.cloneElement(icons.DockerOutlined, {
      style: { color: 'var(--ant-blue-6)' }
    }),
    group: 'clusters.create.provider.self'
  },
  {
    label: 'Kubernetes',
    locale: false,
    value: ProviderValueMap.Kubernetes,
    key: ProviderValueMap.Kubernetes,
    icon: React.cloneElement(icons.KubernetesFilled, {
      style: { color: 'var(--ant-blue-6)' }
    }),
    group: 'clusters.create.provider.self'
  },
  {
    label: 'DigitalOcean',
    locale: false,
    value: ProviderValueMap.DigitalOcean,
    key: ProviderValueMap.DigitalOcean,
    icon: React.cloneElement(icons.DigitalOcean, {
      style: {
        color: 'var(--ant-blue-6)'
      }
    }),
    group: 'clusters.create.provider.cloud'
  },
  {
    label: 'AWS',
    locale: false,
    disabled: true,
    value: ProviderValueMap.AWS,
    key: ProviderValueMap.AWS,
    icon: icons.AWS,
    description: 'cluster.provider.comingsoon',
    group: 'clusters.create.provider.cloud'
  },
  {
    label: 'Alibaba Cloud',
    locale: false,
    disabled: true,
    value: ProviderValueMap.AliCloud,
    key: ProviderValueMap.AliCloud,
    icon: icons.AliCloud,
    description: 'cluster.provider.comingsoon',
    group: 'clusters.create.provider.cloud'
  }
];
