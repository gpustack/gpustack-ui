export default {
  'clusters.title': 'Кластеры',
  'clusters.table.provider': 'Провайдер',
  'clusters.table.deployments': 'Развертывания',
  'clusters.button.add': 'Добавить кластер',
  'clusters.button.addCredential': 'Добавить облачный аккаунт',
  'clusters.button.editCredential': 'Редактировать облачный аккаунт',
  'clusters.filterBy.cluster': 'Фильтровать по кластеру',
  'clusters.add.cluster': 'Добавить кластер {cluster}',
  'clusters.edit.cluster': 'Редактировать {cluster}',
  'clusters.provider.custom': 'Пользовательский',
  'clusters.button.register': 'Зарегистрировать кластер',
  'clusters.button.addNodePool': 'Добавить пул воркеров',
  'clusters.button.add.credential': 'Добавить аккаунт {provider}',
  'clusters.credential.title': 'Учетные данные',
  'clusters.credential.token': 'Токен доступа',
  'clusters.workerpool.region': 'Регион',
  'clusters.workerpool.zone': 'Зона',
  'clusters.workerpool.instanceType': 'Тип инстанса',
  'clusters.workerpool.replicas': 'Реплики',
  'clusters.workerpool.batchSize': 'Размер партии',
  'clusters.workerpool.osImage': 'Образ ОС',
  'clusters.workerpool.volumes': 'Тома',
  'clusters.workerpool.format': 'Формат',
  'clusters.workerpool.size': 'Размер (ГиБ)',
  'clusters.workerpool.title': 'Пулы воркеров',
  'clusters.workerpool.cloudOptions': 'Добавить облачные опции',
  'clusters.workerpool.volumes.add': 'Добавить том',
  'clusters.create.provider.self': 'Самостоятельное размещение',
  'clusters.create.provider.cloud': 'Облачный провайдер',
  'clusters.create.steps.selectProvider': 'Выберите провайдера',
  'clusters.create.configBasic': 'Базовая конфигурация',
  'clusters.create.execCommand': 'Выполнить команду',
  'clusters.create.supportedGpu': 'Поддерживаемые GPU',
  'clusters.create.skipfornow': 'Пропустить сейчас',
  'clusters.create.noImages': 'Нет доступных образов',
  'clusters.create.noInstanceTypes': 'Нет доступных типов инстансов',
  'clusters.create.noRegions': 'Нет доступных регионов',
  'clusters.workerpool.batchSize.desc':
    'Количество воркеров, создаваемых одновременно в пуле воркеров',
  'clusters.create.addworker.tips':
    'Пожалуйста, убедитесь, что выполнены <a href={link} target="_blank">предварительные условия</a> перед выполнением следующей команды.',
  'clusters.create.addCommand.tips':
    'На воркере, который необходимо добавить, выполните следующую команду, чтобы присоединить его к кластеру.',
  'clusters.create.addCommand.k8s.tips':
    'На Kubernetes-кластере, который необходимо зарегистрировать, выполните следующую команду, чтобы создать ресурсы Kubernetes и зарегистрировать этот кластер.',
  'clusters.create.addCommand.k8s.version.warning':
    'Минимальная поддерживаемая версия Kubernetes — 1.23. Для использования функции GPU Service минимальная поддерживаемая версия Kubernetes — 1.27.',
  'cluster.create.checkEnv.tips':
    'Используйте следующую команду для проверки готовности окружения',
  'clusters.create.register.tips':
    'На Kubernetes кластере, который необходимо добавить, выполните следующую команду, чтобы присоединить его узлы к кластеру.',
  'cluster.provider.comingsoon': 'Скоро будет',
  'clusters.addworker.nvidiaNotes-01':
    'Если существует несколько исходящих IP-адресов, укажите тот, который должен использовать воркер. Пожалуйста, перепроверьте с помощью <span class="bold-text">hostname -I | xargs -n1</span>.',
  'clusters.addworker.nvidiaNotes-02':
    'Если директория с моделями уже существует на воркере, вы можете указать путь для её монтирования.',
  'clusters.addworker.hygonNotes': `If <span class="bold-text">/opt/hyhal</span> or <span class="bold-text">/opt/dtk</span> does not exist, create symbolic links pointing to the corresponding Hygon installation paths, for example: 
  <span class="desc-fill">ln -s /path/to/hyhal /opt/hyhal</span> 
  <span class="desc-fill">ln -s /path/to/dtk /opt/dtk</span>.`,
  'clusters.addworker.corexNotes':
    'Если директория <span class="bold-text">/usr/local/corex</span> не существует, создайте символическую ссылку на путь установки Iluvatar SDK: <span class="bold-text">ln -s /path/to/corex /usr/local/corex</span>.',
  'clusters.addworker.metaxNotes': `If the <span class="bold-text">/opt/mxdriver</span> or <span class="bold-text">/opt/maca</span> directory does not exist, create a symbolic link to the MetaX driver and SDK installation path:  
  <span class="desc-fill">ln -s /path/to/mxdriver /opt/mxdriver</span>
  <span class="desc-fill">ln -s /path/to/maca /opt/maca</span>.`,
  'clusters.addworker.cambriconNotes':
    'Если директория <span class="bold-text">/usr/local/neuware</span> не существует, создайте символическую ссылку на путь установки Cambricon: <span class="bold-text">ln -s /path/to/neuware /usr/local/neuware</span>.',
  'clusters.addworker.hygonNotes-02':
    'Если не удается обнаружить устройства, попробуйте удалить <span class="bold-text">--env ROCM_SMI_LIB_PATH=/opt/hyhal/lib</span>.',
  'clusters.addworker.selectCluster': 'Выбрать кластер',
  'clusters.addworker.selectCluster.tips':
    'Для <span class="bold-text">не-Docker</span> кластеров, пожалуйста, регистрируйте кластеры или управляйте пулами воркеров на странице Кластеры.',
  'clusters.addworker.selectGPU': 'Выбрать производителя GPU',
  'clusters.addworker.selectGPU.multiTag': 'Multi-select',
  'clusters.addworker.selectGPU.subtitle':
    'Вы можете выбрать несколько производителей GPU или не выбирать для кластера только с CPU',
  'clusters.addworker.checkEnv': 'Проверить окружение',
  'clusters.addworker.checkEnv.cpuOnlyTips':
    'Используйте следующую команду, чтобы убедиться, что в кластере Kubernetes есть хотя бы один готовый узел. Вы регистрируете кластер только с CPU.',
  'clusters.addworker.specifyArgs': 'Указать аргументы',
  'clusters.addworker.dtkVersion': 'Версия DTK',
  'clusters.addworker.runCommand': 'Выполнить команду',
  'clusters.addworker.specifyWorkerIP': 'Указать IP воркера',
  'clusters.addworker.detectWorkerIP': 'Автоматически определить IP воркера',
  'clusters.addworker.specifyWorkerAddress': 'Указать внешний адрес воркера',
  'clusters.addworker.detectWorkerAddress': 'Указать внешний адрес воркера',
  'clusters.addworker.detectWorkerAddress.tips':
    'По умолчанию используется IP воркера, если не указано иное.',
  'clusters.addworker.externalIP.tips':
    'Если работаете в VPC или частной сети, укажите внешний адрес воркера, доступный для сервера.',
  'clusters.addworker.enterWorkerIP': 'Введите IP воркера',
  'clusters.addworker.enterWorkerIP.error': 'Пожалуйста, введите IP воркера.',
  'clusters.addworker.enterWorkerAddress': 'Enter worker external address',
  'clusters.addworker.enterWorkerAddress.error':
    'Please enter the worker external address.',
  'clusters.addworker.extraVolume': 'Дополнительное монтирование тома',
  'clusters.addworker.cacheVolume': 'Model Cache Volume Mount',
  'clusters.addworker.cacheVolume.tips':
    'If you want to customize the model cache directory, you can specify the path to mount it.',
  'clusters.addworker.configSummary': 'Сводка конфигурации',
  'clusters.addworker.gpuVendor': 'Производитель GPU',
  'clusters.addworker.workerIP': 'IP воркера',
  'clusters.addworker.workerExternalIP': 'Внешний адрес воркера',
  'clusters.addworker.notSpecified': 'Не указано',
  'clusters.addworker.autoDetect': 'Автоопределение',
  'clusters.addworker.extraVolume.holder':
    'e.g. /data/models (path must start with /). Use commas to separate multiple paths.',
  'clusters.addworker.cacheVolume.holder':
    'e.g. /data/cache (path must start with /)',
  'clusters.addworker.vendorNotes.title': 'Примечания для устройств {vendor}',
  'clusters.button.genToken':
    'Нужен новый токен? Нажмите <a href="{link}" target="_blank">здесь</a>.',
  'clusters.addworker.amdNotes-01': `Если директория <span class="bold-text">/opt/rocm</span> не существует, создайте символическую ссылку на путь установки ROCm: <span class="bold-text">ln -s /путь/к/rocm /opt/rocm</span>.`,
  'clusters.addworker.message.success_single':
    '{count} новый воркер был добавлен в кластер.',
  'clusters.addworker.message.success_multiple':
    '{count} новых воркеров были добавлены в кластер.',
  'clusters.create.serverUrl': 'URL сервера GPUStack',
  'clusters.create.workerConfig': 'Конфигурация воркера',
  'clusters.edit.k8sOptions.changed.tip':
    'Вы изменили параметры Kubernetes. Чтобы изменения вступили в силу, повторно выполните команду регистрации в целевом кластере.',
  'clusters.addworker.containerName': 'Имя контейнера воркера',
  'clusters.addworker.containerName.tips':
    'Укажите имя для контейнера воркера.',
  'clusters.addworker.dataVolume': 'Том данных GPUStack',
  'clusters.addworker.dataVolume.tips':
    'Укажите путь для хранения данных GPUStack.',
  'clusters.table.ip.internal': 'Внутренний',
  'clusters.table.ip.external': 'Внешний',
  'clusters.form.serverUrl.tips':
    'Если рабочий узел не может напрямую получить доступ к GPUStack Server, укажите внешний URL службы GPUStack Server.',
  'clusters.form.setDefault': 'Установить по умолчанию',
  'clusters.form.setDefault.tips':
    'Использовать по умолчанию для развертывания.',
  'clusters.addworker.noClusters': 'No available Docker clusters found',
  'clusters.create.steps.complete.tips': 'Cluster created successfully!',
  'clusters.create.steps.complete': 'Complete',
  'clusters.create.steps.configure': 'Configure',
  'clusters.create.dockerTips1': 'Next, add worker to this cluster.',
  'clusters.create.dockerTips2':
    'You can also skip this step and add them later from the cluster list.',
  'clusters.create.k8sTips1': 'Next, register existing Kubernetes cluster.',
  'clusters.create.k8sTips2':
    'You can also skip this step and register it later from the cluster list.',
  'clusters.addworker.theadNotes':
    'If the <span class="bold-text>/usr/local/PPU_SDK</span> directory does not exist, please create a symbolic link pointing to the T-Head PPU SDK installed path: <span class="bold-text>ln -s /path/to/PPU_SDK /usr/local/PPU_SDK</span>',
  'clusters.addworker.theadNotes-02':
    'T-Head PPU uses the Container Device Interface (CDI) for device injection and requires the <span class="bold-text">/var/run/cdi</span> directory to be available for CDI generation.',
  'clusters.addworker.nvidiaNotes':
    'The built-in inference backends in GPUStack require <span class="bold-text">CUDA 12.8+</span>. Please ensure your NVIDIA driver version is <span class="bold-text">570</span> or newer.',
  'clusters.volume.title': 'Volume Mounts',
  'clusters.volume.name': 'Volume Name',
  'clusters.volume.mountPath': 'Container Path',
  'clusters.volume.mountPath.format': 'Path must start with /',
  'clusters.volume.readOnly': 'Read Only',
  'clusters.volume.sourceType': 'Source Type',
  'clusters.volume.sourceType.hostPath': 'Host Path',
  'clusters.volume.sourceType.pvc': 'Persistent Volume Claim (PVC)',
  'clusters.volume.sourceType.configMap': 'ConfigMap',
  'clusters.volume.hostPath.path': 'Host Path',
  'clusters.volume.hostPath.type': 'Path Type',
  'clusters.volume.hostPath.type.directory': 'Directory',
  'clusters.volume.hostPath.type.directoryOrCreate':
    'Directory (create if not exists)',
  'clusters.volume.hostPath.type.file': 'File',
  'clusters.volume.hostPath.type.fileOrCreate': 'File (create if not exists)',
  'clusters.volume.hostPath.type.socket': 'Socket',
  'clusters.volume.hostPath.type.charDevice': 'Character Device',
  'clusters.volume.hostPath.type.blockDevice': 'Block Device',
  'clusters.volume.pvc.claimName': 'PVC Name',
  'clusters.volume.pvc.readOnly': 'Read Only',
  'clusters.volume.configMap.name': 'ConfigMap Name',
  'clusters.volume.configMap.optional': 'Optional',
  'clusters.volume.add': 'Add Volume Mount',
  'clusters.systemDefaultContainerRegistry.title': 'Default Container Registry',
  'clusters.systemDefaultContainerRegistry.tip':
    'Default registry used to resolve GPUStack images for this cluster. Falls back to the server default when unset.',
  'clusters.k8sOptions.title': 'Kubernetes Deployment Options',
  'clusters.imageCredentials.title': 'Image Credentials',
  'clusters.imageCredentials.add': 'Add Credential',
  'clusters.imageCredentials.registry': 'Registry',
  'clusters.imageCredentials.username': 'Username',
  'clusters.imageCredentials.password': 'Password',
  'clusters.nodeSelector.title': 'Node Selector',
  'clusters.nodeSelector.tip':
    'Pod nodeSelector applied to every worker DaemonSet — only nodes whose labels match are eligible to run the worker.',
  'clusters.operatorImage.title': 'Operator Image',
  'clusters.operatorImage.tip':
    'Override for the GPUStack Operator container image. Leave empty to use the server default.',
  'clusters.namespace.title': 'Namespace',
  'clusters.namespace.tip':
    'Kubernetes namespace the cluster’s manifests render into. Leave empty to use gpustack-system.',
  'clusters.clusterType.title': 'Cluster Type',
  'clusters.modelService.title': 'Model Service',
  'clusters.modelService.tip':
    'For LLM inference and API serving — e.g. exposing model APIs and token-based services.',
  'clusters.gpuInstances.title': 'GPU Service',
  'clusters.gpuInstances.tip':
    'For on-demand GPU compute — e.g. interactive development, training jobs, or custom environments.',
  'clusters.gpuInstances.staticAddress': 'GPU Service Static Access Address',
  'clusters.gpuInstances.staticAddress.tip':
    'Static address the operator uses to access GPU instances in this cluster (e.g. a LoadBalancer VIP). Optional.'
};

