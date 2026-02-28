import { ParamsSchema } from '../config/types';

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
