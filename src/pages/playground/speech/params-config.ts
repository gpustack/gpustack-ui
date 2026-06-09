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
    initAttrs: (meta: any) => ({
      // Single-task TTS checkpoints (e.g. Qwen3-TTS) expose a fixed task_type;
      // lock the field so a mismatched value can't crash the vllm engine.
      disabled: !!meta?.task_type
    }),
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
