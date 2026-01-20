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
    api_tokens: ['token1', 'token2'],
    proxy_url: 'http://proxy.example.com',
    builtIn: false
  },
  {
    id: 2,
    models: 3,
    name: 'Qwen',
    state: 'inactive',
    state_message: 'Provider is inactive',
    provider: 'qwen',
    proxy_url: 'http://proxy2.example.com',

    builtIn: true
  },
  {
    id: 3,
    models: 8,
    name: 'OpenAI',
    state: 'ready',
    state_message: '',
    proxy_url: null,
    api_tokens: ['tokenA'],
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
    proxy_url: null,
    api_tokens: ['tokenX', 'tokenY'],
    builtIn: false
  },
  {
    id: 5,
    models: 4,
    name: 'Anthropic',
    state: 'inactive',
    state_message: 'Provider is inactive',
    provider: 'anthropic',
    proxy_url: {},
    builtIn: true
  }
];
