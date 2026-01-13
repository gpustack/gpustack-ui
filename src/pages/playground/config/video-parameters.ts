import { SizeOption } from './params-config';
import { ParamsSchema } from './types';

export const videoSizeOptions: SizeOption[] = [
  { label: '720x1280', value: '720x1280', width: 720, height: 1280 },
  { label: '1280x720', value: '1280x720', width: 1280, height: 720 },
  { label: '1024x1792', value: '1024x1792', width: 1024, height: 1792 },
  {
    label: '1792x1024',
    value: '1792x1024',
    width: 1792,
    height: 1024
  }
];

export const videoParamsConfig: ParamsSchema[] = [
  {
    type: 'Select',
    name: 'seconds',
    options: [
      { label: '4', value: '4' },
      { label: '8', value: '8' },
      { label: '12', value: '12' }
    ],
    label: {
      text: 'playground.params.duration',
      isLocalized: true
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'Select',
    name: 'size',
    options: videoSizeOptions,
    label: {
      text: 'playground.params.resolution',
      isLocalized: true
    },
    rules: [
      {
        required: false
      }
    ]
  }
];
