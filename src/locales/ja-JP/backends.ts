export default {
  'backends.title': '推論バックエンド',
  'backend.button.add': 'バックエンドを追加',
  'backend.button.edit': 'バックエンドを編集',
  'backend.versions': 'バージョン一覧',
  'backend.defaultVersion': 'デフォルトバージョン',
  'backend.version': 'バージョン',
  'backend.imageName': 'イメージ名',
  'backend.runCommand': '実行コマンド',
  'backend.framework': 'フレームワーク',
  'backend.builtin': '内蔵',
  'backend.custom': 'カスタム',
  'backend.community': 'コミュニティ',
  'backend.isDefault': 'デフォルト',
  'backend.availableFrameworks': '対応フレームワーク',
  'backend.addVersion': 'バージョンを追加',
  'backend.filter.framework': 'フレームワークで絞り込み',
  'backend.export.yaml': 'YAML をエクスポート',
  'backend.mode.form': 'フォームモード',
  'backend.mode.yaml': 'YAML モード',
  'backend.form.healthCheckPath': 'ヘルスチェックのパス',
  'backend.form.defaultEntrypoint': 'イメージのデフォルトエントリーポイント',
  'backend.form.defaultExecuteCommand': 'デフォルトの実行コマンド',
  'backend.form.defaultExecuteCommand.tips':
    "'{{'model_path'}}'、'{{'port'}}'、'{{'worker_ip'}}'、'{{'model_name'}}' は、デプロイ時に実際の値に置き換えられるプレースホルダーです。",
  'backend.form.defaultBackendParameters':
    'デフォルトのバックエンドパラメーター',
  'backend.form.flagFormat': 'フラグ形式',
  'backend.form.flagFormat.tips':
    'オプションとその値を連結する形式。空欄の場合は各パラメータを入力されたまま保持し、形式を統一しません。',
  'backend.form.flagFormat.space': 'スペース区切り (--key value)',
  'backend.form.flagFormat.equal': 'イコール記号 (--key=value)',
  'backend.form.commonParameters': 'よく使うバックエンドパラメータ',
  'backend.form.commonParameters.tips':
    'モデルのデプロイ時にバックエンドパラメータ入力欄の候補として表示されます。',
  'backend.form.versionConfig': 'バージョン設定',
  'backend.form.addParameter': 'パラメーターを追加',
  'backend.form.noVersion': 'バージョンが追加されていません',
  'backend.noVersion': 'バージョンが見つかりません',
  'backend.versionInfo.autoImage': '実行時に自動選択',
  'backend.version.rules.builtin': '末尾は「-custom」にする必要があります',
  'backend.version.no.tips':
    '内蔵バックエンドのカスタムバージョン名は、末尾を「-custom」にする必要があります。',
  'backend.backend.rules.custom':
    'カスタムバックエンド名は、末尾を「-custom」にする必要があります。',
  'backend.quickConfig': 'クイック設定',
  'backend.version.default.not.exists':
    'デフォルトバージョンが {versions} に存在しません。',
  'backend.replaceEntrypoint': 'イメージのエントリーポイントを上書き',
  'backend.entrypoint': 'イメージのエントリーポイント',
  'backend.entrypoint.tips':
    '指定した場合、イメージで定義された ENTRYPOINT は無視され、以下のコマンドがコンテナ起動時のエントリーポイントとして使用されます。',
  'backend.form.defaultEnvironment': 'デフォルトの環境変数',
  'backend.recommendModels': '推奨モデル',
  'backend.filter.source': 'ソースで絞り込み',
  'backend.add.custom': 'カスタム',
  'backend.add.community': 'コミュニティ',
  'backend.community.title': 'コミュニティバックエンドのマーケットプレイス',
  'backend.form.add.hint':
    '内蔵バックエンド（vLLM、SGLang、MindIE など）の別バージョンを使用するには、カスタムバックエンドを追加せずに、既存のバックエンドに新しいバージョンを追加してください。',
  // Backend source configuration (built-in backend versions + community library)
  'backend.source.title': 'バックエンドのソース',
  'backend.source.builtin.title': '内蔵バックエンド',
  'backend.source.builtin.official':
    '内蔵バックエンド（vLLM、SGLang、MindIE、VoxBox）向けに GPUStack が公開するイメージのバージョンを使用します。',
  'backend.source.community.title': 'コミュニティバックエンド',
  'backend.source.community.official':
    'このリリースに同梱された一覧に加え、GPUStack が公開するコミュニティバックエンドの一覧を使用します。'
};