// ========== To-Do: Translate Keys (Remove After Translation) ==========
// 1. 'clusters.addworker.hygonNotes': `If <span class="bold-text">/opt/hyhal</span> or <span class="bold-text">/opt/dtk</span> does not exist, create symbolic links pointing to the corresponding Hygon installation paths, for example: <span class="desc-fill">ln -s /path/to/hyhal /opt/hyhal</span> <span class="desc-fill">ln -s /path/to/dtk /opt/dtk</span>.`,
// 2. 'clusters.addworker.noClusters': 'No available Docker clusters found',
// 3. 'clusters.create.steps.complete.tips': 'Cluster created successfully!',
// 4. 'clusters.create.steps.complete': 'Complete',
// 5. 'clusters.create.dockerTips1': 'Next, add worker to this cluster.',
// 6. 'clusters.create.dockerTips2': 'You can also skip this step and add them later from the cluster list.',
// 7. 'clusters.create.k8sTips1': 'Next, register existing Kubernetes cluster.',
// 8. 'clusters.create.k8sTips2': 'You can also skip this step and register it later from the cluster list.',
// 9. 'clusters.create.steps.configure': 'Configure',
// 10. 'clusters.addworker.theadNotes': 'If the <span class="bold-text>/usr/local/PPU_SDK</span> directory does not exist, please create a symbolic link pointing to the T-Head PPU SDK installed path: <span class="bold-text>ln -s /path/to/PPU_SDK /usr/local/PPU_SDK</span>',
// 11. 'clusters.addworker.theadNotes-02': 'T-Head PPU uses the Container Device Interface (CDI) for device injection and requires the <span class="bold-text">/var/run/cdi</span> directory to be available for CDI generation.'
// 12. 'clusters.addworker.metaxNotes': `If the <span class="bold-text">/opt/mxdriver</span> or <span class="bold-text">/opt/maca</span> directory does not exist, create a symbolic link to the MetaX driver and SDK installation path: <span class="desc-fill">ln -s /path/to/mxdriver /opt/mxdriver</span><span class="desc-fill">ln -s /path/to/maca /opt/maca</span>.`,
// 13. 'clusters.addworker.nvidiaNotes': 'The built-in inference backends in GPUStack v2.1 require <span class="bold-text">CUDA 12.6+</span>. Please ensure your NVIDIA driver version is <span class="bold-text">560</span> or newer.'
// ================================================================
