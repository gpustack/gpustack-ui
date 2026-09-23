export default {
  'models.button.deploy': 'モデルをデプロイ',
  'models.button.exportYaml': 'Export YAML',
  'models.button.importYaml': 'Import YAML',
  'models.form.yamlFile': 'YAML ファイル',
  'models.import.checking': '検証中…',
  'models.import.hint.nothing': 'インポートできるデプロイメントがありません',
  'models.import.pickFile': 'ファイルを選択',
  'models.import.empty.title': 'YAML ファイルをインポート',
  'models.import.empty.description':
    'デプロイメントを記述したファイルを選択してください。インポート前に比較し、書き込まれる内容を差分ですべて確認できます。',
  'models.import.cluster.follow': 'ファイルに従う',
  'models.import.loaded':
    '{count} 件のデプロイメント · {cluster} クラスターの現状と一致',
  'models.import.loaded.hint':
    'このドキュメントは {cluster} クラスターの現状と一致しているため、書き込む内容はありません。',
  'models.import.counts':
    '{count} 件のデプロイメント · {cluster} へインポート · {changes} 件の変更',
  'models.import.parsed': '{count} 件のデプロイメント',
  'models.import.parsed.invalid': '{count} 件はインポートできません',
  'models.import.fieldsDoc': 'フィールド説明',
  'models.import.nav.invalid': 'インポート不可',
  'models.import.scope.all': '全 {count} 件のデプロイメント',
  'models.import.scope.whole': 'ドキュメント全体',
  'models.import.scope.wholeShort': '全体',
  'models.import.pane.current': 'クラスターの現状 · 読み取り専用',
  'models.import.pane.draft': 'インポート内容 · 編集可能',
  'models.import.pane.absent': '同名のデプロイメントはありません',
  'models.import.pane.none': 'クラスターに一致するデプロイメントはありません',
  'models.import.pane.allNew':
    'すべて新規のデプロイメントです。置き換えられるものはありません',
  'models.import.pane.waiting': '比較する内容はまだありません',
  'models.import.entry': '{index} 番目のデプロイメント',
  'models.import.entry.invalid':
    '{index} 番目のデプロイメントはインポートできません',
  'models.import.summary':
    '新規作成 {create} 件、更新 {update} 件、変更なし {unchanged} 件。',
  'models.import.summary.replaces':
    '更新はファイルの内容で全体が置き換えられます。',
  'models.import.action.create': '新規作成',
  'models.import.action.update': '更新',
  'models.import.action.unchanged': '変更なし',
  'models.import.changes': '{count} 件の変更',
  'models.import.blocked':
    '{count} 件のデプロイメントをインポートできません。修正してから送信してください。',
  'models.import.overwrite.title': 'インポートの確認',
  'models.import.overwrite.confirm':
    '以下の {count} 件の既存デプロイメントがファイルの内容で全体的に置き換えられます。ファイルに記載のない設定は既定値に戻ります。',
  'models.import.overwrite.rest':
    'さらに {create} 件を新規作成し、{unchanged} 件は変更されません。',
  'models.import.invalid':
    'このファイルはインポートできません。以下の問題を修正すると、再度検証されます。',
  'models.title': 'モデル',
  'models.title.edit': 'モデルを編集',
  'models.title.duplicate': 'モデルをクローン',
  'models.table.models': 'モデル',
  'models.table.name': 'モデル名',
  'models.form.source': 'ソース',
  'models.form.repoid': 'リポジトリID',
  'models.form.repoid.desc': 'GGUF形式のみサポートされています',
  'models.form.filename': 'ファイル名',
  'models.form.replicas': 'レプリカ',
  'models.form.selector': 'セレクター',
  'models.form.env': '環境変数',
  'models.form.configurations': '設定',
  'models.form.s3address': 'S3アドレス',
  'models.form.partialoffload.tips': `When CPU offloading is enabled, GPUStack will allocate CPU memory if GPU resources are insufficient. You must correctly configure the inference backend to use hybrid CPU+GPU or full CPU inference.`,
  'models.form.distribution.tips':
    'ワーカーのリソースが不足している場合、モデルの一部のレイヤーを単一または複数のリモートワーカーにオフロードすることができます。',
  'models.openinplayground': 'プレイグラウンドで開く',
  'models.instances': 'インスタンス',
  'models.table.replicas.edit': 'レプリカを編集',
  'model.form.ollama.model': 'Ollamaモデル',
  'model.form.ollamaholder': 'モデル名を選択または入力してください',
  'model.deploy.sort': '並び替え',
  'model.deploy.search.placeholder': '<kbd>/</kbd>を入力してモデルを検索',
  'model.form.ollamatips':
    'ヒント: 以下はGPUStackで事前設定されたOllamaモデルです。希望するモデルを選択するか、右側の【{name}】入力ボックスにデプロイしたいモデルを直接入力してください。',
  'models.sort.name': '名前',
  'models.sort.size': 'サイズ',
  'models.sort.likes': 'いいね',
  'models.sort.trending': 'トレンド',
  'models.sort.downloads': 'ダウンロード数',
  'models.sort.updated': '更新日',
  'models.search.result': '{count} 件の結果',
  'models.data.card': 'モデルカード',
  'models.available.files': '利用可能なファイル',
  'models.viewin.hf': 'Hugging Faceで表示',
  'models.viewin.modelscope': 'ModelScopeで表示',
  'models.architecture': 'アーキテクチャ',
  'models.search.noresult': '関連するモデルが見つかりません',
  'models.search.nofiles': '利用可能なファイルがありません',
  'models.search.networkerror': 'ネットワーク接続エラー！',
  'models.search.hfvisit': 'アクセスできることを確認してください',
  'models.search.unsupport':
    'このモデルはサポートされておらず、デプロイ後に使用できない可能性があります。',
  'models.form.scheduletype': 'スケジュールタイプ',
  'models.form.categories': 'モデルカテゴリ',
  'models.form.scheduletype.auto': '自動',
  'models.form.scheduletype.manual': '手動',
  'models.form.scheduletype.gpu': 'GPUを指定',
  'models.form.scheduletype.gpuType': 'GPUタイプを指定',
  'models.form.scheduletype.auto.tips':
    '現在のリソース状況に基づいて、モデルインスタンスを適切なGPUに自動的にデプロイします。',
  'models.form.scheduletype.manual.tips':
    'モデルインスタンスをデプロイするGPUを手動で指定できます。',
  'models.form.gpuallocation': 'GPU 割り当て',
  'models.form.gpumode.full': '全体',
  'models.form.gpumode.slicing': '分割',
  'models.form.gpuType.noSlicedCapacity':
    'この GPU タイプに分割可能な容量がありません。別の GPU タイプを選択してください。',
  'models.form.gpuType.noPartitionProfile':
    'この GPU タイプに利用可能な分割プロファイルがありません。別の GPU タイプを選択してください。',
  'models.form.manual.schedule': '手動スケジュール',
  'models.table.gpuindex': 'GPUインデックス',
  'models.table.vgpu': 'vGPU',
  'models.table.vgpu.slice': '{memory}% VRAM / {cores}% 演算',
  'models.table.backend': 'バックエンド',
  'models.table.acrossworker': 'ワーカー間で分散',
  'models.table.cpuoffload': 'CPUオフロード',
  'models.table.layers': 'レイヤー',
  'models.form.backend': 'バックエンド',
  'models.form.backend_parameters': 'バックエンドパラメータ',
  'models.instance.params.configured': 'User Configured',
  'models.instance.params.autoInjected': '自動注入パラメータ',
  'models.search.gguf.tips':
    'GGUFモデルはllama-boxを使用します（Linux、macOS、Windowsをサポート）。',
  'models.search.vllm.tips':
    '非GGUFモデルは、音声にはvox-boxを、その他にはvLLM（x86 Linuxのみ）を使用します。',
  'models.search.voxbox.tips':
    '音声モデルをデプロイするには、GGUFチェックボックスをオフにしてください。',
  'models.form.ollamalink':
    '<a href="https://www.ollama.com/library" target="_blank">Ollamaライブラリ</a>でさらに探す',
  'models.form.backend_parameters.llamabox.placeholder':
    '例: --ctx-size=8192（=または空白で名前と値を分ける）',
  'models.form.backend_parameters.vllm.placeholder':
    '例: --max-model-len=8192（=または空白で名前と値を分ける）',
  'models.form.backend_parameters.sglang.placeholder':
    '例: --context-length=8192（=または空白で名前と値を分ける）',
  'models.form.backend_parameters.vllm.tips':
    'For more details about {backend} parameters, see <a href={link} target="_blank">here</a>.',
  'models.logs.pagination.prev': '前の{lines}行',
  'models.logs.pagination.next': '次の{lines}行',
  'models.logs.pagination.last': '最終ページ',
  'models.logs.pagination.first': '最初のページ',
  'models.logs.pagination.jump': '指定ページへ移動',
  'models.form.localPath': 'ローカルパス',
  'models.form.filePath': 'モデルパス',
  'models.form.backendVersion': 'バックエンドバージョン',
  'models.form.backendVersion.tips':
    '希望する{backend}{version}バージョンを使用するには、システムがオンライン環境で対応するバージョンをインストールする仮想環境を自動的に作成します。GPUStackのアップグレード後もバックエンドバージョンは固定されます。{link}',
  'models.form.gpuselector': 'GPUセレクター',
  'models.form.backend.llamabox':
    'GGUF形式のモデル用（Linux、macOS、Windowsをサポート）。',
  'models.form.backend.vllm':
    'Built-in support for NVIDIA, AMD, Ascend, Hygon, Moore Threads, Iluvatar, MetaX, T-Head PPU devices.',
  'models.form.backend.voxbox': 'Only supports NVIDIA GPUs and CPUs.',
  'models.form.backend.mindie': 'Only supports Ascend NPUs.',
  'models.form.backend.sglang':
    'Built-in support for NVIDIA, AMD, Ascend, Moore Threads, MetaX, T-Head PPU devices.',
  'models.form.search.gguftips':
    'macOSまたはWindowsをワーカーとして使用する場合、GGUFをチェックしてください（音声モデルの場合はオフにしてください）。',
  'models.form.button.addlabel': 'ラベルを追加',
  'models.filter.category': 'カテゴリでフィルタ',
  'models.list.more.logs': 'さらに表示',
  'models.catalog.release.date': 'リリース日',
  'models.localpath.gguf.tips.title': 'GGUF形式のモデル',
  'models.localpat.safe.tips.title': 'Safetensors形式のモデル',
  'models.localpath.shared.tips.title': '分割されたGGUF形式のモデル',
  'models.localpath.gguf.tips':
    'モデルファイルを指定してください。例: /data/models/model.gguf。',
  'models.localpath.safe.tips':
    'config.jsonファイルを含む.safetensorsディレクトリを指定してください。例: /data/models/model。',
  'models.localpath.chunks.tips': `モデルの最初のシャードファイルを指定してください。例: /data/models/model-00001-of-00004.gguf。`,
  'models.form.replicas.tips':
    '複数のレプリカにより、{api} 推論リクエストの負荷分散が可能になります。',
  'models.table.list.empty': 'まだモデルがありません！',
  'models.table.list.getStart':
    '<span style="margin-right: 5px;font-size: 13px;">始めるには</span> <span style="font-size: 14px;font-weight: 700">DeepSeek-R1-Distill-Qwen-1.5B</span>',
  'models.table.llamaAcrossworker': 'Llama-box ワーカー間分散',
  'models.table.vllmAcrossworker': 'vLLM ワーカー間分散',
  'models.form.releases': 'リリース',
  'models.form.moreparameters': 'パラメータ説明',
  'models.table.vram.allocated': '割り当て済みVRAM',
  'models.table.vram.workers': '{n} ワーカー',
  'models.instance.workergpu': '{n} ワーカー / {m} GPU',
  'models.instance.mainworker': 'メインワーカー（Main）',
  'models.instance.worker': '実行ワーカー',
  'models.instance.workerip': 'ワーカー IP:Port',
  'models.form.backend.warning':
    'The selected backend does not support GGUF models. Please add a backend with GGUF support in the Inference Backend.',
  'models.form.backend.warning.gguf':
    'Please ensure that the selected custom backend supports GGUF models.',
  'models.form.ollama.warning':
    'Ollamaモデルのバックエンドをllama-boxを使用してデプロイします。',
  'models.form.backend.warning.llamabox':
    'llama-boxバックエンドを使用するには、モデルファイルのフルパスを指定してください（例:<span style="font-weight: 700">/data/models/model.gguf</span>）。分割モデルの場合、最初のシャードのパスを指定してください（例:<span style="font-weight: 700">/data/models/model-00001-of-00004.gguf</span>）。',
  'models.form.keyvalue.paste':
    '複数行のテキストを貼り付けます。各行にはキーと値のペアが含まれ、キーと値は=記号で区切られ、異なるキーと値のペアは改行文字で区切られます。',
  'models.form.files': 'ファイル',
  'models.table.status': 'ステータス',
  'models.form.submit.anyway': 'このまま送信',
  'models.form.evaluating': 'モデルの互換性を評価中',
  'models.form.incompatible': '互換性の問題が検出されました',
  'models.form.nativeAnthropicApi': 'ネイティブ Anthropic API',
  'models.form.nativeAnthropicApi.tips':
    '推論サーバー自体が Anthropic Messages API を実装している場合（新しめの vLLM など）に有効にします。/v1/messages へのリクエストがそのまま転送されます。無効のままでも /v1/messages は利用できますが、先に /v1/chat/completions へ変換されます。',
  'models.form.restart.onerror': 'エラー時に自動再起動',
  'models.form.restart.onerror.tips':
    'エラーが発生した場合、自動的に再起動を試みます。',
  'models.form.check.params': '設定を確認中...',
  'models.form.check.passed': '互換性チェックに合格しました',
  'models.form.check.claims':
    'このモデルには約{vram}のVRAMと{ram}のメモリが必要です。',
  'models.form.check.claims2': 'このモデルには約{vram}のVRAMが必要です。',
  'models.form.check.claims3': 'このモデルには約{ram}のメモリが必要です。',
  'models.form.check.claims.group':
    'このグループ全体で約{vram}のVRAMと{ram}のメモリが必要です。',
  'models.form.check.claims.role':
    '{role} × {replicas}：1レプリカあたり約{vram}のVRAM',
  'models.form.check.claims.role.total':
    '{role} × {replicas}：合計で約{vram}のVRAM',
  'models.form.check.claims.role.ram':
    '{role} × {replicas}：合計で約{ram}のメモリ',
  'models.form.update.tips':
    '変更はインスタンスを削除して再作成した後にのみ適用されます。',
  'models.table.download.progress': '進行状況',
  'models.table.button.apiAccessInfo': 'APIアクセス情報',
  'models.table.button.apiAccessInfo.tips':
    'このモデルをサードパーティアプリケーションと統合するには、以下の詳細を使用してください: アクセスURL、モデル名、APIキー。これらの資格情報は、モデルサービスの適切な接続と使用を確保するために必要です。',
  'models.table.apiAccessInfo.endpoint': 'アクセスURL',
  'models.table.apiAccessInfo.modelName': 'モデル名',
  'models.table.apiAccessInfo.apikey': 'APIキー',
  'models.table.apiAccessInfo.openaiCompatible': 'OpenAI互換',
  'models.table.apiAccessInfo.anthropicCompatible': 'Anthropic互換',
  'models.table.apiAccessInfo.jinaCompatible': 'Jina互換',
  'models.table.apiAccessInfo.gotoCreate': '作成に移動',
  'models.search.parts': '{n} 部分',
  'models.search.evaluate.error': '評価中にエラーが発生しました: ',
  'models.ollama.deprecated.title': 'Deprecation Notice',
  'models.ollama.deprecated.current':
    '<span class="bold-text">Current Version (v0.6.1): </span>Ollama models are currently available for use.',
  'models.ollama.deprecated.upcoming':
    '<span class="bold-text">Upcoming Version (v0.7.0): </span>The Ollama model source will be removed from the UI.',
  'models.ollama.deprecated.following':
    '<span class="bold-text">Following the v0.7.0 update,</span> all previously deployed models will continue to work as expected.',
  'models.ollama.deprecated.issue':
    'See the related issue: <a href="https://github.com/gpustack/gpustack/issues/1979" target="_blank">#1979 on GitHub</a>.',
  'models.ollama.deprecated.notice': `The Ollama model source has been deprecated as of v0.6.1. For more information, see the <a href="https://github.com/gpustack/gpustack/issues/1979" target="_blank">related GitHub issue</a>.`,
  'models.backend.mindie.310p':
    'Ascend 310P only supports FP16, so you need to set --dtype=float16.',
  'models.form.gpuCount': '各レプリカのGPU数',
  'models.form.gpuType': 'GPU タイプ',
  'models.form.optimizeLongPrompt': '長いプロンプトを最適化',
  'models.form.enableSpeculativeDecoding': '推測デコーディングを有効にする',
  'models.form.check.clusterUnavailable': 'Current cluster is unavailable',
  'models.form.check.otherClustersAvailable':
    'Available clusters: {clusters}. Please switch cluster.',
  'models.button.accessSettings': 'Access Settings',
  'models.table.accessScope': 'Access Scope',
  'models.table.accessScope.all': 'All users',
  'models.table.userSelection': 'User Selection',
  'models.button.accessSettings.tips':
    'Changes to access settings take effect after one minute.',
  'models.table.userSelection.tips':
    'Admin users can access all models by default.',
  'models.table.filterByName': 'Filter by username',
  'models.table.admin': 'Admin',
  'models.table.noselected': 'No users selected',
  'models.table.users.all': 'All Users',
  'models.table.users.selected': 'Selected Users',
  'models.table.nouserFound': 'No users found',
  'models.form.performance': 'Performance',
  'models.form.gpus.notfound': 'No GPUs found',
  'models.form.extendedkvcache': 'Enable Extended KV Cache',
  'models.form.chunkSize': 'Size of Cache Chunks',
  'models.form.maxCPUSize': 'Maximum CPU Cache Size (GiB)',
  'models.form.remoteURL': 'Remote Storage URL',
  'models.form.remoteURL.tips':
    'Refer to the <a href="https://docs.lmcache.ai/api_reference/configurations.html" target="_blank">configuration documentation</a> for details.',
  'models.form.runCommandPlaceholder':
    'e.g., vllm serve Qwen/Qwen2.5-1.5B-Instruct',
  'models.accessSettings.public': 'Public',
  'models.accessSettings.authed': 'Authenticated',
  'models.accessSettings.allowedUsers': 'Allowed users',
  'models.accessSettings.public.tips':
    'When set to public, anyone can access this model without authentication, which may lead to data exposure risks.',
  'models.table.button.deploy': 'Deploy Now',
  'models.form.backendVersion.holder': 'Enter or select a version',
  'models.form.gpusperreplica': 'GPUs per Replica',
  'models.form.gpusAllocationType': 'GPU Allocation Type',
  'models.form.gpusAllocationType.auto': 'Auto',
  'models.form.gpusAllocationType.custom': 'Custom',
  'models.form.gpusAllocationType.auto.tips':
    'The system automatically calculates the GPU count per replica, using powers of two by default and capped by the selected GPUs.',
  'models.form.gpusAllocationType.custom.tips':
    'You can specify the exact number of GPUs per replica.',
  'models.mymodels.status.inactive': 'Stopped',
  'models.mymodels.status.degrade': 'Not Ready',
  'models.mymodels.status.active': 'Ready',
  'models.form.kvCache.tips':
    'Extended KV cache and speculative decoding are only available with built-in backends (vLLM / SGLang), Please switch the backend to enable them.',
  'models.form.kvCache.tips2':
    'Only supported when using built-in inference backends (vLLM or SGLang).',
  'models.form.kvCache.backend': 'Cache Backend',
  'models.form.kvCache.local': 'In-Process Cache',
  'models.form.kvCache.service.tips':
    'Only cache services in the same cluster and compatible with the selected backend are listed.',
  'models.form.kvCache.shared.builtinBackends':
    'Cache Service is only supported with the built-in vLLM and SGLang backends.',
  'models.kvCache.degraded.tips':
    'Shared KV cache is not active for this instance',
  'models.kvCache.endpointDead.tips':
    'The shared cache this instance attached to is no longer available; restart the instance to recover',
  'models.kvCache.service': 'Cache Service',
  'models.kvCache.hitRate': 'External Cache Hit Rate ({window})',
  'models.kvCache.hitRate.window': '1h',
  'models.form.scheduling': 'Scheduling',
  'models.form.scaling': 'スケジュールスケーリング',
  'models.form.scaling.enable': 'スケジュールスケーリングを有効化',
  'models.form.scaling.enable.tips':
    '繰り返しの時間ウィンドウ内でレプリカ数を調整します（例：昼は多く、夜は少なく）。どのウィンドウにも該当しない場合、モデルは設定されたレプリカ数をベースラインとして使用します。',
  'models.form.scaling.tz.note':
    'スケジュール時刻はサーバー全体のタイムゾーン（GPUSTACK_TIMEZONE、既定ではサーバーのタイムゾーン）を使用します。',
  'models.form.scaling.rules': 'ルール',
  'models.form.scaling.cron': 'Cron 式',
  'models.form.scaling.useCron': 'CRON 式を使用',
  'models.form.scaling.repeat': '繰り返し',
  'models.form.scaling.repeat.daily': '毎日',
  'models.form.scaling.repeat.weekdays': '平日（月〜金）',
  'models.form.scaling.repeat.weekends': '週末（土・日）',
  'models.form.scaling.repeat.weekly': '毎週',
  'models.form.scaling.repeat.monthly': '毎月',
  'models.form.scaling.repeat.cron': 'CRON',
  'models.form.scaling.weekdaysLabel': '曜日',
  'models.form.scaling.monthdaysLabel': '日付',
  'models.form.scaling.startTime': '開始時刻',
  'models.form.scaling.endTime': '終了時刻',
  'models.form.scaling.crossDay': '翌日に終了',
  'models.form.scaling.nextDayBadge': '+1 日',
  'models.form.scaling.timezone': 'タイムゾーン',
  'models.form.scaling.tz.all':
    'すべてのスケジュールは {tz} タイムゾーンを使用します',
  'models.form.scaling.duration': '継続時間',
  'models.form.scaling.durationUnit': '時間単位',
  'models.form.scaling.windowReplicas': 'ウィンドウ内のレプリカ',
  'models.form.scaling.unit.minutes': '分',
  'models.form.scaling.unit.hours': '時間',
  'models.form.scaling.unit.days': '日',
  'models.form.scaling.startCron': 'ウィンドウ開始',
  'models.form.scaling.endCron': 'ウィンドウ終了',
  'models.form.scaling.baseline': 'ベースラインレプリカ数',
  'models.form.scaling.baseline.tips':
    '現在時刻がどのウィンドウにも該当しない場合に使用されるレプリカ数です。',
  'models.form.scaling.baselineNote':
    '上記で設定した Replicas がベースラインとして使用されます。現在時刻がどのウィンドウにも該当しない場合に適用されるレプリカ数です。',
  'models.form.scaling.cron.invalid': '無効な cron 式です',
  'models.form.scaling.meaning': '概要',
  'models.form.scaling.summary.monthDays': '{days} 日',
  'models.form.scaling.freq.minute': '毎分',
  'models.form.scaling.freq.hour': '1時間に1回',
  'models.form.scaling.freq.day': '1日に1回',
  'models.form.scaling.freq.week': '週に1回',
  'models.form.scaling.freq.month': '月に1回',
  'models.form.scaling.freq.year': '年に1回',
  'models.form.scaling.next': '次のウィンドウ：',
  'models.form.scaling.current': '現在のウィンドウ：',
  'models.form.scaling.addRule': 'ルールを追加',
  'models.form.scaling.removeRule': 'ルールを削除',
  'models.form.scaling.rules.required':
    'ルールを少なくとも 1 つ追加するか、スケジュールスケーリングを無効にしてください。',
  'models.form.scaling.hint':
    '各ルールは開始時刻に指定の継続時間だけウィンドウを開き、その間はそのレプリカ数を維持します。どのウィンドウにも該当しない場合、モデルは上記のベースラインレプリカ数を使用します。ウィンドウが重なる場合は、最も遅く開始したウィンドウが優先されます。',
  'models.form.scaling.conflict':
    '競合：開始時刻が同じ（{times}）ルールのレプリカ数が異なります。同じレプリカ数にするか、開始時刻を分けてください。',
  'models.form.scaling.overlap':
    '重複：ウィンドウ（{times}）が重複しています。重複する部分では、後から始まるルールが優先されます。',
  'models.form.ramRatio': 'RAM-to-VRAM Ratio',
  'models.form.ramSize': 'Maximum RAM Size (GiB)',
  'models.form.ramRatio.tips':
    'Ratio of system RAM to GPU VRAM used for KV cache. For example, 2.0 means the cache in RAM can be twice as large as the GPU VRAM.',
  'models.form.ramSize.tips': `Maximum size of the KV cache stored in system memory (GiB). If set, this value overrides "{content}".`,
  'models.form.chunkSize.tips': 'Number of tokens per KV cache chunk.',
  'models.form.mode': 'Mode',
  'models.form.algorithm': 'Algorithm',
  'models.form.draftModel': 'Draft Model',
  'models.form.numDraftTokens': 'Number of Draft Tokens',
  'models.form.ngramMinMatchLength': 'N-gram Minimum Match Length',
  'models.form.ngramMaxMatchLength': 'N-gram Maximum Match Length',
  'models.form.mode.throughput': 'Throughput',
  'models.form.mode.latency': 'Latency',
  'models.form.mode.baseline': 'Standard',
  'models.form.mode.throughput.tips':
    'Optimized for high throughput under high request concurrency.',
  'models.form.mode.latency.tips':
    'Optimized for low latency under low request concurrency.',
  'models.form.mode.baseline.tips':
    'The most compatible option with full precision.',
  'models.form.draftModel.placeholder': 'Please select or enter a draft model',
  'models.form.draftModel.tips':
    'You can enter a local path (e.g., /path/to/model) or select a model from Hugging Face or ModelScope (e.g., Tengyunw/qwen3_8b_eagle3). The system will automatically match based on the primary model source.',
  'models.form.quantization': 'Quantization',
  'models.form.backend.custom': 'User Defined',
  'models.form.rules.name':
    'Up to 63 characters; letters, numbers, dots (.), underscores (_), and hyphens (-) only; must start and end with an alphanumeric character.',
  'models.catalog.button.explore': 'Explore More Models',
  'models.catalog.precision': 'Precision',
  'models.form.gpuPerReplica.tips': 'Enter a custom number',
  'models.form.generic_proxy': 'Enable Generic Proxy',
  'models.form.enableModelRoute': 'Enable Model Route',
  'models.form.enableModelRoute.tips': 'Enable Model Route',
  'models.form.generic_proxy.tips':
    'After enabling the generic proxy, you can access URI paths that do not follow the OpenAI API standard.',
  'models.form.generic_proxy.button': 'Generic Proxy',
  'models.accessControlModal.includeusers': 'Include Users',
  'models.table.genericProxy':
    'Use the following path prefix, and set the model name in either the <span class="bold-text">X-GPUStack-Model</span> request header or the model field in the request body. All requests under this path prefix will be forwarded to the inference backend.',
  'models.form.backendVersion.deprecated': 'Deprecated',
  'models.accessSettings.public.desc':
    'Accessible to anyone without authentication.',
  'models.accessSettings.authed.tips':
    'Accessible to all authenticated platform users.',
  'models.accessSettings.allowedUsers.tips':
    'Only designated users can access the model.',
  'models.form.backendVersions.tips': `To use more versions, go to the {link} page and edit the backend to add versions.`,
  'models.catalog.nogpus.tips':
    'No compatible GPUs are available in the selected cluster for this model.',
  'models.form.modelfile.notfound': `The model file path you specified does not exist on the GPUStack server. It's recommended to place the model file at the same path on both the GPUStack server and GPUStack workers. This helps GPUStack make better decisions.`,
  'models.form.readyWorkers': 'workers ready',
  'models.form.maxContextLength': 'Maximum Context Length',
  'models.form.backend.helperText':
    'Not enabled yet. Will be enabled after deployment. ',
  'models.table.instance.benchmark': 'Run Benchmark',
  'models.table.modelView': 'Model List',
  'models.table.instanceView': 'Instance List',
  'models.table.category': 'Category',
  'models.instance.currentRun': 'Current Run',
  'models.instance.previousRun': 'Previous Run',
  'models.instance.startHistory': 'Run History',
  'models.instance.startHistory.tips':
    'Shows logs from the run before the last error-triggered restart.',
  'models.instance.logs.downloading': 'ダウンロード中… {size}',
  'models.instance.logs.downloadingPercent': 'ダウンロード中… {percent}%',
  'models.form.lora.label': 'LoRA Adapters',
  'models.form.lora.add': 'Add LoRA Adapter',
  'models.form.lora.select': 'Select LoRA',
  'models.form.lora.name': 'LoRA name',
  'models.form.lora.rule.empty': 'Input cannot be empty',
  'models.form.lora.rule.duplicate': 'LoRA name cannot be duplicated',
  // Model catalog source configuration
  'models.catalog.source.title': 'カタログのソース',
  'models.catalog.source.official':
    'Follows the catalog GPUStack publishes, on top of the one packaged with this release.',

  // --- Prefill/decode disaggregation ---
  'models.form.pd.section': 'PD 分離設定',
  'models.form.pd.enable': '有効化',
  // Why the server derived no transport. Keyed by `PDModeUnresolvedCode`;
  // the server also sends English prose, which is rendered only when this
  // catalog has no entry for the code it sent.
  'models.form.pd.unresolved.vendor_not_in_cluster':
    'このクラスターに {vendor} アクセラレーターはありません（現在: {vendors}）。',
  'models.form.pd.unresolved.vendors_unknown':
    'クラスターのアクセラレーターがまだ判明していないため、転送方式を導出できません。',
  'models.form.pd.unresolved.no_built_in_recipe':
    '{backend} × {vendors} に対応する組み込みレシピがありません。「カスタム」を選び、接続パラメーターをご自身で指定してください。',
  'models.form.pd.unresolved.multiple_vendors':
    'このグループを収容できるアクセラレーターベンダーが複数あります（{vendors}）。PD グループはベンダーをまたげません。1 つ選んでください。',
  'models.form.pd.unresolved.no_preferred_recipe':
    '複数のレシピが該当しますが、優先指定がありません。',
  'models.form.pd.unresolved.thisEngine': 'このエンジン',
  'models.form.pd.enable.off': '無効',
  'models.form.pd.enable.on': 'PD 分離',
  'models.form.pd.enable.tips':
    'プレフィル（Prefill）とデコード（Decode）を別インスタンスに分割します。代償はネットワーク 1 ホップと KV 転送 1 回です。同時実行数が少ない、プロンプトが短い、プレフィックスキャッシュのヒット率が高い場合は、集約デプロイの方が高速なことが多いです。まずベンチマークを取ることを推奨します。',
  'models.form.pd.shape.mono': '統合デプロイ',
  'models.form.pd.shape.mono.tips':
    '1 つのインスタンスが Prefill と Decode の両方を担います。',
  'models.form.pd.shape.pd': 'PD 分離',
  'models.form.pd.shape.pd.tips':
    'Prefill と Decode を独立したロールに分割し、エンジン・パラメータ・レプリカ数をそれぞれ設定できます。',
  'models.form.pd.shape.current': '現在',
  'models.form.pd.mode': '転送方式',
  'models.form.pd.mode.holder': '転送方式を選択してください',
  'models.form.pd.mode.tips':
    '接続関連のパラメータ（connector・ポート・対向アドレス）はすべて選択したモードから導出されます。手動設定は不要です。',
  'models.form.pd.mode.custom.tips':
    'カスタムモードでは接続パラメータを一切注入しません。--kv-transfer-config、ポート、対向アドレスを自身で指定してください。',
  'models.form.pd.mode.backend.mismatch':
    '{targets} が必要ですが、現在のエンジンは {backend} です。ロール間でエンジンを混在させる場合は「カスタム」モードを選択してください。',
  'models.form.pd.mode.runtime.mismatch':
    '{runtime} アクセラレータが必要ですが、{scope, select, partition{選択したパーティション} other{このクラスター}}は {vendors} のみです。',
  'models.form.pd.mode.only.custom':
    '現在のエンジンとアクセラレータの組み合わせに対応する組み込みレシピはありません。「カスタム」モードは利用可能です：コネクタ、ポート、ハンドシェイク変数はご自身で指定してください。',
  'models.form.pd.vendor': 'アクセラレータのベンダー',
  'models.form.pd.vendor.tips':
    'このクラスターには複数ベンダーのアクセラレータがあり、PD グループはベンダーをまたげません（KV 転送経路が異なるため）。デプロイ先のパーティションを選択してください。',
  'models.form.pd.replicas.moved':
    'PD デプロイのレプリカ数は各ロールで個別に設定します。',
  'models.form.pd.disabled.gguf':
    'PD 分離は vLLM / SGLang エンジンのみ対応しています。現在のモデルは GGUF 形式です。',
  'models.form.pd.disabled.backend':
    'PD 分離は vLLM / SGLang エンジンのみ対応です。他のエンジンは「カスタム」モードで利用できます。',
  'models.form.pd.disabled.schedule':
    'PD デプロイは定時スケーリングに未対応です。各ロールのレプリカ数で調整してください。',
  'models.form.pd.cache.cleared':
    'PD デプロイでは KV キャッシュをロール単位で設定します。モデルレベルの設定はクリアされました。必要なロールで個別に選択してください。',
  'models.form.roles': 'ロール設定',
  'models.form.roles.prefill': 'Prefill',
  'models.form.roles.decode': 'Decode',
  'models.form.roles.router': 'Router',
  'models.form.roles.override': 'カスタム',
  'models.form.roles.inherited': '継承',
  'models.form.roles.group.backend': 'エンジンとイメージ',
  'models.form.roles.group.parameters': 'エンジンパラメータと環境変数',
  'models.form.roles.group.scheduling': 'リソースとスケジューリング',
  'models.form.roles.group.backend.tips':
    '変更しなければモデルのエンジンとイメージに従います。',
  'models.form.roles.group.scheduling.tips':
    '変更しなければ、上で設定したトポロジ親和性に従ってスケジューラが配置先のカードを決めます。',
  'models.form.roles.group.cache': '共有 KV キャッシュ',
  'models.form.roles.group.settings': 'グループ設定',
  'models.form.roles.group.settings.tips': 'すべてのロールに適用',
  'models.form.roles.replicas': 'レプリカ数',
  'models.form.roles.router.routeArgs': 'ルーティング引数',
  'models.form.roles.router.routeArgs.tips':
    'Router プロセスの起動コマンドライン引数です。鍵付きはグループの配置先から GPUStack が生成するもので、編集できません。',
  'models.form.roles.router.locality':
    'CPU のみ。このグループの Prefill / Decode になるべく近い Worker にシステムが自動配置します',
  'models.form.roles.router.workerAllocation': 'Worker 割り当て',
  'models.form.roles.router.workerSelect': 'Worker セレクター',
  'models.form.roles.router.scheduletype.tips':
    '自動：セレクターを満たすマシンのうち、このグループの Prefill / Decode が動いているものを優先します。手動：Worker を直接指定します。',
  'models.form.roles.router.workerSelector.tips':
    'ラベルで候補を絞り込みます。一致したマシンの中では、引き続きこのグループの Prefill / Decode に最も近いものが優先されます。',
  'models.form.roles.router.order.tips':
    'Router は Prefill と Decode が準備できた後に作成されます。',
  'models.form.roles.router.custom.forced':
    'カスタム PD モードでは Router を導出しません。イメージと起動コマンドを指定してください。',
  'models.form.roles.router.peers':
    'デプロイ後にシステムが Prefill / Decode インスタンスのアドレスを注入します。',
  'models.form.roles.cache.holder': '使用しない',
  'models.form.roles.cache.tips':
    '接続方式と優先順位はシステムが導出します。設定は不要です。',
  'models.form.roles.cache.custom.conflict':
    'カスタム PD モードではエンジンパラメータで --kv-transfer-config を指定するため、キャッシュサービスは同時に選択できません。',
  'models.form.roles.cache.param.conflict':
    '選択した PD モードと競合します。「カスタム」PD モードに切り替えるか、このパラメータを削除してください。',
  'models.state.pending': '待機中',
  'models.state.partial': '一部準備完了',
  'models.state.running': '実行中',
  'models.state.error': 'エラー',
  'models.form.speculativeDecoding': '投機的デコーディング',
  'models.pd.tag': 'PD',
  'models.pd.roles.detail': 'ロール別の状態',
  'models.pd.degraded.cache':
    '一部のメンバーが共有 KV キャッシュなしで稼働しています。理由はインスタンスを開いて確認してください。',
  'models.pd.degraded.ratio':
    '準備完了のメンバー数が要求より少なく、能力を下げて稼働しています。',
  'models.form.roles.override.empty':
    'このグループには値が一つもないため、「モデルレベルの設定を継承」として保存されます。カスタムのままにするには、少なくとも一項目を入力してください。',
  'models.form.pd.mode.cleared':
    'PD 分離を無効にしたときに PD モードがクリアされました。もう一度選択してください。',
  'models.form.pd.engineVersion.below':
    '選択した PD レシピが対応を宣言しているエンジンバージョンは {range} ですが、このデプロイは {version} を固定しています。デプロイ自体は可能です（自前ビルドのイメージは独自のバージョン番号を持つことがあります）。ただし本当に下限を下回っている場合、縮退したメンバーの登録解除など、レシピが前提とする動作が欠けている可能性があります。',
  'models.pd.degraded.pairing':
    'prefill メンバーと同じホストに乗っている decode メンバーが 1 つもないため、KV 転送は毎回ネットワークを経由します。RDMA のないリンクでは、これは分離しない場合よりも遅くなるのが普通です。少なくとも 1 組を同一ホストに配置するか、両方のロールで同じホスト上の GPU を選んでください。',
  'models.pd.degraded.gather':
    'トポロジー目標未達：メンバーが要求より離れて配置されています',
  'models.pd.degraded.scaleOut':
    'このグループは厳格な設定により単一のトポロジードメインに固定されており、追加を求められたメンバーがまだ配置されていません。すでに稼働中のメンバーは通常どおりサービスを続けています —— 止まっているのはスケールアウトです。何に阻まれているかは、そのメンバーの状態メッセージに示されます。そこから、ドメイン内の空きを確保する、トポロジー制約を緩やかな設定に切り替える、レプリカ数を元に戻す、のいずれかを行ってください。',
  'models.pd.degraded.engineVersion':
    '固定されているエンジンバージョンが、選択した PD レシピが対応を宣言する範囲を下回っています。これは許容されます —— 自前でビルドしたイメージが独自のバージョン番号を持つことがあります —— が、レシピが前提とする動作が存在しない可能性があります。たとえば SGLang 0.5.7 未満では、縮退で外されたメンバーを登録解除できず、トラフィックを受け取り続けます。',
  'models.pd.degraded.ineffective':
    'グループは稼働していますが KV 転送が発生していません —— 分離が暗黙のうちに集約推論に退化しています。ペアリングと KV コネクタ設定を確認してください。',
  'models.pd.degraded.pairingUnverified':
    'ペアリング要素が一方のロールだけで明示され、もう一方はエンジンの既定値に委ねられているため、両者が一致するか検証できませんでした —— 典型的には --max-model-len、--block-size、--kv-cache-layout、または片側が auto でもう片側が具体的な dtype の場合です。ペアリングが誤っているという意味ではなく、検証されていないという意味です。両方のロールに明記すると検証されます。',
  'models.pd.degraded.pairingTP':
    'メンバーが実際に取得したカードから再計算した実効テンソル並列度が、この PD レシピの宣言する方向に反しています：NIXL は decode が prefill 以上、Ascend Mooncake は prefill が decode 以上である必要があります。カードを固定せず --tensor-parallel-size も書かないロールは配置されるまで検査できる数値を持たないため、受け入れ時には検出できません。両方のロールに --tensor-parallel-size を設定するか、レシピが許す枚数を割り当ててください。',
  'models.pd.admission.infeasible':
    '利用可能な容量ではこのグループを収容できません（必要 {required}、利用可能 {available}）。レプリカ数を減らす、分割カード種別に変える、ノードを追加してください。',
  'models.pd.ratio.waiting':
    '配分 {configured}（現在 {current}、{role} を待機中）',
  'models.instance.draining.tips':
    'スケールインされました。新しいリクエストは受け付けず、KV キャッシュを取得中の decode が完了するまで稼働を続けたあと削除されます。',
  'models.pd.group.restarting.brief': '再起動中…',
  'models.pd.group.restarting.progress':
    'グループを再起動中：メンバーは意図的に停止され、再作成されています（現在 {ready}/{total} が準備完了）。レプリカ数が少なく見えるのはそのためで、障害が起きたからではありません。',
  'models.pd.group.restart.confirm':
    'この変更には PD グループ全体の再起動が必要です：まず {total} 個すべてのインスタンスを停止し、新しい設定で再作成します。その間モデルは利用できません。',
  'models.pd.instance.stale':
    'このインスタンスは古い設定で稼働しています。グループ全体を再起動すると反映されます。',
  'models.pd.stale':
    '設定が変更されました。デプロイを再起動すると反映されます。',
  'models.restart': '再起動',
  'models.restart.inflight': '再起動中…',
  'models.restart.confirm':
    '{name} のすべてのインスタンスを停止し、現在の設定で再構築します。その間、このモデルは利用できません。',
  'models.restart.done':
    '再起動中：インスタンスを停止しました。現在の設定で再構築されます。',
  'models.restart.uptodate':
    '再起動するものがありません: このデプロイには実行中のインスタンスがありません。',
  'models.restart.inprogress':
    '再起動がすでに進行中です。完了してからもう一度お試しください。',
  'models.restart.failed': 'モデルの再起動に失敗しました。',
  'models.stale.tag': '要再起動',
  'models.pd.group.id': 'グループ',
  'models.form.pd.disabled.gpus':
    'PD 分離には少なくとも 2 枚の利用可能な GPU（Prefill 1 枚 + Decode 1 枚）が必要です。現在のクラスターの利用可能数は {count} 枚です。',
  'models.pd.ratio': '配分',
  'models.form.roles.router.entrypoint': '実行コマンド',
  'models.form.roles.router.connectionArgs':
    '接続パラメータ（GPUStack が注入）',
  'models.form.roles.managed': 'システム管理',
  'models.form.roles.managed.tips':
    'PD モードとグループのスケジュール先から GPUStack が自動生成します。読み取り専用で、同じ内容を再度指定する必要はありません。二重波括弧の値はプレースホルダーで、デプロイ時に実際のアドレス・ポート・NIC に置き換わります。',
  'models.form.roles.managed.mounts': 'ホストマウント',
  'models.form.roles.managed.locked':
    '鍵付きはシステムが注入する項目で、編集できません',
  'models.form.roles.engine': 'エンジン',
  'models.form.roles.scheduling.managed':
    '上で設定したトポロジ親和性に従ってシステムが自動的に配置します。ノード制約は追加されません',
  'models.form.roles.managed.params.tips':
    'このロールのエンジンに渡される引数です。鍵付きは PD モードに基づいて GPUStack が注入し、自分で追加したものはその後ろに続きます。',
  'models.form.roles.managed.env.tips':
    'このロールのコンテナに設定される環境変数です。鍵付きは GPUStack が注入するもので、多くは制御プレーンのアドレスと NIC です。',
  'models.form.roles.managed.mounts.tips':
    'ホストからコンテナにバインドマウントされるパスです。追加できるのは GPUStack だけです。転送方式が読む必要のあるホストファイルで、アクセラレータランタイムは自動では取り込みません。',
  'models.form.roles.resources': 'リソース',
  'models.form.roles.resources.cpu': 'CPU（コア）',
  'models.form.roles.resources.memory': 'メモリ（GiB）',
  'models.form.roles.resources.tips':
    'Router コンテナが要求するリソース。デフォルトは 2 コア 2 GiB。',
  'models.form.roles.router.health': 'ヘルスチェック',
  'models.form.roles.router.peerslabel': '対向',
  'models.form.roles.router.image.tips':
    '空欄の場合は選択した PD モードから導出されたイメージを使用します。そのイメージに router の実行ファイルが含まれていない場合にのみ指定してください。起動コマンドは引き続き自動導出されます。',
  'models.form.roles.cpuonly': 'CPU のみ',

  'models.form.gather.title': 'トポロジー親和性',
  'models.form.gather.target.auto': '自動',
  'models.form.gather.target.auto.tips': '収まる範囲で最速の転送経路',
  'models.form.gather.target.host': '同一 Worker',
  'models.form.gather.target.host.tips': 'Prefill / Decode が同一 Worker',
  'models.form.gather.target.layer': '同一{layer}',
  'models.form.gather.target.tips':
    'このグループのメンバー間に求める転送品質。同一アクセラレータドメイン内の転送はラック内より高速なため、ラックをまたぐドメインも条件を満たすとみなします。Router はアクセラレータを占有しないため、この制約の対象外です。',
  'models.form.gather.unmet': '収まらない場合',
  'models.form.gather.unmet.prefer': 'そのままデプロイ',
  'models.form.gather.unmet.prefer.tips':
    '次善の配置に後退し、モデルに「トポロジー目標未達」を表示します',
  'models.form.gather.unmet.must': 'デプロイしない',
  'models.form.gather.unmet.must.tips': '遅いデプロイを返すくらいなら',
  'models.form.gather.fits': '収まります',
  'models.form.gather.fits.domain': '{domain} に収まります',
  'models.form.gather.short':
    '最も余裕のある {domain} でも {needed} のうち {available} しか収まりません',
  'models.form.gather.noRoom': 'この階層には収まる場所がありません',
  'models.form.gather.unknown':
    '{count} 台の worker で容量を読み取れないため、この階層は判定できません',
  'models.form.gather.declare':
    'クラスターの「トポロジー」でラックを入力すると、より粗いレベルを選べます。',
  'models.form.gather.largeGroup':
    'この規模では、トポロジーに関係なく少なくとも約 {percent}% のリクエストが同一ホスト上でペアになります。これはレプリカ数から導かれる下限であり、実際の割合はグループが最終的に何台のマシンに広がるかで決まります（デプロイ後にグループサマリーで確認できます）。KV 転送の局所性を重視するなら、より小さい分離グループを複数に分けることを検討してください。',
  'models.form.gather.spanning':
    '{role} は {gpus} 基の GPU を必要とし、このクラスターで最も広いマシンでも {widest} 基です。そのため各メンバーがマシンを丸ごと占有し、Prefill と Decode が同じマシンを共有することはなく、同一ホストでのペアリングは 0 になります。KV は必ずマシンをまたぐので、重要なのは上位のどの階層がそれを内側に収めるかです。',
  'models.form.gather.checking': '収まる階層を確認しています…',
  'models.form.gather.unavailable':
    '現在どの階層に収まるかを確認できないため、デフォルトのみを表示しています。',
  'models.form.gather.retry': '再試行',
  'models.form.groupSettings': 'グループ設定',
  'models.form.groupSettings.tips':
    'これらはロールごとに変えられません: 一つの値が Prefill と Decode の両方に適用されます。',
  // Topology-aware gather tiers. One chain, root to leaf: the option list is
  // flat in chain order and the retreat line says what happens when a rung
  // does not fit. The `chain.*` group headings are gone with the second chain.
  'models.form.gather.goFill': '入力する',
  'models.form.gather.infeasible.warning':
    '現在の容量ではこのグループは配置できません。保存すると空きが出るまで待機します。選択肢：「できるだけ近く」に変更（ホストをまたぎ、KV 転送が遅くなる）· レプリカ数またはレプリカあたりの GPU 数を減らす'
};
