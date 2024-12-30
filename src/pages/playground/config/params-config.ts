import { ParamsSchema } from './types';

export const imageSizeOptions: {
  label: string;
  value: string;
  width: number;
  height: number;
  locale?: boolean;
}[] = [
  {
    label: 'playground.params.custom',
    value: 'custom',
    locale: true,
    width: 0,
    height: 0
  },
  { label: '512x512', value: '512x512', width: 512, height: 512 },
  { label: '768x1024', value: '768x1024', width: 768, height: 1024 },
  { label: '1024x768', value: '1024x768', width: 1024, height: 768 },
  { label: '1024x1024', value: '1024x1024', width: 1024, height: 1024 }
];

export const TTSParamsConfig: ParamsSchema[] = [
  {
    type: 'Select',
    name: 'voice',
    options: [],
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
    options: imageSizeOptions,
    description: {
      text: 'playground.params.size.description',
      html: true,
      isLocalized: true
    },
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
];

export const ImageEidtParamsConfig: ParamsSchema[] = [
  // {
  //   type: 'Slider',
  //   name: 'brush_size',
  //   label: {
  //     text: 'Brush Size',
  //     isLocalized: false
  //   },
  //   attrs: {
  //     min: 25,
  //     max: 80
  //   },
  //   rules: [
  //     {
  //       required: false
  //     }
  //   ]
  // },
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
      { label: '512x512', value: '512x512' },
      { label: '768x1024', value: '768x1024' },
      { label: '1024x1024', value: '1024x1024' }
    ],
    description: {
      text: 'playground.params.size.description',
      html: true,
      isLocalized: true
    },
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
      },
      { label: 'common.options.none', value: null, locale: true }
    ],
    label: {
      text: 'playground.params.style',
      isLocalized: true
    },
    attrs: {
      allowNull: true
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
    name: 'sample_method',
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
    name: 'schedule_method',
    options: [
      { label: 'default', value: 'default' },
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
    name: 'sampling_steps',
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
    name: 'guidance',
    label: {
      text: 'Guidance',
      isLocalized: false
    },
    description: {
      text: 'playground.image.guidance.tip',
      html: false,
      isLocalized: true
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
    type: 'InputNumber',
    name: 'strength',
    label: {
      text: 'Strength',
      isLocalized: false
    },
    description: {
      text: 'playground.image.strength.tip',
      html: false,
      isLocalized: true
    },
    attrs: {
      min: 0,
      max: 1,
      step: 0.1
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
    description: {
      text: 'playground.image.cfg_scale.tip',
      html: false,
      isLocalized: true
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
    name: 'negative_prompt', // e.g. ng_deepnegative_v1_75t,(badhandv4:1.2),EasyNegative,(worst quality:2),
    label: {
      text: 'playground.image.params.negativePrompt',
      isLocalized: true
    },
    attrs: {
      trim: false
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'Select',
    name: 'preview',
    options: [
      { label: 'Faster', value: 'preview_faster' },
      { label: 'Normal', value: 'preview' },
      { label: 'common.options.none', value: null, locale: true }
    ],
    label: {
      text: 'Preview',
      isLocalized: false
    },
    attrs: {
      allowNull: true
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

export const ImageCustomSizeConfig: ParamsSchema[] = [
  {
    type: 'Slider',
    name: 'width',
    label: {
      text: 'playground.params.width',
      isLocalized: true
    },
    attrs: {
      min: 256,
      max: 3200,
      step: 64,
      inputnumber: false
    },
    rules: [
      {
        required: true,
        message: 'playground.params.width'
      }
    ]
  },
  {
    type: 'Slider',
    name: 'height',
    label: {
      text: 'playground.params.height',
      isLocalized: true
    },
    attrs: {
      min: 256,
      max: 3200,
      step: 64,
      inputnumber: false
    },
    rules: [
      {
        required: true,
        message: 'playground.params.height'
      }
    ]
  }
];
