import { ParamsSchema } from '../config/types';

export const fieldConfig: ParamsSchema[] = [
  {
    type: 'InputNumber',
    name: 'top_n',
    label: {
      text: 'Top N',
      isLocalized: false
    },
    attrs: {
      min: 1
    },
    rules: [
      {
        required: true,
        message: 'Top N is required'
      }
    ]
  }
];
