export default {
  'modelMonitoring.latencyStatistics': 'Gecikme istatistikleri',
  'modelMonitoring.latencyStatisticsHelp':
    'Tüm izleme gecikme grafikleri için bir veya daha fazla istatistik seçin; örnek görünümüne de uygulanır. En az biri seçili kalır. Yalnızca Avg destekleyen ölçümler Avg olarak kalır. Kaydedilen veri değişmez.',
  'modelMonitoring.fixedAverageStatistics':
    'Bu ölçüm yalnızca Avg destekler ve yüzdelikler seçildiğinde de ortalamayı gösterir.',
  'modelMonitoring.state.statistic_not_supported':
    'Bu ölçüm seçilen istatistikleri desteklemiyor.',
  'modelMonitoring.pd.requestTiming': 'İstek süresi karşılaştırması',
  'modelMonitoring.pd.timingQueue': 'Kuyruk beklemesi',
  'modelMonitoring.pd.timingPrefill': 'Prefill aşaması',
  'modelMonitoring.pd.timingDecode': 'Decode üretimi',
  'modelMonitoring.pd.timingRequest': 'Yerel tam istek',
  'modelMonitoring.pd.timingStatistic': 'Süre karşılaştırma istatistiği',
  'modelMonitoring.pd.timingHelp':
    'Aynı rolün kuyruk, işleme/üretim ve yerel tam istek sürelerini aynı istatistikle karşılaştırır. Tam süre daha geniş bir aralıktır; eğriler toplanabilen parçalar değildir ve bekleme için yüzdelikler çıkarılmaz. Desteklenmeyen aşamalar atlanır; eksik örnekler sıfır değildir.',
  'modelMonitoring.pd.completionDuration': 'KV aktarım tamamlanma süresi',
  'modelMonitoring.pd.completionHelp':
    'Aktarım başlangıcından tamamlanma bildirimine kadar geçen, gönderim ve arka uç beklemesini içeren süredir. Saf ağ süresi veya TTFT değildir. NIXL: Decode; vLLM Mooncake: Prefill.',
  'modelMonitoring.pd.sglangCompletionHelp':
    'Prefill bağlayıcısının bildirdiği aktarım süresidir. Decode Bootstrap süresiyle değiştirilmez. Telemetri gerekir; eksik veri sıfır değildir.',
  'modelMonitoring.pd.transferThroughput': 'KV aktarım verimi',
  'modelMonitoring.pd.transferThroughputHelp':
    'Tamamlanan aktarım baytlarının gerçek zaman saniyesi başına hızıdır; aralık değeri seçili dönemin ortalamasıdır. Tek aktarım yüzdeliği veya NIC kullanımı değildir. NIXL: Decode; vLLM Mooncake ve SGLang: Prefill. Aktarım olayları benzersiz kullanıcı istekleri değildir.',
  'modelMonitoring.pd.handoffBacklog': 'Devir bekleyen istekler',
  'modelMonitoring.pd.transferFailures': 'Aktarım hataları',
  'modelMonitoring.pd.bootstrapFailures': 'El sıkışma hataları',
  'modelMonitoring.pd.expiredKV': 'Süresi dolan KV',
  'modelMonitoring.pd.eventUnit': 'olay',
  'modelMonitoring.pd.eventsHelp':
    'Seçili aralıkta sıfırlamaları dikkate alan tahmini sayaç artışıdır; kesirli olabilir. Roller ve örnekler ayrı gösterilir, benzersiz başarısız istek toplamı olarak toplanmaz. Eksik veri sıfır değildir. NIXL hataları el sıkışma ve bildirim hatalarını içerebilir; iki kez sayılmaz.',
  'modelMonitoring.histogramBoundsHelp':
    '“>”, kaynak histogram aralığının ötesindeki bilinen alt sınırı gösterir. Bu noktalar kesin yüzdelik değerleri olarak çizilmez.',
  'modelMonitoring.state.histogram_quantile_out_of_range':
    'Yüzdelikler histogram aralığını aşıyor; kesin eğri kullanılamıyor.',
  'modelMonitoring.state.histogram_first_bucket_unresolved':
    'Bir zaman aralığındaki tüm örnekler ilk gecikme kovasına düştüğü için histogram o aralıktaki yüzdelikleri belirleyemiyor.',
  'modelMonitoring.state.histogram_bounds_unavailable':
    'Bazı yüzdelik sınırları doğrulanamadı. Sorguyu yeniden deneyin.',

  'modelMonitoring.state.no_gateway_samples':
    'Seçilen aralıkta ağ geçidi istek örneği yok.',
  'modelMonitoring.state.gateway_bypassed':
    'Bu istek yolu GPUStack ağ geçidini atlar.',
  'modelMonitoring.observationNotes': 'Gözlem açıklamaları',
  'modelMonitoring.observationUnsupported': 'Desteklenmiyor',
  'modelMonitoring.observationNotApplicable': 'Uygulanamaz',

  'modelMonitoring.summaryUnavailable': 'Summary unavailable',
  'modelMonitoring.valuesHelp':
    'A dash means no valid observation; zero is a measured value. Latency requires request samples.',

  'modelMonitoring.legendValuesHelp':
    'Gösterge değerleri her eğrinin son geçerli örneğidir. Performans özetleri, kendi yardımlarında açıklanan istatistiği ve kapsamı kullanır.',
  'modelMonitoring.jumpTo': 'Jump to',
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
  'modelMonitoring.switchDeploymentFailed': 'Seçilen dağıtım açılamadı.',
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
    'Motorun ardışık çıktı olayları arasındaki aralıklar, toplu ve spekülatif kod çözme kurallarına göre kaydedilir. İstek ortalaması TPOT değerinden farklıdır. Genel bakış seçilen dönemin P99 değerini gösterir.',
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
    'Bu aralıkta kayan metrik için yeterli örnek yok',
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
  'modelMonitoring.originalTime': 'Orijinal zaman',
  'modelMonitoring.segmentLoad': 'Hedef yük',
  'modelMonitoring.segmentMeasurement': 'Ölçüm',
  'modelMonitoring.segmentProgress':
    'Süre {seconds}s · aşama ilerlemesi %{progress}',
  'modelMonitoring.pd.monitoringTitle': 'PD performansı ve aktarım',
  'modelMonitoring.pd.scopeHelp':
    'P ve D ayrı rol havuzlarıdır. Servis girişi, motor ve bağlayıcı süreleri farklı sınırları ölçer.',
  'modelMonitoring.pd.performance': 'Servis deneyimi ve rol havuzları',
  'modelMonitoring.pd.serviceExperience': 'Servis deneyimi',
  'modelMonitoring.pd.ingressTTFT': 'Servis TTFT',
  'modelMonitoring.pd.ingressE2E': 'Servis istek gecikmesi',
  'modelMonitoring.pd.ingressUnavailable':
    'Servis girişinde toplanmıyor; motor gecikmesi yerine kullanılmaz.',
  'modelMonitoring.pd.ingressHelp':
    'Ağ geçidi ölçümleri motor ve Benchmark istemci sürelerinden bağımsızdır. Higress toplam süre ve istek sayısı sağlar: yalnızca Avg kullanılabilir, P50/P95/P99 yoktur. Grafikler seçilen aralıkta dağıtıma gelen tüm ağ geçidi trafiğini gösterir ve diğer istekleri içerebilir. P/D rolüne göre ayrılamaz.',
  'modelMonitoring.pd.rolePools': 'Rol havuzları',
  'modelMonitoring.pd.poolHelp':
    'Router istek hızını Prefill girdi ve Decode çıktı aktarımıyla karşılaştırın; ardından her rolün kuyruğunu, gecikmesini ve KV durumunu inceleyin. Gecikme seçilen istatistikleri kullanır; P/D istek sayıları veya yüzdelikler toplanmaz.',
  'modelMonitoring.pd.poolView': 'Rol havuzu görünümü',
  'modelMonitoring.pd.prefillDuration': 'Prefill aşaması süresi',
  'modelMonitoring.pd.decodeDuration': 'Decode aşaması süresi',
  'modelMonitoring.pd.inputThroughput': 'Girdi işleme hızı',
  'modelMonitoring.pd.outputThroughput': 'Çıktı işleme hızı',
  'modelMonitoring.pd.input': 'Prefill · Girdi işleme hızı',
  'modelMonitoring.pd.output': 'Decode · Çıktı işleme hızı',
  'modelMonitoring.pd.pWaiting': 'Prefill · Bekleyen istekler',
  'modelMonitoring.pd.dWaiting': 'Decode · Bekleyen istekler',
  'modelMonitoring.pd.decodeTPOT': 'Decode · TPOT',
  'modelMonitoring.pd.stageHelp':
    'P motorunda ilk zamanlamadan ilk yerel token kaydına kadar. Prefill kesintilerini içerir, ilk kuyruk beklemesini dışlar. Saf GPU hesaplama süresi veya servis TTFT değildir.',
  'modelMonitoring.pd.prefillFallbackHelp':
    'Bu arka uç doğrulanmış Prefill süresi sağlamaz. Yerine P girdi token hızı gösterilir; Decode TTFT kullanılmaz.',
  'modelMonitoring.pd.queuesHelp':
    'Yalnızca bu roldeki çalışan ve bekleyen istekler. Aynı kullanıcı isteği P ve D üzerinde görülebilir; havuzları istemci eşzamanlılığı olarak toplamayın.',
  'modelMonitoring.pd.kvHelp':
    'Her çizgi bir motorun yerel KV havuzudur. En yoğun havuzu karşılaştırın; dolu motoru ortalamayla gizlemeyin ve P/D yüzdelerini toplamayın.',
  'modelMonitoring.pd.roleDetails': 'Önbellek gözlemleri',
  'modelMonitoring.pd.localTTFT': 'Motor TTFT',
  'modelMonitoring.pd.localTimingHelp':
    'Bu rolün isteği almasından motorun tamamlamasına kadar geçen, bekleme ve yürütmeyi içeren süredir. Decode, Prefill/KV bekliyor olabilir. Tam istemci gecikmesi değildir; rol yüzdelikleri toplanarak veya çıkarılarak istek ayrıştırılamaz.',
  'modelMonitoring.pd.queueTimeHelp':
    'Bu rolün motor içi kuyruk süresi; aktarıma özel kuyruklar ayrı gösterilir.',
  'modelMonitoring.pd.decodeDurationHelp':
    'D motorundaki ilk yerel tokendan son tokena kadar; üretim kesintilerini içerir ve token başına gecikme değildir.',
  'modelMonitoring.pd.prefixHelp':
    'Motor içi önek önbellek aramaları ve isabetleri; uzak KV aktarım başarısı değildir.',
  'modelMonitoring.pd.decodeMetric': 'Decode gecikme metriği',
  'modelMonitoring.pd.poolCurrent': 'Rol içi güncel örnek',
  'modelMonitoring.pd.rolePoolHelp':
    'Hazırlık dağıtım durumudur; Router üye sağlığı ayrı bir gözlemdir.',
  'modelMonitoring.pd.roleResponsibilities': 'Sorumluluklar',
  'modelMonitoring.pd.roleResources': 'İlişkili kaynaklar',
  'modelMonitoring.pd.prefillResponsibility': 'Girdi işleme ve KV üretimi',
  'modelMonitoring.pd.decodeResponsibility': 'KV alımı ve token üretimi',
  'modelMonitoring.pd.routerResponsibility': 'Yönlendirme ve istek iletimi',
  'modelMonitoring.pd.handoff': 'KV aktarımı',
  'modelMonitoring.pd.handoffHelp':
    'Bağlayıcı ölçümleri PD moduna göre farklı aşamalardır. Süreler çakışabilir; TTFT üretmek için toplanmaz.',
  'modelMonitoring.pd.bootstrap': 'Bootstrap el sıkışma süresi',
  'modelMonitoring.pd.bootstrapHelp':
    'D tarafı Bootstrap el sıkışmasıdır, KV veri iletim süresi değildir. Ayırma ve aktarım kuyruklarıyla birlikte inceleyin.',
  'modelMonitoring.pd.allocation': 'KV alım ayırma süresi',
  'modelMonitoring.pd.allocationHelp':
    'Motorun bildirdiği D tarafı KV alım ayırma süresidir; aktarım bant genişliği veya Prefill hesaplama süresi değildir.',
  'modelMonitoring.pd.handoffDetails':
    'Bağlayıcı kuyrukları ve aktarım ölçümleri',
  'modelMonitoring.pd.bootstrapQueue': 'Bootstrap bekleyen istekler',
  'modelMonitoring.pd.inflightQueue': 'Aktarımda işlenen istekler',
  'modelMonitoring.pd.preallocQueue': 'Ön ayırma bekleyen istekler',
  'modelMonitoring.pd.handoffQueueHelp':
    'Genel motor kuyruğundan ayrı bağlayıcı yaşam döngüsü kuyruklarıdır. Aynı istek birden fazla kuyruktan geçebilir; benzersiz istek olarak toplamayın.',
  'modelMonitoring.pd.routerDetails': 'Router istekleri ve üye sağlığı',
  'modelMonitoring.pd.routerRequests': 'Router · İstek hızı',
  'modelMonitoring.pd.requestRate': 'İstek hızı',
  'modelMonitoring.pd.routerRequestHelp':
    'Router üzerinde gözlemlenir; P ve D istek sayıları toplanmaz.',
  'modelMonitoring.pd.routerDuration': 'Gözlemlenen iletim süresi',
  'modelMonitoring.pd.routerDurationHelp':
    'Router istek süresi üst motor yürütmesini içerebilir. Saf rota seçimi yükü değildir ve motor sürelerine eklenmez.',
  'modelMonitoring.pd.tokenHelp':
    'Girdi tokenları P, üretilen tokenlar D üzerinden okunur. Motor işleme hızıdır, istemci yararlı işleme hızı değildir.',
  'modelMonitoring.pd.transferDuration': 'KV aktarım süresi',
  'modelMonitoring.pd.transferHelp':
    'Connector aktarım olaylarının yerel süresidir. NIXL, gönderimin başlatılmasından arka ucun tamamlanma bildirimine kadar ölçer; eşzamanlı gönderim ve arka uç beklemesi dahildir. İstemci TTFT değildir; gönderim süresi tekrar eklenmez.',
  'modelMonitoring.pd.transferPost': 'KV aktarım gönderim süresi',
  'modelMonitoring.pd.transferPostHelp':
    'NIXL aktarımını başlatıp arka uca gönderme işleminin eşzamanlı süresidir. Çağrının dönmesi veri taşımanın tamamlandığı anlamına gelmez. Toplam aktarım süresine dahildir ve toplamla toplanmaz.',
  'modelMonitoring.pd.transferQueue': 'KV aktarımı bekleyen istekler',
  'modelMonitoring.pd.transferSize': 'KV aktarım boyutu',
  'modelMonitoring.pd.transferSizeHelp':
    'Bağlayıcının bildirdiği aktarım boyutu dağılımı. Eksik örnek sıfır bayt aktarım anlamına gelmez.',
  'modelMonitoring.pd.transferSpeed': 'Bildirilen KV aktarım hızı',
  'modelMonitoring.pd.transferSpeedHelp':
    'Yalnızca bağlayıcının bildirdiği hız kullanılır. Bant genişliği üretmek için KV baytlarını el sıkışma veya ayırma süresine bölmeyin.',
  'modelMonitoring.pd.tpotHelp':
    'Tamamlanan her Decode isteğinde ilk Token sonrasındaki çıktı Token başına ortalama süredir. Sürekli üretim hızını gösterir; Decode aşamasının toplam süresi değildir. Özet ve örnek eğrileri seçilen istatistikleri kullanır; yüzdelikler ortalanmaz veya toplanmaz.',
  'modelMonitoring.pd.itlHelp':
    'Decode motorunun ardışık çıktı olayları arasındaki aralıktır; toplu çıktı tanımı motora bağlıdır. Üretim dalgalanmalarını ve duraklamaları gösterir. İstemcideki çıktı aralığı veya istek ortalaması TPOT değildir.',
  'modelMonitoring.pd.externalCacheHelp':
    'Bu roldeki motorun bildirdiği harici önbellek aramaları ve isabetleri; yerel önek önbelleği veya KV aktarım başarısı değildir.',
  'modelMonitoring.trendStatisticsExplanation':
    'Avg gözlemlenen isteklerin ortalama süresidir; P50, P95 ve P99 histogram kovalarından tahmin edilen yüzdeliklerdir. Her nokta kayan pencere kullanır; tüm çalıştırma veya yalıtılmış Benchmark aşaması istatistiği değildir. Örnek yüzdelikleri ortalanamaz veya toplanamaz.',
  'modelMonitoring.trendWindow': 'Kayan pencere:',
  'modelMonitoring.pd.roleInstances': 'Roller ve örnekler',
  'modelMonitoring.pd.engineObservation': 'Motor gözlemleri',
  'modelMonitoring.pd.routerObservation': 'Router gözlemleri',
  'modelMonitoring.pd.connectorObservation': 'Connector gözlemleri',
  'modelMonitoring.pd.serviceObservation': 'Hizmet girişi gözlemleri',
  'modelMonitoring.pd.handoffQueues': 'Aktarım ve alma kuyrukları'
};
