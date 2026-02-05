import _ from 'lodash';
import { ParamsSchema } from '../config/types';

export const TTSAdvancedParamsConfig: ParamsSchema[] = [
  {
    type: 'Input',
    name: 'task_type',
    options: [],
    attrs: {
      allowClear: true
    },
    label: {
      text: 'playground.params.taskType',
      isLocalized: true
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'AutoComplete',
    name: 'language',
    options: [],
    initAttrs: (meta: any) => {
      return {
        options: _.map(meta?.languages || [], (item: string) => ({
          label: item,
          value: item
        }))
      };
    },
    attrs: {
      allowClear: true
    },
    label: {
      text: 'playground.params.language',
      isLocalized: true
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'Input',
    name: 'instructions',
    label: {
      text: 'playground.params.instructions',
      isLocalized: true
    },
    description: {
      text: 'playground.params.instructions.tips',
      isLocalized: true
    },
    attrs: {
      allowClear: true
    },
    initAttrs: (meta: any) => {
      return {
        options: _.map(meta?.voices || [], (item: string) => ({
          label: item,
          value: item
        }))
      };
    },
    rules: [
      {
        required: false
      }
    ]
  },
  {
    type: 'InputNumber',
    name: 'max_new_tokens',
    label: {
      text: 'playground.params.maxTokens',
      isLocalized: true
    },
    attrs: {
      allowClear: true,
      step: 1,
      min: 0,
      max: 4096
    },
    formItemAttrs: {
      getValueProps: (value: number) => {
        return {
          value: value || null
        };
      }
    },
    rules: [
      {
        required: false
      }
    ]
  }
];

export const TTSParamsConfig: ParamsSchema[] = [
  {
    type: 'AutoComplete',
    name: 'voice',
    options: [],
    label: {
      text: 'playground.params.voice',
      isLocalized: true
    },
    rules: [
      {
        required: false,
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
