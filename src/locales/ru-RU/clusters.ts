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
  'clusters.create.selectProvider': 'Выберите провайдера',
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
    'Пожалуйста, убедитесь, что выполнены <a href={link} target="_blank">предварительные условия</a> для {label} перед выполнением следующей команды.',
  'clusters.create.addCommand.tips':
    'На воркере, который необходимо добавить, выполните следующую команду, чтобы присоединить его к кластеру.',
  'cluster.create.checkEnv.tips':
    'Используйте следующую команду для проверки готовности окружения',
  'clusters.create.register.tips':
    'На Kubernetes кластере, который необходимо добавить, выполните следующую команду, чтобы присоединить его узлы к кластеру.',
  'cluster.provider.comingsoon': 'Скоро будет',
  'clusters.addworker.nvidiaNotes-01':
    'Если существует несколько исходящих IP-адресов, укажите тот, который должен использовать воркер. Пожалуйста, перепроверьте с помощью <span class="bold-text">hostname -I | xargs -n1</span>.',
  'clusters.addworker.nvidiaNotes-02':
    'Если директория с моделями уже существует на воркере, вы можете указать путь для её монтирования.',
  'clusters.addworker.hygonNotes':
    'Если директория <span class="bold-text">/opt/hyhal</span> не существует, создайте символическую ссылку на путь установки Hygon: <span class="bold-text">/opt/hyhal</span>. Аналогично для директории <span class="bold-text">/opt/dtk</span>.',
  'clusters.addworker.corexNotes':
    'Если директория <span class="bold-text">/lib/modules</span> не существует, создайте символическую ссылку на путь установки Iluvatar: <span class="bold-text">ln -s /path/to/corex /lib/modules</span>. Аналогично для директории <span class="bold-text">/usr/local/corex</span>.',
  'clusters.addworker.metaxNotes':
    'Если директория <span class="bold-text">/opt/mxdriver</span> не существует, создайте символическую ссылку на путь установки MetaX: <span class="bold-text">ln -s /path/to/metax /opt/mxdriver</span>. Аналогично для директории <span class="bold-text">/opt/maca</span>.',
  'clusters.addworker.cambriconNotes':
    'Если директория <span class="bold-text">/usr/local/neuware</span> не существует, создайте символическую ссылку на путь установки Cambricon: <span class="bold-text">ln -s /path/to/neuware /usr/local/neuware</span>.',
  'clusters.addworker.hygonNotes-02':
    'Если не удается обнаружить устройства, попробуйте удалить <span class="bold-text">--env ROCM_SMI_LIB_PATH=/opt/hyhal/lib</span>.',
  'clusters.addworker.selectCluster': 'Выбрать кластер',
  'clusters.addworker.selectCluster.tips':
    'Для не-Docker кластеров, пожалуйста, регистрируйте кластеры или управляйте пулами воркеров на странице Кластеры.',
  'clusters.addworker.selectGPU': 'Выбрать производителя GPU',
  'clusters.addworker.checkEnv': 'Проверить окружение',
  'clusters.addworker.specifyArgs': 'Указать аргументы',
  'clusters.addworker.runCommand': 'Выполнить команду',
  'clusters.addworker.specifyWorkerIP': 'Указать IP воркера',
  'clusters.addworker.detectWorkerIP': 'Автоматически определить IP воркера',
  'clusters.addworker.specifyWorkerAddress': 'Указать внешний адрес воркера',
  'clusters.addworker.detectWorkerAddress':
    'Указать внешний адрес воркера (по умолчанию используется IP воркера)',
  'clusters.addworker.externalIP.tips':
    'Если работаете в VPC или частной сети, укажите внешний адрес воркера, доступный для сервера.',
  'clusters.addworker.enterWorkerIP': 'Введите IP воркера',
  'clusters.addworker.enterWorkerIP.error': 'Пожалуйста, введите IP воркера.',
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
    'напр. /data/models (путь должен начинаться с /)',
  'clusters.addworker.cacheVolume.holder':
    'напр. /data/cache (путь должен начинаться с /)',
  'clusters.addworker.vendorNotes.title': 'Примечания для устройств {vendor}',
  'clusters.button.genToken':
    'Need to create a new token? Click <a href="{link}" target="_blank">here</a>.',
  'clusters.addworker.amdNotes-01': `If the <span class="bold-text">/opt/rocm</span> directory does not exist, please create a symbolic link pointing to the ROCm installed path: <span class="bold-text">ln -s /path/to/rocm /opt/rocm</span>.`,
  'clusters.addworker.message.success_single':
    '{count} new worker has been added to the cluster.',
  'clusters.addworker.message.success_multiple':
    '{count} new workers have been added to the cluster.',
  'clusters.create.serverUrl': 'Server URL',
  'clusters.create.workerConfig': 'Worker Configuration',
  'clusters.addworker.containerName': 'Worker Container Name',
  'clusters.addworker.containerName.tips':
    'Specify a name for the worker container.',
  'clusters.addworker.dataVolume': 'GPUStack Data Volume',
  'clusters.addworker.dataVolume.tips':
    'Specify a data storage path for GPUStack.',
  'clusters.table.ip.internal': 'Internal',
  'clusters.table.ip.external': 'External',
  'clusters.form.serverUrl.tips':
    'Specify the server URL accessible from your cloud provider.'
};

// ========== To-Do: Translate Keys (Remove After Translation) ==========
// 1. 'clusters.addworker.amdNotes-01': `If the <span class="bold-text">/opt/rocm</span> directory does not exist, please create a symbolic link pointing to the ROCm installed path: <span class="bold-text">ln -s /path/to/rocm /opt/rocm</span>.`,
// 2. 'clusters.button.genToken': 'Need to create a new token? Click <a href="{link}" target="_blank">here</a>.',
// 3. 'clusters.addworker.cacheVolume': 'Model Cache Volume Mount',
// 4. 'clusters.addworker.cacheVolume.tips': 'If you want to customize the model cache directory, you can specify the path to mount it.',
// 5. 'clusters.addworker.message.success_single': '{count} new worker has been added to the cluster.',
// 6. 'clusters.addworker.message.success_multiple': '{count} new workers have been added to the cluster.',
// 7. 'clusters.create.serverUrl': 'Server URL',
// 8. 'clusters.create.workerConfig': 'Worker Configuration'
// 9. 'clusters.addworker.containerName': 'Worker Container Name',
// 10. 'clusters.addworker.containerName.tips':'Specify a name for the worker container.',
// 11. 'clusters.addworker.dataVolume': 'GPUStack Data Volume',
// 12. 'clusters.addworker.dataVolume.tips': 'Specify a data storage path for GPUStack.',
// 10. 'clusters.table.ip.internal': 'Internal',
// 11. 'clusters.table.ip.external': 'External',
// 12. 'clusters.form.serverUrl.tips': 'Specify the server URL accessible from your cloud provider.'
// 13. 'clusters.addworker.specifyWorkerIP': 'Specify Worker IP <span class="text-tertiary">{type}</span>',
// ================================================================
