export default {
  'clusters.title': 'Cluster',
  'clusters.table.provider': 'Provider',
  'clusters.table.deployments': 'Deployments',
  'clusters.button.add': 'Add Cluster',
  'clusters.button.addCredential': 'Add Cloud Credential',
  'clusters.button.editCredential': 'Edit Cloud Credential',
  'clusters.filterBy.cluster': 'Filter by Cluster',
  'clusters.add.cluster': 'Add {cluster} Cluster',
  'clusters.edit.cluster': 'Edit {cluster}',
  'clusters.provider.custom': 'Custom',
  'clusters.button.register': 'Register Cluster',
  'clusters.button.addNodePool': 'Add Worker Pool',
  'clusters.button.add.credential': 'Add {provider} Credential',
  'clusters.credential.title': 'Credential',
  'clusters.credential.token': 'Access Token',
  'clusters.workerpool.region': 'Region',
  'clusters.workerpool.zone': 'Zone',
  'clusters.workerpool.instanceType': 'Instance Type',
  'clusters.workerpool.replicas': 'Replicas',
  'clusters.workerpool.batchSize': 'Batch Size',
  'clusters.workerpool.osImage': 'OS Image',
  'clusters.workerpool.volumes': 'Volumes',
  'clusters.workerpool.format': 'Format',
  'clusters.workerpool.size': 'Size (GiB)',
  'clusters.workerpool.title': 'Worker Pools',
  'clusters.workerpool.cloudOptions': 'Add Cloud Options',
  'clusters.workerpool.volumes.add': 'Add Volume',
  'clusters.create.provider.self': 'Self-Hosted',
  'clusters.create.provider.cloud': 'Cloud Provider',
  'clusters.create.selectProvider': 'Select Provider',
  'clusters.create.configBasic': 'Basic Configuration',
  'clusters.create.execCommand': 'Execute Command',
  'clusters.create.supportedGpu': 'Supported GPUs',
  'clusters.create.skipfornow': 'Skip for now',
  'clusters.create.noImages': 'No images available',
  'clusters.create.noInstanceTypes': 'No instance types available',
  'clusters.create.noRegions': 'No regions available',
  'clusters.workerpool.batchSize.desc':
    'Number of workers created simultaneously in the Worker pool',
  'clusters.create.addworker.tips':
    'Please make sure the <a href={link} target="_blank">prerequisites</a> for {label} are met before executing the following command.',
  'clusters.create.addCommand.tips':
    'On the Worker that needs to be added, run the following command to join it to the cluster.',
  'clusters.create.register.tips':
    'On the Kubernetes cluster that needs to be added, run the following command to join its nodes to the cluster.',
  'cluster.create.checkEnv.tips':
    'Use the following command to check if the environment is ready.',
  'cluster.provider.comingsoon': 'Coming soon',
  'clusters.addworker.nvidiaNotes-01':
    'If multiple outbound IPs exist, specify the one you want the worker to use. Please double-check with <span class="bold-text">hostname -I | xargs -n1</span>.',
  'clusters.addworker.nvidiaNotes-02':
    'If a model directory already exists on the worker, you can specify the path to mount it.',
  'clusters.addworker.hygonNotes': `If the <span class="bold-text">/opt/hyhal</span> directory does not exist, create a symbolic link to the Hygon installation path.  
Same applies to the <span class="bold-text">/opt/dtk</span> directory.`,
  'clusters.addworker.corexNotes': `If the <span class="bold-text">/lib/modules</span> directory does not exist, create a symbolic link to the Iluvatar installation path:  
<span class="bold-text">ln -s /path/to/corex /lib/modules</span>. Same applies to the <span class="bold-text">/usr/local/corex</span> directory.`,
  'clusters.addworker.metaxNotes': `If the <span class="bold-text">/opt/mxdriver</span> directory does not exist, create a symbolic link to the MetaX installation path:  
<span class="bold-text">ln -s /path/to/metax /opt/mxdriver</span>. Same applies to the <span class="bold-text">/opt/maca</span> directory.`,
  'clusters.addworker.cambriconNotes': `If the <span class="bold-text">/usr/local/neuware</span> directory does not exist, create a symbolic link to the Cambricon installation path:  
<span class="bold-text">ln -s /path/to/neuware /usr/local/neuware</span>.`,
  'clusters.addworker.hygonNotes-02':
    'If device detection fails, try removing <span class="bold-text">--env ROCM_SMI_LIB_PATH=/opt/hyhal/lib</span>.',
  'clusters.addworker.selectCluster': 'Select Cluster',
  'clusters.addworker.selectCluster.tips':
    'For non-Docker clusters, please register clusters or manage worker pools from the Clusters page.',
  'clusters.addworker.selectGPU': 'Select GPU Vendor',
  'clusters.addworker.checkEnv': 'Check Environment',
  'clusters.addworker.specifyArgs': 'Specify Arguments',
  'clusters.addworker.runCommand': 'Run Command',
  'clusters.addworker.specifyWorkerIP': 'Specify Worker IP',
  'clusters.addworker.detectWorkerIP': 'Auto-detect Worker IP',
  'clusters.addworker.enterWorkerIP': 'Enter worker IP',
  'clusters.addworker.enterWorkerIP.error': 'Please enter the worker IP.',
  'clusters.addworker.extraVolume': 'Additional Volume Mount',
  'clusters.addworker.configSummary': 'Configuration Summary',
  'clusters.addworker.gpuVendor': 'GPU Vendor',
  'clusters.addworker.workerIP': 'Worker IP',
  'clusters.addworker.notSpecified': 'Not Specified',
  'clusters.addworker.autoDetect': 'Auto-detect',
  'clusters.addworker.extraVolume.holder':
    'e.g. /data/models (path must start with /)',
  'clusters.addworker.vendorNotes.title': 'Notes for {vendor} Device'
};
