import _ from 'lodash';
import { imageSizeOptions } from '../config/params-config';

const LLM_METAKEYS: Record<string, any> = {
  seed: 'seed',
  stop: 'stop',
  temperature: 'temperature',
  top_p: 'top_p',
  n_ctx: 'n_ctx',
  n_slot: 'n_slot',
  max_model_len: 'max_model_len'
};

const IMG_METAKEYS = [
  'sample_method',
  'sampling_steps',
  'schedule_method',
  'cfg_scale',
  'guidance',
  'negative_prompt'
];

const llmInitialValues = {
  seed: null,
  stop: null,
  temperature: 1,
  top_p: 1,
  max_tokens: 1024
};

const imgInitialValues = {
  n: 1,
  seed: null,
  sample_method: 'euler_a',
  cfg_scale: 4.5,
  guidance: 3.5,
  sampling_steps: 10,
  negative_prompt: null,
  schedule_method: 'discrete',
  preview: 'preview_faster'
};

export default function useInitMeta() {
  const extractLLMMeta = (meta: any) => {
    const modelMeta = meta || {};
    const modelMetaValue = _.pick(modelMeta, _.keys(LLM_METAKEYS));
    const obj = Object.entries(LLM_METAKEYS).reduce(
      (acc: any, [key, value]) => {
        const val = modelMetaValue[key];
        if (val && _.hasIn(modelMetaValue, key)) {
          acc[value] = val;
        }
        return acc;
      },
      {}
    );

    let defaultMaxTokens = 1024;

    if (obj.n_ctx && obj.n_slot) {
      defaultMaxTokens = _.divide(obj.n_ctx / 2, obj.n_slot);
    } else if (obj.max_model_len) {
      defaultMaxTokens = obj.max_model_len / 2;
    }

    return {
      form: _.merge({}, llmInitialValues, {
        ..._.omit(obj, ['n_ctx', 'n_slot', 'max_model_len']),
        max_tokens: defaultMaxTokens
      }),
      meta: {
        ...obj,
        max_tokens: obj.max_model_len || _.divide(obj.n_ctx, obj.n_slot)
      }
    };
  };

  const getNewImageSizeOptions = (metaData: any) => {
    const { max_height, max_width } = metaData || {};
    if (!max_height || !max_width) {
      return imageSizeOptions;
    }
    const newImageSizeOptions = imageSizeOptions.filter((item) => {
      return item.width <= max_width && item.height <= max_height;
    });
    if (
      !newImageSizeOptions.find(
        (item) => item.width === max_width && item.height === max_height
      )
    ) {
      newImageSizeOptions.push({
        width: max_width,
        height: max_height,
        label: `${max_width}x${max_height}`,
        value: `${max_width}x${max_height}`
      });
    }
    return newImageSizeOptions;
  };

  const extractIMGMeta = (meta: any) => {
    return {
      form: _.merge({}, imgInitialValues, {
        ..._.pick(meta, IMG_METAKEYS),
        width: meta?.default_width || 512,
        height: meta?.default_height || 512
      }),
      meta: meta,
      sizeOptions: getNewImageSizeOptions(meta)
    };
  };

  return {
    extractLLMMeta,
    extractIMGMeta
  };
}
