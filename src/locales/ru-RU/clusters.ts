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
  'clusters.button.addNodePool': 'Добавить пул Worker',
  'clusters.button.add.credential': 'Добавить аккаунт {provider}',
  'clusters.credential.title': 'Учетные данные',
  'clusters.credential.signinToCreate':
    '{name}: <a href="{link}" target="_blank">войдите или зарегистрируйтесь</a>, чтобы создать.',
  'clusters.credential.token': 'Token доступа',
  'clusters.workerpool.region': 'Регион',
  'clusters.workerpool.zone': 'Зона',
  'clusters.workerpool.instanceType': 'Тип инстанса',
  'clusters.workerpool.replicas': 'Реплики',
  'clusters.workerpool.batchSize': 'Размер партии',
  'clusters.workerpool.osImage': 'Образ ОС',
  'clusters.workerpool.volumes': 'Тома',
  'clusters.workerpool.format': 'Формат',
  'clusters.workerpool.size': 'Размер (ГиБ)',
  'clusters.workerpool.title': 'Пулы Worker',
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
    'Количество Worker, создаваемых одновременно в пуле Worker',
  'clusters.create.addworker.tips':
    'Пожалуйста, убедитесь, что выполнены <a href={link} target="_blank">предварительные условия</a> перед выполнением следующей команды.',
  'clusters.create.addCommand.tips':
    'На Worker, который необходимо добавить, выполните следующую команду, чтобы присоединить его к кластеру.',
  'clusters.create.addCommand.k8s.tips':
    'На Kubernetes-кластере, который необходимо зарегистрировать, выполните следующую команду, чтобы создать ресурсы Kubernetes и зарегистрировать этот кластер.',
  'clusters.create.addCommand.k8s.version.warning':
    'Минимальная поддерживаемая версия Kubernetes — 1.23. Для использования функции сервиса GPU требуется Kubernetes версии 1.27 или выше.',
  'cluster.create.checkEnv.tips':
    'Используйте следующую команду для проверки готовности окружения',
  'clusters.create.register.tips':
    'На Kubernetes кластере, который необходимо добавить, выполните следующую команду, чтобы присоединить его узлы к кластеру.',
  'cluster.provider.comingsoon': 'Скоро будет',
  'clusters.addworker.nvidiaNotes-01':
    'Если существует несколько исходящих IP-адресов, укажите тот, который должен использовать Worker. Пожалуйста, перепроверьте с помощью <span class="bold-text">hostname -I | xargs -n1</span>.',
  'clusters.addworker.nvidiaNotes-02':
    'Если директория с моделями уже существует на Worker, вы можете указать путь для её монтирования.',
  'clusters.addworker.hygonNotes':
    'Если <span class="bold-text">/opt/hyhal</span> или <span class="bold-text">/opt/dtk</span> отсутствует, создайте символические ссылки на соответствующие каталоги установки Hygon, например:\n  <span class="desc-fill">ln -s /path/to/hyhal /opt/hyhal</span>\n  <span class="desc-fill">ln -s /path/to/dtk /opt/dtk</span>.',
  'clusters.addworker.corexNotes':
    'Если директория <span class="bold-text">/usr/local/corex</span> не существует, создайте символическую ссылку на путь установки Iluvatar SDK: <span class="bold-text">ln -s /path/to/corex /usr/local/corex</span>.',
  'clusters.addworker.metaxNotes':
    'Если каталог <span class="bold-text">/opt/mxdriver</span> или <span class="bold-text">/opt/maca</span> отсутствует, создайте символические ссылки на каталоги установки драйвера и SDK MetaX:\n<span class="desc-fill">ln -s /path/to/mxdriver /opt/mxdriver</span>\n<span class="desc-fill">ln -s /path/to/maca /opt/maca</span>.',
  'clusters.addworker.cambriconNotes':
    'Если директория <span class="bold-text">/usr/local/neuware</span> не существует, создайте символическую ссылку на путь установки Cambricon: <span class="bold-text">ln -s /path/to/neuware /usr/local/neuware</span>.',
  'clusters.addworker.hygonNotes-02':
    'Если не удается обнаружить устройства, попробуйте удалить <span class="bold-text">--env ROCM_SMI_LIB_PATH=/opt/hyhal/lib</span>.',
  'clusters.addworker.selectCluster': 'Выбрать кластер',
  'clusters.addworker.selectCluster.tips':
    'Для <span class="bold-text">не-Docker</span> кластеров, пожалуйста, регистрируйте кластеры или управляйте пулами Worker на странице Кластеры.',
  'clusters.addworker.selectGPU': 'Выбрать производителя GPU',
  'clusters.addworker.selectGPU.multiTag': 'Множественный выбор',
  'clusters.addworker.selectHardware': 'Выбрать тип оборудования',
  'clusters.addworker.selectHardware.subtitle':
    'Выберите все типы оборудования, на которых этот кластер должен запускать Worker',
  'clusters.addworker.cpuNode.tips':
    'Разворачивает Worker на каждом узле без GPU. Не выбирайте, если плоскость управления находится в том же кластере, что и узлы с GPU, и вы не хотите запускать Worker на узлах с CPU.',
  'clusters.addworker.noWorkerSelected.error':
    'Выберите хотя бы один тип оборудования — если не выбраны ни CPU Node, ни производитель GPU, не будет развёрнут ни один Worker.',
  'clusters.addworker.checkEnv': 'Проверить окружение',
  'clusters.addworker.checkEnv.cpuOnlyTips':
    'Используйте следующую команду, чтобы убедиться, что в кластере Kubernetes есть хотя бы один готовый узел. Вы регистрируете кластер только с CPU.',
  'clusters.addworker.specifyArgs': 'Указать аргументы',
  'clusters.addworker.dtkVersion': 'Версия DTK',
  'clusters.addworker.runCommand': 'Выполнить команду',
  'clusters.addworker.specifyWorkerIP': 'Указать IP Worker',
  'clusters.addworker.detectWorkerIP': 'Автоматически определить IP Worker',
  'clusters.addworker.specifyWorkerAddress': 'Указать внешний адрес Worker',
  'clusters.addworker.detectWorkerAddress': 'Указать внешний адрес Worker',
  'clusters.addworker.detectWorkerAddress.tips':
    'По умолчанию используется IP Worker, если не указано иное.',
  'clusters.addworker.externalIP.tips':
    'При работе в VPC или частной сети укажите внешний адрес Worker, доступный для GPUStack Server.',
  'clusters.addworker.enterWorkerIP': 'Введите IP Worker',
  'clusters.addworker.enterWorkerIP.error': 'Пожалуйста, введите IP Worker.',
  'clusters.addworker.enterWorkerAddress': 'Введите внешний адрес Worker',
  'clusters.addworker.enterWorkerAddress.error':
    'Введите внешний адрес Worker.',
  'clusters.addworker.rdma': 'RDMA / InfiniBand',
  'clusters.addworker.rdma.tips':
    'Включите, если у Worker есть сетевые карты InfiniBand/RoCE. Требуется для передачи KV-кеша между узлами.',
  'clusters.addworker.extraVolume': 'Дополнительное монтирование тома',
  'clusters.addworker.cacheVolume': 'Монтирование тома кеша моделей',
  'clusters.addworker.cacheVolume.tips':
    'Чтобы изменить каталог кеша моделей, укажите путь для монтирования.',
  'clusters.addworker.configSummary': 'Сводка конфигурации',
  'clusters.addworker.gpuVendor': 'Производитель GPU',
  'clusters.addworker.workerIP': 'IP Worker',
  'clusters.addworker.workerExternalIP': 'Внешний адрес Worker',
  'clusters.addworker.notSpecified': 'Не указано',
  'clusters.addworker.autoDetect': 'Автоопределение',
  'clusters.addworker.extraVolume.holder':
    'Например: /data/models (путь должен начинаться с /). Несколько путей разделяйте запятыми.',
  'clusters.addworker.cacheVolume.holder':
    'Например: /data/cache (путь должен начинаться с /)',
  'clusters.addworker.vendorNotes.title': 'Примечания для устройств {vendor}',
  'clusters.addworker.amdNotes-01':
    'Если каталог <span class="bold-text">/opt/rocm</span> не существует, создайте символическую ссылку на путь установки ROCm: <span class="bold-text">ln -s /path/to/rocm /opt/rocm</span>.',
  'clusters.addworker.amdNotes-02': `Если на хосте управляется несколько версий ROCm, необходимо смонтировать <span class="bold-text">/opt/rocm/lib</span>, чтобы избежать сбоев обнаружения устройств.`,
  'clusters.addworker.message.success_single':
    '{count} новый Worker был добавлен в кластер.',
  'clusters.addworker.message.success_multiple':
    '{count} новых Worker были добавлены в кластер.',
  'clusters.create.serverUrl': 'URL GPUStack Server',
  'clusters.create.workerConfig': 'Конфигурация Worker',
  'clusters.chartValues.title': 'Значения чарта (YAML)',
  'clusters.chartValues.tip':
    'Значения для Helm-чарта GPUStack: ключи должны точно совпадать с ключами чарта, а значения накладываются поверх значений, определённых сервером. Здесь можно задать настройки чарта и его подчартов, для которых выше нет отдельного поля, например отключить компонент, уже предоставляемый кластером. Как и в Helm, списки заменяются целиком, а не дополняются.',
  'clusters.chartValues.reapply.tip':
    'Сохранение кластера ничего не меняет в Kubernetes. Повторно выполните «Зарегистрировать кластер», получите манифест и примените его снова. Job внутри кластера сравнивает требуемую манифестом конфигурацию с фактически установленной в релизе и выполняет обновление только при наличии различий.',
  'clusters.chartValues.doc.chart': 'Значения чарта',
  'clusters.chartValues.doc.operator': 'Чарт Operator',
  'clusters.chartValues.error.invalidYaml': 'Некорректный YAML: {reason}',
  'clusters.chartValues.error.notJson':
    'Значение в {path} не является строкой, числом, логическим значением, списком или отображением — YAML прочитал его как дату или двоичное значение, которое нельзя передать без изменений. Возьмите его в кавычки, чтобы оставить текстом.',
  'clusters.chartValues.error.unsafeInteger':
    'Целое число в {path} больше, чем можно передать точно — оно уже округлилось при разборе YAML, поэтому было бы отправлено другое значение. Возьмите его в кавычки, чтобы сохранить цифры.',
  'clusters.chartValues.error.notMapping':
    'Chart values должны быть YAML-отображением ключей, а не отдельным значением или списком.',
  'clusters.edit.registration.changed.tip':
    'Вы изменили параметры, которые применяются при регистрации Worker. Чтобы изменения вступили в силу, повторно выполните команду регистрации в целевом кластере.',
  'clusters.addworker.containerName': 'Имя контейнера Worker',
  'clusters.addworker.containerName.tips': 'Укажите имя для контейнера Worker.',
  'clusters.addworker.dataVolume': 'Том данных GPUStack',
  'clusters.addworker.dataVolume.tips':
    'Укажите путь для хранения данных GPUStack.',
  'clusters.table.ip.internal': 'Внутренний',
  'clusters.table.ip.external': 'Внешний',
  'clusters.form.serverUrl.tips':
    'Если Worker не может напрямую получить доступ к GPUStack Server, укажите внешний URL службы GPUStack Server. Например: {example}',
  'clusters.form.setDefault': 'Установить по умолчанию',
  'clusters.form.setDefault.tips':
    'Использовать по умолчанию для развертывания.',
  'clusters.addworker.noClusters': 'Доступные кластеры Docker не найдены',
  'clusters.create.steps.complete.tips': 'Кластер успешно создан!',
  'clusters.create.steps.complete': 'Готово',
  'clusters.create.steps.configure': 'Настроить',
  'clusters.create.dockerTips1': 'Теперь добавьте Worker в этот кластер.',
  'clusters.create.dockerTips2':
    'Этот шаг можно пропустить и добавить Worker позже из списка кластеров.',
  'clusters.create.k8sTips1':
    'Теперь зарегистрируйте существующий кластер Kubernetes.',
  'clusters.create.k8sTips2':
    'Этот шаг можно пропустить и зарегистрировать кластер позже из списка кластеров.',
  'clusters.addworker.theadNotes':
    'Если каталог <span class="bold-text">/usr/local/PPU_SDK</span> отсутствует, создайте символическую ссылку на каталог установки T-Head PPU SDK: <span class="bold-text">ln -s /path/to/PPU_SDK /usr/local/PPU_SDK</span>.',
  'clusters.addworker.theadNotes-02':
    'T-Head PPU использует Container Device Interface (CDI) для подключения устройств; для генерации CDI должен быть доступен каталог <span class="bold-text">/var/run/cdi</span>.',
  'clusters.addworker.nvidiaNotes':
    'Встроенные бэкенды инференса GPUStack требуют <span class="bold-text">CUDA 12.8+</span>. Убедитесь, что версия драйвера NVIDIA — <span class="bold-text">570</span> или новее.',
  'clusters.volume.title': 'Монтирование томов',
  'clusters.volume.name': 'Имя тома',
  'clusters.volume.mountPath': 'Путь в контейнере',
  'clusters.volume.mountPath.format': 'Путь должен начинаться с /',
  'clusters.volume.readOnly': 'Только чтение',
  'clusters.volume.sourceType': 'Тип источника',
  'clusters.volume.sourceType.hostPath': 'Путь на хосте',
  'clusters.volume.sourceType.pvc': 'Запрос постоянного тома (PVC)',
  'clusters.volume.sourceType.configMap': 'ConfigMap',
  'clusters.volume.hostPath.path': 'Путь на хосте',
  'clusters.volume.hostPath.type': 'Тип пути',
  'clusters.volume.hostPath.type.directory': 'Каталог',
  'clusters.volume.hostPath.type.directoryOrCreate':
    'Каталог (создать, если отсутствует)',
  'clusters.volume.hostPath.type.file': 'Файл',
  'clusters.volume.hostPath.type.fileOrCreate':
    'Файл (создать, если отсутствует)',
  'clusters.volume.hostPath.type.socket': 'Сокет',
  'clusters.volume.hostPath.type.charDevice': 'Символьное устройство',
  'clusters.volume.hostPath.type.blockDevice': 'Блочное устройство',
  'clusters.volume.pvc.claimName': 'Имя PVC',
  'clusters.volume.pvc.readOnly': 'Только чтение',
  'clusters.volume.configMap.name': 'Имя ConfigMap',
  'clusters.volume.configMap.optional': 'Необязательно',
  'clusters.volume.add': 'Добавить монтирование тома',
  'clusters.systemDefaultContainerRegistry.title':
    'Реестр контейнеров по умолчанию',
  'clusters.systemDefaultContainerRegistry.tip':
    'Реестр по умолчанию для разрешения образов GPUStack в этом кластере. Если не задан, используется значение сервера по умолчанию.',
  'clusters.systemDefaultContainerRegistry.dockerHubUnreachable':
    'Экземпляры {provider} не имеют доступа к Docker Hub. Используйте зеркало или приватный реестр.',
  'clusters.k8sOptions.title': 'Параметры развёртывания Kubernetes',
  'clusters.imageCredentials.title': 'Учётные данные реестра образов',
  'clusters.imageCredentials.add': 'Добавить учётные данные',
  'clusters.imageCredentials.registry': 'Реестр',
  'clusters.imageCredentials.username': 'Имя пользователя',
  'clusters.imageCredentials.password': 'Пароль',
  'clusters.nodeSelector.title': 'Селектор узлов',
  'clusters.nodeSelector.tip':
    'Поле nodeSelector для Pod всех DaemonSet Worker. Запускать Worker могут только узлы с подходящими метками.',
  'clusters.operatorImage.title': 'Образ Operator',
  'clusters.operatorImage.tip':
    'Переопределяет образ контейнера GPUStack Operator. Оставьте пустым, чтобы использовать значение сервера по умолчанию.',
  'clusters.namespace.title': 'Пространство имён',
  'clusters.namespace.tip':
    'Пространство имён Kubernetes, для которого формируются манифесты кластера. Оставьте пустым, чтобы использовать gpustack-system.',
  'clusters.clusterType.title': 'Тип кластера',
  'clusters.modelService.title': 'Сервис моделей',
  'clusters.modelService.tip':
    'Для инференса LLM и предоставления API, например API моделей и сервисов на основе Token.',
  'clusters.gpuInstances.title': 'Сервис GPU',
  'clusters.gpuInstances.tip':
    'Для вычислений на GPU по запросу, например интерактивной разработки, задач обучения или пользовательских окружений.',
  'clusters.gpuInstances.staticAddress':
    'Статический адрес доступа к сервису GPU',
  'clusters.gpuInstances.staticAddress.tip':
    'Статический адрес, по которому Operator обращается к экземплярам GPU в этом кластере (например, VIP LoadBalancer). По умолчанию поле пустое: адрес доступа формируется из IP хостов. Изменение применяется только к новым экземплярам и не меняет адреса уже развёрнутых экземпляров GPU.',
  'clusters.gpuInstances.derivedFromNode':
    'Создавать типы экземпляров на основе узлов',
  'clusters.gpuInstances.derivedFromNode.tip':
    'Определяет, создаёт ли Operator типы экземпляров и соответствующие очереди на основе оборудования узлов. Если включено, тип экземпляра создаётся для каждой конфигурации узла. Если отключено, Operator только согласует конфигурацию ресурсов, а все типы экземпляров нужно определить вручную. По умолчанию включено.',
  'clusters.gpuInstances.mixedOnNode':
    'Разрешить разные типы экземпляров на одном узле',
  'clusters.gpuInstances.mixedOnNode.tip':
    'Определяет, может ли один узел предоставлять типы экземпляров с ускорителем и только с CPU. Если включено, узел учитывается во всех подходящих типах. Если отключено, узел с ускорителями предоставляет только тип с ускорителем, а узел только с CPU — только универсальный тип. По умолчанию включено.',
  'clusters.gpuInstances.setting.enabled': 'Включено',
  'clusters.gpuInstances.setting.disabled': 'Отключено',
  'clusters.gpuInstances.setting.unmanaged':
    'Не управляется (сохраняется собственное значение кластера)',

  // Topology: where this cluster's workers sit.
  'clusters.topology.title': 'Настройка топологии',
  'clusters.topology.noRebalance':
    'Расположение влияет только на последующее планирование. Работающие развёртывания не перемещаются.',
  'clusters.topology.load.failed': 'Не удалось загрузить топологию.',
  'clusters.topology.save.failed': 'Не удалось сохранить.',
  'clusters.topology.preview.failed':
    'Не удалось показать предпросмотр этого сопоставления.',
  'clusters.topology.preview.noWorkers': 'В этом кластере пока нет Worker.',
  'clusters.topology.preview.capacity':
    '{workers} Worker · {gpus} GPU · свободно {free}',
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
  'clusters.topology.overview.workers': 'Worker: {count}',
  'clusters.topology.overview.domains': '{count} {field}',
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
    'Удалить поле «{name}»? Заполненные значения останутся в метках Worker.',
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
  'clusters.topology.toast.set': '{field} для {count} Worker: {value}',
  'clusters.topology.toast.cleared': '{field} для {count} Worker очищено',
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
  'clusters.topology.value.count': 'Worker: {count}',
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
    'Из какой метки Worker каждое поле читает значение',
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
  'clusters.topology.advanced.hostKeys': 'Встроено, по имени Worker',
  'clusters.topology.advanced.locked':
    'Собственный ключ GPUStack: сюда записываются значения из таблицы. Нельзя удалить или переместить.',
  'clusters.topology.advanced.suggestions': 'Обнаруженные ключи меток',
  'clusters.topology.advanced.suggestion':
    '{workers} Worker · {values} значений · похоже на {field}',
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
    'Этот ключ есть у {count} Worker ({values} значений)',
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
