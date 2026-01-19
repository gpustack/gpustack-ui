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
  [maasProviderValueMap.Deepseek]: 'DeepSeek',
  [maasProviderValueMap.Anthropic]: 'Anthropic'
};

export const providerIconsMap = {
  [maasProviderValueMap.Doubao]: 'icon-doubao',
  [maasProviderValueMap.Qwen]: 'icon-qwen',
  [maasProviderValueMap.OpenAI]: 'icon-openai',
  [maasProviderValueMap.Deepseek]: 'icon-deepseek',
  [maasProviderValueMap.Anthropic]: 'icon-anthropic'
};

export const maasProviderOptions = Object.entries(maasProviderValueMap).map(
  ([key, value]) => ({
    label: maasProviderLabelMap[value],
    value: value,
    key: value,
    locale: false,
    icon: providerIconsMap[value]
  })
);

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
    label: 'common.button.copy',
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
