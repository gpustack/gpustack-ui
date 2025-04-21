export default {
  'resources.title': 'リソース',
  'resources.nodes': 'ノード',
  'resources.button.create': 'ワーカーを追加',
  'resources.button.edit': 'ワーカーを編集',
  'resources.button.edittags': 'ラベルを編集',
  'resources.button.update': 'ラベルを更新',
  'resources.table.labels': 'ラベル',
  'resources.table.hostname': 'ホスト名',
  'resources.table.key.tips': '同じキーが存在します。',
  'resources.form.label': 'ラベル',
  'resources.form.advanced': '詳細設定',
  'resources.form.enablePartialOffload': 'CPUオフロードを許可',
  'resources.form.placementStrategy': '配置戦略',
  'resources.form.workerSelector': 'ワーカーセレクター',
  'resources.form.enableDistributedInferenceAcrossWorkers':
    'ワーカー間の分散推論を許可',
  'resources.form.spread.tips':
    'クラスター全体のリソースをすべてのワーカー間で比較的均等に分配します。これにより、単一のワーカーでリソースの断片化が発生する可能性があります。',
  'resources.form.binpack.tips':
    'クラスターリソースの全体的な利用率を優先し、ワーカー/GPU上のリソース断片化を減らします。',
  'resources.form.workerSelector.description':
    'システムは、事前定義されたラベルに基づいてモデルインスタンスをデプロイするために最適なワーカーを選択します。',
  'resources.table.ip': 'IP',
  'resources.table.cpu': 'CPU',
  'resources.table.memory': 'メモリ',
  'resources.table.gpu': 'GPU',
  'resources.table.disk': 'ストレージ',
  'resources.table.vram': 'VRAM',
  'resources.table.index': 'インデックス',
  'resources.table.workername': 'ワーカー名',
  'resources.table.vender': 'ベンダー',
  'resources.table.temperature': '温度',
  'resources.table.core': 'コア数',
  'resources.table.utilization': '利用率',
  'resources.table.gpuutilization': 'GPU利用率',
  'resources.table.vramutilization': 'VRAM利用率',
  'resources.table.total': '合計',
  'resources.table.used': '使用済み',
  'resources.table.allocated': '割り当て済み',
  'resources.table.wokers': 'ワーカー',
  'resources.worker.linuxormaxos': 'LinuxまたはMacOS',
  'resources.table.unified': '統合メモリ',
  'resources.worker.add.step1':
    'トークンを取得 <span class="note-text">（サーバーで実行）</span>',
  'resources.worker.add.step2': 'ワーカーを登録',
  'resources.worker.add.step2.tips':
    '（追加するワーカーで実行し、<span class="bold-text">トークン</span> は最初のステップで取得した値です。）',
  'resources.worker.add.step3':
    '成功後、ワーカーリストを更新して新しいワーカーを確認してください。',
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
  'resources.filter.worker': 'ワーカーでフィルタ',
  'resources.filter.source': 'ソースでフィルタ',
  'resources.modelfiles.delete.tips': 'ディスクからファイルも削除します！',
  'resources.modelfiles.copy.tips': 'フルパスをコピー',
  'resources.filter.path': 'パスでフィルタ'
};
