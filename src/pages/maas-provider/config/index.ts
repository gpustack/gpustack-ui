import icons from '@/components/icon-font/icons';
import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';

export type maasProviderType =
  | 'doubao'
  | 'qwen'
  | 'openai'
  | 'deepseek'
  | 'anthropic';

export const maasProviderValueMap = {
  Doubao: 'doubao',
  Qwen: 'qwen',
  OpenAI: 'openai',
  Deepseek: 'deepseek',
  Anthropic: 'anthropic'
};

export const maasProviderLabelMap = {
  [maasProviderValueMap.Doubao]: 'Doubao',
  [maasProviderValueMap.Qwen]: 'Qwen',
  [maasProviderValueMap.OpenAI]: 'OpenAI',
  [maasProviderValueMap.Deepseek]: 'Deepseek',
  [maasProviderValueMap.Anthropic]: 'Anthropic'
};

export const IconsMap = {
  [maasProviderValueMap.Doubao]: 'icon-doubao',
  [maasProviderValueMap.Qwen]: 'icon-qwen',
  [maasProviderValueMap.OpenAI]: 'icon-openai',
  [maasProviderValueMap.Deepseek]: 'icon-deepseek',
  [maasProviderValueMap.Anthropic]: 'icon-anthropic'
};

export const maasProviderOptions = Object.keys(maasProviderValueMap).map(
  (key) => ({
    label: maasProviderLabelMap[key],
    value: maasProviderValueMap[key as keyof typeof maasProviderValueMap]
  })
);

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
    key: 'delete',
    label: 'common.button.delete',
    icon: icons.DeleteOutlined,
    props: {
      danger: true
    }
  }
];
