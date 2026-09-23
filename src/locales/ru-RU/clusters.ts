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
  'clusters.credential.signinToCreate':
    '{name}: <a href="{link}" target="_blank">войдите или зарегистрируйтесь</a>, чтобы создать.',
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
  'clusters.addworker.selectHardware': 'Выбрать тип оборудования',
  'clusters.addworker.selectHardware.subtitle':
    'Выберите все типы оборудования, на которых этот кластер должен запускать worker’ы',
  'clusters.addworker.cpuNode.tips':
    'Разворачивает worker на всех узлах без GPU. Не выбирайте, если ваша control plane находится в том же кластере, что и узлы с GPU, и вы не хотите запускать worker на узлах с CPU.',
  'clusters.addworker.noWorkerSelected.error':
    'Выберите хотя бы один тип оборудования — если не выбраны ни CPU Node, ни производитель GPU, не будет развёрнут ни один worker.',
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
  'clusters.addworker.rdma': 'RDMA / InfiniBand',
  'clusters.addworker.rdma.tips':
    'Включите, если на узле есть сетевые карты InfiniBand/RoCE. Требуется для передачи KV-кеша между узлами.',
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
  'clusters.addworker.amdNotes-01': `Если директория <span class="bold-text">/opt/rocm</span> не существует, создайте символическую ссылку на путь установки ROCm: <span class="bold-text">ln -s /путь/к/rocm /opt/rocm</span>.`,
  'clusters.addworker.amdNotes-02': `Если на хосте управляется несколько версий ROCm, необходимо смонтировать <span class="bold-text">/opt/rocm/lib</span>, чтобы избежать сбоев обнаружения устройств.`,
  'clusters.addworker.message.success_single':
    '{count} новый воркер был добавлен в кластер.',
  'clusters.addworker.message.success_multiple':
    '{count} новых воркеров были добавлены в кластер.',
  'clusters.create.serverUrl': 'GPUStack Server URL',
  'clusters.create.workerConfig': 'Конфигурация воркера',
  'clusters.chartValues.title': 'Chart Values (YAML)',
  'clusters.chartValues.tip':
    'Values для Helm chart GPUStack: ключи те же, что и в самом chart, значения накладываются поверх выведенных сервером. Здесь доступно всё, что предоставляют chart и его subcharts и для чего нет поля выше — например отключение компонента, который уже есть в кластере. Как и в Helm, списки заменяются целиком, а не дополняются.',
  'clusters.chartValues.reapply.tip':
    'Сохранение кластера ничего не меняет в Kubernetes. После изменений заново выполните «Зарегистрировать кластер», получите manifest и примените его снова — Job внутри кластера сравнивает требуемую manifest конфигурацию с фактически установленной и обновляет release только при различии.',
  'clusters.chartValues.doc.chart': 'Chart values',
  'clusters.chartValues.doc.operator': 'Operator chart',
  'clusters.chartValues.error.invalidYaml': 'Некорректный YAML: {reason}',
  'clusters.chartValues.error.notJson':
    'Значение в {path} не является строкой, числом, логическим значением, списком или отображением — YAML прочитал его как дату или двоичное значение, которое нельзя передать без изменений. Возьмите его в кавычки, чтобы оставить текстом.',
  'clusters.chartValues.error.unsafeInteger':
    'Целое число в {path} больше, чем можно передать точно — оно уже округлилось при разборе YAML, поэтому было бы отправлено другое значение. Возьмите его в кавычки, чтобы сохранить цифры.',
  'clusters.chartValues.error.notMapping':
    'Chart values должны быть YAML-отображением ключей, а не отдельным значением или списком.',
  'clusters.edit.registration.changed.tip':
    'Вы изменили параметры, которые применяются при регистрации воркера. Чтобы изменения вступили в силу, повторно выполните команду регистрации в целевом кластере.',
  'clusters.addworker.containerName': 'Имя контейнера воркера',
  'clusters.addworker.containerName.tips':
    'Укажите имя для контейнера воркера.',
  'clusters.addworker.dataVolume': 'Том данных GPUStack',
  'clusters.addworker.dataVolume.tips':
    'Укажите путь для хранения данных GPUStack.',
  'clusters.table.ip.internal': 'Внутренний',
  'clusters.table.ip.external': 'Внешний',
  'clusters.form.serverUrl.tips':
    'Если рабочий узел не может напрямую получить доступ к GPUStack Server, укажите внешний URL службы GPUStack Server. Например: {example}',
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
  'clusters.systemDefaultContainerRegistry.dockerHubUnreachable':
    'Экземпляры {provider} не имеют доступа к Docker Hub. Используйте зеркало или приватный реестр.',
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
    'Static address the operator uses to access GPU instances in this cluster (e.g. a LoadBalancer VIP). Operator default: empty — the access address is generated from host IPs. Changing it does not re-address GPU instances that are already deployed; it applies to newly created ones.',
  'clusters.gpuInstances.derivedFromNode': 'Derive Instance Types from Nodes',
  'clusters.gpuInstances.derivedFromNode.tip':
    'Whether the operator auto-derives instance types (and their backing queues) from node hardware. Enabled: the operator authors a derived instance type for each node flavor. Disabled: it only aligns the resource flavor, and you define every instance type yourself. Operator default: Enabled.',
  'clusters.gpuInstances.mixedOnNode': 'Allow Mixed Instance Types on a Node',
  'clusters.gpuInstances.mixedOnNode.tip':
    'Whether one node may serve both an accelerated and a CPU-only instance type. Enabled: a node is summarized into every type it can serve. Disabled: a node with accelerators yields only an accelerated type, and a CPU-only node only a general one. Operator default: Enabled.',
  'clusters.gpuInstances.setting.enabled': 'Enabled',
  'clusters.gpuInstances.setting.disabled': 'Disabled',
  'clusters.gpuInstances.setting.unmanaged':
    'Unmanaged (the cluster keeps its own value)',

  // Topology: where this cluster's workers sit.
  'clusters.topology.title': 'Топология',
  'clusters.topology.noRebalance':
    'Расположение влияет только на последующее планирование. Работающие развёртывания не перемещаются.',
  'clusters.topology.load.failed': 'Не удалось загрузить топологию.',
  'clusters.topology.save.failed': 'Не удалось сохранить.',
  'clusters.topology.preview.failed':
    'Не удалось показать предпросмотр этого сопоставления.',
  'clusters.topology.preview.noWorkers': 'В этом кластере пока нет worker.',
  'clusters.topology.preview.capacity':
    '{workers} worker · {gpus} GPU · свободно {free}',
  'clusters.topology.cluster': 'Кластер',
  'clusters.topology.discard.ok': 'Отменить',
  'clusters.topology.field.region': 'Регион',
  'clusters.topology.field.zone': 'Зона',
  'clusters.topology.field.room': 'Зал',
  'clusters.topology.field.row': 'Ряд',
  'clusters.topology.field.rack': 'Стойка',
  'clusters.topology.field.switch': 'Коммутатор доступа',
  'clusters.topology.field.acceleratorDomain': 'Домен ускорителей',
  'clusters.topology.field.host': 'Хост',
  'clusters.topology.field.region.tips': 'Облачный регион или ЦОД',
  'clusters.topology.field.zone.tips': 'Зона доступности или зал',
  'clusters.topology.field.room.tips': 'Машинный зал',
  'clusters.topology.field.row.tips': 'Ряд стоек',
  'clusters.topology.field.rack.tips': 'Стойка или шкаф',
  'clusters.topology.field.switch.tips':
    'Заполняется вручную или записывается инструментом вроде Topograph',
  'clusters.topology.field.acceleratorDomain.tips':
    'Заполните вручную, если устройство не сообщает',
  'clusters.topology.overview.workers': '{count} worker',
  'clusters.topology.overview.domains': '{field}: {count}',
  'clusters.topology.overview.unfilled': '{count} без значения «{field}»',
  'clusters.topology.previewing': '● Предпросмотр',
  'clusters.topology.previewing.long':
    '● Предпросмотр: основная панель показывает несохранённое сопоставление',
  'clusters.topology.view.table': 'Таблица',
  'clusters.topology.view.tree': 'Дерево',
  'clusters.topology.search.placeholder': 'Поиск хостов…',
  'clusters.topology.columns': 'Столбцы',
  'clusters.topology.columns.fields': 'Поля расположения',
  'clusters.topology.columns.manage': 'Управление уровнями',
  'clusters.topology.columns.mapping': 'Сопоставление ключей меток…',
  'clusters.topology.columns.deleteCustom': 'Удалить поле «{name}»',
  'clusters.topology.columns.deleteCustom.confirm':
    'Удалить поле «{name}»? Заполненные значения останутся в метках worker.',
  'clusters.topology.columns.deleted': 'Поле «{name}» удалено',
  'clusters.topology.selected': 'Выбрано: {count}',
  'clusters.topology.clearSelection': 'Снять выбор',
  'clusters.topology.batch.button': 'Задать расположение',
  'clusters.topology.batch.title': 'Задать расположение · выбрано {count}',
  'clusters.topology.batch.field': 'Поле',
  'clusters.topology.batch.value': 'Значение',
  'clusters.topology.batch.overwrite':
    'Будет перезаписано значений: {count}: {names}',
  'clusters.topology.batch.overwriteAuto':
    'У {count} из них «{field}» сообщено устройством и будет переопределено',
  'clusters.topology.batch.more': '{names} и ещё {count}',
  'clusters.topology.batch.apply': 'Применить к {count}',
  'clusters.topology.batch.partial': 'Запись не удалась в кластерах: {failed}.',
  'clusters.topology.toast.setOne': '{field} для {host}: {value}',
  'clusters.topology.toast.clearedOne': '{field} для {host} очищено',
  'clusters.topology.toast.set': '{field} для {count} worker: {value}',
  'clusters.topology.toast.cleared': '{field} для {count} worker очищено',
  'clusters.topology.toast.firstWrite':
    ' (влияет только на последующее планирование)',
  'clusters.topology.undo': 'Отменить',
  'clusters.topology.undo.done': 'Отменено',
  'clusters.topology.undo.failed': 'Не удалось отменить: {reason}',
  'clusters.topology.cell.fill': 'Заполнить: {field}',
  'clusters.topology.cell.aria': '{field}, {state}, {host}',
  'clusters.topology.state.unfilled': 'не заполнено',
  'clusters.topology.state.discovered.aria': '{value}, сообщено устройством',
  'clusters.topology.state.override.aria':
    '{value}, введено вручную поверх сообщённого',
  'clusters.topology.state.discovered.tips':
    'Сообщено устройством ({key}). Ручной ввод переопределит это.',
  'clusters.topology.state.override.tips':
    'Введено вручную. Очистка вернёт сообщённое значение {value}',
  'clusters.topology.state.user.tips': 'Введено вручную ({key})',
  'clusters.topology.override.confirm':
    'Это значение сообщено устройством; ручной ввод переопределит его.',
  'clusters.topology.override.ok': 'Переопределить',
  'clusters.topology.value.count': '{count} worker',
  'clusters.topology.value.create': 'Создать «{value}»',
  'clusters.topology.value.clear': 'Очистить',
  'clusters.topology.column.menu': 'Меню столбца «{field}»',
  'clusters.topology.column.fillUnfilled': 'Заполнить незаполненные ({count})…',
  'clusters.topology.column.fillBySwitch':
    'Заполнить по коммутатору доступа ({count} групп)…',
  'clusters.topology.source.user': 'вручную',
  'clusters.topology.source.discovered': 'авто',
  'clusters.topology.source.node': 'узел K8s',
  'clusters.topology.host.online': 'В сети',
  'clusters.topology.host.offline': 'Не в сети',
  'clusters.topology.tree.byLayer': 'По уровням',
  'clusters.topology.tree.byField': 'По «{field}»',
  'clusters.topology.tree.expandAll': 'Развернуть всё',
  'clusters.topology.tree.collapseAll': 'Свернуть всё',
  'clusters.topology.tree.unfilled': 'Без значения «{field}»',
  'clusters.topology.tree.unfilled.why':
    'Нет метки {key} (и ни одного из её вариантов)',
  'clusters.topology.tree.more': 'ещё {count}',
  'clusters.topology.tree.hostCapacity': '{gpus} GPU · свободно {free}',
  'clusters.topology.onboarding.hosts': 'Обнаружено хостов: {hosts}.',
  'clusters.topology.onboarding.goal':
    'Чтобы участники PD-группы размещались рядом:',
  'clusters.topology.onboarding.steps':
    '① Выберите машины одной стойки → ② «Задать расположение» с именем стойки → ③ При развёртывании выберите «та же стойка»',
  'clusters.topology.onboarding.domains':
    'Домен ускорителей, о котором сообщает оборудование (многоузловой NVLink, суперпод Ascend), тоже может быть уровнем: добавьте его в «Добавить уровень» и укажите подходящий ключ метки — значения подставятся сами.',
  'clusters.topology.onboarding.dismiss': 'Понятно',
  'clusters.topology.mapping.title': 'Сопоставление ключей меток',
  'clusters.topology.mapping.intro':
    'Из какой метки worker каждое поле читает значение',
  'clusters.topology.mapping.showUnused':
    'Показать неиспользуемые поля ({count})',
  'clusters.topology.mapping.hideUnused': 'Скрыть неиспользуемые поля',
  'clusters.topology.mapping.moreKeys': '+ ещё {count} ключ(ей)',
  'clusters.topology.mapping.classified': 'Распознано {classified} / {total}',
  'clusters.topology.mapping.noKeys': 'Ключи меток не заданы',
  'clusters.topology.layer.labelKeys': 'Ключи меток',
  'clusters.topology.layer.addKey': 'Добавить ключ',
  'clusters.topology.layer.rename': 'Переименовать',
  'clusters.topology.layer.rename.tips':
    'Меняется только отображаемое имя. Идентификатор уровня, его ключи меток и уже сохранённая в моделях топологическая привязка не затрагиваются. Оставьте поле пустым, чтобы вернуть имя по умолчанию. Идентификатор уровня:',
  'clusters.topology.layer.rename.taken':
    'Другой уровень этой цепочки уже так называется.',
  'clusters.topology.layer.disable': 'Отключить',
  'clusters.topology.layer.disabled': ' (отключён)',
  'clusters.topology.layer.enable': 'Включить',
  'clusters.topology.layer.inUse': 'Уровень всё ещё используется',
  'clusters.topology.layer.inUse.tips':
    'Эти модели ссылаются на уровень в топологической привязке и потеряют её: {models}. Сначала измените эти модели.',
  'clusters.topology.layer.name': 'Имя',
  'clusters.topology.advanced.hostKeys': 'Встроено, по имени worker',
  'clusters.topology.advanced.locked':
    'Собственный ключ GPUStack: сюда записываются значения из таблицы. Нельзя удалить или переместить.',
  'clusters.topology.advanced.suggestions': 'Обнаруженные ключи меток',
  'clusters.topology.advanced.suggestion':
    '{workers} worker · {values} значений · похоже на {field}',
  'clusters.topology.advanced.discard':
    'Отменить изменения сопоставления полей?',
  'clusters.topology.advanced.discard.tips':
    'Значения, заполненные в таблице, не затрагиваются.',
  'clusters.topology.advanced.saved':
    'Сохранено. Влияет только на последующее планирование; работающие группы не перемещаются.',
  'clusters.topology.keys.placeholder': 'Введите ключ метки или выберите ниже',
  'clusters.topology.keys.invalid':
    'Некорректный ключ метки Kubernetes (префикс ≤ 253, имя ≤ 63, буквы, цифры, - _ .)',
  'clusters.topology.keys.usage':
    'Этот ключ есть у {count} worker ({values} значений)',
  'clusters.topology.keys.exists': 'Этот ключ уже добавлен',
  'clusters.topology.custom.title': 'Добавить уровень',
  'clusters.topology.custom.name.required': 'Введите имя',
  'clusters.topology.custom.name.taken': 'Это имя занято или зарезервировано',
  'clusters.topology.custom.name.tips':
    'Появится среди вариантов в форме развёртывания',
  'clusters.topology.custom.position': 'Где в цепочке',
  'clusters.topology.custom.slot.insert': 'Вставить сюда',
  'clusters.topology.custom.slot.placeholder': 'Новый уровень',
  'clusters.topology.custom.slot.explain':
    'В одном {parent} несколько {name}; в одном {name} несколько {child}',
  'clusters.topology.custom.slot.explain.top':
    'В одном {name} несколько {child}',
  'clusters.topology.custom.keys.tips':
    'У пользовательского уровня нет собственного ключа; чтобы заполнять его из таблицы, поставьте первым ключ, в который хотите записывать.',
  'clusters.topology.custom.referenced':
    'Нельзя удалить «{name}»: на него ссылаются модели'
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
