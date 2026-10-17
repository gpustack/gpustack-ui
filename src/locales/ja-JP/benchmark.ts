export default {
  'benchmark.detail.result.selectMeasuredPoint': '{load} {unit} の測定点を選択',
  'benchmark.detail.metric.ttftP99': 'TTFT p99',
  'benchmark.detail.metric.tpotP99': 'TPOT p99',
  'benchmark.detail.metric.itlP99': 'ITL p99',
  'benchmark.detail.statistics.p25': 'P25',
  'benchmark.detail.statistics.p50': 'P50',
  'benchmark.detail.statistics.p75': 'P75',
  'benchmark.detail.statistics.p90': 'P90',
  'benchmark.detail.stopReason.throughputGainConverged':
    'スループット改善幅の収束',
  'benchmark.detail.stopReason.throughputGainConverged.detail':
    '直近 {points} 個の絞り込み測定点で、記録されたピークの累積改善は {gain}% で、しきい値 {threshold}% 未満のため絞り込みを終了しました。結論は測定済みの点に限られます。',
  'benchmark.detail.stopReason.throughputGainConverged.baseline':
    '区間開始時：{throughput} tok/s、{load} {unit}',
  'benchmark.detail.stopReason.throughputGainConverged.best':
    '区間内の累積最高：{throughput} tok/s、{load} {unit}',
  'benchmark.detail.stopReason.throughputGainConverged.range':
    '最良点の左右で測定済みの負荷：{lower}–{upper} {unit}',
  'benchmark.detail.stopReason.throughputGainConverged.point':
    '測定点 {point}：{load} {unit}、総 TPS {throughput} tok/s、累積最高 {best} tok/s',
  'benchmark.detail.statistics.load': '負荷とスループット',
  'benchmark.detail.statistics.latency': 'レイテンシ',
  'benchmark.detail.statistics.tokens': 'リクエストサイズ統計',
  'benchmark.detail.statistics.requestRate': '実績リクエストレート',
  'benchmark.detail.statistics.concurrency': '実績同時実行数',
  'benchmark.detail.statistics.requestsUnit': 'リクエスト',
  'benchmark.detail.statistics.tokensUnit': 'トークン/リクエスト',
  'benchmark.detail.statistics.successTotal': '成功 / 全リクエスト',
  'benchmark.detail.statistics.requestSize': 'リクエストサイズ',
  'benchmark.detail.statistics.requestSizeNote': '入力 / 出力トークン分布',
  'benchmark.detail.statistics.load.min.tip':
    'このステージ内の最小記録値です。レートはイベント時刻に基づき、同時実行数は処理中のリクエスト数です。',
  'benchmark.detail.statistics.load.max.tip':
    'このステージ内の最大記録値です。瞬間的なレートの上昇は持続可能な容量を示しません。主結果のピークはステージ平均の総 TPS で選択します。',
  'benchmark.detail.statistics.latency.min.tip':
    'このステージにおけるレイテンシ指標の最小サンプル値です。単位は行の表示に従います。',
  'benchmark.detail.statistics.latency.max.tip':
    'このステージにおけるレイテンシ指標の最大サンプル値です。ITL Max は最長のストリーム出力間隔です。',
  'benchmark.detail.statistics.tokens.min.tip':
    'このステージの成功リクエストにおける最小入力／出力トークン数です。',
  'benchmark.detail.statistics.tokens.max.tip':
    'このステージの成功リクエストにおける最大入力／出力トークン数です。',
  'benchmark.detail.latency.scrollHint':
    '横にスクロールしてすべての分位値を表示',
  'benchmark.detail.latency.metric': '指標',
  'benchmark.detail.latency.endToEnd': 'エンドツーエンド遅延',
  'benchmark.detail.validity.throughputDeclineGeneric':
    '総 TPS の継続的な低下により、テストを早期終了しました。SLO 境界は未確認です。',
  'benchmark.detail.validity.declineEvidence.peak': '実測ピーク：{tps} tok/s',
  'benchmark.detail.validity.declineEvidence.concurrency':
    '同時実行数 {rate}：{tps} tok/s（{drop}% 低下）',
  'benchmark.detail.validity.declineEvidence.rate':
    '目標リクエストレート {rate} req/s：{tps} tok/s（{drop}% 低下）',
  'benchmark.detail.validity.declineEvidence.details':
    'スループットの変化を表示',
  'benchmark.detail.marker.sloCapacity.tip':
    '設定したすべての SLO 目標を満たす最大の実測負荷です。',
  'benchmark.detail.marker.peakThroughput.tip':
    '測定点の中で記録された最大の総 TPS です。',
  'benchmark.detail.stage.measuredRate.tip':
    'リクエスト完了時刻に基づく、成功リクエストの毎秒実測完了数です。設定された到着レートではありません。',
  'benchmark.detail.stage.measuredConcurrency.tip':
    '成功リクエストの開始から完了までの区間に基づく、処理中同時実行数の実測平均です。',
  'benchmark.detail.stage.configuredConcurrency': '目標同時実行数',
  'benchmark.detail.stage.configuredRate': '目標リクエストレート',
  'benchmark.detail.stage.measuredConcurrency': '実績同時実行数（平均）',
  'benchmark.detail.stage.measuredRate': '実績リクエストレート（平均）',
  'benchmark.detail.validity.throughputDecline':
    '連続する {points} 個の負荷増加ステージで、総 TPS が実測ピークより {threshold}% 以上低下したため、テストを早期終了しました。SLO 境界は未確認です。',
  'benchmark.detail.stopReason.throughputDecline': 'スループット低下保護',
  'benchmark.detail.result.load': '結果の負荷',
  'benchmark.detail.result.boundaryPair':
    '{pass} {unit} は SLO 達成、{fail} {unit} は未達',
  'benchmark.detail.result.sloConcurrency': 'SLO を満たす最大実測同時実行数',
  'benchmark.detail.result.sloRate': 'SLO を満たす最大実測リクエストレート',
  'benchmark.detail.result.totalPeak': '最大実測総スループット',
  'benchmark.detail.result.measured': '測定結果',
  'benchmark.detail.result.noSloPoint': 'SLO を満たす測定点がありません',
  'benchmark.detail.result.boundaryLocated': 'SLO 境界を確認済み',
  'benchmark.detail.result.boundaryUnknown': 'より高い SLO 境界は未確認',
  'benchmark.detail.result.inProgress': '測定中',
  'benchmark.detail.result.peakFact':
    '総スループットのピーク：{throughput} tok/s、{load} {unit}',
  'benchmark.form.load.positiveRate':
    '0 より大きいリクエストレートを入力してください',
  'benchmark.form.load.positiveConcurrency':
    '同時実行数には正の整数を入力してください',
  'benchmark.form.load.rangeError': '上限は下限より大きくする必要があります',
  'benchmark.title': 'ベンチマーク',
  'benchmark.button.add': 'ベンチマークを追加',
  'benchmark.button.edit': 'ベンチマークを編集',
  'benchmark.button.clone': 'ベンチマークを複製',
  'benchmark.button.compare': '比較',
  'benchmark.table.model': 'モデル',
  'benchmark.form.target': 'ベンチマーク対象',
  'benchmark.table.dataset': 'データセット',
  'benchmark.table.requestRate': 'リクエストレート',
  'benchmark.table.gpu': 'GPU ',
  'benchmark.table.tpot': 'TPOT',
  'benchmark.table.ttft': 'TTFT',
  'benchmark.table.rps': 'リクエスト/秒',
  'benchmark.table.tps': 'Token/s',
  'benchmark.table.inputLen': '入力長',
  'benchmark.table.outputLen': '出力長',
  'benchmark.form.profile': 'プロファイル',
  'benchmark.form.totalRequests': 'リクエスト総数',
  'benchmark.form.concurrencyList': '同時実行数',
  'benchmark.form.loadType': '負荷の種類',
  'benchmark.form.loadType.fixedRate': '固定レート',
  'benchmark.form.loadType.concurrency': '並行',
  'benchmark.form.loadType.sweep': '自動スイープ',
  'benchmark.form.autoTune': '自動チューニング',
  'benchmark.form.autoTune.rate.tip':
    'この実行で測定する負荷ポイントです（1 ステージ = 1 測定点）。自動チューニングでは、総スループットが伸びなくなる（ピーク）までリクエストレートを自動的に引き上げるため、ポイントを手入力する必要はありません。「手動」に切り替えると、指定したレートを順に実行します。',
  'benchmark.form.autoTune.concurrency.tip':
    'この実行で測定する負荷ポイントです（1 ステージ = 1 測定点）。自動チューニングでは、レイテンシ目標を満たせなくなる（SLO 境界）まで並行数を自動的に増やすため、ポイントを手入力する必要はありません。「手動」に切り替えると、指定した並行数を順に実行します。',
  'benchmark.form.autoTune.rangeRate': '探索範囲 · リクエストレート (req/s)',
  'benchmark.form.autoTune.rangeFrom': '開始値',
  'benchmark.form.autoTune.rateFrom': '開始レート (req/s)',
  'benchmark.form.autoTune.rateTo': '終了レート (req/s)',
  'benchmark.form.autoTune.concFrom': '開始並行数',
  'benchmark.form.autoTune.concTo': '終了並行数',
  'benchmark.form.autoTune.rangeTo': '終了値',
  'benchmark.form.autoTune.rangeConcurrency': '探索範囲 · 並行数',
  'benchmark.form.autoTune.rangeMin': '最小',
  'benchmark.form.autoTune.rangeMax': '最大',
  'benchmark.form.autoTune.range.rate.tip':
    'アダプティブランプの探索範囲（厳密な範囲）:範囲外の負荷は一切測定しません。最小値から倍々に探索し最大値まで。最小値で既に飽和している場合は、実測した持続可能レートを報告し範囲を下げるよう促します（範囲より下は探索しません）。',
  'benchmark.form.autoTune.range.concurrency.tip':
    'アダプティブランプの探索範囲（厳密な範囲）:範囲外の負荷は一切測定しません。最小値から倍々に探索し最大値まで。最小値で既に飽和している場合は、実測した持続可能レートを報告し範囲を下げるよう促します（範囲より下は探索しません）。',
  'benchmark.form.autoTune.maxRate': '最大リクエストレート',
  'benchmark.form.autoTune.maxConcurrency': '最大並行数',
  'benchmark.form.load.managedByProfile': 'プロファイル管理',
  'benchmark.form.load.searchLimit': '探索上限',
  'benchmark.form.autoTune.maxPoints': '最大テストポイント数',
  'benchmark.form.autoTune.maxTotalSeconds': '最大合計時間（秒）',
  'benchmark.form.rateList': 'リクエストレート (req/s)',
  'benchmark.detail.overview.rate': 'レート / 同時実行数',
  'benchmark.detail.running.hint':
    'ベンチマーク実行中 — {progress}% 完了、これまでに {points} 点測定。各点の完了ごとにこのページは自動更新されます。',
  'benchmark.detail.running.finalizing':
    'ベンチマークの実行が完了 — 最終結果を集計・アップロード中です。このページは自動更新されます。',
  'benchmark.detail.stage.saturationProbe': '飽和プローブ',
  'benchmark.detail.aux.measured': '{requests} リクエスト / {seconds}s',
  'benchmark.detail.aux.ceiling': '上限 {rate} req/s',
  'benchmark.detail.aux.cap': 'ソフト上限 {cap}',
  'benchmark.detail.aux.capClamped': 'オーバーシュート点を抑えた',
  'benchmark.detail.aux.capRelaxed': '緩和済み — 探測が低く出た',
  'benchmark.detail.aux.capUnused': '一度も効かなかった',
  'benchmark.form.inputTokensList': '入力 Token 長（スイープ）',
  'benchmark.form.inputTokensList.placeholder': 'e.g. 128, 4096, 32768',
  'benchmark.form.turns': 'ターン数（マルチターン）',
  'benchmark.form.turns.unit': 'ターン',
  'benchmark.form.multiTurn': 'マルチターン',
  'benchmark.form.multiTurn.tips':
    '各サンプルをマルチターンの会話として送信します。各ターンは、蓄積された会話履歴を含む 1 つのリクエストです。合成（ランダム）データセットでのみ使用でき、チャットエンドポイントが必要です。',
  'benchmark.form.stopOnSaturation.tips':
    'スループットが頭打ちになった時点で実行を停止します（guidellm の過飽和制約）。飽和点を超えて負荷を増やし続けません。',
  'benchmark.form.warmup': 'ウォームアップ (%)',
  'benchmark.form.cooldown': 'クールダウン (%)',
  'benchmark.form.warmup.tips':
    '各ステージの「最初の N% のリクエスト」を測定ウィンドウから切り落とします（最初の N% の秒数ではありません）。コールドスタートの影響を除くために使います — 実行の最初の数リクエストは定常状態より数倍遅いことがあります。パーセントで入力します。例: 10 は各ステージの最初の 10% のリクエストを切り落とします。',
  'benchmark.form.cooldown.tips':
    '各ステージの「最後の N% のリクエスト」を測定ウィンドウから切り落とし、ステージが流し終える末尾を除外します。パーセントで入力します。例: 10 は各ステージの最後の 10% のリクエストを切り落とします。',
  'benchmark.form.maxErrors': '最大エラー数',
  'benchmark.form.maxErrorRate': '最大エラー率 (%)',
  'benchmark.form.maxErrorRate.tips':
    '失敗したリクエストの割合がこの水準に達した時点でステージを停止します — 測定する価値がなくなるまでに、実行のどれだけが失敗してよいかの上限です。パーセントで入力します。例: 5 はエラー率 5% でステージを止めます。空欄にするとエラー率を制限しません。',
  'benchmark.form.stopOnSaturation': '飽和時に停止',
  'benchmark.form.datasetSeed.tips':
    '合成データ生成のシード。多段実行では初期シードとなり、各段は 初期 + 段インデックス を使用します(「詳細設定」の「段ごとに異なるシード」をオフにすると固定)。',
  'benchmark.form.randomSeed': 'ランダムシード',
  'benchmark.form.randomSeed.tips':
    'オン(デフォルト):ベンチマーク作成ごとに新しいシードを使い、各ステージも異なるシードを使うため、同じ設定を再実行しても最初の実行のプレフィックスキャッシュに当たらず別データを送ります。オフ:シードを固定して実行を再現し、ステージごとに変えるか選べます。Random データセットのみ有効。',
  'benchmark.form.seedIncrement': '段ごとに異なるシード',
  'benchmark.form.seedIncrement.tips':
    'オン(既定):各段のシード = 初期 + 段インデックス。段ごとにデータが異なり、段間のキャッシュ再利用を抑制します。オフ:全段で同じシード。Random データセットのみ有効。',
  'benchmark.form.slo.ttft': '平均 TTFT ≤ (ms)',
  'benchmark.form.slo.p95Ttft': 'P95 TTFT ≤ (ms)',
  'benchmark.form.slo.p99Ttft': 'P99 TTFT ≤ (ms)',
  'benchmark.form.slo.tpot': '平均 TPOT ≤ (ms)',
  'benchmark.form.slo.p95Tpot': 'P95 TPOT ≤ (ms)',
  'benchmark.form.slo.p99Tpot': 'P99 TPOT ≤ (ms)',
  'benchmark.form.slo.avgLatency': '平均レイテンシ ≤ (ms)',
  'benchmark.form.slo.p95Latency': 'P95 レイテンシ ≤ (ms)',
  'benchmark.form.slo.p99Latency': 'P99 レイテンシ ≤ (ms)',
  'benchmark.form.slo.metric': 'メトリクス',
  'benchmark.form.slo.aggregation': '集計',
  'benchmark.form.slo.threshold': 'しきい値 (ms)',
  'benchmark.form.slo.add': 'SLO ターゲットを追加',
  'benchmark.form.slo.metric.ttft': 'TTFT',
  'benchmark.form.slo.metric.tpot': 'TPOT',
  'benchmark.form.slo.metric.latency': 'レイテンシ',
  'benchmark.form.slo.agg.avg': '平均',
  'benchmark.form.slo.agg.p95': 'P95',
  'benchmark.form.slo.agg.p99': 'P99',
  'benchmark.form.slo.col.metric': 'メトリクス',
  'benchmark.form.slo.col.threshold': 'しきい値',
  'benchmark.form.preset': 'プリセット',
  'benchmark.form.rate': 'リクエストレート (req/s)',
  'benchmark.form.concurrency': '並行数',
  'benchmark.form.stages': 'ステージ',
  'benchmark.form.stages.mode.manual': '手動',
  'benchmark.detail.stageLimits': 'ステージごとの上限',
  'benchmark.form.addStage': 'ステージを追加',
  'benchmark.form.maxRequests': '最大リクエスト数',
  'benchmark.form.maxSeconds': '最大秒数',
  'benchmark.form.maxSecondsCap': '最大秒数 (レートごと)',
  'benchmark.form.requestsOrSeconds':
    'リクエスト数か最大秒数を少なくとも1つ指定してください。',
  'benchmark.form.sweepSize': 'スイープ回数',
  'benchmark.form.sweepSize.tip':
    'スループットのピークを見つけるために自動スイープするレート数。',
  'benchmark.form.requests': 'リクエスト数',
  'benchmark.form.requestsPerRate': 'レートあたりのリクエスト数',
  'benchmark.form.requestsPerRate.tip':
    '複数のレートを自動スイープし、各レートでこの数のリクエストを送信します。',
  'benchmark.form.template': 'クイック入力テンプレート',
  'benchmark.form.group.dataset': 'ワークロード',
  'benchmark.form.group.load': '負荷',
  'benchmark.form.group.distribution': 'データ分布',
  'benchmark.form.group.distribution.input': '入力長の分布',
  'benchmark.form.group.distribution.output': '出力長の分布',
  'benchmark.form.dist.spread': 'ばらつき (±)',
  'benchmark.form.dist.spread.tip':
    '平均値まわりの Token 長の標準偏差 (±) です。値が大きいほど Token 長のばらつきが増えます。',
  'benchmark.form.dist.min': '最小',
  'benchmark.form.dist.max': '最大',
  'benchmark.form.distribution.intro':
    'リクエスト長を上記の平均値の周りで変動させます(固定長ではなく)。空欄ならデフォルト。ばらつき = 長さの散らばり(標準偏差);Min/Max は範囲を制限します。',
  'benchmark.form.group.constraints': '制約',
  'benchmark.form.group.slo': 'レイテンシ SLO',
  'benchmark.form.group.execution': '停止条件',
  'benchmark.form.group.advanced': '詳細設定',
  'benchmark.form.inputStdev': '入力長のばらつき (±)',
  'benchmark.form.inputMin': '入力最小値',
  'benchmark.form.inputMax': '入力最大値',
  'benchmark.form.sharegpt.tokenLengthSettings': 'Token長の設定',
  'benchmark.form.sharegpt.tokenLengthSettings.tip':
    '入力Token長は最小値、最大値、または両方を指定できます。出力Token長も任意で、空欄の場合は元の回答長を使用します。',
  'benchmark.form.sharegpt.inputRangeError':
    '入力最大値は入力最小値以上にしてください',
  'benchmark.form.sharegpt.positiveInteger': '正の整数を入力してください',
  'benchmark.form.outputStdev': '出力長のばらつき (±)',
  'benchmark.form.outputMin': '出力最小値',
  'benchmark.form.outputMax': '出力最大値',
  'benchmark.form.sharedPrefix': '共有プレフィックス',
  'benchmark.form.prefix.tip':
    'リクエスト間で共有する共通プロンプト接頭辞(システムプロンプト / RAG コンテキスト)。prefix-cache の再利用を検証します。バケットごと — Prefix Length: 接頭辞Token数、Count: 異なる接頭辞の数、Weight: それを使うリクエストの相対比率。',
  'benchmark.form.prefix.intro':
    '複数のリクエストで共有される共通のプロンプトプレフィックス(システムプロンプト / RAG コンテキスト)。プレフィックスキャッシュの再利用を検証します。複数のバケットを追加すると、重み付けで複数のプレフィックス長を混在できます。',
  'benchmark.form.prefix.length': 'プレフィックス長',
  'benchmark.form.prefix.count': '数',
  'benchmark.form.prefix.weight': '重み',
  'benchmark.form.prefix.add': 'プレフィックスを追加',
  'benchmark.form.concurrencyList.tips':
    '同時実行数ごと（例：40、60、80）にベンチマークを実行します。空欄の場合は、上記の単一のリクエストレートを使用します。',
  'benchmark.form.concurrencyList.placeholder': 'e.g. 40, 60, 80',
  'benchmark.form.profile.maxThroughput.tips':
    'スループットのピークを特定します。GPU やモデルを比較する際の標準的な基準です。',
  'benchmark.form.profile.latencySlo.tips':
    'TTFT/TPOT 目標を満たしたまま処理できる最大負荷を特定します。キャパシティプランニング向け。',
  'benchmark.form.profile.custom': 'カスタム',
  'benchmark.form.profile.custom.tips':
    '自動調整の探索範囲または手動のステージ一覧を設定します。すべてのフィールドを編集できます。',
  'benchmark.table.inputTokenLength': '入力 Token 長',
  'benchmark.table.outputTokenLength': '出力 Token 長',
  'benchmark.detail.summary.title': '概要',
  'benchmark.detail.configure.title': '設定',
  'benchmark.detail.environment.title': '環境',
  'benchmark.detail.logs.title': 'ログ',
  'benchmark.form.totalRequests.tips': 'リクエスト総数',
  'benchmark.table.filter.bygpu': 'GPU 検索',
  'benchmark.table.filter.bymodel': 'モデル検索',
  'benchmark.table.filter.bydataset': 'データセットで絞り込み',
  'benchmark.table.filter.byLoadType': '負荷タイプで絞り込み',
  'benchmark.table.filter.byTargetMode': '対象の形態で絞り込み',
  'benchmark.table.filter.byProfile': 'プロファイルで絞り込み',
  'benchmark.table.best': '最適点',
  'benchmark.table.best.unit.concurrency': '同時実行数',
  'benchmark.table.best.unit.rate': 'req/s',
  'benchmark.table.coverage': 'カバレッジ',
  'benchmark.table.coverage.insufficient': 'カバレッジ不足',
  'benchmark.table.avg': '平均',
  'benchmark.table.tailLatency': 'テールレイテンシ',
  'benchmark.table.columnSettings': '列の設定',
  'benchmark.detail.summary.results': 'テスト結果',
  'benchmark.detail.summary.recommendation': '主結果',
  'benchmark.detail.summary.supporting': '詳細メトリクス',
  'benchmark.detail.summary.stages': 'ステージ別の結果',
  'benchmark.detail.summary.totalStages': 'ステージ',
  'benchmark.detail.summary.totalRequests': 'リクエスト',
  'benchmark.detail.summary.totalDuration': '所要時間',
  'benchmark.detail.termination.requestsExhausted':
    '早期終了:データセットを使い切りました。{processed}/{requested} 件のみ実行。より大きなデータセットを使用してください。',
  'benchmark.detail.termination.maxSeconds':
    '早期終了:ステージの時間上限に達しました。{processed}/{requested} 件を実行。',
  'benchmark.detail.termination.maxErrors':
    '早期終了:エラーが多すぎます。{processed}/{requested} 件を実行。',
  'benchmark.detail.termination.default':
    '早期終了({reason}):{processed}/{requested} 件を実行。',
  'benchmark.detail.summary.stageDetail': 'ステージ詳細',
  'benchmark.detail.summary.performance': 'パフォーマンス',
  'benchmark.detail.reason.requestsSucceeded': '{total} 件のうち {ok} 件が成功',
  'benchmark.detail.reason.withinSlo': 'SLO を満たす',
  'benchmark.detail.reason.peakExceedsSlo':
    'スループットのピークは {rate} {unit} でより高くなりますが、そこで実行すると SLO を超えるため、推奨は SLO 境界です。',
  'benchmark.detail.reason.matchesPeak': '持続可能な最大スループット',
  'benchmark.detail.validity.title': 'テストカバレッジ',
  'benchmark.detail.validity.ok': '正常',
  'benchmark.detail.validity.overload':
    'Throughput プローブはレート制限なしで可能な限り速くリクエストを送り、サーバーを過負荷にしました(成功率 {rate}%)—— ピークスループットは信頼できず、サーバーの飽和限界を反映しています。',
  'benchmark.detail.validity.underRange':
    '最適動作点が最大サンプリング点です —— 真の最適値はさらに高い可能性があります。範囲を広げて(並行数/レートを上げて)再実行してください。',
  'benchmark.detail.validity.fewPoints':
    '測定点が少なすぎて曲線を信頼できません —— 上限 / 予算を確認してください。',
  'benchmark.detail.validity.sloNeverMet':
    'レイテンシ目標を満たす測定点がありません —— サーバーがこの SLO には遅すぎます。目標を緩めるかデプロイを変更してください。',
  'benchmark.detail.validity.sloNotBinding':
    'SLO 境界は未確認です。最高実測負荷が遅延目標を満たしたまま、{rate} 付近のスループット横ばいで探索が停止しました。適切な範囲と予算で SLO 探索を継続してください。',
  'benchmark.detail.validity.notSaturated':
    '最適動作点が最大の測定点で、過負荷も起きていません —— 真の最適値はさらに高い可能性があります。探索範囲(上限)を上げて再実行してください。',
  'benchmark.detail.validity.budgetExhausted':
    '結果の探索が完了する前に測定予算を使い切りました。{which, select, seconds{最大総時間} other{最大テストポイント数}}を増やして再測定してください。',
  'benchmark.detail.validity.saturatedAtLowerBound':
    '探索範囲の下限がこのデプロイの処理能力（約 {ceiling} req/s）を超えているため、範囲内のどの負荷も最適値になりません。探索範囲を下げて再実行してください。',
  'benchmark.detail.validity.peakAtFloor':
    '最適動作点が最小の測定点です —— 真の最適値は探索範囲より下にある可能性があります。探索範囲(下限)を下げて再実行してください。',
  'benchmark.detail.validity.pointHighError':
    'ある測定点の成功率が低い（{rate}% 成功）—— サーバーを過負荷にしており信頼できません。',
  'benchmark.detail.reason.confidence': '信頼度',
  'benchmark.detail.confidence.high': '高',
  'benchmark.detail.confidence.medium': '中',
  'benchmark.detail.summary.metadata': 'メタデータ',
  'benchmark.detail.summary.metrics': 'テスト指標',
  'benchmark.detail.summary.latency': 'レイテンシー',
  'benchmark.detail.summary.throughput': 'スループット',
  'benchmark.detail.summary.request': 'リクエスト',
  'benchmark.detail.avg.reqLatency': '平均リクエストレイテンシ',
  'benchmark.detail.avg.ttft': '平均 TTFT',
  'benchmark.detail.avg.tpot': '平均 TPOT',
  'benchmark.detail.avg.itl': 'ITL 平均',
  'benchmark.detail.throughput.totalToken': '合計スループット',
  'benchmark.detail.throughput.inputToken': '入力スループット',
  'benchmark.detail.throughput.outputToken': '出力スループット',
  'benchmark.detail.requests.total': 'リクエスト総数',
  'benchmark.detail.requests.success': '成功したリクエスト',
  'benchmark.detail.requests.failed': '失敗したリクエスト',
  'benchmark.detail.requests.incomplete': '未完了のリクエスト',
  'benchmark.detail.requests.concurrency': '実績同時実行数（平均）',
  'benchmark.detail.requests.concurrency.max': '実績同時実行数（最大）',
  'benchmark.detail.percentile.latency': 'レイテンシー',
  'benchmark.detail.percentile.inputTokens': '入力 Token',
  'benchmark.detail.percentile.outputTokens': '出力 Token',
  'benchmark.detail.percentile.input': '入力',
  'benchmark.detail.percentile.output': '出力',
  'benchmark.detail.percentile.total': '合計',
  'benchmark.detail.configure.tokenLength': 'Token 長（入力/出力）',
  'benchmark.detail.percentile.title': 'パーセンタイル',
  'benchmark.detail.modelName': 'モデル名',
  'benchmark.detail.instanceName': 'インスタンス名',
  'benchmark.detail.members.title': 'メンバー',
  'benchmark.detail.members.role': 'ロール',
  'benchmark.detail.members.injected': '注入パラメータ',
  'benchmark.detail.members.endpoint': 'エンドポイント',
  'benchmark.detail.configure': '設定',
  'benchmark.detail.config.deployment': 'デプロイメント',
  'benchmark.detail.config.benchmark': 'ベンチマーク',
  'benchmark.detail.best.peak': 'ピークスループット',
  'benchmark.detail.best.slo': 'SLO 内最大',
  'benchmark.detail.slo.target': 'SLO 目標',
  'benchmark.detail.slo.capacity': 'SLO 容量',
  'benchmark.detail.slo.capacity.locatedHint':
    'これより上の負荷で SLO 違反が実測されているため、ここが実際の限界です。',
  'benchmark.detail.slo.capacity.floorHint':
    'これより上は一度も測定されていません(探索が先に終了しました)ので、「少なくともこの値」と読んでください。実際に破綻する点はさらに上にあり、今回は測定されていません。',
  'benchmark.detail.tpot.tip':
    'TPOT: DecodeのみのTokenあたり時間 =(最後のToken − 最初のToken)/(出力Token数 − 1)。初回Token遅延は含みません。guidellm の inter_token_latency_ms に対応し、vLLM などが報告する TPOT と同じ量です。サーバーが逐次ストリーミングしない場合(出力全体を 1 チャンクで返す、低負荷でよくある)は測定できないため、初回Tokenを含むTokenあたり時間にフォールバックします。',
  'benchmark.detail.itl.tip':
    'ITL(Inter-Token Latency): 連続するストリーム出力間の実測間隔。間隔ごとに 1 サンプルをリクエスト横断で集計し、初回Token遅延は含みません。TPOT との違いはサンプルの粒度です。TPOT はリクエストごとに 1 つの平均値のため、単発の詰まりは同じリクエストの他の間隔で薄まりますが、ITL は各間隔を保持するためテールに現れます。vLLM / SGLang の ITL と同じ定義です。1 つのチャンクに複数Tokenが含まれる場合(投機的デコードなど)も 1 間隔として数えます。',
  'benchmark.detail.chart.sloBreached': 'SLO 違反',
  'benchmark.detail.chart.success': '成功率',
  'benchmark.detail.reason.peakTradeoff':
    'ピークは {rate} {unit}：総スループット {gain}%、TTFT p99 {cost}',
  'benchmark.detail.unit.avg': '平均',
  'benchmark.detail.p99.ttft': 'TTFT p99',
  'benchmark.detail.p99.tpot': 'TPOT p99',
  'benchmark.detail.p99.itl': 'ITL p99',
  'benchmark.detail.max.itl': 'ITL 最大',
  'benchmark.detail.lowSample':
    'このステージのサンプルは {count} 件で、p99 より上はわずか {tail} 件 —— テールはごく少数のリクエストで決まります。参考値として読み、SLO の結論には使わないでください（p99 が推定として機能するには約 1000 件必要）。',
  'benchmark.detail.successPill': '成功率 {pct}% · {ok} / {total} リクエスト',
  'benchmark.detail.summary.stagesHint':
    '任意の行をクリックすると詳細を表示します',
  'benchmark.detail.chart.loadSweep': '負荷スイープ',
  'benchmark.detail.chart.loadSweep.note':
    '負荷に対する総スループットと {metric}',
  'benchmark.detail.chart.dualAxisHint':
    '左軸（総スループット）は等間隔です。右軸は表示中のレイテンシ指標の対数目盛りで、1 目盛りごとに 10 倍になります。指標名は右軸のタイトルを確認してください。',
  'benchmark.detail.chart.logHint':
    'この軸は 1 目盛りごとに 10 倍で、同じ比率が同じ間隔として読めます。等間隔目盛りでは低負荷のステージが 0 付近に押し潰されます。',
  'benchmark.detail.chart.ttftDist': 'TTFT 分布',
  'benchmark.detail.chart.ttftDist.note':
    'p25–p75 の帯 + p50 実線 + p99 破線 · 帯が広がる = 分布が発散し始めた',
  'benchmark.detail.chart.rateShortfall': 'リクエストレート: 設定値 vs 実測',
  'benchmark.detail.chart.rateShortfall.note':
    '2 本の線が離れる最初のステージが実際の上限',
  'benchmark.detail.chart.latencyComposition': 'レイテンシの内訳',
  'benchmark.detail.chart.latencyComposition.note':
    '2 本の線の間 = 初回Token以降のすべて（Decode・スケジューリング待ち・バッチ待ちを含む）',
  'benchmark.detail.chart.frontier': 'レイテンシ–スループット フロンティア',
  'benchmark.detail.chart.frontier.note':
    'スループットを 1 tok/s 増やす代償としてのテールレイテンシ · 1 点が 1 ステージ',
  'benchmark.detail.chart.throughputSplit': 'スループットの構成',
  'benchmark.detail.chart.throughputSplit.note':
    '入力と出力の比率 — Prefill 主体か Decode 主体か',
  'benchmark.detail.chart.concShortfall': '同時実行数: 設定値 vs 実測',
  'benchmark.detail.chart.concShortfall.note':
    '2 本の線はほぼ重なるため、差分は右側の赤い目盛りで別に示しています',
  'benchmark.detail.chart.efficiency': '効率曲線',
  'benchmark.detail.chart.efficiency.note':
    '実行中リクエスト 1 件あたりの tok/s · 収穫逓減が始まる点',
  'benchmark.detail.chart.latencyDist': 'リクエストレイテンシ分布',
  'benchmark.detail.chart.latencyDist.note':
    'リクエスト単位のエンドツーエンド: 待ち時間 + 初回Token + 生成全体',
  'benchmark.detail.chart.tpotPercentiles': 'TPOT パーセンタイル',
  'benchmark.detail.chart.tpotPercentiles.note':
    'Decode段のTokenあたり時間(初回Tokenを除く) · リクエストごとに 1 値なので、負荷増加によるDecodeの低下を示し、単発の詰まりは示さない',
  'benchmark.detail.chart.itlPercentiles': 'ITL パーセンタイル',
  'benchmark.detail.chart.itlPercentiles.note':
    '連続するストリーム出力間の実測間隔 · 間隔ごとに 1 サンプルなので、テールに単発の詰まりが現れる',
  'benchmark.detail.chart.success.note':
    '失敗したリクエストがあるため表示しています',
  'benchmark.detail.chart.legend.shortfall': '不足',
  'benchmark.detail.chart.legend.attainment': '達成率',
  'benchmark.detail.chart.legend.configured': '目標',
  'benchmark.detail.chart.legend.achieved': '実績（平均）',
  'benchmark.detail.chart.legend.actual': '実績（平均）',
  'benchmark.detail.chart.legend.generation': '生成',
  'benchmark.detail.chart.legend.perRequest': 'リクエストあたり tok/s',
  'benchmark.detail.chart.axis.latencyMs': 'レイテンシ (ms)',
  'benchmark.detail.chart.axis.latencySec': 'リクエストレイテンシ (s)',
  'benchmark.detail.chart.axis.inFlight': '実行中リクエスト数',
  'benchmark.detail.chart.axis.shortfall': '不足（リクエスト数）',
  'benchmark.detail.chart.axis.successRate': '成功率 (%)',
  'benchmark.detail.chart.axis.load.rate': '目標リクエストレート (req/s)',
  'benchmark.detail.chart.axis.load.concurrency': '目標同時実行数 (リクエスト)',
  'benchmark.detail.chart.axis.throughput': '総スループット（tok/s）',
  'benchmark.detail.chart.axis.concurrencyAvg':
    '実績同時実行数（平均） (リクエスト)',
  'benchmark.detail.reason.peakTradeoffPlain':
    'ピークは {rate} {unit}：総スループット {gain}%',
  'benchmark.detail.summary.showMore': '他 {n} 件を表示',
  'benchmark.detail.summary.showLess': '折りたたむ',
  'benchmark.detail.selectedStage': '選択したステージ',
  'benchmark.detail.showPercentiles': 'パーセンタイルを表示',
  'benchmark.detail.hidePercentiles': 'パーセンタイルを非表示',
  'benchmark.detail.status': 'ステータス',
  'benchmark.detail.status.recommended': 'SLO 達成容量',
  'benchmark.detail.status.peak': '総スループットのピーク',
  'benchmark.detail.status.overloaded': '過負荷',
  'benchmark.detail.status.healthy': '正常',
  'benchmark.state.stoppedAt': '{percent}% で停止',
  'benchmark.detail.stopReason.label': '探索の終了理由',
  'benchmark.detail.stopReason.capacityPlateau': 'スループットの頭打ち',
  'benchmark.detail.stopReason.upperBound': '範囲の上限',
  'benchmark.detail.stopReason.budgetPoints': 'ポイント予算の消費',
  'benchmark.detail.stopReason.budgetSeconds': '時間予算の消費',
  'benchmark.detail.stopReason.sloFailed': 'レイテンシしきい値の超過',
  'benchmark.detail.stopReason.converged': '収束',
  'benchmark.detail.stopReason.overloaded': 'サーバー過負荷',
  'benchmark.detail.stopReason.pointFailed': '結果が得られなかったポイント',
  'benchmark.detail.stopReason.probeBound': '飽和プローブの上限',
  'benchmark.detail.recommend.text':
    '最適:並行 {rate} —— ピークスループットの {pct}%({tps} tok/s)、TTFT {ttft} ms{slo, select, yes{(SLO 内)} other{}}。',
  'benchmark.detail.analysis.text':
    '並行 {rate} は {tps} tok/s を安定して出力します{prev, select, yes{。{prevRate} よりスループット +{prevUp}%} other{}}{next, select, yes{。{nextRate} まで上げてもスループットは +{nextUp}% のみ、TTFT は +{nextTtftUp}%} other{}}。したがって {rate} が最適な動作点です{slo, select, yes{(SLO 内)} other{}}。',
  'benchmark.detail.specDigest': '構成世代',
  'benchmark.detail.modelFile': 'モデルファイル',
  'benchmark.detail.kvCache': '拡張 KV キャッシュ',
  'benchmark.detail.cacheService': 'キャッシュサービス',
  'benchmark.detail.speculativeDecoding': '投機的デコード',
  'benchmark.detail.inputOutputTokenLength': 'Token 長（入力/出力）',
  'benchmark.env.gpuName': 'GPU 名',
  'benchmark.env.workerName': 'Worker 名',
  'benchmark.env.hostedMembers': '収容メンバー',
  'benchmark.env.index': 'インデックス',
  'benchmark.env.system': 'システム',
  'benchmark.env.runtimeVersion': 'ランタイムのバージョン',
  'benchmark.env.driverVersion': 'ドライバーのバージョン',
  'benchmark.env.cpuCounts': 'CPU コア数',
  'benchmark.table.export.results': '結果をエクスポート',
  'benchmark.form.nonLlmModel.tips':
    '現在、ベンチマークは LLM モデルのみ対応しています',
  'benchmark.detail.result.duration': '所要時間',
  'benchmark.detail.result.basic': '基本',
  'benchmark.form.pdGroup.tips':
    '分離構成のグループはグループ全体を計測します。すべてのリクエストはルーターを通るため、メンバーを選ぶ必要はありません。サーバーが負荷をルーターに送り、重みを保持している Worker 上で負荷生成器を実行します。',
  'benchmark.detail.monitoring': 'モニタリング',
  'benchmark.detail.monitoring.tips':
    'この実行の時間範囲でダッシュボードを開きます。分離構成のグループは PD ダッシュボードに移動し、Prefill キュー・Decode キュー・KV 転送がそれぞれ表示されます。',
  'benchmark.form.targetMode': 'ベンチマーク対象の形態',
  'benchmark.form.targetMode.instance': 'インスタンス（エンジンを計測）',
  'benchmark.form.targetMode.route': 'ルート（デプロイメントを計測）',
  'benchmark.form.targetMode.tips.instance':
    '負荷を単一のエンジンへ直接送ります（グループのルーター、または通常モデルの 1 レプリカ）。経路上にエンジン以外は入りません。',
  'benchmark.form.targetMode.tips.route':
    'クライアントが呼び出す入口から入るため、通常モデルのすべてのレプリカが対象になります。同じカード数で分離構成と集約構成を比較する場合はこちらを使ってください。',
  'benchmark.form.targetMode.tips.results.title': 'ルートの結果の読み方',
  'benchmark.form.targetMode.tips.results':
    'ルートではサーバーのプロキシが経路に入ります。高並列ではデプロイメントより先にプロキシが飽和してリクエストを落とすことがあり、落とされたリクエストはレイテンシに含まれないため、TTFT / TPOT が実際より良く見えます。ルートモードの結果は必ずエラー数・未完了数と合わせて読んでください。',
  'benchmark.detail.targetMode.route': 'ルート（デプロイメント）· {route}',
  'benchmark.form.target.route': 'ルート',
  'benchmark.form.target.route.empty':
    'このクラスターには、応答可能な LLM を指すルートがありません。ルートをデプロイするか、インスタンス形態に切り替えてください。'
};
