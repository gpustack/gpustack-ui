export default {
  'models.button.deploy': 'Развернуть модель',
  'models.title': 'Модели',
  'models.title.edit': 'Редактировать модель',
  'models.table.models': 'модели',
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
  'models.form.partialoffload.tips': `При включенном оффлоудинге на CPU: если ресурсов GPU недостаточно, часть слоёв модели будет перенесена на CPU. Если GPU отсутствует, будет использоваться полный вывод на CPU.`,
  'models.form.distribution.tips': `Позволяет переносить часть слоёв модели на один или несколько удалённых воркеров, когда ресурсов текущего воркера недостаточно.`,
  'models.openinplayground': 'Открыть в Песочнице',
  'models.instances': 'инстансы',
  'models.table.replicas.edit': 'Редактировать реплики',
  'model.form.ollama.model': 'Модель Ollama',
  'model.form.ollamaholder': 'Выберите или введите название модели',
  'model.deploy.sort': 'Сортировка',
  'model.deploy.search.placeholder': 'Type <kbd>/</kbd> to search models',
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
  'models.form.scheduletype.manual': 'Вручную',
  'models.form.scheduletype.auto.tips':
    'Автоматическое развертывание инстансов модели на подходящие GPU/воркеры в зависимости от текущих ресурсов.',
  'models.form.scheduletype.manual.tips':
    'Позволяет вручную указать GPU/воркеры для развертывания инстансов модели.',
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
    'например: --ctx-size=8192',
  'models.form.backend_parameters.vllm.placeholder':
    'например: --max-model-len=8192',
  'models.form.backend_parameters.vllm.tips':
    'Подробнее о параметрах {backend}',
  'models.logs.pagination.prev': 'Предыдущие {lines} строк',
  'models.logs.pagination.next': 'Следующие {lines} строк',
  'models.logs.pagination.last': 'Последняя страница',
  'models.logs.pagination.first': 'Первая страница',
  'models.form.localPath': 'Локальный путь',
  'models.form.filePath': 'Путь к модели',
  'models.form.backendVersion': 'Версия бэкенда',
  'models.form.backendVersion.tips':
    'Чтобы использовать желаемую версию {backend}, система автоматически создаст виртуальную среду в онлайн-окружении для установки соответствующей версии. После обновления GPUStack версия бэкенда останется зафиксированной. {link}',
  'models.form.gpuselector': 'Селектор GPU',
  'models.form.backend.llamabox':
    'Для моделей формата GGUF. Поддержка Linux, macOS и Windows.',
  'models.form.backend.vllm': 'Для моделей не-GGUF формата. Только x86 Linux.',
  'models.form.backend.voxbox': 'Для аудиомоделей не-GGUF формата.',
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
    'Бэкенд для моделей формата GGUF использует llama-box.',
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
  'models.form.check.passed': 'Compatibility Check Passed',
  'models.form.check.claims':
    'Модель требует примерно {vram} VRAM и {ram} RAM.',
  'models.form.check.claims2': 'Модель требует примерно {vram} VRAM.',
  'models.form.check.claims3': 'Модель требует примерно {ram} RAM.',
  'models.form.update.tips':
    'Changes will only apply after you delete and recreate the instance.',
  'models.table.download.progress': 'Download Progress',
  'models.table.button.apiAccessInfo': 'API Access Info',
  'models.table.button.apiAccessInfo.tips': `To integrate this model with third-party applications, use the following details: access URL, model name, and API key. These credentials are required to ensure proper connection and usage of the model service.`,
  'models.table.apiAccessInfo.enpoint': 'Access URL',
  'models.table.apiAccessInfo.modelName': 'Model Name',
  'models.table.apiAccessInfo.apikey': 'API Key',
  'models.table.apiAccessInfo.openaiCompatible': 'OpenAI Compatible',
  'models.table.apiAccessInfo.jinaCompatible': 'Jina Compatible',
  'models.table.apiAccessInfo.gotoCreate': 'Go to Create'
};

// ========== To-Do: Translate Keys (Remove After Translation) ==========
// 1. 'models.form.check.passed',
// 2. 'models.form.partialoffload.tips
// 3. 'model.deploy.search.placeholder',
// 4. 'models.form.update.tips',
// 5. 'models.table.download.progress,
// 6. 'models.table.button.apiAccessInfo',
// 7. 'models.table.button.apiAccessInfo.tips',
// 8. 'models.table.apiAccessInfo.enpoint',
// 9. 'models.table.apiAccessInfo.modelName',
// 10. 'models.table.apiAccessInfo.apikey',
// 11. 'models.table.apiAccessInfo.openaiCompatible',
// 12. 'models.table.apiAccessInfo.jinaCompatible',
// 13. 'models.table.apiAccessInfo.gotoCreate',
// ========== End of To-Do List ==========
