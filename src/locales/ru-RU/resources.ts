export default {
  'resources.title': 'Ресурсы',
  'resources.nodes': 'Ноды',
  'resources.button.create': 'Добавить воркер',
  'resources.button.edit': 'Редактировать воркер',
  'resources.button.edittags': 'Редактировать метки',
  'resources.button.update': 'Обновить метки',
  'resources.table.labels': 'Метки',
  'resources.table.hostname': 'Хостнейм',
  'resources.table.key.tips': 'Метка с таким ключом уже существует',
  'resources.form.label': 'Метка',
  'resources.form.advanced': 'Дополнительно',
  'resources.form.enablePartialOffload': 'Разрешить оффлоуд на CPU',
  'resources.form.placementStrategy': 'Стратегия размещения',
  'resources.form.workerSelector': 'Селектор воркеров',
  'resources.form.enableDistributedInferenceAcrossWorkers':
    'Разрешить распределённый инференс между воркерами',
  'resources.form.spread.tips':
    'Равномерно распределяет ресурсы между воркерами. Может увеличить фрагментацию ресурсов на отдельных воркерах.',
  'resources.form.binpack.tips':
    'Максимизирует утилизацию ресурсов, уменьшая фрагментацию на воркерах/GPU.',
  'resources.form.workerSelector.description':
    'Система выбирает подходящие воркеры для развертывания моделей на основе меток.',
  'resources.table.ip': 'IP-адрес',
  'resources.table.cpu': 'CPU',
  'resources.table.memory': 'ОЗУ',
  'resources.table.gpu': 'GPU',
  'resources.table.disk': 'Хранилище',
  'resources.table.vram': 'VRAM',
  'resources.table.index': 'Индекс',
  'resources.table.workername': 'Имя воркера',
  'resources.table.vender': 'Производитель',
  'resources.table.temperature': 'Температура',
  'resources.table.core': 'Ядра',
  'resources.table.utilization': 'Использование',
  'resources.table.gpuutilization': 'Использование GPU',
  'resources.table.vramutilization': 'Использование VRAM',
  'resources.table.total': 'Всего',
  'resources.table.used': 'Использовано',
  'resources.table.allocated': 'Выделено',
  'resources.table.wokers': 'воркеры',
  'resources.worker.linuxormaxos': 'Linux или macOS',
  'resources.table.unified': 'Объединённая память',
  'resources.worker.add.step1':
    'Получить токен <span class="note-text">(Запустить на сервере)</span>',
  'resources.worker.add.step2': 'Зарегистрировать воркер',
  'resources.worker.add.step2.tips':
    '(Запустить на добавляемом воркере, <span style="color: #000;font-weight: 600">token</span> — это значение, полученное на первом шаге.)', // Translated
  'resources.worker.add.step3':
    'После успешной регистрации обновите список воркеров.',
  'resources.worker.container.supported': 'Только для Linux.',
  'resources.worker.current.version': 'Текущая версия: {version}',
  'resources.worker.driver.install':
    'Установите <a href="https://docs.gpustack.ai/latest/installation/installation-requirements/" target="_blank">необходимые драйверы и библиотеки</a> перед установкой GPUStack.', // Translated
  'resources.worker.select.command':
    'Выберите метку для генерации команды и скопируйте её.',
  'resources.worker.script.install': 'Установка скриптом',
  'resources.worker.container.install': 'Установка контейнером (только Linux)',
  'resources.worker.cann.tips': `Установите <span style="color: #000;font-weight: 600">--device /dev/davinci{index}</span> в соответствии с требуемым индексом NPU. Например, чтобы подключить NPU0 и NPU1, добавьте <span style="color: #000;font-weight: 600">--device /dev/davinci0 --device /dev/davinci1</span>.`, // Translated
  'resources.modelfiles.form.path': 'Путь хранения',
  'resources.modelfiles.modelfile': 'Файлы моделей',
  'resources.modelfiles.download': 'Добавить файл модели',
  'resources.modelfiles.size': 'Размер',
  'resources.modelfiles.selecttarget': 'Выбрать назначение',
  'resources.modelfiles.form.localdir': 'Локальный каталог',
  'resources.modelfiles.form.localdir.tips':
    'Каталог хранения по умолчанию — <span class="desc-block">/var/lib/gpustack/cache</span>, или каталог, указанный с помощью <span class="desc-block">--cache-dir</span> (предпочтительно) или <span class="desc-block">--data-dir</span>.', // Translated
  'resources.modelfiles.retry.download': 'Повторить загрузку',
  'resources.modelfiles.storagePath.holder':
    'Download in progress: <span style="font-weight: 700">{name}</span>',
  'resources.filter.worker': 'Фильтровать по узлу',
  'resources.filter.source': 'Фильтровать по источнику',
  'resources.modelfiles.delete.tips': 'Также удалить файл с диска!',
  'resources.modelfiles.copy.tips': 'Скопировать полный путь',
  'resources.filter.path': 'Фильтрация по пути'
};

// ========== To-Do: Translate Keys (Remove After Translation) ==========
// 1. 'resources.modelfiles.storagePath.holder',
// ========== End of To-Do List ==========
