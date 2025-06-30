const options = [
  {
    label: '--verbose',
    value: '--verbose'
  },
  {
    label: '--verbosity',
    value: '--verbosity'
  },
  {
    label: '--host',
    value: '--host'
  },
  {
    label: '--timeout',
    value: '--timeout'
  },
  {
    label: '--threads-http',
    value: '--threads-http'
  },
  {
    label: '--conn-idle',
    value: '--conn-idle'
  },
  {
    label: '--lora',
    value: '--lora'
  },
  {
    label: '--lora-scaled',
    value: '--lora-scaled'
  },
  {
    label: '--conn-keepalive',
    value: '--conn-keepalive'
  },
  {
    label: '--lora-init-without-apply',
    value: '--lora-init-without-apply'
  },
  {
    label: '--seed',
    value: '--seed'
  },
  {
    label: '--main-gpu',
    value: '--main-gpu'
  },
  {
    label: '--flash-attn',
    value: '--flash-attn'
  },
  {
    label: '--metrics',
    value: '--metrics'
  },
  {
    label: '--slots',
    value: '--slots'
  },
  {
    label: '--no-warmup',
    value: '--no-warmup'
  },
  {
    label: '--device',
    value: '--device'
  },
  {
    label: '--gpu-layers',
    value: '--gpu-layers'
  },
  {
    label: '--split-mode',
    value: '--split-mode'
  },
  {
    label: '--tensor-split',
    value: '--tensor-split'
  },
  {
    label: '--override-kv',
    value: '--override-kv'
  },
  {
    label: '--chat-template',
    value: '--chat-template',
    options: [
      'chatglm3',
      'chatglm4',
      'chatml',
      'command-r',
      'deepseek',
      'deepseek2',
      'deepseek3',
      'exaone3',
      'falcon',
      'falcon3',
      'gemma',
      'gigachat',
      'granite',
      'llama2',
      'llama2-sys',
      'llama2-sys-bos',
      'llama2-sys-strip',
      'llama3',
      'llava',
      'llava-mistral',
      'megrez',
      'minicpm',
      'mistral-v1',
      'mistral-v3',
      'mistral-v3-tekken',
      'mistral-v7',
      'monarch',
      'openchat',
      'orion',
      'phi3',
      'phi4',
      'rwkv-world',
      'vicuna',
      'vicuna-orca',
      'zephyr'
    ]
  },
  {
    label: '--chat-template-file',
    value: '--chat-template-file'
  },
  {
    label: '--slot-save-path',
    value: '--slot-save-path'
  },
  {
    label: '--slot-prompt-similarity',
    value: '--slot-prompt-similarity'
  },
  {
    label: '--tokens-per-second',
    value: '--tokens-per-second'
  },
  {
    label: '--threads',
    value: '--threads'
  },
  {
    label: '--cpu-mask',
    value: '--cpu-mask'
  },
  {
    label: '--cpu-range',
    value: '--cpu-range'
  },
  {
    label: '--cpu-strict',
    value: '--cpu-strict',
    options: ['0', '1']
  },
  {
    label: '--prio',
    value: '--prio',
    options: ['0', '1', '2', '3']
  },
  {
    label: '--poll',
    value: '--poll'
  },
  {
    label: '--threads-batch',
    value: '--threads-batch'
  },
  {
    label: '--cpu-mask-batch',
    value: '--cpu-mask-batch'
  },
  {
    label: '--cpu-range-batch',
    value: '--cpu-range-batch'
  },
  {
    label: '--cpu-strict-batch',
    value: '--cpu-strict-batch',
    options: ['0', '1']
  },
  {
    label: '--prio-batch',
    value: '--prio-batch',
    options: ['0', '1', '2', '3']
  },
  {
    label: '--poll-batch',
    value: '--poll-batch'
  },
  {
    label: '--ctx-size',
    value: '--ctx-size',
    options: []
  },
  {
    label: '--no-context-shift',
    value: '--no-context-shift'
  },
  {
    label: '--predict',
    value: '--predict',
    options: ['-1', '-2']
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
    label: '--keep',
    value: '--keep',
    options: ['0', '-1']
  },
  {
    label: '--escape',
    value: '--escape'
  },
  {
    label: '--samplers',
    value: '--samplers',
    options: []
  },
  {
    label: '--sampling-seq',
    value: '--sampling-seq'
  },
  {
    label: '--temp',
    value: '--temp'
  },
  {
    label: '--no-escape',
    value: '--no-escape'
  },
  {
    label: '--top-k',
    value: '--top-k'
  },
  {
    label: '--top-p',
    value: '--top-p'
  },
  {
    label: '--min-p',
    value: '--min-p'
  },
  {
    label: '--typical',
    value: '--typical'
  },
  {
    label: '--xtc-probability',
    value: '--xtc-probability'
  },
  {
    label: '--xtc-threshold',
    value: '--xtc-threshold'
  },
  {
    label: '--repeat-last-n',
    value: '--repeat-last-n'
  },
  {
    label: '--repeat-penalty',
    value: '--repeat-penalty'
  },
  {
    label: '--presence-penalty',
    value: '--presence-penalty'
  },
  {
    label: '--frequency-penalty',
    value: '--frequency-penalty'
  },
  {
    label: '--dry-multiplier',
    value: '--dry-multiplier'
  },
  {
    label: '--dry-base',
    value: '--dry-base'
  },
  {
    label: '--dry-allowed-length',
    value: '--dry-allowed-length'
  },
  {
    label: '--dry-penalty-last-n',
    value: '--dry-penalty-last-n'
  },
  {
    label: '--dry-sequence-breaker',
    value: '--dry-sequence-breaker'
  },
  {
    label: '--dynatemp-range',
    value: '--dynatemp-range'
  },
  {
    label: '--dynatemp-exp',
    value: '--dynatemp-exp'
  },
  {
    label: '--mirostat',
    value: '--mirostat',
    options: ['0', '1', '2']
  },
  {
    label: '--mirostat-lr',
    value: '--mirostat-lr'
  },
  {
    label: '--mirostat-ent',
    value: '--mirostat-ent'
  },
  {
    label: '--logit-bias',
    value: '--logit-bias'
  },
  {
    label: '--grammar',
    value: '--grammar'
  },
  {
    label: '--grammar-file',
    value: '--grammar-file'
  },
  {
    label: '--json-schema',
    value: '--json-schema'
  },
  {
    label: '--rope-scaling',
    value: '--rope-scaling',
    options: ['linear', 'yarn']
  },
  {
    label: '--rope-scale',
    value: '--rope-scale'
  },
  {
    label: '--rope-freq-base',
    value: '--rope-freq-base'
  },
  {
    label: '--rope-freq-scale',
    value: '--rope-freq-scale'
  },
  {
    label: '--yarn-orig-ctx',
    value: '--yarn-orig-ctx'
  },
  {
    label: '--yarn-ext-factor',
    value: '--yarn-ext-factor'
  },
  {
    label: '--yarn-attn-factor',
    value: '--yarn-attn-factor'
  },
  {
    label: '--yarn-beta-fast',
    value: '--yarn-beta-fast'
  },
  {
    label: '--yarn-beta-slow',
    value: '--yarn-beta-slow'
  },
  {
    label: '--no-kv-offload',
    value: '--no-kv-offload'
  },
  {
    label: '--no-cache-prompt',
    value: '--no-cache-prompt'
  },
  {
    label: '--cache-reuse',
    value: '--cache-reuse'
  },
  {
    label: '--cache-type-k',
    value: '--cache-type-k',
    options: [
      'f32',
      'f16',
      'bf16',
      'q8_0',
      'q4_0',
      'q4_1',
      'iq4_nl',
      'q5_0',
      'q5_1'
    ]
  },
  {
    label: '--cache-type-v',
    value: '--cache-type-v',
    options: [
      'f32',
      'f16',
      'bf16',
      'q8_0',
      'q4_0',
      'q4_1',
      'iq4_nl',
      'q5_0',
      'q5_1'
    ]
  },
  {
    label: '--defrag-thold',
    value: '--defrag-thold'
  },
  {
    label: '--no-cont-batching',
    value: '--no-cont-batching'
  },
  {
    label: '--mlock',
    value: '--mlock'
  },
  {
    label: '--no-mmap',
    value: '--no-mmap'
  },
  {
    label: '--mmap',
    value: '--mmap'
  },
  {
    label: '--visual-max-image-size',
    value: '--visual-max-image-size'
  },
  {
    label: '--images',
    value: '--images'
  },
  {
    label: '--model',
    value: '--model'
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
    label: '--image-sample-method',
    value: '--image-sample-method',
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
    label: '--image-sampling-steps',
    value: '--image-sampling-steps'
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
    label: '--image-clip-l-model',
    value: '--image-clip-l-model'
  },
  {
    label: '--image-clip-g-model',
    value: '--image-clip-g-model'
  },
  {
    label: '--image-t5xxl-model',
    value: '--image-t5xxl-model'
  },
  {
    label: '--image-schedule-method',
    value: '--image-schedule-method',
    options: ['default', 'discrete', 'karras', 'exponential', 'ays', 'gits']
  },
  {
    label: '--image-no-text-encoder-model-offload',
    value: '--image-no-text-encoder-model-offload'
  },
  {
    label: '--image-vae-model',
    value: '--image-vae-model'
  },
  {
    label: '--image-no-vae-model-offload',
    value: '--image-no-vae-model-offload'
  },
  {
    label: '--image-vae-tiling',
    value: '--image-vae-tiling'
  },
  {
    label: '--image-no-vae-tiling',
    value: '--image-no-vae-tiling'
  },
  {
    label: '--mmproj',
    value: '--mmproj'
  },
  {
    label: '--image-taesd-model',
    value: '--image-taesd-model'
  },
  {
    label: '--image-upscale-model',
    value: '--image-upscale-model'
  },
  {
    label: '--image-upscale-repeats',
    value: '--image-upscale-repeats'
  },
  {
    label: '--image-no-control-net-model-offload',
    value: '--image-no-control-net-model-offload'
  },
  {
    label: '--image-control-net-model',
    value: '--image-control-net-model'
  },
  {
    label: '--image-control-strength',
    value: '--image-control-strength'
  },
  {
    label: '--image-control-canny',
    value: '--image-control-canny'
  },
  {
    label: '--image-free-compute-memory-immediately',
    value: '--image-free-compute-memory-immediately'
  },
  {
    label: '--jinja',
    value: '--jinja'
  },
  {
    label: '--context-shift',
    value: '--context-shift'
  },
  {
    label: '--visual-max-image-cache',
    value: '--visual-max-image-cache'
  },
  {
    label: '--max-projected-cache',
    value: '--max-projected-cache'
  },
  {
    label: '--swa-full',
    value: '--swa-full'
  },
  {
    label: '--no-enable-reasoning',
    value: '--no-enable-reasoning'
  },
  {
    label: '--override-tensor',
    value: '--override-tensor'
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
