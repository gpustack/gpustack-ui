export default {
  'resources.title': 'Kaynaklar',
  'resources.nodes': 'İşçi Düğümler',
  'resources.worker': 'İşçi Düğüm',
  'resources.button.create': 'İşçi Düğüm Ekle',
  'resources.button.edit': 'İşçi Düğümü Düzenle',
  'resources.button.edittags': 'Etiketleri Düzenle',
  'resources.button.update': 'Etiketleri Güncelle',
  'resources.table.labels': 'Etiketler',
  'resources.table.hostname': 'Ana Bilgisayar Adı',
  'resources.table.key.tips': 'Aynı anahtar mevcut.',
  'resources.form.label': 'Etiket',
  'resources.form.advanced': 'Gelişmiş',
  'resources.form.enablePartialOffload': 'CPU Aktarımına İzin Ver',
  'resources.form.placementStrategy': 'Yerleştirme Stratejisi',
  'resources.form.workerSelector': 'İşçi Düğüm Seçici',
  'resources.form.enableDistributedInferenceAcrossWorkers':
    'İşçi Düğümler Arası Dağıtık Çıkarıma İzin Ver',
  'resources.form.spread.tips':
    'Tüm kümenin kaynaklarını tüm işçi düğümler arasında nispeten eşit dağıtır. Tek bir işçi düğümde daha fazla kaynak parçalanması oluşturabilir.',
  'resources.form.binpack.tips':
    'Küme kaynaklarının genel kullanımını önceliklendirerek GPU\'lar/İşçi Düğümlerdeki kaynak parçalanmasını azaltır.',
  'resources.form.workerSelector.description':
    'Sistem, önceden tanımlanmış etiketlere göre model örneklerini dağıtmak için en uygun İşçi Düğümü seçer.',
  'resources.table.ip': 'IP',
  'resources.table.cpu': 'CPU',
  'resources.table.memory': 'RAM',
  'resources.table.gpu': 'GPU',
  'resources.table.disk': 'Depolama',
  'resources.table.vram': 'VRAM',
  'resources.table.index': 'İndeks',
  'resources.table.workername': 'İşçi Düğüm Adı',
  'resources.table.vendor': 'Üretici',
  'resources.table.temperature': 'Sıcaklık',
  'resources.table.core': 'Çekirdekler',
  'resources.table.utilization': 'Kullanım',
  'resources.table.gpuutilization': 'GPU Kullanımı',
  'resources.table.vramutilization': 'VRAM Kullanımı',
  'resources.table.total': 'Toplam',
  'resources.table.used': 'Kullanılan',
  'resources.table.allocated': 'Ayrılan',
  'resources.table.wokers': 'işçi düğümler',
  'resources.worker.linuxormaxos': 'Linux veya macOS',
  'resources.table.unified': 'Birleşik Bellek',
  'resources.worker.add.step1':
    'Token Al <span class="note-text">(Sunucuda çalıştırın)</span>',
  'resources.worker.add.step2': 'İşçi Düğümü Kaydet',
  'resources.worker.add.step2.tips': '(Eklenecek işçi düğümde çalıştırın.)',
  'resources.worker.add.step3':
    'Başarılı olduktan sonra, yeni işçi düğümü görmek için listeyi yenileyin.',
  'resources.worker.container.supported': 'macOS veya Windows desteklenmez.',
  'resources.worker.current.version': 'Mevcut sürüm: {version}.',
  'resources.worker.driver.install':
    'GPUStack kurulumundan önce <a href="https://docs.gpustack.ai/latest/installation/installation-requirements/" target="_blank">gerekli sürücüleri ve kütüphaneleri</a> yükleyin.',
  'resources.worker.select.command':
    'Komutu oluşturmak için bir etiket seçin ve kopyala düğmesiyle kopyalayın.',
  'resources.worker.script.install': 'Betik Kurulumu',
  'resources.worker.container.install': 'Konteyner Kurulumu (Yalnızca Linux)',
  'resources.worker.cann.tips': `Gerekli NPU indeksine göre <span class="bold-text">--device /dev/davinci{index}</span> ayarlayın. Örneğin, NPU0 ve NPU1\'i bağlamak için <span class="bold-text">--device /dev/davinci0 --device /dev/davinci1</span> ekleyin.`,
  'resources.modelfiles.form.path': 'Depolama Yolu',
  'resources.modelfiles.modelfile': 'Model Dosyaları',
  'resources.modelfiles.download': 'Model Dosyası Ekle',
  'resources.modelfiles.size': 'Boyut',
  'resources.modelfiles.selecttarget': 'Hedef Seç',
  'resources.modelfiles.form.localdir': 'Yerel Dizin',
  'resources.modelfiles.form.localdir.tips':
    'Varsayılan depolama dizini <span class="desc-block">/var/lib/gpustack/cache</span>, veya <span class="desc-block">--cache-dir</span> (öncelikli) ya da <span class="desc-block">--data-dir</span> ile belirtilen dizindir.',
  'resources.modelfiles.retry.download': 'İndirmeyi Yeniden Dene',
  'resources.modelfiles.storagePath.holder':
    'İndirmenin tamamlanması bekleniyor...',
  'resources.filter.worker': 'İşçi düğüme göre filtrele',
  'resources.filter.source': 'Kaynağa göre filtrele',
  'resources.filter.status': 'Duruma göre filtrele',
  'resources.modelfiles.delete.tips': 'Dosyayı diskten de sil',
  'resources.modelfiles.copy.tips': 'Tam Yolu Kopyala',
  'resources.filter.path': 'Yola göre filtrele',
  'resources.register.worker.step1':
    'Uygulamada <span class="bold-text">Token Kopyala</span> menüsüne tıklayın.',
  'resources.register.worker.step2':
    'Uygulamada <span class="bold-text">Hızlı Yapılandırma</span> menüsüne tıklayın.',
  'resources.register.worker.step3':
    '<span class="bold-text">Genel</span> sekmesine tıklayın.',
  'resources.register.worker.step4':
    'Hizmet rolü olarak <span class="bold-text">İşçi Düğüm</span>\'ü seçin.',
  'resources.register.worker.step5':
    '<span class="bold-text">Sunucu URL\'si</span>ni girin: {url}.',
  'resources.register.worker.step6':
    '<span class="bold-text">Token</span>\'ı yapıştırın.',
  'resources.register.worker.step7':
    'Ayarları uygulamak için <span class="bold-text">Yeniden Başlat</span>\'a tıklayın.',
  'resources.register.install.title': '{os} üzerine GPUStack kur',
  'resources.register.download':
    '<a href={url} target="_blank">Yükleyiciyi</a> indirip kurun. Yalnızca desteklenen: {versions}.',
  'resource.register.maos.support': 'Apple Silicon (M serisi), macOS 14+',
  'resource.register.windows.support': 'Win 10, Win 11',
  'resources.model.instance': 'Model Örneği',
  'resources.worker.download.privatekey': 'Özel Anahtarı İndir',
  'resources.modelfiles.form.exsting': 'İndirilmiş',
  'resources.modelfiles.form.added': 'Eklenmiş',
  'resources.worker.maintenance.title': 'Sistem Bakımı',
  'resources.worker.maintenance.enable': 'Bakım Moduna Gir',
  'resources.worker.maintenance.disable': 'Bakım Modundan Çık',
  'resources.worker.maintenance.remark': 'Not',
  'resources.worker.maintenance.remark.rules':
    'Lütfen bakım notlarını girin',
  'resources.worker.maintenance.tips':
    'Bakım moduna girildiğinde, düğüm yeni model dağıtım görevlerini zamanlamayı durduracaktır. Çalışan örnekler etkilenmez.',
  'resources.worker.noCluster.tips':
    'Kullanılabilir küme yok. Lütfen düğüm eklemeden önce bir küme oluşturun.',
  'resources.metrics.details': 'İzleme'
};
