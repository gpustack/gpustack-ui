export default {
  'providers.title': 'プロバイダー',
  'providers.button.add': 'プロバイダーを追加',
  'providers.button.clone': 'プロバイダーを複製',
  'providers.table.providerName': 'プロバイダー',
  'providers.table.models': 'モデル',
  'providers.table.proxy': 'プロキシ',
  'providers.form.tokens.title': 'API キー',
  'providers.form.tokens.add': 'API キーを追加',
  'providers.form.models.add': 'モデルを追加',
  'providers.form.proxy.enable': 'プロキシを有効化',
  'providers.form.proxy.url': 'プロキシ URL',
  'providers.form.proxy.timeout': 'プロキシのタイムアウト（秒）',
  'providers.form.customConfig': 'カスタム設定',
  'providers.form.model.test': 'テスト',
  'providers.form.model.test.tips': '接続テスト（LLM のみ）',
  'providers.form.target.placeholder': 'provider/models',
  'providers.form.fallback.token': 'フォールバック用 API キー',
  'providers.form.custombeckendUrl': 'カスタムベース URL',
  'providers.form.claudeCustomUrl': 'カスタム API URL',
  'providers.form.claudeCustomUrl.tips':
    '設定すると、このプロバイダーは Anthropic プロトコル（/v1/messages）のみを提供し、OpenAI 形式のリクエストは変換されません。空欄にすると、OpenAI プロトコル経由で api.anthropic.com を使用します。',
  'providers.form.qwenDomain': 'カスタムドメイン',
  'providers.form.qwenDomain.tips':
    '任意。ドメインは Alibaba Cloud コンソールの DashScope（百炼）ワークスペースで確認できます（例: maas.aliyuncs.com）。互換モードの画像生成 API は既定ドメイン dashscope.aliyuncs.com では提供されず、画像モデルにはワークスペースドメインが必要です。',
  'providers.form.qwenDomain.imageNotice':
    '画像モデルが選択されています: 互換モードの画像生成 API は既定ドメイン dashscope.aliyuncs.com では提供されません。上の「カスタムドメイン」を DashScope ワークスペースドメインに設定しないと、画像リクエストは 404 になります。',
  'providers.form.more': 'ほか {count} 件',
  'providers.form.addAll': 'すべて追加',
  'providers.form.rules.models': 'モデルを 1 つ以上選択してください',
  'providers.form.rules.tokens': '有効な API キーを入力してください',
  'providers.form.rules.model': 'モデルを選択してください',
  'providers.form.rules.absoluteHttpUrl':
    'http(s) の絶対 URL を入力してください。ポートがある場合は含めてください。例: https://gateway.example.com:8080',
  'providers.form.rules.openaiCustomUrl':
    'パスを含む http(s) の絶対 URL を入力してください。例: https://gateway.example.com:8080/v1',
  'providers.form.rules.claudeCustomUrl.credentials':
    'URL に認証情報を含めることはできません。各リクエストの Host ヘッダーとして送信されてしまいます。代わりに、エンドポイントのキーをプロバイダーの API キーに設定してください。',
  'providers.form.rules.claudeCustomUrl.query':
    'URL にはオリジンと任意のパスプレフィックスのみを指定できます。クエリやフラグメントは破棄されます。',
  'providers.form.rules.qwenDomain':
    'ドメインのみを入力してください（443 以外のポートの場合はポートを含む）。例: maas.aliyuncs.com または my-gateway.example.com:8443',
  'providers.form.model.duplicate': '同じモデルがすでに存在します',
  'providers.table.registerRoute': 'ルートを登録',
  'providers.form.azureServiceUrl': 'Azure OpenAI Service の URL',
  'providers.form.ollamaServerHost': 'Ollama サーバーのホスト',
  'providers.form.ollamaServerPort': 'Ollama サーバーのポート',
  'providers.form.hunyuanAuthId': 'Hunyuan 認証 ID',
  'providers.form.hunyuanAuthKey': 'Hunyuan 認証キー',
  'providers.form.cloudflareAccountId': 'Cloudflare アカウント ID',
  'providers.form.targetLang': '翻訳先の言語',
  'providers.form.modelVersion': 'モデルのバージョン',
  'providers.form.tritonDomain': 'Triton Server のドメイン',
  'providers.form.modelVersion.tips':
    'Triton Server で使用するモデルのバージョンを指定します。',
  'providers.form.tritonDomain.tips':
    'Triton Server のデプロイにリクエストを送信するためのドメインです。',
  'providers.form.awsRegion': 'AWS リージョン',
  'providers.form.systemoneEndpoint': 'カスタムベース URL',
  'providers.form.systemoneEndpoint.tips':
    '任意。Jev 互換意思決定サービスのカスタムベース URL。パス接尾辞は不要です(例: http://jev.example.com:8010)。空欄の場合は TypeSafe マネージドサービス https://api.typesafe.ai を使用します。',
  'providers.form.decision': '意思決定',
  'providers.form.decisionTest.tips':
    '意思決定サービスへ 1 回の意思決定呼び出しを行います(アドレス・Token・意思決定パスを同時に検証)。'
};
