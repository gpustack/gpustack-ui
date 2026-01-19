import { MaasProviderItem } from '../config/types';

// mock data for MaasProviderItem 5 items
export const mockDataList: MaasProviderItem[] = [
  {
    id: 1,
    name: 'Doubao',
    state: 'Ready',
    models: 5,
    state_message: '',
    provider: 'doubao',
    proxy_config: {},
    builtIn: false
  },
  {
    id: 2,
    models: 3,
    name: 'Qwen',
    state: 'inactive',
    state_message: 'Provider is inactive',
    provider: 'qwen',
    proxy_config: false,
    builtIn: true
  },
  {
    id: 3,
    models: 8,
    name: 'OpenAI',
    state: 'ready',
    state_message: '',
    proxy_config: null,
    provider: 'openai',
    builtIn: false
  },
  {
    id: 4,
    models: 2,
    name: 'Deepseek',
    state: 'ready',
    state_message: '',
    provider: 'deepseek',
    proxy_config: null,
    builtIn: false
  },
  {
    id: 5,
    models: 4,
    name: 'Anthropic',
    state: 'inactive',
    state_message: 'Provider is inactive',
    provider: 'anthropic',
    proxy_config: {},
    builtIn: true
  }
];
