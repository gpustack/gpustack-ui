import icons from '@/components/icon-font/icons';
import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { ProviderEnum } from './providers';
export { maasProviderLabelMap, maasProviderOptions } from './providers';

export type maasProviderType = ProviderEnum[keyof ProviderEnum];

export const maasProviderValueMap = ProviderEnum;

export const ProviderStatusValueMap: Record<string, string> = {
  Ready: 'ready',
  InActive: 'inactive'
};

export const ProviderStatusLabelMap = {
  [ProviderStatusValueMap.Ready]: 'Ready',
  [ProviderStatusValueMap.InActive]: 'Inactive'
};

export const ProviderStatus: Record<string, StatusType> = {
  [ProviderStatusValueMap.Ready]: StatusMaps.success,
  [ProviderStatusValueMap.InActive]: StatusMaps.error
};

// actions for each row
export const rowActionList = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: icons.EditOutlined
  },
  {
    key: 'registerRoute',
    label: 'routes.button.add',
    icon: icons.CaptivePortal
  },
  {
    key: 'copy',
    label: 'common.button.clone',
    icon: icons.CopyOutlined
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

export const referLinkZh = `https://higress.cn/docs/latest/plugins/ai/api-provider/ai-proxy/?spm=36971b57.3562eb7c.0.0.31764f5f7uLs2F#%E6%8F%90%E4%BE%9B%E5%95%86%E7%89%B9%E6%9C%89%E9%85%8D%E7%BD%AE`;
export const referLinkEn = `https://higress.cn/en/docs/latest/plugins/ai/api-provider/ai-proxy/?spm=36971b57.4a688c53.0.0.64ac436ewz1xGA`;
