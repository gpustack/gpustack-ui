import icons from '@/components/icon-font/icons';
import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';

export const ProviderStatusValueMap: Record<string, string> = {
  Ready: 'Ready',
  InActive: 'Inactive'
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
    label: 'models.button.accessSettings',
    key: 'accessControl',
    icon: icons.Permission
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
