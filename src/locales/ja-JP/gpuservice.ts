export default {
  'gpuservice.template': 'GPU インスタンステンプレート',
  'gpuservice.template.add': 'インスタンステンプレートを追加',
  'gpuservice.template.edit': 'インスタンステンプレートを編集',
  'gpuservice.template.filter.name': '名前でフィルター',
  'gpuservice.template.filter.vendor': 'ベンダーでフィルター',
  'gpuservice.template.image': 'コンテナイメージ',
  'gpuservice.template.imagePullPolicy': 'イメージ取得ポリシー',
  'gpuservice.template.imagePullPolicy.always': '常に取得',
  'gpuservice.template.imagePullPolicy.ifNotPresent': '存在しない場合に取得',
  'gpuservice.template.imagePullPolicy.never': '取得しない',
  'gpuservice.template.command': 'コンテナ起動コマンド',
  'gpuservice.template.command.placeholder':
    '引数はスペースで区切り、スペースを含む引数は引用符で囲んでください。例：/bin/bash -c "echo hello world"',
  'gpuservice.template.mountPath': 'マウントパス',
  'gpuservice.template.mountPath.tips':
    'このテンプレートからインスタンスを作成する際に、ストレージボリュームがデフォルトでマウントされるパスです。インスタンスの実行中に保持する必要があるデータの永続化に使用できます。',
  'gpuservice.template.containerDisk': 'コンテナディスク (GB)',
  'gpuservice.template.containerDisk.tips':
    'コンテナシステムディスクのサイズです。',
  'gpuservice.template.memory': 'メモリ (GB)',
  'gpuservice.instance.containerDisk.remaining':
    'コンテナディスク (最大 {count} GB)',
  'gpuservice.instance.memory.remaining': 'メモリ (最大 {count} GB)',
  'gpuservice.template.displayName': '表示名',
  'gpuservice.template.displayName.max':
    '表示名は 63 文字以内で入力してください。',
  'gpuservice.template.ports': 'ポート',
  'gpuservice.template.ports.add': 'ポートを追加',
  'gpuservice.template.ports.invalid': 'ポート設定を完成させてください。',
  'gpuservice.template.ports.name': '名前',
  'gpuservice.template.ports.name.max':
    'ポート名は 16 文字以内で入力してください。',
  'gpuservice.template.ports.name.duplicate': 'ポート名は重複できません。',
  'gpuservice.template.env': '環境変数',
  'gpuservice.template.env.add': '環境変数を追加',
  'gpuservice.template.env.invalid': '環境変数を完成させてください。',
  'gpuservice.template.env.name': '名前',
  'gpuservice.template.env.value': '値',
  'gpuservice.template.card.image': 'イメージ',
  'gpuservice.template.card.mount': 'マウント',
  'gpuservice.template.card.resources': 'リソース',
  'gpuservice.template.card.ports': 'ポート',
  'gpuservice.storageType': 'ストレージタイプ',
  'gpuservice.storageType.add': 'ストレージタイプを追加',
  'gpuservice.storageType.edit': 'ストレージタイプを編集',
  'gpuservice.storageType.filter.name': '名前で検索',
  'gpuservice.storageType.kind': '種別',
  'gpuservice.storageType.mountOptions': 'マウントオプション',
  'gpuservice.storageType.nfs.server': 'NFS サーバー',
  'gpuservice.storageType.nfs.server.tips':
    'すべての Kubernetes クラスターから NFS サーバーアドレスにアクセスできることを確認してください。',
  'gpuservice.storageType.nfs.share': '共有パス',
  'gpuservice.storageType.nfs.share.tips':
    'この共有パス配下に、組織名とストレージ名に基づくディレクトリが自動的に作成されます。サブディレクトリが指定されている場合、生成されたディレクトリはそのサブディレクトリ配下に作成されます。',
  'gpuservice.storageType.nfs.subDirectory': 'サブディレクトリ',
  'gpuservice.storageType.nfs.subDirectory.tips':
    '空の場合、永続ボリューム名のサブディレクトリが作成されます。設定されている場合、このサブディレクトリ配下に永続ボリューム名のディレクトリが作成されます。',
  'gpuservice.storageType.nfs.mountPermissions': 'マウント権限',
  'gpuservice.storageType.nfs.mountPermissions.tips':
    'NFS サーバー上のファイル権限を継承します。',
  'gpuservice.storageType.s3.endpoint': 'エンドポイント',
  'gpuservice.storageType.s3.endpoint.tips':
    'すべての Kubernetes クラスターから S3 エンドポイントにアクセスできることを確認してください。',
  'gpuservice.storageType.s3.endpoint.rule':
    'http または https で始まる必要があります',
  'gpuservice.storageType.s3.region': 'リージョン',
  'gpuservice.storageType.s3.bucket': 'バケット',
  'gpuservice.storageType.s3.bucket.tips':
    '空の場合、永続ボリューム名で新しいバケットが作成されます。設定されている場合、このバケット配下に永続ボリューム名のサブディレクトリが作成されます。',
  'gpuservice.storageType.s3.bucket.tips1':
    'このバケット内に、組織名とストレージ名に基づくプレフィックスディレクトリが自動的に作成されます。',
  'gpuservice.storageType.s3.bucket.tips2':
    '例えば、組織名が <span class="desc-block">awesome-group</span>、ストレージ名が <span class="desc-block">storage-1</span> の場合、生成されるプレフィックスは <span class="desc-block">awesome-group/storage-1</span> になります。',
  'gpuservice.storageType.s3.accessKey': 'アクセスキー',
  'gpuservice.storageType.s3.secretKey': 'シークレットキー',
  'gpuservice.storageType.s3.insecure': 'TLS/SSL 証明書の検証をスキップ',
  'gpuservice.storageType.s3.insecure.tips':
    '有効にすると S3 サーバーの証明書検証を無視します。社内テストや自己署名証明書の利用時に適しており、本番環境では慎重に有効化してください。',
  'gpuservice.publicKey': 'SSH 公開鍵',
  'gpuservice.publicKey.add': 'SSH 公開鍵を追加',
  'gpuservice.publicKey.edit': 'SSH 公開鍵を編集',
  'gpuservice.publicKey.filter.name': '名前で検索',
  'gpuservice.publicKey.label': 'SSH 公開鍵',
  'gpuservice.instance.ssh.enable': 'SSH アクセスを有効化',
  'gpuservice.instance.ssh.assignKey': 'SSH 公開鍵を割り当て',
  'gpuservice.instance.ssh.addKey': 'SSH 公開鍵を追加',
  'gpuservice.publicKey.placeholder':
    'ssh-rsa または ssh-ed25519 で始まり、各公開鍵は1行ずつ記述します\n\n公開鍵を確認：\n- RSA\ncat ~/.ssh/id_rsa.pub\n- Ed25519\ncat ~/.ssh/id_ed25519.pub',
  'gpuservice.instance': 'GPU インスタンス',
  'gpuservice.instance.add': 'GPU インスタンスを追加',
  'gpuservice.instance.edit': 'GPU インスタンスを編集',
  'gpuservice.instance.filter.cluster': 'クラスターでフィルター',
  'gpuservice.instance.name': 'インスタンス名',
  'gpuservice.instance.name.required': 'インスタンス名を入力してください',
  'gpuservice.instance.section.basic': '基本情報',
  'gpuservice.instance.section.type': 'インスタンスタイプ',
  'gpuservice.instance.section.template': 'インスタンステンプレート',
  'gpuservice.instance.types': 'インスタンスタイプ',
  'gpuservice.instance.templates': 'インスタンステンプレート',
  'gpuservice.instance.section.storage': 'ストレージボリューム',
  'gpuservice.instance.type.required': 'インスタンスタイプを選択してください',
  'gpuservice.instance.type.noAvailable':
    '利用可能なインスタンスタイプがありません',
  'gpuservice.instance.gpuCount': 'GPU 数',
  'gpuservice.instance.gpuCount.required': 'GPU 数を入力してください',
  'gpuservice.instance.gpuCount.max':
    '最大 {count} 枚の GPU カードを選択してください',
  'gpuservice.instance.gpuCount.min':
    '少なくとも {count} 枚の GPU カードを選択してください',
  'gpuservice.instance.cpuCount.max':
    '最大 {count} 個の CPU コアを選択してください',
  'gpuservice.instance.cpuCount.min':
    '少なくとも {count} 個の CPU コアを選択してください',
  'gpuservice.instance.gpuCount.noAvailable':
    '利用可能な GPU リソースがありません。別のインスタンスタイプを選択してください。',
  'gpuservice.instance.gpuCount.zero': 'CPU のみを使用し、環境準備用です。',
  'gpuservice.instance.stock': '在庫',
  'gpuservice.instance.sliced': '分割',
  'gpuservice.instance.memory': 'VRAM',
  'gpuservice.instance.ram': 'RAM',
  'gpuservice.instance.os': 'OS',
  'gpuservice.instance.arch': 'アーキテクチャ',
  'gpuservice.instance.disk': 'ディスク',
  'gpuservice.table.count': '数量',
  'gpuservice.instance.disk.system': 'システムディスク',
  'gpuservice.instance.disk.ephemeral': '一時ストレージ',
  'gpuservice.instance.disk.persistent': '永続ストレージ',
  'gpuservice.instance.search.type.placeholder': '名前で検索',
  'gpuservice.instance.search.template.placeholder':
    'テンプレート名、イメージまたはマウントパスで検索',
  'gpuservice.instance.template.image': 'イメージ',
  'gpuservice.instance.template.mount': 'マウント',
  'gpuservice.instance.connect': '接続',
  'gpuservice.instance.connect.copySshCommand': 'SSH コマンドをコピー',
  'gpuservice.instance.event.reason': '理由',
  'gpuservice.instance.event.message': 'メッセージ',
  'gpuservice.instance.event.source': 'ソース',
  'gpuservice.instance.event.count': '回数',
  'gpuservice.instance.event.lastSeen': '最終発生',
  'gpuservice.instance.event.recentHourTip':
    '直近 1 時間のイベントのみ表示されます',
  'gpuservice.instance.event.tab.instance': 'インスタンスイベント',
  'gpuservice.instance.event.tab.volume': 'ボリュームイベント',
  'gpuservice.instance.recreate.confirm.title': '再作成を確認しますか',
  'gpuservice.instance.recreate.confirm.content':
    '現在のインスタンスを削除した後、現在の構成で再作成します。\n <span style="font-size: 13px;font-weight: 700">{name}</span>',
  'gpuservice.storage': 'ストレージ',
  'gpuservice.storage.add': 'ストレージを追加',
  'gpuservice.storage.edit': 'ストレージを編集',
  'gpuservice.storage.filter.cluster': 'クラスターでフィルター',
  'gpuservice.storage.type': 'ストレージタイプ',
  'gpuservice.storage.type.local': 'ローカルストレージ',
  'gpuservice.storage.type.shared': '共有ストレージ',
  'gpuservice.storage.type.object': 'オブジェクトストレージ',
  'gpuservice.storage.capacity': '容量',
  'gpuservice.storage.accessMode': 'アクセスモード',
  'gpuservice.storage.persistent': '永続',
  'gpuservice.storage.temporary': '一時',
  'gpuservice.storage.persistentVolume': '永続',
  'gpuservice.storage.persistentVolume.required':
    'ストレージを選択してください',
  'gpuservice.storage.persistentVolume.capacity': '容量 (GB)',
  'gpuservice.storage.persistentVolume.capacity.required':
    '容量を入力してください',
  'gpuservice.storage.persistentVolume.releaseWithInstance':
    'インスタンスと共に解放',
  'gpuservice.storage.tempCapacity': '容量 (GB)',
  'gpuservice.storage.tempCapacity.required':
    '一時ストレージ容量を入力してください',
  'gpuservice.form.rule.name':
    "小文字、数字、'-' のみ使用可能。文字または数字で始まり、文字または数字で終わる必要があり、連続する '-' は不可、最大 63 文字。",
  'gpuservice.storage.temporary.tips':
    'Data is cleared when the instance stops.',
  'gpuservice.storage.persistentVolume.tips':
    'Data persists across instance restarts. Persistent volumes remain intact after instance termination and can be shared by multiple instances.',
  'gpuservice.form.storage.select': 'ストレージを選択'
};
