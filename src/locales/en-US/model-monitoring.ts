export default {
  'modelMonitoring.latencyStatistics': 'Latency statistics',
  'modelMonitoring.latencyStatisticsHelp':
    'Choose one or more statistics for all monitoring latency charts, including instance views. At least one remains selected. Avg-only metrics stay Avg. This changes charts and tables, not the recorded data.',
  'modelMonitoring.fixedAverageStatistics':
    'This metric supports Avg only and continues to show its average when percentiles are selected.',
  'modelMonitoring.state.statistic_not_supported':
    'This metric does not support the selected statistics.',
  'modelMonitoring.pd.requestTiming': 'Request timing comparison',
  'modelMonitoring.pd.timingQueue': 'Queueing',
  'modelMonitoring.pd.timingPrefill': 'Prefill stage',
  'modelMonitoring.pd.timingDecode': 'Decode generation',
  'modelMonitoring.pd.timingRequest': 'Local full request',
  'modelMonitoring.pd.timingStatistic': 'Timing comparison statistic',
  'modelMonitoring.pd.timingHelp':
    'Compare this role’s queueing, processing/generation stage and local full-request timing using the globally selected statistics. Full-request timing covers a larger interval: curves are not additive segments, and percentiles cannot be subtracted to calculate waiting. Unsupported phases are omitted; missing samples are not zero.',
  'modelMonitoring.pd.completionDuration': 'KV transfer completion duration',
  'modelMonitoring.pd.completionHelp':
    'Connector time from initiation to reported completion, including submission and backend wait; not pure network time or client TTFT. NIXL reads Decode; vLLM Mooncake reads Prefill.',
  'modelMonitoring.pd.sglangCompletionHelp':
    'Transfer-stage duration reported by the Prefill connector. Never substitutes the Decode bootstrap handshake. Requires connector transfer telemetry; missing data does not mean zero duration.',
  'modelMonitoring.pd.transferThroughput': 'KV transfer throughput',
  'modelMonitoring.pd.transferThroughputHelp':
    'Reported completed transfer bytes per wall-clock second; the interval value is the selected-window average. Not a per-transfer speed percentile or NIC utilization. NIXL reads Decode; vLLM Mooncake and SGLang read Prefill. Transfer events are not unique user requests.',
  'modelMonitoring.pd.handoffBacklog': 'Handoff backlog',
  'modelMonitoring.pd.transferFailures': 'Transfer failures',
  'modelMonitoring.pd.bootstrapFailures': 'Handshake failures',
  'modelMonitoring.pd.expiredKV': 'Expired KV',
  'modelMonitoring.pd.eventUnit': 'events',
  'modelMonitoring.pd.eventsHelp':
    'Estimated counter increase over the selected interval, accounting for resets; fractional estimates are possible. Roles and instances are separate event populations, not a unique failed-request total. Missing samples are not zero. NIXL transfer failures may include handshake and notification failures; never count them twice.',
  'modelMonitoring.histogramBoundsHelp':
    '“>” is a known lower bound beyond the source histogram range. Censored points are not plotted as exact quantiles.',
  'modelMonitoring.state.histogram_quantile_out_of_range':
    'Quantiles exceed the histogram range; an exact curve is unavailable.',
  'modelMonitoring.state.histogram_first_bucket_unresolved':
    'All samples in a time window fell in the first latency bucket, so the histogram cannot resolve those percentiles.',
  'modelMonitoring.state.histogram_bounds_unavailable':
    'Some quantile bounds could not be verified. Retry the query.',

  'modelMonitoring.state.no_gateway_samples':
    'No gateway request samples in the selected interval.',
  'modelMonitoring.state.gateway_bypassed':
    'This request path bypasses the GPUStack gateway.',
  'modelMonitoring.observationNotes': 'Observation notes',
  'modelMonitoring.observationUnsupported': 'Not supported',
  'modelMonitoring.observationNotApplicable': 'Not applicable',

  'modelMonitoring.summaryUnavailable': 'Summary unavailable',
  'modelMonitoring.valuesHelp':
    'A dash means no valid observation; zero is a measured value. Latency requires request samples.',

  'modelMonitoring.legendValuesHelp':
    'Legend values are the last valid sample of each curve. Performance summaries use the statistic and scope described in their help.',
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
    'Could not open the selected deployment.',
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
    'Intervals between successive engine output events, following the engine’s batching and speculative decoding conventions. These differ from per-request mean TPOT. The overview shows the selected-window P99.',
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
    'Not enough samples in this range for a rolling metric',
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
  'modelMonitoring.originalTime': 'Original time',
  'modelMonitoring.segmentLoad': 'Target load',
  'modelMonitoring.segmentMeasurement': 'Measurement',
  'modelMonitoring.segmentProgress':
    'Duration {seconds}s · phase progress {progress}%',
  'modelMonitoring.pd.monitoringTitle': 'PD performance and handoff',
  'modelMonitoring.pd.scopeHelp':
    'Read P and D as separate role pools. Service ingress, engine-local timing and connector timing have different boundaries.',
  'modelMonitoring.pd.performance': 'Service experience and role pools',
  'modelMonitoring.pd.serviceExperience': 'Service experience',
  'modelMonitoring.pd.ingressTTFT': 'Service TTFT',
  'modelMonitoring.pd.ingressE2E': 'Service request latency',
  'modelMonitoring.pd.ingressUnavailable':
    'Not collected at the service ingress; engine-local latency is not substituted.',
  'modelMonitoring.pd.ingressHelp':
    'Gateway-observed latency, independent of engine-local and Benchmark client timing. Higress currently provides duration sums and counts: only Avg is available, without P50/P95/P99. Deployment and routed Benchmark charts show all gateway traffic to this deployment in the selected interval, which may include other requests; they cannot be split by P/D role.',
  'modelMonitoring.pd.rolePools': 'Role pools',
  'modelMonitoring.pd.poolHelp':
    'Compare Router request rate with Prefill input and Decode output throughput, then inspect role-local queues, latency and KV. Latency follows the selected statistics; never add P/D request counts or quantiles.',
  'modelMonitoring.pd.poolView': 'Role pool view',
  'modelMonitoring.pd.prefillDuration': 'Prefill phase duration',
  'modelMonitoring.pd.decodeDuration': 'Decode phase duration',
  'modelMonitoring.pd.inputThroughput': 'Input throughput',
  'modelMonitoring.pd.outputThroughput': 'Output throughput',
  'modelMonitoring.pd.input': 'Prefill · Input throughput',
  'modelMonitoring.pd.output': 'Decode · Output throughput',
  'modelMonitoring.pd.pWaiting': 'Prefill · Waiting requests',
  'modelMonitoring.pd.dWaiting': 'Decode · Waiting requests',
  'modelMonitoring.pd.decodeTPOT': 'Decode · TPOT',
  'modelMonitoring.pd.stageHelp':
    'From first scheduling on the P engine to its first locally recorded token. Includes interruptions during prefill, excludes the initial queue, and is not pure GPU compute time or service TTFT.',
  'modelMonitoring.pd.prefillFallbackHelp':
    'This backend does not expose a confirmed Prefill phase duration. Show P-side processed prompt tokens per second instead; do not substitute Decode TTFT.',
  'modelMonitoring.pd.queuesHelp':
    'Running and waiting requests on this role only. The same user request can appear on P and D at different points, so do not sum the two pools as client concurrency.',
  'modelMonitoring.pd.kvHelp':
    'Each line is an engine-local KV pool. Compare the busiest pool; do not average away a full engine or sum percentages across P and D.',
  'modelMonitoring.pd.roleDetails': 'Cache observations',
  'modelMonitoring.pd.localTTFT': 'Engine-local TTFT',
  'modelMonitoring.pd.localTimingHelp':
    'Time from this role receiving its request to engine completion, including local waiting and execution. Decode may also wait for Prefill/KV. This is not full client latency; role percentiles cannot be added or subtracted to decompose a request.',
  'modelMonitoring.pd.queueTimeHelp':
    'Engine-local queue duration for this role; handoff-specific queues are shown separately.',
  'modelMonitoring.pd.decodeDurationHelp':
    'From the first locally recorded token to the last on the D engine. Includes generation interruptions and is not per-token latency.',
  'modelMonitoring.pd.prefixHelp':
    'Engine-local prefix cache lookups and hits. This is not remote KV transfer success.',
  'modelMonitoring.pd.decodeMetric': 'Decode latency metric',
  'modelMonitoring.pd.poolCurrent': 'Role-local current sample',
  'modelMonitoring.pd.rolePoolHelp':
    'Readiness is deployment state; Router member health is a separate observation.',
  'modelMonitoring.pd.roleResponsibilities': 'Responsibilities',
  'modelMonitoring.pd.roleResources': 'Associated resources',
  'modelMonitoring.pd.prefillResponsibility':
    'Prompt processing and KV generation',
  'modelMonitoring.pd.decodeResponsibility': 'KV receipt and token generation',
  'modelMonitoring.pd.routerResponsibility': 'Routing and request forwarding',
  'modelMonitoring.pd.handoff': 'KV handoff',
  'modelMonitoring.pd.handoffHelp':
    'Connector observations describe different phases depending on the PD mode. Observe them separately; timings can overlap and must not be summed into TTFT.',
  'modelMonitoring.pd.bootstrap': 'Bootstrap handshake duration',
  'modelMonitoring.pd.bootstrapHelp':
    'D-side bootstrap handshake, not KV payload transmission. Read allocation and transfer queues alongside it.',
  'modelMonitoring.pd.allocation': 'KV receive allocation duration',
  'modelMonitoring.pd.allocationHelp':
    'D-side allocation for receiving KV, reported by the engine. It is not transfer bandwidth or Prefill compute time.',
  'modelMonitoring.pd.handoffDetails':
    'Connector queues and transfer observations',
  'modelMonitoring.pd.bootstrapQueue': 'Bootstrap waiting requests',
  'modelMonitoring.pd.inflightQueue': 'In-flight handoff requests',
  'modelMonitoring.pd.preallocQueue': 'Preallocation waiting requests',
  'modelMonitoring.pd.handoffQueueHelp':
    'Connector-specific lifecycle queues, separate from general engine waiting requests. The same request may pass through multiple queues; do not add them as unique user requests.',
  'modelMonitoring.pd.routerDetails': 'Router requests and member health',
  'modelMonitoring.pd.routerRequests': 'Router · Request rate',
  'modelMonitoring.pd.requestRate': 'Request rate',
  'modelMonitoring.pd.routerRequestHelp':
    'Observed at Router; do not add P and D request counts.',
  'modelMonitoring.pd.routerDuration': 'Observed forwarding duration',
  'modelMonitoring.pd.routerDurationHelp':
    'Router-reported request duration can include upstream execution. It is not pure route selection overhead, and cannot be added to engine timings.',
  'modelMonitoring.pd.tokenHelp':
    'Prompt tokens are read from P and generated tokens from D. These are engine-processed tokens, not client goodput.',
  'modelMonitoring.pd.transferDuration': 'KV transfer duration',
  'modelMonitoring.pd.transferHelp':
    'Native Connector transfer events. NIXL measures from posting until the backend reports completion, including synchronous submission and backend waiting. This is not client TTFT; do not add submission time again.',
  'modelMonitoring.pd.transferPost': 'KV transfer submission duration',
  'modelMonitoring.pd.transferPostHelp':
    'The synchronous time to initiate and submit a NIXL transfer. Returning from this call does not imply completed data movement. It is included in total transfer time and must not be added to it.',
  'modelMonitoring.pd.transferQueue': 'KV transfer waiting requests',
  'modelMonitoring.pd.transferSize': 'KV transfer size',
  'modelMonitoring.pd.transferSizeHelp':
    'Connector-reported transfer-size distribution. Missing samples mean unavailable observations, not zero-byte transfer.',
  'modelMonitoring.pd.transferSpeed': 'Reported KV transfer speed',
  'modelMonitoring.pd.transferSpeedHelp':
    "Use only the connector's reported speed. Do not divide KV bytes by bootstrap or allocation duration to manufacture bandwidth.",
  'modelMonitoring.pd.tpotHelp':
    'Decode-side average time per output token after the first token, recorded per completed request. Use it to assess sustained generation speed; it is not the total Decode-stage duration. Aggregate and instance curves follow the selected statistics; quantiles are never averaged or added.',
  'modelMonitoring.pd.itlHelp':
    'Intervals between successive Decode engine output events, following the engine’s batching conventions. Use it to identify generation jitter and pauses. It is not the client-observed output gap or the per-request mean TPOT.',
  'modelMonitoring.pd.externalCacheHelp':
    'Engine-reported external-cache lookups and hits for this role; not the local prefix cache or KV connector success rate.',
  'modelMonitoring.trendStatisticsExplanation':
    'Avg is the mean of observed request samples; P50, P95 and P99 estimate latency percentiles from histogram buckets. Each plotted point uses a rolling window; it is not a whole-run or isolated Benchmark-stage statistic. Instance quantiles cannot be averaged or added.',
  'modelMonitoring.trendWindow': 'Rolling window:',
  'modelMonitoring.pd.roleInstances': 'Roles and instances',
  'modelMonitoring.pd.engineObservation': 'Engine observations',
  'modelMonitoring.pd.routerObservation': 'Router observations',
  'modelMonitoring.pd.connectorObservation': 'Connector observations',
  'modelMonitoring.pd.serviceObservation': 'Service-ingress observations',
  'modelMonitoring.pd.handoffQueues': 'Handoff and receive queues'
};
