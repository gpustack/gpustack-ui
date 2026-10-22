export default {
  'resources.title': 'リソース',
  'resources.nodes': 'Worker',
  'resources.container': 'コンテナ',
  'resources.button.create': 'Workerを追加',
  'resources.button.edit': 'Workerを編集',
  'resources.button.edittags': 'ラベルを編集',
  'resources.button.update': 'ラベルを更新',
  'resources.table.labels': 'ラベル',
  'resources.table.hostname': 'ホスト名',
  'resources.table.key.tips': '同じキーが存在します。',
  'resources.form.label': 'ラベル',
  'resources.form.advanced': '詳細設定',
  'resources.form.enablePartialOffload': 'CPUオフロードを許可',
  'resources.form.placementStrategy': '配置戦略',
  'resources.form.workerSelector': 'Workerセレクター',
  'resources.form.enableDistributedInferenceAcrossWorkers':
    'Worker間の分散推論を許可',
  'resources.form.spread.tips':
    'クラスター全体のリソースをすべてのWorker間で比較的均等に分配します。これにより、単一のWorkerでリソースの断片化が発生する可能性があります。',
  'resources.form.binpack.tips':
    'クラスターリソースの全体的な利用率を優先し、Worker/GPU上のリソース断片化を減らします。',
  'resources.form.workerSelector.description':
    'システムは、事前定義されたラベルに基づいてモデルインスタンスをデプロイするために最適なWorkerを選択します。',
  'resources.table.ip': 'IP',
  'resources.table.cpu': 'CPU',
  'resources.table.memory': 'メモリ',
  'resources.table.gpu': 'GPU',
  'resources.table.disk': 'ストレージ',
  'resources.table.vram': 'VRAM',
  'resources.table.index': 'インデックス',
  'resources.table.workername': 'Worker名',
  'resources.table.vendor': 'ベンダー',
  'resources.table.temperature': '温度',
  'resources.table.core': 'コア数',
  'resources.table.utilization': '利用率',
  'resources.table.gpuutilization': 'GPU利用率',
  'resources.table.vramutilization': 'VRAM利用率',
  'resources.table.total': '合計',
  'resources.table.used': '使用済み',
  'resources.table.allocated': '割り当て済み',
  'resources.table.wokers': 'Worker',
  'resources.worker.linuxormaxos': 'LinuxまたはMacOS',
  'resources.table.unified': '統合メモリ',
  'resources.worker.add.step1':
    'Tokenを取得 <span class="note-text">（サーバーで実行）</span>',
  'resources.worker.add.step2': 'Workerを登録',
  'resources.worker.add.step2.tips': '（追加する Worker で実行してください。）',
  'resources.worker.add.step3':
    '成功後、Workerリストを更新して新しいWorkerを確認してください。',
  'resources.worker.container.supported':
    'MacOSまたはWindowsはサポートされていません。',
  'resources.worker.current.version': '現在のバージョンは {version} です。',
  'resources.worker.driver.install':
    '<a href="https://docs.gpustack.ai/latest/installation/installation-requirements/" target="_blank">必要なドライバとライブラリ</a> をGPUStackのインストール前にインストールしてください。',
  'resources.worker.select.command':
    'ラベルを選択してコマンドを生成し、コピーを使用してコマンドをコピーします。',
  'resources.worker.script.install': 'スクリプトインストール',
  'resources.worker.container.install': 'コンテナインストール（Linuxのみ）',
  'resources.worker.cann.tips': `<span class="bold-text">--device /dev/davinci{index}</span> を必要なNPUインデックスに応じて設定します。例えば、NPU0とNPU1をマウントするには、<span class="bold-text">--device /dev/davinci0 --device /dev/davinci1</span> を追加します。`,
  'resources.modelfiles.form.path': 'ストレージパス',
  'resources.modelfiles.modelfile': 'モデルファイル',
  'resources.modelfiles.download': 'モデルファイルを追加',
  'resources.modelfiles.size': 'サイズ',
  'resources.modelfiles.selecttarget': 'ターゲットを選択',
  'resources.modelfiles.form.localdir': 'ローカルディレクトリ',
  'resources.modelfiles.form.localdir.tips':
    'デフォルトのストレージディレクトリは <span class="desc-block">/var/lib/gpustack/cache</span> または <span class="desc-block">--cache-dir</span>（優先）または <span class="desc-block">--data-dir</span> で指定されたディレクトリです。',
  'resources.modelfiles.retry.download': 'ダウンロードを再試行',
  'resources.modelfiles.storagePath.holder':
    'ダウンロード完了を待っています...',
  'resources.filter.worker': 'Workerでフィルタ',
  'resources.filter.source': 'ソースでフィルタ',
  'resources.filter.status': 'ステータスで絞り込み',
  'resources.modelfiles.delete.tips': 'ディスクからファイルも削除します',
  'resources.modelfiles.copy.tips': 'フルパスをコピー',
  'resources.filter.path': 'パスでフィルタ',
  'resources.register.worker.step1':
    'アプリケーションの <span class="bold-text">Token をコピー</span> メニューをクリックしてください。',
  'resources.register.worker.step2':
    'アプリケーションの <span class="bold-text">クイック設定</span> メニューをクリックしてください。',
  'resources.register.worker.step3':
    '<span class="bold-text">全般</span> タブをクリックしてください。',
  'resources.register.worker.step4':
    'サービスの役割として <span class="bold-text">Worker</span> を選択してください。',
  'resources.register.worker.step5':
    '<span class="bold-text">サーバー URL</span> に {url} を入力してください。',
  'resources.register.worker.step6':
    '<span class="bold-text">Token</span> を貼り付けてください。',
  'resources.register.worker.step7':
    '<span class="bold-text">再起動</span> をクリックして設定を適用してください。',
  'resources.register.install.title': '{os} に GPUStack をインストール',
  'resources.register.download':
    '<a href={url} target="_blank">インストーラー</a>をダウンロードしてインストールしてください。対応バージョン: {versions}。',
  'resource.register.maos.support':
    'Apple Silicon（M シリーズ）、macOS 14 以降',
  'resource.register.windows.support': 'Windows 10、Windows 11',
  'resources.model.instance': 'モデルインスタンス',
  'resources.worker.download.privatekey': '秘密鍵をダウンロード',
  'resources.worker.ssh.view': 'SSH 接続情報を表示',
  'resources.worker.ssh.title': 'SSH 接続',
  'resources.worker.ssh.host': 'ホスト',
  'resources.worker.ssh.port': 'ポート',
  'resources.worker.ssh.command': '接続コマンド',
  'resources.worker.ssh.privatekey': '秘密鍵',
  'resources.worker.ssh.pending': 'まだ利用できません',
  'resources.worker.ssh.tip':
    '認証には、この Worker の秘密鍵を使用します。ダウンロードしたファイルに chmod 600 を実行してから接続してください。',
  'resources.worker': 'Worker',
  'resources.modelfiles.form.exsting': 'ダウンロード済み',
  'resources.modelfiles.form.added': '追加済み',
  'resources.modelfiles.form.isLora': 'LoRA モデル',
  'resources.worker.maintenance.title': 'システムメンテナンス',
  'resources.worker.maintenance.enable': 'メンテナンスモードを開始',
  'resources.worker.maintenance.disable': 'メンテナンスモードを終了',
  'resources.worker.maintenance.remark': '備考',
  'resources.worker.maintenance.remark.rules':
    'メンテナンスに関する備考を入力してください',
  'resources.worker.maintenance.tips':
    'メンテナンスモードを有効にすると、ノードには新しいモデルのデプロイタスクが割り当てられなくなります。稼働中のインスタンスには影響しません。',
  'resources.worker.noCluster.tips':
    '利用可能なクラスターがありません。ノードを追加する前にクラスターを作成してください。',
  'resources.metrics.details': '監視',
  'resoureces.worker.upgrade.tips':
    'Worker と GPUStack Server のバージョンが一致していません。同じバージョンを使用してください。',
  'resources.worker.version': 'Worker のバージョン: {version}',
  'resources.server.version': 'サーバーのバージョン: {version}',
  'resources.worker.currentVersion': '現在のバージョン: {version}',
  'resources.worker.targetVersion': '更新先のバージョン: {version}',
  'resources.driver.version': 'ドライバーのバージョン: {version}',

  'resources.worker.setLabels': 'ラベルを追加・更新',
  'resources.worker.setLabels.count': '{count} 台の Worker を選択中',
  'resources.worker.setLabels.hint':
    '選択したすべての Worker にラベルを追加し、同じキーの値を更新します。他のラベルは保持されます。ラベルを削除するには、Worker を個別に編集してください。',
  'resources.table.location': 'トポロジー階層',
  'resources.worker.setLocation': '位置を設定'
};
