import { BackendParameter } from './index';

const options: BackendParameter[] = [
  // Model and tokenizer
  {
    label: '--model-path',
    value: '--model-path',
    options: []
  },
  {
    label: '--model',
    value: '--model',
    options: []
  },
  {
    label: '--tokenizer-path',
    value: '--tokenizer-path',
    options: []
  },
  {
    label: '--tokenizer-mode',
    value: '--tokenizer-mode',
    options: ['auto', 'slow']
  },
  {
    label: '--tokenizer-worker-num',
    value: '--tokenizer-worker-num',
    options: []
  },
  {
    label: '--skip-tokenizer-init',
    value: '--skip-tokenizer-init',
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
      'sharded_state',
      'gguf',
      'bitsandbytes',
      'layered',
      'remote',
      'remote_instance'
    ]
  },
  {
    label: '--model-loader-extra-config',
    value: '--model-loader-extra-config',
    options: []
  },
  {
    label: '--trust-remote-code',
    value: '--trust-remote-code',
    options: []
  },
  {
    label: '--context-length',
    value: '--context-length',
    options: []
  },
  {
    label: '--is-embedding',
    value: '--is-embedding',
    options: []
  },
  {
    label: '--enable-multimodal',
    value: '--enable-multimodal',
    options: []
  },
  {
    label: '--revision',
    value: '--revision',
    options: []
  },
  {
    label: '--model-impl',
    value: '--model-impl',
    options: []
  },
  // HTTP server
  {
    label: '--port',
    value: '--port',
    options: []
  },
  {
    label: '--skip-server-warmup',
    value: '--skip-server-warmup',
    options: []
  },
  {
    label: '--warmups',
    value: '--warmups',
    options: []
  },
  {
    label: '--nccl-port',
    value: '--nccl-port',
    options: []
  },
  // Quantization and data type
  {
    label: '--dtype',
    value: '--dtype',
    options: ['auto', 'half', 'float16', 'bfloat16', 'float', 'float32']
  },
  {
    label: '--quantization',
    value: '--quantization',
    options: [
      'awq',
      'fp8',
      'gptq',
      'marlin',
      'gptq_marlin',
      'awq_marlin',
      'bitsandbytes',
      'gguf',
      'modelopt',
      'modelopt_fp4',
      'petit_nvfp4',
      'w8a8_int8',
      'w8a8_fp8',
      'moe_wna16',
      'qoq',
      'w4afp8',
      'mxfp4'
    ]
  },
  {
    label: '--quantization-param-path',
    value: '--quantization-param-path',
    options: []
  },
  {
    label: '--modelopt-quant',
    value: '--modelopt-quant',
    options: []
  },
  {
    label: '--modelopt-checkpoint-restore-path',
    value: '--modelopt-checkpoint-restore-path',
    options: []
  },
  {
    label: '--modelopt-checkpoint-save-path',
    value: '--modelopt-checkpoint-save-path',
    options: []
  },
  {
    label: '--kv-cache-dtype',
    value: '--kv-cache-dtype',
    options: ['auto', 'fp8_e5m2', 'fp8_e4m3']
  },
  {
    label: '--enable-fp32-lm-head',
    value: '--enable-fp32-lm-head',
    options: []
  },
  // Memory and scheduling
  {
    label: '--mem-fraction-static',
    value: '--mem-fraction-static',
    options: []
  },
  {
    label: '--max-running-requests',
    value: '--max-running-requests',
    options: []
  },
  {
    label: '--max-queued-requests',
    value: '--max-queued-requests',
    options: []
  },
  {
    label: '--max-total-tokens',
    value: '--max-total-tokens',
    options: []
  },
  {
    label: '--chunked-prefill-size',
    value: '--chunked-prefill-size',
    options: []
  },
  {
    label: '--max-prefill-tokens',
    value: '--max-prefill-tokens',
    options: []
  },
  {
    label: '--schedule-policy',
    value: '--schedule-policy',
    options: ['lpm', 'random', 'fcfs', 'dfs-weight', 'lof', 'priority']
  },
  {
    label: '--enable-priority-scheduling',
    value: '--enable-priority-scheduling',
    options: []
  },
  {
    label: '--schedule-low-priority-values-first',
    value: '--schedule-low-priority-values-first',
    options: []
  },
  {
    label: '--priority-scheduling-preemption-threshold',
    value: '--priority-scheduling-preemption-threshold',
    options: []
  },
  {
    label: '--schedule-conservativeness',
    value: '--schedule-conservativeness',
    options: []
  },
  {
    label: '--page-size',
    value: '--page-size',
    options: []
  },
  {
    label: '--hybrid-kvcache-ratio',
    value: '--hybrid-kvcache-ratio',
    options: []
  },
  {
    label: '--swa-full-tokens-ratio',
    value: '--swa-full-tokens-ratio',
    options: []
  },
  {
    label: '--disable-hybrid-swa-memory',
    value: '--disable-hybrid-swa-memory',
    options: []
  },
  // Runtime options
  {
    label: '--device',
    value: '--device',
    options: []
  },
  {
    label: '--elastic-ep-backend',
    value: '--elastic-ep-backend',
    options: []
  },
  {
    label: '--mooncake-ib-device',
    value: '--mooncake-ib-device',
    options: []
  },
  {
    label: '--tensor-parallel-size',
    value: '--tensor-parallel-size',
    options: []
  },
  {
    label: '--tp-size',
    value: '--tp-size',
    options: []
  },
  {
    label: '--pipeline-parallel-size',
    value: '--pipeline-parallel-size',
    options: []
  },
  {
    label: '--pp-size',
    value: '--pp-size',
    options: []
  },
  {
    label: '--pp-max-micro-batch-size',
    value: '--pp-max-micro-batch-size',
    options: []
  },
  {
    label: '--stream-interval',
    value: '--stream-interval',
    options: []
  },
  {
    label: '--stream-output',
    value: '--stream-output',
    options: []
  },
  {
    label: '--random-seed',
    value: '--random-seed',
    options: []
  },
  {
    label: '--constrained-json-whitespace-pattern',
    value: '--constrained-json-whitespace-pattern',
    options: []
  },
  {
    label: '--constrained-json-disable-any-whitespace',
    value: '--constrained-json-disable-any-whitespace',
    options: []
  },
  {
    label: '--watchdog-timeout',
    value: '--watchdog-timeout',
    options: []
  },
  {
    label: '--dist-timeout',
    value: '--dist-timeout',
    options: []
  },
  {
    label: '--download-dir',
    value: '--download-dir',
    options: []
  },
  {
    label: '--base-gpu-id',
    value: '--base-gpu-id',
    options: []
  },
  {
    label: '--gpu-id-step',
    value: '--gpu-id-step',
    options: []
  },
  {
    label: '--sleep-on-idle',
    value: '--sleep-on-idle',
    options: []
  },
  // Logging
  {
    label: '--log-level',
    value: '--log-level',
    options: []
  },
  {
    label: '--log-level-http',
    value: '--log-level-http',
    options: []
  },
  {
    label: '--log-requests',
    value: '--log-requests',
    options: []
  },
  {
    label: '--log-requests-level',
    value: '--log-requests-level',
    options: ['0', '1', '2', '3']
  },
  {
    label: '--crash-dump-folder',
    value: '--crash-dump-folder',
    options: []
  },
  {
    label: '--crash-on-nan',
    value: '--crash-on-nan',
    options: []
  },
  {
    label: '--show-time-cost',
    value: '--show-time-cost',
    options: []
  },
  {
    label: '--enable-metrics',
    value: '--enable-metrics',
    options: []
  },
  {
    label: '--enable-metrics-for-all-schedulers',
    value: '--enable-metrics-for-all-schedulers',
    options: []
  },
  {
    label: '--tokenizer-metrics-custom-labels-header',
    value: '--tokenizer-metrics-custom-labels-header',
    options: []
  },
  {
    label: '--tokenizer-metrics-allowed-custom-labels',
    value: '--tokenizer-metrics-allowed-custom-labels',
    options: []
  },
  {
    label: '--bucket-time-to-first-token',
    value: '--bucket-time-to-first-token',
    options: []
  },
  {
    label: '--bucket-inter-token-latency',
    value: '--bucket-inter-token-latency',
    options: []
  },
  {
    label: '--bucket-e2e-request-latency',
    value: '--bucket-e2e-request-latency',
    options: []
  },
  {
    label: '--collect-tokens-histogram',
    value: '--collect-tokens-histogram',
    options: []
  },
  {
    label: '--prompt-tokens-buckets',
    value: '--prompt-tokens-buckets',
    options: []
  },
  {
    label: '--generation-tokens-buckets',
    value: '--generation-tokens-buckets',
    options: []
  },
  {
    label: '--gc-warning-threshold-secs',
    value: '--gc-warning-threshold-secs',
    options: []
  },
  {
    label: '--decode-log-interval',
    value: '--decode-log-interval',
    options: []
  },
  {
    label: '--enable-request-time-stats-logging',
    value: '--enable-request-time-stats-logging',
    options: []
  },
  {
    label: '--kv-events-config',
    value: '--kv-events-config',
    options: []
  },
  {
    label: '--enable-trace',
    value: '--enable-trace',
    options: []
  },
  {
    label: '--oltp-traces-endpoint',
    value: '--oltp-traces-endpoint',
    options: []
  },
  // API related
  {
    label: '--api-key',
    value: '--api-key',
    options: []
  },
  {
    label: '--served-model-name',
    value: '--served-model-name',
    options: []
  },
  {
    label: '--weight-version',
    value: '--weight-version',
    options: []
  },
  {
    label: '--chat-template',
    value: '--chat-template',
    options: []
  },
  {
    label: '--completion-template',
    value: '--completion-template',
    options: []
  },
  {
    label: '--file-storage-path',
    value: '--file-storage-path',
    options: []
  },
  {
    label: '--enable-cache-report',
    value: '--enable-cache-report',
    options: []
  },
  {
    label: '--reasoning-parser',
    value: '--reasoning-parser',
    options: [
      'deepseek-r1',
      'deepseek-v3',
      'glm45',
      'gpt-oss',
      'kimi',
      'qwen3',
      'qwen3-thinking',
      'step3'
    ]
  },
  {
    label: '--tool-call-parser',
    value: '--tool-call-parser',
    options: [
      'deepseekv3',
      'deepseekv31',
      'glm',
      'glm45',
      'gpt-oss',
      'kimi_k2',
      'llama3',
      'mistral',
      'pythonic',
      'qwen',
      'qwen25',
      'qwen3_coder',
      'step3'
    ]
  },
  {
    label: '--sampling-defaults',
    value: '--sampling-defaults',
    options: ['openai', 'model']
  },
  {
    label: '--tool-server',
    value: '--tool-server',
    options: []
  },
  {
    label: '--data-parallel-size',
    value: '--data-parallel-size',
    options: []
  },
  // Data parallelism
  {
    label: '--dp-size',
    value: '--dp-size',
    options: []
  },
  {
    label: '--load-balance-method',
    value: '--load-balance-method',
    options: ['round_robin', 'shortest_queue', 'minimum_tokens']
  },
  {
    label: '--load-watch-interval',
    value: '--load-watch-interval',
    options: []
  },
  {
    label: '--prefill-round-robin-balance',
    value: '--prefill-round-robin-balance',
    options: []
  },
  // Multi-node distributed serving
  {
    label: '--dist-init-addr',
    value: '--dist-init-addr',
    options: []
  },
  {
    label: '--nccl-init-addr',
    value: '--nccl-init-addr',
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
  // Model override args
  {
    label: '--json-model-override-args',
    value: '--json-model-override-args',
    options: []
  },
  {
    label: '--preferred-sampling-params',
    value: '--preferred-sampling-params',
    options: []
  },
  // LoRA
  {
    label: '--enable-lora',
    value: '--enable-lora',
    options: []
  },
  {
    label: '--max-lora-rank',
    value: '--max-lora-rank',
    options: []
  },
  {
    label: '--lora-target-modules',
    value: '--lora-target-modules',
    options: [
      'q_proj',
      'k_proj',
      'v_proj',
      'o_proj',
      'gate_proj',
      'up_proj',
      'down_proj',
      'qkv_proj',
      'gate_up_proj',
      'all'
    ]
  },
  {
    label: '--lora-paths',
    value: '--lora-paths',
    options: ['{"lora_name": str, "lora_path": str, "pinned": bool}']
  },
  {
    label: '--max-loras-per-batch',
    value: '--max-loras-per-batch',
    options: []
  },
  {
    label: '--max-loaded-loras',
    value: '--max-loaded-loras',
    options: []
  },
  {
    label: '--lora-eviction-policy',
    value: '--lora-eviction-policy',
    options: ['lru', 'fifo']
  },
  {
    label: '--lora-backend',
    value: '--lora-backend',
    options: ['triton', 'csgmv']
  },
  {
    label: '--max-lora-chunk-size',
    value: '--max-lora-chunk-size',
    options: ['16', '32', '64', '128']
  },
  // Kernel backend
  {
    label: '--attention-backend',
    value: '--attention-backend',
    options: [
      'triton',
      'torch_native',
      'flex_attention',
      'nsa',
      'cutlass_mla',
      'fa3',
      'fa4',
      'flashinfer',
      'flashmla',
      'trtllm_mla',
      'trtllm_mha',
      'dual_chunk_flash_attn',
      'aiter',
      'wave',
      'intel_amx',
      'ascend'
    ]
  },
  {
    label: '--prefill-attention-backend',
    value: '--prefill-attention-backend',
    options: [
      'triton',
      'torch_native',
      'flex_attention',
      'nsa',
      'cutlass_mla',
      'fa3',
      'fa4',
      'flashinfer',
      'flashmla',
      'trtllm_mla',
      'trtllm_mha',
      'dual_chunk_flash_attn',
      'aiter',
      'wave',
      'intel_amx',
      'ascend'
    ]
  },
  {
    label: '--decode-attention-backend',
    value: '--decode-attention-backend',
    options: [
      'triton',
      'torch_native',
      'flex_attention',
      'nsa',
      'cutlass_mla',
      'fa3',
      'fa4',
      'flashinfer',
      'flashmla',
      'trtllm_mla',
      'trtllm_mha',
      'dual_chunk_flash_attn',
      'aiter',
      'wave',
      'intel_amx',
      'ascend'
    ]
  },
  {
    label: '--sampling-backend',
    value: '--sampling-backend',
    options: ['flashinfer', 'pytorch']
  },
  {
    label: '--grammar-backend',
    value: '--grammar-backend',
    options: ['xgrammar', 'outlines', 'llguidance', 'none']
  },
  {
    label: '--mm-attention-backend',
    value: '--mm-attention-backend',
    options: ['sdpa', 'fa3', 'triton_attn', 'ascend_attn']
  },
  {
    label: '--nsa-prefill',
    value: '--nsa-prefill',
    options: ['flashmla_sparse', 'flashmla_decode', 'fa3', 'tilelang', 'aiter']
  },
  {
    label: '--nsa-decode',
    value: '--nsa-decode',
    options: ['flashmla_prefill', 'flashmla_kv', 'fa3', 'tilelang', 'aiter']
  },
  // Speculative decoding
  {
    label: '--speculative-algorithm',
    value: '--speculative-algorithm',
    options: ['EAGLE', 'EAGLE3', 'NEXTN', 'STANDALONE', 'NGRAM']
  },
  {
    label: '--speculative-draft-model-path',
    value: '--speculative-draft-model-path',
    options: []
  },
  {
    label: '--speculative-draft-model',
    value: '--speculative-draft-model',
    options: []
  },
  {
    label: '--speculative-draft-model-revision',
    value: '--speculative-draft-model-revision',
    options: []
  },
  {
    label: '--speculative-num-steps',
    value: '--speculative-num-steps',
    options: []
  },
  {
    label: '--speculative-eagle-topk',
    value: '--speculative-eagle-topk',
    options: []
  },
  {
    label: '--speculative-num-draft-tokens',
    value: '--speculative-num-draft-tokens',
    options: []
  },
  {
    label: '--speculative-accept-threshold-single',
    value: '--speculative-accept-threshold-single',
    options: []
  },
  {
    label: '--speculative-accept-threshold-acc',
    value: '--speculative-accept-threshold-acc',
    options: []
  },
  {
    label: '--speculative-token-map',
    value: '--speculative-token-map',
    options: []
  },
  {
    label: '--speculative-attention-mode',
    value: '--speculative-attention-mode',
    options: ['prefill', 'decode']
  },
  // Ngram speculative decoding
  {
    label: '--speculative-ngram-min-match-window-size',
    value: '--speculative-ngram-min-match-window-size',
    options: []
  },
  {
    label: '--speculative-ngram-max-match-window-size',
    value: '--speculative-ngram-max-match-window-size',
    options: []
  },
  {
    label: '--speculative-ngram-min-bfs-breadth',
    value: '--speculative-ngram-min-bfs-breadth',
    options: []
  },
  {
    label: '--speculative-ngram-max-bfs-breadth',
    value: '--speculative-ngram-max-bfs-breadth',
    options: []
  },
  {
    label: '--speculative-ngram-match-type',
    value: '--speculative-ngram-match-type',
    options: ['BFS', 'PROB']
  },
  {
    label: '--speculative-ngram-branch-length',
    value: '--speculative-ngram-branch-length',
    options: []
  },
  {
    label: '--speculative-ngram-capacity',
    value: '--speculative-ngram-capacity',
    options: []
  },
  // Expert parallelism
  {
    label: '--expert-parallel-size',
    value: '--expert-parallel-size',
    options: []
  },
  {
    label: '--ep-size',
    value: '--ep-size',
    options: []
  },
  {
    label: '--ep',
    value: '--ep',
    options: []
  },
  {
    label: '--moe-a2a-backend',
    value: '--moe-a2a-backend',
    options: ['none', 'deepep']
  },
  {
    label: '--moe-runner-backend',
    value: '--moe-runner-backend',
    options: [
      'auto',
      'deep_gemm',
      'triton',
      'triton_kernel',
      'flashinfer_trtllm',
      'flashinfer_cutlass',
      'flashinfer_mxfp4',
      'flashinfer_cutedsl'
    ]
  },
  {
    label: '--flashinfer-mxfp4-moe-precision',
    value: '--flashinfer-mxfp4-moe-precision',
    options: ['default', 'bf16']
  },
  {
    label: '--enable-flashinfer-allreduce-fusion',
    value: '--enable-flashinfer-allreduce-fusion',
    options: []
  },
  {
    label: '--deepep-mode',
    value: '--deepep-mode',
    options: ['normal', 'low_latency', 'auto']
  },
  {
    label: '--ep-num-redundant-experts',
    value: '--ep-num-redundant-experts',
    options: []
  },
  {
    label: '--ep-dispatch-algorithm',
    value: '--ep-dispatch-algorithm',
    options: []
  },
  {
    label: '--init-expert-location',
    value: '--init-expert-location',
    options: []
  },
  {
    label: '--enable-eplb',
    value: '--enable-eplb',
    options: []
  },
  {
    label: '--eplb-algorithm',
    value: '--eplb-algorithm',
    options: []
  },
  {
    label: '--eplb-rebalance-num-iterations',
    value: '--eplb-rebalance-num-iterations',
    options: []
  },
  {
    label: '--eplb-rebalance-layers-per-chunk',
    value: '--eplb-rebalance-layers-per-chunk',
    options: []
  },
  {
    label: '--eplb-min-rebalancing-utilization-threshold',
    value: '--eplb-min-rebalancing-utilization-threshold',
    options: []
  },
  {
    label: '--expert-distribution-recorder-mode',
    value: '--expert-distribution-recorder-mode',
    options: []
  },
  {
    label: '--expert-distribution-recorder-buffer-size',
    value: '--expert-distribution-recorder-buffer-size',
    options: []
  },
  {
    label: '--enable-expert-distribution-metrics',
    value: '--enable-expert-distribution-metrics',
    options: []
  },
  {
    label: '--deepep-config',
    value: '--deepep-config',
    options: []
  },
  {
    label: '--moe-dense-tp-size',
    value: '--moe-dense-tp-size',
    options: []
  },
  // Mamba Cache
  {
    label: '--max-mamba-cache-size',
    value: '--max-mamba-cache-size',
    options: []
  },
  {
    label: '--mamba-ssm-dtype',
    value: '--mamba-ssm-dtype',
    options: ['float32', 'bfloat16']
  },
  {
    label: '--mamba-full-memory-ratio',
    value: '--mamba-full-memory-ratio',
    options: []
  },
  // Args for multi-item scoring
  {
    label: '--multi-item-scoring-delimiter',
    value: '--multi-item-scoring-delimiter',
    options: []
  },
  // Hierarchical cache
  {
    label: '--enable-hierarchical-cache',
    value: '--enable-hierarchical-cache',
    options: []
  },
  {
    label: '--hicache-ratio',
    value: '--hicache-ratio',
    options: []
  },
  {
    label: '--hicache-size',
    value: '--hicache-size',
    options: []
  },
  {
    label: '--hicache-write-policy',
    value: '--hicache-write-policy',
    options: ['write_back', 'write_through', 'write_through_selective']
  },
  {
    label: '--radix-eviction-policy',
    value: '--radix-eviction-policy',
    options: ['lru', 'lfu']
  },
  {
    label: '--hicache-io-backend',
    value: '--hicache-io-backend',
    options: ['direct', 'kernel']
  },
  {
    label: '--hicache-mem-layout',
    value: '--hicache-mem-layout',
    options: ['layer_first', 'page_first', 'page_first_direct']
  },
  {
    label: '--hicache-storage-backend',
    value: '--hicache-storage-backend',
    options: ['file', 'mooncake', 'hf3fs', 'nixl', 'aibrix', 'dynamic', 'eic']
  },
  {
    label: '--hicache-storage-prefetch-policy',
    value: '--hicache-storage-prefetch-policy',
    options: ['best_effort', 'wait_complete', 'timeout']
  },
  {
    label: '--hicache-storage-backend-extra-config',
    value: '--hicache-storage-backend-extra-config',
    options: []
  },
  // LMCache
  {
    label: '--enable-lmcache',
    value: '--enable-lmcache',
    options: []
  },
  // Double Sparsity
  {
    label: '--enable-double-sparsity',
    value: '--enable-double-sparsity',
    options: []
  },
  {
    label: '--ds-channel-config-path',
    value: '--ds-channel-config-path',
    options: []
  },
  {
    label: '--ds-heavy-channel-num',
    value: '--ds-heavy-channel-num',
    options: []
  },
  {
    label: '--ds-heavy-token-num',
    value: '--ds-heavy-token-num',
    options: []
  },
  {
    label: '--ds-heavy-channel-type',
    value: '--ds-heavy-channel-type',
    options: []
  },
  {
    label: '--ds-sparse-decode-threshold',
    value: '--ds-sparse-decode-threshold',
    options: []
  },
  // Offloading
  {
    label: '--cpu-offload-gb',
    value: '--cpu-offload-gb',
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
    label: '--offload-mode',
    value: '--offload-mode',
    options: []
  },
  // Optimization/debug options
  {
    label: '--disable-radix-cache',
    value: '--disable-radix-cache',
    options: []
  },
  {
    label: '--cuda-graph-max-bs',
    value: '--cuda-graph-max-bs',
    options: []
  },
  {
    label: '--cuda-graph-bs',
    value: '--cuda-graph-bs',
    options: []
  },
  {
    label: '--disable-cuda-graph',
    value: '--disable-cuda-graph',
    options: []
  },
  {
    label: '--disable-cuda-graph-padding',
    value: '--disable-cuda-graph-padding',
    options: []
  },
  {
    label: '--enable-profile-cuda-graph',
    value: '--enable-profile-cuda-graph',
    options: []
  },
  {
    label: '--enable-cudagraph-gc',
    value: '--enable-cudagraph-gc',
    options: []
  },
  {
    label: '--enable-nccl-nvls',
    value: '--enable-nccl-nvls',
    options: []
  },
  {
    label: '--enable-symm-mem',
    value: '--enable-symm-mem',
    options: []
  },
  {
    label: '--disable-flashinfer-cutlass-moe-fp4-allgather',
    value: '--disable-flashinfer-cutlass-moe-fp4-allgather',
    options: []
  },
  {
    label: '--enable-tokenizer-batch-encode',
    value: '--enable-tokenizer-batch-encode',
    options: []
  },
  {
    label: '--disable-outlines-disk-cache',
    value: '--disable-outlines-disk-cache',
    options: []
  },
  {
    label: '--disable-custom-all-reduce',
    value: '--disable-custom-all-reduce',
    options: []
  },
  {
    label: '--enable-mscclpp',
    value: '--enable-mscclpp',
    options: []
  },
  {
    label: '--enable-torch-symm-mem',
    value: '--enable-torch-symm-mem',
    options: []
  },
  {
    label: '--disable-overlap-schedule',
    value: '--disable-overlap-schedule',
    options: []
  },
  {
    label: '--enable-mixed-chunk',
    value: '--enable-mixed-chunk',
    options: []
  },
  {
    label: '--enable-dp-attention',
    value: '--enable-dp-attention',
    options: []
  },
  {
    label: '--enable-dp-lm-head',
    value: '--enable-dp-lm-head',
    options: []
  },
  {
    label: '--enable-two-batch-overlap',
    value: '--enable-two-batch-overlap',
    options: []
  },
  {
    label: '--enable-single-batch-overlap',
    value: '--enable-single-batch-overlap',
    options: []
  },
  {
    label: '--tbo-token-distribution-threshold',
    value: '--tbo-token-distribution-threshold',
    options: []
  },
  {
    label: '--enable-torch-compile',
    value: '--enable-torch-compile',
    options: []
  },
  {
    label: '--enable-piecewise-cuda-graph',
    value: '--enable-piecewise-cuda-graph',
    options: []
  },
  {
    label: '--piecewise-cuda-graph-tokens',
    value: '--piecewise-cuda-graph-tokens',
    options: []
  },
  {
    label: '--torch-compile-max-bs',
    value: '--torch-compile-max-bs',
    options: []
  },
  {
    label: '--piecewise-cuda-graph-max-tokens',
    value: '--piecewise-cuda-graph-max-tokens',
    options: []
  },
  {
    label: '--torchao-config',
    value: '--torchao-config',
    options: []
  },
  {
    label: '--enable-nan-detection',
    value: '--enable-nan-detection',
    options: []
  },
  {
    label: '--enable-p2p-check',
    value: '--enable-p2p-check',
    options: []
  },
  {
    label: '--triton-attention-reduce-in-fp32',
    value: '--triton-attention-reduce-in-fp32',
    options: []
  },
  {
    label: '--triton-attention-num-kv-splits',
    value: '--triton-attention-num-kv-splits',
    options: []
  },
  {
    label: '--triton-attention-split-tile-size',
    value: '--triton-attention-split-tile-size',
    options: []
  },
  {
    label: '--num-continuous-decode-steps',
    value: '--num-continuous-decode-steps',
    options: []
  },
  {
    label: '--delete-ckpt-after-loading',
    value: '--delete-ckpt-after-loading',
    options: []
  },
  {
    label: '--enable-memory-saver',
    value: '--enable-memory-saver',
    options: []
  },
  {
    label: '--enable-weights-cpu-backup',
    value: '--enable-weights-cpu-backup',
    options: []
  },
  {
    label: '--allow-auto-truncate',
    value: '--allow-auto-truncate',
    options: []
  },
  {
    label: '--enable-custom-logit-processor',
    value: '--enable-custom-logit-processor',
    options: []
  },
  {
    label: '--flashinfer-mla-disable-ragged',
    value: '--flashinfer-mla-disable-ragged',
    options: []
  },
  {
    label: '--disable-shared-experts-fusion',
    value: '--disable-shared-experts-fusion',
    options: []
  },
  {
    label: '--disable-chunked-prefix-cache',
    value: '--disable-chunked-prefix-cache',
    options: []
  },
  {
    label: '--disable-fast-image-processor',
    value: '--disable-fast-image-processor',
    options: []
  },
  {
    label: '--keep-mm-feature-on-device',
    value: '--keep-mm-feature-on-device',
    options: []
  },
  {
    label: '--enable-return-hidden-states',
    value: '--enable-return-hidden-states',
    options: []
  },
  {
    label: '--scheduler-recv-interval',
    value: '--scheduler-recv-interval',
    options: []
  },
  {
    label: '--numa-node',
    value: '--numa-node',
    options: []
  },
  // Debug tensor dumps
  {
    label: '--debug-tensor-dump-output-folder',
    value: '--debug-tensor-dump-output-folder',
    options: []
  },
  {
    label: '--debug-tensor-dump-input-file',
    value: '--debug-tensor-dump-input-file',
    options: []
  },
  {
    label: '--debug-tensor-dump-inject',
    value: '--debug-tensor-dump-inject',
    options: []
  },
  {
    label: '--enable-dynamic-batch-tokenizer',
    value: '--enable-dynamic-batch-tokenizer',
    options: []
  },
  {
    label: '--dynamic-batch-tokenizer-batch-size',
    value: '--dynamic-batch-tokenizer-batch-size',
    options: []
  },
  {
    label: '--dynamic-batch-tokenizer-batch-timeout',
    value: '--dynamic-batch-tokenizer-batch-timeout',
    options: []
  },
  // PD disaggregation
  {
    label: '--disaggregation-mode',
    value: '--disaggregation-mode',
    options: ['null', 'prefill', 'decode']
  },
  {
    label: '--disaggregation-transfer-backend',
    value: '--disaggregation-transfer-backend',
    options: ['mooncake', 'nixl', 'ascend', 'fake']
  },
  {
    label: '--disaggregation-bootstrap-port',
    value: '--disaggregation-bootstrap-port',
    options: []
  },
  {
    label: '--disaggregation-decode-tp',
    value: '--disaggregation-decode-tp',
    options: []
  },
  {
    label: '--disaggregation-decode-dp',
    value: '--disaggregation-decode-dp',
    options: []
  },
  {
    label: '--disaggregation-prefill-pp',
    value: '--disaggregation-prefill-pp',
    options: []
  },
  {
    label: '--disaggregation-ib-device',
    value: '--disaggregation-ib-device',
    options: []
  },
  {
    label: '--disaggregation-decode-enable-offload-kvcache',
    value: '--disaggregation-decode-enable-offload-kvcache',
    options: []
  },
  {
    label: '--num-reserved-decode-tokens',
    value: '--num-reserved-decode-tokens',
    options: []
  },
  {
    label: '--disaggregation-decode-polling-interval',
    value: '--disaggregation-decode-polling-interval',
    options: []
  },
  // Custom weight loader
  {
    label: '--custom-weight-loader',
    value: '--custom-weight-loader',
    options: []
  },
  {
    label: '--weight-loader-disable-mmap',
    value: '--weight-loader-disable-mmap',
    options: []
  },
  {
    label: '--remote-instance-weight-loader-seed-instance-ip',
    value: '--remote-instance-weight-loader-seed-instance-ip',
    options: []
  },
  {
    label: '--remote-instance-weight-loader-seed-instance-service-port',
    value: '--remote-instance-weight-loader-seed-instance-service-port',
    options: []
  },
  {
    label: '--remote-instance-weight-loader-send-weights-group-ports',
    value: '--remote-instance-weight-loader-send-weights-group-ports',
    options: []
  },
  // For PD-Multiplexing
  {
    label: '--enable-pdmux',
    value: '--enable-pdmux',
    options: []
  },
  {
    label: '--pdmux-config-path',
    value: '--pdmux-config-path',
    options: []
  },
  {
    label: '--sm-group-num',
    value: '--sm-group-num',
    options: []
  },
  // For deterministic inference
  {
    label: '--enable-deterministic-inference',
    value: '--enable-deterministic-inference',
    options: []
  },
  // Configuration file support
  {
    label: '--config',
    value: '--config',
    options: []
  }
];

export default options;
