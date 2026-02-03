export default {
  'resources.title': 'Resources',
  'resources.nodes': 'Workers',
  'resources.worker': 'Worker',
  'resources.button.create': 'Add Worker',
  'resources.button.edit': 'Edit Worker',
  'resources.button.edittags': 'Edit Labels',
  'resources.button.update': 'Update Labels',
  'resources.table.labels': 'Labels',
  'resources.table.hostname': 'Hostname',
  'resources.table.key.tips': 'The same key exists.',
  'resources.form.label': 'Label',
  'resources.form.advanced': 'Advanced',
  'resources.form.enablePartialOffload': 'Allow CPU Offloading',
  'resources.form.placementStrategy': 'Placement Strategy',
  'resources.form.workerSelector': 'Worker Selector',
  'resources.form.enableDistributedInferenceAcrossWorkers':
    'Allow Distributed Inference Across Workers',
  'resources.form.spread.tips':
    'Make the resources of the entire cluster relatively evenly distributed among all workers. It may produce more resource fragmentation on a single worker.',
  'resources.form.binpack.tips':
    'Prioritize the overall utilization of cluster resources, reducing resource fragmentation on GPUs/Workers.',
  'resources.form.workerSelector.description':
    'The system selects the most suitable Worker for deploying model instances based on predefined labels.',
  'resources.table.ip': 'IP',
  'resources.table.cpu': 'CPU',
  'resources.table.memory': 'RAM',
  'resources.table.gpu': 'GPU',
  'resources.table.disk': 'Storage',
  'resources.table.vram': 'VRAM',
  'resources.table.index': 'Index',
  'resources.table.workername': 'Worker Name',
  'resources.table.vendor': 'Vendor',
  'resources.table.temperature': 'Temperature',
  'resources.table.core': 'Cores',
  'resources.table.utilization': 'Utilization',
  'resources.table.gpuutilization': 'GPU Utilization',
  'resources.table.vramutilization': 'VRAM Utilization',
  'resources.table.total': 'Total',
  'resources.table.used': 'Used',
  'resources.table.allocated': 'Allocated',
  'resources.table.wokers': 'workers',
  'resources.worker.linuxormaxos': 'Linux or macOS',
  'resources.table.unified': 'Unified Memory',
  'resources.worker.add.step1':
    'Get Token <span class="note-text">(Run on the server)</span>',
  'resources.worker.add.step2': 'Register Worker',
  'resources.worker.add.step2.tips': '(Run on the worker to be added.)',
  'resources.worker.add.step3':
    'After success, refresh the workers list to view the new worker.',
  'resources.worker.container.supported': 'Do not support macOS or Windows.',
  'resources.worker.current.version': 'Current version is {version}.',
  'resources.worker.driver.install':
    'Install <a href="https://docs.gpustack.ai/latest/installation/installation-requirements/" target="_blank">required drivers and libraries</a> prior to GPUStack installation.',
  'resources.worker.select.command':
    'Select a label to generate the command and copy it using the copy button.',
  'resources.worker.script.install': 'Script Installation',
  'resources.worker.container.install': 'Container Installation(Linux Only)',
  'resources.worker.cann.tips': `Set <span class="bold-text">--device /dev/davinci{index}</span> according to the required NPU index. For example, to mount NPU0 and NPU1, add <span class="bold-text">--device /dev/davinci0 --device /dev/davinci1</span>.`,
  'resources.modelfiles.form.path': 'Storage Path',
  'resources.modelfiles.modelfile': 'Model Files',
  'resources.modelfiles.download': 'Add Model File',
  'resources.modelfiles.size': 'Size',
  'resources.modelfiles.selecttarget': 'Select Target',
  'resources.modelfiles.form.localdir': 'Local Directory',
  'resources.modelfiles.form.localdir.tips':
    'The default storage directory is <span class="desc-block">/var/lib/gpustack/cache</span>, or the directory specified by <span class="desc-block">--cache-dir</span> (preferred) or <span class="desc-block">--data-dir</span>.',
  'resources.modelfiles.retry.download': 'Retry Download',
  'resources.modelfiles.storagePath.holder':
    'Waiting for the download to complete...',
  'resources.filter.worker': 'Filter by worker',
  'resources.filter.source': 'Filter by source',
  'resources.filter.status': 'Filter by status',
  'resources.modelfiles.delete.tips': 'Also delete the file from disk',
  'resources.modelfiles.copy.tips': 'Copy Full Path',
  'resources.filter.path': 'Filter by path',
  'resources.register.worker.step1':
    'Click the <span class="bold-text">Copy Token</span> menu in the application.',
  'resources.register.worker.step2':
    'Click the <span class="bold-text">Quick Config</span> menu in the application.',
  'resources.register.worker.step3':
    'Click the <span class="bold-text">General</span> tab.',
  'resources.register.worker.step4':
    'Select <span class="bold-text">Worker</span> as the service role.',
  'resources.register.worker.step5':
    'Enter the <span class="bold-text">Server URL</span>: {url}.',
  'resources.register.worker.step6':
    'Paste the <span class="bold-text">Token</span>.',
  'resources.register.worker.step7':
    'Click <span class="bold-text">Restart</span> to apply the settings.',
  'resources.register.install.title': 'Install GPUStack on {os}',
  'resources.register.download':
    'Download and install the <a href={url} target="_blank">installer</a>. Only supported: {versions}.',
  'resource.register.maos.support': 'Apple Silicon (M series), macOS 14+',
  'resource.register.windows.support': 'win 10, win 11',
  'resources.model.instance': 'Model Instance',
  'resources.worker.download.privatekey': 'Download Private Key',
  'resources.modelfiles.form.exsting': 'Downloaded',
  'resources.modelfiles.form.added': 'Added',
  'resources.worker.maintenance.title': 'System Maintenance',
  'resources.worker.maintenance.enable': 'Enter Maintenance Mode',
  'resources.worker.maintenance.disable': 'Exit Maintenance Mode',
  'resources.worker.maintenance.remark': 'Remark',
  'resources.worker.maintenance.remark.rules':
    'Please enter maintenance remarks',
  'resources.worker.maintenance.tips':
    'When enter the maintenance mode, the node will stop scheduling new model deployment tasks. Running instances will not be affected.',
  'resources.worker.noCluster.tips':
    'No available clusters. Please create a cluster before adding a node.',
  'resources.metrics.details': 'Metrics Details'
};
