import { AccessItem, AccessPointItem } from './types';

// mock data for AccessItem 5 items
export const mockDataList: AccessItem[] = [
  {
    id: 1,
    name: 'Doubao Access',
    source: 'Doubao',
    accessPoints: 5
  },
  {
    id: 2,
    name: 'Qwen Access',
    source: 'Qwen',
    accessPoints: 3
  },
  {
    id: 3,
    name: 'OpenAI Access',
    source: 'OpenAI',
    accessPoints: 8
  },
  {
    id: 4,
    name: 'Deepseek Access',
    source: 'Deepseek',
    accessPoints: 2
  },
  {
    id: 5,
    name: 'Anthropic Access',
    source: 'Anthropic',
    accessPoints: 4
  }
];

// mock data for AccessPointItem 2 items
export const mockAccessPointList: AccessPointItem[] = [
  {
    id: 1,
    name: 'Access Point 1',
    type: 'API',
    is_fallback: true,
    endpoint: 'https://api.example.com/endpoint1',
    created_at: '2024-01-01T12:00:00Z'
  },
  {
    id: 2,
    name: 'Access Point 2',
    type: 'SDK',
    is_fallback: false,
    created_at: '2024-02-01T12:00:00Z'
  }
];
