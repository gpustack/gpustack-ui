export default {
  'kvCache.title': '缓存服务',
  'kvCache.source.manage': '管理 Provider',
  'kvCache.source.builtin':
    '本版本自带的缓存 Provider，以及已安装扩展提供的那些',
  'kvCache.button.add': '添加缓存服务',
  'kvCache.providerSelect.title': '选择提供方',
  'kvCache.provider.source.builtin': '内置',
  'kvCache.provider.source.community': '社区',
  'kvCache.provider.source.partner': 'GPUStack 认证合作伙伴',
  'kvCache.button.viewLogs': '查看日志',
  'kvCache.edit.recreate.tips': '配置将在实例删除重建后生效。',
  'kvCache.table.provider': '提供方',
  'kvCache.table.worker': '节点',
  'kvCache.form.provider': '提供方',
  'kvCache.form.version': '版本',
  'kvCache.form.version.custom': '自定义',
  'kvCache.form.image': '容器镜像',
  'kvCache.check.ok.perNode': '资源满足;将在 {count} 个节点上各部署一个实例。',
  'kvCache.check.ok.singleton': '资源满足;实例将部署在节点 {worker}。',
  'kvCache.check.noWorkers': '没有匹配选择器的节点。',
  'kvCache.check.ok.store':
    '可部署:{replicas} 个 store 副本 × {size} GiB 满足匹配节点的可用内存',
  'kvCache.check.store.insufficientWorkers':
    '匹配节点仅 {count} 个,少于 store 副本数 {replicas}',
  'kvCache.check.store.exceedsFree':
    '仅 {count} 个匹配节点有 {size} GiB 空闲内存,需要 {replicas} 个副本',
  'kvCache.check.unsupportedAccel':
    '{count}/{total} 个目标 Worker 的加速器({backends})不受该版本支持,其上的实例将无法启动',
  'kvCache.check.noCpuImage':
    '{count}/{total} 个目标 worker 没有加速卡，而该版本没有可在无加速卡环境运行的镜像，这些节点上的实例将无法启动',
  'kvCache.form.ramSize.exceedsTotal':
    '超过节点 {worker} 的内存上限({total} GiB)。',
  'kvCache.form.ramSize.exceedsFree':
    '超过节点 {worker} 的当前可用内存(剩余 {free} GiB),缓存服务可能被 OOM 终止。',
  'kvCache.form.workerSelector': '节点标签选择器',
  'kvCache.form.worker.autoTips': '可选;留空时由调度器自动放置实例',
  'kvCache.form.workerSelector.scopeTips':
    '实例只放置在匹配全部标签的节点上，留空则不限制节点。',
  'kvCache.form.workerSelector.tips':
    '在匹配全部标签的每个节点上各运行一个实例;留空则覆盖所有节点。',
  'kvCache.form.managementUrl': '管理地址',
  'kvCache.form.managementUrl.tips':
    '缓存引擎自带管理界面的链接，将显示为服务名称旁的跳转链接',
  'kvCache.form.managementUrl.invalid': '请输入合法的 http(s) 地址',
  'kvCache.button.management': '管理地址',
  'kvCache.form.advanced': '高级配置',
  'kvCache.form.parameters': '参数',
  'kvCache.form.parameters.noComponent':
    '上面的配置把该 Provider 的所有组件都关闭了,没有可传参数的对象。',
  'kvCache.form.env': '环境变量',
  'kvCache.form.env.componentTips': '对服务的所有组件生效',
  'kvCache.form.l2Backend': 'L2 存储后端',
  'kvCache.form.l2Backend.add': '添加后端',
  'kvCache.form.l2Backend.backend': '后端',
  'kvCache.form.l2Backend.type': '类型',
  'kvCache.form.l2Backend.customOptions': '自定义配置',
  'kvCache.form.l2Backend.tips':
    '将 KV 缓存下沉到容量更大的二级存储。条目按顺序生效:读取优先第一个,写入落所有后端。',
  'kvCache.detail.overview': '概览',
  'kvCache.detail.perWorker': '每节点',
  'kvCache.detail.capacity': '容量',
  'kvCache.detail.instances': '实例',
  'kvCache.edit.title': '编辑 {name}',
  'kvCache.instances.loadFailed': '实例加载失败,将自动重试',
  'kvCache.instances.empty': '暂无实例',
  'kvCache.detail.monitoring': '监控',
  'kvCache.detail.hitRate': '命中率',
  'kvCache.detail.externalHitRate': '外部缓存命中率',
  'kvCache.detail.usage': 'L1 缓存用量',
  'kvCache.detail.l2Usage': 'L2 缓存用量',
  'kvCache.detail.lookupTraffic': '查询流量',
  'kvCache.detail.usageRatio': 'L1 使用率',
  'kvCache.detail.throughput': '吞吐',
  'kvCache.detail.noMetrics': '暂无监控数据',
  'kvCache.detail.metricsUnavailable': '监控数据不可用',
  'kvCache.detail.aggregated': '汇总',
  'kvCache.detail.perInstance': '按实例',
  'kvCache.detail.hitTokens': '命中 Token',
  'kvCache.detail.hitTokens.tips':
    '所选时间窗口内命中共享缓存的 token 数(由推理引擎上报)',
  'kvCache.detail.queriedTokens': '查询 Token',
  'kvCache.detail.queriedTokens.tips':
    '所选时间窗口内向共享缓存查询的 token 数(由推理引擎上报)',
  'kvCache.detail.hitRate.engineTips':
    '来自推理引擎自身的外部缓存命中计数(按所选时间窗口统计);暂仅 vLLM 提供该计数,其它后端显示 -',
  'kvCache.detail.view': '视图',
  'kvCache.detail.modelInstances': '关联模型实例'
};
