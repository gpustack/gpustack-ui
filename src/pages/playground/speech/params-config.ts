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
  }
];
