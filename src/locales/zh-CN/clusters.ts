export default {
  'clusters.title': '集群',
  'clusters.table.provider': '提供商',
  'clusters.table.deployments': '部署',
  'clusters.button.add': '添加集群',
  'clusters.button.addCredential': '添加云凭证',
  'clusters.button.editCredential': '编辑云凭证',
  'clusters.filterBy.cluster': '按集群过滤',
  'clusters.add.cluster': '添加 {cluster} 集群',
  'clusters.edit.cluster': '编辑 {cluster}',
  'clusters.provider.custom': '自定义',
  'clusters.button.register': '注册集群',
  'clusters.button.addNodePool': '添加节点池',
  'clusters.button.add.credential': '添加 {provider} 凭证',
  'clusters.credential.title': '云凭证',
  'clusters.credential.token': '访问令牌',
  'clusters.workerpool.region': '区域',
  'clusters.workerpool.zone': '可用区',
  'clusters.workerpool.instanceType': '实例类型',
  'clusters.workerpool.replicas': '副本数',
  'clusters.workerpool.batchSize': '批大小',
  'clusters.workerpool.osImage': '操作系统镜像',
  'clusters.workerpool.volumes': '存储卷',
  'clusters.workerpool.format': '文件系统格式',
  'clusters.workerpool.size': '容量（GiB）',
  'clusters.workerpool.title': '节点池',
  'clusters.workerpool.cloudOptions': '添加云配置',
  'clusters.workerpool.volumes.add': '添加存储卷',
  'clusters.create.provider.self': '自建环境',
  'clusters.create.provider.cloud': '云环境',
  'clusters.create.steps.selectProvider': '选择环境',
  'clusters.create.configBasic': '基本配置',
  'clusters.create.execCommand': '执行命令',
  'clusters.create.supportedGpu': '支持的 GPU',
  'clusters.create.skipfornow': '暂时跳过',
  'clusters.create.noImages': '无可用的镜像',
  'clusters.create.noInstanceTypes': '无可用的实例类型',
  'clusters.create.noRegions': '无可用的区域',
  'clusters.workerpool.batchSize.desc': '节点池中同时创建的节点数量。',
  'clusters.create.addworker.tips':
    '在执行以下命令之前，请确保已满足 {label} 的<a href={link} target="_blank">先决条件</a>。',
  'clusters.create.addCommand.tips':
    '在需要添加的节点上运行以下命令，将其加入到集群中。',
  'clusters.create.register.tips':
    '在需要添加的 Kubernetes 集群上运行以下命令，将其中的节点加入到集群中。',
  'cluster.create.checkEnv.tips': '使用以下命令检查环境是否准备妥当。',
  'cluster.provider.comingsoon': '即将推出',
  'clusters.addworker.nvidiaNotes-01':
    '如果节点有多个出站 IP 地址，请填写 <span class="bold-text">WORKER_IP</span>，以确保使用指定的 IP。可通过命令 <span class="bold-text">hostname -I | xargs -n1</span> 进行确认。',
  'clusters.addworker.nvidiaNotes-02':
    '如果节点上已经存在模型目录，你可以指定该路径进行挂载。',
  'clusters.addworker.hygonNotes': `如果 <span class="bold-text">/opt/hyhal</span> 或 <span class="bold-text">/opt/dtk</span> 不存在，请创建指向对应海光安装路径的符号链接，例如：
  <span class="desc-fill line-6">ln -s /path/to/hyhal /opt/hyhal</span>
  <span class="desc-fill line-6">ln -s /path/to/dtk /opt/dtk</span>`,
  'clusters.addworker.corexNotes':
    '如果 <span class="bold-text">/lib/modules</span> 目录不存在，请创建指向天数智芯安装路径的符号链接：<span class="bold-text">ln -s /path/to/corex /lib/modules</span>。与 <span class="bold-text">/usr/local/corex</span> 目录相同。',
  'clusters.addworker.metaxNotes':
    '如果 <span class="bold-text">/opt/mxdriver</span> 目录不存在，请创建指向沐曦安装路径的符号链接：<span class="bold-text">ln -s /path/to/metax /opt/mxdriver</span>。与 <span class="bold-text">/opt/maca</span> 目录相同。',
  'clusters.addworker.cambriconNotes':
    '如果 <span class="bold-text">/usr/local/neuware</span> 目录不存在，请创建指向寒武纪安装路径的符号链接：<span class="bold-text">ln -s /path/to/neuware /usr/local/neuware</span>。',
  'clusters.addworker.hygonNotes-02':
    '如果未能检测到设备，请尝试移除 <span class="bold-text">--env ROCM_SMI_LIB_PATH=/opt/hyhal/lib</span>。',
  'clusters.addworker.selectCluster': '选择集群',
  'clusters.addworker.selectCluster.tips':
    '<span class="bold-text">非 Docker</span> 集群请前往集群页面注册集群或管理节点池。',
  'clusters.addworker.selectGPU': '选择 GPU 厂商',
  'clusters.addworker.checkEnv': '检查环境',
  'clusters.addworker.specifyArgs': '指定参数',
  'clusters.addworker.runCommand': '运行指令',
  'clusters.addworker.specifyWorkerIP': '节点 IP',
  'clusters.addworker.detectWorkerIP': '自动检测节点 IP',
  'clusters.addworker.specifyWorkerAddress': '节点外部地址',
  'clusters.addworker.detectWorkerAddress': '节点外部地址',
  'clusters.addworker.detectWorkerAddress.tips':
    '如果未指定，则默认为节点 IP。',
  'clusters.addworker.externalIP.tips':
    '如运行在 VPC 或私有网络时，请指定 GPUStack Server 可达的节点外部地址。',
  'clusters.addworker.enterWorkerIP': '输入节点 IP',
  'clusters.addworker.enterWorkerIP.error': '请输入节点 IP',
  'clusters.addworker.enterWorkerAddress': '输入节点外部地址',
  'clusters.addworker.enterWorkerAddress.error': '请输入节点外部地址',
  'clusters.addworker.extraVolume': '额外卷挂载',
  'clusters.addworker.cacheVolume': '缓存卷挂载',
  'clusters.addworker.cacheVolume.tips':
    '如果要自定义模型缓存目录，可以指定路径进行挂载。',
  'clusters.addworker.configSummary': '配置摘要',
  'clusters.addworker.gpuVendor': 'GPU 厂商',
  'clusters.addworker.workerIP': '节点 IP',
  'clusters.addworker.workerExternalIP': '节点外部地址',
  'clusters.addworker.notSpecified': '未指定',
  'clusters.addworker.autoDetect': '自动检测',
  'clusters.addworker.extraVolume.holder':
    '例如：/data/models（路径需以 / 开头）',
  'clusters.addworker.cacheVolume.holder':
    '例如：/data/cache（路径需以 / 开头）',
  'clusters.addworker.vendorNotes.title': '{vendor}设备注意事项',
  'clusters.button.genToken':
    '需要创建令牌？点击<a href="{link}" target="_blank">这里</a>。',
  'clusters.addworker.amdNotes-01':
    '如果 <span class="bold-text">/opt/rocm</span> 目录不存在，请创建一个指向已安装 ROCm 路径的符号链接：<span class="bold-text">ln -s /path/to/rocm /opt/rocm</span>。',
  'clusters.addworker.message.success_single':
    '已将 {count} 个新节点添加到集群中。',
  'clusters.addworker.message.success_multiple':
    '已将 {count} 个新节点添加到集群中。',
  'clusters.create.serverUrl': 'GPUStack 服务地址',
  'clusters.create.workerConfig': '节点配置',
  'clusters.addworker.containerName': '节点容器名称',
  'clusters.addworker.containerName.tips': '为节点容器指定一个名称。',
  'clusters.addworker.dataVolume': 'GPUStack 数据卷',
  'clusters.addworker.dataVolume.tips': '为 GPUStack 指定数据存储路径。',
  'clusters.table.ip.internal': '内',
  'clusters.table.ip.external': '外',
  'clusters.form.serverUrl.tips':
    '如果节点无法直接访问 GPUStack，则指定一个可访问的外部 GPUStack 服务地址。',
  'clusters.form.setDefault': '设为默认',
  'clusters.form.setDefault.tips': '部署时的默认集群。',
  'clusters.addworker.noClusters': '无可用的 Docker 集群',
  'clusters.create.steps.complete.tips': '集群创建成功！',
  'clusters.create.steps.complete': '完成',
  'clusters.create.steps.configure': '配置',
  'clusters.create.dockerTips1': '接下来，为该集群添加节点。',
  'clusters.create.dockerTips2': '你也可以跳过此步骤，稍后在集群列表中添加。',
  'clusters.create.k8sTips1': '接下来，注册已有的 Kubernetes 集群。',
  'clusters.create.k8sTips2': '你也可以跳过此步骤，稍后在集群列表中进行注册。',
  'clusters.addworker.theadNotes':
    '如果 <span class="bold-text">/usr/local/PPU_SDK</span> 目录不存在，请创建一个指向已安装平头哥（T-Head）路径的符号链接：<span class="bold-text">ln -s /path/to/PPU_SDK /usr/local/PPU_SDK</span>。',
  'clusters.addworker.theadNotes-02':
    '平头哥（T-Head）PPU 使用容器设备接口（CDI）进行设备注入，因此需要确保 <span class="bold-text">/var/run/cdi</span> 目录可用以生成 CDI。'
};
