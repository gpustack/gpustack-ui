export default {
  'models.button.deploy': 'モデルをデプロイ',
  'models.title': 'モデル',
  'models.title.edit': 'モデルを編集',
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
  'models.form.partialoffload.tips':
    'CPUオフロードが有効な場合、GPUリソースが不足するとモデルの一部のレイヤーがCPUにオフロードされます。GPUが利用できない場合は、完全なCPU推論が使用されます。',
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
  'models.form.scheduletype.manual': 'GPUを指定',
  'models.form.scheduletype.gpuType': 'GPUタイプを指定',
  'models.form.scheduletype.auto.tips':
    '現在のリソース状況に基づいて、モデルインスタンスを適切なGPUに自動的にデプロイします。',
  'models.form.scheduletype.manual.tips':
    'モデルインスタンスをデプロイするGPUを手動で指定できます。',
  'models.form.manual.schedule': '手動スケジュール',
  'models.table.gpuindex': 'GPUインデックス',
  'models.table.backend': 'バックエンド',
  'models.table.acrossworker': 'ワーカー間で分散',
  'models.table.cpuoffload': 'CPUオフロード',
  'models.table.layers': 'レイヤー',
  'models.form.backend': 'バックエンド',
  'models.form.backend_parameters': 'バックエンドパラメータ',
  'models.search.gguf.tips':
    'GGUFモデルはllama-boxを使用します（Linux、macOS、Windowsをサポート）。',
  'models.search.vllm.tips':
    '非GGUFモデルは、音声にはvox-boxを、その他にはvLLM（x86 Linuxのみ）を使用します。',
  'models.search.voxbox.tips':
    '音声モデルをデプロイするには、GGUFチェックボックスをオフにしてください。',
  'models.form.ollamalink':
    '<a href="https://www.ollama.com/library" target="_blank">Ollamaライブラリ</a>でさらに探す',
  'models.form.backend_parameters.llamabox.placeholder':
    '例: --ctx-size=8192（=で名前と値を分ける）',
  'models.form.backend_parameters.vllm.placeholder':
    '例: --max-model-len=8192（=で名前と値を分ける）',
  'models.form.backend_parameters.sglang.placeholder':
    '例: --max-total-tokens=8192（=で名前と値を分ける）',
  'models.form.backend_parameters.vllm.tips': '詳細な{backend}パラメータ情報',
  'models.logs.pagination.prev': '前の{lines}行',
  'models.logs.pagination.next': '次の{lines}行',
  'models.logs.pagination.last': '最終ページ',
  'models.logs.pagination.first': '最初のページ',
  'models.form.localPath': 'ローカルパス',
  'models.form.filePath': 'モデルパス',
  'models.form.backendVersion': 'バックエンドバージョン',
  'models.form.backendVersion.tips':
    '希望する{backend}{version}バージョンを使用するには、システムがオンライン環境で対応するバージョンをインストールする仮想環境を自動的に作成します。GPUStackのアップグレード後もバックエンドバージョンは固定されます。{link}',
  'models.form.gpuselector': 'GPUセレクター',
  'models.form.backend.llamabox':
    'GGUF形式のモデル用（Linux、macOS、Windowsをサポート）。',
  'models.form.backend.vllm': 'Linux のみ対応。',
  'models.form.backend.voxbox': 'NVIDIA GPUおよびCPUのみ対応。',
  'models.form.backend.mindie': 'Ascend 910Bおよび310Pのみ対応。',
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
  'models.form.backend.warning':
    'GGUF形式のモデルのバックエンドはllama-boxを使用します。',
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
  'models.form.restart.onerror': 'エラー時に自動再起動',
  'models.form.restart.onerror.tips':
    'エラーが発生した場合、自動的に再起動を試みます。',
  'models.form.check.params': '設定を確認中...',
  'models.form.check.passed': '互換性チェックに合格しました',
  'models.form.check.claims':
    'このモデルには約{vram}のVRAMと{ram}のメモリが必要です。',
  'models.form.check.claims2': 'このモデルには約{vram}のVRAMが必要です。',
  'models.form.check.claims3': 'このモデルには約{ram}のメモリが必要です。',
  'models.form.update.tips':
    '変更はインスタンスを削除して再作成した後にのみ適用されます。',
  'models.table.download.progress': 'ダウンロード進行状況',
  'models.table.button.apiAccessInfo': 'APIアクセス情報',
  'models.table.button.apiAccessInfo.tips':
    'このモデルをサードパーティアプリケーションと統合するには、以下の詳細を使用してください: アクセスURL、モデル名、APIキー。これらの資格情報は、モデルサービスの適切な接続と使用を確保するために必要です。',
  'models.table.apiAccessInfo.endpoint': 'アクセスURL',
  'models.table.apiAccessInfo.modelName': 'モデル名',
  'models.table.apiAccessInfo.apikey': 'APIキー',
  'models.table.apiAccessInfo.openaiCompatible': 'OpenAI互換',
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
  'models.table.filterByName': 'Filter by username',
  'models.table.admin': 'Admin',
  'models.table.noselected': 'No users selected',
  'models.table.users.all': 'All Users',
  'models.table.users.selected': 'Selected Users',
  'models.table.nouserFound': 'No users found',
  'models.form.performance': 'Performance',
  'models.form.gpus.notfound': 'No GPUs found',
  'models.form.extendedkvcache': 'Enable Extended KV Cache',
  'models.form.chunkSize': 'Size Of Cache Chunks',
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
    'System calculates GPUs per replica automatically.',
  'models.form.gpusAllocationType.custom.tips':
    'You can specify the exact number of GPUs per replica.',
  'models.mymodels.status.inactive': 'Stopped',
  'models.mymodels.status.degrade': 'Abnormal',
  'models.mymodels.status.active': 'Active',
  'models.form.kvCache.tips':
    'Available only with built-in backends (vLLM / SGLang) — switch backend in <span class="bold-text">Advanced</span> to enable.',
  'models.form.kvCache.tips2':
    'Extended KV cache is only supported when using built-in inference backends (vLLM or SGLang).',
  'models.form.scheduling': 'Scheduling',
  'models.form.ramRatio': 'RAM-to-VRAM Ratio',
  'models.form.ramSize': 'Maximum RAM Size (GiB)',
  'models.form.ramRatio.tips':
    'Ratio of system RAM to GPU VRAM used for KV cache. For example, 2.0 means the cache in RAM can be twice as large as the GPU VRAM.',
  'models.form.ramSize.tips': `Maximum size of the KV cache stored in system memory (GiB). If set, this value overrides "{content}".`,
  'models.form.chunkSize.tips': 'Number of tokens per KV cache chunk.',
  'models.form.flavor.throughput.tips':
    'optimized for high throughput under high request concurrency.',
  'models.form.flavor.latency.tips':
    'optimized for low latency under low request concurrency.',
  'models.form.flavor.reference.tips':
    'the most compatible option with full precision.'
};

