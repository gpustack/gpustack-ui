import icons from '@/components/icon-font/icons';
import React from 'react';
import { ProviderValueMap } from '.';

export default [
  {
    label: 'clusters.provider.custom',
    locale: true,
    value: ProviderValueMap.Custom,
    key: ProviderValueMap.Custom,
    icon: React.cloneElement(icons.Docker, {
      style: { color: 'var(--ant-color-primary)' }
    }),
    group: 'clusters.create.provider.self'
  },
  {
    label: 'Kubernetes',
    locale: false,
    value: ProviderValueMap.Kubernetes,
    key: ProviderValueMap.Kubernetes,
    icon: React.cloneElement(icons.KubernetesOutlined, {
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
    label: 'Huawei Cloud',
    locale: false,
    disabled: true,
    value: ProviderValueMap.HuaweiCloud,
    key: ProviderValueMap.HuaweiCloud,
    icon: icons.HuaweiCloud,
    description: 'Comming soon',
    group: 'clusters.create.provider.cloud'
  },
  {
    label: 'Ali Cloud',
    locale: false,
    disabled: true,
    value: ProviderValueMap.AliCloud,
    key: ProviderValueMap.AliCloud,
    icon: icons.AliCloud,
    description: 'Comming soon',
    group: 'clusters.create.provider.cloud'
  },
  {
    label: 'Tencent Cloud',
    locale: false,
    disabled: true,
    value: ProviderValueMap.TencentCloud,
    key: ProviderValueMap.TencentCloud,
    icon: icons.TencentCloud,
    description: 'Comming soon',
    group: 'clusters.create.provider.cloud'
  }
];
