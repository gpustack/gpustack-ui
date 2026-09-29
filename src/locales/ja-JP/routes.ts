export default {
  'routes.title': 'Routes',
  'routes.button.add': 'Add Route',
  'routes.table.routeTargets': 'Route Targets',
  'routes.table.traffic': 'Traffic Share',
  'routes.table.setAsFallback': 'Set as Fallback',
  'routes.form.target.title': 'Route Targets',
  'routes.form.target.add': 'Add Route Target',
  'routes.form.target.advanced': '詳細',
  'routes.form.target.fallback': 'Fallback Route Target',
  'routes.form.target.weight': '重み',
  'routes.form.target.remove': '削除',
  'routes.form.target.model': 'Model',
  'routes.form.metadata.title': 'Metadata',
  'routes.form.metadata.add': 'Add Metadata',
  'routes.table.label.fallback': 'Fallback',
  'routes.form.metadata.size': 'Size',
  'routes.form.metadata.activeSize': 'Active Size',
  'routes.form.metadata.tags': 'Tags',
  'routes.form.metadata.maxTokens': 'Max Tokens',
  'routes.form.metadata.dimension': 'Dimensions',
  'routes.form.metadata.license': 'Licenses',
  'routes.form.metadata.releaseDate': 'Release Date',
  'routes.form.metadata.languages': 'Languages',
  'routes.form.metadata.icons': 'Icon',
  'routes.form.metadata.uploadIcon': 'Upload Icon',
  'routes.form.fallback.warning':
    'Changes to fallback route target take effect after one minute.',
  'routes.form.weight.tips': 'Target traffic weight.',
  'routes.lb.routeBy': 'ルーティング方式',
  'routes.table.lbMode': 'ルーティング方式',
  'routes.lb.mode.weighted': 'ターゲット重み',
  'routes.lb.mode.policy': 'ポリシー',
  'routes.lb.form.mode.weighted': 'ターゲット重み',
  'routes.lb.form.mode.policy': 'ポリシー',
  'routes.lb.form.mode.weighted.tips':
    '重みに応じてターゲット間でトラフィックを分割します。すべてのターゲットの重みは 0 超である必要があります。',
  'routes.lb.form.mode.policy.tips':
    '有効なポリシープラグインがターゲットを選択します(ポリシー)。有効なプラグインがない場合はラウンドロビンになります。',
  'routes.lb.mode.invalid': '無効',
  'routes.lb.mode.invalid.tooltip':
    '重みが混在しています。このルートは利用できません — ゲートウェイはこのルートを提供しません。すべてのターゲットの重みを 0 超にするか、すべて 0 にしてください。',
  'routes.lb.sessionAffinity': 'セッションアフィニティ',
  'routes.lb.sessionAffinity.tips':
    '同じセッションのリクエストを同じターゲットにルーティングします。セッションは順序付きキーチェーン(Header または Body キー)で識別されます。',
  'routes.lb.sessionKeys': 'セッションキー(順序あり、先頭一致)',
  'routes.lb.sessionKeys.source.header': 'Header',
  'routes.lb.sessionKeys.source.bodyKey': 'Body キー',
  'routes.lb.sessionKeys.keyPlaceholder': 'キー名(例: session-id)',
  'routes.lb.sessionKeys.add': 'セッションキーを追加',
  'routes.lb.sessionKeys.required':
    'セッションアフィニティを有効にする場合は少なくとも 1 つのセッションキーが必要です',
  'routes.lb.sessionKeys.keyRequired': 'キー名を入力してください',
  'routes.lb.leastLoad': '最小インフライトリクエスト',
  'routes.lb.leastLoad.tips':
    '各ターゲットのインフライトリクエスト数に基づいてスコアリングし、最も少ないターゲットを優先します。',
  'routes.lb.influence': '重み',
  'routes.lb.weight.mixed':
    '重み付きモードではすべてのターゲットに 0 超の重みが必要です。ポリシールーティングを使用する場合は LB モードを切り替えてください。',
  'routes.form.target.maxRunningRequests':
    'インスタンスあたりの最大インフライトリクエスト数',
  'routes.lb.systemone': '意思決定サービスルーティング',
  'routes.lb.systemone.tips':
    'タスクの難易度でターゲットをスコアリングします。各リクエスト(切り詰め後)はモデル選択の質問とともに Jev 互換意思決定サービスへ送られ、その回答が加重投票になります。意思決定の失敗、タイムアウト、または非 2xx 応答時は他のプラグインへサイレントにフォールバックします。',
  'routes.lb.systemone.provider': '意思決定サービス',
  'routes.lb.systemone.provider.tips':
    'TypeSafe 意思決定サービスプロバイダーを選択します。',
  'routes.lb.systemone.provider.required': '意思決定サービスを選択してください',
  'routes.lb.systemone.decisionModel': '意思決定モデル',
  'routes.lb.systemone.decisionModel.tips':
    'ルートレベルの意思決定モデル。選択したプロバイダーにキャッシュされたエンジンから選択します。優先度: この項目 > プロバイダーのモデル > サービスのデフォルト。',
  'routes.lb.systemone.decisionModel.required':
    '意思決定モデルを選択してください',
  'routes.lb.systemone.instructions': '指示',
  'routes.lb.systemone.instructions.tips':
    '意思決定サービスに送るモデル選択の質問への追加ガイダンスです。',
  'routes.lb.systemone.instructions.required': '指示を入力してください',
  'routes.lb.systemone.criteria': 'モデル評価基準',
  'routes.lb.systemone.criteria.add': '評価基準を追加',
  'routes.lb.systemone.criteria.tips':
    'モデル名 → 能力の説明:意思決定サービスが各リクエストに適したモデルを選ぶための根拠です。',
  'routes.lb.systemone.criteria.generate': 'ターゲットから生成',
  'routes.lb.systemone.criteria.modelPlaceholder': 'モデル名',
  'routes.lb.systemone.criteria.descPlaceholder':
    '能力の説明(例: 最強の推論 / 安くて高速)',
  'routes.lb.systemone.criteria.required':
    'スマートルーティングを有効にする場合は評価基準を少なくとも 1 つ設定してください',
  'routes.lb.systemone.criteria.nameRequired':
    'すべての評価基準にモデル名を入力してください',
  'routes.lb.systemone.criteria.valueRequired':
    'すべての評価基準に説明を入力してください',
  'routes.lb.systemone.criteria.duplicate': '評価基準のモデル名は重複できません'
};
