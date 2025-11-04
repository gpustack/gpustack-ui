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
  'clusters.create.selectProvider': 'Выберите провайдера',
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
    'Перед выполнением следующей команды убедитесь, что выполнены предварительные требования для <a href={link} target="_blank">{label}</a>.',
  'clusters.create.addCommand.tips':
    'На воркере, который необходимо добавить, выполните следующую команду, чтобы присоединить его к кластеру.',
  'cluster.create.checkEnv.tips':
    'Используйте следующую команду для проверки готовности окружения',
  'clusters.create.register.tips':
    'На Kubernetes кластере, который необходимо добавить, выполните следующую команду, чтобы присоединить его узлы к кластеру.',
  'cluster.provider.comingsoon': 'Скоро будет',
  'clusters.addworker.nvidiaNotes-01':
    'If the worker has multiple outbound IP addresses, enter <span class="bold-text">WORKER_IP</span> to ensure that the node uses the desired IP. Please double-check with <span class="bold-text">hostname -I | xargs -n1</span>.',
  'clusters.addworker.nvidiaNotes-02':
    'If the model directory already exists on the worker, please add the <span class="bold-text">--volume</span> directive to mount it.',
  'clusters.addworker.hygonNotes':
    'If the <span class="bold-text">/opt/hyhal</span> directory does not exist, please create a symbolic link pointing to the Hygon installed path: <span class="bold-text">/opt/hyhal</span>. Same as <span class="bold-text">/opt/dtk</span> directory.',
  'clusters.addworker.corexNotes':
    'If the <span class="bold-text">/lib/modules</span> directory does not exist, please create a symbolic link pointing to the Iluvatar installed path: <span class="bold-text">ln -s /path/to/corex /lib/modules</span>. Same as <span class="bold-text">/usr/local/corex</span> directory.',
  'clusters.addworker.metaxNotes':
    'If the <span class="bold-text">/opt/mxdriver</span> directory does not exist, please create a symbolic link pointing to the MetaX installed path: <span class="bold-text">ln -s /path/to/metax /opt/mxdriver</span>. Same as <span class="bold-text">/opt/maca</span> directory.',
  'clusters.addworker.cambriconNotes':
    'If the <span class="bold-text">/usr/local/neuware</span> directory does not exist, please create a symbolic link pointing to the Cambricon installed path: <span class="bold-text">ln -s /path/to/neuware /usr/local/neuware</span>.'
};

// ========== To-Do: Translate Keys (Remove After Translation) ==========
// 1. 'clusters.addworker.nvidiaNotes-01': 'If the worker has multiple outbound IP addresses, enter <span class="bold-text">WORKER_IP</span> to ensure that the node uses the desired IP. Please double-check with <span class="bold-text">hostname -I | xargs -n1</span>.',
// 2. 'clusters.addworker.nvidiaNotes-02': 'If the model directory already exists on the worker, please add the <span class="bold-text">--volume</span> directive to mount it.',
// 3. 'clusters.addworker.hygonNotes': 'If the <span class="bold-text">/opt/hyhal</span> directory does not exist, please create a symbolic link pointing to the Hygon installed path: <span class="bold-text">/opt/hyhal</span>. Same as <span class="bold-text">/opt/dtk</span> directory.',
// 4. 'clusters.addworker.corexNotes': 'If the <span class="bold-text">/lib/modules</span> directory does not exist, please create a symbolic link pointing to the Iluvatar installed path: <span class="bold-text">ln -s /path/to/corex /lib/modules</span>. Same as <span class="bold-text">/usr/local/corex</span> directory.',
// 5. 'clusters.addworker.metaxNotes': 'If the <span class="bold-text">/opt/mxdriver</span> directory does not exist, please create a symbolic link pointing to the MetaX installed path: <span class="bold-text">ln -s /path/to/metax /opt/mxdriver</span>. Same as <span class="bold-text">/opt/maca</span> directory.',
// 6. 'clusters.addworker.cambriconNotes': 'If the <span class="bold-text">/usr/local/neuware</span> directory does not exist, please create a symbolic link pointing to the Cambricon installed path: <span class="bold-text">ln -s /path/to/neuware /usr/local/neuware</span>.'
// ========== End of To-Do List ==========
