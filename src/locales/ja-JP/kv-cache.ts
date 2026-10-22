export default {
  'kvCache.check.recreate.insufficientRam':
    'Worker {worker} での再作成には {required} GiB が必要ですが、現在割り当て可能なのは {available} GiB です。リソースを解放するか、設定を変更してください。',
  'kvCache.check.recreate.unavailable':
    '再作成に必要なリソースデータを取得できません。',
  'kvCache.title': 'キャッシュサービス',
  'kvCache.source.manage': 'プロバイダーを管理',
  'kvCache.source.builtin':
    'このリリースに同梱されたキャッシュプロバイダーと、インストール済み拡張機能が追加するプロバイダー',
  'kvCache.button.add': 'キャッシュサービスを追加',
  'kvCache.providerSelect.title': 'プロバイダーを選択',
  'kvCache.provider.source.builtin': '内蔵',
  'kvCache.provider.source.community': 'コミュニティ',
  'kvCache.provider.source.partner': 'GPUStack 認定パートナー',
  'kvCache.button.viewLogs': 'ログを表示',
  'kvCache.edit.recreate.tips':
    '変更は、インスタンスを削除して再作成した後に反映されます。',
  'kvCache.table.provider': 'プロバイダー',
  'kvCache.table.worker': 'Worker',
  'kvCache.form.provider': 'プロバイダー',
  'kvCache.form.cluster.tips':
    'GPU サービスタイプのクラスターはキャッシュ高速化に対応していません。',
  'kvCache.form.version': 'バージョン',
  'kvCache.form.version.custom': 'カスタム',
  'kvCache.form.image': 'コンテナイメージ',
  'kvCache.check.ok.perNode':
    'リソースは十分です。{count} 台の Worker それぞれで 1 つのインスタンスを実行します。',
  'kvCache.check.ok.singleton':
    'リソースは十分です。インスタンスは Worker {worker} で実行します。',
  'kvCache.check.noWorkers': 'セレクターに一致する Worker がありません。',
  'kvCache.check.noReadyWorkers':
    'このクラスターには準備完了状態の Worker がありません。別のクラスターを選択するか、Worker の状態を確認してください。',
  'kvCache.check.noReadyTargets':
    '選択した Worker とラベルに一致する準備完了状態の Worker がありません。選択を変更するか、Worker の状態を確認してください。',
  'kvCache.check.workersLoading':
    'Worker の状態を読み込み中です。完了してからデプロイしてください。',
  'kvCache.check.workersUnavailable':
    'Worker の状態を読み込めません。クラスターを選択し直して再試行してから、デプロイしてください。',
  'kvCache.check.ok.store':
    'デプロイ可能: 条件に一致する Worker に、各 {size} GiB の store レプリカを {replicas} 個配置できます',
  'kvCache.check.store.insufficientWorkers':
    'セレクターに一致する Worker は {count} 台のみです。store レプリカは {replicas} 個必要です',
  'kvCache.check.store.exceedsFree':
    '条件に一致する Worker のうち、空きメモリが {size} GiB あるのは {count} 台のみです。レプリカは {replicas} 個必要です',
  'kvCache.check.store.exceedsTotal':
    '条件に一致する Worker のうち、総メモリ容量が各 {size} GiB の store レプリカを収容できるのは {count} 台のみです。レプリカは {replicas} 個必要です',
  'kvCache.check.unsupportedAccel':
    '対象の Worker {total} 台のうち {count} 台は、このバージョンのイメージがないアクセラレーター（{backends}）を使用しています。これらの Worker ではインスタンスを起動できません',
  'kvCache.check.noCpuImage':
    '対象の Worker {total} 台のうち {count} 台にはアクセラレーターがありません。このバージョンにはアクセラレーターなしで実行できるイメージがないため、これらの Worker ではインスタンスを起動できません',
  'kvCache.form.ramSize.exceedsTotal':
    'Worker {worker} の総メモリ容量（{total} GiB）を超えています。',
  'kvCache.form.ramSize.exceedsFree':
    'Worker {worker} の空きメモリ容量（{free} GiB）を超えています。キャッシュサーバーがメモリ不足（OOM）で終了される可能性があります。',
  'kvCache.form.workerSelector': 'Worker ラベルセレクター',
  'kvCache.form.worker.autoTips':
    '任意。空欄にすると、スケジューラーがインスタンスを配置します',
  'kvCache.form.workerSelector.scopeTips':
    'すべてのラベルに一致する Worker のみにインスタンスを配置します。空欄にすると、すべての Worker が対象になります。',
  'kvCache.form.workerSelector.tips':
    'すべてのラベルに一致する各 Worker で 1 つのインスタンスを実行します。空欄にすると、すべての Worker が対象になります。',
  'kvCache.form.managementUrl': '管理 URL',
  'kvCache.form.managementUrl.tips':
    'エンジンが提供する管理 UI へのリンクです。サービス名の横に表示されます',
  'kvCache.form.managementUrl.invalid': '有効な http(s) URL を入力してください',
  'kvCache.button.management': '管理 URL',
  'kvCache.form.advanced': '詳細設定',
  'kvCache.form.parameters': 'パラメーター',
  'kvCache.form.parameters.noComponent':
    '上記の設定でこのプロバイダーのすべてのコンポーネントが無効になっているため、パラメーターを渡す対象がありません。',
  'kvCache.form.env': '環境変数',
  'kvCache.form.env.componentTips':
    'サービスのすべてのコンポーネントに適用されます',
  'kvCache.form.l2Backend': 'L2 ストレージバックエンド',
  'kvCache.form.l2Backend.add': 'バックエンドを追加',
  'kvCache.form.l2Backend.backend': 'バックエンド',
  'kvCache.form.l2Backend.type': 'タイプ',
  'kvCache.form.l2Backend.customOptions': 'カスタムオプション',
  'kvCache.form.l2Backend.tips':
    'KV キャッシュを大容量の二次ストレージ階層に退避します。項目は順番に優先され、読み取りは最初の項目を優先し、書き込みはすべての項目に行います。',
  'kvCache.detail.overview': '概要',
  'kvCache.detail.perWorker': 'Worker あたり',
  'kvCache.detail.capacity': '容量',
  'kvCache.detail.instances': 'インスタンス',
  'kvCache.edit.title': '{name} を編集',
  'kvCache.instances.loadFailed':
    'インスタンスの読み込みに失敗しました。再試行中です',
  'kvCache.instances.empty': 'インスタンスがまだありません',
  'kvCache.detail.monitoring': '監視',
  'kvCache.detail.hitRate': 'ヒット率',
  'kvCache.detail.externalHitRate': '外部キャッシュのヒット率',
  'kvCache.detail.usage': 'L1 キャッシュ使用量',
  'kvCache.detail.l2Usage': 'L2 キャッシュ使用量',
  'kvCache.detail.lookupTraffic': '検索トラフィック',
  'kvCache.detail.usageRatio': 'L1 使用率',
  'kvCache.detail.throughput': 'スループット',
  'kvCache.detail.noMetrics': 'メトリクスデータがありません',
  'kvCache.detail.metricsUnavailable': 'メトリクスを取得できません',
  'kvCache.detail.aggregated': '集計',
  'kvCache.detail.perInstance': 'インスタンス別',
  'kvCache.detail.hitTokens': 'ヒットした Token 数',
  'kvCache.detail.hitTokens.tips':
    '選択した期間内に共有キャッシュから提供された Token 数です。推論エンジンが報告した値を表示します',
  'kvCache.detail.queriedTokens': '検索した Token 数',
  'kvCache.detail.queriedTokens.tips':
    '選択した期間内に共有キャッシュで検索された Token 数です。推論エンジンが報告した値を表示します',
  'kvCache.detail.hitRate.engineTips':
    '選択した期間内の、推論エンジン自身の外部キャッシュヒットカウンターに基づく値です。現在は vLLM のみ対応しており、その他のバックエンドは「-」と表示されます',
  'kvCache.detail.view': '表示',
  'kvCache.detail.modelInstances': '接続中のモデルインスタンス'
};
