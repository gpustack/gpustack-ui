export default {
  'resources.title': 'Ресурсы',
  'resources.nodes': 'Worker',
  'resources.container': 'Контейнер',
  'resources.button.create': 'Добавить Worker',
  'resources.button.edit': 'Редактировать Worker',
  'resources.button.edittags': 'Редактировать метки',
  'resources.button.update': 'Обновить метки',
  'resources.table.labels': 'Метки',
  'resources.table.hostname': 'Имя хоста',
  'resources.table.key.tips': 'Метка с таким ключом уже существует',
  'resources.form.label': 'Метка',
  'resources.form.advanced': 'Дополнительно',
  'resources.form.enablePartialOffload': 'Разрешить оффлоуд на CPU',
  'resources.form.placementStrategy': 'Стратегия размещения',
  'resources.form.workerSelector': 'Селектор Worker',
  'resources.form.enableDistributedInferenceAcrossWorkers':
    'Разрешить распределённый инференс между Worker',
  'resources.form.spread.tips':
    'Равномерно распределяет ресурсы между Worker. Может увеличить фрагментацию ресурсов на отдельных Worker.',
  'resources.form.binpack.tips':
    'Максимизирует утилизацию ресурсов, уменьшая фрагментацию на Worker/GPU.',
  'resources.form.workerSelector.description':
    'Система выбирает подходящие Worker для развертывания моделей на основе меток.',
  'resources.table.ip': 'IP-адрес',
  'resources.table.cpu': 'CPU',
  'resources.table.memory': 'ОЗУ',
  'resources.table.gpu': 'GPU',
  'resources.table.disk': 'Хранилище',
  'resources.table.vram': 'VRAM',
  'resources.table.index': 'Индекс',
  'resources.table.workername': 'Имя Worker',
  'resources.table.vendor': 'Производитель',
  'resources.table.temperature': 'Температура',
  'resources.table.core': 'Ядра',
  'resources.table.utilization': 'Использование',
  'resources.table.gpuutilization': 'Использование GPU',
  'resources.table.vramutilization': 'Использование VRAM',
  'resources.table.total': 'Всего',
  'resources.table.used': 'Использовано',
  'resources.table.allocated': 'Выделено',
  'resources.table.wokers': 'Worker',
  'resources.worker.linuxormaxos': 'Linux или macOS',
  'resources.table.unified': 'Объединённая память',
  'resources.worker.add.step1':
    'Получить Token <span class="note-text">(Запустить на сервере)</span>',
  'resources.worker.add.step2': 'Зарегистрировать Worker',
  'resources.worker.add.step2.tips': '(Запустить на добавляемом Worker.)',
  'resources.worker.add.step3':
    'После успешной регистрации обновите список Worker.',
  'resources.worker.container.supported': 'Только для Linux.',
  'resources.worker.current.version': 'Текущая версия: {version}',
  'resources.worker.driver.install':
    'Установите <a href="https://docs.gpustack.ai/latest/installation/installation-requirements/" target="_blank">необходимые драйверы и библиотеки</a> перед установкой GPUStack.',
  'resources.worker.select.command':
    'Выберите метку для генерации команды и скопируйте её.',
  'resources.worker.script.install': 'Установка скриптом',
  'resources.worker.container.install': 'Установка контейнером (только Linux)',
  'resources.worker.cann.tips': `Установите <span class="bold-text">--device /dev/davinci{index}</span> в соответствии с требуемым индексом NPU. Например, чтобы подключить NPU0 и NPU1, добавьте <span class="bold-text">--device /dev/davinci0 --device /dev/davinci1</span>.`,
  'resources.modelfiles.form.path': 'Путь хранения',
  'resources.modelfiles.modelfile': 'Файлы моделей',
  'resources.modelfiles.download': 'Добавить файл модели',
  'resources.modelfiles.size': 'Размер',
  'resources.modelfiles.selecttarget': 'Выбрать назначение',
  'resources.modelfiles.form.localdir': 'Локальный каталог',
  'resources.modelfiles.form.localdir.tips':
    'Каталог хранения по умолчанию — <span class="desc-block">/var/lib/gpustack/cache</span>, или каталог, указанный с помощью <span class="desc-block">--cache-dir</span> (предпочтительно) или <span class="desc-block">--data-dir</span>.',
  'resources.modelfiles.retry.download': 'Повторить загрузку',
  'resources.modelfiles.storagePath.holder': 'Ожидание завершения загрузки...',
  'resources.filter.worker': 'Фильтровать по Worker',
  'resources.filter.source': 'Фильтровать по источнику',
  'resources.filter.status': 'Фильтровать по статусу',
  'resources.modelfiles.delete.tips': 'Также удалить файл с диска',
  'resources.modelfiles.copy.tips': 'Скопировать полный путь',
  'resources.filter.path': 'Фильтрация по пути',
  'resources.register.worker.step1':
    'В меню выберите <span class="bold-text">Скопировать Token</span>.',
  'resources.register.worker.step2':
    'В меню выберите <span class="bold-text">Быстрая настройка</span>.',
  'resources.register.worker.step3':
    'Перейдите на вкладку <span class="bold-text">Общие</span>.',
  'resources.register.worker.step4':
    'Выберите роль сервиса: <span class="bold-text">Worker</span>.',
  'resources.register.worker.step5':
    'Введите <span class="bold-text">URL сервера</span>: {url}.',
  'resources.register.worker.step6':
    'Вставьте <span class="bold-text">Token</span>.',
  'resources.register.worker.step7':
    'Нажмите <span class="bold-text">Перезапуск</span> для применения настроек.',
  'resources.register.install.title': 'Установка GPUStack на {os}',
  'resources.register.download':
    'Скачайте и установите <a href={url} target="_blank">инсталлятор</a>. Поддерживаемые версии: {versions}.',
  'resource.register.maos.support': 'Apple Silicon (серия M), macOS 14+',
  'resource.register.windows.support': 'Windows 10, Windows 11',
  'resources.model.instance': 'Экземпляр модели',
  'resources.worker.download.privatekey': 'Скачать закрытый ключ',
  'resources.worker.ssh.view': 'Просмотреть доступ по SSH',
  'resources.worker.ssh.title': 'Доступ по SSH',
  'resources.worker.ssh.host': 'Хост',
  'resources.worker.ssh.port': 'Порт',
  'resources.worker.ssh.command': 'Команда подключения',
  'resources.worker.ssh.privatekey': 'Закрытый ключ',
  'resources.worker.ssh.pending': 'Пока недоступно',
  'resources.worker.ssh.tip':
    'Для аутентификации используется закрытый ключ этого Worker. Скачайте его, выполните chmod 600 для файла, затем подключайтесь.',
  'resources.worker': 'Worker',
  'resources.modelfiles.form.exsting': 'Загружено',
  'resources.modelfiles.form.added': 'Добавлено',
  'resources.modelfiles.form.isLora': 'Модель LoRA',
  'resources.worker.maintenance.title': 'Обслуживание системы',
  'resources.worker.maintenance.enable': 'Включить режим обслуживания',
  'resources.worker.maintenance.disable': 'Выключить режим обслуживания',
  'resources.worker.maintenance.remark': 'Примечание',
  'resources.worker.maintenance.remark.rules':
    'Укажите примечание к обслуживанию',
  'resources.worker.maintenance.tips':
    'При включении режима обслуживания узлу перестают назначаться новые задачи развёртывания моделей. Работающие экземпляры не затрагиваются.',
  'resources.worker.noCluster.tips':
    'Нет доступных кластеров. Создайте кластер перед добавлением узла.',
  'resources.metrics.details': 'Мониторинг',
  'resoureces.worker.upgrade.tips':
    'Версия Worker не совпадает с версией GPUStack Server. Используйте одинаковые версии.',
  'resources.worker.version': 'Версия Worker: {version}',
  'resources.server.version': 'Версия сервера: {version}',
  'resources.worker.currentVersion': 'Текущая версия: {version}',
  'resources.worker.targetVersion': 'Целевая версия: {version}',
  'resources.driver.version': 'Версия драйвера: {version}',

  'resources.worker.setLabels': 'Задать метки',
  'resources.worker.setLabels.count': 'Выбрано Worker: {count}',
  'resources.worker.setLabels.hint':
    'Добавляет новые метки и обновляет значения совпадающих ключей у всех выбранных Worker. Остальные метки сохраняются. Для удаления меток редактируйте Worker по отдельности.'
};
