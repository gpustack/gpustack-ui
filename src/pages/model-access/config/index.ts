import icons from '@/components/icon-font/icons';
import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';

export const EndpointsStatusValueMap: Record<string, string> = {
  Active: 'active',
  Unavailable: 'unavailable'
};

export const EndpointStatusLabelMap = {
  [EndpointsStatusValueMap.Active]: 'Active',
  [EndpointsStatusValueMap.Unavailable]: 'Unavailable'
};

export const EndpointStatus: Record<string, StatusType> = {
  [EndpointsStatusValueMap.Active]: StatusMaps.success,
  [EndpointsStatusValueMap.Unavailable]: StatusMaps.error
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
