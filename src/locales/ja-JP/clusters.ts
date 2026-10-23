export default {
  'clusters.title': 'クラスター',
  'clusters.table.provider': 'プロバイダー',
  'clusters.table.deployments': 'デプロイ',
  'clusters.button.add': 'クラスターを追加',
  'clusters.button.addCredential': 'クラウド認証情報を追加',
  'clusters.button.editCredential': 'クラウド認証情報を編集',
  'clusters.filterBy.cluster': 'クラスターで絞り込み',
  'clusters.add.cluster': '{cluster} クラスターを追加',
  'clusters.edit.cluster': '{cluster} を編集',
  'clusters.provider.custom': 'カスタム',
  'clusters.button.register': 'クラスターを登録',
  'clusters.button.addNodePool': 'Worker プールを追加',
  'clusters.button.add.credential': '{provider} の認証情報を追加',
  'clusters.credential.title': 'クラウド認証情報',
  'clusters.credential.signinToCreate':
    '{name} をまだお持ちでない場合は、<a href="{link}" target="_blank">ログインまたは新規登録</a>して作成してください。',
  'clusters.credential.token': 'アクセス Token',
  'clusters.workerpool.region': 'リージョン',
  'clusters.workerpool.zone': 'ゾーン',
  'clusters.workerpool.instanceType': 'インスタンスタイプ',
  'clusters.workerpool.replicas': 'レプリカ数',
  'clusters.workerpool.batchSize': 'バッチサイズ',
  'clusters.workerpool.osImage': 'OS イメージ',
  'clusters.workerpool.volumes': 'ボリューム',
  'clusters.workerpool.format': '形式',
  'clusters.workerpool.size': 'サイズ（GiB）',
  'clusters.workerpool.title': 'Worker プール',
  'clusters.workerpool.cloudOptions': 'クラウドオプションを追加',
  'clusters.workerpool.volumes.add': 'ボリュームを追加',
  'clusters.create.provider.self': 'セルフホスト',
  'clusters.create.provider.cloud': 'クラウドプロバイダー',
  'clusters.create.steps.selectProvider': 'プロバイダーを選択',
  'clusters.create.configBasic': '基本設定',
  'clusters.create.execCommand': 'コマンドを実行',
  'clusters.create.supportedGpu': '対応 GPU',
  'clusters.create.skipfornow': '今はスキップ',
  'clusters.create.noImages': '利用可能なイメージがありません',
  'clusters.create.noInstanceTypes': '利用可能なインスタンスタイプがありません',
  'clusters.create.noRegions': '利用可能なリージョンがありません',
  'clusters.workerpool.batchSize.desc':
    'Worker プール内で同時に作成する Worker の数',
  'clusters.create.addworker.tips':
    '次のコマンドを実行する前に、<a href={link} target="_blank">前提条件</a>を満たしていることを確認してください。',
  'clusters.create.addCommand.tips':
    '追加する Worker で次のコマンドを実行し、クラスターに参加させてください。',
  'clusters.create.addCommand.k8s.tips':
    '登録する Kubernetes クラスターで以下のコマンドを実行し、Kubernetes リソースを作成してクラスターを登録します。',
  'clusters.create.addCommand.k8s.version.warning':
    'サポートされる Kubernetes の最小バージョンは 1.23 です。GPU サービス機能を使用する場合、Kubernetes 1.27 以降が必要です。',
  'cluster.create.checkEnv.tips':
    '次のコマンドで環境の準備ができているか確認してください。',
  'clusters.create.register.tips':
    '追加する Kubernetes クラスターで次のコマンドを実行し、そのノードをクラスターに参加させてください。',
  'cluster.provider.comingsoon': '近日公開',
  'clusters.addworker.nvidiaNotes-01':
    '外向きの IP アドレスが複数ある場合は、Worker が使用するものを指定してください。<span class="bold-text">hostname -I | xargs -n1</span> で確認してください。',
  'clusters.addworker.nvidiaNotes-02':
    'Worker にモデルのディレクトリがすでにある場合は、マウントするパスを指定できます。',
  'clusters.addworker.hygonNotes':
    '<span class="bold-text">/opt/hyhal</span> または <span class="bold-text">/opt/dtk</span> が存在しない場合は、対応する Hygon のインストール先を指すシンボリックリンクを作成してください。例:\n  <span class="desc-fill">ln -s /path/to/hyhal /opt/hyhal</span>\n  <span class="desc-fill">ln -s /path/to/dtk /opt/dtk</span>。',
  'clusters.addworker.corexNotes':
    '<span class="bold-text">/usr/local/corex</span> ディレクトリが存在しない場合は、Iluvatar SDK のインストール先を指すシンボリックリンクを作成してください:\n<span class="bold-text">ln -s /path/to/corex /usr/local/corex</span>。',
  'clusters.addworker.metaxNotes':
    '<span class="bold-text">/opt/mxdriver</span> または <span class="bold-text">/opt/maca</span> ディレクトリが存在しない場合は、MetaX のドライバーと SDK のインストール先を指すシンボリックリンクを作成してください:\n<span class="desc-fill">ln -s /path/to/mxdriver /opt/mxdriver</span>\n<span class="desc-fill">ln -s /path/to/maca /opt/maca</span>。',
  'clusters.addworker.cambriconNotes':
    '<span class="bold-text">/usr/local/neuware</span> ディレクトリが存在しない場合は、Cambricon のインストール先を指すシンボリックリンクを作成してください:\n<span class="bold-text">ln -s /path/to/neuware /usr/local/neuware</span>。',
  'clusters.addworker.hygonNotes-02':
    'デバイスの検出に失敗する場合は、<span class="bold-text">--env ROCM_SMI_LIB_PATH=/opt/hyhal/lib</span> を削除してみてください。',
  'clusters.addworker.selectCluster': 'クラスターを選択',
  'clusters.addworker.selectCluster.tips':
    '<span class="bold-text">Docker 以外</span>のクラスターでは、クラスター画面からクラスターを登録するか、Worker プールを管理してください。',
  'clusters.addworker.selectGPU': 'GPU ベンダーを選択',
  'clusters.addworker.selectGPU.multiTag': '複数選択',
  'clusters.addworker.selectHardware': 'ハードウェアタイプを選択',
  'clusters.addworker.selectHardware.subtitle':
    'このクラスターでWorkerを実行するハードウェアタイプをすべて選択してください',
  'clusters.addworker.cpuNode.tips':
    'GPU を持たないすべてのノードにWorkerをデプロイします。コントロールプレーンが GPU ノードと同じクラスターにあり、CPU ノードでWorkerを実行したくない場合は選択しないでください。',
  'clusters.addworker.noWorkerSelected.error':
    'ハードウェアタイプを少なくとも 1 つ選択してください。CPU Node と GPU ベンダーのどちらも選択しない場合、Workerが 1 つもデプロイされません。',
  'clusters.addworker.checkEnv': '環境を確認',
  'clusters.addworker.checkEnv.cpuOnlyTips':
    '以下のコマンドを使用して、Kubernetes クラスターに少なくとも 1 つのレディーノードがあることを確認してください。CPU クラスターを登録しています。',
  'clusters.addworker.specifyArgs': '引数を指定',
  'clusters.addworker.dtkVersion': 'DTK バージョン',
  'clusters.addworker.runCommand': 'コマンドを実行',
  'clusters.addworker.specifyWorkerIP': 'Worker IP',
  'clusters.addworker.detectWorkerIP': 'Worker IP を自動検出',
  'clusters.addworker.specifyWorkerAddress': 'Worker 外部アドレス',
  'clusters.addworker.detectWorkerAddress': 'Worker 外部アドレス',
  'clusters.addworker.detectWorkerAddress.tips':
    '指定がない場合、デフォルトで Worker IP が使用されます。',
  'clusters.addworker.externalIP.tips':
    'VPC やプライベートネットワークで実行している場合は、GPUStack Server から到達可能な Worker の外部アドレスを指定してください。',
  'clusters.addworker.enterWorkerIP': 'Worker の IP を入力',
  'clusters.addworker.enterWorkerIP.error': 'Worker の IP を入力してください。',
  'clusters.addworker.enterWorkerAddress': 'Worker の外部アドレスを入力',
  'clusters.addworker.enterWorkerAddress.error':
    'Worker の外部アドレスを入力してください。',
  'clusters.addworker.rdma': 'RDMA / InfiniBand',
  'clusters.addworker.rdma.tips':
    'Worker が InfiniBand/RoCE の NIC を備えている場合に有効にします。ノード間の KV キャッシュ転送に必要です。',
  'clusters.addworker.extraVolume': '追加ボリュームのマウント',
  'clusters.addworker.cacheVolume': 'モデルキャッシュボリュームのマウント',
  'clusters.addworker.cacheVolume.tips':
    'モデルキャッシュのディレクトリを変更する場合は、マウントするパスを指定できます。',
  'clusters.addworker.configSummary': '設定の概要',
  'clusters.addworker.gpuVendor': 'GPU ベンダー',
  'clusters.addworker.workerIP': 'Worker IP',
  'clusters.addworker.workerExternalIP': 'Worker の外部アドレス',
  'clusters.addworker.notSpecified': '未指定',
  'clusters.addworker.autoDetect': '自動',
  'clusters.addworker.extraVolume.holder':
    '例: /data/models（パスは / で始めてください）。複数のパスはカンマで区切ってください。',
  'clusters.addworker.cacheVolume.holder':
    '例: /data/cache（パスは / で始めてください）',
  'clusters.addworker.vendorNotes.title': '{vendor} デバイスに関する注意事項',
  'clusters.addworker.amdNotes-01':
    '<span class="bold-text">/opt/rocm</span> ディレクトリが存在しない場合は、ROCm のインストール先を指すシンボリックリンクを作成してください: <span class="bold-text">ln -s /path/to/rocm /opt/rocm</span>。',
  'clusters.addworker.amdNotes-02': `ホスト上で複数の ROCm バージョンを管理している場合、検出の失敗を避けるために <span class="bold-text">/opt/rocm/lib</span> をマウントする必要があります。`,
  'clusters.addworker.message.success_single':
    '新しい Worker が {count} 台クラスターに追加されました。',
  'clusters.addworker.message.success_multiple':
    '新しい Worker が {count} 台クラスターに追加されました。',
  'clusters.create.serverUrl': 'GPUStack Server URL',
  'clusters.create.workerConfig': 'Worker 設定',
  'clusters.chartValues.title': 'チャート値（YAML）',
  'clusters.chartValues.tip':
    'GPUStack の Helm チャート用の値です。チャートと同じキーを使用し、サーバーが導出した値にマージされます。上に専用の項目がない、チャートやサブチャートの設定を指定できます（例：クラスターが既に提供しているコンポーネントを無効にする）。Helm と同様、リストは追記されず、置き換えられます。',
  'clusters.chartValues.reapply.tip':
    'クラスターを保存しても Kubernetes 側は変更されません。「クラスターを登録」を再実行してマニフェストを取得し、再度適用してください。クラスター内の Job がマニフェストの要求とリリースの実際の構成を比較し、差分がある場合にのみアップグレードします。',
  'clusters.chartValues.doc.chart': 'チャート値',
  'clusters.chartValues.doc.operator': 'Operator のチャート',
  'clusters.chartValues.error.invalidYaml': 'YAML の形式が不正です: {reason}',
  'clusters.chartValues.error.notJson':
    '{path} の値が文字列・数値・真偽値・リスト・マッピングのいずれでもありません。YAML が日付またはバイナリ値として解釈しており、そのままでは渡せません。引用符で囲むとテキストとして保持されます。',
  'clusters.chartValues.error.unsafeInteger':
    '{path} の整数は正確に扱える範囲を超えています。YAML の解析時点で丸められているため、別の値が送信されます。引用符で囲むと桁がそのまま保たれます。',
  'clusters.chartValues.error.notMapping':
    'Chart values は YAML のキーマッピングである必要があります。単一の値やリストは指定できません。',
  'clusters.edit.registration.changed.tip':
    'Workerの登録時に適用される設定を変更しました。変更を有効にするには、対象クラスターで登録コマンドを再実行してください。',
  'clusters.addworker.containerName': 'Worker コンテナ名',
  'clusters.addworker.containerName.tips':
    'Worker のコンテナ名を指定してください。',
  'clusters.addworker.dataVolume': 'GPUStack データボリューム',
  'clusters.addworker.dataVolume.tips':
    'GPUStack のデータ保存先パスを指定してください。',
  'clusters.table.ip.internal': '内部',
  'clusters.table.ip.external': '外部',
  'clusters.form.serverUrl.tips':
    'Worker が GPUStack Server に直接アクセスできない場合は、外部からアクセス可能な GPUStack サービスの URL を指定してください。例: {example}',
  'clusters.form.setDefault': 'デフォルトに設定',
  'clusters.form.setDefault.tips': 'デプロイ時のデフォルトです。',
  'clusters.addworker.noClusters':
    '利用可能な Docker クラスターが見つかりません',
  'clusters.create.steps.complete.tips': 'クラスターを作成しました。',
  'clusters.create.steps.complete': '完了',
  'clusters.create.steps.configure': '設定',
  'clusters.create.dockerTips1':
    '次に、このクラスターに Worker を追加してください。',
  'clusters.create.dockerTips2':
    'この手順をスキップし、後からクラスター一覧で追加することもできます。',
  'clusters.create.k8sTips1':
    '次に、既存の Kubernetes クラスターを登録してください。',
  'clusters.create.k8sTips2':
    'この手順をスキップし、後からクラスター一覧で登録することもできます。',
  'clusters.addworker.theadNotes':
    '<span class="bold-text">/usr/local/PPU_SDK</span> ディレクトリが存在しない場合は、T-Head PPU SDK のインストール先を指すシンボリックリンクを作成してください: <span class="bold-text">ln -s /path/to/PPU_SDK /usr/local/PPU_SDK</span>。',
  'clusters.addworker.theadNotes-02':
    'T-Head PPU は、デバイスの割り当てに Container Device Interface（CDI）を使用します。CDI の生成には <span class="bold-text">/var/run/cdi</span> ディレクトリが利用可能である必要があります。',
  'clusters.addworker.nvidiaNotes':
    'GPUStack の内蔵推論バックエンドには <span class="bold-text">CUDA 12.8+</span> が必要です。NVIDIA ドライバーのバージョンが <span class="bold-text">570</span> 以降であることを確認してください。',
  'clusters.volume.title': 'ボリュームマウント',
  'clusters.volume.name': 'ボリューム名',
  'clusters.volume.mountPath': 'コンテナ内のパス',
  'clusters.volume.mountPath.format': 'パスは / で始める必要があります',
  'clusters.volume.readOnly': '読み取り専用',
  'clusters.volume.sourceType': 'ソースの種類',
  'clusters.volume.sourceType.hostPath': 'ホスト上のパス',
  'clusters.volume.sourceType.pvc': '永続ボリューム要求（PVC）',
  'clusters.volume.sourceType.configMap': 'ConfigMap',
  'clusters.volume.hostPath.path': 'ホスト上のパス',
  'clusters.volume.hostPath.type': 'パスの種類',
  'clusters.volume.hostPath.type.directory': 'ディレクトリ',
  'clusters.volume.hostPath.type.directoryOrCreate':
    'ディレクトリ（存在しない場合は作成）',
  'clusters.volume.hostPath.type.file': 'ファイル',
  'clusters.volume.hostPath.type.fileOrCreate':
    'ファイル（存在しない場合は作成）',
  'clusters.volume.hostPath.type.socket': 'ソケット',
  'clusters.volume.hostPath.type.charDevice': 'キャラクターデバイス',
  'clusters.volume.hostPath.type.blockDevice': 'ブロックデバイス',
  'clusters.volume.pvc.claimName': 'PVC 名',
  'clusters.volume.pvc.readOnly': '読み取り専用',
  'clusters.volume.configMap.name': 'ConfigMap 名',
  'clusters.volume.configMap.optional': '任意',
  'clusters.volume.add': 'ボリュームマウントを追加',
  'clusters.systemDefaultContainerRegistry.title':
    'デフォルトのコンテナレジストリ',
  'clusters.systemDefaultContainerRegistry.tip':
    'このクラスターで GPUStack イメージを解決する際に使用するデフォルトのレジストリです。未設定の場合はサーバーのデフォルトを使用します。',
  'clusters.systemDefaultContainerRegistry.dockerHubUnreachable':
    '{provider} のインスタンスは Docker Hub にアクセスできません。ミラーまたはプライベートレジストリを使用してください。',
  'clusters.k8sOptions.title': 'Kubernetes デプロイオプション',
  'clusters.imageCredentials.title': 'イメージの認証情報',
  'clusters.imageCredentials.add': '認証情報を追加',
  'clusters.imageCredentials.registry': 'レジストリ',
  'clusters.imageCredentials.username': 'ユーザー名',
  'clusters.imageCredentials.password': 'パスワード',
  'clusters.nodeSelector.title': 'ノードセレクター',
  'clusters.nodeSelector.tip':
    'すべての Worker DaemonSet に適用する Pod の nodeSelector です。ラベルが一致するノードでのみ Worker を実行できます。',
  'clusters.operatorImage.title': 'Operator イメージ',
  'clusters.operatorImage.tip':
    'GPUStack Operator のコンテナイメージを上書きします。空欄にするとサーバーのデフォルトを使用します。',
  'clusters.namespace.title': '名前空間',
  'clusters.namespace.tip':
    'クラスターのマニフェストを生成する Kubernetes の名前空間です。空欄にすると gpustack-system を使用します。',
  'clusters.clusterType.title': 'クラスターの種類',
  'clusters.modelService.title': 'モデルサービス',
  'clusters.modelService.tip':
    'LLM の推論や API の提供に使用します。モデル API の公開や Token ベースのサービスなどが対象です。',
  'clusters.gpuInstances.title': 'GPU サービス',
  'clusters.gpuInstances.tip':
    'オンデマンドの GPU 計算に使用します。対話的な開発、学習ジョブ、カスタム環境などが対象です。',
  'clusters.gpuInstances.staticAddress': 'GPU サービスの固定アクセスアドレス',
  'clusters.gpuInstances.staticAddress.tip':
    'Operator がこのクラスター内の GPU インスタンスにアクセスする際の固定アドレスです（LoadBalancer の VIP など）。Operator のデフォルトは空欄で、ホストの IP からアクセスアドレスを生成します。変更は新しく作成するインスタンスにのみ適用され、デプロイ済みの GPU インスタンスのアドレスは変わりません。',
  'clusters.gpuInstances.derivedFromNode':
    'ノードからインスタンスタイプを自動生成',
  'clusters.gpuInstances.derivedFromNode.tip':
    'Operator がノードのハードウェアからインスタンスタイプと対応するキューを自動生成するかどうかを指定します。有効にすると、ノードの構成ごとにインスタンスタイプを生成します。無効にすると、リソース構成のみを整合させ、すべてのインスタンスタイプを手動で定義する必要があります。Operator のデフォルトは有効です。',
  'clusters.gpuInstances.mixedOnNode':
    'ノード上で異なるインスタンスタイプの混在を許可',
  'clusters.gpuInstances.mixedOnNode.tip':
    '同じノードでアクセラレーター付きと CPU のみの両方のインスタンスタイプを提供できるかを指定します。有効にすると、ノードは提供可能なすべてのタイプに含まれます。無効にすると、アクセラレーターがあるノードはアクセラレーター付きのタイプに、CPU のみのノードは汎用タイプにのみ含まれます。Operator のデフォルトは有効です。',
  'clusters.gpuInstances.setting.enabled': '有効',
  'clusters.gpuInstances.setting.disabled': '無効',
  'clusters.gpuInstances.setting.unmanaged':
    '管理対象外（クラスターの設定を維持）',

  // Topology: where this cluster's workers sit.
  'clusters.topology.title': 'トポロジー設定',
  'clusters.topology.load.failed': 'トポロジーを読み込めませんでした。',
  'clusters.topology.save.failed': '保存できませんでした。',
  'clusters.topology.preview.failed':
    'このマッピングをプレビューできませんでした。',
  'clusters.topology.preview.noWorkers':
    'このクラスターにはまだ Worker がありません。',
  'clusters.topology.preview.capacity':
    'Worker {workers} 台 · GPU {gpus} 基 · 未割り当て {free}',
  'clusters.topology.cluster': 'クラスター',
  'clusters.topology.discard.ok': '変更を破棄',
  'clusters.topology.field.region': 'リージョン',
  'clusters.topology.field.zone': 'ゾーン',
  'clusters.topology.field.room': 'マシンルーム',
  'clusters.topology.field.row': 'ラック列',
  'clusters.topology.field.rack': 'ラック',
  'clusters.topology.field.switch': 'アクセススイッチ',
  'clusters.topology.field.acceleratorDomain': 'アクセラレータードメイン',
  'clusters.topology.field.host': 'ホスト',
  'clusters.topology.field.region.tips':
    'クラウドリージョンまたはデータセンター',
  'clusters.topology.field.zone.tips': 'アベイラビリティゾーンまたはホール',
  'clusters.topology.field.room.tips': 'マシンルーム',
  'clusters.topology.field.row.tips': 'ラックの列',
  'clusters.topology.field.rack.tips': 'ラックまたはキャビネット',
  'clusters.topology.field.switch.tips':
    '手入力、または Topograph などのツールが書き込む',
  'clusters.topology.field.acceleratorDomain.tips':
    'デバイスが報告しない場合は手入力',
  'clusters.topology.overview.workers': '{count} 台の Worker',
  'clusters.topology.overview.domains': '{field} {count} 個',
  'clusters.topology.overview.unfilled': '{count} 台に{field}がありません',
  'clusters.topology.previewing': '● プレビュー中',
  'clusters.topology.previewing.long':
    '● プレビュー中：メインドロワーは未保存のマッピングで表示中',
  'clusters.topology.view.table': 'テーブル',
  'clusters.topology.view.tree': 'ツリー',
  'clusters.topology.search.placeholder': 'ホストを検索',
  'clusters.topology.columns': '列の設定',
  'clusters.topology.columns.fields': 'トポロジー階層',
  'clusters.topology.columns.manage': '階層を管理',
  'clusters.topology.columns.mapping': '階層を管理',
  'clusters.topology.batch.button': '階層の値を設定',
  'clusters.topology.batch.title': '階層の値を設定',
  'clusters.topology.batch.selected': '{count} 台選択中',
  'clusters.topology.batch.field': 'トポロジー階層',
  'clusters.topology.batch.value': 'ラベル値',
  'clusters.topology.batch.value.placeholder': 'ラベル値を選択または入力',
  'clusters.topology.batch.labelKey': 'ラベル：{key}',
  'clusters.topology.batch.summary':
    '{count} 台の Worker の{field}を {value} に設定します',
  'clusters.topology.batch.noWritableLayers':
    '設定できる階層がありません。先に「階層を管理」でラベルキーを設定してください。',
  'clusters.topology.batch.clearHint':
    '書き込んだラベルを削除すると、階層の値が別の候補ラベルやデバイスの報告値に戻る場合があります。',
  'clusters.topology.batch.clearSummary':
    '{count} 台の Worker から、この階層に書き込んだラベルを削除します。',
  'clusters.topology.batch.clearExisting':
    '{count} 台の Worker のラベルを削除します：{names}',
  'clusters.topology.batch.overwrite':
    '{count} 台の Worker の既存の値を上書きします：{names}',
  'clusters.topology.batch.overwriteAuto':
    '{count} 台の Worker のデバイス報告値を上書きします',
  'clusters.topology.batch.more': '{names} ほか {count} 台',
  'clusters.topology.batch.apply': '{count} 台に適用',
  'clusters.topology.toast.setOne': '{host} の{field}を {value} に設定しました',
  'clusters.topology.toast.clearedOne': '{host} の{field}をクリアしました',
  'clusters.topology.toast.set':
    '{count} 台の Worker の {field} を {value} に設定しました',
  'clusters.topology.toast.cleared':
    '{count} 台の Worker の {field} をクリアしました',
  'clusters.topology.toast.firstWrite': '（以後のスケジューリングにのみ影響）',
  'clusters.topology.undo': '元に戻す',
  'clusters.topology.undo.done': '元に戻しました',
  'clusters.topology.undo.failed': '元に戻せませんでした：{reason}',
  'clusters.topology.cell.fill': '{field}を入力',
  'clusters.topology.cell.unfilled': '階層の値が未設定',
  'clusters.topology.cell.noKeys.tips':
    'まず「階層を管理」でこの階層のラベルキーを設定してください。',
  'clusters.topology.cell.aria': '{field}、{state}、{host}',
  'clusters.topology.state.unfilled': '未入力',
  'clusters.topology.state.discovered.aria': '{value}、デバイス自己報告',
  'clusters.topology.state.override.aria': '{value}、手入力で上書き',
  'clusters.topology.state.discovered.tips':
    'デバイス自己報告（{key}）。手入力すると上書きされます。',
  'clusters.topology.state.override.tips':
    '手入力。クリアするとデバイス報告値 {value} に戻ります',
  'clusters.topology.state.user.tips': 'ラベル由来：{key}',
  'clusters.topology.override.confirm':
    'この値はデバイスの自己報告です。手入力すると上書きされます。',
  'clusters.topology.override.ok': '上書き',
  'clusters.topology.value.count': 'Worker {count} 台',
  'clusters.topology.value.create': '“{value}” を新規作成',
  'clusters.topology.value.clear': 'クリア',
  'clusters.topology.value.empty':
    '選択できる値がありません。ラベル値を入力してください。',
  'clusters.topology.column.menu': '{field} 列メニュー',
  'clusters.topology.column.fillUnfilled': '未入力の {count} 台を一括入力…',
  'clusters.topology.column.fillBySwitch':
    'アクセススイッチ別に入力（{count} グループ）…',
  'clusters.topology.source.user': '手入力',
  'clusters.topology.source.discovered': '自動',
  'clusters.topology.source.node': 'K8s ノード',
  'clusters.topology.host.online': 'オンライン',
  'clusters.topology.host.offline': 'オフライン',
  'clusters.topology.tree.byLayer': 'レイヤー別',
  'clusters.topology.tree.byField': '{field}別',
  'clusters.topology.tree.expandAll': 'すべて展開',
  'clusters.topology.tree.collapseAll': 'すべて折りたたむ',
  'clusters.topology.tree.unfilled': '未設定',
  'clusters.topology.tree.unmatched.tips':
    'これらの Worker には、この階層に一致するラベル値がまだありません。',
  'clusters.topology.tree.candidateKeys':
    '候補ラベルキー（いずれかのラベルを設定）',
  'clusters.topology.tree.more': 'あと {count} 台',
  'clusters.topology.tree.hostCapacity': '{gpus} GPU · 未割り当て {free}',
  'clusters.topology.mapping.title': '階層を管理',
  'clusters.topology.mapping.intro':
    '階層の値は、候補のラベルキーを使って Worker のラベルから読み取ります。キーの順序が優先順位となり、最初の空でない値を使用します。',
  'clusters.topology.mapping.keysPriority': '候補ラベルキー（優先順位順）',
  'clusters.topology.mapping.classified': '認識 {classified} / {total}',
  'clusters.topology.mapping.noKeys': 'ラベルキー未設定',
  'clusters.topology.mapping.noKeys.add':
    'ラベルキー未設定（クリックして追加）',
  'clusters.topology.layer.builtin': '[組み込み]',
  'clusters.topology.layer.labelKeys': 'ラベルキー',
  'clusters.topology.layer.addKey': '候補キーを追加',
  'clusters.topology.layer.insert': '階層を挿入',
  'clusters.topology.layer.rename': '名前を変更',
  'clusters.topology.layer.rename.tips':
    '表示名のみを変更します。階層の識別子、ラベルキー、モデルに保存済みのトポロジー親和性は変わりません。空欄にすると既定の名前に戻ります。階層 ID：',
  'clusters.topology.layer.rename.taken':
    '同じチェーン上の別の階層がその名前を使用しています。',
  'clusters.topology.layer.disable': '無効化',
  'clusters.topology.layer.disabled': '（無効）',
  'clusters.topology.layer.enable': '有効化',
  'clusters.topology.layer.inUse': 'この階層はまだ使用されています',
  'clusters.topology.layer.inUse.tips':
    '次のモデルがこの階層をトポロジー親和性に指定しており、削除すると制約を失います：{models}。先にこれらのモデルを変更してください。',
  'clusters.topology.layer.name': '名前',
  'clusters.topology.advanced.hostKeys': '組み込み、Worker 名による',
  'clusters.topology.advanced.locked':
    'GPUStack 固有キー：手入力値はここに書かれます。削除・移動不可。',
  'clusters.topology.advanced.suggestions': '発見されたラベルキー',
  'clusters.topology.advanced.suggestion':
    'Worker {workers} 台 · {values} 個の値 · {field} のようです',
  'clusters.topology.advanced.discard': '未保存の階層変更を破棄しますか？',
  'clusters.topology.advanced.discard.tips':
    '今回の階層と候補ラベルキーへの変更は保存されません。',
  'clusters.topology.advanced.discard.cancel': '編集を続ける',
  'clusters.topology.advanced.saved':
    '保存しました。以後のスケジューリングにのみ影響し、実行中のグループは移動されません。',
  'clusters.topology.keys.workerLabels': 'Worker のラベル',
  'clusters.topology.keys.placeholder': 'ラベルキーを入力または選択',
  'clusters.topology.keys.invalid':
    '有効な Kubernetes ラベルキーではありません（プレフィックス ≤ 253、名前 ≤ 63、英数字 - _ .）',
  'clusters.topology.keys.usage':
    '{count} 台の Worker がこのキーを持っています（{values} 個の値）',
  'clusters.topology.keys.exists': 'このキーはすでに追加されています',
  'clusters.topology.custom.title': '階層を追加',
  'clusters.topology.custom.insertHere': 'ここに階層を挿入',
  'clusters.topology.custom.name.placeholder': '階層名',
  'clusters.topology.custom.name.required': '名前を入力してください',
  'clusters.topology.custom.name.taken': 'この名前は使用済みか予約語です',
  'clusters.topology.custom.name.tips':
    'デプロイフォームの選択肢に表示されます',
  'clusters.topology.custom.position': 'チェーンのどこに置くか',
  'clusters.topology.custom.slot.insert': 'ここに挿入',
  'clusters.topology.custom.slot.placeholder': '新しいレイヤー',
  'clusters.topology.custom.slot.explain':
    '1 つの{parent}に複数の{name}があり、1 つの{name}に複数の{child}があります',
  'clusters.topology.custom.slot.explain.top':
    '1 つの{name}に複数の{child}があります',
  'clusters.topology.custom.keys.tips':
    'カスタムレイヤーには固有キーがありません。テーブルから手入力するには、最初のキーを書き込み先にしてください。',
  'clusters.topology.custom.referenced':
    '「{name}」は削除できません：以下のモデルが参照しています'
};
