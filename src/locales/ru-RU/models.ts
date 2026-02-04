export default {
  'models.button.deploy': 'Развернуть модель',
  'models.title': 'Модели',
  'models.title.edit': 'Редактировать модель',
  'models.title.duplicate': 'Дублировать модель',
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
  'models.form.manual.schedule': 'Ручное распределение',
  'models.table.gpuindex': 'Индекс GPU',
  'models.table.backend': 'Бэкенды',
  'models.table.acrossworker': 'Распределение по воркерам',
  'models.table.cpuoffload': 'CPU оффлоуд',
  'models.table.layers': 'Слои',
  'models.form.backend': 'Бэкенд',
  'models.form.backend_parameters': 'Параметры бэкенда',
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
  'models.form.localPath': 'Локальный путь',
  'models.form.filePath': 'Путь к модели',
  'models.form.backendVersion': 'Версия бэкенда',
  'models.form.backendVersion.tips':
    'Чтобы использовать желаемую версию {backend} {version}, система автоматически создаст виртуальную среду в онлайн-окружении для установки соответствующей версии. После обновления GPUStack версия бэкенда останется зафиксированной. {link}',
  'models.form.gpuselector': 'Селектор GPU',
  'models.form.backend.llamabox':
    'Для моделей формата GGUF. Поддержка Linux, macOS и Windows.',
  'models.form.backend.vllm':
    'Встроенная поддержка устройств NVIDIA, AMD, Ascend, Hygon, Iluvatar и MetaX.',
  'models.form.backend.voxbox': 'Поддерживает только GPU NVIDIA и CPU.',
  'models.form.backend.mindie': 'Поддерживает только Ascend NPU.',
  'models.form.backend.sglang':
    'Встроенная поддержка GPU NVIDIA/AMD и Ascend NPU.',
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
  'models.form.restart.onerror': 'Автоперезапуск при ошибке',
  'models.form.restart.onerror.tips':
    'При возникновении ошибки система автоматически попытается перезапуститься.',
  'models.form.check.params': 'Проверка конфигурации...',
  'models.form.check.passed': 'Проверка совместимости пройдена',
  'models.form.check.claims':
    'Модель требует примерно {vram} VRAM и {ram} RAM.',
  'models.form.check.claims2': 'Модель требует примерно {vram} VRAM.',
  'models.form.check.claims3': 'Модель требует примерно {ram} RAM.',
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
  'models.form.scheduling': 'Планирование',
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
  'models.table.instance.benchmark': 'Run Benchmark'
};

// ========== To-Do: Translate Keys (Remove After Translation) ==========
// 1. 'models.form.maxContextLength': 'Maximum Context Length',
// 2. 'models.form.backend.helperText': 'Not enabled yet. Will be enabled after deployment. ',
// 3. 'models.table.instance.benchmark': 'Run Benchmark'
// 2. 'models.form.enableModelRoute': 'Enable Model Route',
// 3.  'models.form.enableModelRoute.tips': 'Enable Model Route',
// ========== End of To-Do List ==========
