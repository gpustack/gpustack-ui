const options = [
  {
    label: '--log-level',
    value: '--log-level',
    options: ['Verbose', 'Info', 'Warning', 'Warn', 'Error', 'Debug']
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
