import { BackendParameter } from './index';

// Generated from the vLLM `vllm serve` CLI reference:
// https://docs.vllm.ai/en/latest/cli/serve/
// Grouped by the config sections in the docs. Long-form flags only
// (short aliases and `--no-*` negations are omitted). `options` lists the
// fixed choice values when the flag accepts a restricted set.
const options: BackendParameter[] = [
  // General
  {
    label: '--headless',
    value: '--headless',
    options: []
  },
  {
    label: '--api-server-count',
    value: '--api-server-count',
    options: []
  },
  {
    label: '--config',
    value: '--config',
    options: []
  },
  {
    label: '--grpc',
    value: '--grpc',
    options: []
  },
  {
    label: '--disable-log-stats',
    value: '--disable-log-stats',
    options: []
  },
  {
    label: '--aggregate-engine-logging',
    value: '--aggregate-engine-logging',
    options: []
  },
  {
    label: '--fail-on-environ-validation',
    value: '--fail-on-environ-validation',
    options: []
  },
  {
    label: '--shutdown-timeout',
    value: '--shutdown-timeout',
    options: []
  },
  {
    label: '--gdn-prefill-backend',
    value: '--gdn-prefill-backend',
    options: ['flashinfer', 'triton', 'cutedsl']
  },
  {
    label: '--enable-log-requests',
    value: '--enable-log-requests',
    options: []
  },

  // Frontend
  {
    label: '--lora-modules',
    value: '--lora-modules',
    options: []
  },
  {
    label: '--chat-template',
    value: '--chat-template',
    options: []
  },
  {
    label: '--chat-template-content-format',
    value: '--chat-template-content-format',
    options: ['auto', 'openai', 'string']
  },
  {
    label: '--trust-request-chat-template',
    value: '--trust-request-chat-template',
    options: []
  },
  {
    label: '--default-chat-template-kwargs',
    value: '--default-chat-template-kwargs',
    options: []
  },
  {
    label: '--response-role',
    value: '--response-role',
    options: []
  },
  {
    label: '--return-tokens-as-token-ids',
    value: '--return-tokens-as-token-ids',
    options: []
  },
  {
    label: '--enable-auto-tool-choice',
    value: '--enable-auto-tool-choice',
    options: []
  },
  {
    label: '--exclude-tools-when-tool-choice-none',
    value: '--exclude-tools-when-tool-choice-none',
    options: []
  },
  {
    label: '--tool-call-parser',
    value: '--tool-call-parser',
    options: []
  },
  {
    label: '--tool-parser-plugin',
    value: '--tool-parser-plugin',
    options: []
  },
  {
    label: '--tool-server',
    value: '--tool-server',
    options: []
  },
  {
    label: '--log-config-file',
    value: '--log-config-file',
    options: []
  },
  {
    label: '--max-log-len',
    value: '--max-log-len',
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
  },
  {
    label: '--enable-force-include-usage',
    value: '--enable-force-include-usage',
    options: []
  },
  {
    label: '--enable-tokenizer-info-endpoint',
    value: '--enable-tokenizer-info-endpoint',
    options: []
  },
  {
    label: '--enable-log-outputs',
    value: '--enable-log-outputs',
    options: []
  },
  {
    label: '--enable-log-deltas',
    value: '--enable-log-deltas',
    options: []
  },
  {
    label: '--log-error-stack',
    value: '--log-error-stack',
    options: []
  },
  {
    label: '--tokens-only',
    value: '--tokens-only',
    options: []
  },
  {
    label: '--fingerprint-mode',
    value: '--fingerprint-mode',
    options: ['custom', 'full', 'hash', 'none']
  },
  {
    label: '--fingerprint-value',
    value: '--fingerprint-value',
    options: []
  },
  {
    label: '--host',
    value: '--host',
    options: []
  },
  {
    label: '--port',
    value: '--port',
    options: []
  },
  {
    label: '--data-parallel-supervisor-port',
    value: '--data-parallel-supervisor-port',
    options: []
  },
  {
    label: '--dp-supervisor-probe-interval-s',
    value: '--dp-supervisor-probe-interval-s',
    options: []
  },
  {
    label: '--dp-supervisor-probe-timeout-s',
    value: '--dp-supervisor-probe-timeout-s',
    options: []
  },
  {
    label: '--dp-supervisor-probe-failure-threshold',
    value: '--dp-supervisor-probe-failure-threshold',
    options: []
  },
  {
    label: '--uds',
    value: '--uds',
    options: []
  },
  {
    label: '--uvicorn-log-level',
    value: '--uvicorn-log-level',
    options: ['critical', 'debug', 'error', 'info', 'trace', 'warning']
  },
  {
    label: '--disable-uvicorn-access-log',
    value: '--disable-uvicorn-access-log',
    options: []
  },
  {
    label: '--disable-access-log-for-endpoints',
    value: '--disable-access-log-for-endpoints',
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
    label: '--ssl-ca-certs',
    value: '--ssl-ca-certs',
    options: []
  },
  {
    label: '--enable-ssl-refresh',
    value: '--enable-ssl-refresh',
    options: []
  },
  {
    label: '--ssl-cert-reqs',
    value: '--ssl-cert-reqs',
    options: []
  },
  {
    label: '--ssl-ciphers',
    value: '--ssl-ciphers',
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
    label: '--enable-request-id-headers',
    value: '--enable-request-id-headers',
    options: []
  },
  {
    label: '--disable-fastapi-docs',
    value: '--disable-fastapi-docs',
    options: []
  },
  {
    label: '--h11-max-incomplete-event-size',
    value: '--h11-max-incomplete-event-size',
    options: []
  },
  {
    label: '--h11-max-header-count',
    value: '--h11-max-header-count',
    options: []
  },
  {
    label: '--enable-offline-docs',
    value: '--enable-offline-docs',
    options: []
  },
  {
    label: '--enable-flash-late-interaction',
    value: '--enable-flash-late-interaction',
    options: []
  },

  // ModelConfig
  {
    label: '--model',
    value: '--model',
    options: []
  },
  {
    label: '--runner',
    value: '--runner',
    options: ['auto', 'draft', 'generate', 'pooling']
  },
  {
    label: '--convert',
    value: '--convert',
    options: ['auto', 'classify', 'embed', 'none']
  },
  {
    label: '--tokenizer',
    value: '--tokenizer',
    options: []
  },
  {
    label: '--tokenizer-mode',
    value: '--tokenizer-mode',
    options: ['auto', 'deepseek_v32', 'deepseek_v4', 'hf', 'mistral', 'slow']
  },
  {
    label: '--trust-remote-code',
    value: '--trust-remote-code',
    options: []
  },
  {
    label: '--dtype',
    value: '--dtype',
    options: ['auto', 'bfloat16', 'float', 'float16', 'float32', 'half']
  },
  {
    label: '--seed',
    value: '--seed',
    options: []
  },
  {
    label: '--hf-config-path',
    value: '--hf-config-path',
    options: []
  },
  {
    label: '--allowed-local-media-path',
    value: '--allowed-local-media-path',
    options: []
  },
  {
    label: '--allowed-media-domains',
    value: '--allowed-media-domains',
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
    label: '--max-model-len',
    value: '--max-model-len',
    options: []
  },
  {
    label: '--quantization',
    value: '--quantization',
    options: []
  },
  {
    label: '--quantization-config',
    value: '--quantization-config',
    options: []
  },
  {
    label: '--allow-deprecated-quantization',
    value: '--allow-deprecated-quantization',
    options: []
  },
  {
    label: '--enforce-eager',
    value: '--enforce-eager',
    options: []
  },
  {
    label: '--enable-return-routed-experts',
    value: '--enable-return-routed-experts',
    options: []
  },
  {
    label: '--max-logprobs',
    value: '--max-logprobs',
    options: []
  },
  {
    label: '--logprobs-mode',
    value: '--logprobs-mode',
    options: [
      'processed_logits',
      'processed_logprobs',
      'raw_logits',
      'raw_logprobs'
    ]
  },
  {
    label: '--use-fp64-gumbel',
    value: '--use-fp64-gumbel',
    options: []
  },
  {
    label: '--disable-sliding-window',
    value: '--disable-sliding-window',
    options: []
  },
  {
    label: '--disable-cascade-attn',
    value: '--disable-cascade-attn',
    options: []
  },
  {
    label: '--skip-tokenizer-init',
    value: '--skip-tokenizer-init',
    options: []
  },
  {
    label: '--enable-prompt-embeds',
    value: '--enable-prompt-embeds',
    options: []
  },
  {
    label: '--served-model-name',
    value: '--served-model-name',
    options: []
  },
  {
    label: '--config-format',
    value: '--config-format',
    options: ['auto', 'hf', 'mistral']
  },
  {
    label: '--hf-token',
    value: '--hf-token',
    options: []
  },
  {
    label: '--hf-overrides',
    value: '--hf-overrides',
    options: []
  },
  {
    label: '--pooler-config',
    value: '--pooler-config',
    options: []
  },
  {
    label: '--generation-config',
    value: '--generation-config',
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
    label: '--enable-cumem-allocator',
    value: '--enable-cumem-allocator',
    options: []
  },
  {
    label: '--model-impl',
    value: '--model-impl',
    options: ['auto', 'terratorch', 'transformers', 'vllm']
  },
  {
    label: '--override-attention-dtype',
    value: '--override-attention-dtype',
    options: []
  },
  {
    label: '--logits-processors',
    value: '--logits-processors',
    options: []
  },
  {
    label: '--io-processor-plugin',
    value: '--io-processor-plugin',
    options: []
  },
  {
    label: '--renderer-num-workers',
    value: '--renderer-num-workers',
    options: []
  },

  // LoadConfig
  {
    label: '--load-format',
    value: '--load-format',
    options: [
      'auto',
      'pt',
      'safetensors',
      'instanttensor',
      'npcache',
      'dummy',
      'tensorizer',
      'runai_streamer',
      'runai_streamer_sharded',
      'bitsandbytes',
      'sharded_state',
      'mistral',
      'modelexpress'
    ]
  },
  {
    label: '--download-dir',
    value: '--download-dir',
    options: []
  },
  {
    label: '--safetensors-load-strategy',
    value: '--safetensors-load-strategy',
    options: ['eager', 'lazy', 'prefetch', 'torchao', 'None']
  },
  {
    label: '--safetensors-prefetch-num-threads',
    value: '--safetensors-prefetch-num-threads',
    options: []
  },
  {
    label: '--safetensors-prefetch-block-size',
    value: '--safetensors-prefetch-block-size',
    options: []
  },
  {
    label: '--model-loader-extra-config',
    value: '--model-loader-extra-config',
    options: []
  },
  {
    label: '--ignore-patterns',
    value: '--ignore-patterns',
    options: []
  },
  {
    label: '--use-tqdm-on-load',
    value: '--use-tqdm-on-load',
    options: []
  },
  {
    label: '--pt-load-map-location',
    value: '--pt-load-map-location',
    options: []
  },

  // AttentionConfig
  {
    label: '--attention-backend',
    value: '--attention-backend',
    options: []
  },

  // MambaConfig
  {
    label: '--mamba-backend',
    value: '--mamba-backend',
    options: []
  },
  {
    label: '--enable-mamba-cache-stochastic-rounding',
    value: '--enable-mamba-cache-stochastic-rounding',
    options: []
  },
  {
    label: '--mamba-cache-philox-rounds',
    value: '--mamba-cache-philox-rounds',
    options: []
  },

  // StructuredOutputsConfig
  {
    label: '--reasoning-parser',
    value: '--reasoning-parser',
    options: []
  },
  {
    label: '--reasoning-parser-plugin',
    value: '--reasoning-parser-plugin',
    options: []
  },

  // ParallelConfig
  {
    label: '--distributed-executor-backend',
    value: '--distributed-executor-backend',
    options: ['external_launcher', 'mp', 'ray', 'uni']
  },
  {
    label: '--pipeline-parallel-size',
    value: '--pipeline-parallel-size',
    options: []
  },
  {
    label: '--master-addr',
    value: '--master-addr',
    options: []
  },
  {
    label: '--master-port',
    value: '--master-port',
    options: []
  },
  {
    label: '--nnodes',
    value: '--nnodes',
    options: []
  },
  {
    label: '--node-rank',
    value: '--node-rank',
    options: []
  },
  {
    label: '--distributed-timeout-seconds',
    value: '--distributed-timeout-seconds',
    options: []
  },
  {
    label: '--cpu-distributed-timeout-seconds',
    value: '--cpu-distributed-timeout-seconds',
    options: []
  },
  {
    label: '--numa-bind',
    value: '--numa-bind',
    options: []
  },
  {
    label: '--numa-bind-nodes',
    value: '--numa-bind-nodes',
    options: []
  },
  {
    label: '--numa-bind-cpus',
    value: '--numa-bind-cpus',
    options: []
  },
  {
    label: '--tensor-parallel-size',
    value: '--tensor-parallel-size',
    options: []
  },
  {
    label: '--decode-context-parallel-size',
    value: '--decode-context-parallel-size',
    options: []
  },
  {
    label: '--dcp-comm-backend',
    value: '--dcp-comm-backend',
    options: ['a2a', 'ag_rs']
  },
  {
    label: '--dcp-kv-cache-interleave-size',
    value: '--dcp-kv-cache-interleave-size',
    options: []
  },
  {
    label: '--cp-kv-cache-interleave-size',
    value: '--cp-kv-cache-interleave-size',
    options: []
  },
  {
    label: '--prefill-context-parallel-size',
    value: '--prefill-context-parallel-size',
    options: []
  },
  {
    label: '--data-parallel-size',
    value: '--data-parallel-size',
    options: []
  },
  {
    label: '--data-parallel-rank',
    value: '--data-parallel-rank',
    options: []
  },
  {
    label: '--data-parallel-start-rank',
    value: '--data-parallel-start-rank',
    options: []
  },
  {
    label: '--data-parallel-size-local',
    value: '--data-parallel-size-local',
    options: []
  },
  {
    label: '--data-parallel-address',
    value: '--data-parallel-address',
    options: []
  },
  {
    label: '--data-parallel-rpc-port',
    value: '--data-parallel-rpc-port',
    options: []
  },
  {
    label: '--data-parallel-backend',
    value: '--data-parallel-backend',
    options: ['mp', 'ray']
  },
  {
    label: '--data-parallel-hybrid-lb',
    value: '--data-parallel-hybrid-lb',
    options: []
  },
  {
    label: '--data-parallel-external-lb',
    value: '--data-parallel-external-lb',
    options: []
  },
  {
    label: '--data-parallel-multi-port-external-lb',
    value: '--data-parallel-multi-port-external-lb',
    options: []
  },
  {
    label: '--enable-expert-parallel',
    value: '--enable-expert-parallel',
    options: []
  },
  {
    label: '--enable-ep-weight-filter',
    value: '--enable-ep-weight-filter',
    options: []
  },
  {
    label: '--all2all-backend',
    value: '--all2all-backend',
    options: [
      'allgather_reducescatter',
      'deepep_high_throughput',
      'deepep_low_latency',
      'deepep_v2',
      'flashinfer_all2allv',
      'flashinfer_nvlink_one_sided',
      'flashinfer_nvlink_two_sided',
      'mori_high_throughput',
      'mori_low_latency',
      'naive',
      'nixl_ep',
      'pplx'
    ]
  },
  {
    label: '--enable-dbo',
    value: '--enable-dbo',
    options: []
  },
  {
    label: '--ubatch-size',
    value: '--ubatch-size',
    options: []
  },
  {
    label: '--enable-elastic-ep',
    value: '--enable-elastic-ep',
    options: []
  },
  {
    label: '--dbo-decode-token-threshold',
    value: '--dbo-decode-token-threshold',
    options: []
  },
  {
    label: '--dbo-prefill-token-threshold',
    value: '--dbo-prefill-token-threshold',
    options: []
  },
  {
    label: '--disable-nccl-for-dp-synchronization',
    value: '--disable-nccl-for-dp-synchronization',
    options: []
  },
  {
    label: '--enable-eplb',
    value: '--enable-eplb',
    options: []
  },
  {
    label: '--eplb-config',
    value: '--eplb-config',
    options: []
  },
  {
    label: '--expert-placement-strategy',
    value: '--expert-placement-strategy',
    options: ['linear', 'round_robin']
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
    label: '--disable-custom-all-reduce',
    value: '--disable-custom-all-reduce',
    options: []
  },
  {
    label: '--worker-cls',
    value: '--worker-cls',
    options: []
  },
  {
    label: '--worker-extension-cls',
    value: '--worker-extension-cls',
    options: []
  },

  // CacheConfig
  {
    label: '--block-size',
    value: '--block-size',
    options: ['1', '8', '16', '32', '64', '128']
  },
  {
    label: '--gpu-memory-utilization',
    value: '--gpu-memory-utilization',
    options: []
  },
  {
    label: '--kv-cache-memory-bytes',
    value: '--kv-cache-memory-bytes',
    options: []
  },
  {
    label: '--kv-cache-dtype',
    value: '--kv-cache-dtype',
    options: [
      'auto',
      'bfloat16',
      'float16',
      'fp8',
      'fp8_ds_mla',
      'fp8_e4m3',
      'fp8_e5m2',
      'fp8_inc',
      'fp8_per_token_head',
      'int8_per_token_head',
      'nvfp4',
      'turboquant_3bit_nc',
      'turboquant_4bit_nc',
      'turboquant_k3v4_nc',
      'turboquant_k8v4'
    ]
  },
  {
    label: '--num-gpu-blocks-override',
    value: '--num-gpu-blocks-override',
    options: []
  },
  {
    label: '--enable-prefix-caching',
    value: '--enable-prefix-caching',
    options: []
  },
  {
    label: '--prefix-caching-hash-algo',
    value: '--prefix-caching-hash-algo',
    options: ['sha256', 'sha256_cbor', 'xxhash', 'xxhash_cbor']
  },
  {
    label: '--calculate-kv-scales',
    value: '--calculate-kv-scales',
    options: []
  },
  {
    label: '--kv-cache-dtype-skip-layers',
    value: '--kv-cache-dtype-skip-layers',
    options: []
  },
  {
    label: '--kv-sharing-fast-prefill',
    value: '--kv-sharing-fast-prefill',
    options: []
  },
  {
    label: '--mamba-cache-dtype',
    value: '--mamba-cache-dtype',
    options: ['auto', 'bfloat16', 'float16', 'float32']
  },
  {
    label: '--mamba-ssm-cache-dtype',
    value: '--mamba-ssm-cache-dtype',
    options: ['auto', 'bfloat16', 'float16', 'float32']
  },
  {
    label: '--mamba-block-size',
    value: '--mamba-block-size',
    options: []
  },
  {
    label: '--mamba-cache-mode',
    value: '--mamba-cache-mode',
    options: ['align', 'all', 'none']
  },
  {
    label: '--kv-offloading-size',
    value: '--kv-offloading-size',
    options: []
  },
  {
    label: '--kv-offloading-backend',
    value: '--kv-offloading-backend',
    options: ['lmcache', 'native']
  },

  // OffloadConfig
  {
    label: '--offload-backend',
    value: '--offload-backend',
    options: ['auto', 'prefetch', 'uva']
  },
  {
    label: '--cpu-offload-gb',
    value: '--cpu-offload-gb',
    options: []
  },
  {
    label: '--cpu-offload-params',
    value: '--cpu-offload-params',
    options: []
  },
  {
    label: '--offload-group-size',
    value: '--offload-group-size',
    options: []
  },
  {
    label: '--offload-num-in-group',
    value: '--offload-num-in-group',
    options: []
  },
  {
    label: '--offload-prefetch-step',
    value: '--offload-prefetch-step',
    options: []
  },
  {
    label: '--offload-params',
    value: '--offload-params',
    options: []
  },

  // MultiModalConfig
  {
    label: '--language-model-only',
    value: '--language-model-only',
    options: []
  },
  {
    label: '--limit-mm-per-prompt',
    value: '--limit-mm-per-prompt',
    options: []
  },
  {
    label: '--enable-mm-embeds',
    value: '--enable-mm-embeds',
    options: []
  },
  {
    label: '--media-io-kwargs',
    value: '--media-io-kwargs',
    options: []
  },
  {
    label: '--mm-processor-kwargs',
    value: '--mm-processor-kwargs',
    options: []
  },
  {
    label: '--mm-processor-cache-gb',
    value: '--mm-processor-cache-gb',
    options: []
  },
  {
    label: '--mm-processor-cache-type',
    value: '--mm-processor-cache-type',
    options: ['lru', 'shm']
  },
  {
    label: '--mm-shm-cache-max-object-size-mb',
    value: '--mm-shm-cache-max-object-size-mb',
    options: []
  },
  {
    label: '--mm-encoder-only',
    value: '--mm-encoder-only',
    options: []
  },
  {
    label: '--mm-encoder-tp-mode',
    value: '--mm-encoder-tp-mode',
    options: ['data', 'weights']
  },
  {
    label: '--mm-encoder-attn-backend',
    value: '--mm-encoder-attn-backend',
    options: []
  },
  {
    label: '--mm-encoder-attn-dtype',
    value: '--mm-encoder-attn-dtype',
    options: ['fp8', 'None']
  },
  {
    label: '--mm-encoder-fp8-scale-path',
    value: '--mm-encoder-fp8-scale-path',
    options: []
  },
  {
    label: '--mm-encoder-fp8-scale-save-path',
    value: '--mm-encoder-fp8-scale-save-path',
    options: []
  },
  {
    label: '--mm-encoder-fp8-scale-save-margin',
    value: '--mm-encoder-fp8-scale-save-margin',
    options: []
  },
  {
    label: '--interleave-mm-strings',
    value: '--interleave-mm-strings',
    options: []
  },
  {
    label: '--skip-mm-profiling',
    value: '--skip-mm-profiling',
    options: []
  },
  {
    label: '--video-pruning-rate',
    value: '--video-pruning-rate',
    options: []
  },
  {
    label: '--mm-tensor-ipc',
    value: '--mm-tensor-ipc',
    options: ['direct_rpc', 'torch_shm']
  },

  // LoRAConfig
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
    options: ['1', '8', '16', '32', '64', '128', '256', '320', '512']
  },
  {
    label: '--lora-dtype',
    value: '--lora-dtype',
    options: []
  },
  {
    label: '--enable-tower-connector-lora',
    value: '--enable-tower-connector-lora',
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
    label: '--lora-target-modules',
    value: '--lora-target-modules',
    options: []
  },
  {
    label: '--default-mm-loras',
    value: '--default-mm-loras',
    options: []
  },
  {
    label: '--specialize-active-lora',
    value: '--specialize-active-lora',
    options: []
  },
  {
    label: '--enable-mixed-moe-lora-format',
    value: '--enable-mixed-moe-lora-format',
    options: []
  },

  // ObservabilityConfig
  {
    label: '--show-hidden-metrics-for-version',
    value: '--show-hidden-metrics-for-version',
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
    options: ['all', 'model', 'worker', 'None']
  },
  {
    label: '--kv-cache-metrics',
    value: '--kv-cache-metrics',
    options: []
  },
  {
    label: '--kv-cache-metrics-sample',
    value: '--kv-cache-metrics-sample',
    options: []
  },
  {
    label: '--cudagraph-metrics',
    value: '--cudagraph-metrics',
    options: []
  },
  {
    label: '--enable-layerwise-nvtx-tracing',
    value: '--enable-layerwise-nvtx-tracing',
    options: []
  },
  {
    label: '--enable-mfu-metrics',
    value: '--enable-mfu-metrics',
    options: []
  },
  {
    label: '--enable-logging-iteration-details',
    value: '--enable-logging-iteration-details',
    options: []
  },
  {
    label: '--jit-monitor-verbose',
    value: '--jit-monitor-verbose',
    options: []
  },

  // SchedulerConfig
  {
    label: '--max-num-batched-tokens',
    value: '--max-num-batched-tokens',
    options: []
  },
  {
    label: '--max-num-seqs',
    value: '--max-num-seqs',
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
    label: '--scheduling-policy',
    value: '--scheduling-policy',
    options: ['fcfs', 'priority']
  },
  {
    label: '--enable-chunked-prefill',
    value: '--enable-chunked-prefill',
    options: []
  },
  {
    label: '--disable-chunked-mm-input',
    value: '--disable-chunked-mm-input',
    options: []
  },
  {
    label: '--scheduler-cls',
    value: '--scheduler-cls',
    options: []
  },
  {
    label: '--scheduler-reserve-full-isl',
    value: '--scheduler-reserve-full-isl',
    options: []
  },
  {
    label: '--watermark',
    value: '--watermark',
    options: []
  },
  {
    label: '--prefill-schedule-interval',
    value: '--prefill-schedule-interval',
    options: []
  },
  {
    label: '--disable-hybrid-kv-cache-manager',
    value: '--disable-hybrid-kv-cache-manager',
    options: []
  },
  {
    label: '--async-scheduling',
    value: '--async-scheduling',
    options: []
  },
  {
    label: '--stream-interval',
    value: '--stream-interval',
    options: []
  },

  // CompilationConfig
  {
    label: '--cudagraph-capture-sizes',
    value: '--cudagraph-capture-sizes',
    options: []
  },
  {
    label: '--max-cudagraph-capture-size',
    value: '--max-cudagraph-capture-size',
    options: []
  },

  // KernelConfig
  {
    label: '--ir-op-priority',
    value: '--ir-op-priority',
    options: []
  },
  {
    label: '--enable-flashinfer-autotune',
    value: '--enable-flashinfer-autotune',
    options: []
  },
  {
    label: '--moe-backend',
    value: '--moe-backend',
    options: [
      'aiter',
      'auto',
      'cutlass',
      'deep_gemm',
      'deep_gemm_mega_moe',
      'emulation',
      'flashinfer_b12x',
      'flashinfer_cutedsl',
      'flashinfer_cutlass',
      'flashinfer_trtllm',
      'flydsl',
      'humming',
      'marlin',
      'triton',
      'triton_unfused'
    ]
  },
  {
    label: '--linear-backend',
    value: '--linear-backend',
    options: [
      'aiter',
      'auto',
      'conch',
      'cutlass',
      'deep_gemm',
      'emulation',
      'exllama',
      'fbgemm',
      'flashinfer_b12x',
      'flashinfer_cudnn',
      'flashinfer_cutlass',
      'flashinfer_trtllm',
      'machete',
      'marlin',
      'torch',
      'triton'
    ]
  },

  // VllmConfig
  {
    label: '--speculative-config',
    value: '--speculative-config',
    options: []
  },
  {
    label: '--spec-method',
    value: '--spec-method',
    options: [
      'custom_class',
      'deepseek_mtp',
      'dflash',
      'draft_model',
      'eagle',
      'eagle3',
      'ernie_mtp',
      'exaone4_5_mtp',
      'exaone_moe_mtp',
      'extract_hidden_states',
      'gemma4_mtp',
      'glm4_moe_lite_mtp',
      'glm4_moe_mtp',
      'glm_ocr_mtp',
      'hy_v3_mtp',
      'longcat_flash_mtp',
      'medusa',
      'mimo_mtp',
      'mimo_v2_mtp',
      'minimax_m3_mtp',
      'mlp_speculator',
      'mtp',
      'nemotron_h_mtp',
      'ngram',
      'ngram_gpu',
      'pangu_ultra_moe_mtp',
      'qwen3_5_mtp',
      'qwen3_next_mtp',
      'step3p5_mtp',
      'suffix',
      'None'
    ]
  },
  {
    label: '--spec-model',
    value: '--spec-model',
    options: []
  },
  {
    label: '--spec-tokens',
    value: '--spec-tokens',
    options: []
  },
  {
    label: '--diffusion-config',
    value: '--diffusion-config',
    options: []
  },
  {
    label: '--kv-transfer-config',
    value: '--kv-transfer-config',
    options: []
  },
  {
    label: '--kv-events-config',
    value: '--kv-events-config',
    options: []
  },
  {
    label: '--ec-transfer-config',
    value: '--ec-transfer-config',
    options: []
  },
  {
    label: '--compilation-config',
    value: '--compilation-config',
    options: []
  },
  {
    label: '--attention-config',
    value: '--attention-config',
    options: []
  }
];

export default options;
