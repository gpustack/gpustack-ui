import { ParamsSchema } from './types';

export const TTSParamsConfig: ParamsSchema[] = [
  {
    type: 'Select',
    name: 'voice',
    options: [
      { label: 'Alloy', value: 'Alloy' },
      { label: 'Echo', value: 'Echo' },
      { label: 'Fable', value: 'Fable' },
      { label: 'Onyx', value: 'Onyx' },
      { label: 'Nova', value: 'Nova' },
      { label: 'Shimmer', value: 'Shimmer' }
    ],
    label: {
      text: 'Voice',
      isLocalized: false
    },
    rules: [
      {
        required: true,
        message: 'Voice is required'
      }
    ]
  },
  {
    type: 'Select',
    name: 'response_format',
    options: [
      { label: 'mp3', value: 'mp3' },
      { label: 'opus', value: 'opus' },
      { label: 'aac', value: 'aac' },
      { label: 'flac', value: 'flac' },
      { label: 'wav', value: 'wav' },
      { label: 'pcm', value: 'pcm' }
    ],
    label: {
      text: 'Response Format',
      isLocalized: false
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'Select',
    name: 'speed',
    options: [
      { label: '0.25x', value: 0.25 },
      { label: '0.5x', value: 0.5 },
      { label: '1x', value: 1 },
      { label: '2x', value: 2 },
      { label: '4x', value: 4 }
    ],
    label: {
      text: 'Speed',
      isLocalized: false
    },
    rules: [
      {
        required: false
      }
    ]
  }
];
