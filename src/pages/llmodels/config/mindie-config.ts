const options = [
  {
    label: '--log-level',
    value: '--log-level',
    options: ['Info', 'Verbose', 'Warning', 'Warn', 'Error', 'Debug']
  },
  {
    label: '--max-seq-len',
    value: '--max-seq-len'
  },
  {
    label: '--max-input-token-len',
    value: '--max-input-token-len'
  },
  {
    label: '--cpu-mem-size',
    value: '--cpu-mem-size'
  },
  {
    label: '--npu-memory-fraction',
    value: '--npu-memory-fraction'
  },
  {
    label: '--cache-block-size',
    value: '--cache-block-size'
  },
  {
    label: '--max-prefill-batch-size',
    value: '--max-prefill-batch-size'
  },
  {
    label: '--prefill-time-ms-per-req',
    value: '--prefill-time-ms-per-req',
    options: ['0', '1', '2', '3']
  },
  {
    label: '--prefill-policy-type',
    value: '--prefill-policy-type'
  },
  {
    label: '--max-batch-size',
    value: '--max-batch-size'
  },
  {
    label: '--decode-time-ms-per-req',
    value: '--decode-time-ms-per-req'
  },
  {
    label: '--decode-policy-type',
    value: '--decode-policy-type',
    options: ['0', '1', '2', '3']
  },
  {
    label: '--max-preempt-count',
    value: '--max-preempt-count'
  },
  {
    label: '--support-select-batch',
    value: '--support-select-batch'
  },
  {
    label: '--max-queue-delay-microseconds',
    value: '--max-queue-delay-microseconds'
  },
  {
    label: '--enable-prefix-caching',
    value: '--enable-prefix-caching'
  },
  {
    label: '--metrics',
    value: '--metrics'
  },
  {
    label: '--enforce-eager',
    value: '--enforce-eager'
  },
  {
    label: '--trust-remote-code',
    value: '--trust-remote-code'
  },
  {
    label: '--truncation',
    value: '--truncation'
  },
  {
    label: '--max-link-num',
    value: '--max-link-num'
  },
  {
    label: '--dtype',
    value: '--dtype',
    options: ['auto', 'half', 'float16', 'bfloat16', 'float', 'float32']
  },
  {
    label: '--rope-scaling',
    value: '--rope-scaling'
  },
  {
    label: '--rope-theta',
    value: '--rope-theta'
  },
  {
    label: '--override-generation-config',
    value: '--override-generation-config'
  },
  {
    label: '--enable-split',
    value: '--enable-split'
  },
  {
    label: '--policy-type',
    value: '--policy-type',
    options: [0, 4, 5, 6, 7]
  },
  {
    label: '--split-chunk-tokens',
    value: '--split-chunk-tokens'
  },
  {
    label: '--split-start-batch-size',
    value: '--split-start-batch-size'
  },
  {
    label: '--enable-memory-decoding',
    value: '--enable-memory-decoding'
  },
  {
    label: '--memory-decoding-length',
    value: '--memory-decoding-length'
  },
  {
    label: '--memory-decoding-dynamic-algo',
    value: '--memory-decoding-dynamic-algo'
  },
  {
    label: '--enable-lookahead',
    value: '--enable-lookahead'
  },
  {
    label: '--lookahead-level',
    value: '--lookahead-level'
  },
  {
    label: '--lookahead-window',
    value: '--lookahead-window'
  },
  {
    label: '--lookahead-guess-set-size',
    value: '--lookahead-guess-set-size'
  },
  {
    label: '--tensor-parallel-size',
    value: '--tensor-parallel-size'
  },
  {
    label: '--data-parallel-size',
    value: '--data-parallel-size'
  },
  {
    label: '--enable-buffer-response',
    value: '--enable-buffer-response'
  },
  {
    label: '--prefill-expected-time-ms',
    value: '--prefill-expected-time-ms'
  },
  {
    label: '--decode-expected-time-ms',
    value: '--decode-expected-time-ms'
  },
  {
    label: '--pipeline-parallel-size',
    value: '--pipeline-parallel-size'
  },
  {
    label: '--sequence-parallel-size',
    value: '--sequence-parallel-size'
  },
  {
    label: '--moe-expert-parallel-size',
    value: '--moe-expert-parallel-size'
  },
  {
    label: '--moe-tensor-parallel-size',
    value: '--moe-tensor-parallel-size'
  },
  {
    label: '--enable-multi-token-prediction',
    value: '--enable-multi-token-prediction'
  },
  {
    label: '--multi-token-prediction-tokens',
    value: '--multi-token-prediction-tokens'
  }
];

const resultList = options.map((option) => {
  return {
    label: option.label,
    value: option.value,
    opts: option.options?.map((opt) => {
      return {
        label: `${opt}`,
        value: opt
      };
    })
  };
});

export default resultList;
