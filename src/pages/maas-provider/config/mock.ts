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
    builtIn: false
  },
  {
    id: 2,
    models: 3,
    name: 'Qwen',
    state: 'Inactive',
    state_message: 'Provider is inactive',
    provider: 'qwen',
    builtIn: true
  },
  {
    id: 3,
    models: 8,
    name: 'OpenAI',
    state: 'Ready',
    state_message: '',
    provider: 'openai',
    builtIn: false
  },
  {
    id: 4,
    models: 2,
    name: 'Deepseek',
    state: 'Ready',
    state_message: '',
    provider: 'deepseek',
    builtIn: false
  },
  {
    id: 5,
    models: 4,
    name: 'Anthropic',
    state: 'Inactive',
    state_message: 'Provider is inactive',
    provider: 'anthropic',
    builtIn: true
  }
];
