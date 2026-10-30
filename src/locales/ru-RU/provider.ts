export default {
  'providers.title': 'Провайдеры',
  'providers.button.add': 'Добавить провайдера',
  'providers.button.clone': 'Клонировать провайдера',
  'providers.table.providerName': 'Провайдер',
  'providers.table.models': 'Модели',
  'providers.table.proxy': 'Прокси',
  'providers.form.tokens.title': 'API-ключ',
  'providers.form.tokens.add': 'Добавить API-ключ',
  'providers.form.models.add': 'Добавить модель',
  'providers.form.proxy.enable': 'Включить прокси',
  'providers.form.proxy.url': 'URL прокси',
  'providers.form.proxy.timeout': 'Тайм-аут прокси (секунды)',
  'providers.form.customConfig': 'Пользовательская конфигурация',
  'providers.form.model.test': 'Проверить',
  'providers.form.model.test.tips': 'Проверка подключения (только LLM)',
  'providers.form.target.placeholder': 'provider/models',
  'providers.form.fallback.token': 'Резервные API-ключи',
  'providers.form.custombeckendUrl': 'Пользовательский базовый URL',
  'providers.form.claudeCustomUrl': 'Пользовательский URL API',
  'providers.form.claudeCustomUrl.tips':
    'При заполнении этого поля провайдер обслуживает только протокол Anthropic (/v1/messages), а запросы в формате OpenAI не преобразуются. Оставьте поле пустым, чтобы обращаться к api.anthropic.com через протокол OpenAI.',
  'providers.form.qwenDomain': 'Пользовательский домен',
  'providers.form.qwenDomain.tips':
    'Необязательно. Домен можно посмотреть в рабочем пространстве DashScope (Bailian) в консоли Alibaba Cloud (например, maas.aliyuncs.com). API генерации изображений совместимого режима недоступен на домене по умолчанию dashscope.aliyuncs.com — для моделей изображений нужен домен рабочего пространства.',
  'providers.form.qwenDomain.imageNotice':
    'Выбрана модель изображений: API генерации изображений совместимого режима недоступен на домене по умолчанию dashscope.aliyuncs.com. Укажите домен рабочего пространства DashScope в поле «Пользовательский домен» выше, иначе запросы изображений будут завершаться ошибкой 404.',
  'providers.form.more': 'Ещё {count}',
  'providers.form.addAll': 'Добавить все',
  'providers.form.rules.models': 'Выберите хотя бы одну модель',
  'providers.form.rules.tokens': 'Введите действительный API-ключ',
  'providers.form.rules.model': 'Выберите модель',
  'providers.form.rules.absoluteHttpUrl':
    'Введите абсолютный URL http(s), включая порт, если он используется, например https://gateway.example.com:8080',
  'providers.form.rules.openaiCustomUrl':
    'Введите абсолютный URL http(s) с путём, например https://gateway.example.com:8080/v1',
  'providers.form.rules.claudeCustomUrl.credentials':
    'URL не должен содержать учётные данные: они будут отправляться в заголовке Host каждого запроса. Вместо этого укажите ключ конечной точки в поле API-ключа провайдера.',
  'providers.form.rules.claudeCustomUrl.query':
    'URL принимает только адрес источника и необязательный префикс пути; параметры запроса и фрагмент будут отброшены.',
  'providers.form.rules.qwenDomain':
    'Введите только домен (с портом, если он не 443), например maas.aliyuncs.com или my-gateway.example.com:8443',
  'providers.form.model.duplicate': 'Такая модель уже существует',
  'providers.table.registerRoute': 'Зарегистрировать маршрут',
  'providers.form.azureServiceUrl': 'URL Azure OpenAI Service',
  'providers.form.ollamaServerHost': 'Хост сервера Ollama',
  'providers.form.ollamaServerPort': 'Порт сервера Ollama',
  'providers.form.hunyuanAuthId': 'Идентификатор аутентификации Hunyuan',
  'providers.form.hunyuanAuthKey': 'Ключ аутентификации Hunyuan',
  'providers.form.cloudflareAccountId': 'Идентификатор аккаунта Cloudflare',
  'providers.form.targetLang': 'Язык перевода',
  'providers.form.modelVersion': 'Версия модели',
  'providers.form.tritonDomain': 'Домен Triton Server',
  'providers.form.modelVersion.tips':
    'Задаёт версию модели, используемую в Triton Server.',
  'providers.form.tritonDomain.tips':
    'Домен для отправки запросов в развёртывание Triton Server.',
  'providers.form.awsRegion': 'Регион AWS',
  'providers.form.systemoneEndpoint': 'Пользовательский базовый URL',
  'providers.form.systemoneEndpoint.tips':
    'Необязательно. Пользовательский базовый URL Jev-совместимого сервиса без суффикса пути (например, http://jev.example.com:8010). Если оставить пустым, используется управляемый сервис TypeSafe https://api.typesafe.ai.',
  'providers.form.decision': 'Решение',
  'providers.form.decisionTest.tips':
    'Отправляет один решающий вызов сервису (проверяет адрес, Token и путь принятия решений).'
};
