import { BackendParameter } from './index';

const options: BackendParameter[] = [
  {
    label: '--uvicorn-log-level',
    value: '--uvicorn-log-level',
    options: ['debug', 'info', 'warning', 'error', 'critical', 'trace']
  },
  {
    label: '--disable-uvicorn-access-log',
    value: '--disable-uvicorn-access-log',
    options: []
  },
  {
    label: '--allow-credentials',
    value: '--allow-credentials',
    options: []
  },
  {
    label: '--allowed-origins',
    value: '--allowed-origins',
    options: []
  },
  {
    label: '--allowed-methods',
    value: '--allowed-methods',
    options: []
  },
  {
    label: '--allowed-headers',
    value: '--allowed-headers',
    options: []
  },
  {
    label: '--api-key',
    value: '--api-key',
    options: []
  },
  {
    label: '--lora-modules',
    value: '--lora-modules',
    options: []
  },
  {
    label: '--prompt-adapters',
    value: '--prompt-adapters',
    options: []
  },
  {
    label: '--chat-template',
    value: '--chat-template',
    options: []
  },
  {
    label: '--response-role',
    value: '--response-role',
    options: []
  },
  {
    label: '--ssl-keyfile',
    value: '--ssl-keyfile',
    options: []
  },
  {
    label: '--ssl-certfile',
    value: '--ssl-certfile',
    options: []
  },
  {
    label: '--data-parallel-size-local',
    value: '--data-parallel-size-local',
    options: []
  },
  {
    label: '--enable-ssl-refresh',
    value: '--enable-ssl-refresh',
    options: []
  },
  {
    label: '--ssl-ca-certs',
    value: '--ssl-ca-certs',
    options: []
  },
  {
    label: '--ssl-cert-reqs',
    value: '--ssl-cert-reqs',
    options: []
  },
  {
    label: '--root-path',
    value: '--root-path',
    options: []
  },
  {
    label: '--middleware',
    value: '--middleware',
    options: []
  },
  {
    label: '--return-tokens-as-token-ids',
    value: '--return-tokens-as-token-ids',
    options: []
  },
  {
    label: '--disable-frontend-multiprocessing',
    value: '--disable-frontend-multiprocessing',
    options: []
  },
  {
    label: '--enable-request-id-headers',
    value: '--enable-request-id-headers',
    options: []
  },
  {
    label: '--enable-auto-tool-choice',
    value: '--enable-auto-tool-choice',
    options: []
  },
  {
    label: '--tool-call-parser',
    value: '--tool-call-parser',
    options: [
      'phi4_mini_json',
      'llama3_json',
      'llama4_json',
      'pythonic',
      'jamba',
      'xlam',
      'llama4_pythonic',
      'hunyuan_a13b',
      'mistral',
      'deepseek_v3',
      'kimi_k2',
      'step3',
      'qwen3_coder',
      'hermes',
      'glm45',
      'granite',
      'minimax',
      'granite-20b-fc',
      'internlm'
    ]
  },
  {
    label: '--task',
    value: '--task',
    options: [
      'auto',
      'generate',
      'embedding',
      'embed',
      'classify',
      'score',
      'reward',
      'transcription'
    ]
  },
  {
    label: '--allowed-local-media-path',
    value: '--allowed-local-media-path',
    options: []
  },
  {
    label: '--tool-parser-plugin',
    value: '--tool-parser-plugin',
    options: []
  },
  {
    label: '--model',
    value: '--model',
    options: []
  },
  {
    label: '--tokenizer',
    value: '--tokenizer',
    options: []
  },
  {
    label: '--hf-config-path',
    value: '--hf-config-path',
    options: []
  },
  {
    label: '--skip-tokenizer-init',
    value: '--skip-tokenizer-init',
    options: []
  },
  {
    label: '--revision',
    value: '--revision',
    options: []
  },
  {
    label: '--code-revision',
    value: '--code-revision',
    options: []
  },
  {
    label: '--tokenizer-revision',
    value: '--tokenizer-revision',
    options: []
  },
  {
    label: '--tokenizer-mode',
    value: '--tokenizer-mode',
    options: ['auto', 'slow', 'mistral', 'custom']
  },
  {
    label: '--trust-remote-code',
    value: '--trust-remote-code',
    options: []
  },
  {
    label: '--download-dir',
    value: '--download-dir',
    options: []
  },
  {
    label: '--load-format',
    value: '--load-format',
    options: [
      'auto',
      'pt',
      'safetensors',
      'npcache',
      'dummy',
      'tensorizer',
      'sharded_state',
      'gguf',
      'bitsandbytes',
      'mistral',
      'runai_streamer',
      'fastsafetensors'
    ]
  },
  {
    label: '--chat-template-content-format',
    value: '--chat-template-content-format',
    options: ['auto', 'string', 'openai']
  },
  {
    label: '--enable-reasoning',
    value: '--enable-reasoning',
    options: []
  },
  {
    label: '--reasoning-parser',
    value: '--reasoning-parser',
    options: [
      'deepseek_r1',
      'glm45',
      'GptOss',
      'granite',
      'hunyuan_a13b',
      'mistral',
      'qwen3',
      'step3'
    ]
  },
  {
    label: '--config-format',
    value: '--config-format',
    options: ['auto', 'hf', 'mistral']
  },
  {
    label: '--disable-cascade-attn',
    value: '--disable-cascade-attn',
    options: []
  },
  {
    label: '--dtype',
    value: '--dtype',
    options: ['auto', 'half', 'float16', 'bfloat16', 'float', 'float32']
  },
  {
    label: '--kv-cache-dtype',
    value: '--kv-cache-dtype',
    options: ['auto', 'fp8', 'fp8_e5m2', 'fp8_e4m3']
  },
  {
    label: '--disable-chunked-mm-input',
    value: '--disable-chunked-mm-input',
    options: []
  },
  {
    label: 'DISABLE_CHUNKED_MM_INPUT',
    value: 'DISABLE_CHUNKED_MM_INPUT',
    options: []
  },
  {
    label: '--quantization-param-path',
    value: '--quantization-param-path',
    options: []
  },
  {
    label: '--max-model-len',
    value: '--max-model-len',
    options: []
  },
  {
    label: '--guided-decoding-backend',
    value: '--guided-decoding-backend',
    options: ['outlines', 'lm-format-enforcer', 'xgrammar']
  },
  {
    label: '--logits-processor-pattern',
    value: '--logits-processor-pattern',
    options: []
  },

  {
    label: '--model-impl',
    value: '--model-impl',
    options: ['auto', 'vllm', 'transformers']
  },
  {
    label: '--distributed-executor-backend',
    value: '--distributed-executor-backend',
    options: ['ray', 'mp', 'uni', 'external_launcher']
  },
  {
    label: '--worker-use-ray',
    value: '--worker-use-ray',
    options: []
  },
  {
    label: '--data-parallel-size',
    value: '--data-parallel-size',
    options: []
  },
  {
    label: '--enable-expert-parallel',
    value: '--enable-expert-parallel',
    options: []
  },
  {
    label: '--pipeline-parallel-size',
    value: '--pipeline-parallel-size',
    options: []
  },
  {
    label: '--tensor-parallel-size',
    value: '--tensor-parallel-size',
    options: []
  },
  {
    label: '--max-parallel-loading-workers',
    value: '--max-parallel-loading-workers',
    options: []
  },
  {
    label: '--ray-workers-use-nsight',
    value: '--ray-workers-use-nsight',
    options: []
  },
  {
    label: '--block-size',
    value: '--block-size',
    options: ['8', '16', '32', '64', '128']
  },
  {
    label: '--enable-prefix-caching',
    value: '--enable-prefix-caching',
    options: []
  },
  {
    label: '--prefix-caching-hash-algo',
    value: '--prefix-caching-hash-algo',
    options: ['builtin', 'sha256']
  },
  {
    label: '--disable-sliding-window',
    value: '--disable-sliding-window',
    options: []
  },
  {
    label: '--use-v2-block-manager',
    value: '--use-v2-block-manager',
    options: []
  },
  {
    label: '--num-lookahead-slots',
    value: '--num-lookahead-slots',
    options: []
  },
  {
    label: '--seed',
    value: '--seed',
    options: []
  },
  {
    label: '--swap-space',
    value: '--swap-space',
    options: []
  },
  {
    label: '--cpu-offload-gb',
    value: '--cpu-offload-gb',
    options: []
  },
  {
    label: '--gpu-memory-utilization',
    value: '--gpu-memory-utilization',
    options: []
  },
  {
    label: '--num-gpu-blocks-override',
    value: '--num-gpu-blocks-override',
    options: []
  },
  {
    label: '--max-num-batched-tokens',
    value: '--max-num-batched-tokens',
    options: []
  },
  {
    label: '--max-num-partial-prefills',
    value: '--max-num-partial-prefills',
    options: []
  },

  {
    label: '--max-long-partial-prefills',
    value: '--max-long-partial-prefills',
    options: []
  },

  {
    label: '--long-prefill-token-threshold',
    value: '--long-prefill-token-threshold',
    options: []
  },
  {
    label: '--max-num-seqs',
    value: '--max-num-seqs',
    options: []
  },
  {
    label: '--max-logprobs',
    value: '--max-logprobs',
    options: []
  },
  {
    label: '--disable-log-stats',
    value: '--disable-log-stats',
    options: []
  },
  {
    label: '--hf-overrides',
    value: '--hf-overrides',
    options: []
  },
  {
    label: '--hf-token',
    value: '--hf-token',
    options: []
  },

  {
    label: 'HF_TOKEN',
    value: 'HF_TOKEN',
    options: []
  },
  {
    label: '--disable-mm-preprocessor-cache',
    value: '--disable-mm-preprocessor-cache',
    options: []
  },
  {
    label: '--quantization',
    value: '--quantization',
    options: [
      'aqlm',
      'awq',
      'deepspeedfp',
      'tpu_int8',
      'fp8',
      'ptpc_fp8',
      'fbgemm_fp8',
      'modelopt',
      'nvfp4',
      'marlin',
      'gguf',
      'gptq_marlin_24',
      'gptq_marlin',
      'awq_marlin',
      'gptq',
      'compressed-tensors',
      'bitsandbytes',
      'qqq',
      'hqq',
      'experts_int8',
      'neuron_quant',
      'ipex',
      'quark',
      'moe_wna16',
      'torchao',
      'ascend',
      'None'
    ]
  },
  {
    label: '--enable-lora-bias',
    value: '--enable-lora-bias',
    options: []
  },
  {
    label: '--rope-theta',
    value: '--rope-theta',
    options: []
  },
  {
    label: '--enforce-eager',
    value: '--enforce-eager',
    options: []
  },
  {
    label: '--max-context-len-to-capture',
    value: '--max-context-len-to-capture',
    options: []
  },
  {
    label: '--max-seq-len-to-capture',
    value: '--max-seq-len-to-capture',
    options: []
  },
  {
    label: '--disable-custom-all-reduce',
    value: '--disable-custom-all-reduce',
    options: []
  },
  {
    label: '--tokenizer-pool-size',
    value: '--tokenizer-pool-size',
    options: []
  },
  {
    label: '--tokenizer-pool-type',
    value: '--tokenizer-pool-type',
    options: []
  },
  {
    label: '--tokenizer-pool-extra-config',
    value: '--tokenizer-pool-extra-config',
    options: []
  },
  {
    label: '--limit-mm-per-prompt',
    value: '--limit-mm-per-prompt',
    options: []
  },
  {
    label: '--mm-processor-kwargs',
    value: '--mm-processor-kwargs',
    options: []
  },
  {
    label: '--enable-lora',
    value: '--enable-lora',
    options: []
  },
  {
    label: '--max-loras',
    value: '--max-loras',
    options: []
  },
  {
    label: '--max-lora-rank',
    value: '--max-lora-rank',
    options: []
  },
  {
    label: '--lora-extra-vocab-size',
    value: '--lora-extra-vocab-size',
    options: []
  },
  {
    label: '--lora-dtype',
    value: '--lora-dtype',
    options: ['auto', 'float16', 'bfloat16']
  },
  {
    label: '--long-lora-scaling-factors',
    value: '--long-lora-scaling-factors',
    options: []
  },
  {
    label: '--max-cpu-loras',
    value: '--max-cpu-loras',
    options: []
  },
  {
    label: '--fully-sharded-loras',
    value: '--fully-sharded-loras',
    options: []
  },
  {
    label: '--enable-prompt-adapter',
    value: '--enable-prompt-adapter',
    options: []
  },
  {
    label: '--max-prompt-adapters',
    value: '--max-prompt-adapters',
    options: []
  },
  {
    label: '--max-prompt-adapter-token',
    value: '--max-prompt-adapter-token',
    options: []
  },
  {
    label: '--device',
    value: '--device',
    options: ['auto', 'cuda', 'neuron', 'cpu', 'tpu', 'xpu', 'hpu']
  },
  {
    label: '--speculative-config',
    value: '--speculative-config',
    options: []
  },
  {
    label: '--num-scheduler-steps',
    value: '--num-scheduler-steps',
    options: []
  },
  {
    label: '--multi-step-stream-outputs',
    value: '--multi-step-stream-outputs',
    options: []
  },
  {
    label: '--scheduler-delay-factor',
    value: '--scheduler-delay-factor',
    options: []
  },
  {
    label: '--enable-chunked-prefill',
    value: '--enable-chunked-prefill',
    options: []
  },
  {
    label: '--model-loader-extra-config',
    value: '--model-loader-extra-config',
    options: []
  },
  {
    label: '--scheduler-cls',
    value: '--scheduler-cls',
    options: []
  },
  {
    label: '--use-tqdm-on-load',
    value: '--use-tqdm-on-load',
    options: []
  },
  {
    label: '--ignore-patterns',
    value: '--ignore-patterns',
    options: []
  },
  {
    label: '--show-hidden-metrics-for-version',
    value: '--show-hidden-metrics-for-version',
    options: []
  },
  {
    label: '--preemption-mode',
    value: '--preemption-mode',
    options: []
  },
  {
    label: '--served-model-name',
    value: '--served-model-name',
    options: []
  },
  {
    label: '--qlora-adapter-name-or-path',
    value: '--qlora-adapter-name-or-path',
    options: []
  },
  {
    label: '--otlp-traces-endpoint',
    value: '--otlp-traces-endpoint',
    options: []
  },
  {
    label: '--collect-detailed-traces',
    value: '--collect-detailed-traces',
    options: []
  },
  {
    label: '--disable-async-output-proc',
    value: '--disable-async-output-proc',
    options: []
  },
  {
    label: '--override-neuron-config',
    value: '--override-neuron-config',
    options: []
  },
  {
    label: '--compilation-config',
    value: '--compilation-config',
    options: []
  },
  {
    label: '--override-pooler-config',
    value: '--override-pooler-config',
    options: []
  },
  {
    label: '--kv-transfer-config',
    value: '--kv-transfer-config',
    options: []
  },
  {
    label: '--worker-cls',
    value: '--worker-cls',
    options: []
  },
  {
    label: '--override-generation-config',
    value: '--override-generation-config',
    options: []
  },
  {
    label: '--enable-sleep-mode',
    value: '--enable-sleep-mode',
    options: []
  },

  {
    label: '--calculate-kv-scales',
    value: '--calculate-kv-scales',
    options: []
  },
  {
    label: '--generation-config',
    value: '--generation-config',
    options: []
  },
  {
    label: '--scheduling-policy',
    value: '--scheduling-policy',
    options: ['fcfs', 'priority']
  },
  {
    label: '--disable-log-requests',
    value: '--disable-log-requests',
    options: []
  },
  {
    label: '--additional-config',
    value: '--additional-config',
    options: []
  },
  {
    label: '--max-log-len',
    value: '--max-log-len',
    options: []
  },
  {
    label: '--disable-fastapi-docs',
    value: '--disable-fastapi-docs',
    options: []
  },
  {
    label: '--enable-prompt-tokens-details',
    value: '--enable-prompt-tokens-details',
    options: []
  },
  {
    label: '--enable-server-load-tracking',
    value: '--enable-server-load-tracking',
    options: []
  }
];

export default options;
