export default {
  'modelMonitoring.latencyStatistics': 'Статистика задержки',
  'modelMonitoring.latencyStatisticsHelp':
    'Выберите одну или несколько статистик для всех графиков задержки, включая экземпляры. Хотя бы одна остаётся выбранной. Метрики только со средним сохраняют Avg. Исходные данные не меняются.',
  'modelMonitoring.fixedAverageStatistics':
    'Эта метрика поддерживает только Avg и сохраняет среднее при выборе квантилей.',
  'modelMonitoring.state.statistic_not_supported':
    'Метрика не поддерживает выбранную статистику.',
  'modelMonitoring.pd.requestTiming': 'Сравнение времени запроса',
  'modelMonitoring.pd.timingQueue': 'Очередь',
  'modelMonitoring.pd.timingPrefill': 'Этап Prefill',
  'modelMonitoring.pd.timingDecode': 'Генерация Decode',
  'modelMonitoring.pd.timingRequest': 'Локальный полный запрос',
  'modelMonitoring.pd.timingStatistic': 'Статистика сравнения времени',
  'modelMonitoring.pd.timingHelp':
    'Сравнение очереди, обработки/генерации и локального полного запроса одной роли по одинаковой статистике. Полное время охватывает более широкий интервал: кривые нельзя складывать, а квантили — вычитать для расчёта ожидания. Неподдерживаемые этапы пропущены; отсутствие данных не означает ноль.',
  'modelMonitoring.pd.completionDuration': 'Время завершения передачи KV',
  'modelMonitoring.pd.completionHelp':
    'Время от запуска до завершения, включая отправку и ожидание бэкенда. Это не чистое сетевое время и не TTFT. NIXL: Decode; vLLM Mooncake: Prefill.',
  'modelMonitoring.pd.sglangCompletionHelp':
    'Время этапа передачи от Prefill. Рукопожатие Bootstrap на Decode не используется как замена. Требуется телеметрия коннектора; отсутствие данных не означает ноль.',
  'modelMonitoring.pd.transferThroughput': 'Пропускная способность передачи KV',
  'modelMonitoring.pd.transferThroughputHelp':
    'Байты завершённых передач в секунду реального времени; значение за интервал является средним. Это не квантиль скорости и не загрузка сетевой карты. NIXL: Decode; vLLM Mooncake и SGLang: Prefill. События передачи не равны уникальным запросам.',
  'modelMonitoring.pd.handoffBacklog': 'Очередь передачи KV',
  'modelMonitoring.pd.transferFailures': 'Ошибки передачи',
  'modelMonitoring.pd.bootstrapFailures': 'Ошибки рукопожатия',
  'modelMonitoring.pd.expiredKV': 'Истёкшие KV',
  'modelMonitoring.pd.eventUnit': 'событий',
  'modelMonitoring.pd.eventsHelp':
    'Оценка прироста счётчика за выбранный интервал с учётом сбросов; возможны дробные значения. Роли и экземпляры показываются отдельно, не как уникальные неудачные запросы. Нет данных не означает ноль. Ошибки NIXL могут включать ошибки рукопожатия и уведомления; повторно их не учитывают.',
  'modelMonitoring.histogramBoundsHelp':
    '«>» означает известную нижнюю границу за пределами диапазона гистограммы. Такие точки не рисуются как точные квантили.',
  'modelMonitoring.state.histogram_quantile_out_of_range':
    'Квантили превышают диапазон гистограммы; точная кривая недоступна.',
  'modelMonitoring.state.histogram_first_bucket_unresolved':
    'Все образцы за один из интервалов попали в первый бакет задержки, поэтому гистограмма не позволяет определить квантили за этот интервал.',
  'modelMonitoring.state.histogram_bounds_unavailable':
    'Не удалось проверить границы некоторых квантилей. Повторите запрос.',

  'modelMonitoring.state.no_gateway_samples':
    'За выбранный интервал нет образцов запросов шлюза.',
  'modelMonitoring.state.gateway_bypassed':
    'Этот путь запроса обходит шлюз GPUStack.',
  'modelMonitoring.observationNotes': 'Сведения о наблюдениях',
  'modelMonitoring.observationUnsupported': 'Не поддерживается',
  'modelMonitoring.observationNotApplicable': 'Не применимо',

  'modelMonitoring.summaryUnavailable': 'Summary unavailable',
  'modelMonitoring.valuesHelp':
    'A dash means no valid observation; zero is a measured value. Latency requires request samples.',

  'modelMonitoring.legendValuesHelp':
    'Легенда показывает последний действительный отсчёт каждой кривой. Сводки производительности используют статистику и диапазон, указанные в их справке.',
  'modelMonitoring.jumpTo': 'Jump to',
  'modelMonitoring.badge.avg': 'Сред.',
  'modelMonitoring.badge.current': 'Текущ.',
  'modelMonitoring.badge.selectedEnd': 'Конец',
  'modelMonitoring.metric.total_tokens': 'Total tokens',
  'modelMonitoring.tokenTotalDefinition':
    'Total tokens = input tokens + output tokens; missing observations remain gaps',
  'modelMonitoring.usedMemory': 'Used',
  'modelMonitoring.loadedRevisions': 'Showing the latest {count} revisions',
  'modelMonitoring.sectionNavigation': 'Monitoring sections',
  'modelMonitoring.sectionVisibility': 'Section visibility',
  'modelMonitoring.observedBy': 'Observing router',
  'modelMonitoring.latestValidSample': 'Last valid sample',
  'modelMonitoring.sampleCount': 'Observations',
  'modelMonitoring.seriesLegend': 'Series legend',
  'modelMonitoring.deploymentOverview': 'Deployment overview',
  'modelMonitoring.modelRoute': 'Model route',
  'modelMonitoring.metadataUnavailable': 'Unavailable',
  'modelMonitoring.configurationRevision': 'Latest configuration revision',
  'modelMonitoring.revisionCreated': 'Revision created',
  'modelMonitoring.instanceCount': '{count} instances',
  'modelMonitoring.clusterFallback': 'Cluster #{id}',
  'modelMonitoring.hostFollowsGPU': 'Follows the worker of the selected GPU',
  'modelMonitoring.viewMode': 'View',
  'modelMonitoring.clearInstances': 'Clear instance filter to show all',
  'modelMonitoring.refreshInterval': 'Auto-refresh every 60 seconds',
  'modelMonitoring.chip': 'Chip',
  'modelMonitoring.viewRelatedInstances': 'View related instances',
  'modelMonitoring.noGPUAllocated': 'No GPU allocated',
  'modelMonitoring.resourceVisibilityUnavailable':
    'Related GPU resources are not visible or have not been reported',
  'modelMonitoring.modelAndBackend': 'Model and backend',
  'modelMonitoring.deploymentScheduling': 'Deployment and scheduling',
  'modelMonitoring.cacheEngineParameters': 'Cache and engine parameters',
  'modelMonitoring.revisionCapabilities': 'Version information',
  'modelMonitoring.viewYaml': 'View YAML',
  'modelMonitoring.repository': 'Repository',
  'modelMonitoring.deploymentMode': 'Deployment mode',
  'modelMonitoring.standardReplicas': 'Standard replicas',
  'modelMonitoring.desiredInstances': 'Desired instances',
  'modelMonitoring.autoRestart': 'Auto restart',
  'modelMonitoring.placementStrategy': 'Placement strategy',
  'modelMonitoring.gpuPerInstance': 'GPUs / instance',
  'modelMonitoring.cacheConfiguration': 'Cache configuration',
  'modelMonitoring.metricCapabilities': 'Observed metric capabilities',
  'modelMonitoring.statisticsHelp': 'Statistics help',
  'modelMonitoring.statisticsExplanation':
    'Avg is the mean of valid observations over the selected interval. P50, P95 and P99 estimate the values below which about 50%, 95% and 99% of observations fall, using histogram buckets. Accuracy depends on bucket boundaries. The summary covers the full selected interval; trend points use a shorter window. Do not average percentiles from separate instances or add percentiles from different stages.',
  'modelMonitoring.instanceLatencyStatistics':
    'Show Avg / P50 / P95 / P99 for all instances together; use the legend to focus a series.',
  'modelMonitoring.showAllSeries': 'Restore all curves',
  'modelMonitoring.selectedSeriesNoSamples':
    'No valid samples for the selected series.',
  'modelMonitoring.legendInteractionHelp':
    'Click a legend item to isolate its curve; click again to restore all, or use the reset button at the top right of the chart.',
  'modelMonitoring.chartInteractionHelp': 'Chart help',
  'modelMonitoring.legendMultiSelectionHelp':
    'Hold Shift while clicking legend items to show or hide individual curves. Ctrl or Cmd also works.',
  'modelMonitoring.chartInspectionHelp':
    'Hover to inspect values. Focus the chart and use arrow keys to inspect samples; Escape dismisses the tooltip. Table shows every sample.',
  'modelMonitoring.moreSeries':
    '{count} more series; see the legend or table for all values.',
  'modelMonitoring.allDevicesHistoryRequiresBackend':
    'This backend has not provided all-device history; only returned series are shown.',
  'modelMonitoring.outputThroughput': 'Output token throughput',
  'modelMonitoring.cacheScope': 'Model scope · not shared-service totals',
  'modelMonitoring.notUpstreamHealth': 'Not upstream health',
  'modelMonitoring.close': 'Close',
  'modelMonitoring.pdQueues': 'P / D scheduling queues',
  'modelMonitoring.pdKVUsage': 'P / D engine KV usage',
  'modelMonitoring.separateRoleQueues':
    'Separate role observations; do not sum into unique requests',
  'modelMonitoring.separateRoleKV': 'By role / instance; never sum percentages',
  'modelMonitoring.viewInGrafana': 'View in Grafana',
  'modelMonitoring.pdGrafanaScope':
    'PD Grafana shows the roles of selected instances; it does not isolate individual instances.',
  'modelMonitoring.state.partial_metric_data':
    'Some component observations are limited; available data is retained.',
  'modelMonitoring.state.incompatible_histogram_buckets':
    'Incompatible histogram buckets: affected quantiles are unavailable; other valid statistics are retained.',
  'modelMonitoring.state.partial_source_observations':
    'Some source observations are incomplete; affected statistics are unavailable.',

  'modelMonitoring.runtimeHistory':
    'Verified source history of current instances in the selected window; deleted instances are not included.',
  'modelMonitoring.viewGPUTrends': 'View GPU trends',
  'modelMonitoring.deployments': 'Model deployments',
  'modelMonitoring.deployment': 'Deployment',
  'modelMonitoring.deploymentUnavailable': 'Deployment is unavailable',
  'modelMonitoring.switchDeploymentFailed':
    'Не удалось открыть выбранное развёртывание.',
  'modelMonitoring.overview': 'Overview',
  'modelMonitoring.monitoring': 'Monitoring',
  'modelMonitoring.instances': 'Instances',
  'modelMonitoring.gpuResources': 'GPU resources',
  'modelMonitoring.configuration': 'Configuration',
  'modelMonitoring.viewDetails': 'View details',
  'modelMonitoring.viewResources': 'View GPU resources',
  'modelMonitoring.viewMonitoring': 'View monitoring',
  'modelMonitoring.performance': 'Performance summary',
  'modelMonitoring.window': 'Time range',
  'modelMonitoring.instance': 'Instance',
  'modelMonitoring.allInstances': 'All instances',
  'modelMonitoring.role': 'Role',
  'modelMonitoring.allRoles': 'All roles',
  'modelMonitoring.aggregate': 'Aggregated',
  'modelMonitoring.byInstance': 'By instance',
  'modelMonitoring.lastRefreshed': 'Last refreshed',
  'modelMonitoring.lastSuccess': 'Last successful refresh',
  'modelMonitoring.refresh': 'Refresh',
  'modelMonitoring.device': 'GPU device',
  'modelMonitoring.scope': 'Scope',
  'modelMonitoring.source': 'Source',
  'modelMonitoring.backend': 'Backend',
  'modelMonitoring.cluster': 'Cluster',
  'modelMonitoring.deploymentCluster': 'Кластер развёртывания',
  'modelMonitoring.readyInstances': 'Готовые экземпляры',
  'modelMonitoring.modelSource': 'Источник модели',
  'modelMonitoring.created': 'Created',
  'modelMonitoring.access': 'Access policy',
  'modelMonitoring.status': 'Status',
  'modelMonitoring.current': 'Current sample',
  'modelMonitoring.windowP99': 'Selected-window P99',
  'modelMonitoring.windowAverage': 'Selected-window average',
  'modelMonitoring.definition': 'Metric definition',
  'modelMonitoring.table': 'Table',
  'modelMonitoring.chart': 'Chart',
  'modelMonitoring.time': 'Time',
  'modelMonitoring.partial': 'Partial observation coverage',
  'modelMonitoring.intervalStats': 'Whole-window Avg / P50 / P95 / P99',
  'modelMonitoring.summaryScope': 'Interval summary scope',
  'modelMonitoring.allSeriesTable': 'Table includes all series',
  'modelMonitoring.keyboardChart':
    'Time series. Use left/right arrows, Home or End to inspect samples. The table contains every value.',
  'modelMonitoring.engineScope':
    'Engine observations; scoped to selected instances',
  'modelMonitoring.sharedHardware':
    'Shared physical resources; not model-exclusive usage',
  'modelMonitoring.hardwareHistory':
    'Owner-qualified history of currently associated devices; not a complete historical placement record.',
  'modelMonitoring.physicalGPU': 'Physical GPU (shared)',
  'modelMonitoring.partition': 'GPU partition',
  'modelMonitoring.history': 'History',
  'modelMonitoring.historyAvailable': 'History available',
  'modelMonitoring.historyUnavailable':
    'History unavailable / identity not verified',
  'modelMonitoring.reportedAt': 'Worker last reported',
  'modelMonitoring.selectedDeviceHistory': 'Selected device history',
  'modelMonitoring.totalMemory': 'Total',
  'modelMonitoring.resourceInventory': 'Related device inventory',
  'modelMonitoring.currentScope': 'Current scope',
  'modelMonitoring.stale':
    'Refresh failed. Retaining last successful data for this scope; values are stale.',
  'modelMonitoring.requestError':
    'Metrics could not be refreshed. Retry without changing the scope.',
  'modelMonitoring.localLatency':
    'Recorded by the engine for the selected role; it does not represent the full latency seen by the client.',
  'modelMonitoring.pdTokens':
    'Input tokens: Prefill; output tokens: Decode. Roles are not added twice.',
  'modelMonitoring.roleQueues': 'Role-local queue; group default is Decode',
  'modelMonitoring.requestQueues': 'Running and waiting requests',
  'modelMonitoring.tokenThroughput': 'Token throughput',
  'modelMonitoring.trendStatistic': 'Trend statistic',
  'modelMonitoring.intervalVsTrend':
    'Stats cover the whole selected window; curve points use the shorter rate window:',
  'modelMonitoring.generationView': 'Generation latency metric',
  'modelMonitoring.phaseNote':
    'The P99 values for individual stages may come from different requests. Adding them does not give the P99 of total latency; use the Engine-local request latency chart below.',
  'modelMonitoring.pdNote':
    'PD deployment: input token metrics come from Prefill; output tokens and generation latency come from Decode. Engine observations for individual roles do not represent full client latency. Request counts default to Decode; switch roles to inspect another role.',
  'modelMonitoring.handoffScope':
    'Decode-side handoff observations; not full request latency',
  'modelMonitoring.bootstrap': 'KV bootstrap handshake latency',
  'modelMonitoring.routerMembers': 'Router upstream member state',
  'modelMonitoring.routerHealth': 'Router-observed health',
  'modelMonitoring.healthy': 'Healthy',
  'modelMonitoring.unhealthy': 'Unhealthy',
  'modelMonitoring.removed': 'Removed',
  'modelMonitoring.unknown': 'Unknown',
  'modelMonitoring.unresolvedMember': 'Unresolved upstream identity',
  'modelMonitoring.ready': 'ready',
  'modelMonitoring.deploymentTotal': 'Deployment-wide role readiness',
  'modelMonitoring.expandAll': 'Expand all',
  'modelMonitoring.collapseAll': 'Collapse all',
  'modelMonitoring.historyScope':
    'Runtime history follows the server-authorized source and epoch scope.',
  'modelMonitoring.draining': 'Draining',
  'modelMonitoring.inference': 'Inference',
  'modelMonitoring.restartCount': 'Restarts',
  'modelMonitoring.actions': 'Actions',
  'modelMonitoring.logs': 'Logs',
  'modelMonitoring.contextLength': 'Context length',
  'modelMonitoring.engineParameters': 'Engine parameters',
  'modelMonitoring.section.llm': 'LLM performance',
  'modelMonitoring.section.stages': 'Request and phase latency',
  'modelMonitoring.section.cache': 'Engine cache',
  'modelMonitoring.section.pd': 'PD diagnostics',
  'modelMonitoring.section.gpu': 'GPU monitoring',
  'modelMonitoring.section.host': 'Host monitoring',
  'modelMonitoring.metric.ttft': 'Time to first token · TTFT',
  'modelMonitoring.metric.tpot': 'Generation time · TPOT',
  'modelMonitoring.metric.itl': 'Output interval · ITL',
  'modelMonitoring.metric.e2e': 'Engine-local request latency',
  'modelMonitoring.metric.queue': 'Queue time',
  'modelMonitoring.metric.prefill': 'Prefill time',
  'modelMonitoring.metric.decode': 'Decode time',
  'modelMonitoring.metric.input_tokens': 'Input tokens',
  'modelMonitoring.metric.output_tokens': 'Output tokens',
  'modelMonitoring.metric.running_requests': 'Running requests',
  'modelMonitoring.metric.waiting_requests': 'Waiting requests',
  'modelMonitoring.metric.kv_usage': 'KV cache utilization',
  'modelMonitoring.metric.kvMaximum': 'Highest engine KV usage',
  'modelMonitoring.metric.prefix_cache_hit_rate':
    'Engine prefix cache hit rate',
  'modelMonitoring.metric.external_cache_hit_rate': 'External cache hit rate',
  'modelMonitoring.metric.pd_kv_transfer': 'KV transfer duration',
  'modelMonitoring.metric.gpu_utilization': 'GPU utilization',
  'modelMonitoring.metric.gpu_memory_used': 'GPU memory used / total',
  'modelMonitoring.metric.gpu_memory_total': 'Total GPU memory',
  'modelMonitoring.metric.gpu_power': 'GPU power draw',
  'modelMonitoring.metric.gpu_temperature': 'GPU temperature',
  'modelMonitoring.metric.host_cpu': 'Host CPU utilization',
  'modelMonitoring.metric.host_memory_used': 'Host memory used / total',
  'modelMonitoring.metric.host_memory_total': 'Total host memory',
  'modelMonitoring.help.ttft':
    'Time from arrival at the engine until its first output token. The overview shows the selected-window P99.',
  'modelMonitoring.help.tpot':
    'Each request’s average generation time per output token after the first token. The overview shows the P99 of those request averages.',
  'modelMonitoring.help.itl':
    'Интервалы между последовательными событиями вывода движка с учётом пакетного и спекулятивного декодирования. Отличаются от среднего TPOT запроса. В обзоре показан P99 выбранного периода.',
  'modelMonitoring.state.available': 'Available',
  'modelMonitoring.state.no_data': 'No data',
  'modelMonitoring.state.no_observations': 'No request samples',
  'modelMonitoring.state.unsupported': 'This metric is not provided.',
  'modelMonitoring.state.not_applicable':
    'Not applicable to the selected role or scope.',
  'modelMonitoring.state.query_error': 'This metric could not be queried.',
  'modelMonitoring.state.restricted':
    'You do not have access to these observations.',
  'modelMonitoring.state.stale': 'Observations are stale.',
  'modelMonitoring.state.prometheus_unavailable':
    'Prometheus is unavailable or not configured.',
  'modelMonitoring.state.query_failed': 'This metric could not be queried.',
  'modelMonitoring.state.insufficient_phase_rate_window':
    'Недостаточно выборок в этом интервале для скользящей метрики',
  'modelMonitoring.state.no_samples': 'No data',
  'modelMonitoring.state.zero_observations': 'No request samples',
  'modelMonitoring.state.role_not_applicable':
    'This metric is not applicable to the selected role.',
  'modelMonitoring.state.metric_not_provided':
    'The current engine or exporter does not provide this metric.',
  'modelMonitoring.state.source_identity_unresolved':
    'The observation source identity could not be verified.',
  'modelMonitoring.state.device_identity_unresolved':
    'Device identity could not be verified; history is unavailable.',
  'modelMonitoring.state.resource_not_visible':
    'Related resource observations are restricted.',
  'modelMonitoring.state.legacy_history_unavailable':
    'Stable-identity history is not available for this device.',
  'modelMonitoring.customTimeRange': 'Custom time range',
  'modelMonitoring.customRangeRequiresBackend':
    'Update the backend to use custom time ranges',
  'modelMonitoring.queryRangeLimit': 'Query span: {minimum}–{maximum}',
  'modelMonitoring.retentionConfiguredTime': 'Prometheus retention: {duration}',
  'modelMonitoring.retentionUnknown': 'Retention unknown',
  'modelMonitoring.retentionSizeBased': 'Storage-size retention enabled',
  'modelMonitoring.retentionNotGuarantee':
    'Configured retention does not guarantee samples throughout the interval or the earliest queryable time.',
  'modelMonitoring.rangeCapabilityStale': 'Last successfully read settings',
  'modelMonitoring.applyTimeRange': 'Apply time range',
  'modelMonitoring.rangeStart': 'Start time',
  'modelMonitoring.rangeEnd': 'End time',
  'modelMonitoring.fixedRangeRefresh':
    'Refresh re-queries this fixed interval without moving its endpoints.',
  'modelMonitoring.historicalScopeNote':
    'Trends and statistics use the selected interval; deployment status and resource snapshots remain the latest reports.',
  'modelMonitoring.timeRangeError.missing': 'Select both endpoints.',
  'modelMonitoring.timeRangeError.invalid': 'Start must be earlier than end.',
  'modelMonitoring.timeRangeError.future': 'End cannot be in the future.',
  'modelMonitoring.timeRangeError.tooShort': 'Select at least {minimum}.',
  'modelMonitoring.timeRangeError.tooLong': 'Select no more than {maximum}.',
  'modelMonitoring.selectedEnd': 'At selected end time',
  'modelMonitoring.liveResourceSnapshot':
    'Resource rows show the latest reported snapshots, not a replay of the historical interval.',
  'modelMonitoring.originalTime': 'Исходное время',
  'modelMonitoring.segmentLoad': 'Целевая нагрузка',
  'modelMonitoring.segmentMeasurement': 'Измерение',
  'modelMonitoring.segmentProgress':
    'Длительность {seconds} с · прогресс {progress}%',
  'modelMonitoring.pd.monitoringTitle': 'Производительность PD и передача',
  'modelMonitoring.pd.scopeHelp':
    'Пулы P и D наблюдаются отдельно. Вход сервиса, движок и коннектор имеют разные границы измерения.',
  'modelMonitoring.pd.performance': 'Качество сервиса и пулы ролей',
  'modelMonitoring.pd.serviceExperience': 'Качество сервиса',
  'modelMonitoring.pd.ingressTTFT': 'TTFT сервиса',
  'modelMonitoring.pd.ingressE2E': 'Задержка запроса сервиса',
  'modelMonitoring.pd.ingressUnavailable':
    'На входе сервиса метрика не собирается. Локальная задержка движка не подставляется.',
  'modelMonitoring.pd.ingressHelp':
    'Измерения шлюза независимы от движка и клиента Benchmark. Higress предоставляет суммы длительности и количество запросов: доступно только Avg, без P50/P95/P99. Графики показывают весь трафик шлюза к развёртыванию за выбранный интервал, включая возможные посторонние запросы. Разделение по ролям P/D недоступно.',
  'modelMonitoring.pd.rolePools': 'Пулы ролей',
  'modelMonitoring.pd.poolHelp':
    'Сопоставляйте частоту запросов Router с входной пропускной способностью Prefill и выходной Decode, затем проверяйте очереди, задержку и KV каждой роли. Задержка использует выбранную статистику; не складывайте число запросов P/D или квантили.',
  'modelMonitoring.pd.poolView': 'Вид пулов ролей',
  'modelMonitoring.pd.prefillDuration': 'Длительность фазы Prefill',
  'modelMonitoring.pd.decodeDuration': 'Длительность фазы Decode',
  'modelMonitoring.pd.inputThroughput': 'Входная пропускная способность',
  'modelMonitoring.pd.outputThroughput': 'Выходная пропускная способность',
  'modelMonitoring.pd.input': 'Prefill · Входная пропускная способность',
  'modelMonitoring.pd.output': 'Decode · Выходная пропускная способность',
  'modelMonitoring.pd.pWaiting': 'Prefill · Ожидающие запросы',
  'modelMonitoring.pd.dWaiting': 'Decode · Ожидающие запросы',
  'modelMonitoring.pd.decodeTPOT': 'Decode · TPOT',
  'modelMonitoring.pd.stageHelp':
    'От первого планирования в P до первого локально зарегистрированного токена. Включает прерывания Prefill, исключает начальную очередь. Это не чистое время GPU и не TTFT сервиса.',
  'modelMonitoring.pd.prefillFallbackHelp':
    'Бэкенд не предоставляет подтверждённую длительность Prefill. Вместо неё показывается скорость обработки входных токенов P, без подстановки TTFT Decode.',
  'modelMonitoring.pd.queuesHelp':
    'Только выполняемые и ожидающие запросы этой роли. Один пользовательский запрос может присутствовать в P и D; сумма пулов не равна клиентской конкурентности.',
  'modelMonitoring.pd.kvHelp':
    'Каждая линия — локальный KV-пул движка. Сравнивайте самый загруженный пул; не скрывайте заполнение средним и не суммируйте проценты P и D.',
  'modelMonitoring.pd.roleDetails': 'Наблюдение кэша',
  'modelMonitoring.pd.localTTFT': 'TTFT движка',
  'modelMonitoring.pd.localTimingHelp':
    'Время от получения запроса этой ролью до завершения движком, включая ожидание и выполнение. Decode также может ждать Prefill/KV. Это не полная клиентская задержка; квантили ролей нельзя складывать или вычитать для разложения запроса.',
  'modelMonitoring.pd.queueTimeHelp':
    'Время локальной очереди этой роли; очереди передачи показаны отдельно.',
  'modelMonitoring.pd.decodeDurationHelp':
    'От первого до последнего локального токена в D. Включает прерывания генерации; это не задержка на токен.',
  'modelMonitoring.pd.prefixHelp':
    'Попадания при поиске префиксов в локальном кэше; это не успешность удалённой передачи KV.',
  'modelMonitoring.pd.decodeMetric': 'Метрика задержки Decode',
  'modelMonitoring.pd.poolCurrent': 'Текущая выборка роли',
  'modelMonitoring.pd.rolePoolHelp':
    'Готовность — состояние развёртывания; здоровье участников Router наблюдается отдельно.',
  'modelMonitoring.pd.roleResponsibilities': 'Назначение',
  'modelMonitoring.pd.roleResources': 'Связанные ресурсы',
  'modelMonitoring.pd.prefillResponsibility': 'Обработка входа и создание KV',
  'modelMonitoring.pd.decodeResponsibility': 'Приём KV и генерация токенов',
  'modelMonitoring.pd.routerResponsibility':
    'Маршрутизация и пересылка запросов',
  'modelMonitoring.pd.handoff': 'Передача KV',
  'modelMonitoring.pd.handoffHelp':
    'Границы наблюдений коннектора зависят от режима PD. Интервалы могут пересекаться; их нельзя суммировать в TTFT.',
  'modelMonitoring.pd.bootstrap': 'Длительность рукопожатия Bootstrap',
  'modelMonitoring.pd.bootstrapHelp':
    'Рукопожатие Bootstrap на D, не передача данных KV. Сопоставляйте с выделением и очередями передачи.',
  'modelMonitoring.pd.allocation': 'Время выделения для приёма KV',
  'modelMonitoring.pd.allocationHelp':
    'Выделение для приёма KV на D по данным движка. Это не полоса передачи и не время вычислений Prefill.',
  'modelMonitoring.pd.handoffDetails': 'Очереди коннектора и передача',
  'modelMonitoring.pd.bootstrapQueue': 'Запросы в очереди Bootstrap',
  'modelMonitoring.pd.inflightQueue': 'Запросы в процессе передачи',
  'modelMonitoring.pd.preallocQueue':
    'Запросы в очереди предварительного выделения',
  'modelMonitoring.pd.handoffQueueHelp':
    'Очереди жизненного цикла коннектора, отдельно от общей очереди движка. Один запрос может проходить несколько очередей; их нельзя суммировать как уникальные запросы.',
  'modelMonitoring.pd.routerDetails': 'Запросы Router и здоровье участников',
  'modelMonitoring.pd.routerRequests': 'Router · Частота запросов',
  'modelMonitoring.pd.requestRate': 'Частота запросов',
  'modelMonitoring.pd.routerRequestHelp':
    'Наблюдается в Router; количества запросов P и D не суммируются.',
  'modelMonitoring.pd.routerDuration': 'Наблюдаемое время пересылки',
  'modelMonitoring.pd.routerDurationHelp':
    'Время запроса Router может включать выполнение upstream. Это не чистые расходы выбора маршрута; его нельзя складывать с задержками движка.',
  'modelMonitoring.pd.tokenHelp':
    'Входные токены берутся из P, выходные — из D. Это обработка движком, не клиентская полезная пропускная способность.',
  'modelMonitoring.pd.transferDuration': 'Длительность передачи KV',
  'modelMonitoring.pd.transferHelp':
    'Время нативных событий передачи Connector. NIXL измеряет от отправки до сообщения бэкенда о завершении, включая синхронную отправку и ожидание бэкенда. Это не клиентский TTFT; время отправки повторно не прибавляется.',
  'modelMonitoring.pd.transferPost': 'Время отправки передачи KV',
  'modelMonitoring.pd.transferPostHelp':
    'Синхронное время запуска и отправки передачи NIXL. Возврат вызова не означает завершение перемещения данных. Оно включено в общее время передачи и не суммируется с ним.',
  'modelMonitoring.pd.transferQueue': 'Запросы в очереди передачи KV',
  'modelMonitoring.pd.transferSize': 'Объём передачи KV',
  'modelMonitoring.pd.transferSizeHelp':
    'Распределение объёма передачи по данным коннектора. Отсутствие выборок не означает передачу нуля байт.',
  'modelMonitoring.pd.transferSpeed': 'Скорость передачи KV по отчёту',
  'modelMonitoring.pd.transferSpeedHelp':
    'Используется только скорость, сообщённая коннектором. Не делите объём KV на время рукопожатия или выделения для вычисления полосы.',
  'modelMonitoring.pd.tpotHelp':
    'Среднее время на выходной токен после первого для каждого завершённого запроса Decode. Показывает устойчивую скорость генерации, а не полную длительность этапа Decode. Агрегированные и поэкземплярные кривые используют выбранную статистику; квантили не усредняются и не складываются.',
  'modelMonitoring.pd.itlHelp':
    'Интервалы между последовательными событиями вывода движка Decode с учётом правил пакетного вывода. Помогают обнаружить колебания и паузы генерации. Это не клиентский интервал вывода и не средний TPOT запроса.',
  'modelMonitoring.pd.externalCacheHelp':
    'Поиск и попадания внешнего кэша по данным движка этой роли; не локальный кэш префиксов и не успешность передачи KV.',
  'modelMonitoring.trendStatisticsExplanation':
    'Avg — средняя задержка наблюдаемых запросов; P50, P95 и P99 оцениваются по корзинам гистограммы. Каждая точка использует скользящее окно, а не весь запуск или отдельный этап Benchmark. Квантили экземпляров нельзя усреднять или суммировать.',
  'modelMonitoring.trendWindow': 'Скользящее окно:',
  'modelMonitoring.pd.roleInstances': 'Роли и экземпляры',
  'modelMonitoring.pd.engineObservation': 'Наблюдения движка',
  'modelMonitoring.pd.routerObservation': 'Наблюдения Router',
  'modelMonitoring.pd.connectorObservation': 'Наблюдения Connector',
  'modelMonitoring.pd.serviceObservation': 'Наблюдения на входе сервиса',
  'modelMonitoring.pd.handoffQueues': 'Очереди передачи и приёма'
};
