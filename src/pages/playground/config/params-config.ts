import { ParamsSchema } from './types';

export interface SizeOption {
  label: string;
  value: string;
  width: number;
  height: number;
  locale?: boolean;
}
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
  { label: '512x512(1:1)', value: '512x512', width: 512, height: 512 },
  { label: '512x1024(1:2)', value: '512x1024', width: 512, height: 1024 },
  { label: '768x1024(3:4)', value: '768x1024', width: 768, height: 1024 },
  { label: '1024x768(4:3)', value: '1024x768', width: 1024, height: 768 },
  { label: '1024x576(16:9)', value: '1024x576', width: 1024, height: 576 },
  { label: '576x1024(9:16)', value: '576x1024', width: 576, height: 1024 },
  { label: '1024x1024(1:1)', value: '1024x1024', width: 1024, height: 1024 },
  { label: '2048x2048(1:1)', value: '2048x2048', width: 2048, height: 2048 }
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
    formItemAttrs: {
      hidden: true
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

export const ImageCountConfig: ParamsSchema[] = [
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
    formItemAttrs: {
      hidden: true
    },
    rules: [
      {
        required: false
      }
    ]
  }
];

export const ImageSizeConfig: ParamsSchema[] = [
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
  },
  {
    type: 'Select',
    name: 'response_format',
    formItemAttrs: {
      hidden: true
    },
    options: [{ label: 'b64_json', value: 'b64_json' }],
    label: {
      text: 'Response Format',
      isLocalized: false
    },
    rules: [
      {
        required: false
      }
    ]
  }
];

export const ImageEidtParamsConfig: ParamsSchema[] = [
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
    formItemAttrs: {
      hidden: true
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
  // {
  //   type: 'Select',
  //   name: 'quality',
  //   options: [
  //     { label: 'playground.params.standard', value: 'standard', locale: true },
  //     { label: 'playground.params.hd', value: 'hd', locale: true }
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

const advancedConfig = [
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
      max: 100,
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
      max: 100,
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
    type: 'TextArea',
    name: 'negative_prompt', // e.g. ng_deepnegative_v1_75t,(badhandv4:1.2),EasyNegative,(worst quality:2),
    label: {
      text: 'playground.image.params.negativePrompt',
      isLocalized: true
    },
    attrs: {
      scaleSize: true,
      trim: false,
      autoSize: { minRows: 2, maxRows: 2 }
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
    type: 'InputNumber',
    name: 'seed',
    label: {
      text: 'playground.image.params.seed',
      isLocalized: true
    },
    attrs: {
      min: 0
    },
    dependencies: ['random_seed'],
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
    style: {
      marginBottom: 20
    },
    formItemAttrs: {
      noStyle: true
    },
    rules: [
      {
        required: false
      }
    ]
  }
];

export const CustomSizeConfig: ParamsSchema[] = [
  {
    type: 'Slider',
    name: 'width',
    label: {
      text: 'playground.params.width',
      isLocalized: true
    },
    attrs: {
      min: 256,
      max: 1024,
      step: 64,
      labelWidth: 314,
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
      max: 1024,
      step: 64,
      labelWidth: 314,
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

export const ChatParamsConfig: ParamsSchema[] = [
  {
    type: 'Slider',
    name: 'temperature',
    label: {
      text: 'Temperature',
      isLocalized: false
    },
    description: {
      text: 'playground.params.temperature.tips',
      html: false,
      isLocalized: true
    },
    attrs: {
      max: 2,
      step: 0.01,
      labelWidth: 314,
      inputnumber: true
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'Slider',
    name: 'max_tokens',
    label: {
      text: 'Max Tokens',
      isLocalized: false
    },
    description: {
      text: 'playground.params.maxtokens.tips',
      html: false,
      isLocalized: true
    },
    attrs: {
      max: 1024,
      step: 1,
      labelWidth: 314,
      inputnumber: true
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'Slider',
    name: 'top_p',
    label: {
      text: 'Top P',
      isLocalized: false
    },
    description: {
      text: 'playground.params.topp.tips',
      html: false,
      isLocalized: true
    },
    attrs: {
      max: 1,
      step: 0.01,
      labelWidth: 314,
      inputnumber: true
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'Slider',
    name: 'frequency_penalty',
    label: {
      text: 'Frequency Penalty',
      isLocalized: false
    },
    description: {
      text: 'playground.params.frequency_penalty.tips',
      html: false,
      isLocalized: true
    },
    attrs: {
      max: 2,
      min: -2,
      step: 0.01,
      labelWidth: 314,
      inputnumber: true
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'Slider',
    name: 'presence_penalty',
    label: {
      text: 'Presence Penalty',
      isLocalized: false
    },
    description: {
      text: 'playground.params.presence_penalty.tips',
      html: false,
      isLocalized: true
    },
    attrs: {
      max: 2,
      min: -2,
      step: 0.01,
      labelWidth: 314,
      inputnumber: true
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
      text: 'Seed',
      isLocalized: false
    },
    description: {
      text: 'playground.params.seed.tips',
      html: false,
      isLocalized: true
    },
    attrs: {
      min: 0
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'Input',
    name: 'stop',
    label: {
      text: 'Stop Sequence',
      isLocalized: false
    },
    description: {
      text: 'playground.params.stop.tips',
      html: false,
      isLocalized: true
    },
    formItemAttrs: {
      normalize(value: string) {
        return value || null;
      }
    },
    attrs: {},
    rules: [
      {
        required: false
      }
    ]
  }
];
