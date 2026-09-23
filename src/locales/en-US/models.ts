export default {
  'models.button.deploy': 'Deploy Model',
  'models.button.exportYaml': 'Export YAML',
  'models.button.importYaml': 'Import YAML',
  'models.form.yamlFile': 'YAML File',
  'models.import.checking': 'Checking…',
  'models.import.hint.nothing': 'Nothing here to import',
  'models.import.pickFile': 'Choose a file',
  'models.import.empty.title': 'Import a YAML file',
  'models.import.empty.description':
    'Pick a file describing one or more deployments. It is checked first, and the diff shows exactly what would be written before anything is.',
  'models.import.cluster.follow': 'Follow the file',
  'models.import.loaded':
    '{count} deployment(s) · identical to what {cluster} runs now',
  'models.import.loaded.hint':
    'This document matches what {cluster} runs now, so there is nothing to write.',
  'models.import.counts':
    '{count} deployment(s) · into {cluster} · {changes} change(s)',
  'models.import.parsed': '{count} deployment(s)',
  'models.import.parsed.invalid': '{count} cannot be imported',
  'models.import.fieldsDoc': 'Field reference',
  'models.import.nav.invalid': 'Cannot import',
  'models.import.scope.all': 'All {count} deployment(s)',
  'models.import.scope.whole': 'Whole document',
  'models.import.scope.wholeShort': 'Whole',
  'models.import.pane.current': 'In the cluster · read-only',
  'models.import.pane.draft': 'To import · editable',
  'models.import.pane.absent': 'No deployment with this name',
  'models.import.pane.none': 'No matching deployments in this cluster',
  'models.import.pane.allNew': 'Every deployment here is new — none replaced',
  'models.import.pane.waiting': 'Nothing to compare yet',
  'models.import.entry': 'Deployment {index}',
  'models.import.entry.invalid': 'Deployment {index} cannot be imported',
  'models.import.summary':
    '{create} to create, {update} to update, {unchanged} unchanged.',
  'models.import.summary.replaces':
    'An update replaces the deployment with the file.',
  'models.import.action.create': 'Create',
  'models.import.action.update': 'Update',
  'models.import.action.unchanged': 'Unchanged',
  'models.import.changes': '{count} change(s)',
  'models.import.blocked':
    '{count} deployment(s) cannot be imported. Fix them to continue.',
  'models.import.overwrite.title': 'Confirm import',
  'models.import.overwrite.confirm':
    'The following {count} existing deployment(s) will be replaced by the file. Settings the file leaves out go back to their defaults.',
  'models.import.overwrite.rest':
    'It will also create {create} and leave {unchanged} unchanged.',
  'models.import.invalid':
    'The file cannot be imported. Fix the problems below and it is checked again.',
  'models.title': 'Models',
  'models.title.edit': 'Edit Model',
  'models.title.duplicate': 'Clone Model',
  'models.table.models': 'models',
  'models.table.name': 'Model Name',
  'models.form.source': 'Source',
  'models.form.repoid': 'Repo ID',
  'models.form.repoid.desc': 'Only .gguf format is supported',
  'models.form.filename': 'File Name',
  'models.form.replicas': 'Replicas',
  'models.form.selector': 'Selector',
  'models.form.env': 'Environment Variables',
  'models.form.configurations': 'Configurations',
  'models.form.s3address': 'S3 Address',
  'models.form.partialoffload.tips': `When CPU offloading is enabled, GPUStack will allocate CPU memory if GPU resources are insufficient. You must correctly configure the inference backend to use hybrid CPU+GPU or full CPU inference.`,
  'models.form.distribution.tips': `Allows for offloading part of the model's layers to single or multiple remote workers when the resources of a worker are insufficient.`,
  'models.openinplayground': 'Open in Playground',
  'models.instances': 'instances',
  'models.table.replicas.edit': 'Edit Replicas',
  'model.form.ollama.model': 'Ollama Model',
  'model.form.ollamaholder': 'Please select or input model name',
  'model.deploy.sort': 'Sort',
  'model.deploy.search.placeholder': 'Type <kbd>/</kbd> to search models',
  'model.form.ollamatips':
    'Tip: The following are the preconfigured Ollama models in GPUStack. Please select the model you want, or directly enter the model you wish to deploy in the 【{name}】 input box on the right.',
  'models.sort.name': 'Name',
  'models.sort.size': 'Size',
  'models.sort.likes': 'Likes',
  'models.sort.trending': 'Trending',
  'models.sort.downloads': 'Downloads',
  'models.sort.updated': 'Updated',
  'models.search.result': '{count} results',
  'models.data.card': 'Model Card',
  'models.available.files': 'Available Files',
  'models.viewin.hf': 'View in Hugging Face',
  'models.viewin.modelscope': 'View in ModelScope',
  'models.architecture': 'Architecture',
  'models.search.noresult': 'No related models found',
  'models.search.nofiles': 'No available files',
  'models.search.networkerror': 'Network connection exception!',
  'models.search.hfvisit': 'Please make sure you can visit',
  'models.search.unsupport':
    'This model is not supported and may be unusable after deployment.',
  'models.form.scheduletype': 'Scheduling Mode',
  'models.form.categories': 'Model Category',
  'models.form.scheduletype.auto': 'Auto',
  'models.form.scheduletype.manual': 'Manual',
  'models.form.scheduletype.gpu': 'Specify GPU',
  'models.form.scheduletype.gpuType': 'Specify GPU Type',
  'models.form.scheduletype.auto.tips':
    'Automatically deploys model instances to appropriate GPUs based on current resource conditions.',
  'models.form.scheduletype.manual.tips':
    'Allows you to manually specify the GPUs to deploy the model instances to.',
  'models.form.gpuallocation': 'GPU Allocation',
  'models.form.gpumode.full': 'Full',
  'models.form.gpumode.slicing': 'Slicing',
  'models.form.gpuType.noSlicedCapacity':
    'No sliceable capacity available on this GPU type, please choose another GPU type.',
  'models.form.gpuType.noPartitionProfile':
    'No partition profile available on this GPU type, please choose another GPU type.',
  'models.form.manual.schedule': 'Manual Schedule',
  'models.table.gpuindex': 'GPU Index',
  'models.table.vgpu': 'vGPU',
  'models.table.vgpu.slice': '{memory}% VRAM / {cores}% Compute',
  'models.table.backend': 'Backends',
  'models.table.acrossworker': 'Distributed Across Workers',
  'models.table.cpuoffload': 'CPU Offload',
  'models.table.layers': 'Layers',
  'models.form.backend': 'Backend',
  'models.form.backend_parameters': 'Backend Parameters',
  'models.instance.params.configured': 'User Configured',
  'models.instance.params.autoInjected': 'Auto-injected Parameters',
  'models.search.gguf.tips':
    'GGUF models use llama-box(supports Linux, macOS and Windows).',
  'models.search.vllm.tips':
    'Non-GGUF models use vox-box for audio and vLLM(x86 Linux only) for others.',
  'models.search.voxbox.tips':
    'To deploy an audio model, uncheck the checkbox.',
  'models.form.ollamalink':
    'Find More in  <a href="https://www.ollama.com/library" target="_blank">Ollama Library</a>.',
  'models.form.backend_parameters.llamabox.placeholder':
    'e.g., --ctx-size=8192 (use = or a space to separate name and value)',
  'models.form.backend_parameters.vllm.placeholder':
    'e.g., --max-model-len=8192 (use = or a space to separate name and value)',
  'models.form.backend_parameters.sglang.placeholder':
    'e.g., --context-length=8192 (use = or a space to separate name and value)',
  'models.form.backend_parameters.vllm.tips':
    'For more details about {backend} parameters, see <a href={link} target="_blank">here</a>.',
  'models.logs.pagination.prev': 'Previous {lines} Lines',
  'models.logs.pagination.next': 'Next {lines} Lines',
  'models.logs.pagination.last': 'Last Page',
  'models.logs.pagination.first': 'First Page',
  'models.logs.pagination.jump': 'Go to Page',
  'models.form.localPath': 'Local Path',
  'models.form.filePath': 'Model Path',
  'models.form.backendVersion': 'Backend Version',
  'models.form.backendVersion.tips':
    'To use the desired version of {backend}{version}, the system will automatically create a virtual environment in the online environment to install the corresponding version. After a GPUStack upgrade, the backend version will remain fixed. {link}',
  'models.form.gpuselector': 'GPU Selector',
  'models.form.backend.llamabox':
    'For GGUF format models, supports Linux, macOS, and Windows.',
  'models.form.backend.vllm':
    'Built-in support for NVIDIA, AMD, Ascend, Hygon, Moore Threads, Iluvatar, MetaX, T-Head PPU devices.',
  'models.form.backend.voxbox': 'Only supports NVIDIA GPUs and CPUs.',
  'models.form.backend.mindie': 'Only supports Ascend NPUs.',
  'models.form.backend.sglang':
    'Built-in support for NVIDIA, AMD, Ascend, Moore Threads, MetaX, T-Head PPU devices.',
  'models.form.search.gguftips':
    'If using macOS or Windows as a worker, check GGUF (uncheck for audio models).',
  'models.form.button.addlabel': 'Add Label',
  'models.filter.category': 'Filter by category',
  'models.list.more.logs': 'View More',
  'models.catalog.release.date': 'Release Date',
  'models.localpath.gguf.tips.title': 'GGUF format model',
  'models.localpat.safe.tips.title': 'Safetensors format model',
  'models.localpath.shared.tips.title': 'Sharded GGUF format model',
  'models.localpath.gguf.tips':
    ' Specify the model file, e.g., /data/models/model.gguf.',
  'models.localpath.safe.tips':
    'Specify the model directory that contains .safetensors and config.json files, e.g., /data/models/model.',
  'models.localpath.chunks.tips': `Specify the first shard file of the model, e.g., /data/models/model-00001-of-00004.gguf.`,
  'models.form.replicas.tips':
    'Multiple replicas enable load balancing for { api } inference requests.',
  'models.table.list.empty': 'No Models yet!',
  'models.table.list.getStart':
    '<span style="margin-right: 5px;font-size: 13px;">Get started with</span> <span style="font-size: 14px;font-weight: 700">DeepSeek-R1-Distill-Qwen-1.5B</span>',
  'models.table.llamaAcrossworker': 'Llama-box Across Workers',
  'models.table.vllmAcrossworker': 'vLLM Across Workers',
  'models.form.releases': 'Releases',
  'models.form.moreparameters': 'Parameter Description',
  'models.table.vram.allocated': 'Allocated VRAM',
  'models.table.vram.workers': '{n} workers',
  'models.instance.workergpu': '{n} workers / {m} GPUs',
  'models.instance.mainworker': 'Main Worker',
  'models.instance.worker': 'Worker',
  'models.instance.workerip': 'Worker IP:Port',
  'models.form.backend.warning':
    'The selected backend does not support GGUF models. Please add a backend with GGUF support in the Inference Backend.',
  'models.form.backend.warning.gguf':
    'Please ensure that the selected custom backend supports GGUF models.',
  'models.form.ollama.warning':
    'Deploy the Ollama model backend using llama-box.',
  'models.form.backend.warning.llamabox':
    'To use the llama-box backend, specify the full path to the model file (e.g.,<span style="font-weight: 700">/data/models/model.gguf</span>). For sharded models, provide the path to the first shard (e.g.,<span style="font-weight: 700">/data/models/model-00001-of-00004.gguf</span>).',
  'models.form.keyvalue.paste':
    'Paste multiple lines of text, with each line containing a key-value pair. The key and value are separated by an = sign, and different key-value pairs are separated by newline characters.',
  'models.form.files': 'files',
  'models.table.status': 'Status',
  'models.form.submit.anyway': 'Submit Anyway',
  'models.form.evaluating': 'Evaluating Model Compatibliity',
  'models.form.incompatible': 'Incompatibility Detected',
  'models.form.nativeAnthropicApi': 'Native Anthropic API',
  'models.form.nativeAnthropicApi.tips':
    'Enable when the inference server implements the Anthropic Messages API itself (e.g. recent vLLM), so requests to /v1/messages reach it as they are. Left off, /v1/messages still works — it is converted to /v1/chat/completions first.',
  'models.form.restart.onerror': 'Auto-Restart On Error',
  'models.form.restart.onerror.tips':
    'When an error occurs, it will automatically attempt to restart.',
  'models.form.check.params': 'Checking configuration...',
  'models.form.check.passed': 'Compatibility Check Passed',
  'models.form.check.claims':
    'The model will consume approximately {vram} VRAM and {ram} RAM.',
  'models.form.check.claims2':
    'The model will consume approximately {vram} VRAM.',
  'models.form.check.claims3':
    'The model will consume approximately {ram} RAM.',
  'models.form.check.claims.group':
    'The group will consume approximately {vram} VRAM and {ram} RAM in total.',
  'models.form.check.claims.role':
    '{role} × {replicas}: approximately {vram} VRAM each',
  'models.form.check.claims.role.total':
    '{role} × {replicas}: approximately {vram} VRAM in total',
  'models.form.check.claims.role.ram':
    '{role} × {replicas}: approximately {ram} RAM in total',
  'models.form.update.tips':
    'Changes will only apply after you delete and recreate the instance.',
  'models.table.download.progress': 'Progress',
  'models.table.button.apiAccessInfo': 'API Access Info',
  'models.table.button.apiAccessInfo.tips': `To integrate this model with third-party applications, use the following details: access URL, model name, and API key. These credentials are required to ensure proper connection and usage of the model service.`,
  'models.table.apiAccessInfo.endpoint': 'Access URL',
  'models.table.apiAccessInfo.modelName': 'Model Name',
  'models.table.apiAccessInfo.apikey': 'API Key',
  'models.table.apiAccessInfo.openaiCompatible': 'OpenAI Compatible',
  'models.table.apiAccessInfo.anthropicCompatible': 'Anthropic Compatible',
  'models.table.apiAccessInfo.jinaCompatible': 'Jina Compatible',
  'models.table.apiAccessInfo.gotoCreate': 'Go to Create',
  'models.search.parts': '{n} parts',
  'models.search.evaluate.error': 'An error occurred during evaluation: ',
  'models.ollama.deprecated.title': 'Deprecation Notice',
  'models.ollama.deprecated.current':
    '<span class="bold-text">Current Version (v0.6.1): </span>Ollama models are currently available for use.',
  'models.ollama.deprecated.upcoming':
    '<span class="bold-text">Upcoming Version (v0.7.0): </span>The Ollama model source will be removed from the UI.',
  'models.ollama.deprecated.following':
    '<span class="bold-text">Following the v0.7.0 update,</span> all previously deployed models will continue to work as expected.',
  'models.ollama.deprecated.issue':
    'See the related issue: <a href="https://github.com/gpustack/gpustack/issues/1979" target="_blank">#1979 on GitHub</a>.',
  'models.ollama.deprecated.notice': `The Ollama model source has been deprecated as of v0.6.1. For more information, see the <a href="https://github.com/gpustack/gpustack/issues/1979" target="_blank">related GitHub issue</a>.`,
  'models.backend.mindie.310p':
    'Ascend 310P only supports FP16, so you need to set --dtype=float16.',
  'models.form.gpuCount': 'GPUs per Replica',
  'models.form.gpuType': 'GPU Type',
  'models.form.optimizeLongPrompt': 'Optimize Long Prompt',
  'models.form.enableSpeculativeDecoding': 'Enable Speculative Decoding',
  'models.form.check.clusterUnavailable': 'Current cluster is unavailable',
  'models.form.check.otherClustersAvailable':
    'Available clusters: {clusters}. Please switch cluster.',
  'models.button.accessSettings': 'Access Settings',
  'models.table.accessScope': 'Access Scope',
  'models.table.accessScope.all': 'All users',
  'models.table.userSelection': 'User Selection',
  'models.button.accessSettings.tips':
    'Changes to access settings take effect after one minute.',
  'models.table.userSelection.tips':
    'Admin users can access all models by default.',
  'models.table.filterByName': 'Filter by username',
  'models.table.admin': 'Admin',
  'models.table.noselected': 'No users selected',
  'models.table.users.all': 'All Users',
  'models.table.users.selected': 'Selected Users',
  'models.table.nouserFound': 'No users found',
  'models.form.performance': 'Performance',
  'models.form.gpus.notfound': 'No GPUs found',
  'models.form.extendedkvcache': 'Enable Extended KV Cache',
  'models.form.chunkSize': 'Size of Cache Chunks',
  'models.form.maxCPUSize': 'Maximum CPU Cache Size (GiB)',
  'models.form.remoteURL': 'Remote Storage URL',
  'models.form.remoteURL.tips':
    'Refer to the <a href="https://docs.lmcache.ai/api_reference/configurations.html" target="_blank">configuration documentation</a> for details.',
  'models.form.runCommandPlaceholder':
    'e.g., vllm serve Qwen/Qwen2.5-1.5B-Instruct',
  'models.accessSettings.public': 'Public',
  'models.accessSettings.authed': 'Authenticated',
  'models.accessSettings.allowedUsers': 'Allowed users',
  'models.accessSettings.public.tips':
    'When set to public, anyone can access this model without authentication, which may lead to data exposure risks.',
  'models.table.button.deploy': 'Deploy Now',
  'models.form.backendVersion.holder': 'Enter or select a version',
  'models.form.gpusperreplica': 'GPUs per Replica',
  'models.form.gpusAllocationType': 'GPU Allocation Type',
  'models.form.gpusAllocationType.auto': 'Auto',
  'models.form.gpusAllocationType.custom': 'Custom',
  'models.form.gpusAllocationType.auto.tips':
    'The system automatically calculates the GPU count per replica, using powers of two by default and capped by the selected GPUs.',
  'models.form.gpusAllocationType.custom.tips':
    'You can specify the exact number of GPUs per replica.',
  'models.mymodels.status.inactive': 'Stopped',
  'models.mymodels.status.degrade': 'Not Ready',
  'models.mymodels.status.active': 'Ready',
  'models.form.kvCache.tips':
    'Extended KV cache and speculative decoding are only available with built-in backends (vLLM / SGLang), Please switch the backend to enable them.',
  'models.form.kvCache.tips2':
    'Only supported when using built-in inference backends (vLLM or SGLang).',
  'models.form.kvCache.backend': 'Cache Backend',
  'models.form.kvCache.local': 'In-Process Cache',
  'models.form.kvCache.service.tips':
    'Only cache services in the same cluster and compatible with the selected backend are listed.',
  'models.form.kvCache.shared.builtinBackends':
    'Cache Service is only supported with the built-in vLLM and SGLang backends.',
  'models.kvCache.degraded.tips':
    'Shared KV cache is not active for this instance',
  'models.kvCache.endpointDead.tips':
    'The shared cache this instance attached to is no longer available; restart the instance to recover',
  'models.kvCache.service': 'Cache Service',
  'models.kvCache.hitRate': 'External Cache Hit Rate ({window})',
  'models.kvCache.hitRate.window': '1h',
  'models.form.scheduling': 'Scheduling',
  'models.form.scaling': 'Scheduled Scaling',
  'models.form.scaling.enable': 'Enable scheduled scaling',
  'models.form.scaling.enable.tips':
    'Scale replicas within recurring time windows (e.g. more by day, fewer at night). Outside every window the model falls back to the configured replica count as its baseline.',
  'models.form.scaling.tz.note':
    'Schedule times use the server-wide timezone (GPUSTACK_TIMEZONE, defaults to the server timezone).',
  'models.form.scaling.rules': 'Rules',
  'models.form.scaling.cron': 'Cron Expression',
  'models.form.scaling.useCron': 'Use CRON expression',
  'models.form.scaling.repeat': 'Repeat',
  'models.form.scaling.repeat.daily': 'Every day',
  'models.form.scaling.repeat.weekdays': 'Weekdays (Mon–Fri)',
  'models.form.scaling.repeat.weekends': 'Weekends (Sat–Sun)',
  'models.form.scaling.repeat.weekly': 'Every week',
  'models.form.scaling.repeat.monthly': 'Every month',
  'models.form.scaling.repeat.cron': 'CRON',
  'models.form.scaling.weekdaysLabel': 'Day(s) of the week',
  'models.form.scaling.monthdaysLabel': 'Day(s) of the month',
  'models.form.scaling.startTime': 'Start time',
  'models.form.scaling.endTime': 'End time',
  'models.form.scaling.crossDay': 'Ends the next day',
  'models.form.scaling.nextDayBadge': '+1 day',
  'models.form.scaling.timezone': 'Timezone',
  'models.form.scaling.tz.all': 'All schedules use {tz} timezone',
  'models.form.scaling.duration': 'Duration',
  'models.form.scaling.durationUnit': 'Unit of time',
  'models.form.scaling.windowReplicas': 'Replicas in window',
  'models.form.scaling.unit.minutes': 'Minutes',
  'models.form.scaling.unit.hours': 'Hours',
  'models.form.scaling.unit.days': 'Days',
  'models.form.scaling.startCron': 'Window Start',
  'models.form.scaling.endCron': 'Window End',
  'models.form.scaling.baseline': 'Baseline Replicas',
  'models.form.scaling.baseline.tips':
    'Replica count used when the current time is outside every window.',
  'models.form.scaling.baselineNote':
    'The Replicas value set above is used as the baseline — the replica count applied whenever the current time is outside every window.',
  'models.form.scaling.cron.invalid': 'Invalid cron expression',
  'models.form.scaling.meaning': 'Summary',
  'models.form.scaling.summary.monthDays': 'Day {days}',
  'models.form.scaling.freq.minute': 'Every minute',
  'models.form.scaling.freq.hour': 'Once an hour',
  'models.form.scaling.freq.day': 'Once a day',
  'models.form.scaling.freq.week': 'Once a week',
  'models.form.scaling.freq.month': 'Once a month',
  'models.form.scaling.freq.year': 'Once a year',
  'models.form.scaling.next': 'Next window:',
  'models.form.scaling.current': 'Current window:',
  'models.form.scaling.addRule': 'Add rule',
  'models.form.scaling.removeRule': 'Remove rule',
  'models.form.scaling.rules.required':
    'Add at least one rule, or turn off scheduled scaling.',
  'models.form.scaling.hint':
    'Each rule opens a window at its start time for the set duration, running its replica count. Outside every window the model uses the baseline replica count above. When windows overlap, the most recently started window takes effect.',
  'models.form.scaling.conflict':
    'Conflict: rules with the same start time ({times}) have different replica counts. Use the same replica count or different start times.',
  'models.form.scaling.overlap':
    'Overlap: windows ({times}) overlap; where they overlap, the later-starting rule takes effect.',
  'models.form.ramRatio': 'RAM-to-VRAM Ratio',
  'models.form.ramSize': 'Maximum RAM Size (GiB)',
  'models.form.ramRatio.tips':
    'Ratio of system RAM to GPU VRAM used for KV cache. For example, 2.0 means the cache in RAM can be twice as large as the GPU VRAM.',
  'models.form.ramSize.tips': `Maximum size of the KV cache stored in system memory (GiB). If set, this value overrides "{content}".`,
  'models.form.chunkSize.tips': 'Number of tokens per KV cache chunk.',
  'models.form.mode': 'Mode',
  'models.form.algorithm': 'Algorithm',
  'models.form.draftModel': 'Draft Model',
  'models.form.numDraftTokens': 'Number of Draft Tokens',
  'models.form.ngramMinMatchLength': 'N-gram Minimum Match Length',
  'models.form.ngramMaxMatchLength': 'N-gram Maximum Match Length',
  'models.form.mode.throughput': 'Throughput',
  'models.form.mode.latency': 'Latency',
  'models.form.mode.baseline': 'Standard',
  'models.form.mode.throughput.tips':
    'Optimized for high throughput under high request concurrency.',
  'models.form.mode.latency.tips':
    'Optimized for low latency under low request concurrency.',
  'models.form.mode.baseline.tips':
    'Runs at full (original) precision and prioritizes compatibility.',
  'models.form.draftModel.placeholder': 'Please select or enter a draft model',
  'models.form.draftModel.tips':
    'You can enter a local path (e.g., /path/to/model) or select a model from Hugging Face or ModelScope (e.g., Tengyunw/qwen3_8b_eagle3). The system will automatically match based on the primary model source.',
  'models.form.quantization': 'Quantization',
  'models.form.backend.custom': 'User-defined',
  'models.form.rules.name':
    'Up to 63 characters; letters, numbers, dots (.), underscores (_), and hyphens (-) only; must start and end with an alphanumeric character.',
  'models.catalog.button.explore': 'Explore More Models',
  'models.catalog.precision': 'Precision',
  'models.form.gpuPerReplica.tips': 'Enter a custom number',
  'models.form.generic_proxy': 'Enable Generic Proxy',
  'models.form.enableModelRoute': 'Enable Model Route',
  'models.form.enableModelRoute.tips': 'Enable Model Route',
  'models.form.generic_proxy.tips':
    'After enabling the generic proxy, you can access URI paths that do not follow the OpenAI API standard.',
  'models.form.generic_proxy.button': 'Generic Proxy',
  'models.accessControlModal.includeusers': 'Include Users',
  'models.table.genericProxy':
    'Use the following path prefix, and set the model name in either the <span class="bold-text">X-GPUStack-Model</span> request header or the model field in the request body. All requests under this path prefix will be forwarded to the inference backend.',
  'models.form.backendVersion.deprecated': 'Deprecated',
  'models.accessSettings.public.desc':
    'Accessible to anyone without authentication.',
  'models.accessSettings.authed.tips':
    'Accessible to all authenticated platform users.',
  'models.accessSettings.allowedUsers.tips':
    'Only designated users can access the model.',
  'models.form.backendVersions.tips': `To use more versions, go to the {link} page and edit the backend to add versions.`,
  'models.catalog.nogpus.tips':
    'No compatible GPUs are available in the selected cluster for this model.',
  'models.form.modelfile.notfound': `The model file path you specified does not exist on the GPUStack server. It's recommended to place the model file at the same path on both the GPUStack server and GPUStack workers. This helps GPUStack make better decisions.`,
  'models.form.readyWorkers': 'workers ready',
  'models.form.maxContextLength': 'Maximum Context Length',
  'models.form.backend.helperText':
    'Not enabled yet. Will be enabled after deployment. ',
  'models.table.instance.benchmark': 'Run Benchmark',
  'models.table.modelView': 'Model List',
  'models.table.instanceView': 'Instance List',
  'models.table.category': 'Category',
  'models.instance.currentRun': 'Current Run',
  'models.instance.previousRun': 'Previous Run',
  'models.instance.startHistory': 'Run History',
  'models.instance.startHistory.tips':
    'Shows logs from the run before the last error-triggered restart.',
  'models.instance.logs.downloading': 'Downloading… {size}',
  'models.instance.logs.downloadingPercent': 'Downloading… {percent}%',
  'models.form.lora.label': 'LoRA Adapters',
  'models.form.lora.add': 'Add LoRA Adapter',
  'models.form.lora.select': 'Select LoRA',
  'models.form.lora.name': 'LoRA name',
  'models.form.lora.rule.empty': 'Input cannot be empty',
  'models.form.lora.rule.duplicate': 'LoRA name cannot be duplicated',
  // Model catalog source configuration
  'models.catalog.source.title': 'Catalog Source',
  'models.catalog.source.official':
    'Follows the catalog GPUStack publishes, on top of the one packaged with this release.',

  // --- Prefill/decode disaggregation ---
  'models.form.pd.section': 'PD Disaggregation',
  'models.form.pd.enable': 'Enable',
  // Why the server derived no transport. Keyed by `PDModeUnresolvedCode`;
  // the server also sends English prose, which is rendered only when this
  // catalog has no entry for the code it sent.
  'models.form.pd.unresolved.vendor_not_in_cluster':
    'This cluster reports no {vendor} accelerator (it has: {vendors}).',
  'models.form.pd.unresolved.vendors_unknown':
    'The cluster’s accelerators are not known yet, so the transport cannot be derived.',
  'models.form.pd.unresolved.no_built_in_recipe':
    'No built-in recipe covers {backend} on {vendors}. Pick the Custom transport to supply the connection parameters yourself.',
  'models.form.pd.unresolved.multiple_vendors':
    'This cluster has more than one accelerator vendor that could host the group ({vendors}), and a PD group cannot span vendors. Pick one.',
  'models.form.pd.unresolved.no_preferred_recipe':
    'Several recipes fit and none is marked preferred.',
  'models.form.pd.unresolved.thisEngine': 'this engine',
  'models.form.pd.enable.off': 'Off',
  'models.form.pd.enable.on': 'PD Disaggregation',
  'models.form.pd.enable.tips':
    'Splits prefill and decode onto separate instances, at the cost of one extra network hop and one KV transfer. Aggregated deployment is usually faster at low concurrency, with short prompts, or with a high prefix cache hit rate. Benchmark the aggregated deployment first.',
  'models.form.pd.shape.mono': 'Aggregated',
  'models.form.pd.shape.mono.tips':
    'One instance runs both prefill and decode.',
  'models.form.pd.shape.pd': 'PD Disaggregation',
  'models.form.pd.shape.pd.tips':
    'Prefill and decode run as separate roles, each with its own engine, parameters and replica count.',
  'models.form.pd.shape.current': 'Current',
  'models.form.pd.mode': 'Transport',
  'models.form.pd.mode.holder': 'Select a transport',
  'models.form.pd.mode.tips':
    'Every connection-state parameter - connector, ports, peer addresses - is derived from the selected mode. None of them is configured by hand.',
  'models.form.pd.mode.custom.tips':
    'Custom mode injects nothing: you must supply --kv-transfer-config, the ports and the peer addresses yourself.',
  'models.form.pd.mode.backend.mismatch':
    'Requires {targets}; the selected engine is {backend}. Mixing engines across roles needs the Custom mode.',
  'models.form.pd.mode.runtime.mismatch':
    'Requires {runtime} accelerators; {scope, select, partition{the chosen partition has} other{this cluster reports}} {vendors}.',
  'models.form.pd.mode.only.custom':
    'No built-in recipe fits this engine and accelerator. Custom is still available: you supply the connector, ports and handshake variables yourself.',
  'models.form.pd.vendor': 'Accelerator vendor',
  'models.form.pd.vendor.tips':
    'This cluster has more than one vendor that could host the group, and a PD group cannot span vendors — the KV transport differs. Pick the partition to deploy onto.',
  'models.form.pd.replicas.moved':
    'Replica counts for a PD deployment are set per role.',
  'models.form.pd.disabled.gguf':
    'PD disaggregation supports the vLLM and SGLang engines only; this model is in GGUF format.',
  'models.form.pd.disabled.backend':
    'PD disaggregation supports the vLLM and SGLang engines only. Other engines can still use it through the Custom mode.',
  'models.form.pd.disabled.schedule':
    'Scheduled scaling is not available for a PD deployment. Scale it through the per-role replica counts.',
  'models.form.pd.cache.cleared':
    'KV cache is configured per role for a PD deployment; the model-level setting has been cleared. Select it for the roles that need it.',
  'models.form.roles': 'Roles',
  'models.form.roles.prefill': 'Prefill',
  'models.form.roles.decode': 'Decode',
  'models.form.roles.router': 'Router',
  'models.form.roles.override': 'Custom',
  'models.form.roles.inherited': 'Inherited',
  'models.form.roles.group.backend': 'Engine and image',
  'models.form.roles.group.parameters': 'Parameters and environment',
  'models.form.roles.group.scheduling': 'Resources and scheduling',
  'models.form.roles.group.backend.tips':
    "Left alone, the role runs the model's own engine and image.",
  'models.form.roles.group.scheduling.tips':
    'Left alone, the scheduler decides which cards this role lands on, using the affinity set above.',
  'models.form.roles.group.cache': 'Shared KV cache',
  'models.form.roles.group.settings': 'Group settings',
  'models.form.roles.group.settings.tips': 'Apply to every role',
  'models.form.roles.replicas': 'Replicas',
  'models.form.roles.router.routeArgs': 'Route arguments',
  'models.form.roles.router.routeArgs.tips':
    'The command line the router process starts with. Locked rows are rendered by GPUStack from where the group landed and cannot be edited.',
  'models.form.roles.router.locality':
    'CPU only; placed automatically, as near this group’s prefill and decode as it fits',
  'models.form.roles.router.workerAllocation': 'Worker allocation',
  'models.form.roles.router.workerSelect': 'Worker',
  'models.form.roles.router.scheduletype.tips':
    'Auto: among the workers the selector allows, prefer one already running this group’s prefill or decode. Manual: name one worker outright.',
  'models.form.roles.router.workerSelector.tips':
    'Narrows the candidates by label. Among those that match, the one nearest this group’s prefill and decode is still preferred.',
  'models.form.roles.router.order.tips':
    'The Router is created after Prefill and Decode are ready.',
  'models.form.roles.router.custom.forced':
    'The Custom PD mode derives no Router. Provide its image and start command.',
  'models.form.roles.router.peers':
    'Prefill and Decode instance addresses are injected by the system after deployment.',
  'models.form.roles.cache.holder': 'Not used',
  'models.form.roles.cache.tips':
    'The connection method and priority order are derived by the system; no configuration needed.',
  'models.form.roles.cache.custom.conflict':
    'The Custom PD mode needs --kv-transfer-config in the engine parameters, so a cache service cannot also be selected.',
  'models.form.roles.cache.param.conflict':
    'Conflicts with the selected PD mode. Switch to the Custom mode, or remove --kv-transfer-config.',
  'models.state.pending': 'Pending',
  'models.state.partial': 'Partially ready',
  'models.state.running': 'Running',
  'models.state.error': 'Error',
  'models.form.speculativeDecoding': 'Speculative Decoding',
  'models.pd.tag': 'PD',
  'models.pd.roles.detail': 'Per-role status',
  'models.pd.degraded.cache':
    'Some members are running without the shared KV cache; open an instance for the reason.',
  'models.pd.degraded.ratio':
    'Fewer members ready than requested; the deployment is serving at reduced capacity.',
  'models.form.roles.override.empty':
    'This group has no values, so it will be saved as inheriting the model-level configuration. Fill in at least one field to keep it custom.',
  'models.form.pd.mode.cleared':
    'The PD mode was cleared when disaggregation was turned off. Please select it again.',
  'models.form.pd.engineVersion.below':
    'The selected PD recipe declares support for engine versions {range}, and this deployment pins {version}. It will still deploy — a self-built image may carry a private version number — but a version genuinely below the floor can be missing behaviour the recipe assumes, such as deregistering a scaled-down member.',
  'models.pd.degraded.pairing':
    'No prefill member shares a host with any decode member, so every KV transfer crosses the network. On a link without RDMA that is usually slower than not disaggregating at all. Co-locate at least one pair, or pick GPUs on the same host for both roles.',
  'models.pd.degraded.gather':
    'Below its topology target: the members are further apart than asked for',
  'models.pd.degraded.scaleOut':
    'The group is pinned to a single topology domain under the strict posture, and a member it was asked to add has not been placed. The members already running keep serving normally — what stopped is the scale-out. The status message on that member says what blocked it; from there, free capacity inside the domain, switch the posture to lenient, or lower the replica count back.',
  'models.pd.degraded.engineVersion':
    'The pinned engine version is below the range the selected PD recipe declares support for. This is allowed — a self-built image may carry a private version number — but the behaviour the recipe assumes may be missing: on SGLang below 0.5.7, for example, a scaled-down member cannot be deregistered and keeps taking traffic.',
  'models.pd.degraded.pairingUnverified':
    'One role declares a pairing factor and the other leaves it to the engine default, so GPUStack could not verify that the two agree — typically --max-model-len, --block-size, --kv-cache-layout, or one side set to auto against a named dtype. It does not mean the pair is wrong, only that nothing checked it. Write the factor on both roles to have it verified.',
  'models.pd.degraded.pairingTP':
    'The effective tensor parallelism — recomputed from the cards the members actually got — breaks the direction this PD recipe declares: NIXL needs decode at least as wide as prefill, Ascend Mooncake needs prefill at least as wide as decode. Admission could not catch this, because a role that pins no cards and writes no --tensor-parallel-size has no number to check until it is placed. Set --tensor-parallel-size on both roles, or give them GPU counts the recipe allows.',
  'models.pd.admission.infeasible':
    'The available capacity cannot hold this group (needs {required}, available {available}). Reduce the replica counts, use a sliced card type, or add nodes.',
  'models.pd.ratio.waiting':
    'Ratio {configured} (currently {current}, waiting for {role})',
  'models.instance.draining.tips':
    'Scaled down. It no longer takes new requests and keeps running until the decodes still fetching its KV cache are done, then it is deleted.',
  'models.pd.group.restarting.brief': 'Restarting…',
  'models.pd.group.restarting.progress':
    'Restarting the group: its members were stopped on purpose and are being rebuilt, {ready}/{total} ready so far. The replica counts read low for that reason, not because the group failed.',
  'models.pd.group.restart.confirm':
    'This change needs the whole PD group restarted: all {total} instances are stopped first and rebuilt with the new configuration, and the model is unavailable in between.',
  'models.pd.instance.stale':
    'This instance is running an older configuration; restart the group to apply the change.',
  'models.pd.stale':
    'Configuration changed; restart the deployment to apply it.',
  'models.restart': 'Restart',
  'models.restart.inflight': 'Restarting…',
  'models.restart.confirm':
    'All instances of {name} are stopped and rebuilt with its current configuration. The model is unavailable in between.',
  'models.restart.done':
    'Restarting: the instances have been retired and will be rebuilt with the current configuration.',
  'models.restart.uptodate':
    'Nothing to restart: this deployment has no instances running.',
  'models.restart.inprogress':
    'A restart is already in progress. Wait for it to finish and try again.',
  'models.restart.failed': 'Failed to restart the model.',
  'models.stale.tag': 'Outdated',
  'models.pd.group.id': 'Group',
  'models.form.pd.disabled.gpus':
    'PD disaggregation needs at least 2 available GPUs (one Prefill, one Decode); the selected cluster has {count}.',
  'models.pd.ratio': 'Ratio',
  'models.form.roles.router.entrypoint': 'Command',
  'models.form.roles.router.connectionArgs': 'Connection arguments',
  'models.form.roles.managed': 'Managed by the system',
  'models.form.roles.managed.tips':
    'Filled in by GPUStack from the PD mode and where the group is scheduled. Read-only, and there is no need to repeat any of it. Values in double braces are placeholders, replaced with the real addresses, ports and NIC at deployment.',
  'models.form.roles.managed.mounts': 'Host mounts',
  'models.form.roles.managed.locked':
    'Locked rows are injected by the system and cannot be edited',
  'models.form.roles.engine': 'Engine',
  'models.form.roles.scheduling.managed':
    'Placed by the scheduler using the affinity set above, with no node constraint of its own',
  'models.form.roles.managed.params.tips':
    "The arguments this role's engine starts with. Locked ones are injected by GPUStack from the PD mode; yours are appended after them.",
  'models.form.roles.managed.env.tips':
    "Environment variables set on this role's container. Locked ones are injected by GPUStack, mostly control-plane addresses and the NIC to use.",
  'models.form.roles.managed.mounts.tips':
    'Host paths bind-mounted into the container. Only GPUStack can add one: these are host files the transport has to read that the accelerator runtime does not bring in by itself.',
  'models.form.roles.resources': 'Resources',
  'models.form.roles.resources.cpu': 'CPU (cores)',
  'models.form.roles.resources.memory': 'Memory (GiB)',
  'models.form.roles.resources.tips':
    'What the router container requests. Defaults to 2 cores and 2 GiB.',
  'models.form.roles.router.health': 'Health check',
  'models.form.roles.router.peerslabel': 'Peers',
  'models.form.roles.router.image.tips':
    'Leave empty to use the image derived from the selected PD mode. Set it only when that image does not contain the router binary — the command is still derived, so naming an image that carries it is the whole change.',
  'models.form.roles.cpuonly': 'CPU only',

  'models.form.gather.title': 'Topology Affinity',
  'models.form.gather.target.auto': 'Automatic',
  'models.form.gather.target.auto.tips': 'The fastest transfer path that fits',
  'models.form.gather.target.host': 'Same worker',
  'models.form.gather.target.host.tips': 'Prefill and Decode on one worker',
  'models.form.gather.target.layer': 'Same {layer}',
  'models.form.gather.target.tips':
    'The transfer quality you want between the members of this group. Transfer inside one accelerator domain beats same-rack, so a domain spanning racks counts as met. The Router holds no accelerator and is not constrained.',
  'models.form.gather.unmet': 'If it does not fit',
  'models.form.gather.unmet.prefer': 'Deploy anyway',
  'models.form.gather.unmet.prefer.tips':
    'Fall back to the next best placement and mark the model as below its topology target',
  'models.form.gather.unmet.must': 'Refuse',
  'models.form.gather.unmet.must.tips':
    'Rather than hand back a slower deployment',
  'models.form.gather.fits': 'fits',
  'models.form.gather.fits.domain': 'fits in {domain}',
  'models.form.gather.short':
    '{domain} is the roomiest and holds {available} of {needed}',
  'models.form.gather.noRoom': 'nothing at this level has room',
  'models.form.gather.unknown':
    'capacity unknown on {count} worker(s), so this cannot be checked',
  'models.form.gather.declare':
    'Fill in racks under the cluster’s “Topology” to unlock coarser levels.',
  'models.form.gather.largeGroup':
    'At this size at least about {percent}% of requests pair on the same host, whatever the topology. That is a floor derived from the replica count — the real share depends on how many machines the group ends up spread over, and is shown in the group summary once deployed. For KV transfer locality, consider several smaller disaggregated groups instead.',

  'models.form.gather.spanning':
    '{role} needs {gpus} GPUs and the widest machine in this cluster has {widest}, so each member takes whole machines: prefill and decode never share one, and on-host pairing is 0. The KV always crosses machines — what matters is which tier above keeps it inside.',

  'models.form.gather.checking': 'Checking what fits…',
  'models.form.gather.unavailable':
    'Could not check what fits right now, so only the default is offered.',
  'models.form.gather.retry': 'Retry',

  'models.form.groupSettings': 'Group Settings',
  'models.form.groupSettings.tips':
    'These cannot differ between roles: one value is applied to Prefill and Decode alike.',

  // Topology-aware gather tiers. One chain, root to leaf: the option list is
  // flat in chain order and the retreat line says what happens when a rung
  // does not fit. The `chain.*` group headings are gone with the second chain.
  'models.form.gather.goFill': 'Fill it in',
  'models.form.gather.infeasible.warning':
    'At current capacity this group cannot be placed; once saved it will wait until room frees up. Options: switch to “as close as possible” (may span hosts, slower KV transfer) · reduce replicas or GPUs per replica'
};
