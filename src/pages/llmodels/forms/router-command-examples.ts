/** Complete commands for the Router template field, rather than shell scripts. */
export const routerCommandExamples = (mode?: string) => {
  const managed = !!mode && mode !== 'custom';
  const sglang = mode?.startsWith('sglang-');
  const bootstrap = sglang || mode === 'vllm-mooncake';
  const executable = managed
    ? sglang
      ? 'python3 -m sglang_router.launch_router'
      : 'vllm-router'
    : 'your-router';
  const command = [
    executable,
    '  --host 0.0.0.0',
    '  --port {{port}}',
    ...(managed
      ? sglang
        ? ['  --pd-disaggregation']
        : [
            '  --vllm-pd-disaggregation',
            `  --kv-connector ${mode === 'vllm-mooncake' ? 'mooncake' : 'nixl'}`
          ]
      : []),
    ...(managed
      ? [
          '  --prometheus-host 0.0.0.0',
          '  --prometheus-port {{ports.prometheus}}'
        ]
      : []),
    '{% for p in prefill %}',
    `  --prefill {{p.url}}${bootstrap ? ' {{p.ports.bootstrap}}' : ''}`,
    '{% endfor %}',
    '{% for d in decode %}',
    '  --decode {{d.url}}',
    '{% endfor %}'
  ].join('\n');
  return [
    { key: 'current', command, generic: !managed },
    {
      key: 'join',
      command: [
        'your-router',
        '  --listen {{worker_ip}}',
        '  --listen-port {{port}}',
        '  --prefill-endpoints "{{prefill_urls | join(\',\')}}"',
        '  --decode-endpoints "{{decode_urls | join(\',\')}}"'
      ].join('\n'),
      generic: true
    }
  ];
};
