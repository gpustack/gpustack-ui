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
      text: 'playground.params.voice',
      isLocalized: true
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
      text: 'playground.params.format',
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
    name: 'speed',
    options: [
      { label: '0.25x', value: 0.25 },
      { label: '0.5x', value: 0.5 },
      { label: '1x', value: 1 },
      { label: '2x', value: 2 },
      { label: '4x', value: 4 }
    ],
    label: {
      text: 'playground.params.speed',
      isLocalized: true
    },
    rules: [
      {
        required: false
      }
    ]
  }
  // {
  //   type: 'TextArea',
  //   name: 'prompt',
  //   label: {
  //     text: 'Prompt',
  //     isLocalized: false
  //   },
  //   attrs: {
  //     autoSize: {
  //       minRows: 2,
  //       maxRows: 3
  //     }
  //   },
  //   rules: [
  //     {
  //       required: false
  //     }
  //   ]
  // }
];

export const RealtimeParamsConfig: ParamsSchema[] = [
  {
    type: 'Select',
    name: 'language',
    options: [
      { label: 'Auto', value: 'auto' },
      { label: 'English', value: 'en' },
      { label: '中文', value: 'zh' },
      { label: '日本語', value: 'ja' },
      { label: 'Français', value: 'fr' },
      { label: 'Deutsch', value: 'de' }
    ],
    label: {
      text: 'playground.params.language',
      isLocalized: true
    },
    rules: [
      {
        required: true
      }
    ]
  }
];

export const ImageParamsConfig: ParamsSchema[] = [
  {
    type: 'InputNumber',
    name: 'n',
    label: {
      text: 'playground.params.counts',
      isLocalized: true
    },
    attrs: {
      min: 1,
      max: 4
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
    options: [
      { label: '256x256', value: '256x256' },
      { label: '512x512', value: '512x512' },
      { label: '1024x1024', value: '1024x1024' },
      { label: '1792x1024', value: '1792x1024' },
      { label: '1024x1792', value: '1024x1792' },
      { label: 'playground.params.custom', value: 'custom', locale: true }
    ],
    label: {
      text: 'playground.params.size',
      isLocalized: true
    },
    rules: [
      {
        required: false
      }
    ]
  }
  // {
  //   type: 'Select',
  //   name: 'quality',
  //   options: [
  //     { label: 'standard', value: 'standard' },
  //     { label: 'hd', value: 'hd' }
  //   ],
  //   label: {
  //     text: 'playground.params.quality',
  //     isLocalized: true
  //   },
  //   rules: [
  //     {
  //       required: false
  //     }
  //   ]
  // },
  // {
  //   type: 'Select',
  //   name: 'style',
  //   options: [
  //     { label: 'vivid', value: 'vivid' },
  //     { label: 'natural', value: 'natural' }
  //   ],
  //   label: {
  //     text: 'playground.params.style',
  //     isLocalized: true
  //   },
  //   rules: [
  //     {
  //       required: false
  //     }
  //   ]
  // }
  // {
  //   type: 'TextArea',
  //   name: 'prompt',
  //   label: {
  //     text: 'Prompt',
  //     isLocalized: false
  //   },
  //   attrs: {
  //     autoSize: {
  //       minRows: 2,
  //       maxRows: 3
  //     }
  //   },
  //   rules: [
  //     {
  //       required: false
  //     }
  //   ]
  // }
];
