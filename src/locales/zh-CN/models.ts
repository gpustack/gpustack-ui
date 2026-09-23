export default {
  'models.button.deploy': '部署模型',
  'models.button.exportYaml': '导出 YAML',
  'models.button.importYaml': '导入 YAML',
  'models.form.yamlFile': 'YAML 文件',
  'models.import.checking': '正在校验…',
  'models.import.hint.nothing': '当前内容里没有可导入的部署',
  'models.import.pickFile': '选择文件',
  'models.import.empty.title': '导入 YAML 文件',
  'models.import.empty.description':
    '选择一个描述部署的文件。导入前会先比对，差异会完整列出，确认后才会写入。',
  'models.import.cluster.follow': '跟随文件',
  'models.import.loaded': '{count} 个部署 · 与 {cluster} 集群现状一致',
  'models.import.loaded.hint':
    '这份文档与 {cluster} 集群的现状一致，没有要写入的内容。',
  'models.import.counts':
    '{count} 个部署 · 导入到 {cluster} · {changes} 项变更',
  'models.import.parsed': '{count} 个部署',
  'models.import.parsed.invalid': '{count} 个无法导入',
  'models.import.fieldsDoc': '字段说明',
  'models.import.nav.invalid': '无法导入',
  'models.import.scope.all': '全部 {count} 个部署',
  'models.import.scope.whole': '整篇文档',
  'models.import.scope.wholeShort': '整篇',
  'models.import.pane.current': '集群现状 · 只读',
  'models.import.pane.draft': '待导入内容 · 可编辑',
  'models.import.pane.absent': '集群里没有同名部署',
  'models.import.pane.none': '集群里没有匹配的部署',
  'models.import.pane.allNew': '这些全是新增部署，不会替换任何现有部署',
  'models.import.pane.waiting': '尚无可对比的内容',
  'models.import.entry': '第 {index} 个部署',
  'models.import.entry.invalid': '第 {index} 个部署无法导入',
  'models.import.summary':
    '将新建 {create} 个，更新 {update} 个，{unchanged} 个无变化。',
  'models.import.summary.replaces': '更新会按文件内容整体替换。',
  'models.import.action.create': '新建',
  'models.import.action.update': '更新',
  'models.import.action.unchanged': '无变化',
  'models.import.changes': '{count} 项变更',
  'models.import.blocked': '{count} 个部署无法导入，修正后才能提交。',
  'models.import.overwrite.title': '确认导入',
  'models.import.overwrite.confirm':
    '以下 {count} 个已有部署将被文件内容整体替换，文件里没写的设置会恢复默认值。',
  'models.import.overwrite.rest':
    '另将新建 {create} 个部署，{unchanged} 个无变化。',
  'models.import.invalid': '文件无法导入。请修正以下问题，系统会重新校验。',
  'models.title': '模型',
  'models.title.edit': '编辑模型',
  'models.title.duplicate': '克隆模型',
  'models.table.models': '模型',
  'models.table.name': '模型名称',
  'models.form.source': '来源',
  'models.form.repoid': '仓库 ID',
  'models.form.repoid.desc': '只支持 .gguf 格式',
  'models.form.filename': '文件名',
  'models.form.replicas': '副本数',
  'models.form.selector': '选择器',
  'models.form.env': '环境变量',
  'models.form.configurations': '配置',
  'models.form.s3address': 'S3 地址',
  'models.form.partialoffload.tips':
    '启用 CPU 卸载后，GPU 不足时 GPUStack 会自动使用 CPU 内存。请确保推理后端已正确配置为混合 CPU+GPU 或纯 CPU 推理。',
  'models.form.distribution.tips':
    '允许在单个节点资源不足时，将部分计算卸载到一个或多个远程节点。',
  'models.openinplayground': '在 Playground 中打开',
  'models.instances': '实例',
  'models.table.replicas.edit': '调整副本数',
  'model.form.ollama.model': 'Ollama 模型',
  'model.form.ollamaholder': '请选择或输入模型名称',
  'model.deploy.sort': '排序',
  'model.deploy.search.placeholder': '按 <kbd>/</kbd> 开始搜索模型',
  'model.form.ollamatips':
    '提示：以下为 GPUStack 预设的 Ollama 模型，请选择你想要的模型或者直接在右侧表单 【{name}】 输入框中输入你要部署的模型。',
  'models.sort.name': '名称',
  'models.sort.size': '大小',
  'models.sort.likes': '点赞量',
  'models.sort.trending': '趋势',
  'models.sort.downloads': '下载量',
  'models.sort.updated': '更新时间',
  'models.search.result': '{count} 个结果',
  'models.data.card': '模型简介',
  'models.available.files': '可用文件',
  'models.viewin.hf': '在 Hugging Face 中查看',
  'models.viewin.modelscope': '在 ModelScope 中查看',
  'models.architecture': '架构',
  'models.search.noresult': '未找到相关模型',
  'models.search.nofiles': '无可用文件',
  'models.search.networkerror': '网络连接异常!',
  'models.search.hfvisit': '请确保您可以访问',
  'models.search.unsupport': '暂不支持该模型，部署后可能无法使用',
  'models.form.categories': '模型类别',
  'models.form.scheduletype': '调度方式',
  'models.form.scheduletype.auto': '自动',
  'models.form.scheduletype.manual': '手动',
  'models.form.scheduletype.gpu': '指定 GPU',
  'models.form.scheduletype.gpuType': '指定 GPU 类型',
  'models.form.scheduletype.auto.tips':
    '自动根据当前资源情况部署模型实例到合适的 GPU 上。',
  'models.form.scheduletype.manual.tips': '可指定模型实例部署的 GPU。',
  'models.form.gpuallocation': 'GPU 分配',
  'models.form.gpumode.full': '整卡',
  'models.form.gpumode.slicing': '切分',
  'models.form.gpuType.noSlicedCapacity':
    '该 GPU 类型没有可切分的容量，请选择其他 GPU 类型。',
  'models.form.gpuType.noPartitionProfile':
    '该 GPU 类型没有可用的切分规格，请选择其他 GPU 类型。',
  'models.form.manual.schedule': '手动调度',
  'models.table.gpuindex': 'GPU 序号',
  'models.table.vgpu': 'vGPU',
  'models.table.vgpu.slice': '{memory}% 显存 / {cores}% 算力',
  'models.table.backend': '后端',
  'models.table.acrossworker': '跨节点推理',
  'models.table.cpuoffload': 'CPU 卸载',
  'models.table.layers': '层',
  'models.form.backend': '后端',
  'models.form.backend_parameters': '后端参数',
  'models.instance.params.configured': '用户配置',
  'models.instance.params.autoInjected': '自动注入参数',
  'models.search.gguf.tips':
    'GGUF 模型用 llama-box（支持 Linux, macOS 和 Windows）。',
  'models.search.vllm.tips':
    ' 非 GGUF 的语音模型用 vox-box，其它非 GGUF 的模型用 vLLM（仅支持 x86 Linux）。',
  'models.search.voxbox.tips': '若需部署语音模型取消勾选。',
  'models.form.ollamalink':
    '在 <a href="https://www.ollama.com/library" target="_blank">Ollama Library</a> 中查找',
  'models.form.backend_parameters.llamabox.placeholder':
    '例如，--ctx-size=8192（参数名和值用 = 号或空格分隔）',
  'models.form.backend_parameters.vllm.placeholder':
    '例如，--max-model-len=8192（参数名和值用 = 号或空格分隔）',
  'models.form.backend_parameters.sglang.placeholder':
    '例如，--context-length=8192（参数名和值用 = 号或空格分隔）',
  'models.form.backend_parameters.vllm.tips':
    '更多 {backend} 参数说明查看<a href={link} target="_blank">这里</a>。',
  'models.logs.pagination.prev': '上一 {lines} 行',
  'models.logs.pagination.next': '下一 {lines} 行',
  'models.logs.pagination.last': '最后一页',
  'models.logs.pagination.first': '第一页',
  'models.logs.pagination.jump': '跳转到指定页',
  'models.form.localPath': '本地路径',
  'models.form.filePath': '模型路径',
  'models.form.backendVersion': '后端版本',
  'models.form.backendVersion.tips':
    '固定以使用期望的 {backend} 版本 {version}，在线环境会自动创建虚拟环境安装对应版本的 {backend}。在 GPUStack 升级后也将保持固定的后端版本。{link}',
  'models.form.gpuselector': 'GPU 选择器',
  'models.form.backend.llamabox':
    '用于 GGUF 格式模型，支持 Linux, macOS 和 Windows。',
  'models.form.backend.vllm':
    '内置支持 NVIDIA、AMD、昇腾、海光、摩尔线程、天数智芯、沐曦和平头哥 PPU 设备。',
  'models.form.backend.voxbox': '仅支持 NVIDIA GPU 和 CPU。',
  'models.form.backend.mindie': '仅支持昇腾 NPU。',
  'models.form.backend.sglang':
    '内置支持 NVIDIA、AMD、昇腾、摩尔线程、沐曦和平头哥 PPU 设备。',
  'models.form.search.gguftips':
    '当 macOS 或 Windows 作节点时勾选 GGUF（搜索语音模型时取消勾选）',
  'models.form.button.addlabel': '添加标签',
  'models.filter.category': '按类别过滤',
  'models.list.more.logs': '查看更多',
  'models.catalog.release.date': '发布日期',
  'models.localpath.gguf.tips.title': 'GGUF 格式模型',
  'models.localpat.safe.tips.title': 'safetensors 格式模型',
  'models.localpath.shared.tips.title': '分片的 GGUF 格式模型',
  'models.localpath.gguf.tips': '指向模型文件，例如 /data/models/model.gguf。',
  'models.localpath.safe.tips':
    '指向包含 .safetensors, config.json 文件的模型目录，例如 /data/models/model。',
  'models.localpath.chunks.tips':
    '指向模型第一个分片文件，例如 /data/models/model-00001-of-00004.gguf。',
  'models.form.replicas.tips': '多副本数实现 { api } 接口推理请求的负载均衡。',
  'models.table.list.empty': '暂无已部署模型',
  'models.table.list.getStart':
    '<span style="margin-right: 5px;font-size: 13px;">一键部署</span><span style="font-size: 14px;font-weight: 700">DeepSeek-R1-Distill-Qwen-1.5B</span><span style="margin-left: 5px;font-size: 13px;">立即使用！</span>',
  'models.table.llamaAcrossworker': 'Llama-box 跨节点',
  'models.table.vllmAcrossworker': 'vLLM 跨节点',
  'models.form.releases': '版本',
  'models.form.moreparameters': '参数说明',
  'models.table.vram.allocated': '分配显存',
  'models.table.vram.workers': '{n} 节点',
  'models.instance.workergpu': '{n} 节点 / {m} 卡',
  'models.instance.mainworker': '主节点（Main）',
  'models.instance.worker': '运行节点',
  'models.instance.workerip': '节点 IP:端口',
  'models.form.backend.warning':
    '当前后端不支持 GGUF 格式模型。请在“推理后端”中添加一个支持 GGUF 的后端。',
  'models.form.backend.warning.gguf':
    '请确认当前使用的自定义后端已支持 GGUF 格式模型。',
  'models.form.ollama.warning': '部署 Ollama 模型后端使用 llama-box。',
  'models.form.backend.warning.llamabox':
    '要使用 llama-box 后端，请指定模型文件的完整路径（例如：<span style="font-weight: 700">/data/models/model.gguf</span>）。对于分片模型，请提供第一个分片的路径（例如：<span style="font-weight: 700">/data/models/model-00001-of-00004.gguf</span>）。',
  'models.form.keyvalue.paste':
    '粘贴多行文本，每行包含一个键值对，键和值之间用 = 号分隔，不同的键值对之间用换行符分隔。',
  'models.form.files': '个文件',
  'models.table.status': '状态',
  'models.form.submit.anyway': '仍然提交',
  'models.form.evaluating': '评估模型兼容性中...',
  'models.form.incompatible': '检测到不兼容',
  'models.form.nativeAnthropicApi': '原生 Anthropic API',
  'models.form.nativeAnthropicApi.tips':
    '当推理服务自身实现了 Anthropic Messages API（如较新版本的 vLLM）时开启，/v1/messages 请求将被原样转发。保持关闭时 /v1/messages 仍然可用，但会先转换为 /v1/chat/completions。',
  'models.form.restart.onerror': '错误时重启',
  'models.form.restart.onerror.tips': '当发生错误时，将自动尝试恢复。',
  'models.form.check.params': '正在校验配置...',
  'models.form.check.passed': '兼容性检查通过',
  'models.form.check.claims': '该模型大约需要消耗 {vram} 显存和 {ram} 内存。',
  'models.form.check.claims2': '该模型大约需要消耗 {vram} 显存。',
  'models.form.check.claims3': '该模型大约需要消耗 {ram} 内存。',
  'models.form.check.claims.group':
    '该部署组大约需要消耗 {vram} 显存和 {ram} 内存。',
  'models.form.check.claims.role': '{role} × {replicas}：每副本约 {vram} 显存',
  'models.form.check.claims.role.total':
    '{role} × {replicas}：合计约 {vram} 显存',
  'models.form.check.claims.role.ram': '{role} × {replicas}：合计约 {ram} 内存',
  'models.form.update.tips': '更改仅在删除并重新创建实例后生效。',
  'models.table.download.progress': '进度',
  'models.table.button.apiAccessInfo': 'API 接入信息',
  'models.table.button.apiAccessInfo.tips': `当您需要将本模型与第三方应用集成时，请使用以下信息：接入地址、模型名称和 API 密钥。这些信息是确保外部系统能正确连接并调用模型服务的关键凭证。`,
  'models.table.apiAccessInfo.endpoint': '接入地址',
  'models.table.apiAccessInfo.modelName': '模型名称',
  'models.table.apiAccessInfo.apikey': 'API 密钥',
  'models.table.apiAccessInfo.openaiCompatible': 'OpenAI 兼容',
  'models.table.apiAccessInfo.anthropicCompatible': 'Anthropic 兼容',
  'models.table.apiAccessInfo.jinaCompatible': 'Jina 兼容',
  'models.table.apiAccessInfo.gotoCreate': '去创建',
  'models.search.parts': '{n} 个文件',
  'models.search.evaluate.error': '评估过程中发生了错误：',
  'models.ollama.deprecated.title': '弃用通知',
  'models.ollama.deprecated.current':
    '<span class="bold-text">当前版本（v0.6.1）：</span>Ollama 模型目前仍可使用。',
  'models.ollama.deprecated.upcoming':
    '<span class="bold-text">即将发布的版本（v0.7.0）：</span>Ollama 模型源将在 UI 中被移除。',
  'models.ollama.deprecated.following':
    '<span class="bold-text">在 v0.7.0 更新后：</span> 所有先前部署的模型仍将正常运行。',
  'models.ollama.deprecated.issue':
    '参见 GitHub 上的问题 <a href="https://github.com/gpustack/gpustack/issues/1979" target="_blank">#1979</a>。',
  'models.ollama.deprecated.notice': `Ollama 模型来源自 v0.6.1 起已被弃用。更多信息请参见相关的 <a href="https://github.com/gpustack/gpustack/issues/1979" target="_blank">GitHub 问题</a>。`,
  'models.backend.mindie.310p':
    'Ascend 310P 仅支持 FP16，需要设置 --dtype=float16。',
  'models.form.gpuCount': '每副本 GPU 数量',
  'models.form.gpuType': 'GPU 类型',
  'models.form.optimizeLongPrompt': '优化长提示',
  'models.form.enableSpeculativeDecoding': '启用推测解码',
  'models.form.check.clusterUnavailable': '当前集群不可用',
  'models.form.check.otherClustersAvailable':
    '可用的集群有: {clusters}。请切换集群。',
  'models.button.accessSettings': '访问设置',
  'models.table.accessScope': '访问范围',
  'models.table.accessScope.all': '所有用户',
  'models.table.userSelection': '用户选择',
  'models.button.accessSettings.tips': '访问设置的更改将在一分钟后生效。',
  'models.table.userSelection.tips': '管理员用户默认可以访问所有模型。',
  'models.table.filterByName': '按用户名筛选',
  'models.table.admin': '管理员',
  'models.table.noselected': '未选择用户',
  'models.table.users.all': '所有用户',
  'models.table.users.selected': '已选用户',
  'models.table.nouserFound': '未找到用户',
  'models.form.performance': '性能',
  'models.form.gpus.notfound': '未找到 GPU',
  'models.form.extendedkvcache': '启用扩展 KV 缓存',
  'models.form.chunkSize': '缓存分块大小',
  'models.form.maxCPUSize': 'CPU 缓存最大占用 (GiB)',
  'models.form.remoteURL': '远程存储地址',
  'models.form.remoteURL.tips':
    '参考 <a href="https://docs.lmcache.ai/api_reference/configurations.html" target="_blank">配置文档</a> 配置。',
  'models.form.runCommandPlaceholder':
    '例如，vllm serve Qwen/Qwen2.5-1.5B-Instruct',
  'models.accessSettings.public': '公开',
  'models.accessSettings.authed': '认证用户',
  'models.accessSettings.allowedUsers': '指定用户',
  'models.accessSettings.public.tips':
    '公开后，任何人无需认证即可访问，可能存在数据泄露风险。',
  'models.table.button.deploy': '立即部署',
  'models.form.backendVersion.holder': '输入或选择一个版本',
  'models.form.gpusperreplica': '每副本 GPU 数量',
  'models.form.gpusAllocationType': 'GPU 分配方式',
  'models.form.gpusAllocationType.auto': '自动',
  'models.form.gpusAllocationType.custom': '自定义',
  'models.form.gpusAllocationType.auto.tips':
    '系统自动计算每个副本的 GPU 数量，默认是 2 的幂，不超过选择的 GPU 数量。',
  'models.form.gpusAllocationType.custom.tips':
    '您可以指定每个副本的 GPU 数量。',
  'models.mymodels.status.inactive': '已停止',
  'models.mymodels.status.degrade': '未就绪',
  'models.mymodels.status.active': '可用',
  'models.form.kvCache.tips':
    '扩展 KV 缓存和推测解码仅在内置后端（vLLM / SGLang）可用，请切换后端以启用。',
  'models.form.kvCache.tips2': '仅在使用内置推理后端（vLLM 或 SGLang）时支持。',
  'models.form.kvCache.backend': '缓存后端',
  'models.form.kvCache.local': '进程内缓存',
  'models.form.kvCache.service.tips':
    '仅列出与部署位于同一集群且与所选后端兼容的缓存服务。',
  'models.form.kvCache.shared.builtinBackends':
    '缓存服务仅支持内置 vLLM 与 SGLang 后端。',
  'models.kvCache.degraded.tips': '该实例的共享缓存未生效',
  'models.kvCache.endpointDead.tips':
    '该实例启动时接入的共享缓存当前不可用，重启实例以恢复',
  'models.kvCache.service': '缓存服务',
  'models.kvCache.hitRate': '外部缓存命中率（{window}）',
  'models.kvCache.hitRate.window': '1 小时',
  'models.form.scheduling': '调度',
  'models.form.scaling': '定时伸缩',
  'models.form.scaling.enable': '启用定时伸缩',
  'models.form.scaling.enable.tips':
    '在周期性时间窗口内调整副本数（例如白天多、夜间少）。不在任何窗口内时，模型回落到所配置的副本数作为基线。',
  'models.form.scaling.tz.note':
    '调度时间使用服务器统一时区（GPUSTACK_TIMEZONE，默认取服务器时区）。',
  'models.form.scaling.rules': '规则',
  'models.form.scaling.cron': 'Cron 表达式',
  'models.form.scaling.useCron': '使用 CRON 表达式',
  'models.form.scaling.repeat': '重复周期',
  'models.form.scaling.repeat.daily': '每天',
  'models.form.scaling.repeat.weekdays': '工作日（周一至周五）',
  'models.form.scaling.repeat.weekends': '周末（周六、周日）',
  'models.form.scaling.repeat.weekly': '每周',
  'models.form.scaling.repeat.monthly': '每月',
  'models.form.scaling.repeat.cron': 'CRON',
  'models.form.scaling.weekdaysLabel': '星期',
  'models.form.scaling.monthdaysLabel': '日期',
  'models.form.scaling.startTime': '开始时间',
  'models.form.scaling.endTime': '结束时间',
  'models.form.scaling.crossDay': '次日结束',
  'models.form.scaling.nextDayBadge': '+1 天',
  'models.form.scaling.timezone': '时区',
  'models.form.scaling.tz.all': '所有调度均使用 {tz} 时区',
  'models.form.scaling.duration': '时长',
  'models.form.scaling.durationUnit': '时间单位',
  'models.form.scaling.windowReplicas': '窗口内副本数',
  'models.form.scaling.unit.minutes': '分钟',
  'models.form.scaling.unit.hours': '小时',
  'models.form.scaling.unit.days': '天',
  'models.form.scaling.startCron': '窗口开始',
  'models.form.scaling.endCron': '窗口结束',
  'models.form.scaling.baseline': '基线副本数',
  'models.form.scaling.baseline.tips': '当前时间不在任何窗口内时使用的副本数。',
  'models.form.scaling.baselineNote':
    '上方填写的 Replicas 将作为基线副本数（Baseline）——当前时间不在任何时段窗口内时使用该副本数。',
  'models.form.scaling.cron.invalid': '无效的 cron 表达式',
  'models.form.scaling.meaning': '摘要',
  'models.form.scaling.summary.monthDays': '{days} 号',
  'models.form.scaling.freq.minute': '每分钟',
  'models.form.scaling.freq.hour': '每小时一次',
  'models.form.scaling.freq.day': '每天一次',
  'models.form.scaling.freq.week': '每周一次',
  'models.form.scaling.freq.month': '每月一次',
  'models.form.scaling.freq.year': '每年一次',
  'models.form.scaling.next': '下一个窗口：',
  'models.form.scaling.current': '当前窗口：',
  'models.form.scaling.addRule': '添加规则',
  'models.form.scaling.removeRule': '删除规则',
  'models.form.scaling.rules.required': '请至少添加一条规则，或关闭定时伸缩。',
  'models.form.scaling.hint':
    '每条规则在开始时间开启一个窗口，持续设定的时长，期间维持其副本数；不在任何窗口内时，模型使用上方的基线副本数。窗口重叠时，以最近开始的窗口为准。',
  'models.form.scaling.conflict':
    '冲突：开始时间相同（{times}）的规则副本数不同。请改用相同的副本数，或使用不同的开始时间。',
  'models.form.scaling.overlap':
    '重叠：时间窗（{times}）有重叠；重叠处以最近开始的规则为准。',
  'models.form.ramRatio': '内存与显存比例',
  'models.form.ramSize': '内存最大占用 (GiB)',
  'models.form.ramRatio.tips':
    'KV 缓存在系统内存与 GPU 显存之间的比例。例如设置为 2.0 表示系统内存中可缓存的数据量是显存的两倍。',
  'models.form.ramSize.tips': `KV 缓存在系统内存中的最大值。当设置该值时，将覆盖 "{content}" 的配置。`,
  'models.form.chunkSize.tips':
    '每个 KV 缓存块包含的 token 数量。数值越大可提升吞吐量，但也会增加内存占用。',
  'models.form.mode': '模式',
  'models.form.algorithm': '算法',
  'models.form.draftModel': '草稿模型',
  'models.form.numDraftTokens': '草稿生成 Token 数',
  'models.form.ngramMinMatchLength': 'N-gram 最小匹配长度',
  'models.form.ngramMaxMatchLength': 'N-gram 最大匹配长度',
  'models.form.mode.throughput': '吞吐',
  'models.form.mode.latency': '延迟',
  'models.form.mode.baseline': '标准',
  'models.form.mode.throughput.tips': '在高并发请求下优化吞吐性能。',
  'models.form.mode.latency.tips': '在低并发请求下优化响应延迟。',
  'models.form.mode.baseline.tips':
    '以完整（原始）精度运行，并优先保证兼容性。',
  'models.form.draftModel.placeholder': '请选择或输入草稿模型',
  'models.form.draftModel.tips':
    '可填写本地路径（如 /path/to/model），或从 Hugging Face、ModelScope 选择模型（如 Tengyunw/qwen3_8b_eagle3）。系统将根据主模型来源自动匹配。',
  'models.form.quantization': '量化',
  'models.form.backend.custom': '用户定义',
  'models.form.rules.name':
    '长度不超过 63 个字符，只能包含字母、数字、点（.）、下划线（_）和连字符（-），且必须以字母或数字开头和结尾。',
  'models.catalog.button.explore': '浏览更多模型',
  'models.catalog.precision': '精度',
  'models.form.gpuPerReplica.tips': '输入自定义数值',
  'models.form.generic_proxy': '启用通用代理',
  'models.form.enableModelRoute': '启用模型路由',
  'models.form.enableModelRoute.tips': '启用模型路由',
  'models.form.generic_proxy.tips':
    '启用通用代理后可支持访问非 OpenAI-API 标准的 URI 路径。',
  'models.form.generic_proxy.button': '通用代理',
  'models.accessControlModal.includeusers': '显示用户',
  'models.table.genericProxy':
    '使用以下路径前缀，并在请求头 <span class="bold-text">X-GPUStack-Model</span> 或请求体中的 model 字段设置模型名称后访问该模型。该路径的所有子路径请求会被转发到推理后端。',
  'models.form.backendVersion.deprecated': '已弃用',
  'models.accessSettings.public.desc': '任何人无需认证即可访问。',
  'models.accessSettings.authed.tips': '平台内所有已认证用户可访问。',
  'models.accessSettings.allowedUsers.tips': '仅允许选定的特定用户访问。',
  'models.form.backendVersions.tips': `如需使用更多版本，请前往{link}页面并编辑对应的后端以添加版本。`,
  'models.catalog.nogpus.tips': '所选集群中没有兼容该模型的 GPU。',
  'models.form.modelfile.notfound':
    '你指定的模型文件路径在 GPUStack Server 节点上不存在。建议在 GPUStack Server 节点和 GPUStack 节点上使用相同的模型文件路径，这有助于 GPUStack 做出更优的调度与决策。',
  'models.form.readyWorkers': '节点就绪',
  'models.form.maxContextLength': '最大上下文长度',
  'models.form.backend.helperText': '该社区后端暂未启用，部署后将自动启用',
  'models.table.instance.benchmark': '运行基准测试',
  'models.table.modelView': '模型列表',
  'models.table.instanceView': '实例列表',
  'models.table.category': '类别',
  'models.instance.currentRun': '当前运行',
  'models.instance.previousRun': '上一次运行',
  'models.instance.startHistory': '运行记录',
  'models.instance.startHistory.tips':
    '显示上一次因错误自动重启之前的那次运行的日志。',
  'models.instance.logs.downloading': '正在下载… {size}',
  'models.instance.logs.downloadingPercent': '正在下载… {percent}%',
  'models.form.lora.label': 'LoRA 适配器',
  'models.form.lora.add': '添加 LoRA 适配器',
  'models.form.lora.select': '选择 LoRA',
  'models.form.lora.name': 'LoRA 名称',
  'models.form.lora.rule.empty': '输入不能为空',
  'models.form.lora.rule.duplicate': 'LoRA name 不能重复',
  // Model catalog source configuration
  'models.catalog.source.title': '模型库来源',
  'models.catalog.source.official':
    '在随本版本打包的内置模型库之上，跟随 GPUStack 发布的官方模型库。',

  // --- Prefill/decode disaggregation ---
  'models.form.pd.section': 'PD 分离配置',
  'models.form.pd.enable': '启用',
  // Why the server derived no transport. Keyed by `PDModeUnresolvedCode`;
  // the server also sends English prose, which is rendered only when this
  // catalog has no entry for the code it sent.
  'models.form.pd.unresolved.vendor_not_in_cluster':
    '集群里没有 {vendor} 加速卡（现有：{vendors}）。',
  'models.form.pd.unresolved.vendors_unknown':
    '还没读到集群的加速卡信息，暂时无法推导传输方案。',
  'models.form.pd.unresolved.no_built_in_recipe':
    '没有内置方案覆盖 {backend} × {vendors}。可改用「自定义」传输方案，自行提供连接参数。',
  'models.form.pd.unresolved.multiple_vendors':
    '集群里有多种加速卡都能承载这一组（{vendors}），而 PD 组不能跨厂商。请指定一种。',
  'models.form.pd.unresolved.no_preferred_recipe':
    '有多个方案都适用，但没有一个被标为首选。',
  'models.form.pd.unresolved.thisEngine': '该引擎',
  'models.form.pd.enable.off': '不开启',
  'models.form.pd.enable.on': 'PD 分离',
  'models.form.pd.enable.tips':
    '将预填充（Prefill）与解码（Decode）拆分到不同实例，代价是多一跳网络与一次 KV 传输。并发低、prompt 短或前缀命中率很高时，聚合部署通常更快。建议先跑一轮基准再决定。',
  'models.form.pd.shape.mono': '聚合部署',
  'models.form.pd.shape.mono.tips': '同一个实例同时负责 Prefill 与 Decode。',
  'models.form.pd.shape.pd': 'PD 分离',
  'models.form.pd.shape.pd.tips':
    'Prefill 与 Decode 拆成独立角色，各自的引擎、参数与副本数都可单独设置。',
  'models.form.pd.shape.current': '当前',
  'models.form.pd.mode': '传输方案',
  'models.form.pd.mode.holder': '请选择传输方案',
  'models.form.pd.mode.tips':
    '连接态参数（connector、端口、对端地址）全部由所选模式推导，无需手工配置。',
  'models.form.pd.mode.custom.tips':
    '自定义模式下系统不注入任何连接参数，需自行提供 --kv-transfer-config、端口与对端地址。',
  'models.form.pd.mode.backend.mismatch':
    '需要 {targets}，当前引擎是 {backend}。跨角色混用引擎请选「自定义」模式。',
  'models.form.pd.mode.runtime.mismatch':
    '需要 {runtime} 加速卡，{scope, select, partition{所选分区} other{当前集群}}只有 {vendors}。',
  'models.form.pd.mode.only.custom':
    '当前引擎与加速卡组合没有内置配方。仍可用「自定义」模式：连接器、端口与握手变量由你自己填写。',
  'models.form.pd.vendor': '加速卡厂商',
  'models.form.pd.vendor.tips':
    '当前集群有多个厂商的加速卡可以承载这个组，而 PD 组不能跨厂商 —— KV 传输通道不同。请选择部署到哪个分区。',
  'models.form.pd.replicas.moved': 'PD 部署的副本数由各角色分别设置。',
  'models.form.pd.disabled.gguf':
    'PD 分离仅支持 vLLM / SGLang 引擎，当前模型为 GGUF 格式。',
  'models.form.pd.disabled.backend':
    'PD 分离仅支持 vLLM / SGLang 引擎。其他引擎可通过「自定义」模式使用。',
  'models.form.pd.disabled.schedule':
    'PD 部署暂不支持定时扩缩，请通过各角色的副本数调整。',
  'models.form.pd.cache.cleared':
    'PD 部署下 KV 缓存按角色配置，模型级设置已清空 —— 请在角色配置中为需要的角色单独选择。',
  'models.form.roles': '角色配置',
  'models.form.roles.prefill': 'Prefill',
  'models.form.roles.decode': 'Decode',
  'models.form.roles.router': 'Router',
  'models.form.roles.override': '自定义',
  'models.form.roles.inherited': '继承',
  'models.form.roles.group.backend': '引擎与镜像',
  'models.form.roles.group.parameters': '引擎参数与环境变量',
  'models.form.roles.group.scheduling': '资源与调度',
  'models.form.roles.group.backend.tips': '不改就跟随模型的引擎与镜像。',
  'models.form.roles.group.scheduling.tips':
    '不改就由调度器按上面的拓扑亲和性决定落在哪些卡上。',
  'models.form.roles.group.cache': '共享 KV 缓存',
  'models.form.roles.group.settings': '组级设置',
  'models.form.roles.group.settings.tips': '对所有角色生效',
  'models.form.roles.replicas': '副本数',
  'models.form.roles.router.routeArgs': '路由参数',
  'models.form.roles.router.routeArgs.tips':
    'Router 进程启动时的命令行参数。带锁的由 GPUStack 按组的落点渲染，不可编辑。',
  'models.form.roles.router.locality':
    '仅 CPU，由系统就近 Prefill / Decode 自动选择 Worker',
  'models.form.roles.router.workerAllocation': 'Worker 分配',
  'models.form.roles.router.workerSelect': 'Worker 选择器',
  'models.form.roles.router.scheduletype.tips':
    '自动：在满足节点选择器的机器里，优先选已经跑着本组 Prefill / Decode 的那台。手动：直接指定一台 Worker。',
  'models.form.roles.router.workerSelector.tips':
    '按标签缩小候选范围。仍会在匹配到的机器里优先选离本组 Prefill / Decode 最近的。',
  'models.form.roles.router.order.tips':
    'Router 在 Prefill 与 Decode 就绪后才创建。',
  'models.form.roles.router.custom.forced':
    '自定义 PD 模式下系统不推导 Router，请提供镜像与启动命令。',
  'models.form.roles.router.peers':
    '部署后由系统注入 Prefill / Decode 实例地址。',
  'models.form.roles.cache.holder': '不使用',
  'models.form.roles.cache.tips': '连接方式与优先级顺序由系统推导，无需配置。',
  'models.form.roles.cache.custom.conflict':
    '自定义 PD 模式下需在引擎参数中自行提供 --kv-transfer-config，不能同时选择缓存服务。',
  'models.form.roles.cache.param.conflict':
    '与所选 PD 模式冲突。改用「自定义」PD 模式，或删除该参数。',
  'models.state.pending': '等待中',
  'models.state.partial': '部分就绪',
  'models.state.running': '运行中',
  'models.state.error': '异常',
  'models.form.speculativeDecoding': '推测解码',
  'models.pd.tag': 'PD',
  'models.pd.roles.detail': '各角色状态',
  'models.pd.degraded.cache': '部分成员未挂载共享 KV 缓存，展开实例可见原因。',
  'models.pd.degraded.ratio': '就绪成员少于请求数量，当前以降低的容量服务。',
  'models.form.roles.override.empty':
    '该组当前没有任何值，将按「继承模型级配置」保存。至少填写一项才能保持为自定义。',
  'models.form.pd.mode.cleared': '关闭 PD 分离时已清空 PD 模式，请重新选择。',
  'models.form.pd.engineVersion.below':
    '所选 PD 方案声明支持的引擎版本为 {range}，而当前固定的版本是 {version}。仍然可以部署 —— 自建镜像可能带有私有版本号 —— 但版本若确实低于下限，方案所依赖的行为可能并不存在，例如缩容成员的注销。',
  'models.pd.degraded.pairing':
    '没有任何 prefill 与 decode 成员在同一台机器上，因此每次 KV 传输都要走网络。在没有 RDMA 的链路上，这通常比不做分离更慢。请至少让一对同机，或为两个角色选择同一台机器上的 GPU。',
  'models.pd.degraded.gather': '未达拓扑目标：成员实际分布比要求的更松',
  'models.pd.degraded.scaleOut':
    '本组在严格模式下被限制在同一个拓扑域内，要新增的成员尚未被放置。已有成员仍在正常服务，停下来的是扩容。该成员的状态信息会说明是什么挡住了它；据此可在域内腾出空位、把拓扑约束改为宽松，或把副本数调回原值。',
  'models.pd.degraded.engineVersion':
    '当前固定的引擎版本低于所选 PD 方案声明支持的版本范围。这是允许的 —— 自建镜像可能带有私有版本号 —— 但方案所依赖的行为可能并不存在：例如 SGLang 低于 0.5.7 时，缩容下线的成员无法注销，仍会继续接收流量。',
  'models.pd.degraded.pairingUnverified':
    '配对参数只有一侧显式声明，另一侧沿用引擎默认值，GPUStack 无法判定两者是否一致 —— 常见于 --max-model-len、--block-size、--kv-cache-layout，以及一侧写 auto、另一侧写具体 dtype。这不代表配对是错的，只代表没有任何检查验证过它。在两个角色上都写明该参数即可被校验。',
  'models.pd.degraded.pairingTP':
    '按成员实际拿到的卡重新算出的有效张量并行度，违反了该 PD 方案声明的方向：NIXL 要求 decode 不窄于 prefill，昇腾 Mooncake 要求 prefill 不窄于 decode。准入阶段查不出来 —— 一个既不固定卡、也不写 --tensor-parallel-size 的角色，在落位之前根本没有数可查。请在两个角色上都设置 --tensor-parallel-size，或给它们符合方案要求的卡数。',
  'models.pd.admission.infeasible':
    '当前可用算力放不下这一组（需要 {required}，可用 {available}）。可减少副本数、换用切分卡型，或增加节点。',
  'models.pd.ratio.waiting': '配比 {configured}（当前 {current}，等待 {role}）',
  'models.instance.draining.tips':
    '已缩容。不再接收新请求，等还在拉取它 KV 缓存的 decode 完成后删除。',
  'models.pd.group.restarting.brief': '重启中…',
  'models.pd.group.restarting.progress':
    '组级重启中：成员是被主动停止后重建的，目前 {ready}/{total} 已就绪。副本数偏低是因为这个，而不是因为组出了故障。',
  'models.pd.group.restart.confirm':
    '此修改需要重启整个 PD 组：将先停止全部 {total} 个实例，再以新配置重建，期间该模型不可用。',
  'models.pd.instance.stale': '该实例使用旧版配置，重启整组后生效。',
  'models.pd.stale': '配置已变更，需重启部署生效。',
  'models.restart': '重启',
  'models.restart.inflight': '重启中…',
  'models.restart.confirm':
    '将停止 {name} 的全部实例，并以当前配置重建，期间该模型不可用。',
  'models.restart.done': '正在重启：实例已停止，将以当前配置重建。',
  'models.restart.uptodate': '没有可重启的实例：该部署当前没有实例在运行。',
  'models.restart.inprogress': '重启进行中，请等待完成后重试。',
  'models.restart.failed': '重启模型失败。',
  'models.stale.tag': '待重启',
  'models.pd.group.id': '组',
  'models.form.pd.disabled.gpus':
    'PD 分离至少需要 2 张可用 GPU（1 Prefill + 1 Decode），当前集群可用 {count} 张。',
  'models.pd.ratio': '配比',
  'models.form.roles.router.entrypoint': '执行命令',
  'models.form.roles.router.connectionArgs': '连接参数',
  'models.form.roles.managed': '系统托管',
  'models.form.roles.managed.tips':
    '由 GPUStack 按 PD 模式和调度结果自动填入，不可修改，也无需重复填写。双花括号包起来的是占位符，在部署时替换为实际的地址、端口和网卡。',
  'models.form.roles.managed.mounts': '宿主机挂载',
  'models.form.roles.managed.locked': '带锁为系统注入，不可编辑',
  'models.form.roles.engine': '引擎',
  'models.form.roles.scheduling.managed':
    '由系统按拓扑亲和性自动调度，不附加节点约束',
  'models.form.roles.managed.params.tips':
    '这个角色启动时传给引擎的参数。带锁的由 GPUStack 按 PD 模式注入，你自己加的追加在后面。',
  'models.form.roles.managed.env.tips':
    '这个角色容器里的环境变量。带锁的由 GPUStack 注入，多为控制面地址与网卡。',
  'models.form.roles.managed.mounts.tips':
    '从宿主机挂进容器的路径。只能由 GPUStack 添加：传输方案需要读的宿主机文件，加速器运行时不会自动带进来。',
  'models.form.roles.resources': '资源',
  'models.form.roles.resources.cpu': 'CPU（核）',
  'models.form.roles.resources.memory': '内存（GiB）',
  'models.form.roles.resources.tips':
    'Router 容器申请的资源，默认为 2 核 2 GiB。',
  'models.form.roles.router.health': '健康检查',
  'models.form.roles.router.peerslabel': '对端',
  'models.form.roles.router.image.tips':
    '留空则使用所选 PD 模式推导出的镜像。仅当该镜像不含 router 可执行文件时才需要填写——此时只需换镜像，启动命令仍由系统推导。',
  'models.form.roles.cpuonly': '仅使用 CPU',

  'models.form.gather.title': '拓扑亲和性',
  'models.form.gather.target.auto': '自动',
  'models.form.gather.target.auto.tips': '选传输最快的可行位置',
  'models.form.gather.target.host': '同 Worker',
  'models.form.gather.target.host.tips': 'Prefill / Decode 在同一个 Worker',
  'models.form.gather.target.layer': '同{layer}',
  'models.form.gather.target.tips':
    '希望这组成员之间的传输链路不低于哪一档。同一加速器域的传输快于同机柜，因此跨机柜的域也算满足。Router 不占卡，不参与此约束。',
  'models.form.gather.unmet': '放不下时',
  'models.form.gather.unmet.prefer': '仍然部署',
  'models.form.gather.unmet.prefer.tips':
    '退到次优位置，并在模型上标记「未达拓扑目标」',
  'models.form.gather.unmet.must': '拒绝部署',
  'models.form.gather.unmet.must.tips': '不给出一个更慢的部署',
  'models.form.gather.fits': '放得下',
  'models.form.gather.fits.domain': '{domain} 放得下',
  'models.form.gather.short':
    '最大的 {domain} 只能放 {available}，需要 {needed}',
  'models.form.gather.noRoom': '这一档没有任何域放得下',
  'models.form.gather.unknown': '{count} 台 worker 容量读不到，这一档无法判断',
  'models.form.gather.declare': '在集群「拓扑」里填机柜后，可以选更粗的档次。',
  'models.form.gather.largeGroup':
    '这个规模下至少约 {percent}% 的请求会落在同一台机上，与拓扑和上面的选择都无关。这是按副本数算的下界 —— 真实比例取决于这个组最终摊在几台机器上，部署后可在组摘要里看到。若追求 KV 传输局部性，考虑部署多个较小的分离组。',

  'models.form.gather.spanning':
    '{role} 需要 {gpus} 张卡，而这个集群最宽的机器有 {widest} 张 —— 每个成员会占满整台机器，P 与 D 不会共享机器，同机配对为 0。KV 必然跨机，此时要看的是上面的拓扑档次把它限制在哪一层。',

  'models.form.gather.checking': '正在检查放得下哪一档…',
  'models.form.gather.unavailable':
    '暂时查不到放得下哪一档，所以只给出默认项。',
  'models.form.gather.retry': '重试',

  'models.form.groupSettings': '组级设置',
  'models.form.groupSettings.tips':
    '这些无法按角色区分：同一个值会同时作用于 Prefill 和 Decode。',

  // Topology-aware gather tiers. One chain, root to leaf: the option list is
  // flat in chain order and the retreat line says what happens when a rung
  // does not fit. The `chain.*` group headings are gone with the second chain.
  'models.form.gather.goFill': '去填',
  'models.form.gather.infeasible.warning':
    '按当前容量此组将无法部署；保存后组会一直等待，直到有空位。可选：改成「尽量靠近」（会跨机，KV 传输变慢）· 降低副本或每副本卡数'
};
