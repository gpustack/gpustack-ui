export default {
  'models.button.deploy': 'Deploy Model',
  'models.title': 'Models',
  'models.title.edit': 'Edit Model',
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
  'models.form.partialoffload.tips': `When CPU offloading is enabled, if GPU resources are insufficient, part of the model's layers will be offloaded to the CPU. If no GPU is available, full CPU inference will be used.`,
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
  'models.form.manual.schedule': 'Manual Schedule',
  'models.table.gpuindex': 'GPU Index',
  'models.table.backend': 'Backends',
  'models.table.acrossworker': 'Distributed Across Workers',
  'models.table.cpuoffload': 'CPU Offload',
  'models.table.layers': 'Layers',
  'models.form.backend': 'Backend',
  'models.form.backend_parameters': 'Backend Parameters',
  'models.search.gguf.tips':
    'GGUF models use llama-box(supports Linux, macOS and Windows).',
  'models.search.vllm.tips':
    'Non-GGUF models use vox-box for audio and vLLM(x86 Linux only) for others.',
  'models.search.voxbox.tips':
    'To deploy an audio model, uncheck the checkbox.',
  'models.form.ollamalink':
    'Find More in  <a href="https://www.ollama.com/library" target="_blank">Ollama Library</a>.',
  'models.form.backend_parameters.llamabox.placeholder':
    'e.g., --ctx-size=8192 (use = to separate name and value)',
  'models.form.backend_parameters.vllm.placeholder':
    'e.g., --max-model-len=8192 (use = to separate name and value)',
  'models.form.backend_parameters.sglang.placeholder':
    'e.g., --context-length=8192 (use = to separate name and value)',
  'models.form.backend_parameters.vllm.tips':
    'More {backend} parameter details',
  'models.logs.pagination.prev': 'Previous {lines} Lines',
  'models.logs.pagination.next': 'Next {lines} Lines',
  'models.logs.pagination.last': 'Last Page',
  'models.logs.pagination.first': 'First Page',
  'models.form.localPath': 'Local Path',
  'models.form.filePath': 'Model Path',
  'models.form.backendVersion': 'Backend Version',
  'models.form.backendVersion.tips':
    'To use the desired version of {backend}{version}, the system will automatically create a virtual environment in the online environment to install the corresponding version. After a GPUStack upgrade, the backend version will remain fixed. {link}',
  'models.form.gpuselector': 'GPU Selector',
  'models.form.backend.llamabox':
    'For GGUF format models, supports Linux, macOS, and Windows.',
  'models.form.backend.vllm':
    'Built-in support for NVIDIA, AMD, Ascend, Hygon, Iluvatar, and MetaX devices.',
  'models.form.backend.voxbox': 'Only supports NVIDIA GPUs and CPUs.',
  'models.form.backend.mindie': 'Only supports Ascend NPUs.',
  'models.form.backend.sglang':
    'Built-in support for NVIDIA/AMD GPUs and Ascend NPUs.',
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
  'models.form.backend.warning':
    'The backend for GGUF format models uses llama-box.',
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
  'models.form.update.tips':
    'Changes will only apply after you delete and recreate the instance.',
  'models.table.download.progress': 'Progress',
  'models.table.button.apiAccessInfo': 'API Access Info',
  'models.table.button.apiAccessInfo.tips': `To integrate this model with third-party applications, use the following details: access URL, model name, and API key. These credentials are required to ensure proper connection and usage of the model service.`,
  'models.table.apiAccessInfo.endpoint': 'Access URL',
  'models.table.apiAccessInfo.modelName': 'Model Name',
  'models.table.apiAccessInfo.apikey': 'API Key',
  'models.table.apiAccessInfo.openaiCompatible': 'OpenAI Compatible',
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
  'models.table.filterByName': 'Filter by username',
  'models.table.admin': 'Admin',
  'models.table.noselected': 'No users selected',
  'models.table.users.all': 'All Users',
  'models.table.users.selected': 'Selected Users',
  'models.table.nouserFound': 'No users found',
  'models.form.performance': 'Performance',
  'models.form.gpus.notfound': 'No GPUs found',
  'models.form.extendedkvcache': 'Enable Extended KV Cache',
  'models.form.chunkSize': 'Size Of Cache Chunks',
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
    'System calculates GPUs per replica automatically.',
  'models.form.gpusAllocationType.custom.tips':
    'You can specify the exact number of GPUs per replica.',
  'models.mymodels.status.inactive': 'Stopped',
  'models.mymodels.status.degrade': 'Abnormal',
  'models.mymodels.status.active': 'Active',
  'models.form.kvCache.tips':
    'Extended KV cache and speculative decoding are only available with built-in backends (vLLM / SGLang), Please switch the backend in the <span class="bold-text">Advanced</span> settings to enable them.',
  'models.form.kvCache.tips2':
    'Only supported when using built-in inference backends (vLLM or SGLang).',
  'models.form.scheduling': 'Scheduling',
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
  'models.form.generic_proxy.tips':
    'After enabling the generic proxy, you can access URI paths that do not follow the OpenAI API standard.',
  'models.form.generic_proxy.button': 'Generic Proxy',
  'models.accessControlModal.includeusers': 'Include Users',
  'models.table.genericProxy':
    'Refer to the curl example below. The proxy forwards requests with the /model/proxy prefix to the corresponding model. You need to specify the model name either in the <span class="bold-text">X-GPUStack-Model</span> request header or in the "model" property of the JSON body.'
};
