export default {
  'modelMonitoring.latencyStatistics': 'レイテンシ統計',
  'modelMonitoring.latencyStatisticsHelp':
    '監視のすべてのレイテンシ図で統計量を複数選択できます。最低 1 項目を選択し、インスタンス別表示にも適用します。Avg のみ対応する指標は Avg を維持します。元データは変更しません。',
  'modelMonitoring.fixedAverageStatistics':
    'この指標は Avg のみに対応し、分位数を選んでも平均値を表示します。',
  'modelMonitoring.state.statistic_not_supported':
    'この指標は選択した統計量に対応していません。',
  'modelMonitoring.pd.requestTiming': 'リクエスト時間の比較',
  'modelMonitoring.pd.timingQueue': 'キュー待機',
  'modelMonitoring.pd.timingPrefill': 'Prefill 段階',
  'modelMonitoring.pd.timingDecode': 'Decode 生成',
  'modelMonitoring.pd.timingRequest': 'ローカル全体',
  'modelMonitoring.pd.timingStatistic': '時間比較の統計量',
  'modelMonitoring.pd.timingHelp':
    '同じ役割の待機、処理／生成段階、ローカル全体を同じ統計量で比較します。全体の時間はより広い区間を含み、曲線は加算できる内訳ではありません。分位数の差で待機を計算せず、非対応の段階は省略し、欠測は 0 にしません。',
  'modelMonitoring.pd.completionDuration': 'KV 転送完了時間',
  'modelMonitoring.pd.completionHelp':
    '転送開始から完了報告までの時間です。送信登録とバックエンド待機を含み、純粋な通信時間や TTFT ではありません。NIXL は Decode、vLLM Mooncake は Prefill を使用します。',
  'modelMonitoring.pd.sglangCompletionHelp':
    'Prefill コネクタが報告する転送段階の時間です。Decode の Bootstrap 時間では代用しません。転送情報が必要で、欠測は 0 ではありません。',
  'modelMonitoring.pd.transferThroughput': 'KV 転送スループット',
  'modelMonitoring.pd.transferThroughputHelp':
    '完了した転送バイト数の実時間あたりのレートです。区間値は選択期間の平均です。速度分位数や NIC 使用率ではありません。NIXL は Decode、vLLM Mooncake と SGLang は Prefill を使用します。転送イベントはユーザーリクエスト単位とは限りません。',
  'modelMonitoring.pd.handoffBacklog': '引き渡し待機リクエスト',
  'modelMonitoring.pd.transferFailures': '転送失敗',
  'modelMonitoring.pd.bootstrapFailures': 'ハンドシェイク失敗',
  'modelMonitoring.pd.expiredKV': '期限切れ KV',
  'modelMonitoring.pd.eventUnit': '件',
  'modelMonitoring.pd.eventsHelp':
    '選択期間のカウンター増加量の推定値です。リセットを考慮するため小数の場合があります。役割・インスタンス別に表示し、失敗リクエスト総数として加算しません。欠測は 0 ではありません。NIXL に含まれるハンドシェイク・通知失敗を二重計上しません。',
  'modelMonitoring.histogramBoundsHelp':
    '「>」は元のヒストグラム範囲を超える下限値です。超過した点を正確な分位値として描画しません。',
  'modelMonitoring.state.histogram_quantile_out_of_range':
    '分位値が計測範囲を超えているため、正確な曲線は表示できません。',
  'modelMonitoring.state.histogram_bounds_unavailable':
    '一部の分位値の範囲を検証できませんでした。再試行してください。',

  'modelMonitoring.state.no_gateway_samples':
    '選択期間にゲートウェイのリクエストサンプルがありません。',
  'modelMonitoring.state.gateway_bypassed':
    'このリクエスト経路は GPUStack ゲートウェイを経由しません。',
  'modelMonitoring.observationNotes': '観測の説明',
  'modelMonitoring.observationUnsupported': '未対応',
  'modelMonitoring.observationNotApplicable': '対象外',

  'modelMonitoring.summaryUnavailable': 'Summary unavailable',
  'modelMonitoring.valuesHelp':
    'A dash means no valid observation; zero is a measured value. Latency requires request samples.',

  'modelMonitoring.legendValuesHelp':
    '凡例は各曲線の最後の有効サンプルです。性能サマリーは各ヘルプに記載された統計と範囲を使用します。',
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
  'modelMonitoring.switchDeploymentFailed':
    '選択したデプロイメントを開けませんでした。',
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
    'エンジンの連続する出力イベント間隔です。バッチや投機的デコード時の定義はエンジンに従い、リクエスト平均 TPOT とは異なります。概要は選択期間の P99 を表示します。',
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
    'この範囲ではローリング指標のサンプルが不足しています',
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
  'modelMonitoring.originalTime': '元の時刻',
  'modelMonitoring.segmentLoad': '目標負荷',
  'modelMonitoring.segmentMeasurement': '測定点',
  'modelMonitoring.segmentProgress': '時間 {seconds} 秒・進捗 {progress}%',
  'modelMonitoring.pd.monitoringTitle': 'PD パフォーマンスと引き継ぎ',
  'modelMonitoring.pd.scopeHelp':
    'P と D は役割ごとに観測します。サービス入口、エンジン内部、コネクターの計測範囲は異なります。',
  'modelMonitoring.pd.performance': 'サービス品質とロールプール',
  'modelMonitoring.pd.serviceExperience': 'サービス品質',
  'modelMonitoring.pd.ingressTTFT': 'サービス TTFT',
  'modelMonitoring.pd.ingressE2E': 'サービスリクエスト遅延',
  'modelMonitoring.pd.ingressUnavailable':
    'サービス入口で未収集です。エンジン内部の遅延では代替しません。',
  'modelMonitoring.pd.ingressHelp':
    'エンジン内部および Benchmark クライアントとは独立したゲートウェイ計測です。Higress は累積時間と件数のみを提供するため Avg のみ利用でき、P50/P95/P99 はありません。選択期間の対象デプロイへの全ゲートウェイトラフィックを表示し、他のリクエストを含む場合があります。P/D ロール別には分割できません。',
  'modelMonitoring.pd.rolePools': 'ロールプール',
  'modelMonitoring.pd.poolHelp':
    'Router のリクエストレートと Prefill 入力・Decode 出力スループットを比較し、各役割のキュー、レイテンシ、KV を確認します。選択した統計量を適用し、P/D のリクエスト数や分位数は加算しません。',
  'modelMonitoring.pd.poolView': 'ロールプール表示',
  'modelMonitoring.pd.prefillDuration': 'Prefill フェーズ時間',
  'modelMonitoring.pd.decodeDuration': 'Decode フェーズ時間',
  'modelMonitoring.pd.inputThroughput': '入力スループット',
  'modelMonitoring.pd.outputThroughput': '出力スループット',
  'modelMonitoring.pd.input': 'Prefill · 入力スループット',
  'modelMonitoring.pd.output': 'Decode · 出力スループット',
  'modelMonitoring.pd.pWaiting': 'Prefill · 待機リクエスト',
  'modelMonitoring.pd.dWaiting': 'Decode · 待機リクエスト',
  'modelMonitoring.pd.decodeTPOT': 'Decode · TPOT',
  'modelMonitoring.pd.stageHelp':
    'P エンジンの初回スケジュールから最初のローカルトークンまで。Prefill 中の中断を含み、初回待機時間は除外します。GPU の純計算時間やサービス TTFT ではありません。',
  'modelMonitoring.pd.prefillFallbackHelp':
    'このバックエンドでは Prefill 時間の定義が確認できません。P 側の入力トークン処理速度を表示し、Decode TTFT で代替しません。',
  'modelMonitoring.pd.queuesHelp':
    'この役割の実行中・待機中リクエストです。同じ要求が P と D に現れるため、クライアント同時実行数として加算しません。',
  'modelMonitoring.pd.kvHelp':
    '各線はエンジン内 KV プールです。最も混雑したプールを確認し、平均で満杯のエンジンを隠したり割合を合計しません。',
  'modelMonitoring.pd.roleDetails': 'キャッシュ観測',
  'modelMonitoring.pd.localTTFT': 'エンジン内部 TTFT',
  'modelMonitoring.pd.localTimingHelp':
    'この役割がリクエストを受信してからエンジンの処理完了までの時間で、待機と実行を含みます。Decode が Prefill／KV を待つ場合もあります。クライアント全体の時間ではなく、役割ごとの分位数の加減算で分解できません。',
  'modelMonitoring.pd.queueTimeHelp':
    'この役割のエンジン内キュー時間です。引き継ぎ専用キューは別に表示します。',
  'modelMonitoring.pd.decodeDurationHelp':
    'D エンジンの最初のローカルトークンから最後まで。生成中断を含み、トークン単位の遅延ではありません。',
  'modelMonitoring.pd.prefixHelp':
    'エンジン内プレフィックスキャッシュの検索とヒットです。リモート KV 転送成功率ではありません。',
  'modelMonitoring.pd.decodeMetric': 'Decode 遅延指標',
  'modelMonitoring.pd.poolCurrent': '役割内の現在サンプル',
  'modelMonitoring.pd.rolePoolHelp':
    'Ready 数はデプロイ状態です。Router メンバーの健全性は別の観測です。',
  'modelMonitoring.pd.roleResponsibilities': '役割',
  'modelMonitoring.pd.roleResources': '関連リソース',
  'modelMonitoring.pd.prefillResponsibility': '入力処理と KV 生成',
  'modelMonitoring.pd.decodeResponsibility': 'KV 受信とトークン生成',
  'modelMonitoring.pd.routerResponsibility': 'ルーティングと転送',
  'modelMonitoring.pd.handoff': 'KV 引き継ぎ',
  'modelMonitoring.pd.handoffHelp':
    'PD モードごとにコネクターの観測範囲が異なります。重複する可能性があるため、時間を合計して TTFT にしません。',
  'modelMonitoring.pd.bootstrap': 'Bootstrap ハンドシェイク時間',
  'modelMonitoring.pd.bootstrapHelp':
    'D 側の Bootstrap ハンドシェイクです。KV データ転送時間ではありません。割当と転送キューも確認します。',
  'modelMonitoring.pd.allocation': 'KV 受信用割当時間',
  'modelMonitoring.pd.allocationHelp':
    'エンジンが報告する D 側 KV 受信の割当時間です。転送帯域や Prefill 計算時間ではありません。',
  'modelMonitoring.pd.handoffDetails': 'コネクターキューと転送観測',
  'modelMonitoring.pd.bootstrapQueue': 'Bootstrap 待機リクエスト',
  'modelMonitoring.pd.inflightQueue': '引き継ぎ処理中リクエスト',
  'modelMonitoring.pd.preallocQueue': '事前割当待機リクエスト',
  'modelMonitoring.pd.handoffQueueHelp':
    'コネクター固有の段階別キューです。通常のエンジン待機とは別で、同じ要求が複数を通るため件数を加算しません。',
  'modelMonitoring.pd.routerDetails': 'Router リクエストとメンバー健全性',
  'modelMonitoring.pd.routerRequests': 'Router · リクエストレート',
  'modelMonitoring.pd.requestRate': 'リクエストレート',
  'modelMonitoring.pd.routerRequestHelp':
    'Router の観測値です。P と D のリクエスト件数は加算しません。',
  'modelMonitoring.pd.routerDuration': '観測された転送時間',
  'modelMonitoring.pd.routerDurationHelp':
    'Router のリクエスト時間は上流の実行を含む場合があります。ルート選択だけの時間ではなく、エンジン時間と加算できません。',
  'modelMonitoring.pd.tokenHelp':
    '入力トークンは P、生成トークンは D から取得します。エンジン処理量で、クライアントの有効スループットではありません。',
  'modelMonitoring.pd.transferDuration': 'KV 転送時間',
  'modelMonitoring.pd.transferHelp':
    'Connector 固有の転送イベント時間です。NIXL は送信開始からバックエンドの完了通知までを計測し、同期送信処理とバックエンド待機を含みます。クライアント TTFT ではなく、送信処理時間を再加算しません。',
  'modelMonitoring.pd.transferPost': 'KV 転送投入時間',
  'modelMonitoring.pd.transferPostHelp':
    'NIXL 転送を開始してバックエンドへ送信する同期処理時間です。呼び出しの復帰はデータ転送完了を意味しません。転送全体の時間に含まれ、加算できません。',
  'modelMonitoring.pd.transferQueue': 'KV 転送待機リクエスト',
  'modelMonitoring.pd.transferSize': 'KV 転送サイズ',
  'modelMonitoring.pd.transferSizeHelp':
    'コネクターが報告する転送サイズ分布です。サンプル不足は観測なしであり、0 バイト転送ではありません。',
  'modelMonitoring.pd.transferSpeed': 'KV 転送の報告速度',
  'modelMonitoring.pd.transferSpeedHelp':
    'コネクターが直接報告する速度のみを使います。KV サイズをハンドシェイクや割当時間で割って帯域を作りません。',
  'modelMonitoring.pd.tpotHelp':
    'Decode 側の完了リクエストごとの、最初の Token 以降の出力 Token あたり平均時間です。継続的な生成速度を確認でき、Decode 段階全体の時間とは異なります。集計とインスタンス別の両方に選択した統計量を適用し、分位数を平均・加算しません。',
  'modelMonitoring.pd.itlHelp':
    'Decode エンジンの連続する出力イベント間隔です。バッチ出力の定義はエンジンに従い、生成の揺らぎや停止を確認します。クライアントでの出力間隔やリクエスト平均 TPOT とは異なります。',
  'modelMonitoring.pd.externalCacheHelp':
    'この役割のエンジンが報告する外部キャッシュの検索とヒットです。ローカルプレフィックスや KV 転送成功率とは異なります。',
  'modelMonitoring.trendStatisticsExplanation':
    'Avg は観測リクエストの平均時間、P50・P95・P99 はヒストグラムから推定した分位数です。各点は移動窓の値で、実行全体や独立した Benchmark ステージの統計ではありません。インスタンスの分位数は平均や加算できません。',
  'modelMonitoring.trendWindow': '移動窓：',
  'modelMonitoring.pd.roleInstances': 'ロールとインスタンス',
  'modelMonitoring.pd.engineObservation': 'エンジン内の観測',
  'modelMonitoring.pd.routerObservation': 'Router の観測',
  'modelMonitoring.pd.connectorObservation': 'Connector の観測',
  'modelMonitoring.pd.serviceObservation': 'サービス入口の観測',
  'modelMonitoring.pd.handoffQueues': '受け渡しと受信キュー'
};
