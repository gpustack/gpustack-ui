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
  'resources.table.vendor': 'Производитель',
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
  'resources.worker.add.step2.tips': '(Запустить на добавляемом воркере.)', // Translated
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
  'resources.worker.cann.tips': `Установите <span class="bold-text">--device /dev/davinci{index}</span> в соответствии с требуемым индексом NPU. Например, чтобы подключить NPU0 и NPU1, добавьте <span class="bold-text">--device /dev/davinci0 --device /dev/davinci1</span>.`, // Translated
  'resources.modelfiles.form.path': 'Путь хранения',
  'resources.modelfiles.modelfile': 'Файлы моделей',
  'resources.modelfiles.download': 'Добавить файл модели',
  'resources.modelfiles.size': 'Размер',
  'resources.modelfiles.selecttarget': 'Выбрать назначение',
  'resources.modelfiles.form.localdir': 'Локальный каталог',
  'resources.modelfiles.form.localdir.tips':
    'Каталог хранения по умолчанию — <span class="desc-block">/var/lib/gpustack/cache</span>, или каталог, указанный с помощью <span class="desc-block">--cache-dir</span> (предпочтительно) или <span class="desc-block">--data-dir</span>.', // Translated
  'resources.modelfiles.retry.download': 'Повторить загрузку',
  'resources.modelfiles.storagePath.holder': 'Ожидание завершения загрузки...',
  'resources.filter.worker': 'Фильтровать по узлу',
  'resources.filter.source': 'Фильтровать по источнику',
  'resources.filter.status': 'Фильтровать по статусу',
  'resources.modelfiles.delete.tips': 'Также удалить файл с диска',
  'resources.modelfiles.copy.tips': 'Скопировать полный путь',
  'resources.filter.path': 'Фильтрация по пути',
  'resources.register.worker.step1':
    'В меню выберите <span class="bold-text">Скопировать токен</span>.',
  'resources.register.worker.step2':
    'В меню выберите <span class="bold-text">Быстрая настройка</span>.',
  'resources.register.worker.step3':
    'Перейдите на вкладку <span class="bold-text">Общие</span>.',
  'resources.register.worker.step4':
    'Выберите роль сервиса: <span class="bold-text">Воркер</span>.',
  'resources.register.worker.step5':
    'Введите <span class="bold-text">URL сервера</span>: {url}.',
  'resources.register.worker.step6':
    'Вставьте <span class="bold-text">Токен</span>.',
  'resources.register.worker.step7':
    'Нажмите <span class="bold-text">Перезапуск</span> для применения настроек.',
  'resources.register.install.title': 'Установка GPUStack на {os}',
  'resources.register.download':
    'Скачайте и установите <a href={url} target="_blank">инсталлятор</a>. Поддерживаемые версии: {versions}.',
  'resource.register.maos.support': 'Apple Silicon (серия M), macOS 14+',
  'resource.register.windows.support': 'Windows 10, Windows 11',
  'resources.model.instance': 'Модель экземпляра',
  'resources.worker.download.privatekey': 'Скачать приватный ключ',
  'resources.worker': 'Рабочий узел',
  'resources.modelfiles.form.exsting': 'Загружено',
  'resources.modelfiles.form.added': 'Добавлено',
  'resources.worker.maintenance.title': 'System Maintenance',
  'resources.worker.maintenance.enable': 'Enter Maintenance Mode',
  'resources.worker.maintenance.disable': 'Exit Maintenance Mode',
  'resources.worker.maintenance.remark': 'Remark',
  'resources.worker.maintenance.remark.rules':
    'Please enter maintenance remarks',
  'resources.worker.maintenance.tips':
    'When maintenance mode is enabled, the node will stop scheduling new model deployment tasks. Running instances will not be affected.',
  'resources.worker.noCluster.tips':
    'No available clusters. Please create a cluster before adding a node.',
  'resources.metrics.details': 'Metrics Details'
};

// ========== To-Do: Translate Keys (Remove After Translation) ==========
// 2. 'resources.worker.maintenance.title': 'System Maintenance',
// 3. 'resources.worker.maintenance.enable': 'Enter Maintenance Mode',
// 4. 'resources.worker.maintenance.disable': 'Exit Maintenance Mode',
// 5. 'resources.worker.maintenance.remark': 'Remark',
// 6. 'resources.worker.maintenance.remark.rules': 'Please enter maintenance remarks',
// 7. 'resources.worker.maintenance.tips': 'When maintenance mode is enabled, the node will stop scheduling new model deployment tasks. Running instances will not be affected.',
// 8. 'resources.worker.noCluster.tips': 'No available clusters. Please create a cluster before adding a node.',
// 9. 'resources.metrics.details': 'Metrics Details'
// ========== End of To-Do List ==========