// ========== To-Do: Translate Keys (Remove After Translation) ==========
// 1. 'models.ollama.deprecated.title': 'Deprecation Notice',
// 2. 'models.ollama.deprecated.notice': `The Ollama model source has been deprecated as of v0.6.1. For more information, see the <a href="https://github.com/gpustack/gpustack/issues/1979" target="_blank">related GitHub issue</a>.`
// 3.  'models.backend.mindie.310p':'Ascend 310P only supports FP16, so you need to set --dtype=float16.',
// 4.  'models.form.check.clusterUnavailable': 'Current cluster is unavailable',
// 5. 'models.form.check.otherClustersAvailable': 'Available clusters: {clusters}. Please switch cluster.',
// 6. 'models.button.accessSettings': 'Access Settings',
// 7. 'models.table.accessScope': 'Access Scope',
// 8. 'models.table.accessScope.all': 'All users',
// 10. 'models.table.userSelection': 'User Selection',
// 11. 'models.table.filterByName': 'Filter by username',
// 12. 'models.table.admin': 'Admin',
// 13. 'models.table.noselected': 'No users selected'
// 14. 'models.table.uses.all': 'All users',
// 15. 'models.table.uses.selected': 'Selected users',
// 16. 'models.table.nouserFound': 'No users found',
// 17. 'models.table.users.all': 'All Users',
// 18. 'models.table.users.selected': 'Selected Users',
// 19. 'models.table.nouserFound': 'No users found',
// 20. 'models.form.performance': 'Performance',
// 21. 'models.form.gpus.notfound': 'No GPUs found',
// 22. 'models.form.extendedkvcache': 'Enable Extended KV Cache',
// 23. 'models.form.chunkSize': 'Size Of Cache Chunks',
// 24. 'models.form.maxCPUSize': 'Maximum CPU Cache Size (GiB)',
// 25. 'models.form.remoteURL': 'Remote Storage URL',
// 26. 'models.form.runCommandPlaceholder': 'e.g., vllm serve Qwen/Qwen2.5-1.5B-Instruct',
// 27. 'models.accessSettings.public': 'Public',
// 28. 'models.accessSettings.authed': 'Authenticated',
// 29. 'models.accessSettings.allowedUsers': 'Allowed users',
// 30. 'models.accessSettings.public.tips': 'When set to public, anyone can access this model without authentication, which may lead to data exposure risks.',
// 31. 'models.table.button.deploy': 'Deploy Now',
// 32. 'models.form.backendVersion.holder': 'Enter or select a version',
// 33.  'models.form.gpusperreplica': 'GPUs per Replica',
// 34.  'models.form.gpusAllocationType': 'GPU Allocation Type',
// 35.  'models.form.gpusAllocationType.auto': 'Auto',
// 36.  'models.form.gpusAllocationType.custom': 'Custom',
// 37.  'models.form.gpusAllocationType.auto.tips': 'System calculates GPUs per replica automatically.',
// 38.  'models.form.gpusAllocationType.custom.tips': 'You can specify the exact number of GPUs per replica.',
// 39.  'models.mymodels.status.inactive': 'Stopped',
// 41.  'models.mymodels.status.degrade': 'Abnormal',
// 42.  'models.mymodels.status.active': 'Active'
// 43. 'models.form.remoteURL.tips': 'Refer to the <a href="https://docs.lmcache.ai/api_reference/configurations.html" target="_blank">configuration documentation</a> for details.',
// 44. 'models.form.kvCache.tips': 'Available only with built-in backends (vLLM / SGLang) — switch backend in <span class="bold-text">Advanced</span> to enable.'
// 45. 'models.form.kvCache.tips2': 'Extended KV cache is only supported when using built-in inference backends (vLLM or SGLang).',
// 46. 'models.form.scheduling': 'Scheduling',
// 47. 'models.form.ramRatio': 'RAM-to-VRAM Ratio',
// 48. 'models.form.ramSize': 'Maximum RAM Size (GiB)',
// 49. 'models.form.ramRatio.tips': 'Ratio of system RAM to GPU VRAM used for KV cache. For example, 2.0 means the cache in RAM can be twice as large as the GPU VRAM.',
// 50. 'models.form.ramSize.tips': `Maximum size of the KV cache stored in system memory (GiB). If set, this value overrides "{content}".`,
// 51. 'models.form.chunkSize.tips': 'Number of tokens per KV cache chunk.'
// ========== End of To-Do List ==========
