export default {
  'kvCache.check.recreate.insufficientRam':
    'Для пересоздания на Worker {worker} требуется {required} GiB, но сейчас доступно для выделения только {available} GiB. Освободите ресурсы или измените конфигурацию.',
  'kvCache.check.recreate.unavailable':
    'Не удалось получить данные о ресурсах для повторного создания.',
  'kvCache.title': 'Сервис кеширования',
  'kvCache.source.manage': 'Управление провайдерами',
  'kvCache.source.builtin':
    'Провайдеры кеширования, включённые в этот выпуск и добавленные установленными расширениями',
  'kvCache.button.add': 'Добавить сервис кеширования',
  'kvCache.providerSelect.title': 'Выбор провайдера',
  'kvCache.provider.source.builtin': 'Встроенный',
  'kvCache.provider.source.community': 'Сообщество',
  'kvCache.provider.source.partner': 'Сертифицированный партнёр GPUStack',
  'kvCache.button.viewLogs': 'Просмотр логов',
  'kvCache.edit.recreate.tips':
    'Изменения вступят в силу после удаления и пересоздания экземпляров.',
  'kvCache.table.provider': 'Провайдер',
  'kvCache.table.worker': 'Worker',
  'kvCache.form.provider': 'Провайдер',
  'kvCache.form.cluster.tips':
    'Кластеры типа «Сервис GPU» не поддерживают ускорение кеширования.',
  'kvCache.form.version': 'Версия',
  'kvCache.form.version.custom': 'Пользовательская',
  'kvCache.form.image': 'Образ контейнера',
  'kvCache.check.ok.perNode':
    'Ресурсов достаточно; на каждом из {count} Worker будет запущен один экземпляр.',
  'kvCache.check.ok.singleton':
    'Ресурсов достаточно; экземпляр будет запущен на Worker {worker}.',
  'kvCache.check.noWorkers': 'Нет Worker, соответствующих селектору.',
  'kvCache.check.noReadyWorkers':
    'В этом кластере нет готовых Worker. Выберите другой кластер или проверьте состояние Worker.',
  'kvCache.check.noReadyTargets':
    'Нет готовых Worker, соответствующих выбранному Worker и меткам. Измените выбор или проверьте состояние Worker.',
  'kvCache.check.workersLoading':
    'Загружается состояние Worker. Дождитесь завершения перед развёртыванием.',
  'kvCache.check.workersUnavailable':
    'Не удалось загрузить состояние Worker. Перед развёртыванием выберите кластер повторно, чтобы загрузить данные заново.',
  'kvCache.check.ok.store':
    'Можно развернуть {replicas} реплик store по {size} GiB на подходящих Worker',
  'kvCache.check.store.insufficientWorkers':
    'Селектору соответствуют только {count} Worker; требуется {replicas} реплик store',
  'kvCache.check.store.exceedsFree':
    'Только у {count} подходящих Worker есть {size} GiB свободной памяти; требуется {replicas} реплик',
  'kvCache.check.store.exceedsTotal':
    'Только у {count} подходящих Worker общий объём памяти достаточен для размещения реплики store размером {size} GiB; требуется {replicas} реплик',
  'kvCache.check.unsupportedAccel':
    'Из {total} целевых Worker {count} используют ускорители ({backends}), для которых у этой версии нет образа; экземпляры на этих Worker не запустятся',
  'kvCache.check.noCpuImage':
    'У {count} из {total} целевых Worker нет ускорителя, а у этой версии нет образа для работы без него; экземпляры на этих Worker не запустятся',
  'kvCache.form.ramSize.exceedsTotal':
    'Превышен объём памяти Worker {worker} ({total} GiB).',
  'kvCache.form.ramSize.exceedsFree':
    'Превышен объём свободной памяти Worker {worker} (свободно {free} GiB); сервер кеширования может быть завершён из-за нехватки памяти (OOM).',
  'kvCache.form.workerSelector': 'Селектор меток Worker',
  'kvCache.form.worker.autoTips':
    'Необязательно: оставьте пустым, чтобы планировщик выбрал размещение экземпляра',
  'kvCache.form.workerSelector.scopeTips':
    'Размещение ограничено Worker, соответствующими всем меткам. Оставьте пустым, чтобы разрешить размещение на любом Worker.',
  'kvCache.form.workerSelector.tips':
    'Запускает по одному экземпляру на каждом Worker, соответствующем всем меткам. Оставьте пустым, чтобы охватить все Worker.',
  'kvCache.form.managementUrl': 'URL управления',
  'kvCache.form.managementUrl.tips':
    'Ссылка на интерфейс управления движком; отображается рядом с именем сервиса',
  'kvCache.form.managementUrl.invalid': 'Введите действительный URL http(s)',
  'kvCache.button.management': 'URL управления',
  'kvCache.form.advanced': 'Дополнительно',
  'kvCache.form.parameters': 'Параметры',
  'kvCache.form.parameters.noComponent':
    'В приведённых выше настройках отключены все компоненты провайдера, поэтому передавать параметры некому.',
  'kvCache.form.env': 'Переменные окружения',
  'kvCache.form.env.componentTips': 'Применяется ко всем компонентам сервиса',
  'kvCache.form.l2Backend': 'Бэкенд хранилища L2',
  'kvCache.form.l2Backend.add': 'Добавить бэкенд',
  'kvCache.form.l2Backend.backend': 'Бэкенд',
  'kvCache.form.l2Backend.type': 'Тип',
  'kvCache.form.l2Backend.customOptions': 'Пользовательские параметры',
  'kvCache.form.l2Backend.tips':
    'Переносит KV-кеш в более ёмкие уровни вторичного хранилища. Порядок записей задаёт приоритет: чтение предпочитает первую, запись выполняется во все.',
  'kvCache.detail.overview': 'Обзор',
  'kvCache.detail.perWorker': 'на Worker',
  'kvCache.detail.capacity': 'Ёмкость',
  'kvCache.detail.instances': 'Экземпляры',
  'kvCache.edit.title': 'Изменить {name}',
  'kvCache.instances.loadFailed': 'Не удалось загрузить экземпляры; повтор',
  'kvCache.instances.empty': 'Экземпляров пока нет',
  'kvCache.detail.monitoring': 'Мониторинг',
  'kvCache.detail.hitRate': 'Доля попаданий',
  'kvCache.detail.externalHitRate': 'Доля попаданий во внешний кеш',
  'kvCache.detail.usage': 'Использование кеша L1',
  'kvCache.detail.l2Usage': 'Использование кеша L2',
  'kvCache.detail.lookupTraffic': 'Трафик поиска',
  'kvCache.detail.usageRatio': 'Доля использования L1',
  'kvCache.detail.throughput': 'Пропускная способность',
  'kvCache.detail.noMetrics': 'Нет данных метрик',
  'kvCache.detail.metricsUnavailable': 'Метрики недоступны',
  'kvCache.detail.aggregated': 'Суммарно',
  'kvCache.detail.perInstance': 'По экземплярам',
  'kvCache.detail.hitTokens': 'Найденные Token',
  'kvCache.detail.hitTokens.tips':
    'Количество Token, полученных из общего кеша за выбранный период, по данным движка инференса',
  'kvCache.detail.queriedTokens': 'Запрошенные Token',
  'kvCache.detail.queriedTokens.tips':
    'Количество Token, запрошенных в общем кеше за выбранный период, по данным движка инференса',
  'kvCache.detail.hitRate.engineTips':
    'По собственным счётчикам попаданий во внешний кеш движка инференса за выбранный период. Сейчас поддерживается только vLLM; для других бэкендов отображается «-»',
  'kvCache.detail.view': 'Представление',
  'kvCache.detail.modelInstances': 'Подключённые экземпляры моделей'
};
