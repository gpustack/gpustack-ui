export default {
  'clusters.title': 'Küme',
  'clusters.table.provider': 'Sağlayıcı',
  'clusters.table.deployments': 'Dağıtımlar',
  'clusters.button.add': 'Küme Ekle',
  'clusters.button.addCredential': 'Bulut Kimlik Bilgisi Ekle',
  'clusters.button.editCredential': 'Bulut Kimlik Bilgisini Düzenle',
  'clusters.filterBy.cluster': 'Kümeye göre filtrele',
  'clusters.add.cluster': '{cluster} Kümesi Ekle',
  'clusters.edit.cluster': '{cluster} Düzenle',
  'clusters.provider.custom': 'Özel',
  'clusters.button.register': 'Küme Kaydet',
  'clusters.button.addNodePool': 'İşçi Havuzu Ekle',
  'clusters.button.add.credential': '{provider} Kimlik Bilgisi Ekle',
  'clusters.credential.title': 'Bulut Kimlik Bilgisi',
  'clusters.credential.token': 'Erişim Anahtarı',
  'clusters.workerpool.region': 'Bölge',
  'clusters.workerpool.zone': 'Alan',
  'clusters.workerpool.instanceType': 'Örnek Türü',
  'clusters.workerpool.replicas': 'Kopyalar',
  'clusters.workerpool.batchSize': 'Toplu İş Boyutu',
  'clusters.workerpool.osImage': 'İşletim Sistemi İmajı',
  'clusters.workerpool.volumes': 'Birimler',
  'clusters.workerpool.format': 'Format',
  'clusters.workerpool.size': 'Boyut (GiB)',
  'clusters.workerpool.title': 'İşçi Havuzları',
  'clusters.workerpool.cloudOptions': 'Bulut Seçenekleri Ekle',
  'clusters.workerpool.volumes.add': 'Birim Ekle',
  'clusters.create.provider.self': 'Barındırılan',
  'clusters.create.provider.cloud': 'Bulut Sağlayıcı',
  'clusters.create.steps.selectProvider': 'Sağlayıcı Seç',
  'clusters.create.configBasic': 'Temel Yapılandırma',
  'clusters.create.execCommand': 'Komutu Çalıştır',
  'clusters.create.supportedGpu': 'Desteklenen GPU\'lar',
  'clusters.create.skipfornow': 'Şimdilik Atla',
  'clusters.create.noImages': 'Kullanılabilir imaj yok',
  'clusters.create.noInstanceTypes': 'Kullanılabilir örnek türü yok',
  'clusters.create.noRegions': 'Kullanılabilir bölge yok',
  'clusters.workerpool.batchSize.desc':
    'İşçi havuzunda eşzamanlı olarak oluşturulan işçi düğüm sayısı',
  'clusters.create.addworker.tips':
    'Aşağıdaki komutu çalıştırmadan önce lütfen {label} için <a href={link} target="_blank">ön koşulların</a> karşılandığından emin olun.',
  'clusters.create.addCommand.tips':
    'Eklenmesi gereken İşçi Düğümde, kümeye katılması için aşağıdaki komutu çalıştırın.',
  'clusters.create.register.tips':
    'Eklenmesi gereken Kubernetes kümesinde, düğümlerini kümeye katılması için aşağıdaki komutu çalıştırın.',
  'cluster.create.checkEnv.tips':
    'Ortamın hazır olup olmadığını kontrol etmek için aşağıdaki komutu kullanın.',
  'cluster.provider.comingsoon': 'Yakında',
  'clusters.addworker.nvidiaNotes-01':
    'Birden fazla çıkış IP\'si varsa, işçi düğümün kullanmasını istediğinizi belirtin. Lütfen <span class="bold-text">hostname -I | xargs -n1</span> ile kontrol edin.',
  'clusters.addworker.nvidiaNotes-02':
    'İşçi düğümde zaten bir model dizini varsa, bağlamak için yolu belirtebilirsiniz.',
  'clusters.addworker.hygonNotes': `<span class="bold-text">/opt/hyhal</span> veya <span class="bold-text">/opt/dtk</span> mevcut değilse, ilgili Hygon kurulum yollarına işaret eden sembolik bağlantılar oluşturun, örneğin: 
  <span class="desc-fill">ln -s /path/to/hyhal /opt/hyhal</span>
  <span class="desc-fill">ln -s /path/to/dtk /opt/dtk</span>.`,
  'clusters.addworker.corexNotes': `<span class="bold-text">/usr/local/corex</span> dizini mevcut değilse, Iluvatar SDK kurulum yoluna sembolik bağlantı oluşturun:  
<span class="bold-text">ln -s /path/to/corex /usr/local/corex</span>.`,
  'clusters.addworker.metaxNotes': `<span class="bold-text">/opt/mxdriver</span> veya <span class="bold-text">/opt/maca</span> dizini mevcut değilse, MetaX sürücü ve SDK kurulum yoluna sembolik bağlantı oluşturun:  
<span class="desc-fill">ln -s /path/to/mxdriver /opt/mxdriver</span>
<span class="desc-fill">ln -s /path/to/maca /opt/maca</span>.`,
  'clusters.addworker.cambriconNotes': `<span class="bold-text">/usr/local/neuware</span> dizini mevcut değilse, Cambricon kurulum yoluna sembolik bağlantı oluşturun:  
<span class="bold-text">ln -s /path/to/neuware /usr/local/neuware</span>.`,
  'clusters.addworker.hygonNotes-02':
    'Cihaz algılama başarısız olursa, <span class="bold-text">--env ROCM_SMI_LIB_PATH=/opt/hyhal/lib</span> parametresini kaldırmayı deneyin.',
  'clusters.addworker.selectCluster': 'Küme Seç',
  'clusters.addworker.selectCluster.tips':
    '<span class="bold-text">Docker dışı</span> kümeler için lütfen Kümeler sayfasından küme kaydı oluşturun veya işçi havuzlarını yönetin.',
  'clusters.addworker.selectGPU': 'GPU Üreticisi Seç',
  'clusters.addworker.checkEnv': 'Ortamı Kontrol Et',
  'clusters.addworker.specifyArgs': 'Argümanları Belirle',
  'clusters.addworker.runCommand': 'Komutu Çalıştır',
  'clusters.addworker.specifyWorkerIP': 'İşçi Düğüm IP\'si',
  'clusters.addworker.detectWorkerIP': 'İşçi Düğüm IP\'sini Otomatik Algıla',
  'clusters.addworker.specifyWorkerAddress': 'İşçi Düğüm Harici Adresi',
  'clusters.addworker.detectWorkerAddress': 'İşçi Düğüm Harici Adresi',
  'clusters.addworker.detectWorkerAddress.tips':
    'Belirtilmezse İşçi Düğüm IP\'si varsayılır.',
  'clusters.addworker.externalIP.tips':
    'VPC veya özel ağda çalıştırılıyorsa, lütfen GPUStack Sunucusuna erişilebilir İşçi Düğüm harici adresini belirtin.',
  'clusters.addworker.enterWorkerIP': 'İşçi düğüm IP\'sini girin',
  'clusters.addworker.enterWorkerIP.error': 'Lütfen işçi düğüm IP\'sini girin.',
  'clusters.addworker.enterWorkerAddress': 'İşçi düğüm harici adresini girin',
  'clusters.addworker.enterWorkerAddress.error':
    'Lütfen işçi düğüm harici adresini girin.',
  'clusters.addworker.extraVolume': 'Ek Birim Bağlama',
  'clusters.addworker.cacheVolume': 'Model Önbellek Birimi Bağlama',
  'clusters.addworker.cacheVolume.tips':
    'Model önbellek dizinini özelleştirmek istiryorsanız, bağlamak için yolu belirtebilirsiniz.',
  'clusters.addworker.configSummary': 'Yapılandırma Özeti',
  'clusters.addworker.gpuVendor': 'GPU Üreticisi',
  'clusters.addworker.workerIP': 'İşçi Düğüm IP\'si',
  'clusters.addworker.workerExternalIP': 'İşçi Düğüm Harici Adresi',
  'clusters.addworker.notSpecified': 'Belirtilmedi',
  'clusters.addworker.autoDetect': 'Otomatik',
  'clusters.addworker.extraVolume.holder':
    'örn. /data/models (yol / ile başlamalıdır). Birden fazla yolu virgülle ayırın.',
  'clusters.addworker.cacheVolume.holder':
    'örn. /data/cache (yol / ile başlamalıdır)',
  'clusters.addworker.vendorNotes.title': '{vendor} Cihaz Notları',
  'clusters.button.genToken':
    'Yeni token oluşturmanız mı gerekiyor? <a href="{link}" target="_blank">Buraya tıklayın</a>.',
  'clusters.addworker.amdNotes-01': `<span class="bold-text">/opt/rocm</span> dizini mevcut değilse, lütfen ROCm kurulum yoluna işaret eden sembolik bağlantı oluşturun: <span class="bold-text">ln -s /path/to/rocm /opt/rocm</span>.`,
  'clusters.addworker.message.success_single':
    '{count} yeni işçi düğüm kümeye eklendi.',
  'clusters.addworker.message.success_multiple':
    '{count} yeni işçi düğüm kümeye eklendi.',
  'clusters.create.serverUrl': 'GPUStack Sunucu URL\'si',
  'clusters.create.workerConfig': 'İşçi Düğüm Yapılandırması',
  'clusters.addworker.containerName': 'İşçi Düğüm Konteyner Adı',
  'clusters.addworker.containerName.tips':
    'İşçi düğüm konteyneri için bir ad belirtin.',
  'clusters.addworker.dataVolume': 'GPUStack Veri Birimi',
  'clusters.addworker.dataVolume.tips':
    'GPUStack için veri depolama yolu belirtin.',
  'clusters.table.ip.internal': 'Dahili',
  'clusters.table.ip.external': 'Harici',
  'clusters.form.serverUrl.tips':
    'İşçi düğüm GPUStack Sunucusuna doğrudan erişemiyorsa, harici olarak erişilebilir bir GPUStack hizmet URL\'si belirtin.',
  'clusters.form.setDefault': 'Varsayılan Olarak Ayarla',
  'clusters.form.setDefault.tips': 'Dağıtım için varsayılan.',
  'clusters.addworker.noClusters': 'Kullanılabilir Docker kümesi bulunamadı',
  'clusters.create.steps.complete.tips': 'Küme başarıyla oluşturuldu!',
  'clusters.create.steps.complete': 'Tamamla',
  'clusters.create.steps.configure': 'Yapılandır',
  'clusters.create.dockerTips1': 'Sonraki adım, bu kümeye işçi düğüm ekleyin.',
  'clusters.create.dockerTips2':
    'Bu adımı atlayabilir ve daha sonra küme listesinden ekleyebilirsiniz.',
  'clusters.create.k8sTips1': 'Sonraki adım, mevcut Kubernetes kümesini kaydedin.',
  'clusters.create.k8sTips2':
    'Bu adımı atlayabilir ve daha sonra küme listesinden kaydedebilirsiniz.',
  'clusters.addworker.theadNotes':
    '<span class="bold-text">/usr/local/PPU_SDK</span> dizini mevcut değilse, lütfen T-Head PPU SDK kurulum yoluna işaret eden sembolik bağlantı oluşturun: <span class="bold-text">ln -s /path/to/PPU_SDK /usr/local/PPU_SDK</span>.',
  'clusters.addworker.theadNotes-02':
    'T-Head PPU, cihaz enjeksiyonu için Container Device Interface (CDI) kullanır ve CDI oluşturma için <span class="bold-text">/var/run/cdi</span> dizininin kullanılabilir olmasını gerektirir.',
  'clusters.addworker.nvidiaNotes':
    'GPUStack v2.1\'deki yerleşik çıkarım altyapıları <span class="bold-text">CUDA 12.6+</span> gerektirir. Lütfen NVIDIA sürücü sürümünüzün <span class="bold-text">560</span> veya daha yeni olduğundan emin olun.'
};
