export default {
  'gpuservice.template': 'GPU Instance Template',
  'gpuservice.template.add': 'Add Instance Template',
  'gpuservice.template.edit': 'Edit Instance Template',
  'gpuservice.template.filter.name': 'Filter by name',
  'gpuservice.template.filter.vendor': 'Filter by vendor',
  'gpuservice.template.image': 'Image',
  'gpuservice.template.imagePullPolicy': 'Image Pull Policy',
  'gpuservice.template.imagePullPolicy.always': 'Always',
  'gpuservice.template.imagePullPolicy.ifNotPresent': 'If Not Present',
  'gpuservice.template.imagePullPolicy.never': 'Never',
  'gpuservice.template.command': 'Container Startup Command',
  'gpuservice.template.command.placeholder':
    'Separate arguments with spaces; wrap arguments containing spaces in quotes, e.g.: /bin/bash -c "echo hello world"',
  'gpuservice.template.mountPath': 'Mount Path',
  'gpuservice.template.mountPath.tips':
    'The default mount path for the storage volume when creating an instance from this template. Useful for persisting data that needs to be retained while the instance is running.',
  'gpuservice.template.containerDisk': 'Container Disk (GB)',
  'gpuservice.template.containerDisk.tips':
    'The size of the container system disk.',
  'gpuservice.template.memory': 'Memory (GB)',
  'gpuservice.instance.containerDisk.remaining':
    'Container Disk (Max {count} GB)',
  'gpuservice.instance.memory.remaining': 'Memory (Max {count} GB)',
  'gpuservice.template.displayName': 'Display Name',
  'gpuservice.template.displayName.max':
    'Display name cannot exceed 63 characters.',
  'gpuservice.template.ports': 'Ports',
  'gpuservice.template.ports.add': 'Add Port',
  'gpuservice.template.ports.invalid':
    'Please complete the port configuration.',
  'gpuservice.template.ports.name': 'Name',
  'gpuservice.template.ports.name.max':
    'Port name cannot exceed 16 characters.',
  'gpuservice.template.ports.name.duplicate': 'Port names must be unique.',
  'gpuservice.template.env': 'Environment Variables',
  'gpuservice.template.env.add': 'Add Environment Variable',
  'gpuservice.template.env.invalid':
    'Please complete the environment variables.',
  'gpuservice.template.env.name': 'Name',
  'gpuservice.template.env.value': 'Value',
  'gpuservice.template.card.image': 'Image',
  'gpuservice.template.card.mount': 'Mount',
  'gpuservice.template.card.resources': 'Resources',
  'gpuservice.template.card.ports': 'Ports',
  'gpuservice.storageType': 'Storage Type',
  'gpuservice.storageType.add': 'Add Storage Type',
  'gpuservice.storageType.edit': 'Edit Storage Type',
  'gpuservice.storageType.filter.name': 'Search by name',
  'gpuservice.storageType.kind': 'Type',
  'gpuservice.storageType.mountOptions': 'Mount Options',
  'gpuservice.storageType.nfs.server': 'NFS Server',
  'gpuservice.storageType.nfs.server.tips':
    'Ensure the NFS server address is reachable from all Kubernetes clusters.',
  'gpuservice.storageType.nfs.share': 'Share Path',
  'gpuservice.storageType.nfs.share.tips':
    'A directory based on the organization and storage names will be automatically created within this share path. If a subdirectory is specified, the generated directory will be created under that subdirectory.',
  'gpuservice.storageType.nfs.subDirectory': 'Sub Directory',
  'gpuservice.storageType.nfs.subDirectory.tips':
    'If empty, a subdirectory named after the persistent volume will be created. If set, a directory with the persistent volume name will be created beneath this subdirectory.',
  'gpuservice.storageType.nfs.mountPermissions': 'Mount Permissions',
  'gpuservice.storageType.nfs.mountPermissions.tips':
    'Inherit the file permissions from the NFS server.',
  'gpuservice.storageType.s3.endpoint': 'Endpoint',
  'gpuservice.storageType.s3.endpoint.tips':
    'Ensure the S3 endpoint is reachable from all Kubernetes clusters.',
  'gpuservice.storageType.s3.endpoint.rule': 'Must start with http or https',
  'gpuservice.storageType.s3.region': 'Region',
  'gpuservice.storageType.s3.bucket': 'Bucket',
  'gpuservice.storageType.s3.bucket.tips':
    'If empty, a new bucket named after the persistent volume will be created. If set, a subdirectory with the persistent volume name will be created inside this bucket.',
  'gpuservice.storageType.s3.bucket.tips1':
    'A prefix based on the organization and storage names will be automatically created within this bucket.',
  'gpuservice.storageType.s3.bucket.tips2':
    'For example, if the organization is named <span class="desc-block">awesome-group</span> and the storage is named <span class="desc-block">storage-1</span>, the resulting prefix will be <span class="desc-block">awesome-group/storage-1</span>.',
  'gpuservice.storageType.s3.accessKey': 'Access Key',
  'gpuservice.storageType.s3.secretKey': 'Secret Key',
  'gpuservice.storageType.s3.insecure': 'Skip TLS/SSL certificate verification',
  'gpuservice.storageType.s3.insecure.tips':
    'When enabled, the S3 server certificate is not validated. Use this for internal testing or self-signed certificates; enable with caution in production.',
  'gpuservice.publicKey': 'SSH Public Key',
  'gpuservice.publicKey.add': 'Add SSH Public Key',
  'gpuservice.publicKey.edit': 'Edit SSH Public Key',
  'gpuservice.publicKey.filter.name': 'Search by name',
  'gpuservice.publicKey.label': 'SSH Public Key',
  'gpuservice.instance.ssh.enable': 'Enable SSH Access',
  'gpuservice.instance.ssh.assignKey': 'Assign SSH Public Key',
  'gpuservice.instance.ssh.addKey': 'Add SSH Public Key',
  'gpuservice.publicKey.placeholder':
    'Begin with ssh-rsa or ssh-ed25519. One Public Key per line.\n\nView Public Key:\n- RSA\ncat ~/.ssh/id_rsa.pub\n- Ed25519\ncat ~/.ssh/id_ed25519.pub',
  'gpuservice.instance': 'GPU Instance',
  'gpuservice.instance.add': 'Add GPU Instance',
  'gpuservice.instance.edit': 'Edit GPU Instance',
  'gpuservice.instance.filter.cluster': 'Filter by cluster',
  'gpuservice.instance.name': 'Instance Name',
  'gpuservice.instance.name.required': 'Please enter the instance name',
  'gpuservice.instance.section.basic': 'Basic Info',
  'gpuservice.instance.section.type': 'Instance Type',
  'gpuservice.instance.section.template': 'Instance Template',
  'gpuservice.instance.types': 'Instance Types',
  'gpuservice.instance.templates': 'Instance Templates',
  'gpuservice.instance.section.storage': 'Storage',
  'gpuservice.instance.type.required': 'Please select an instance type',
  'gpuservice.instance.type.noAvailable': 'No instance type available',
  'gpuservice.instance.gpuCount': 'GPU Count',
  'gpuservice.instance.gpuCount.required': 'Please enter the GPU count',
  'gpuservice.instance.gpuCount.max':
    'Please select at most {count} GPU card(s)',
  'gpuservice.instance.gpuCount.min':
    'Please select at least {count} GPU card(s)',
  'gpuservice.instance.cpuCount.max':
    'Please select at most {count} CPU core(s)',
  'gpuservice.instance.cpuCount.min':
    'Please select at least {count} CPU core(s)',
  'gpuservice.instance.gpuCount.noAvailable':
    'No available GPU resources, please choose another instance type.',
  'gpuservice.instance.gpuCount.zero':
    'CPU-only setup for environment preparation.',
  'gpuservice.instance.stock': 'Stock',
  'gpuservice.instance.sliced': 'Sliced',
  'gpuservice.instance.memory': 'VRAM',
  'gpuservice.instance.ram': 'RAM',
  'gpuservice.instance.os': 'OS',
  'gpuservice.instance.arch': 'Arch',
  'gpuservice.instance.disk': 'Disk',
  'gpuservice.table.count': 'Count',
  'gpuservice.instance.disk.system': 'System Disk',
  'gpuservice.instance.disk.ephemeral': 'Ephemeral Storage',
  'gpuservice.instance.disk.persistent': 'Persistent Storage',
  'gpuservice.instance.search.type.placeholder': 'Search by name',
  'gpuservice.instance.search.template.placeholder':
    'Search by template name, image or mount path',
  'gpuservice.instance.template.image': 'Image',
  'gpuservice.instance.template.mount': 'Mount',
  'gpuservice.instance.connect': 'Connect',
  'gpuservice.instance.connect.copySshCommand': 'Copy SSH Command',
  'gpuservice.instance.event.reason': 'Reason',
  'gpuservice.instance.event.message': 'Message',
  'gpuservice.instance.event.source': 'Source',
  'gpuservice.instance.event.count': 'Count',
  'gpuservice.instance.event.lastSeen': 'Last Seen',
  'gpuservice.instance.event.recentHourTip':
    'Only events from the last hour are shown',
  'gpuservice.instance.event.tab.instance': 'Instance Events',
  'gpuservice.instance.event.tab.volume': 'Volume Events',
  'gpuservice.instance.recreate.confirm.title': 'Confirm recreation',
  'gpuservice.instance.recreate.confirm.content':
    'The current instance will be deleted first, then recreated with the current configuration.\n <span style="font-size: 13px;font-weight: 700">{name}</span>',
  'gpuservice.storage': 'Storage',
  'gpuservice.storage.add': 'Add Storage',
  'gpuservice.storage.edit': 'Edit Storage',
  'gpuservice.storage.filter.cluster': 'Filter by cluster',
  'gpuservice.storage.type': 'Storage Type',
  'gpuservice.storage.type.local': 'Local Storage',
  'gpuservice.storage.type.shared': 'Shared Storage',
  'gpuservice.storage.type.object': 'Object Storage',
  'gpuservice.storage.capacity': 'Capacity',
  'gpuservice.storage.accessMode': 'Access Mode',
  'gpuservice.storage.persistent': 'Persistent',
  'gpuservice.storage.temporary': 'Ephemeral',
  'gpuservice.storage.persistentVolume': 'Persistent',
  'gpuservice.storage.temporary.tips':
    'Data is cleared when the instance stops.',
  'gpuservice.storage.persistentVolume.tips':
    'Data persists across instance restarts. Persistent volumes remain intact after instance termination and can be shared by multiple instances.',
  'gpuservice.storage.persistentVolume.required': 'Please select a storage',
  'gpuservice.storage.persistentVolume.capacity': 'Capacity (GB)',
  'gpuservice.storage.persistentVolume.capacity.required':
    'Please enter capacity',
  'gpuservice.storage.persistentVolume.releaseWithInstance':
    'Release with instance',
  'gpuservice.storage.tempCapacity': 'Capacity (GB)',
  'gpuservice.storage.tempCapacity.required':
    'Please enter the temporary storage capacity',
  'gpuservice.form.rule.name':
    "Lowercase letters, numbers, and '-'. Start and end with a letter or number, no consecutive '-', max 63 characters.",
  'gpuservice.form.storage.select': 'Select Storage'
};
