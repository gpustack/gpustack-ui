import icons from '@/components/icon-font/icons';
import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';

export const TargetStatusValueMap: Record<string, string> = {
  Active: 'active',
  Unavailable: 'unavailable'
};

export const TargetStatusLabelMap = {
  [TargetStatusValueMap.Active]: 'Active',
  [TargetStatusValueMap.Unavailable]: 'Unavailable'
};

export const TargetStatus: Record<string, StatusType> = {
  [TargetStatusValueMap.Active]: StatusMaps.success,
  [TargetStatusValueMap.Unavailable]: StatusMaps.warning
};

// actions for each row
export const rowActionList = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: icons.EditOutlined
  },
  {
    label: 'models.openinplayground',
    key: 'chat',
    icon: icons.ExperimentOutlined
  },
  {
    label: 'models.table.button.apiAccessInfo',
    key: 'api',
    icon: icons.ApiOutlined
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

export const genericReferLink = `https://docs.gpustack.ai/latest/user-guide/model-deployment-management/#enable-generic-proxy`;
