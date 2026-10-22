export default {
  'backends.title': 'Бэкенды инференса',
  'backend.button.add': 'Добавить бэкенд',
  'backend.button.edit': 'Редактировать бэкенд',
  'backend.versions': 'Список версий',
  'backend.defaultVersion': 'Версия по умолчанию',
  'backend.version': 'Версия',
  'backend.imageName': 'Имя образа',
  'backend.runCommand': 'Команда выполнения',
  'backend.framework': 'Фреймворк',
  'backend.builtin': 'Встроенный',
  'backend.custom': 'Пользовательский',
  'backend.community': 'Сообщество',
  'backend.isDefault': 'По умолчанию',
  'backend.availableFrameworks': 'Поддерживаемые фреймворки',
  'backend.addVersion': 'Добавить версию',
  'backend.filter.framework': 'Фильтр по фреймворку',
  'backend.export.yaml': 'Экспорт YAML',
  'backend.mode.form': 'Режим формы',
  'backend.mode.yaml': 'Режим YAML',
  'backend.form.healthCheckPath': 'Путь проверки работоспособности',
  'backend.form.defaultEntrypoint': 'Точка входа образа по умолчанию',
  'backend.form.defaultExecuteCommand': 'Команда выполнения по умолчанию',
  'backend.form.defaultExecuteCommand.tips': `'{{'model_path'}}', '{{'port'}}', '{{'worker_ip'}}' и '{{'model_name'}}' заполняются реальными значениями во время запуска`,
  'backend.form.defaultBackendParameters': 'Параметры бэкенда по умолчанию',
  'backend.form.flagFormat': 'Формат флага',
  'backend.form.flagFormat.tips':
    'Формат соединения опции и её значения. Оставьте пустым, чтобы сохранить каждый параметр в исходном виде, без приведения к единому формату.',
  'backend.form.flagFormat.space': 'Разделение пробелом (--key value)',
  'backend.form.flagFormat.equal': 'Знак равенства (--key=value)',
  'backend.form.commonParameters': 'Общие параметры бэкенда',
  'backend.form.commonParameters.tips':
    'Отображаются как подсказки в поле параметров бэкенда при развёртывании.',
  'backend.form.versionConfig': 'Конфигурация версий',
  'backend.form.addParameter': 'Добавить параметр',
  'backend.form.noVersion': 'Версии не добавлены',
  'backend.noVersion': 'Версии не найдены',
  'backend.versionInfo.autoImage':
    'Автоматически выбирается во время выполнения',
  'backend.version.rules.builtin': 'Должен заканчиваться на "-custom"',
  'backend.version.no.tips':
    'Пользовательское название версии встроенного бэкенда должно оканчиваться на «-custom».',
  'backend.backend.rules.custom':
    'Пользовательское название бэкенда должно оканчиваться на «-custom».',
  'backend.quickConfig': 'Быстрая настройка',
  'backend.version.default.not.exists':
    'Версия по умолчанию отсутствует в {versions}.',
  'backend.replaceEntrypoint': 'Переопределить точку входа образа',
  'backend.entrypoint': 'Точка входа образа',
  'backend.entrypoint.tips':
    'Если указано, ENTRYPOINT, заданный в образе, будет проигнорирован, а вместо него для запуска контейнера будет использована команда ниже.',
  'backend.form.defaultEnvironment': 'Переменные окружения по умолчанию',
  'backend.recommendModels': 'Рекомендуемые модели',
  'backend.filter.source': 'Фильтр по источнику',
  'backend.add.custom': 'Пользовательский',
  'backend.add.community': 'Сообщество',
  'backend.community.title': 'Каталог бэкендов сообщества',
  'backend.form.add.hint':
    'Чтобы использовать другую версию встроенного бэкенда (например, vLLM, SGLang или MindIE), добавьте версию к существующему бэкенду вместо создания пользовательского бэкенда.',
  // Backend source configuration (built-in backend versions + community library)
  'backend.source.title': 'Источник бэкендов',
  'backend.source.builtin.title': 'Встроенный бэкенд',
  'backend.source.builtin.official':
    'Использует версии образов, которые GPUStack публикует для встроенных бэкендов (vLLM, SGLang, MindIE, VoxBox).',
  'backend.source.community.title': 'Бэкенд сообщества',
  'backend.source.community.official':
    'Использует публикуемый GPUStack список бэкендов сообщества в дополнение к списку, включённому в этот выпуск.'
};
