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
      style: { color: 'var(--ant-color-primary)' }
    }),
    group: 'clusters.create.provider.self'
  },
  {
    label: 'Kubernetes',
    locale: false,
    value: ProviderValueMap.Kubernetes,
    key: ProviderValueMap.Kubernetes,
    icon: React.cloneElement(icons.KubernetesFilled, {
      style: { color: 'var(--ant-color-primary)' }
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
        color: 'var(--ant-color-primary)'
      }
    }),
    group: 'clusters.create.provider.cloud'
  },
  {
    label: 'Ali Cloud',
    locale: false,
    disabled: true,
    value: ProviderValueMap.AliCloud,
    key: ProviderValueMap.AliCloud,
    icon: icons.AliCloud,
    description: 'Coming soon',
    group: 'clusters.create.provider.cloud'
  },
  {
    label: 'Tencent Cloud',
    locale: false,
    disabled: true,
    value: ProviderValueMap.TencentCloud,
    key: ProviderValueMap.TencentCloud,
    icon: icons.TencentCloud,
    description: 'Coming soon',
    group: 'clusters.create.provider.cloud'
  }
];
