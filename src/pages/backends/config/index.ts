import icons from '@/components/icon-font/icons';

export const backendActions = [
  {
    label: 'Edit Versions',
    value: 'version',
    key: 'version',
    icon: icons.EditOutlined,
    locale: false
  },
  {
    label: 'Edit Parameters',
    value: 'parameter',
    key: 'parameter',
    icon: icons.EditOutlined,
    locale: false
  },
  {
    label: 'Edit by Yaml',
    value: 'yaml',
    key: 'edit',
    icon: icons.EditOutlined,
    locale: false
  },
  {
    label: 'Delete',
    value: 'delete',
    key: 'delete',
    icon: icons.DeleteOutlined,
    locale: false,
    danger: true
  }
];
