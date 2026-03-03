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
