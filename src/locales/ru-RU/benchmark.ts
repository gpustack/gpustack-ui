export default {
  'benchmark.detail.result.selectMeasuredPoint':
    'Выбрать измеренную точку при {load} {unit}',
  'benchmark.detail.metric.ttftP99': 'TTFT p99',
  'benchmark.detail.metric.tpotP99': 'TPOT p99',
  'benchmark.detail.metric.itlP99': 'ITL p99',
  'benchmark.detail.statistics.p25': 'P25',
  'benchmark.detail.statistics.p50': 'P50',
  'benchmark.detail.statistics.p75': 'P75',
  'benchmark.detail.statistics.p90': 'P90',
  'benchmark.detail.stopReason.throughputGainConverged':
    'Сходимость прироста пропускной способности',
  'benchmark.detail.stopReason.throughputGainConverged.detail':
    'За последние {points} точки уточнения измеренный пик вырос на {gain}%, что ниже порога {threshold}%; уточнение завершено. Вывод относится только к измеренным точкам.',
  'benchmark.detail.stopReason.throughputGainConverged.baseline':
    'Начало окна: {throughput} ток/с при {load} {unit}',
  'benchmark.detail.stopReason.throughputGainConverged.best':
    'Лучшее значение в окне: {throughput} ток/с при {load} {unit}',
  'benchmark.detail.stopReason.throughputGainConverged.range':
    'Измеренные нагрузки по обе стороны лучшей точки: {lower}–{upper} {unit}',
  'benchmark.detail.stopReason.throughputGainConverged.point':
    'Точка уточнения {point}: {load} {unit}, общая TPS {throughput} ток/с, текущий максимум {best} ток/с',
  'benchmark.detail.statistics.load': 'Нагрузка и пропускная способность',
  'benchmark.detail.statistics.latency': 'Задержка',
  'benchmark.detail.statistics.tokens': 'Статистика размера запросов',
  'benchmark.detail.statistics.requestRate': 'Достигнутая частота запросов',
  'benchmark.detail.statistics.concurrency': 'Достигнутая параллельность',
  'benchmark.detail.statistics.requestsUnit': 'запросы',
  'benchmark.detail.statistics.tokensUnit': 'токенов/запрос',
  'benchmark.detail.statistics.successTotal': 'Успешные / все запросы',
  'benchmark.detail.statistics.requestSize': 'Размер запросов',
  'benchmark.detail.statistics.requestSizeNote':
    'Распределения входных / выходных токенов',
  'benchmark.detail.statistics.load.min.tip':
    'Минимальное значение на этом этапе. Частоты вычислены по времени событий; параллельность — число выполняющихся запросов.',
  'benchmark.detail.statistics.load.max.tip':
    'Максимальное значение на этом этапе. Краткие всплески частоты не означают устойчивую производительность. Основной пик определяется по средней общей TPS этапов.',
  'benchmark.detail.statistics.latency.min.tip':
    'Минимальный образец показателя задержки на этом этапе. Единицы указаны в строке.',
  'benchmark.detail.statistics.latency.max.tip':
    'Максимальный образец задержки на этом этапе. ITL Max — самый длинный интервал потокового вывода.',
  'benchmark.detail.statistics.tokens.min.tip':
    'Минимальное число входных/выходных токенов успешных запросов на этом этапе.',
  'benchmark.detail.statistics.tokens.max.tip':
    'Максимальное число входных/выходных токенов успешных запросов на этом этапе.',
  'benchmark.detail.latency.scrollHint':
    'Прокрутите по горизонтали, чтобы увидеть все процентили',
  'benchmark.detail.latency.metric': 'Метрика',
  'benchmark.detail.latency.endToEnd': 'Сквозная задержка',
  'benchmark.detail.validity.throughputDeclineGeneric':
    'Тест завершён досрочно из-за устойчивого снижения общей TPS. Граница SLO не найдена.',
  'benchmark.detail.validity.declineEvidence.peak':
    'Измеренный пик: {tps} токенов/с',
  'benchmark.detail.validity.declineEvidence.concurrency':
    'Параллельность {rate}: {tps} токенов/с (снижение {drop}%)',
  'benchmark.detail.validity.declineEvidence.rate':
    'Целевая частота запросов {rate} req/s: {tps} токенов/с (снижение {drop}%)',
  'benchmark.detail.validity.declineEvidence.details':
    'Изменения пропускной способности',
  'benchmark.detail.marker.sloCapacity.tip':
    'Максимальная измеренная нагрузка, соответствующая всем заданным целям SLO.',
  'benchmark.detail.marker.peakThroughput.tip':
    'Максимальное значение общей TPS, зарегистрированное среди измеренных точек.',
  'benchmark.detail.stage.measuredRate.tip':
    'Измеренная частота успешных завершений запросов по времени завершения. Это не заданная частота поступления запросов.',
  'benchmark.detail.stage.measuredConcurrency.tip':
    'Измеренная средняя параллельность успешных запросов по интервалам от начала до завершения.',
  'benchmark.detail.stage.configuredConcurrency': 'Целевая параллельность',
  'benchmark.detail.stage.configuredRate': 'Целевая частота запросов',
  'benchmark.detail.stage.measuredConcurrency':
    'Достигнутая параллельность (сред.)',
  'benchmark.detail.stage.measuredRate': 'Достигнутая частота запросов (сред.)',
  'benchmark.detail.validity.throughputDecline':
    'Тест завершён досрочно: на {points} последовательных этапах с возрастающей нагрузкой общая TPS была ниже измеренного пика минимум на {threshold}%. Граница SLO не найдена.',
  'benchmark.detail.stopReason.throughputDecline':
    'Защита при снижении пропускной способности',
  'benchmark.detail.result.load': 'Нагрузка результата',
  'benchmark.detail.result.boundaryPair':
    '{pass} {unit} соответствует SLO; {fail} {unit} — нет',
  'benchmark.detail.result.sloConcurrency':
    'Максимальная измеренная параллельность в рамках SLO',
  'benchmark.detail.result.sloRate':
    'Максимальная измеренная частота запросов в рамках SLO',
  'benchmark.detail.result.totalPeak':
    'Максимальная измеренная общая пропускная способность',
  'benchmark.detail.result.measured': 'Результат измерения',
  'benchmark.detail.result.noSloPoint':
    'Ни одна измеренная точка не соответствует SLO',
  'benchmark.detail.result.boundaryLocated': 'Граница SLO найдена',
  'benchmark.detail.result.boundaryUnknown': 'Верхняя граница SLO не найдена',
  'benchmark.detail.result.inProgress': 'Измерение выполняется',
  'benchmark.detail.result.peakFact':
    'Пиковая пропускная способность: {throughput} токенов/с при {load} {unit}',
  'benchmark.form.load.positiveRate': 'Введите положительную частоту запросов',
  'benchmark.form.load.positiveConcurrency':
    'Введите положительное целое число параллельных запросов',
  'benchmark.form.load.rangeError': 'Верхняя граница должна быть больше нижней',
  'benchmark.title': 'Бенчмарки',
  'benchmark.button.add': 'Добавить бенчмарк',
  'benchmark.button.edit': 'Редактировать бенчмарк',
  'benchmark.button.clone': 'Клонировать бенчмарк',
  'benchmark.button.compare': 'Сравнить',
  'benchmark.table.model': 'Модель',
  'benchmark.form.target': 'Цель тестирования',
  'benchmark.table.dataset': 'Набор данных',
  'benchmark.table.requestRate': 'Частота запросов',
  'benchmark.table.gpu': 'GPU ',
  'benchmark.table.tpot': 'TPOT',
  'benchmark.table.ttft': 'TTFT',
  'benchmark.table.rps': 'Запросов/с',
  'benchmark.table.tps': 'Token/s',
  'benchmark.table.inputLen': 'Длина входа',
  'benchmark.table.outputLen': 'Длина выхода',
  'benchmark.form.profile': 'Профиль',
  'benchmark.form.totalRequests': 'Всего запросов',
  'benchmark.form.concurrencyList': 'Уровни параллелизма',
  'benchmark.form.loadType': 'Тип нагрузки',
  'benchmark.form.loadType.fixedRate': 'Фиксированная частота',
  'benchmark.form.loadType.concurrency': 'Параллелизм',
  'benchmark.form.loadType.sweep': 'Автоматический перебор',
  'benchmark.form.autoTune': 'Автонастройка',
  'benchmark.form.autoTune.rate.tip':
    'Точки нагрузки, измеряемые в этом запуске: один этап = одна измеренная точка. При автонастройке частота запросов повышается автоматически, пока выходная пропускная способность не перестанет расти (пик), поэтому перечислять точки вручную не нужно. Переключитесь на «Вручную», чтобы прогнать заданный список частот.',
  'benchmark.form.autoTune.concurrency.tip':
    'Точки нагрузки, измеряемые в этом запуске: один этап = одна измеренная точка. При автонастройке параллелизм увеличивается автоматически, пока цели по задержке ещё достижимы (граница SLO), поэтому перечислять точки вручную не нужно. Переключитесь на «Вручную», чтобы прогнать заданный список уровней параллелизма.',
  'benchmark.form.autoTune.rangeRate':
    'Диапазон поиска · Частота запросов (req/s)',
  'benchmark.form.autoTune.rangeFrom': 'От',
  'benchmark.form.autoTune.rateFrom': 'Начальная скорость (req/s)',
  'benchmark.form.autoTune.rateTo': 'Конечная скорость (req/s)',
  'benchmark.form.autoTune.concFrom': 'Начальная параллельность',
  'benchmark.form.autoTune.concTo': 'Конечная параллельность',
  'benchmark.form.autoTune.rangeTo': 'До',
  'benchmark.form.autoTune.rangeConcurrency':
    'Диапазон поиска · Параллельность',
  'benchmark.form.autoTune.rangeMin': 'мин',
  'benchmark.form.autoTune.rangeMax': 'макс',
  'benchmark.form.autoTune.range.rate.tip':
    'Диапазон поиска адаптивного разгона — жёсткий: нагрузка вне него не измеряется. Разгон начинается с минимума и удваивается до максимума. Если сервер уже перегружен на минимуме, запуск сообщит измеренную устойчивую скорость и предложит понизить диапазон, а не искать ниже него.',
  'benchmark.form.autoTune.range.concurrency.tip':
    'Диапазон поиска адаптивного разгона — жёсткий: нагрузка вне него не измеряется. Разгон начинается с минимума и удваивается до максимума. Если сервер уже перегружен на минимуме, запуск сообщит измеренную устойчивую скорость и предложит понизить диапазон, а не искать ниже него.',
  'benchmark.form.autoTune.maxRate': 'Максимальная частота запросов',
  'benchmark.form.autoTune.maxConcurrency': 'Максимальная параллельность',
  'benchmark.form.load.managedByProfile': 'управляется профилем',
  'benchmark.form.load.searchLimit': 'Предел поиска',
  'benchmark.form.autoTune.maxPoints': 'Макс. число точек',
  'benchmark.form.autoTune.maxTotalSeconds': 'Макс. общее время (с)',
  'benchmark.form.rateList': 'Частоты запросов (req/s)',
  'benchmark.detail.overview.rate': 'Частота / Параллелизм',
  'benchmark.detail.running.hint':
    'Бенчмарк выполняется — завершено {progress}%, измерено точек: {points}. Страница обновляется автоматически по мере готовности точек.',
  'benchmark.detail.running.finalizing':
    'Бенчмарк завершил прогон — идёт подсчёт и загрузка итоговых результатов. Страница обновляется автоматически.',
  'benchmark.detail.stage.saturationProbe': 'Проба насыщения',
  'benchmark.detail.aux.measured': '{requests} запросов / {seconds}s',
  'benchmark.detail.aux.ceiling': 'предел {rate} req/s',
  'benchmark.detail.aux.cap': 'мягкая верхняя граница {cap}',
  'benchmark.detail.aux.capClamped': 'ограничила точку перелёта',
  'benchmark.detail.aux.capRelaxed': 'уступила — зонд занизил оценку',
  'benchmark.detail.aux.capUnused': 'ни на что не повлияла',
  'benchmark.form.inputTokensList': 'Длины входа в Token (перебор)',
  'benchmark.form.inputTokensList.placeholder': 'e.g. 128, 4096, 32768',
  'benchmark.form.turns': 'Число ходов (многоходовый диалог)',
  'benchmark.form.turns.unit': 'ходов',
  'benchmark.form.multiTurn': 'Многоходовый диалог',
  'benchmark.form.multiTurn.tips':
    'Отправляет каждый пример как многоходовый диалог: каждый ход — отдельный запрос с накопленной историей чата. Доступно только для синтетического (случайного) набора данных; требуется конечная точка чата.',
  'benchmark.form.stopOnSaturation.tips':
    'Останавливает запуск, когда пропускная способность перестаёт расти (ограничение перенасыщения guidellm), вместо дальнейшего увеличения нагрузки сверх точки насыщения.',
  'benchmark.form.warmup': 'Прогрев (%)',
  'benchmark.form.cooldown': 'Завершающий период (%)',
  'benchmark.form.warmup.tips':
    'Отсекает первые N% ЗАПРОСОВ каждой ступени из измеряемого окна (не первые N% её секунд). Используйте, чтобы исключить эффекты холодного старта — первые несколько запросов прогона могут быть в разы медленнее установившегося режима. Укажите процент — например, 10 отсечёт первые 10% запросов каждой ступени.',
  'benchmark.form.cooldown.tips':
    'Отсекает последние N% ЗАПРОСОВ каждой ступени из измеряемого окна, исключая хвост, где ступень доопустошается. Укажите процент — например, 10 отсечёт последние 10% запросов каждой ступени.',
  'benchmark.form.maxErrors': 'Максимум ошибок',
  'benchmark.form.maxErrorRate': 'Макс. доля ошибок (%)',
  'benchmark.form.maxErrorRate.tips':
    'Останавливает ступень, когда доля неудачных запросов достигает этого уровня, — предел того, какая часть прогона может завершиться неудачей, прежде чем цифры перестанут что-либо значить. Укажите процент — например, 5 остановит ступень при 5% ошибок. Оставьте пустым, чтобы не ограничивать долю ошибок.',
  'benchmark.form.stopOnSaturation': 'Остановить при насыщении',
  'benchmark.form.datasetSeed.tips':
    'Сид для генерации синтетических данных. В многоэтапном запуске это начальный сид; каждый этап использует начальный + индекс этапа (выключите «Разный сид на этап» в разделе «Дополнительно», чтобы зафиксировать).',
  'benchmark.form.randomSeed': 'Случайный сид',
  'benchmark.form.randomSeed.tips':
    'Включено (по умолчанию): новый seed при каждом создании бенчмарка, и каждый этап использует свой, поэтому повтор того же конфига отправляет другие данные, а не попадает в префикс-кэш первого прогона. Выключено: закрепите seed для воспроизведения прогона и выберите, различаются ли этапы. Влияет только на набор Random.',
  'benchmark.form.seedIncrement': 'Разный сид на этап',
  'benchmark.form.seedIncrement.tips':
    'Вкл (по умолчанию): сид этапа = начальный + индекс этапа, этапы различаются, снижается повторное использование кэша между этапами. Выкл: все этапы используют один сид. Влияет только на датасет Random.',
  'benchmark.form.slo.ttft': 'Среднее TTFT ≤ (ms)',
  'benchmark.form.slo.p95Ttft': 'P95 TTFT ≤ (ms)',
  'benchmark.form.slo.p99Ttft': 'P99 TTFT ≤ (ms)',
  'benchmark.form.slo.tpot': 'Среднее TPOT ≤ (ms)',
  'benchmark.form.slo.p95Tpot': 'P95 TPOT ≤ (ms)',
  'benchmark.form.slo.p99Tpot': 'P99 TPOT ≤ (ms)',
  'benchmark.form.slo.avgLatency': 'Средняя задержка ≤ (ms)',
  'benchmark.form.slo.p95Latency': 'Задержка P95 ≤ (ms)',
  'benchmark.form.slo.p99Latency': 'Задержка P99 ≤ (ms)',
  'benchmark.form.slo.metric': 'Метрика',
  'benchmark.form.slo.aggregation': 'Агрегация',
  'benchmark.form.slo.threshold': 'Порог (мс)',
  'benchmark.form.slo.add': 'Добавить цель SLO',
  'benchmark.form.slo.metric.ttft': 'TTFT',
  'benchmark.form.slo.metric.tpot': 'TPOT',
  'benchmark.form.slo.metric.latency': 'Задержка',
  'benchmark.form.slo.agg.avg': 'Сред.',
  'benchmark.form.slo.agg.p95': 'P95',
  'benchmark.form.slo.agg.p99': 'P99',
  'benchmark.form.slo.col.metric': 'Метрика',
  'benchmark.form.slo.col.threshold': 'Порог',
  'benchmark.form.preset': 'Пресет',
  'benchmark.form.rate': 'Частота запросов (req/s)',
  'benchmark.form.concurrency': 'Параллелизм',
  'benchmark.form.stages': 'Этапы',
  'benchmark.form.stages.mode.manual': 'Вручную',
  'benchmark.detail.stageLimits': 'Лимиты по этапам',
  'benchmark.form.addStage': 'Добавить этап',
  'benchmark.form.maxRequests': 'Макс. запросов',
  'benchmark.form.maxSeconds': 'Макс. секунд',
  'benchmark.form.maxSecondsCap': 'Макс. секунд (на скорость)',
  'benchmark.form.requestsOrSeconds':
    'Укажите хотя бы одно: Запросы или Макс. секунд.',
  'benchmark.form.sweepSize': 'Число прогонов',
  'benchmark.form.sweepSize.tip':
    'Сколько скоростей автоматически перебирается для поиска пика пропускной способности.',
  'benchmark.form.requests': 'Запросы',
  'benchmark.form.requestsPerRate': 'Запросов на скорость',
  'benchmark.form.requestsPerRate.tip':
    'Автоматически перебирает несколько скоростей; на каждой отправляется столько запросов.',
  'benchmark.form.template': 'Шаблон быстрого заполнения',
  'benchmark.form.group.dataset': 'Рабочая нагрузка',
  'benchmark.form.group.load': 'Нагрузка',
  'benchmark.form.group.distribution': 'Распределение данных',
  'benchmark.form.group.distribution.input': 'Распределение длины входа',
  'benchmark.form.group.distribution.output': 'Распределение длины выхода',
  'benchmark.form.dist.spread': 'Разброс (±)',
  'benchmark.form.dist.spread.tip':
    'Стандартное отклонение (±) длины в Token относительно среднего: чем больше значение, тем сильнее разброс длин в Token.',
  'benchmark.form.dist.min': 'Мин',
  'benchmark.form.dist.max': 'Макс',
  'benchmark.form.distribution.intro':
    'Варьировать длины запросов вокруг среднего, заданного выше (вместо фиксированной длины). Пусто = по умолчанию. Разброс = насколько различаются длины (стандартное отклонение); Min/Max ограничивают диапазон.',
  'benchmark.form.group.constraints': 'Ограничения',
  'benchmark.form.group.slo': 'SLO задержки',
  'benchmark.form.group.execution': 'Условия остановки',
  'benchmark.form.group.advanced': 'Дополнительно',
  'benchmark.form.inputStdev': 'Разброс входа (±)',
  'benchmark.form.inputMin': 'Мин. вход',
  'benchmark.form.inputMax': 'Макс. вход',
  'benchmark.form.sharegpt.tokenLengthSettings': 'Настройки длины Token',
  'benchmark.form.sharegpt.tokenLengthSettings.tip':
    'Можно задать только минимум длины входа, только максимум или оба значения. Длина выхода также необязательна: по умолчанию используется длина исходного ответа.',
  'benchmark.form.sharegpt.inputRangeError':
    'Максимум входа должен быть не меньше минимума',
  'benchmark.form.sharegpt.positiveInteger':
    'Введите положительное целое число',
  'benchmark.form.outputStdev': 'Разброс выхода (±)',
  'benchmark.form.outputMin': 'Мин. выход',
  'benchmark.form.outputMax': 'Макс. выход',
  'benchmark.form.sharedPrefix': 'Общий префикс',
  'benchmark.form.prefix.tip':
    'Общий префикс промпта (системный промпт / RAG-контекст), разделяемый между запросами для проверки повторного использования prefix-cache. По бакету — Prefix Length: Token префикса; Count: число различных префиксов; Weight: относительная доля запросов с ним.',
  'benchmark.form.prefix.intro':
    'Общий префикс промпта (системный промпт / контекст RAG), разделяемый запросами для проверки повторного использования кэша префиксов. Добавьте несколько корзин, чтобы смешать длины префиксов по весу.',
  'benchmark.form.prefix.length': 'Длина префикса',
  'benchmark.form.prefix.count': 'Количество',
  'benchmark.form.prefix.weight': 'Вес',
  'benchmark.form.prefix.add': 'Добавить префикс',
  'benchmark.form.concurrencyList.tips':
    'Запускает отдельный бенчмарк для каждого уровня параллелизма (например, 40, 60, 80). Оставьте пустым, чтобы использовать единую частоту запросов, указанную выше.',
  'benchmark.form.concurrencyList.placeholder': 'e.g. 40, 60, 80',
  'benchmark.form.profile.maxThroughput.tips':
    'Находит пик пропускной способности. Обычная база для сравнения GPU и моделей.',
  'benchmark.form.profile.latencySlo.tips':
    'Находит максимальную нагрузку, которая ещё укладывается в ваши цели TTFT/TPOT. Для планирования ёмкости.',
  'benchmark.form.profile.custom': 'Пользовательский',
  'benchmark.form.profile.custom.tips':
    'Задайте диапазон поиска для автонастройки или список этапов вручную — все поля доступны для редактирования.',
  'benchmark.table.inputTokenLength': 'Длина входа в Token',
  'benchmark.table.outputTokenLength': 'Длина выхода в Token',
  'benchmark.detail.summary.title': 'Сводка',
  'benchmark.detail.configure.title': 'Настроить',
  'benchmark.detail.environment.title': 'Окружение',
  'benchmark.detail.logs.title': 'Логи',
  'benchmark.form.totalRequests.tips': 'Всего запросов',
  'benchmark.table.filter.bygpu': 'Поиск GPU',
  'benchmark.table.filter.bymodel': 'Поиск модели',
  'benchmark.table.filter.bydataset': 'Фильтр по набору данных',
  'benchmark.table.filter.byLoadType': 'Фильтр по типу нагрузки',
  'benchmark.table.filter.byTargetMode': 'Фильтр по форме цели',
  'benchmark.table.filter.byProfile': 'Фильтр по профилю',
  'benchmark.table.best': 'Лучшая @',
  'benchmark.table.best.unit.concurrency': 'парал.',
  'benchmark.table.best.unit.rate': 'зап/с',
  'benchmark.table.coverage': 'Покрытие',
  'benchmark.table.coverage.insufficient': 'Недостаточно',
  'benchmark.table.avg': 'Среднее',
  'benchmark.table.tailLatency': 'Хвостовая задержка',
  'benchmark.table.columnSettings': 'Настройки столбцов',
  'benchmark.detail.summary.results': 'Результаты тестирования',
  'benchmark.detail.summary.recommendation': 'Основной результат',
  'benchmark.detail.summary.supporting': 'Подробные метрики',
  'benchmark.detail.summary.stages': 'Результаты по этапам',
  'benchmark.detail.summary.totalStages': 'этапов',
  'benchmark.detail.summary.totalRequests': 'запросов',
  'benchmark.detail.summary.totalDuration': 'время',
  'benchmark.detail.termination.requestsExhausted':
    'Остановлено досрочно: датасет исчерпан — выполнено только {processed}/{requested} запросов. Используйте больший датасет.',
  'benchmark.detail.termination.maxSeconds':
    'Остановлено досрочно: достигнут лимит времени этапа — выполнено {processed}/{requested} запросов.',
  'benchmark.detail.termination.maxErrors':
    'Остановлено досрочно: слишком много ошибок — выполнено {processed}/{requested} запросов.',
  'benchmark.detail.termination.default':
    'Остановлено досрочно ({reason}): выполнено {processed}/{requested} запросов.',
  'benchmark.detail.summary.stageDetail': 'Детали этапа',
  'benchmark.detail.summary.performance': 'Производительность',
  'benchmark.detail.reason.requestsSucceeded':
    'Успешно {ok} из {total} запросов',
  'benchmark.detail.reason.withinSlo': 'В рамках SLO',
  'benchmark.detail.reason.peakExceedsSlo':
    'Пиковая пропускная способность выше при {rate} {unit}, но работа там нарушит SLO — поэтому рекомендуется граница SLO.',
  'benchmark.detail.reason.matchesPeak':
    'Наибольшая устойчивая пропускная способность',
  'benchmark.detail.validity.title': 'Покрытие теста',
  'benchmark.detail.validity.ok': 'В норме',
  'benchmark.detail.validity.overload':
    'Проба Throughput отправляет запросы максимально быстро (без ограничения скорости) и перегрузила сервер (успешно лишь {rate}%) — пиковая пропускная способность ненадёжна и отражает предел насыщения сервера.',
  'benchmark.detail.validity.underRange':
    'Оптимальная рабочая точка — это самая высокая измеренная точка; истинный оптимум может быть выше. Расширьте диапазон (выше параллелизм/частота) и перезапустите.',
  'benchmark.detail.validity.fewPoints':
    'Слишком мало измеренных точек, чтобы доверять кривой — проверьте границы / бюджет.',
  'benchmark.detail.validity.sloNeverMet':
    'Ни одна измеренная точка не соответствует целевым задержкам — сервер слишком медленный для этого SLO; снизьте цели или смените развёртывание.',
  'benchmark.detail.validity.sloNotBinding':
    'Граница SLO не найдена. Поиск остановился на плато пропускной способности около {rate}, хотя максимальная измеренная нагрузка соответствовала целям задержки. Продолжите поиск SLO в подходящем диапазоне и бюджете.',
  'benchmark.detail.validity.notSaturated':
    'Оптимальная рабочая точка — самая высокая измеренная, и перегрузки не было — истинный оптимум может быть выше. Повысьте верхнюю границу диапазона поиска и перезапустите.',
  'benchmark.detail.validity.budgetExhausted':
    'Бюджет измерений исчерпан до завершения поиска результата. Увеличьте {which, select, seconds{максимальную общую длительность} other{максимальное число точек}} и повторите тест.',
  'benchmark.detail.validity.saturatedAtLowerBound':
    'Нижняя граница диапазона поиска выше того, что выдерживает это развёртывание (~{ceiling} зап/с), поэтому оптимум не может лежать внутри диапазона. Понизьте диапазон и перезапустите.',
  'benchmark.detail.validity.peakAtFloor':
    'Оптимальная рабочая точка — самая НИЗКАЯ измеренная: истинный оптимум может быть ниже диапазона поиска. Понизьте нижнюю границу и перезапустите.',
  'benchmark.detail.validity.pointHighError':
    'У измеренной точки низкая доля успеха (успешно {rate}%) — она перегрузила сервер и ненадёжна.',
  'benchmark.detail.reason.confidence': 'Уверенность',
  'benchmark.detail.confidence.high': 'Высокая',
  'benchmark.detail.confidence.medium': 'Средняя',
  'benchmark.detail.summary.metadata': 'Метаданные',
  'benchmark.detail.summary.metrics': 'Метрики теста',
  'benchmark.detail.summary.latency': 'Задержка',
  'benchmark.detail.summary.throughput': 'Пропускная способность',
  'benchmark.detail.summary.request': 'Запросы',
  'benchmark.detail.avg.reqLatency': 'Средняя задержка запроса',
  'benchmark.detail.avg.ttft': 'Среднее TTFT',
  'benchmark.detail.avg.tpot': 'Среднее TPOT',
  'benchmark.detail.avg.itl': 'ITL сред.',
  'benchmark.detail.throughput.totalToken': 'Общая пропускная способность',
  'benchmark.detail.throughput.inputToken': 'Входная пропускная способность',
  'benchmark.detail.throughput.outputToken': 'Выходная пропускная способность',
  'benchmark.detail.requests.total': 'Всего запросов',
  'benchmark.detail.requests.success': 'Успешные запросы',
  'benchmark.detail.requests.failed': 'Неудачные запросы',
  'benchmark.detail.requests.incomplete': 'Незавершённые запросы',
  'benchmark.detail.requests.concurrency': 'Достигнутая параллельность (сред.)',
  'benchmark.detail.requests.concurrency.max':
    'Достигнутая параллельность (макс.)',
  'benchmark.detail.percentile.latency': 'Задержка',
  'benchmark.detail.percentile.inputTokens': 'Входные Token',
  'benchmark.detail.percentile.outputTokens': 'Выходные Token',
  'benchmark.detail.percentile.input': 'Вход',
  'benchmark.detail.percentile.output': 'Выход',
  'benchmark.detail.percentile.total': 'Всего',
  'benchmark.detail.configure.tokenLength': 'Длина в Token (вход/выход)',
  'benchmark.detail.percentile.title': 'Перцентиль',
  'benchmark.detail.modelName': 'Имя модели',
  'benchmark.detail.instanceName': 'Имя экземпляра',
  'benchmark.detail.members.title': 'Участники',
  'benchmark.detail.members.role': 'Роль',
  'benchmark.detail.members.injected': 'Внедрённые параметры',
  'benchmark.detail.members.endpoint': 'Точка входа',
  'benchmark.detail.configure': 'Конфигурация',
  'benchmark.detail.config.deployment': 'Развёртывание',
  'benchmark.detail.config.benchmark': 'Бенчмарк',
  'benchmark.detail.best.peak': 'Пиковая пропускная способность',
  'benchmark.detail.best.slo': 'Макс. в рамках SLO',
  'benchmark.detail.slo.target': 'Цель SLO',
  'benchmark.detail.slo.capacity': 'Ёмкость по SLO',
  'benchmark.detail.slo.capacity.locatedHint':
    'Выше этого значения измерена нагрузка, нарушающая SLO, — значит это и есть реальная граница.',
  'benchmark.detail.slo.capacity.floorHint':
    'Выше этого значения ничего не измерялось — поиск закончился раньше, — поэтому читайте его как «не менее этого». Реальная точка нарушения находится выше и не была измерена.',
  'benchmark.detail.tpot.tip':
    'TPOT: время фазы Decode на выходной Token = (последний Token − первый Token) / (выходные Token − 1), без задержки первого Token. Это inter_token_latency_ms в guidellm и тот же TPOT, который сообщают vLLM и подобные инструменты. Если сервер не отдаёт поток по частям (весь вывод одним фрагментом, что часто бывает при низкой нагрузке), измерять нечего, и здесь используется время на Token с учётом первого Token.',
  'benchmark.detail.itl.tip':
    'ITL (Inter-Token Latency) — измеренный интервал между последовательными потоковыми ответами: одна выборка на интервал, объединённая по всем запросам, без задержки первого Token. От TPOT отличается гранулярностью выборки: TPOT даёт одно среднее на запрос, поэтому отдельное подвисание усредняется остальными интервалами того же запроса, тогда как ITL сохраняет каждый интервал и подвисание попадает в хвост. Определение совпадает с vLLM и SGLang. Чанк с несколькими Token (спекулятивное декодирование) по-прежнему считается одним интервалом.',
  'benchmark.detail.chart.sloBreached': 'Нарушение SLO',
  'benchmark.detail.chart.success': 'Доля успешных',
  'benchmark.detail.reason.peakTradeoff':
    'Пик при {rate} {unit}: общая пропускная способность {gain}%, TTFT p99 {cost}',
  'benchmark.detail.unit.avg': 'сред.',
  'benchmark.detail.p99.ttft': 'TTFT p99',
  'benchmark.detail.p99.tpot': 'TPOT p99',
  'benchmark.detail.p99.itl': 'ITL p99',
  'benchmark.detail.max.itl': 'ITL макс.',
  'benchmark.detail.lowSample':
    'На этом этапе {count} измерений, выше p99 находится всего {tail} — хвост определяют единичные запросы. Читайте как ориентир, а не как вывод по SLO (для p99 нужно ~1000 измерений).',
  'benchmark.detail.successPill': 'Успешно {pct}% · {ok} / {total} запросов',
  'benchmark.detail.summary.stagesHint':
    'Нажмите на любую строку, чтобы увидеть детали',
  'benchmark.detail.chart.loadSweep': 'Развёртка нагрузки',
  'benchmark.detail.chart.loadSweep.note':
    'Общая пропускная способность и {metric} при росте нагрузки',
  'benchmark.detail.chart.dualAxisHint':
    'Левая ось (общая пропускная способность) линейная — каждая линия сетки добавляет одинаковую величину. Правая ось логарифмическая для отображаемого показателя задержки — каждая линия в 10 раз больше предыдущей. Название показателя указано в заголовке правой оси.',
  'benchmark.detail.chart.logHint':
    'Каждая линия сетки по этой оси в 10 раз больше предыдущей, поэтому равные отношения дают равные расстояния. На линейной шкале этапы с низкой нагрузкой прижались бы к нулю.',
  'benchmark.detail.chart.ttftDist': 'Распределение TTFT',
  'benchmark.detail.chart.ttftDist.note':
    'Полоса p25–p75 + линия p50 + пунктир p99 · расширение полосы означает расхождение основной массы',
  'benchmark.detail.chart.rateShortfall':
    'Частота запросов: заданная и достигнутая',
  'benchmark.detail.chart.rateShortfall.note':
    'Первый этап, где линии расходятся, — реальный предел',
  'benchmark.detail.chart.latencyComposition': 'Состав задержки',
  'benchmark.detail.chart.latencyComposition.note':
    'Между линиями — всё после первого Token (Decode, вытеснение планировщиком, ожидание пакета)',
  'benchmark.detail.chart.frontier': 'Граница задержка–пропускная способность',
  'benchmark.detail.chart.frontier.note':
    'Во сколько хвостовой задержки обходится каждый дополнительный tok/s · одна точка — один этап',
  'benchmark.detail.chart.throughputSplit': 'Состав пропускной способности',
  'benchmark.detail.chart.throughputSplit.note':
    'Доля входа и выхода — преобладает Prefill или Decode',
  'benchmark.detail.chart.concShortfall':
    'Параллельность: заданная и фактическая',
  'benchmark.detail.chart.concShortfall.note':
    'Линии практически совпадают, поэтому разрыв показан на отдельной красной шкале справа',
  'benchmark.detail.chart.efficiency': 'Кривая эффективности',
  'benchmark.detail.chart.efficiency.note':
    'tok/s на один активный запрос · начало убывающей отдачи',
  'benchmark.detail.chart.latencyDist': 'Распределение задержки запроса',
  'benchmark.detail.chart.latencyDist.note':
    'Сквозное время одного запроса: ожидание, первый Token и вся генерация',
  'benchmark.detail.chart.tpotPercentiles': 'Перцентили TPOT',
  'benchmark.detail.chart.tpotPercentiles.note':
    'Время фазы Decode на Token без первого Token · одно значение на запрос, поэтому график показывает замедление Decode под нагрузкой, а не отдельные задержки',
  'benchmark.detail.chart.itlPercentiles': 'Перцентили ITL',
  'benchmark.detail.chart.itlPercentiles.note':
    'Измеренный интервал между последовательными потоковыми ответами · одна выборка на интервал, поэтому хвост показывает отдельные подвисания',
  'benchmark.detail.chart.success.note':
    'Показано, потому что часть запросов не удалась',
  'benchmark.detail.chart.legend.shortfall': 'Дефицит',
  'benchmark.detail.chart.legend.attainment': 'Достигнуто',
  'benchmark.detail.chart.legend.configured': 'Целевая',
  'benchmark.detail.chart.legend.achieved': 'Факт (сред.)',
  'benchmark.detail.chart.legend.actual': 'Факт (сред.)',
  'benchmark.detail.chart.legend.generation': 'Генерация',
  'benchmark.detail.chart.legend.perRequest': 'tok/s на запрос',
  'benchmark.detail.chart.axis.latencyMs': 'Задержка (мс)',
  'benchmark.detail.chart.axis.latencySec': 'Задержка запроса (с)',
  'benchmark.detail.chart.axis.inFlight': 'Активные запросы',
  'benchmark.detail.chart.axis.shortfall': 'Дефицит (запросы)',
  'benchmark.detail.chart.axis.successRate': 'Успешность (%)',
  'benchmark.detail.chart.axis.load.rate': 'Целевая частота запросов (req/s)',
  'benchmark.detail.chart.axis.load.concurrency':
    'Целевая параллельность (запросы)',
  'benchmark.detail.chart.axis.throughput':
    'Общая пропускная способность (токенов/с)',
  'benchmark.detail.chart.axis.concurrencyAvg':
    'Достигнутая параллельность (сред.) (запросы)',
  'benchmark.detail.reason.peakTradeoffPlain':
    'Пик при {rate} {unit}: общая пропускная способность {gain}%',
  'benchmark.detail.summary.showMore': 'Показать ещё {n}',
  'benchmark.detail.summary.showLess': 'Свернуть',
  'benchmark.detail.selectedStage': 'Выбранный этап',
  'benchmark.detail.showPercentiles': 'Показать перцентили',
  'benchmark.detail.hidePercentiles': 'Скрыть перцентили',
  'benchmark.detail.status': 'Статус',
  'benchmark.detail.status.recommended': 'Ёмкость SLO',
  'benchmark.detail.status.peak': 'Пиковая пропускная способность',
  'benchmark.detail.status.overloaded': 'Перегрузка',
  'benchmark.detail.status.healthy': 'Норма',
  'benchmark.state.stoppedAt': 'Остановлено на {percent}%',
  'benchmark.detail.stopReason.label': 'Поиск остановлен на',
  'benchmark.detail.stopReason.capacityPlateau': 'плато пропускной способности',
  'benchmark.detail.stopReason.upperBound': 'верхней границе диапазона',
  'benchmark.detail.stopReason.budgetPoints': 'исчерпании бюджета точек',
  'benchmark.detail.stopReason.budgetSeconds': 'исчерпании бюджета времени',
  'benchmark.detail.stopReason.sloFailed': 'превышении порога задержки',
  'benchmark.detail.stopReason.converged': 'сходимости',
  'benchmark.detail.stopReason.overloaded': 'перегрузке сервера',
  'benchmark.detail.stopReason.pointFailed': 'точке без результата',
  'benchmark.detail.stopReason.probeBound': 'пределе зондирования насыщения',
  'benchmark.detail.recommend.text':
    'Оптимум: параллелизм {rate} — {pct}% пиковой пропускной способности ({tps} tok/s) при TTFT {ttft} мс{slo, select, yes{, в рамках SLO} other{}}.',
  'benchmark.detail.analysis.text':
    'Параллелизм {rate} обеспечивает {tps} tok/s{prev, select, yes{ — на {prevUp}% больше, чем {prevRate}} other{}}{next, select, yes{; переход к {nextRate} добавляет лишь {nextUp}% пропускной способности, но {nextTtftUp}% к TTFT} other{}}. Поэтому {rate} — оптимальная рабочая точка{slo, select, yes{, в рамках SLO} other{}}.',
  'benchmark.detail.specDigest': 'Поколение конфигурации',
  'benchmark.detail.modelFile': 'Файл модели',
  'benchmark.detail.kvCache': 'Расширенный KV-кеш',
  'benchmark.detail.cacheService': 'Сервис кеширования',
  'benchmark.detail.speculativeDecoding': 'Спекулятивное декодирование',
  'benchmark.detail.inputOutputTokenLength': 'Длина в Token (вход/выход)',
  'benchmark.env.gpuName': 'Имя GPU',
  'benchmark.env.workerName': 'Имя Worker',
  'benchmark.env.hostedMembers': 'Размещённые участники',
  'benchmark.env.index': 'Индекс',
  'benchmark.env.system': 'Система',
  'benchmark.env.runtimeVersion': 'Версия среды выполнения',
  'benchmark.env.driverVersion': 'Версия драйвера',
  'benchmark.env.cpuCounts': 'Ядра CPU',
  'benchmark.table.export.results': 'Экспортировать результаты',
  'benchmark.form.nonLlmModel.tips':
    'В настоящее время бенчмарки поддерживают только модели LLM',
  'benchmark.detail.result.duration': 'Длительность',
  'benchmark.detail.result.basic': 'Основное',
  'benchmark.form.pdGroup.tips':
    'Разделённая группа измеряется целиком: каждый запрос поступает через её маршрутизатор, поэтому выбирать участника не нужно. Сервер направляет нагрузку на маршрутизатор и запускает генератор нагрузки на Worker, где хранятся веса модели.',
  'benchmark.detail.monitoring': 'Мониторинг',
  'benchmark.detail.monitoring.tips':
    'Открыть панель мониторинга за интервал этого запуска. Разделённая группа откроется на панели PD, где очередь Prefill, очередь Decode и передача KV показаны отдельно.',
  'benchmark.form.targetMode': 'Форма цели тестирования',
  'benchmark.form.targetMode.instance': 'Экземпляр (измеряется движок)',
  'benchmark.form.targetMode.route': 'Маршрут (измеряется развёртывание)',
  'benchmark.form.targetMode.tips.instance':
    'Нагрузка направляется прямо в один движок — маршрутизатор группы или одну реплику обычной модели, — и на пути нет ничего, кроме движка.',
  'benchmark.form.targetMode.tips.route':
    'Нагрузка входит там же, где и клиентский трафик, поэтому участвуют все реплики обычной модели; используйте этот режим, чтобы сравнить разделённое и объединённое развёртывания на одинаковом числе карт.',
  'benchmark.form.targetMode.tips.results.title':
    'Интерпретация результатов маршрута',
  'benchmark.form.targetMode.tips.results':
    'В режиме маршрута в путь попадает прокси сервера. При высокой нагрузке прокси может насытиться раньше развёртывания и начать отбрасывать запросы, а отброшенные запросы не попадают в показатели задержки — поэтому TTFT / TPOT могут выглядеть лучше, чем есть. Результаты режима маршрута читайте вместе с числом ошибок и незавершённых запросов.',
  'benchmark.detail.targetMode.route': 'Маршрут (развёртывание) · {route}',
  'benchmark.form.target.route': 'Маршрут',
  'benchmark.form.target.route.empty':
    'В этом кластере нет маршрута, ведущего к работающей LLM. Разверните маршрут или измерьте экземпляр.'
};
