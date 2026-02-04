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
