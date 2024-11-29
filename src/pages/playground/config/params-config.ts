import { ParamsSchema } from './types';

export const TTSParamsConfig: ParamsSchema[] = [
  {
    type: 'Select',
    name: 'voice',
    options: [
      // { label: 'Alloy', value: 'Alloy' },
      // { label: 'Echo', value: 'Echo' },
      // { label: 'Fable', value: 'Fable' },
      // { label: 'Onyx', value: 'Onyx' },
      // { label: 'Nova', value: 'Nova' },
      // { label: 'Shimmer', value: 'Shimmer' }
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
      // { label: 'opus', value: 'opus' },
      // { label: 'aac', value: 'aac' },
      // { label: 'flac', value: 'flac' },
      { label: 'wav', value: 'wav' }
      // { label: 'pcm', value: 'pcm' }
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
  }
  // {
  //   type: 'Select',
  //   name: 'speed',
  //   options: [
  //     { label: '0.25x', value: 0.25 },
  //     { label: '0.5x', value: 0.5 },
  //     { label: '1x', value: 1 },
  //     { label: '2x', value: 2 },
  //     { label: '4x', value: 4 }
  //   ],
  //   label: {
  //     text: 'playground.params.speed',
  //     isLocalized: true
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
      { label: 'playground.params.custom', value: 'custom', locale: true },
      { label: '256x256', value: '256x256' },
      { label: '512x512', value: '512x512' },
      { label: '1024x1024', value: '1024x1024' },
      { label: '1792x1024', value: '1792x1024' },
      { label: '1024x1792', value: '1024x1792' }
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

export const ImageconstExtraConfig: ParamsSchema[] = [
  {
    type: 'Select',
    name: 'quality',
    options: [
      { label: 'playground.params.standard', value: 'standard', locale: true },
      { label: 'playground.params.hd', value: 'hd', locale: true }
    ],
    label: {
      text: 'playground.params.quality',
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
    name: 'style',
    options: [
      { label: 'playground.params.style.vivid', value: 'vivid', locale: true },
      {
        label: 'playground.params.style.natural',
        value: 'natural',
        locale: true
      }
    ],
    attrs: {
      allowClear: true
    },
    label: {
      text: 'playground.params.style',
      isLocalized: true
    },
    rules: [
      {
        required: false
      }
    ]
  }
];

export const ImageAdvancedParamsConfig: ParamsSchema[] = [
  {
    type: 'Select',
    name: 'sampler',
    options: [
      { label: 'euler_a', value: 'euler_a' },
      { label: 'euler', value: 'euler' },
      { label: 'heun', value: 'heun' },
      { label: 'dpm2', value: 'dpm2' },
      { label: 'dpm++2s_a', value: 'dpm++2s_a' },
      { label: 'dpm++2m', value: 'dpm++2m' },
      { label: 'dpm++2mv2', value: 'dpm++2mv2' },
      { label: 'ipndm', value: 'ipndm' },
      { label: 'ipndm_v', value: 'ipndm_v' },
      { label: 'lcm', value: 'lcm' }
    ],
    label: {
      text: 'playground.image.params.sampler',
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
    name: 'schedule',
    options: [
      { label: 'discrete', value: 'discrete' },
      { label: 'karras', value: 'karras' },
      { label: 'exponential', value: 'exponential' },
      { label: 'ays', value: 'ays' },
      { label: 'gits', value: 'gits' }
    ],
    label: {
      text: 'playground.image.params.schedule',
      isLocalized: true
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'InputNumber',
    name: 'sample_steps',
    label: {
      text: 'playground.image.params.samplerSteps',
      isLocalized: true
    },
    attrs: {
      min: 1,
      max: 100
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'InputNumber',
    name: 'cfg_scale',
    label: {
      text: 'CFG Scale',
      isLocalized: false
    },
    attrs: {
      min: 1.0,
      max: 10,
      step: 0.1
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'Input',
    name: 'negative_prompt',
    label: {
      text: 'playground.image.params.negativePrompt',
      isLocalized: true
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'InputNumber',
    name: 'seed',
    label: {
      text: 'playground.image.params.seed',
      isLocalized: true
    },
    attrs: {
      min: 0
    },
    disabledConfig: {
      depends: ['random_seed'],
      when: (values: Record<string, any>): boolean => values?.random_seed
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'Checkbox',
    name: 'random_seed',
    label: {
      text: 'playground.image.params.randomseed',
      isLocalized: true
    },
    rules: [
      {
        required: false
      }
    ]
  }
];
