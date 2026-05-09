import { icons } from '@gpustack/core-ui';
import { ImagePullPolicy } from './types';

export const TemplateStatusValueMap = {
  Enabled: 'enabled',
  Disabled: 'disabled'
};

export const TemplateStatusLabelMap: Record<string, string> = {
  [TemplateStatusValueMap.Enabled]: 'common.button.enable',
  [TemplateStatusValueMap.Disabled]: 'common.button.disable'
};

export const ImagePullPolicyOptions: {
  label: string;
  value: ImagePullPolicy;
  locale: boolean;
}[] = [
  {
    label: 'gpuservice.template.imagePullPolicy.always',
    value: 'Always',
    locale: true
  },
  {
    label: 'gpuservice.template.imagePullPolicy.ifNotPresent',
    value: 'IfNotPresent',
    locale: true
  },
  {
    label: 'gpuservice.template.imagePullPolicy.never',
    value: 'Never',
    locale: true
  }
];

export const DefaultImagePullPolicy: ImagePullPolicy = 'IfNotPresent';

export const templateActions = [
  {
    label: 'common.button.edit',
    key: 'edit',
    locale: true,
    icon: icons.EditOutlined
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    locale: true,
    icon: icons.DeleteOutlined,
    danger: true
  }
];
