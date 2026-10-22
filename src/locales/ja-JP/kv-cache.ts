export default {
  'kvCache.check.recreate.insufficientRam':
    'ワーカー {worker} での再作成には {required} GiB が必要ですが、現在割り当て可能なのは {available} GiB です。リソースを解放するか、設定を変更してください。',
  'kvCache.check.recreate.unavailable':
    '再作成に必要なリソースデータを取得できません。',
  'kvCache.title': 'Cache Service',
  'kvCache.source.manage': 'Manage Providers',
  'kvCache.source.builtin':
    'the cache providers this release carries, together with those any installed extension adds',
  'kvCache.button.add': 'Add Cache Service',
  'kvCache.providerSelect.title': 'Select Provider',
  'kvCache.provider.source.builtin': 'Built-in',
  'kvCache.provider.source.community': 'Community',
  'kvCache.provider.source.partner': 'GPUStack Certified Partner',
  'kvCache.button.viewLogs': 'View Logs',
  'kvCache.edit.recreate.tips':
    'Changes take effect after the instances are deleted and recreated.',
  'kvCache.table.provider': 'Provider',
  'kvCache.table.worker': 'Worker',
  'kvCache.form.provider': 'Provider',
  'kvCache.form.version': 'Version',
  'kvCache.form.version.custom': 'Custom',
  'kvCache.form.image': 'Container Image',
  'kvCache.check.ok.perNode':
    'Resources are sufficient; one instance will run on each of {count} workers.',
  'kvCache.check.ok.singleton':
    'Resources are sufficient; the instance will run on worker {worker}.',
  'kvCache.check.noWorkers': 'No workers match the selector.',
  'kvCache.check.noReadyWorkers':
    'このクラスターには Ready 状態のワーカーがありません。別のクラスターを選択するか、ワーカーの状態を確認してください。',
  'kvCache.check.noReadyTargets':
    '選択したワーカーとラベルに一致する Ready 状態のワーカーがありません。選択を変更するか、ワーカーの状態を確認してください。',
  'kvCache.check.workersLoading':
    'ワーカーの状態を読み込み中です。デプロイする前にお待ちください。',
  'kvCache.check.workersUnavailable':
    'ワーカーの状態を読み込めません。クラスターを選択し直して再試行してからデプロイしてください。',
  'kvCache.check.ok.store':
    'Deployable: {replicas} store replica(s) x {size} GiB fit the matching workers',
  'kvCache.check.store.insufficientWorkers':
    'Only {count} worker(s) match the selector; {replicas} store replicas requested',
  'kvCache.check.store.exceedsFree':
    'Only {count} matching worker(s) have {size} GiB free memory; {replicas} replicas requested',
  'kvCache.check.store.exceedsTotal':
    '一致するワーカーのうち、{size} GiB の store レプリカを収容できる総メモリ容量を持つのは {count} 台のみです。{replicas} 個のレプリカが必要です',
  'kvCache.check.unsupportedAccel':
    '{count} of {total} target workers use accelerators ({backends}) this version has no image for; instances there will fail to start',
  'kvCache.check.noCpuImage':
    '{count} of {total} target workers have no accelerator, and this version has no image that runs without one; instances there will fail to start',
  'kvCache.form.ramSize.exceedsTotal':
    'Exceeds the memory capacity of worker {worker} ({total} GiB).',
  'kvCache.form.ramSize.exceedsFree':
    'Exceeds the free memory on worker {worker} ({free} GiB free); the cache server may be OOM-killed.',
  'kvCache.form.workerSelector': 'Worker Label Selector',
  'kvCache.form.worker.autoTips':
    'Optional — leave empty to let the scheduler place the instance',
  'kvCache.form.workerSelector.scopeTips':
    'Limits instance placement to workers matching all labels; leave empty to allow every worker.',
  'kvCache.form.workerSelector.tips':
    'Runs one instance on each worker matching all labels; leave empty to cover every worker.',
  'kvCache.form.managementUrl': 'Management URL',
  'kvCache.form.managementUrl.tips':
    'Link to the engine-provided management UI; shown as a link beside the service name',
  'kvCache.form.managementUrl.invalid': 'Enter a valid http(s) URL',
  'kvCache.button.management': 'Management URL',
  'kvCache.form.advanced': 'Advanced',
  'kvCache.form.parameters': 'Parameters',
  'kvCache.form.parameters.noComponent':
    'Every component of this provider is switched off by the settings above, so there is nothing to pass parameters to.',
  'kvCache.form.env': 'Environment Variables',
  'kvCache.form.env.componentTips': 'Applies to every component of the service',
  'kvCache.form.l2Backend': 'L2 Storage Backend',
  'kvCache.form.l2Backend.add': 'Add Backend',
  'kvCache.form.l2Backend.backend': 'Backend',
  'kvCache.form.l2Backend.type': 'Type',
  'kvCache.form.l2Backend.customOptions': 'Custom Options',
  'kvCache.form.l2Backend.tips':
    'Spill KV cache to larger secondary storage tiers. Entries are prioritized in order: reads prefer the first; writes go to all.',
  'kvCache.detail.overview': 'Overview',
  'kvCache.detail.perWorker': 'per worker',
  'kvCache.detail.capacity': 'Capacity',
  'kvCache.detail.instances': 'Instances',
  'kvCache.edit.title': 'Edit {name}',
  'kvCache.instances.loadFailed': 'Failed to load instances; retrying',
  'kvCache.instances.empty': 'No instances yet',
  'kvCache.detail.monitoring': 'Monitoring',
  'kvCache.detail.hitRate': 'Hit Rate',
  'kvCache.detail.externalHitRate': 'External Cache Hit Rate',
  'kvCache.detail.usage': 'L1 Cache Usage',
  'kvCache.detail.l2Usage': 'L2 Cache Usage',
  'kvCache.detail.lookupTraffic': 'Lookup Traffic',
  'kvCache.detail.usageRatio': 'L1 Usage Ratio',
  'kvCache.detail.throughput': 'Throughput',
  'kvCache.detail.noMetrics': 'No metrics data',
  'kvCache.detail.metricsUnavailable': 'Metrics are unavailable',
  'kvCache.detail.aggregated': 'Aggregated',
  'kvCache.detail.perInstance': 'Per Instance',
  'kvCache.detail.hitTokens': 'Hit Tokens',
  'kvCache.detail.hitTokens.tips':
    'Tokens served from the shared cache within the selected window, as reported by the inference engine',
  'kvCache.detail.queriedTokens': 'Queried Tokens',
  'kvCache.detail.queriedTokens.tips':
    'Tokens looked up in the shared cache within the selected window, as reported by the inference engine',
  'kvCache.detail.hitRate.engineTips':
    "From the inference engine's own external-cache hit counters, over the selected window. Currently vLLM only; other backends show -",
  'kvCache.detail.view': 'View',
  'kvCache.detail.modelInstances': 'Attached Model Instances'
};
