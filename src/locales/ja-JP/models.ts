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
    'CPUオフロードを有効にすると、GPUStackは可能な限り多くのレイヤーをGPUにロードしてパフォーマンスを最大化します。GPUリソースが制限されている場合、一部のレイヤーがCPUにオフロードされ、GPUが利用できない場合は完全にCPU推論が使用されます。',
  'models.form.distribution.tips':
    '単一のGPUまたはワーカーのリソースが不足している場合、計算の一部を単一または複数のリモートワーカーにオフロードすることを許可します。',
  'models.openinplayground': 'プレイグラウンドで開く',
  'models.instances': 'インスタンス',
  'models.table.replicas.edit': 'レプリカを編集',
  'model.form.ollama.model': 'Ollamaモデル',
  'model.form.ollamaholder': 'モデル名を選択または入力してください',
  'model.deploy.sort': '並び替え',
  'model.deploy.search.placeholder': '{source}からモデルを検索',
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
  'models.form.scheduletype.auto.tips':
    '現在のリソース状況に基づいて、モデルインスタンスを適切なGPU/ワーカーに自動的にデプロイします。',
  'models.form.scheduletype.manual.tips':
    'モデルインスタンスをデプロイするGPU/ワーカーを手動で指定できます。',
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
  'models.form.ollamalink': 'Ollamaライブラリでさらに探す',
  'models.form.backend_parameters.llamabox.placeholder': '例: --ctx-size=8192',
  'models.form.backend_parameters.vllm.placeholder': '例: --max-model-len=8192',
  'models.form.backend_parameters.vllm.tips': '詳細な{backend}パラメータ情報',
  'models.logs.pagination.prev': '前の{lines}行',
  'models.logs.pagination.next': '次の{lines}行',
  'models.logs.pagination.last': '最終ページ',
  'models.logs.pagination.first': '最初のページ',
  'models.form.localPath': 'ローカルパス',
  'models.form.filePath': 'モデルパス',
  'models.form.backendVersion': 'バックエンドバージョン',
  'models.form.backendVersion.tips':
    '希望する{backend}バージョンを使用するには、システムがオンライン環境で対応するバージョンをインストールする仮想環境を自動的に作成します。GPUStackのアップグレード後もバックエンドバージョンは固定されます。{link}',
  'models.form.gpuselector': 'GPUセレクター',
  'models.form.backend.llamabox':
    'GGUF形式のモデル用（Linux、macOS、Windowsをサポート）。',
  'models.form.backend.vllm':
    '非GGUF形式のモデル用（x86 Linuxのみをサポート）。',
  'models.form.backend.voxbox': '非GGUF形式の音声モデル用。',
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
    'config.jsonファイルを含む.safetensorsディレクトリを指定してください。例: /data/models/model/。',
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
  'models.form.files': 'files',
  'models.table.status': 'Status'
};

// ========== To-Do: Translate Keys (Remove After Translation) ==========
//  1. 'models.form.files',
//  2. 'models.table.status'
// ========== End of To-Do List ==========
