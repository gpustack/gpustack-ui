import { icons } from '@gpustack/core-ui';

export const TemplateStatusValueMap = {
  Enabled: 'enabled',
  Disabled: 'disabled'
};

export const TemplateStatusLabelMap: Record<string, string> = {
  [TemplateStatusValueMap.Enabled]: '启用',
  [TemplateStatusValueMap.Disabled]: '禁用'
};

export const templateActions = [
  {
    label: '编辑',
    key: 'edit',
    icon: icons.EditOutlined
  },
  {
    label: '删除',
    key: 'delete',
    icon: icons.DeleteOutlined,
    danger: true
  }
];
