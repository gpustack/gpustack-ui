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
  'models.form.scheduletype': 'Schedule Type',
  'models.form.categories': 'Model Category',
  'models.form.scheduletype.auto': 'Auto',
  'models.form.scheduletype.manual': 'Manual',
  'models.form.scheduletype.auto.tips':
    'Automatically deploys model instances to appropriate GPUs/Workers based on current resource conditions.',
  'models.form.scheduletype.manual.tips':
    'Allows you to manually specify the GPUs/Workers to deploy the model instances to.',
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
    'e.g., --ctx-size=8192',
  'models.form.backend_parameters.vllm.placeholder':
    'e.g., --max-model-len=8192',
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
    'To use the desired version of {backend}, the system will automatically create a virtual environment in the online environment to install the corresponding version. After a GPUStack upgrade, the backend version will remain fixed. {link}',
  'models.form.gpuselector': 'GPU Selector',
  'models.form.backend.llamabox':
    'For GGUF format models, supports Linux, macOS, and Windows.',
  'models.form.backend.vllm':
    'For non-GGUF format models, supported only on Linux (amd64/x86_64).',
  'models.form.backend.voxbox':
    'For non-GGUF format audio models, supported only on NVIDIA GPUs and CPUs.',
  'models.form.backend.mindie':
    'For non-GGUF format models, supported only on Ascend 910B and 310P.',
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
    'Specify the model directory that contains .safetensors and config.json files, e.g., /data/models/model/.',
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
    'The model requires approximately {vram} VRAM and {ram} RAM.',
  'models.form.check.claims2': 'The model requires approximately {vram} VRAM.',
  'models.form.check.claims3': 'The model requires approximately {ram} RAM.',
  'models.form.update.tips':
    'Changes will only apply after you delete and recreate the instance.',
  'models.table.download.progress': 'Download Progress',
  'models.table.button.apiAccessInfo': 'API Access Info',
  'models.table.button.apiAccessInfo.tips': `To integrate this model with third-party applications, use the following details: access URL, model name, and API key. These credentials are required to ensure proper connection and usage of the model service.`,
  'models.table.apiAccessInfo.enpoint': 'Access URL',
  'models.table.apiAccessInfo.modelName': 'Model Name',
  'models.table.apiAccessInfo.apikey': 'API Key',
  'models.table.apiAccessInfo.openaiCompatible': 'OpenAI Compatible',
  'models.table.apiAccessInfo.jinaCompatible': 'Jina Compatible',
  'models.table.apiAccessInfo.gotoCreate': 'Go to Create'
};
