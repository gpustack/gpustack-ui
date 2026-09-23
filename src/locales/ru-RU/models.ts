export default {
  'models.button.deploy': 'Развернуть модель',
  'models.button.exportYaml': 'Экспорт YAML',
  'models.button.importYaml': 'Импорт YAML',
  'models.form.yamlFile': 'YAML-файл',
  'models.import.checking': 'Проверка…',
  'models.import.hint.nothing': 'Здесь нечего импортировать',
  'models.import.pickFile': 'Выбрать файл',
  'models.import.empty.title': 'Импорт YAML-файла',
  'models.import.empty.description':
    'Выберите файл с описанием развёртываний. Он сначала проверяется, и различия показываются полностью — до того, как что-либо будет записано.',
  'models.import.cluster.follow': 'Как указано в файле',
  'models.import.loaded':
    'Развёртываний: {count} · совпадает с текущим состоянием кластера {cluster}',
  'models.import.loaded.hint':
    'Документ совпадает с текущим состоянием кластера {cluster}, записывать нечего.',
  'models.import.counts':
    'Развёртываний: {count} · в кластер {cluster} · изменений: {changes}',
  'models.import.parsed': 'Развёртываний: {count}',
  'models.import.parsed.invalid': 'нельзя импортировать: {count}',
  'models.import.fieldsDoc': 'Справочник полей',
  'models.import.nav.invalid': 'Нельзя импортировать',
  'models.import.scope.all': 'Все развёртывания ({count})',
  'models.import.scope.whole': 'Весь документ',
  'models.import.scope.wholeShort': 'Целиком',
  'models.import.pane.current': 'В кластере · только чтение',
  'models.import.pane.draft': 'К импорту · можно править',
  'models.import.pane.absent': 'Развёртывания с таким именем нет',
  'models.import.pane.none': 'В этом кластере нет подходящих развёртываний',
  'models.import.pane.allNew':
    'Все развёртывания здесь новые — ни одно не заменяется',
  'models.import.pane.waiting': 'Пока нечего сравнивать',
  'models.import.entry': 'Развёртывание {index}',
  'models.import.entry.invalid': 'Развёртывание {index} нельзя импортировать',
  'models.import.summary':
    'Создать: {create}, обновить: {update}, без изменений: {unchanged}.',
  'models.import.summary.replaces':
    'Обновление заменяет развёртывание содержимым файла.',
  'models.import.action.create': 'Создать',
  'models.import.action.update': 'Обновить',
  'models.import.action.unchanged': 'Без изменений',
  'models.import.changes': 'Изменений: {count}',
  'models.import.blocked':
    'Нельзя импортировать развёртываний: {count}. Исправьте их, чтобы продолжить.',
  'models.import.overwrite.title': 'Подтвердите импорт',
  'models.import.overwrite.confirm':
    'Следующие существующие развёртывания ({count}) будут полностью заменены содержимым файла. Настройки, которых нет в файле, вернутся к значениям по умолчанию.',
  'models.import.overwrite.rest':
    'Также будет создано: {create}, без изменений: {unchanged}.',
  'models.import.invalid':
    'Файл не может быть импортирован. Исправьте указанные ниже проблемы — проверка выполнится снова.',
  'models.title': 'Модели',
  'models.title.edit': 'Редактировать модель',
  'models.title.duplicate': 'Клонировать модель',
  'models.table.models': 'Модели',
  'models.table.name': 'Название модели',
  'models.form.source': 'Источник',
  'models.form.repoid': 'ID репозитория',
  'models.form.repoid.desc': 'Поддерживается только формат .gguf',
  'models.form.filename': 'Имя файла',
  'models.form.replicas': 'Реплики',
  'models.form.selector': 'Селектор',
  'models.form.env': 'Переменные окружения',
  'models.form.configurations': 'Конфигурации',
  'models.form.s3address': 'S3-адрес',
  'models.form.partialoffload.tips':
    'При включении CPU оффлоудинга GPUStack будет выделять оперативную память, если ресурсов GPU недостаточно. Вы должны правильно настроить бэкенд вывода для использования гибридного CPU+GPU или полного CPU вывода.',
  'models.form.distribution.tips':
    'Позволяет переносить часть слоёв модели на один или несколько удалённых воркеров, когда ресурсов текущего воркера недостаточно.',
  'models.openinplayground': 'Открыть в Песочнице',
  'models.instances': 'инстансы',
  'models.table.replicas.edit': 'Редактировать реплики',
  'model.form.ollama.model': 'Модель Ollama',
  'model.form.ollamaholder': 'Выберите или введите название модели',
  'model.deploy.sort': 'Сортировка',
  'model.deploy.search.placeholder': 'Введите <kbd>/</kbd> для поиска моделей',
  'model.form.ollamatips':
    'Подсказка: ниже представлены предустановленные модели Ollama в GPUStack. Выберите нужную или введите модель для развертывания в поле 【{name}】 справа.',
  'models.sort.name': 'По имени',
  'models.sort.size': 'По размеру',
  'models.sort.likes': 'По лайкам',
  'models.sort.trending': 'Популярные',
  'models.sort.downloads': 'По загрузкам',
  'models.sort.updated': 'По обновлению',
  'models.search.result': '{count} результатов',
  'models.data.card': 'Карточка модели',
  'models.available.files': 'Доступные файлы',
  'models.viewin.hf': 'Посмотреть в Hugging Face',
  'models.viewin.modelscope': 'Посмотреть в ModelScope',
  'models.architecture': 'Архитектура',
  'models.search.noresult': 'Связанные модели не найдены',
  'models.search.nofiles': 'Нет доступных файлов',
  'models.search.networkerror': 'Ошибка сетевого подключения!',
  'models.search.hfvisit': 'Убедитесь, что доступен',
  'models.search.unsupport':
    'Модель не поддерживается и может быть нефункциональна после развертывания.',
  'models.form.scheduletype': 'Тип планирования',
  'models.form.categories': 'Категория модели',
  'models.form.scheduletype.auto': 'Авто',
  'models.form.scheduletype.manual': 'Ручной',
  'models.form.scheduletype.gpu': 'Указать GPU',
  'models.form.scheduletype.gpuType': 'Указать тип GPU',
  'models.form.scheduletype.auto.tips':
    'Автоматическое развертывание инстансов модели на подходящие GPU в зависимости от текущих ресурсов.',
  'models.form.scheduletype.manual.tips':
    'Позволяет вручную указать GPU для развертывания инстансов модели.',
  'models.form.gpuallocation': 'Распределение GPU',
  'models.form.gpumode.full': 'Целиком',
  'models.form.gpumode.slicing': 'Нарезка',
  'models.form.gpuType.noSlicedCapacity':
    'Нет доступной ёмкости для нарезки у этого типа GPU, выберите другой тип GPU.',
  'models.form.gpuType.noPartitionProfile':
    'Нет доступного профиля раздела у этого типа GPU, выберите другой тип GPU.',
  'models.form.manual.schedule': 'Ручное распределение',
  'models.table.gpuindex': 'Индекс GPU',
  'models.table.vgpu': 'vGPU',
  'models.table.vgpu.slice': '{memory}% VRAM / {cores}% вычислений',
  'models.table.backend': 'Бэкенды',
  'models.table.acrossworker': 'Распределение по воркерам',
  'models.table.cpuoffload': 'CPU оффлоуд',
  'models.table.layers': 'Слои',
  'models.form.backend': 'Бэкенд',
  'models.form.backend_parameters': 'Параметры бэкенда',
  'models.instance.params.configured': 'User Configured',
  'models.instance.params.autoInjected': 'Автовнедрённые параметры',
  'models.search.gguf.tips':
    'GGUF-модели используют llama-box (поддерживает Linux, macOS и Windows).',
  'models.search.vllm.tips':
    'Не-GGUF модели используют vox-box для аудио и vLLM (только x86 Linux) для остальных.',
  'models.search.voxbox.tips':
    'Для развертывания аудиомодели снимите отметку GGUF.',
  'models.form.ollamalink':
    'Больше моделей в библиотеке <a href="https://www.ollama.com/library" target="_blank">Ollama</a>',
  'models.form.backend_parameters.llamabox.placeholder':
    'например: --ctx-size=8192（параметр и значение разделены знаком = или пробелом）',
  'models.form.backend_parameters.vllm.placeholder':
    'например: --max-model-len=8192（параметр и значение разделены знаком = или пробелом）',
  'models.form.backend_parameters.sglang.placeholder':
    'например: --context-length=8192（параметр и значение разделены знаком = или пробелом）',
  'models.form.backend_parameters.vllm.tips':
    'Для получения подробной информации о параметрах {backend} см. <a href={link} target="_blank">здесь</a>.',
  'models.logs.pagination.prev': 'Предыдущие {lines} строк',
  'models.logs.pagination.next': 'Следующие {lines} строк',
  'models.logs.pagination.last': 'Последняя страница',
  'models.logs.pagination.first': 'Первая страница',
  'models.logs.pagination.jump': 'Перейти к странице',
  'models.form.localPath': 'Локальный путь',
  'models.form.filePath': 'Путь к модели',
  'models.form.backendVersion': 'Версия бэкенда',
  'models.form.backendVersion.tips':
    'Чтобы использовать желаемую версию {backend} {version}, система автоматически создаст виртуальную среду в онлайн-окружении для установки соответствующей версии. После обновления GPUStack версия бэкенда останется зафиксированной. {link}',
  'models.form.gpuselector': 'Селектор GPU',
  'models.form.backend.llamabox':
    'Для моделей формата GGUF. Поддержка Linux, macOS и Windows.',
  'models.form.backend.vllm':
    'Built-in support for NVIDIA, AMD, Ascend, Hygon, Moore Threads, Iluvatar, MetaX, T-Head PPU devices.',
  'models.form.backend.voxbox': 'Поддерживает только GPU NVIDIA и CPU.',
  'models.form.backend.mindie': 'Поддерживает только Ascend NPU.',
  'models.form.backend.sglang':
    'Built-in support for NVIDIA, AMD, Ascend, Moore Threads, MetaX, T-Head PPU devices.',
  'models.form.search.gguftips':
    'Для воркеров на macOS/Windows отметьте GGUF (для аудиомоделей снимите).',
  'models.form.button.addlabel': 'Добавить метку',
  'models.filter.category': 'Фильтр по категориям',
  'models.list.more.logs': 'Показать больше',
  'models.catalog.release.date': 'Дата выпуска',
  'models.localpath.gguf.tips.title': 'Модель формата GGUF',
  'models.localpat.safe.tips.title': 'Модель формата Safetensors',
  'models.localpath.shared.tips.title': 'Шардированная GGUF-модель',
  'models.localpath.gguf.tips':
    'Укажите файл модели, например: /data/models/model.gguf.',
  'models.localpath.safe.tips':
    'Укажите директорию модели с файлами .safetensors и config.json.',
  'models.localpath.chunks.tips':
    'Укажите первый шард модели, например: /data/models/model-00001-of-00004.gguf.',
  'models.form.replicas.tips':
    'Несколько реплик обеспечивают балансировку нагрузки для { api } запросов.',
  'models.table.list.empty': 'Модели отсутствуют!',
  'models.table.list.getStart':
    '<span style="margin-right: 5px;font-size: 13px;">Начните работу с</span> <span style="font-size: 14px;font-weight: 700">DeepSeek-R1-Distill-Qwen-1.5B</span>',
  'models.table.llamaAcrossworker': 'Llama-box между воркерами',
  'models.table.vllmAcrossworker': 'vLLM между воркерами',
  'models.form.releases': 'Релизы',
  'models.form.moreparameters': 'Описание параметров',
  'models.table.vram.allocated': 'Выделенная VRAM',
  'models.table.vram.workers': '{n} рабочих узлов',
  'models.instance.workergpu': '{n} воркеров / {m} GPU',
  'models.instance.mainworker': 'Главный воркер (Main)',
  'models.instance.worker': 'Воркер',
  'models.instance.workerip': 'IP:Port воркера',
  'models.form.backend.warning':
    'Выбранный бэкенд не поддерживает модели GGUF. Пожалуйста, добавьте бэкенд с поддержкой GGUF в разделе Бэкенды вывода.',
  'models.form.backend.warning.gguf':
    'Пожалуйста, убедитесь, что выбранный пользовательский бэкенд поддерживает модели GGUF.',
  'models.form.ollama.warning':
    'Чтобы развернуть бэкенд для моделей Ollama с использованием llama-box , выполните следующие шаги.',
  'models.form.backend.warning.llamabox':
    'Чтобы использовать бэкенд llama-box , укажите полный путь к файлу модели (например,<span style="font-weight: 700">/data/models/model.gguf</span>). Для шардированных моделей укажите путь к первому шарду (например,<span style="font-weight: 700">/data/models/model-00001-of-00004.gguf</span>).',
  'models.form.keyvalue.paste':
    'Вставьте несколько строк текста, где каждая строка содержит пару ключ-значение. Ключ и значение разделяются знаком равенства (=), а разные пары — символами новой строки.',
  'models.form.files': 'Файлы',
  'models.table.status': 'Статус',
  'models.form.submit.anyway': 'Отправить в любом случае',
  'models.form.evaluating': 'Анализ совместимости модели',
  'models.form.incompatible': 'Обнаружена несовместимость',
  'models.form.nativeAnthropicApi': 'Нативный Anthropic API',
  'models.form.nativeAnthropicApi.tips':
    'Включите, если сервер инференса сам реализует Anthropic Messages API (например, свежие версии vLLM): тогда запросы к /v1/messages доходят до него как есть. Если выключено, /v1/messages по-прежнему работает, но сначала преобразуется в /v1/chat/completions.',
  'models.form.restart.onerror': 'Автоперезапуск при ошибке',
  'models.form.restart.onerror.tips':
    'При возникновении ошибки система автоматически попытается перезапуститься.',
  'models.form.check.params': 'Проверка конфигурации...',
  'models.form.check.passed': 'Проверка совместимости пройдена',
  'models.form.check.claims':
    'Модель требует примерно {vram} VRAM и {ram} RAM.',
  'models.form.check.claims2': 'Модель требует примерно {vram} VRAM.',
  'models.form.check.claims3': 'Модель требует примерно {ram} RAM.',
  'models.form.check.claims.group':
    'Группа требует примерно {vram} VRAM и {ram} RAM суммарно.',
  'models.form.check.claims.role':
    '{role} × {replicas}: примерно {vram} VRAM на реплику',
  'models.form.check.claims.role.total':
    '{role} × {replicas}: примерно {vram} VRAM суммарно',
  'models.form.check.claims.role.ram':
    '{role} × {replicas}: примерно {ram} RAM суммарно',
  'models.form.update.tips':
    'Изменения вступят в силу только после удаления и повторного создания инстанса.',
  'models.table.download.progress': 'Прогресс',
  'models.table.button.apiAccessInfo': 'Доступ к API',
  'models.table.button.apiAccessInfo.tips':
    'Для интеграции этой модели со сторонними приложениями используйте следующие данные: URL доступа, имя модели и ключ API. Эти учетные данные необходимы для обеспечения правильного подключения и использования сервиса модели.',
  'models.table.apiAccessInfo.endpoint': 'URL доступа',
  'models.table.apiAccessInfo.modelName': 'Имя модели',
  'models.table.apiAccessInfo.apikey': 'Ключ API',
  'models.table.apiAccessInfo.openaiCompatible': 'Совместимо с OpenAI',
  'models.table.apiAccessInfo.anthropicCompatible': 'Совместимо с Anthropic',
  'models.table.apiAccessInfo.jinaCompatible': 'Совместимо с Jina',
  'models.table.apiAccessInfo.gotoCreate': 'Перейти к созданию',
  'models.search.parts': '{n} частей',
  'models.search.evaluate.error': 'Возникла ошибка при вычислении: ',
  'models.ollama.deprecated.title': 'Объявление об устаревании',
  'models.ollama.deprecated.current':
    '<span class="bold-text">Текущая версия (v0.6.1): </span>Модели Ollama в настоящее время доступны для использования.',
  'models.ollama.deprecated.upcoming':
    '<span class="bold-text">Предстоящая версия (v0.7.0): </span>Источник моделей Ollama будет удалён из интерфейса.',
  'models.ollama.deprecated.following':
    '<span class="bold-text">После обновления до версии (v0.7.0),</span> все ранее развёрнутые модели продолжат работать в обычном режиме.',
  'models.ollama.deprecated.issue':
    'См. связанную проблему: <a href="https://github.com/gpustack/gpustack/issues/1979" target="_blank">#1979 on GitHub</a>.',
  'models.ollama.deprecated.notice':
    'Источник моделей Ollama объявлен устаревшим начиная с версии v0.6.1. Подробности см. в  <a href="https://github.com/gpustack/gpustack/issues/1979" target="_blank">соответствующем issue на GitHub</a>.',
  'models.backend.mindie.310p':
    'Ascend 310P поддерживает только FP16, поэтому необходимо установить --dtype=float16.',
  'models.form.gpuCount': 'GPU на реплику',
  'models.form.gpuType': 'Тип GPU',
  'models.form.optimizeLongPrompt': 'Оптимизировать длинные промпты',
  'models.form.enableSpeculativeDecoding':
    'Включить спекулятивное декодирование',
  'models.form.check.clusterUnavailable': 'Текущий кластер недоступен',
  'models.form.check.otherClustersAvailable':
    'Доступные кластеры: {clusters}. Пожалуйста, переключитесь на другой кластер.',
  'models.button.accessSettings': 'Настройки доступа',
  'models.table.accessScope': 'Область доступа',
  'models.table.accessScope.all': 'Все пользователи',
  'models.table.userSelection': 'Выбор пользователей',
  'models.button.accessSettings.tips':
    'Изменения в настройках доступа вступают в силу через одну минуту.',
  'models.table.userSelection.tips':
    'Администраторы по умолчанию имеют доступ ко всем моделям.',
  'models.table.filterByName': 'Фильтр по имени пользователя',
  'models.table.admin': 'Администратор',
  'models.table.noselected': 'Пользователи не выбраны',
  'models.table.users.all': 'Все пользователи',
  'models.table.users.selected': 'Выбранные пользователи',
  'models.table.nouserFound': 'Пользователи не найдены',
  'models.form.performance': 'Производительность',
  'models.form.gpus.notfound': 'GPU не найдены',
  'models.form.extendedkvcache': 'Включить расширенный KV-кэш',
  'models.form.chunkSize': 'Размер чанков кэша',
  'models.form.maxCPUSize': 'Максимальный размер CPU кэша (ГиБ)',
  'models.form.remoteURL': 'URL удаленного хранилища',
  'models.form.remoteURL.tips':
    'Подробности см. в <a href="https://docs.lmcache.ai/api_reference/configurations.html" target="_blank">документации по конфигурации</a>.',
  'models.form.runCommandPlaceholder':
    'напр., vllm serve Qwen/Qwen2.5-1.5B-Instruct',
  'models.accessSettings.public': 'Публичный',
  'models.accessSettings.authed': 'Аутентифицированный',
  'models.accessSettings.allowedUsers': 'Разрешенные пользователи',
  'models.accessSettings.public.tips':
    'При публичном доступе любой пользователь может получить доступ к модели без аутентификации, что может привести к риску утечки данных.',
  'models.table.button.deploy': 'Развернуть сейчас',
  'models.form.backendVersion.holder': 'Введите или выберите версию',
  'models.form.gpusperreplica': 'GPU на реплику',
  'models.form.gpusAllocationType': 'Тип распределения GPU',
  'models.form.gpusAllocationType.auto': 'Авто',
  'models.form.gpusAllocationType.custom': 'Вручную',
  'models.form.gpusAllocationType.auto.tips':
    'Система автоматически вычисляет количество GPU на реплику, по умолчанию используя степени двойки и ограничиваясь выбранными GPU.',
  'models.form.gpusAllocationType.custom.tips':
    'Вы можете указать точное количество GPU на реплику.',
  'models.mymodels.status.inactive': 'Остановлен',
  'models.mymodels.status.degrade': 'Не готов',
  'models.mymodels.status.active': 'Готов',
  'models.form.kvCache.tips':
    'Расширенный KV-кэш и спекулятивное декодирование доступны только для встроенных бэкендов (vLLM / SGLang). Пожалуйста, переключите бэкенд, чтобы включить их.',
  'models.form.kvCache.tips2':
    'Поддерживается только при использовании встроенных бэкендов вывода (vLLM или SGLang).',
  'models.form.kvCache.backend': 'Cache Backend',
  'models.form.kvCache.local': 'In-Process Cache',
  'models.form.kvCache.service.tips':
    'Only cache services in the same cluster and compatible with the selected backend are listed.',
  'models.form.kvCache.shared.builtinBackends':
    'Cache Service поддерживается только для встроенных бэкендов vLLM и SGLang.',
  'models.kvCache.degraded.tips':
    'Shared KV cache is not active for this instance',
  'models.kvCache.endpointDead.tips':
    'The shared cache this instance attached to is no longer available; restart the instance to recover',
  'models.kvCache.service': 'Cache Service',
  'models.kvCache.hitRate': 'External Cache Hit Rate ({window})',
  'models.kvCache.hitRate.window': '1h',
  'models.form.scheduling': 'Планирование',
  'models.form.scaling': 'Плановое масштабирование',
  'models.form.scaling.enable': 'Включить плановое масштабирование',
  'models.form.scaling.enable.tips':
    'Изменять количество реплик в повторяющихся временных окнах (например, больше днём и меньше ночью). Вне всех окон модель использует настроенное количество реплик в качестве базового значения.',
  'models.form.scaling.tz.note':
    'Время расписания использует общесерверный часовой пояс (GPUSTACK_TIMEZONE, по умолчанию — часовой пояс сервера).',
  'models.form.scaling.rules': 'Правила',
  'models.form.scaling.cron': 'Выражение cron',
  'models.form.scaling.useCron': 'Использовать CRON-выражение',
  'models.form.scaling.repeat': 'Повтор',
  'models.form.scaling.repeat.daily': 'Каждый день',
  'models.form.scaling.repeat.weekdays': 'Будни (Пн–Пт)',
  'models.form.scaling.repeat.weekends': 'Выходные (Сб–Вс)',
  'models.form.scaling.repeat.weekly': 'Каждую неделю',
  'models.form.scaling.repeat.monthly': 'Ежемесячно',
  'models.form.scaling.repeat.cron': 'CRON',
  'models.form.scaling.weekdaysLabel': 'Дни недели',
  'models.form.scaling.monthdaysLabel': 'Дни месяца',
  'models.form.scaling.startTime': 'Время начала',
  'models.form.scaling.endTime': 'Время окончания',
  'models.form.scaling.crossDay': 'Заканчивается на следующий день',
  'models.form.scaling.nextDayBadge': '+1 дн.',
  'models.form.scaling.timezone': 'Часовой пояс',
  'models.form.scaling.tz.all': 'Все расписания используют часовой пояс {tz}',
  'models.form.scaling.duration': 'Длительность',
  'models.form.scaling.durationUnit': 'Единица времени',
  'models.form.scaling.windowReplicas': 'Реплики в окне',
  'models.form.scaling.unit.minutes': 'Минуты',
  'models.form.scaling.unit.hours': 'Часы',
  'models.form.scaling.unit.days': 'Дни',
  'models.form.scaling.startCron': 'Начало окна',
  'models.form.scaling.endCron': 'Конец окна',
  'models.form.scaling.baseline': 'Базовое количество реплик',
  'models.form.scaling.baseline.tips':
    'Количество реплик, используемое, когда текущее время вне всех окон.',
  'models.form.scaling.baselineNote':
    'Значение Replicas, заданное выше, используется как базовое — количество реплик, применяемое, когда текущее время вне всех окон.',
  'models.form.scaling.cron.invalid': 'Недопустимое выражение cron',
  'models.form.scaling.meaning': 'Сводка',
  'models.form.scaling.summary.monthDays': 'День {days}',
  'models.form.scaling.freq.minute': 'Каждую минуту',
  'models.form.scaling.freq.hour': 'Раз в час',
  'models.form.scaling.freq.day': 'Раз в день',
  'models.form.scaling.freq.week': 'Раз в неделю',
  'models.form.scaling.freq.month': 'Раз в месяц',
  'models.form.scaling.freq.year': 'Раз в год',
  'models.form.scaling.next': 'Следующее окно:',
  'models.form.scaling.current': 'Текущее окно:',
  'models.form.scaling.addRule': 'Добавить правило',
  'models.form.scaling.removeRule': 'Удалить правило',
  'models.form.scaling.rules.required':
    'Добавьте хотя бы одно правило или отключите плановое масштабирование.',
  'models.form.scaling.hint':
    'Каждое правило открывает окно в момент начала на заданную длительность и держит своё количество реплик. Вне всех окон модель использует базовое количество реплик, указанное выше. При перекрытии окон действует то, что началось позже всех.',
  'models.form.scaling.conflict':
    'Конфликт: правила с одинаковым временем начала ({times}) имеют разное количество реплик. Задайте одинаковое количество реплик или разное время начала.',
  'models.form.scaling.overlap':
    'Перекрытие: окна ({times}) перекрываются; в местах перекрытия действует правило, начавшееся позже.',
  'models.form.ramRatio': 'Соотношение ОЗУ к VRAM',
  'models.form.ramSize': 'Максимальный размер ОЗУ (ГиБ)',
  'models.form.ramRatio.tips':
    'Соотношение системной оперативной памяти к видеопамяти GPU, используемое для KV-кэша. Например, 2.0 означает, что кэш в ОЗУ может быть в два раза больше, чем в видеопамяти GPU.',
  'models.form.ramSize.tips':
    'Максимальный размер KV-кэша, хранящегося в системной памяти (ГиБ). Если задано, это значение переопределяет "{content}".',
  'models.form.chunkSize.tips': 'Количество токенов на чанк KV-кэша.',
  'models.form.mode': 'Режим',
  'models.form.algorithm': 'Алгоритм',
  'models.form.draftModel': 'Черновая модель',
  'models.form.numDraftTokens': 'Количество черновых токенов',
  'models.form.ngramMinMatchLength': 'Минимальная длина совпадения N-граммы',
  'models.form.ngramMaxMatchLength': 'Максимальная длина совпадения N-граммы',
  'models.form.mode.throughput': 'Пропускная способность',
  'models.form.mode.latency': 'Задержка',
  'models.form.mode.baseline': 'Стандартный',
  'models.form.mode.throughput.tips':
    'оптимизировано для высокой пропускной способности при высокой конкурентности запросов.',
  'models.form.mode.latency.tips':
    'оптимизировано для низкой задержки при низкой конкурентности запросов.',
  'models.form.mode.baseline.tips':
    'наиболее совместимый вариант с полной точностью.',
  'models.form.draftModel.placeholder': 'Выберите или введите черновую модель',
  'models.form.draftModel.tips':
    'Вы можете ввести локальный путь (например, /path/to/model) или выбрать модель из Hugging Face или ModelScope (например, Tengyunw/qwen3_8b_eagle3). Система автоматически сопоставит модель на основе источника основной модели.',
  'models.form.quantization': 'Квантование',
  'models.form.backend.custom': 'Пользовательский',
  'models.form.rules.name':
    'До 63 символов; только буквы, цифры, точки (.), подчёркивания (_) и дефисы (-); должно начинаться и заканчиваться буквенно-цифровым символом.',
  'models.catalog.button.explore': 'Исследовать больше моделей',
  'models.catalog.precision': 'Точность',
  'models.form.gpuPerReplica.tips': 'Введите произвольное число',
  'models.form.generic_proxy': 'Включить универсальный прокси',
  'models.form.enableModelRoute': 'Enable Model Route',
  'models.form.enableModelRoute.tips': 'Enable Model Route',
  'models.form.generic_proxy.tips':
    'После включения универсального прокси вы можете получать доступ к URI-путям, которые не следуют стандарту OpenAI API.',
  'models.form.generic_proxy.button': 'Универсальный прокси',
  'models.accessControlModal.includeusers': 'Включить пользователей',
  'models.table.genericProxy':
    'Используйте следующий префикс пути и укажите имя модели либо в заголовке запроса <span class="bold-text">X-GPUStack-Model</span>, либо в поле model в теле запроса. Все запросы с этим префиксом пути будут перенаправлены в бэкенд вывода.',
  'models.form.backendVersion.deprecated': 'Устаревший',
  'models.accessSettings.public.desc': 'Доступно всем без аутентификации.',
  'models.accessSettings.authed.tips':
    'Доступно всем аутентифицированным пользователям платформы.',
  'models.accessSettings.allowedUsers.tips':
    'Доступ к модели имеют только назначенные пользователи.',
  'models.form.backendVersions.tips': `Чтобы использовать больше версий, перейдите на страницу {link} и отредактируйте бэкенд для добавления версий.`,
  'models.catalog.nogpus.tips':
    'В выбранном кластере нет доступных GPU, совместимых с этой моделью.',
  'models.form.modelfile.notfound': `Указанный путь к файлу модели не существует на сервере GPUStack. Рекомендуется размещать файл модели по одному и тому же пути как на сервере GPUStack, так и на воркерах GPUStack. Это поможет системе принимать лучшие решения по распределению ресурсов.`,
  'models.form.readyWorkers': 'воркеров готово',
  'models.form.maxContextLength': 'Maximum Context Length',
  'models.form.backend.helperText':
    'Not enabled yet. Will be enabled after deployment. ',
  'models.table.instance.benchmark': 'Run Benchmark',
  'models.table.modelView': 'Model List',
  'models.table.instanceView': 'Instance List',
  'models.table.category': 'Category',
  'models.instance.currentRun': 'Current Run',
  'models.instance.previousRun': 'Previous Run',
  'models.instance.startHistory': 'Run History',
  'models.instance.startHistory.tips':
    'Shows logs from the run before the last error-triggered restart.',
  'models.instance.logs.downloading': 'Загрузка… {size}',
  'models.instance.logs.downloadingPercent': 'Загрузка… {percent}%',
  'models.form.lora.label': 'LoRA Adapters',
  'models.form.lora.add': 'Add LoRA Adapter',
  'models.form.lora.select': 'Select LoRA',
  'models.form.lora.name': 'LoRA name',
  'models.form.lora.rule.empty': 'Input cannot be empty',
  'models.form.lora.rule.duplicate': 'LoRA name cannot be duplicated',
  // Model catalog source configuration
  'models.catalog.source.title': 'Источник каталога',
  'models.catalog.source.official':
    'Follows the catalog GPUStack publishes, on top of the one packaged with this release.',

  // --- Prefill/decode disaggregation ---
  'models.form.pd.section': 'Настройки разделения PD',
  'models.form.pd.enable': 'Включить',
  // Why the server derived no transport. Keyed by `PDModeUnresolvedCode`;
  // the server also sends English prose, which is rendered only when this
  // catalog has no entry for the code it sent.
  'models.form.pd.unresolved.vendor_not_in_cluster':
    'В этом кластере нет ускорителей {vendor} (есть: {vendors}).',
  'models.form.pd.unresolved.vendors_unknown':
    'Ускорители кластера ещё неизвестны, поэтому схему передачи нельзя определить.',
  'models.form.pd.unresolved.no_built_in_recipe':
    'Нет встроенной схемы для {backend} на {vendors}. Выберите «Пользовательскую» схему передачи и задайте параметры подключения самостоятельно.',
  'models.form.pd.unresolved.multiple_vendors':
    'В кластере несколько производителей ускорителей, способных разместить группу ({vendors}), а группа PD не может охватывать разных производителей. Выберите одного.',
  'models.form.pd.unresolved.no_preferred_recipe':
    'Подходит несколько схем, но ни одна не помечена как предпочтительная.',
  'models.form.pd.unresolved.thisEngine': 'этот движок',
  'models.form.pd.enable.off': 'Выключено',
  'models.form.pd.enable.on': 'Разделение PD',
  'models.form.pd.enable.tips':
    'Разделяет префилл и декодирование по разным экземплярам за счёт дополнительного сетевого перехода и одной передачи KV. При низкой конкурентности, коротких запросах или высоком попадании в кэш префиксов агрегированное развёртывание обычно быстрее. Сначала снимите базовые показатели.',
  'models.form.pd.shape.mono': 'Агрегированное развёртывание',
  'models.form.pd.shape.mono.tips':
    'Один экземпляр выполняет и prefill, и decode.',
  'models.form.pd.shape.pd': 'Разделение PD',
  'models.form.pd.shape.pd.tips':
    'Prefill и decode работают как отдельные роли, каждая со своим движком, параметрами и числом реплик.',
  'models.form.pd.shape.current': 'Текущее',
  'models.form.pd.mode': 'Транспорт',
  'models.form.pd.mode.holder': 'Выберите транспорт',
  'models.form.pd.mode.tips':
    'Все параметры соединения - connector, порты, адреса узлов - выводятся из выбранного режима и не задаются вручную.',
  'models.form.pd.mode.custom.tips':
    'В пользовательском режиме параметры соединения не подставляются: --kv-transfer-config, порты и адреса узлов задаёте вы.',
  'models.form.pd.mode.backend.mismatch':
    'Требуется {targets}, выбран движок {backend}. Для смешивания движков по ролям используйте режим «Пользовательский».',
  'models.form.pd.mode.runtime.mismatch':
    'Требуются ускорители {runtime}; {scope, select, partition{в выбранном разделе} other{в этом кластере}} есть только {vendors}.',
  'models.form.pd.mode.only.custom':
    'Для этого сочетания движка и ускорителя нет встроенного рецепта. Режим «Пользовательский» по-прежнему доступен: коннектор, порты и переменные рукопожатия задаёте вы.',
  'models.form.pd.vendor': 'Производитель ускорителя',
  'models.form.pd.vendor.tips':
    'В этом кластере несколько производителей ускорителей могут разместить группу, а группа PD не может охватывать разных производителей — тракт передачи KV различается. Выберите раздел для развёртывания.',
  'models.form.pd.replicas.moved':
    'Количество реплик в развёртывании PD задаётся для каждой роли отдельно.',
  'models.form.pd.disabled.gguf':
    'Разделение PD поддерживается только движками vLLM и SGLang; эта модель в формате GGUF.',
  'models.form.pd.disabled.backend':
    'Разделение PD поддерживается только движками vLLM и SGLang. Остальные доступны через режим «Пользовательский».',
  'models.form.pd.disabled.schedule':
    'Плановое масштабирование недоступно для развёртывания PD. Меняйте число реплик по ролям.',
  'models.form.pd.cache.cleared':
    'В развёртывании PD кэш KV настраивается по ролям; настройка на уровне модели очищена. Выберите её для нужных ролей.',
  'models.form.roles': 'Роли',
  'models.form.roles.prefill': 'Prefill',
  'models.form.roles.decode': 'Decode',
  'models.form.roles.router': 'Router',
  'models.form.roles.override': 'Пользовательские',
  'models.form.roles.inherited': 'Наследуется',
  'models.form.roles.group.backend': 'Движок и образ',
  'models.form.roles.group.parameters': 'Параметры и переменные среды',
  'models.form.roles.group.scheduling': 'Ресурсы и планирование',
  'models.form.roles.group.backend.tips':
    'Если не менять, роль использует движок и образ самой модели.',
  'models.form.roles.group.scheduling.tips':
    'Если не менять, планировщик сам выберет карты, опираясь на заданную выше топологическую близость.',
  'models.form.roles.group.cache': 'Общий кэш KV',
  'models.form.roles.group.settings': 'Настройки группы',
  'models.form.roles.group.settings.tips': 'Применяются ко всем ролям',
  'models.form.roles.replicas': 'Реплики',
  'models.form.roles.router.routeArgs': 'Аргументы маршрутизации',
  'models.form.roles.router.routeArgs.tips':
    'Аргументы командной строки, с которыми запускается процесс router. Строки с замком формирует GPUStack по месту размещения группы; редактировать их нельзя.',
  'models.form.roles.router.locality':
    'Только CPU; размещается автоматически, по возможности рядом с prefill и decode этой группы',
  'models.form.roles.router.workerAllocation': 'Назначение Worker',
  'models.form.roles.router.workerSelect': 'Селектор воркера',
  'models.form.roles.router.scheduletype.tips':
    'Автоматически: среди узлов, прошедших селектор, предпочитается тот, где уже работает prefill или decode этой группы. Вручную: указать Worker напрямую.',
  'models.form.roles.router.workerSelector.tips':
    'Сужает список кандидатов по меткам. Среди подходящих по-прежнему предпочитается ближайший к prefill и decode этой группы.',
  'models.form.roles.router.order.tips':
    'Router создаётся после готовности Prefill и Decode.',
  'models.form.roles.router.custom.forced':
    'Режим «Пользовательский» не выводит Router. Укажите его образ и команду запуска.',
  'models.form.roles.router.peers':
    'Адреса экземпляров Prefill / Decode подставляются системой после развёртывания.',
  'models.form.roles.cache.holder': 'Не используется',
  'models.form.roles.cache.tips':
    'Способ подключения и порядок приоритета выводятся системой; настройка не требуется.',
  'models.form.roles.cache.custom.conflict':
    'В пользовательском режиме нужен --kv-transfer-config в параметрах движка, поэтому кэш-сервис выбрать нельзя.',
  'models.form.roles.cache.param.conflict':
    'Конфликтует с выбранным режимом PD. Переключитесь на «Пользовательский» или удалите --kv-transfer-config.',
  'models.state.pending': 'Ожидание',
  'models.state.partial': 'Частично готово',
  'models.state.running': 'Работает',
  'models.state.error': 'Ошибка',
  'models.form.speculativeDecoding': 'Спекулятивное декодирование',
  'models.pd.tag': 'PD',
  'models.pd.roles.detail': 'Состояние по ролям',
  'models.pd.degraded.cache':
    'Часть участников работает без общего кэша KV; причина — в карточке экземпляра.',
  'models.pd.degraded.ratio':
    'Готовых участников меньше, чем запрошено; развёртывание работает с меньшей ёмкостью.',
  'models.form.roles.override.empty':
    'В этой группе нет ни одного значения, поэтому она будет сохранена как наследующая конфигурацию уровня модели. Заполните хотя бы одно поле, чтобы оставить её пользовательской.',
  'models.form.pd.mode.cleared':
    'Режим PD был сброшен при отключении разделения. Выберите его заново.',
  'models.form.pd.engineVersion.below':
    'Выбранный рецепт PD объявляет поддержку версий движка {range}, а это развёртывание закрепляет {version}. Развернуть всё равно можно — у собственного образа может быть приватный номер версии, — но если версия действительно ниже нижней границы, в ней может не быть поведения, на которое рассчитывает рецепт, например снятия с регистрации уменьшенного участника.',
  'models.pd.degraded.pairing':
    'Ни один участник prefill не делит хост ни с одним участником decode, поэтому каждая передача KV идёт по сети. На линии без RDMA это обычно медленнее, чем вообще не разделять роли. Разместите хотя бы одну пару на одном хосте или выберите для обеих ролей GPU одного и того же хоста.',
  'models.pd.degraded.gather':
    'Ниже цели по топологии: участники расположены дальше друг от друга, чем требовалось',
  'models.pd.degraded.scaleOut':
    'Группа закреплена за одним топологическим доменом в строгом режиме, а участник, которого требовалось добавить, так и не был размещён. Уже работающие участники продолжают обслуживать запросы как обычно — остановилось именно расширение. Что именно помешало, указано в сообщении о состоянии этого участника; исходя из него освободите ёмкость внутри домена, смягчите топологическое ограничение или верните прежнее число реплик.',
  'models.pd.degraded.engineVersion':
    'Закреплённая версия движка ниже диапазона, поддержку которого объявляет выбранный PD-рецепт. Это допустимо — у самостоятельно собранного образа может быть собственный номер версии, — но поведения, на которое рассчитывает рецепт, может не оказаться: например, на SGLang ниже 0.5.7 участника, выведенного при уменьшении числа реплик, нельзя снять с регистрации, и он продолжает принимать трафик.',
  'models.pd.degraded.pairingUnverified':
    'Одна роль задаёт параметр связывания явно, а другая оставляет его значению движка по умолчанию, поэтому GPUStack не смог проверить их согласованность — обычно это --max-model-len, --block-size, --kv-cache-layout либо auto с одной стороны против явного dtype с другой. Это не значит, что пара настроена неверно, — значит, что её никто не проверил. Укажите параметр в обеих ролях, чтобы он проверялся.',
  'models.pd.degraded.pairingTP':
    'Эффективная тензорная параллельность, пересчитанная по картам, которые участники действительно получили, нарушает направление, объявленное этим PD-рецептом: NIXL требует, чтобы decode был не уже prefill, Ascend Mooncake — чтобы prefill был не уже decode. На приёме это не поймать: у роли, которая не закрепляет карты и не задаёт --tensor-parallel-size, до размещения нет числа для проверки. Задайте --tensor-parallel-size в обеих ролях или выделите им количество GPU, допустимое рецептом.',
  'models.pd.admission.infeasible':
    'Доступной ёмкости недостаточно для этой группы (требуется {required}, доступно {available}). Уменьшите число реплик, выберите нарезанный тип карты или добавьте узлы.',
  'models.pd.ratio.waiting':
    'Соотношение {configured} (сейчас {current}, ожидается {role})',
  'models.instance.draining.tips':
    'Масштабирование вниз. Экземпляр больше не принимает новые запросы и продолжает работать, пока decode-узлы не дочитают его KV-кеш, после чего удаляется.',
  'models.pd.group.restarting.brief': 'Перезапуск…',
  'models.pd.group.restarting.progress':
    'Перезапуск группы: её участники были намеренно остановлены и сейчас пересоздаются, готово {ready}/{total}. Счётчики реплик занижены именно поэтому, а не из-за сбоя.',
  'models.pd.group.restart.confirm':
    'Это изменение требует перезапуска всей группы PD: сначала останавливаются все {total} экземпляров, затем они пересоздаются с новой конфигурацией; в это время модель недоступна.',
  'models.pd.instance.stale':
    'Этот экземпляр работает на старой конфигурации; перезапустите группу, чтобы применить изменение.',
  'models.pd.stale':
    'Конфигурация изменена; перезапустите развёртывание, чтобы применить.',
  'models.restart': 'Перезапустить',
  'models.restart.inflight': 'Перезапуск…',
  'models.restart.confirm':
    'Все экземпляры {name} будут остановлены и пересозданы с текущей конфигурацией. В это время модель будет недоступна.',
  'models.restart.done':
    'Перезапуск: экземпляры остановлены и будут пересозданы с текущей конфигурацией.',
  'models.restart.uptodate':
    'Перезапускать нечего: в этом развёртывании нет работающих экземпляров.',
  'models.restart.inprogress':
    'Перезапуск уже выполняется. Дождитесь его завершения и повторите попытку.',
  'models.restart.failed': 'Не удалось перезапустить модель.',
  'models.stale.tag': 'Устарело',
  'models.pd.group.id': 'Группа',
  'models.form.pd.disabled.gpus':
    'Для разделения PD нужно не менее 2 доступных GPU (один Prefill, один Decode); в выбранном кластере доступно {count}.',
  'models.pd.ratio': 'Соотношение',
  'models.form.roles.router.entrypoint': 'Команда запуска',
  'models.form.roles.router.connectionArgs':
    'Параметры подключения (задаёт GPUStack)',
  'models.form.roles.managed': 'Управляется системой',
  'models.form.roles.managed.tips':
    'Заполняется GPUStack на основе режима PD и места размещения группы. Только для чтения, повторять эти значения не нужно. Значения в двойных фигурных скобках — это заполнители, которые при развёртывании заменяются реальными адресами, портами и сетевым интерфейсом.',
  'models.form.roles.managed.mounts': 'Монтирования хоста',
  'models.form.roles.managed.locked':
    'Строки с замком внедряются системой и недоступны для редактирования',
  'models.form.roles.engine': 'Движок',
  'models.form.roles.scheduling.managed':
    'Размещается планировщиком по заданной выше топологической близости, без собственных ограничений на узлы',
  'models.form.roles.managed.params.tips':
    'Аргументы, с которыми запускается движок этой роли. Строки с замком внедряет GPUStack на основе режима PD; ваши собственные добавляются после них.',
  'models.form.roles.managed.env.tips':
    'Переменные окружения контейнера этой роли. Строки с замком внедряет GPUStack — это в основном адреса управляющего плана и сетевой интерфейс.',
  'models.form.roles.managed.mounts.tips':
    'Пути с хоста, монтируемые в контейнер. Добавлять их может только GPUStack: это файлы хоста, нужные транспорту, которые среда выполнения ускорителя сама не подключает.',
  'models.form.roles.resources': 'Ресурсы',
  'models.form.roles.resources.cpu': 'CPU (ядра)',
  'models.form.roles.resources.memory': 'Память (ГиБ)',
  'models.form.roles.resources.tips':
    'Что запрашивает контейнер роутера. По умолчанию 2 ядра и 2 ГиБ.',
  'models.form.roles.router.health': 'Проверка состояния',
  'models.form.roles.router.peerslabel': 'Узлы',
  'models.form.roles.router.image.tips':
    'Оставьте пустым, чтобы использовать образ, выведенный из выбранного режима PD. Указывайте только если в этом образе нет исполняемого файла router — команда запуска всё равно выводится автоматически.',
  'models.form.roles.cpuonly': 'Только CPU',

  'models.form.gather.title': 'Топологическая аффинность',
  'models.form.gather.target.auto': 'Автоматически',
  'models.form.gather.target.auto.tips':
    'Самый быстрый подходящий путь передачи',
  'models.form.gather.target.host': 'Тот же Worker',
  'models.form.gather.target.host.tips': 'Prefill и Decode на одном Worker',
  'models.form.gather.target.layer': 'Один {layer}',
  'models.form.gather.target.tips':
    'Желаемое качество передачи между участниками группы. Передача внутри одного домена ускорителей быстрее, чем внутри стойки, поэтому домен, охватывающий несколько стоек, тоже считается подходящим. Router не занимает ускоритель и под это ограничение не попадает.',
  'models.form.gather.unmet': 'Если не помещается',
  'models.form.gather.unmet.prefer': 'Всё равно развернуть',
  'models.form.gather.unmet.prefer.tips':
    'Откатиться к следующему подходящему размещению и отметить модель как не достигшую цели по топологии',
  'models.form.gather.unmet.must': 'Отказать',
  'models.form.gather.unmet.must.tips':
    'Вместо того чтобы выдать более медленное развёртывание',
  'models.form.gather.fits': 'помещается',
  'models.form.gather.fits.domain': 'помещается в {domain}',
  'models.form.gather.short':
    'самый просторный {domain} вмещает {available} из {needed}',
  'models.form.gather.noRoom': 'на этом уровне нигде нет места',
  'models.form.gather.unknown':
    'на {count} воркер(ах) ёмкость неизвестна, поэтому проверить это нельзя',
  'models.form.gather.declare':
    'Заполните стойки в разделе «Топология» кластера, чтобы открыть более крупные уровни.',
  'models.form.gather.largeGroup':
    'При таком размере как минимум около {percent}% запросов образуют пару на одном хосте — независимо от топологии. Это нижняя граница, выведенная из числа реплик; реальная доля зависит от того, на скольких машинах в итоге окажется группа, и показывается в сводке группы после развёртывания. Ради локальности передачи KV рассмотрите вместо этого несколько групп меньшего размера.',
  'models.form.gather.spanning':
    '{role} требует {gpus} GPU, а самая широкая машина в этом кластере имеет {widest}, поэтому каждый участник занимает машины целиком: prefill и decode никогда не делят одну, а объединение в пары на хосте равно 0. KV всегда идёт между машинами — важно то, какой уровень выше удерживает его внутри.',
  'models.form.gather.checking': 'Проверяем, что помещается…',
  'models.form.gather.unavailable':
    'Сейчас не удалось проверить, что помещается, поэтому предлагается только значение по умолчанию.',
  'models.form.gather.retry': 'Повторить',
  'models.form.groupSettings': 'Настройки группы',
  'models.form.groupSettings.tips':
    'Их нельзя задать по-разному для ролей: одно значение применяется и к Prefill, и к Decode.',
  // Topology-aware gather tiers. One chain, root to leaf: the option list is
  // flat in chain order and the retreat line says what happens when a rung
  // does not fit. The `chain.*` group headings are gone with the second chain.
  'models.form.gather.goFill': 'Заполнить',
  'models.form.gather.infeasible.warning':
    'При текущей ёмкости эту группу разместить нельзя; после сохранения она будет ждать освобождения места. Варианты: переключиться на «как можно ближе» (может занять несколько хостов, KV-передача медленнее) · уменьшить число реплик или GPU на реплику'
};
