export default {
  'routes.title': 'Маршруты',
  'routes.button.add': 'Добавить маршрут',
  'routes.table.routeTargets': 'Цели маршрута',
  'routes.table.traffic': 'Доля трафика',
  'routes.table.setAsFallback': 'Назначить резервной целью',
  'routes.form.target.title': 'Цели маршрута',
  'routes.form.target.add': 'Добавить цель маршрута',
  'routes.form.target.advanced': 'Дополнительно',
  'routes.form.target.fallback': 'Резервная цель маршрута',
  'routes.form.target.weight': 'Вес',
  'routes.form.target.remove': 'Удалить',
  'routes.form.target.model': 'Модель',
  'routes.form.metadata.title': 'Метаданные',
  'routes.form.metadata.add': 'Добавить метаданные',
  'routes.table.label.fallback': 'Резервная цель',
  'routes.form.metadata.size': 'Размер',
  'routes.form.metadata.activeSize': 'Активный размер',
  'routes.form.metadata.tags': 'Теги',
  'routes.form.metadata.maxTokens': 'Максимальное количество Token',
  'routes.form.metadata.dimension': 'Размерность',
  'routes.form.metadata.license': 'Лицензии',
  'routes.form.metadata.releaseDate': 'Дата выпуска',
  'routes.form.metadata.languages': 'Языки',
  'routes.form.metadata.icons': 'Значок',
  'routes.form.metadata.uploadIcon': 'Загрузить значок',
  'routes.form.fallback.warning':
    'Изменения резервной цели маршрута вступают в силу через одну минуту.',
  'routes.form.weight.tips': 'Вес трафика для этой цели.',
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
    'Маршрутизирует запросы одной сессии к одной цели; сессии определяются упорядоченной цепочкой ключей (заголовок или ключ тела).',
  'routes.lb.sessionKeys': 'Ключи сессии (по порядку, первое совпадение)',
  'routes.lb.sessionKeys.source.header': 'Заголовок',
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
    'Макс. запросов в обработке на экземпляр',
  'routes.lb.systemone': 'Маршрутизация через сервис решений',
  'routes.lb.systemone.tips':
    'Оценивает цели по сложности задачи: каждый запрос (усечённый) вместе с вопросом выбора модели отправляется в Jev-совместимый сервис принятия решений, чей ответ становится взвешенным голосом. При сбое, тайм-ауте решения или не-2xx ответе происходит тихий откат к остальным плагинам.',
  'routes.lb.systemone.provider': 'Сервис принятия решений',
  'routes.lb.systemone.provider.tips': 'Выберите провайдера сервиса TypeSafe.',
  'routes.lb.systemone.provider.required': 'Выберите сервис принятия решений',
  'routes.lb.systemone.decisionModel': 'Модель принятия решений',
  'routes.lb.systemone.decisionModel.tips':
    'Модель принятия решений на уровне маршрута; обязательна при включённой карточке. Варианты берутся из движков, кэшированных выбранным провайдером. Если не задана или недействительна, JEV-маршрутизация пропускается и запросы откатываются к остальным плагинам.',
  'routes.lb.systemone.decisionModel.required':
    'Выберите модель принятия решений',
  'routes.lb.systemone.instructions': 'Инструкции',
  'routes.lb.systemone.instructions.tips':
    'Дополнительные указания к вопросу выбора модели, отправляемому в сервис.',
  'routes.lb.systemone.instructions.required': 'Введите инструкции',
  'routes.lb.systemone.criteria': 'Критерии моделей',
  'routes.lb.systemone.criteria.add': 'Добавить критерий',
  'routes.lb.systemone.criteria.tips':
    'Имя модели → описание возможностей: на этом основании сервис выбирает модель для каждого запроса.',
  'routes.lb.systemone.criteria.generate': 'Сгенерировать из целей',
  'routes.lb.systemone.criteria.modelPlaceholder': 'Имя модели',
  'routes.lb.systemone.criteria.descPlaceholder':
    'Описание возможностей, напр. сильнейшая логика / дёшево и быстро',
  'routes.lb.systemone.criteria.required':
    'При включении умной маршрутизации задайте хотя бы один критерий модели',
  'routes.lb.systemone.criteria.nameRequired':
    'Введите имя модели для каждого критерия',
  'routes.lb.systemone.criteria.valueRequired':
    'Заполните описание для каждого критерия модели',
  'routes.lb.systemone.criteria.duplicate':
    'Имена моделей в критериях не должны повторяться'
};
