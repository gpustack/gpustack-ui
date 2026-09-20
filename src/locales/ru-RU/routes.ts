export default {
  'routes.title': 'Routes',
  'routes.button.add': 'Add Route',
  'routes.table.routeTargets': 'Route Targets',
  'routes.table.traffic': 'Traffic Share',
  'routes.table.setAsFallback': 'Set as Fallback',
  'routes.form.target.title': 'Route Targets',
  'routes.form.target.add': 'Add Route Target',
  'routes.form.target.advanced': 'Дополнительно',
  'routes.form.target.fallback': 'Fallback Route Target',
  'routes.form.target.weight': 'Вес',
  'routes.form.target.moveUp': 'Переместить вверх',
  'routes.form.target.moveDown': 'Переместить вниз',
  'routes.form.target.remove': 'Удалить',
  'routes.form.target.model': 'Model',
  'routes.form.metadata.title': 'Metadata',
  'routes.form.metadata.add': 'Add Metadata',
  'routes.table.label.fallback': 'Fallback',
  'routes.form.metadata.size': 'Size',
  'routes.form.metadata.activeSize': 'Active Size',
  'routes.form.metadata.tags': 'Tags',
  'routes.form.metadata.maxTokens': 'Max Tokens',
  'routes.form.metadata.dimension': 'Dimensions',
  'routes.form.metadata.license': 'Licenses',
  'routes.form.metadata.releaseDate': 'Release Date',
  'routes.form.metadata.languages': 'Languages',
  'routes.form.metadata.icons': 'Icon',
  'routes.form.metadata.uploadIcon': 'Upload Icon',
  'routes.form.fallback.warning':
    'Changes to fallback route target take effect after one minute.',
  'routes.form.weight.tips': 'Target traffic weight.',
  'routes.lb.routeBy': 'Способ маршрутизации',
  'routes.table.lbMode': 'Способ маршрутизации',
  'routes.lb.mode.weighted': 'Вес цели',
  'routes.lb.mode.policy': 'Политика',
  'routes.lb.form.mode.weighted': 'Вес цели',
  'routes.lb.form.mode.policy': 'Политика',
  'routes.lb.form.mode.weighted.tips':
    'Разделяет трафик между целями по весам; вес каждой цели должен быть больше 0.',
  'routes.lb.form.mode.policy.tips':
    'Цель выбирают включённые плагины политики (режим политики); без плагинов — круговой перебор.',
  'routes.lb.mode.invalid': 'Недопустимо',
  'routes.lb.mode.invalid.tooltip':
    'Обнаружены смешанные веса: этот маршрут недоступен — шлюз отказывается его обслуживать. Установите всем целям вес >0 или всем 0.',
  'routes.lb.sessionAffinity': 'Привязка сессий',
  'routes.lb.sessionAffinity.tips':
    'Маршрутизирует запросы одной сессии к одной цели; сессии определяются упорядоченной цепочкой ключей (header или ключ тела).',
  'routes.lb.sessionKeys': 'Ключи сессии (по порядку, первое совпадение)',
  'routes.lb.sessionKeys.source.header': 'Header',
  'routes.lb.sessionKeys.source.bodyKey': 'Ключ тела',
  'routes.lb.sessionKeys.keyPlaceholder': 'Имя ключа, напр. session-id',
  'routes.lb.sessionKeys.add': 'Добавить ключ сессии',
  'routes.lb.sessionKeys.required':
    'При включении привязки сессий требуется хотя бы один ключ',
  'routes.lb.sessionKeys.keyRequired': 'Введите имя ключа',
  'routes.lb.leastLoad': 'Минимум запросов в обработке',
  'routes.lb.leastLoad.tips':
    'Оценивает цели по числу выполняемых запросов и предпочитает цель с наименьшим числом.',
  'routes.lb.influence': 'Вес',
  'routes.lb.weight.mixed':
    'Во взвешенном режиме каждая цель должна иметь вес больше 0. Для маршрутизации по политике переключите режим LB.',
  'routes.form.target.maxRunningRequests':
    'Макс. запросов в обработке на экземпляр'
};
