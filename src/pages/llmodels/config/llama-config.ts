const options = [
  {
    label: '--chat-template',
    value: '--chat-template'
  },
  {
    label: '--ctx-size',
    value: '--ctx-size',
    options: []
  },
  {
    label: '--flash-attn',
    value: '--flash-attn'
  },
  {
    label: '--parallel',
    value: '--parallel'
  },
  {
    label: '--batch-size',
    value: '--batch-size'
  },
  {
    label: '--ubatch-size',
    value: '--ubatch-size'
  },
  {
    label: '--images',
    value: '--images'
  },
  {
    label: '--image-max-batch',
    value: '--image-max-batch'
  },
  {
    label: '--image-max-height',
    value: '--image-max-height'
  },
  {
    label: '--image-max-width',
    value: '--image-max-width'
  },
  {
    label: '--image-guidance',
    value: '--image-guidance'
  },
  {
    label: '--image-strength',
    value: '--image-strength'
  },
  {
    label: '--image-sampler',
    value: '--image-sampler',
    options: [
      'euler_a',
      'euler',
      'heun',
      'dpm2',
      'dpm++2s_a',
      'dpm++2m',
      'dpm++2mv2',
      'ipndm',
      'ipndm_v',
      'lcm'
    ]
  },
  {
    label: '--image-sampler-steps',
    value: '--image-sample-steps'
  },
  {
    label: '--image-cfg-scale',
    value: '--image-cfg-scale'
  },
  {
    label: '--image-slg-scale',
    value: '--image-slg-scale'
  },
  {
    label: '--image-slg-skip-layer',
    value: '--image-slg-skip-layer'
  },
  {
    label: '--image-slg-start',
    value: '--image-slg-end'
  },
  {
    label: '--image-schedule',
    value: '--image-schedule',
    options: ['default', 'discrete', 'karras', 'exponential', 'ays', 'gits']
  },
  {
    label: '--image-no-text-encoder-model-offload',
    value: '--image-no-text-encoder-model-offload'
  },
  {
    label: '--image-no-vae-model-offload',
    value: '--image-no-vae-model-offload'
  },
  {
    label: '--image-vae-tiling',
    value: '--image-vae-tiling'
  }
];

const resultList = options.map((option) => {
  return {
    label: option.label,
    value: option.value,
    opts: option.options?.map((opt) => {
      return {
        label: opt,
        value: opt
      };
    })
  };
});

export default resultList;
