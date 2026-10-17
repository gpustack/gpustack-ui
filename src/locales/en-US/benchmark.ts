export default {
  'benchmark.detail.result.selectMeasuredPoint':
    'Select measured point at {load} {unit}',
  'benchmark.detail.metric.ttftP99': 'TTFT p99',
  'benchmark.detail.metric.tpotP99': 'TPOT p99',
  'benchmark.detail.metric.itlP99': 'ITL p99',
  'benchmark.detail.statistics.p25': 'P25',
  'benchmark.detail.statistics.p50': 'P50',
  'benchmark.detail.statistics.p75': 'P75',
  'benchmark.detail.statistics.p90': 'P90',
  'benchmark.detail.stopReason.throughputGainConverged':
    'Throughput gain convergence',
  'benchmark.detail.stopReason.throughputGainConverged.detail':
    'Across the last {points} refinement points, the recorded peak improved by {gain}%, below the {threshold}% threshold; refinement ended. This conclusion covers measured points only.',
  'benchmark.detail.stopReason.throughputGainConverged.baseline':
    'Window baseline: {throughput} tok/s @ {load} {unit}',
  'benchmark.detail.stopReason.throughputGainConverged.best':
    'Best recorded in the window: {throughput} tok/s @ {load} {unit}',
  'benchmark.detail.stopReason.throughputGainConverged.range':
    'Measured neighbors of the best point: {lower}–{upper} {unit}',
  'benchmark.detail.stopReason.throughputGainConverged.point':
    'Refinement point {point}: {load} {unit}, total TPS {throughput} tok/s, running best {best} tok/s',
  'benchmark.detail.statistics.load': 'Load & throughput',
  'benchmark.detail.statistics.latency': 'Latency',
  'benchmark.detail.statistics.tokens': 'Request-size statistics',
  'benchmark.detail.statistics.requestRate': 'Achieved request rate',
  'benchmark.detail.statistics.concurrency': 'Achieved concurrency',
  'benchmark.detail.statistics.requestsUnit': 'requests',
  'benchmark.detail.statistics.tokensUnit': 'tokens/request',
  'benchmark.detail.statistics.successTotal': 'Successful / total requests',
  'benchmark.detail.statistics.requestSize': 'Request size',
  'benchmark.detail.statistics.requestSizeNote':
    'Input / output token distributions',
  'benchmark.detail.statistics.load.min.tip':
    'Lowest recorded value within this stage. Rates use event timing; concurrency counts in-flight requests.',
  'benchmark.detail.statistics.load.max.tip':
    'Highest recorded value within this stage. Rate spikes do not represent sustained capacity. The headline peak uses the highest stage-average total TPS.',
  'benchmark.detail.statistics.latency.min.tip':
    'Smallest recorded sample for this stage’s latency metric. Units follow the row label.',
  'benchmark.detail.statistics.latency.max.tip':
    'Largest recorded sample for this stage’s latency metric. ITL Max is the longest streamed-output gap.',
  'benchmark.detail.statistics.tokens.min.tip':
    'Smallest input/output token count among successful requests in this stage.',
  'benchmark.detail.statistics.tokens.max.tip':
    'Largest input/output token count among successful requests in this stage.',
  'benchmark.detail.latency.scrollHint':
    'Scroll horizontally to view all percentiles.',
  'benchmark.detail.latency.metric': 'Metric',
  'benchmark.detail.latency.endToEnd': 'End-to-end latency',
  'benchmark.detail.validity.throughputDeclineGeneric':
    'The test ended early after a sustained decline in total TPS. The SLO boundary has not been located.',
  'benchmark.detail.validity.declineEvidence.peak':
    'Measured peak: {tps} tok/s',
  'benchmark.detail.validity.declineEvidence.concurrency':
    'Concurrency {rate}: {tps} tok/s (down {drop}%)',
  'benchmark.detail.validity.declineEvidence.rate':
    'Target request rate {rate} req/s: {tps} tok/s (down {drop}%)',
  'benchmark.detail.validity.declineEvidence.details':
    'View throughput changes',
  'benchmark.detail.marker.sloCapacity.tip':
    'Highest measured load meeting all configured SLO targets.',
  'benchmark.detail.marker.peakThroughput.tip':
    'Highest recorded total TPS among measured points.',
  'benchmark.detail.stage.measuredRate.tip':
    'Measured successful request completions per second, based on request completion times. This is not the configured arrival rate.',
  'benchmark.detail.stage.measuredConcurrency.tip':
    'Measured average in-flight concurrency of successful requests, based on their start-to-completion intervals.',
  'benchmark.detail.stage.configuredConcurrency': 'Target concurrency',
  'benchmark.detail.stage.configuredRate': 'Target request rate',
  'benchmark.detail.stage.measuredConcurrency': 'Achieved concurrency Avg',
  'benchmark.detail.stage.measuredRate': 'Achieved request rate Avg',
  'benchmark.detail.validity.throughputDecline':
    'The test ended early after total TPS remained at least {threshold}% below the measured peak for {points} consecutive increasing-load stages. The SLO boundary has not been located.',
  'benchmark.detail.stopReason.throughputDecline': 'Throughput decline guard',
  'benchmark.detail.result.load': 'Result load',
  'benchmark.detail.result.boundaryPair':
    '{pass} {unit} met SLO; {fail} {unit} did not',
  'benchmark.detail.result.sloConcurrency':
    'Highest measured concurrency meeting SLO',
  'benchmark.detail.result.sloRate':
    'Highest measured request rate meeting SLO',
  'benchmark.detail.result.totalPeak': 'Highest measured total throughput',
  'benchmark.detail.result.measured': 'Measured result',
  'benchmark.detail.result.noSloPoint': 'No measured point met the SLO',
  'benchmark.detail.result.boundaryLocated': 'SLO boundary located',
  'benchmark.detail.result.boundaryUnknown': 'Higher SLO boundary not located',
  'benchmark.detail.result.inProgress': 'Measurement in progress',
  'benchmark.detail.result.peakFact':
    'Peak Throughput: {throughput} tok/s @ {load} {unit}',
  'benchmark.form.load.positiveRate': 'Enter a positive request rate',
  'benchmark.form.load.positiveConcurrency':
    'Enter a positive integer concurrency',
  'benchmark.form.load.rangeError':
    'The upper bound must be greater than the lower bound',
  'benchmark.title': 'Benchmarks',
  'benchmark.button.add': 'Add Benchmark',
  'benchmark.button.edit': 'Edit Benchmark',
  'benchmark.button.clone': 'Clone Benchmark',
  'benchmark.button.compare': 'Compare',
  'benchmark.table.model': 'Model',
  'benchmark.form.target': 'Benchmark target',
  'benchmark.table.dataset': 'Dataset',
  'benchmark.table.requestRate': 'Request Rate',
  'benchmark.table.gpu': 'GPU ',
  'benchmark.table.tpot': 'TPOT',
  'benchmark.table.ttft': 'TTFT',
  'benchmark.table.rps': 'Requests/s',
  'benchmark.table.tps': 'Tokens/s',
  'benchmark.table.inputLen': 'Input Length',
  'benchmark.table.outputLen': 'Output Length',
  'benchmark.form.profile': 'Profile',
  'benchmark.form.totalRequests': 'Total Requests',
  'benchmark.form.concurrencyList': 'Concurrency Levels',
  'benchmark.form.loadType': 'Load Type',
  'benchmark.form.loadType.fixedRate': 'Fixed Rate',
  'benchmark.form.loadType.concurrency': 'Concurrency',
  'benchmark.form.loadType.sweep': 'Auto Sweep',
  'benchmark.form.autoTune': 'Auto-tune',
  'benchmark.form.autoTune.rate.tip':
    'The load points measured in this run — one stage = one measured point. Auto-tune ramps the request rate automatically until total throughput stops growing (the peak), so you do not list points yourself. Switch to Manual to run a fixed list of rates.',
  'benchmark.form.autoTune.concurrency.tip':
    'The load points measured in this run — one stage = one measured point. Auto-tune ramps concurrency automatically until the latency targets can no longer be met (the SLO boundary), so you do not list points yourself. Switch to Manual to run a fixed list of concurrency levels.',
  'benchmark.form.autoTune.rangeRate': 'Search Range · Request Rate (req/s)',
  'benchmark.form.autoTune.rangeFrom': 'From',
  'benchmark.form.autoTune.rateFrom': 'Rate From (req/s)',
  'benchmark.form.autoTune.rateTo': 'Rate To (req/s)',
  'benchmark.form.autoTune.concFrom': 'Concurrency From',
  'benchmark.form.autoTune.concTo': 'Concurrency To',
  'benchmark.form.autoTune.rangeTo': 'To',
  'benchmark.form.autoTune.rangeConcurrency': 'Search Range · Concurrency',
  'benchmark.form.autoTune.rangeMin': 'min',
  'benchmark.form.autoTune.rangeMax': 'max',
  'benchmark.form.autoTune.range.rate.tip':
    'Adaptive ramp search range — a HARD range: no load outside it is ever measured. The ramp starts at the min and doubles up to the max. If the server is already saturated at the min, the run reports the sustained rate it measured and asks you to lower the range rather than probing below it.',
  'benchmark.form.autoTune.range.concurrency.tip':
    'Adaptive ramp search range — a HARD range: no load outside it is ever measured. The ramp starts at the min and doubles up to the max. If the server is already saturated at the min, the run reports the sustained rate it measured and asks you to lower the range rather than probing below it.',
  'benchmark.form.autoTune.maxRate': 'Maximum Request Rate',
  'benchmark.form.autoTune.maxConcurrency': 'Maximum Concurrency',
  'benchmark.form.load.managedByProfile': 'managed by profile',
  'benchmark.form.load.searchLimit': 'Search Limit',
  'benchmark.form.autoTune.maxPoints': 'Max Test Points',
  'benchmark.form.autoTune.maxTotalSeconds': 'Max Total Duration (s)',
  'benchmark.form.rateList': 'Request Rates (req/s)',
  'benchmark.detail.overview.rate': 'Rate / Concurrency',
  'benchmark.detail.running.hint':
    'Benchmark is running — {progress}% complete, {points} point(s) measured so far. This page updates automatically as each point finishes.',
  'benchmark.detail.running.finalizing':
    'Benchmark finished running — computing and uploading the final results. This page updates automatically.',
  'benchmark.detail.stage.saturationProbe': 'Saturation Probe',
  'benchmark.detail.aux.measured': '{requests} requests / {seconds}s',
  'benchmark.detail.aux.ceiling': 'ceiling {rate} req/s',
  'benchmark.detail.aux.cap': 'soft upper bound {cap}',
  'benchmark.detail.aux.capClamped': 'clamped the overshoot point',
  'benchmark.detail.aux.capRelaxed': 'gave way — the probe read low',
  'benchmark.detail.aux.capUnused': 'never bound anything',
  'benchmark.form.inputTokensList': 'Input Token Lengths (sweep)',
  'benchmark.form.inputTokensList.placeholder': 'e.g. 128, 4096, 32768',
  'benchmark.form.turns': 'Turns (multi-turn)',
  'benchmark.form.turns.unit': 'turns',
  'benchmark.form.multiTurn': 'Multi-turn',
  'benchmark.form.multiTurn.tips':
    'Send each sample as a multi-turn conversation — every turn is one request carrying the accumulated chat history. Synthetic (Random) dataset only; requires a chat endpoint.',
  'benchmark.form.stopOnSaturation.tips':
    'Stop the run once throughput plateaus (guidellm over-saturation constraint) instead of pushing further past saturation.',
  'benchmark.form.warmup': 'Warmup (%)',
  'benchmark.form.cooldown': 'Cooldown (%)',
  'benchmark.form.warmup.tips':
    'Trims the first N% of each stage\u2019s REQUESTS from the measured window (not the first N% of its seconds). Use it to exclude cold-start effects \u2014 the first few requests of a run can be several times slower than steady state. Enter a percentage \u2014 e.g. 10 trims the first 10% of each stage\u2019s requests.',
  'benchmark.form.cooldown.tips':
    'Trims the last N% of each stage\u2019s REQUESTS from the measured window, excluding the tail where the stage is draining. Enter a percentage \u2014 e.g. 10 trims the last 10% of each stage\u2019s requests.',
  'benchmark.form.maxErrors': 'Max Errors',
  'benchmark.form.maxErrorRate': 'Max Error Rate (%)',
  'benchmark.form.maxErrorRate.tips':
    'Stops a stage once the share of failed requests reaches this level — a cap on how much of the run may fail before the numbers stop being worth measuring. Enter a percentage — e.g. 5 stops the stage at a 5% error rate. Leave it empty to tolerate any error rate.',
  'benchmark.form.stopOnSaturation': 'Stop on Saturation',
  'benchmark.form.datasetSeed.tips':
    'Seed for generating the synthetic data. In a multi-stage run this is the initial seed; each stage uses initial + stage index (turn off "Different seed for each stage" under Advanced to keep it fixed).',
  'benchmark.form.randomSeed': 'Random Seed',
  'benchmark.form.randomSeed.tips':
    "On (default): a fresh seed each time a benchmark is created and each stage uses a different one, so re-running the same config sends different data instead of replaying the first run's prefix cache. Off: pin a seed to reproduce a run and choose whether stages differ. Only affects the Random dataset.",
  'benchmark.form.seedIncrement': 'Different seed for each stage',
  'benchmark.form.seedIncrement.tips':
    'On (default): each stage seed = initial + stage index, so stages differ and cross-stage cache reuse is reduced. Off: all stages share the same seed. Only affects the Random dataset.',
  'benchmark.form.slo.ttft': 'Avg TTFT ≤ (ms)',
  'benchmark.form.slo.p95Ttft': 'P95 TTFT ≤ (ms)',
  'benchmark.form.slo.p99Ttft': 'P99 TTFT ≤ (ms)',
  'benchmark.form.slo.tpot': 'Avg TPOT ≤ (ms)',
  'benchmark.form.slo.p95Tpot': 'P95 TPOT ≤ (ms)',
  'benchmark.form.slo.p99Tpot': 'P99 TPOT ≤ (ms)',
  'benchmark.form.slo.avgLatency': 'Avg Latency ≤ (ms)',
  'benchmark.form.slo.p95Latency': 'P95 Latency ≤ (ms)',
  'benchmark.form.slo.p99Latency': 'P99 Latency ≤ (ms)',
  'benchmark.form.slo.metric': 'Metric',
  'benchmark.form.slo.aggregation': 'Aggregation',
  'benchmark.form.slo.threshold': 'Threshold (ms)',
  'benchmark.form.slo.add': 'Add SLO Target',
  'benchmark.form.slo.metric.ttft': 'TTFT',
  'benchmark.form.slo.metric.tpot': 'TPOT',
  'benchmark.form.slo.metric.latency': 'Latency',
  'benchmark.form.slo.agg.avg': 'Avg',
  'benchmark.form.slo.agg.p95': 'P95',
  'benchmark.form.slo.agg.p99': 'P99',
  'benchmark.form.slo.col.metric': 'Metric',
  'benchmark.form.slo.col.threshold': 'Threshold',
  'benchmark.form.preset': 'Preset',
  'benchmark.form.rate': 'Request Rate (req/s)',
  'benchmark.form.concurrency': 'Concurrency',
  'benchmark.form.stages': 'Stages',
  'benchmark.form.stages.mode.manual': 'Manual',
  'benchmark.detail.stageLimits': 'Per-Stage Limits',
  'benchmark.form.addStage': 'Add Stage',
  'benchmark.form.maxRequests': 'Max Requests',
  'benchmark.form.maxSeconds': 'Max Seconds',
  'benchmark.form.maxSecondsCap': 'Max Seconds (per rate)',
  'benchmark.form.requestsOrSeconds':
    'Set at least one of Requests / Max Seconds.',
  'benchmark.form.sweepSize': 'Sweep Count',
  'benchmark.form.sweepSize.tip':
    'How many rates are auto-swept to find the throughput peak.',
  'benchmark.form.requests': 'Requests',
  'benchmark.form.requestsPerRate': 'Requests per Rate',
  'benchmark.form.requestsPerRate.tip':
    'Auto-sweeps multiple rates; this many requests are sent at each sampled rate.',
  'benchmark.form.template': 'Quick-fill Template',
  'benchmark.form.group.dataset': 'Workload',
  'benchmark.form.group.load': 'Load',
  'benchmark.form.group.distribution': 'Data Distribution',
  'benchmark.form.group.distribution.input': 'Input Length Distribution',
  'benchmark.form.group.distribution.output': 'Output Length Distribution',
  'benchmark.form.dist.spread': 'Spread (±)',
  'benchmark.form.dist.spread.tip':
    'Standard deviation (±) of the length around the mean — larger spreads the token lengths out more.',
  'benchmark.form.dist.min': 'Min',
  'benchmark.form.dist.max': 'Max',
  'benchmark.form.distribution.intro':
    'Vary request lengths around the mean set above (instead of a fixed length). Leave blank to use defaults. Spread = how much lengths vary (standard deviation); Min/Max clamp the range.',
  'benchmark.form.group.constraints': 'Constraints',
  'benchmark.form.group.slo': 'Latency SLO',
  'benchmark.form.group.execution': 'Stop Conditions',
  'benchmark.form.group.advanced': 'Advanced',
  'benchmark.form.inputStdev': 'Input Spread (±)',
  'benchmark.form.inputMin': 'Input Min',
  'benchmark.form.inputMax': 'Input Max',
  'benchmark.form.sharegpt.tokenLengthSettings': 'Token Length Settings',
  'benchmark.form.sharegpt.tokenLengthSettings.tip':
    'Optionally set a minimum input length, a maximum, or both. Output length is also optional; when empty, each sample uses its original answer length.',
  'benchmark.form.sharegpt.inputRangeError':
    'Input Max must be at least Input Min',
  'benchmark.form.sharegpt.positiveInteger': 'Enter a positive integer',
  'benchmark.form.outputStdev': 'Output Spread (±)',
  'benchmark.form.outputMin': 'Output Min',
  'benchmark.form.outputMax': 'Output Max',
  'benchmark.form.sharedPrefix': 'Shared Prefix',
  'benchmark.form.prefix.tip':
    'A common prompt prefix (system prompt / RAG context) shared across requests to exercise prefix-cache reuse. Per bucket — Prefix Length: prefix tokens; Count: number of distinct prefixes; Weight: relative share of requests using it.',
  'benchmark.form.prefix.intro':
    'A common prompt prefix (system prompt / RAG context) shared across requests to exercise prefix-cache reuse. Add multiple buckets to mix several prefix lengths by weight.',
  'benchmark.form.prefix.length': 'Prefix Length',
  'benchmark.form.prefix.count': 'Count',
  'benchmark.form.prefix.weight': 'Weight',
  'benchmark.form.prefix.add': 'Add Prefix',
  'benchmark.form.concurrencyList.tips':
    'Run one benchmark per concurrency level (e.g. 40, 60, 80). Leave empty to use the single Request Rate above.',
  'benchmark.form.concurrencyList.placeholder': 'e.g. 40, 60, 80',
  'benchmark.form.profile.maxThroughput.tips':
    'Finds peak throughput. The usual baseline for comparing GPUs and models.',
  'benchmark.form.profile.latencySlo.tips':
    'Finds the most load that still meets your TTFT/TPOT targets. For capacity planning.',
  'benchmark.form.profile.custom': 'Custom',
  'benchmark.form.profile.custom.tips':
    'Set the auto-tune search range or a manual stage list yourself — every field is editable.',
  'benchmark.table.inputTokenLength': 'Input Token Length',
  'benchmark.table.outputTokenLength': 'Output Token Length',
  'benchmark.detail.summary.title': 'Summary',
  'benchmark.detail.configure.title': 'Configure',
  'benchmark.detail.environment.title': 'Environment',
  'benchmark.detail.logs.title': 'Logs',
  'benchmark.form.totalRequests.tips': 'Total Requests',
  'benchmark.table.filter.bygpu': 'Filter by GPU',
  'benchmark.table.filter.bymodel': 'Filter by model',
  'benchmark.table.filter.bydataset': 'Filter by Dataset',
  'benchmark.table.filter.byLoadType': 'Filter by load type',
  'benchmark.table.filter.byTargetMode': 'Filter by target type',
  'benchmark.table.filter.byProfile': 'Filter by profile',
  'benchmark.table.best': 'Best @',
  'benchmark.table.best.unit.concurrency': 'conc.',
  'benchmark.table.best.unit.rate': 'req/s',
  'benchmark.table.coverage': 'Coverage',
  'benchmark.table.coverage.insufficient': 'Insufficient',
  'benchmark.table.avg': 'Avg',
  'benchmark.table.tailLatency': 'Tail Latency',
  'benchmark.table.columnSettings': 'Column Settings',
  'benchmark.detail.summary.results': 'Test Results',
  'benchmark.detail.summary.recommendation': 'Primary result',
  'benchmark.detail.summary.supporting': 'Detailed metrics',
  'benchmark.detail.summary.stages': 'Results by stage',
  'benchmark.detail.summary.totalStages': 'stages',
  'benchmark.detail.summary.totalRequests': 'requests',
  'benchmark.detail.summary.totalDuration': 'elapsed',
  'benchmark.detail.termination.requestsExhausted':
    'Stopped early: dataset exhausted — only {processed}/{requested} requests ran. Use a larger dataset for this rate.',
  'benchmark.detail.termination.maxSeconds':
    'Stopped early: hit the per-stage time limit — {processed}/{requested} requests ran.',
  'benchmark.detail.termination.maxErrors':
    'Stopped early: too many errors — {processed}/{requested} requests ran.',
  'benchmark.detail.termination.default':
    'Stopped early ({reason}): {processed}/{requested} requests ran.',
  'benchmark.detail.summary.stageDetail': 'Stage detail',
  'benchmark.detail.summary.performance': 'Performance',
  'benchmark.detail.reason.requestsSucceeded':
    '{ok} of {total} requests succeeded',
  'benchmark.detail.reason.withinSlo': 'Within the SLO',
  'benchmark.detail.reason.peakExceedsSlo':
    'Throughput peaks higher at {rate} {unit}, but running there would breach the SLO — so the recommendation is the SLO boundary.',
  'benchmark.detail.reason.matchesPeak': 'Highest sustained throughput',
  'benchmark.detail.validity.title': 'Test coverage',
  'benchmark.detail.validity.ok': 'OK',
  'benchmark.detail.validity.overload':
    'The Throughput probe fires requests as fast as possible (no rate limit), which overwhelmed the server (only {rate}% of requests succeeded) — the peak throughput is unreliable and reflects the server saturation limit.',
  'benchmark.detail.validity.underRange':
    'The best operating point is the highest sampled point — the true optimum may be higher. Extend the range (higher concurrency/rate) and re-run.',
  'benchmark.detail.validity.fewPoints':
    'Too few measured points to trust the curve — check the bounds / budget.',
  'benchmark.detail.validity.sloNeverMet':
    'No measured point met the latency targets — the server is too slow for this SLO; lower the targets or change the deployment.',
  'benchmark.detail.validity.sloNotBinding':
    'The SLO boundary was not located. The search stopped after throughput plateaued near {rate}, while the highest measured load still met the latency targets. Continue the SLO search within a suitable range and budget to locate the boundary.',
  'benchmark.detail.validity.notSaturated':
    'The best operating point is the highest measured point and nothing overloaded — the true optimum may be higher. Raise the search range (upper bound) and re-run.',
  'benchmark.detail.validity.budgetExhausted':
    'The search exhausted its measurement budget before it finished refining the result. Raise {which, select, seconds{Max Total Duration} other{Max Test Points}} and re-run.',
  'benchmark.detail.validity.saturatedAtLowerBound':
    'The search range starts above what this deployment can sustain (~{ceiling} req/s), so no load inside it can be the optimum. Lower the search range and re-run.',
  'benchmark.detail.validity.peakAtFloor':
    'The best operating point is the LOWEST measured point — the optimum may be below the search range. Lower the search range (lower bound) and re-run.',
  'benchmark.detail.validity.pointHighError':
    'A measured point had a low success rate ({rate}% succeeded) — it overloaded the server and is unreliable.',
  'benchmark.detail.reason.confidence': 'Confidence',
  'benchmark.detail.confidence.high': 'High',
  'benchmark.detail.confidence.medium': 'Medium',
  'benchmark.detail.summary.metadata': 'Metadata',
  'benchmark.detail.summary.metrics': 'Test Metrics',
  'benchmark.detail.summary.latency': 'Latency',
  'benchmark.detail.summary.throughput': 'Throughput',
  'benchmark.detail.summary.request': 'Requests',
  'benchmark.detail.avg.reqLatency': 'Request Latency Avg',
  'benchmark.detail.avg.ttft': 'TTFT Avg',
  'benchmark.detail.avg.tpot': 'TPOT Avg',
  'benchmark.detail.avg.itl': 'ITL Avg',
  'benchmark.detail.throughput.totalToken': 'Total Throughput',
  'benchmark.detail.throughput.inputToken': 'Input Throughput',
  'benchmark.detail.throughput.outputToken': 'Output Throughput',
  'benchmark.detail.requests.total': 'Total Requests',
  'benchmark.detail.requests.success': 'Successful Requests',
  'benchmark.detail.requests.failed': 'Failed Requests',
  'benchmark.detail.requests.incomplete': 'Incomplete Requests',
  'benchmark.detail.requests.concurrency': 'Achieved concurrency Avg',
  'benchmark.detail.requests.concurrency.max': 'Achieved concurrency Max',
  'benchmark.detail.percentile.latency': 'Latency',
  'benchmark.detail.percentile.inputTokens': 'Input Tokens',
  'benchmark.detail.percentile.outputTokens': 'Output Tokens',
  'benchmark.detail.percentile.input': 'Input',
  'benchmark.detail.percentile.output': 'Output',
  'benchmark.detail.percentile.total': 'Total',
  'benchmark.detail.configure.tokenLength': 'Token Length (Input/Output)',
  'benchmark.detail.percentile.title': 'Percentile',
  'benchmark.detail.modelName': 'Model Name',
  'benchmark.detail.instanceName': 'Instance Name',
  'benchmark.detail.members.title': 'Members',
  'benchmark.detail.members.role': 'Role',
  'benchmark.detail.members.injected': 'Injected parameters',
  'benchmark.detail.members.endpoint': 'Endpoint',
  'benchmark.detail.configure': 'Configuration',
  'benchmark.detail.config.deployment': 'Deployment',
  'benchmark.detail.config.benchmark': 'Benchmark',
  'benchmark.detail.best.peak': 'Peak Throughput',
  'benchmark.detail.best.slo': 'Max within SLO',
  'benchmark.detail.slo.target': 'SLO Target',
  'benchmark.detail.slo.capacity': 'SLO capacity',
  'benchmark.detail.slo.capacity.locatedHint':
    'A load above this was measured breaching the SLO, so this is where it actually breaks.',
  'benchmark.detail.slo.capacity.floorHint':
    'Nothing above this was ever measured — the search ended first — so read it as "at least this much". The real breaking point is somewhere above and was not measured.',
  'benchmark.detail.tpot.tip':
    "TPOT: decode-only time per output token = (last token − first token) / (output tokens − 1), first-token latency excluded. This is guidellm's inter_token_latency_ms and the TPOT that vLLM and similar tools report. When the server does not stream incrementally (the whole output in one chunk, common at low load) there is no gap to measure, and this falls back to the per-token time including the first token.",
  'benchmark.detail.itl.tip':
    "ITL (Inter-Token Latency): the measured gap between consecutive streamed outputs — one sample per gap, pooled across requests, first-token latency excluded. It differs from TPOT in sample granularity: TPOT is one average per request, so a single stall is divided away by that request's other gaps, while ITL keeps every gap and the stall reaches the tail. Same definition as vLLM and SGLang. A chunk carrying several tokens (speculative decoding) still counts as one gap.",
  'benchmark.detail.chart.sloBreached': 'SLO breached',
  'benchmark.detail.chart.success': 'Success rate',
  'benchmark.detail.reason.peakTradeoff':
    'Peak at {rate} {unit}: {gain}% total throughput, {cost} TTFT p99',
  'benchmark.detail.unit.avg': 'avg',
  'benchmark.detail.p99.ttft': 'TTFT p99',
  'benchmark.detail.p99.tpot': 'TPOT p99',
  'benchmark.detail.p99.itl': 'ITL p99',
  'benchmark.detail.max.itl': 'ITL Max',
  'benchmark.detail.lowSample':
    'This stage has {count} samples, so only {tail} sit above p99 — the tail is decided by a handful of requests. Read it as indicative, not as an SLO conclusion (p99 needs ~1000 samples to behave like an estimate).',
  'benchmark.detail.successPill': '{pct}% success · {ok} / {total} requests',
  'benchmark.detail.summary.stagesHint': 'Click any row to see its detail',
  'benchmark.detail.chart.loadSweep': 'Load sweep',
  'benchmark.detail.chart.loadSweep.note':
    'Total throughput and {metric} as the load rises',
  'benchmark.detail.chart.dualAxisHint':
    'The left axis (total throughput) is linear — every gridline adds the same amount. The right axis is logarithmic for the displayed latency metric — every gridline is 10x the one below it. Read the right-axis title to identify the metric.',
  'benchmark.detail.chart.logHint':
    'Every gridline on this axis is 10x the one below it, so equal ratios read as equal distances. A linear scale would flatten the low-load stages against zero.',
  'benchmark.detail.chart.ttftDist': 'TTFT distribution',
  'benchmark.detail.chart.ttftDist.note':
    'p25–p75 band + p50 line + p99 dashed · a widening band means the bulk is diverging',
  'benchmark.detail.chart.rateShortfall':
    'Request rate: configured vs achieved',
  'benchmark.detail.chart.rateShortfall.note':
    'The first stage where the two lines split is the real ceiling',
  'benchmark.detail.chart.latencyComposition': 'Latency composition',
  'benchmark.detail.chart.latencyComposition.note':
    'Between the lines = everything after the first token (decode, scheduling preemption, batch wait)',
  'benchmark.detail.chart.frontier': 'Latency–throughput frontier',
  'benchmark.detail.chart.frontier.note':
    'What each extra tok/s costs in tail latency · one point per stage',
  'benchmark.detail.chart.throughputSplit': 'Throughput split',
  'benchmark.detail.chart.throughputSplit.note':
    'Input vs output share — prefill-heavy or decode-heavy',
  'benchmark.detail.chart.concShortfall': 'Concurrency: configured vs actual',
  'benchmark.detail.chart.concShortfall.note':
    'The two lines all but coincide, so the gap gets the red right-hand scale of its own',
  'benchmark.detail.chart.efficiency': 'Efficiency curve',
  'benchmark.detail.chart.efficiency.note':
    'tok/s per in-flight request · where returns start diminishing',
  'benchmark.detail.chart.latencyDist': 'Request latency distribution',
  'benchmark.detail.chart.latencyDist.note':
    'End-to-end per request: queueing, first token and the whole generation',
  'benchmark.detail.chart.tpotPercentiles': 'TPOT percentiles',
  'benchmark.detail.chart.tpotPercentiles.note':
    'Decode time per token, first token excluded · one value per request, so this shows decode slowing under load, not individual stalls',
  'benchmark.detail.chart.itlPercentiles': 'ITL percentiles',
  'benchmark.detail.chart.itlPercentiles.note':
    'Measured gap between consecutive streamed outputs · one sample per gap, so the tail shows individual stalls',
  'benchmark.detail.chart.success.note':
    'Shown because some requests did not succeed',
  'benchmark.detail.chart.legend.shortfall': 'Shortfall',
  'benchmark.detail.chart.legend.attainment': 'Held',
  'benchmark.detail.chart.legend.configured': 'Target',
  'benchmark.detail.chart.legend.achieved': 'Achieved Avg',
  'benchmark.detail.chart.legend.actual': 'Achieved Avg',
  'benchmark.detail.chart.legend.generation': 'Generation',
  'benchmark.detail.chart.legend.perRequest': 'tok/s per request',
  'benchmark.detail.chart.axis.latencyMs': 'Latency (ms)',
  'benchmark.detail.chart.axis.latencySec': 'Request latency (s)',
  'benchmark.detail.chart.axis.inFlight': 'In-flight requests',
  'benchmark.detail.chart.axis.shortfall': 'Shortfall (requests)',
  'benchmark.detail.chart.axis.successRate': 'Success rate (%)',
  'benchmark.detail.chart.axis.load.rate': 'Target request rate (req/s)',
  'benchmark.detail.chart.axis.load.concurrency':
    'Target concurrency (requests)',
  'benchmark.detail.chart.axis.throughput': 'Total throughput (tok/s)',
  'benchmark.detail.chart.axis.concurrencyAvg':
    'Achieved concurrency Avg (requests)',
  'benchmark.detail.reason.peakTradeoffPlain':
    'Peak at {rate} {unit}: {gain}% total throughput',
  'benchmark.detail.summary.showMore': 'Show {n} more',
  'benchmark.detail.summary.showLess': 'Show less',
  'benchmark.detail.selectedStage': 'Selected Stage',
  'benchmark.detail.showPercentiles': 'Show percentiles',
  'benchmark.detail.hidePercentiles': 'Hide percentiles',
  'benchmark.detail.status': 'Status',
  'benchmark.detail.status.recommended': 'SLO Capacity',
  'benchmark.detail.status.peak': 'Peak Throughput',
  'benchmark.detail.status.overloaded': 'Overloaded',
  'benchmark.detail.status.healthy': 'Healthy',
  'benchmark.state.stoppedAt': 'Stopped at {percent}%',
  'benchmark.detail.stopReason.label': 'Search ended on',
  'benchmark.detail.stopReason.capacityPlateau': 'throughput plateau',
  'benchmark.detail.stopReason.upperBound': 'the range ceiling',
  'benchmark.detail.stopReason.budgetPoints': 'the point budget',
  'benchmark.detail.stopReason.budgetSeconds': 'the duration budget',
  'benchmark.detail.stopReason.sloFailed': 'a latency threshold',
  'benchmark.detail.stopReason.converged': 'convergence',
  'benchmark.detail.stopReason.overloaded': 'server overload',
  'benchmark.detail.stopReason.pointFailed': 'a point with no result',
  'benchmark.detail.stopReason.probeBound': `the saturation probe's cap`,
  'benchmark.detail.recommend.text':
    'Best: concurrency {rate} — {pct}% of peak throughput ({tps} tok/s) at TTFT {ttft} ms{slo, select, yes{, within the SLO} other{}}.',
  'benchmark.detail.analysis.text':
    'Concurrency {rate} sustains {tps} tok/s{prev, select, yes{ — {prevUp}% more throughput than {prevRate}} other{}}{next, select, yes{; pushing to {nextRate} adds only {nextUp}% throughput but {nextTtftUp}% TTFT} other{}}. That makes {rate} the best operating point{slo, select, yes{, within the SLO} other{}}.',
  'benchmark.detail.specDigest': 'Spec Generation',
  'benchmark.detail.modelFile': 'Model File',
  'benchmark.detail.kvCache': 'Extended KV Cache',
  'benchmark.detail.cacheService': 'Cache Service',
  'benchmark.detail.speculativeDecoding': 'Speculative Decoding',
  'benchmark.detail.inputOutputTokenLength': 'Token Length (Input/Output)',
  'benchmark.env.gpuName': 'GPU Name',
  'benchmark.env.workerName': 'Worker Name',
  'benchmark.env.hostedMembers': 'Members',
  'benchmark.env.index': 'Index',
  'benchmark.env.system': 'System',
  'benchmark.env.runtimeVersion': 'Runtime Version',
  'benchmark.env.driverVersion': 'Driver Version',
  'benchmark.env.cpuCounts': 'CPU Cores',
  'benchmark.table.export.results': 'Export Results',
  'benchmark.form.nonLlmModel.tips':
    'Benchmarking currently only supports LLM models',
  'benchmark.detail.result.duration': 'Duration',
  'benchmark.form.pdGroup.tips':
    'A disaggregated group is measured whole: every request enters through its router, so there is no member to pick. The server sends the load to the router and runs the load generator on a worker that holds the weights.',
  'benchmark.detail.monitoring': 'Monitoring',
  'benchmark.detail.monitoring.tips':
    'Open the dashboard for this run, over the interval it ran. A disaggregated group goes to the PD dashboard, where the prefill queue, the decode queue and the KV transfer are shown separately.',
  'benchmark.form.targetMode': 'Target type',
  'benchmark.form.targetMode.instance': 'Instance (engine)',
  'benchmark.form.targetMode.route': 'Route (deployment)',
  'benchmark.form.targetMode.tips.instance':
    "Sends the load straight at one engine — a group's router, or one replica of a plain model — so nothing but the engine is in the path.",
  'benchmark.form.targetMode.tips.route':
    'Sends the load through the entrance clients call, so every replica of a plain model takes part; use it to compare a disaggregated group against an aggregated deployment on the same cards.',
  'benchmark.form.targetMode.tips.results.title': 'Reading route results',
  'benchmark.form.targetMode.tips.results':
    "Route puts the server's proxy in the path. At high rates the proxy can saturate before the deployment does and drop requests — and dropped requests never reach the latency numbers, so TTFT / TPOT can look better than they are. Read route-mode results together with the error and incomplete counts.",
  'benchmark.detail.targetMode.route': 'Route (deployment) · {route}',
  'benchmark.form.target.route': 'Route',
  'benchmark.form.target.route.empty':
    'No route fronts a servable LLM in this cluster. Deploy a route, or measure an instance instead.',
  'benchmark.detail.result.basic': 'Basic'
};
