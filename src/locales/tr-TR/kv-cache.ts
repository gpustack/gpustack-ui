export default {
  'kvCache.title': 'Önbellek Hizmeti',
  'kvCache.button.add': 'Önbellek Hizmeti Ekle',
  'kvCache.providerSelect.title': 'Sağlayıcı Seç',
  'kvCache.provider.source.builtin': 'Built-in',
  'kvCache.provider.source.community': 'Community',
  'kvCache.provider.source.partner': 'GPUStack Sertifikalı İş Ortağı',
  'kvCache.button.viewLogs': 'Günlükleri Görüntüle',
  'kvCache.edit.recreate.tips':
    'Değişiklikler, örnekler silinip yeniden oluşturulduktan sonra etkili olur.',
  'kvCache.table.provider': 'Provider',
  'kvCache.table.worker': 'Worker',
  'kvCache.form.provider': 'Provider',
  'kvCache.form.version': 'Version',
  'kvCache.form.version.custom': 'Custom',
  'kvCache.form.image': 'Konteyner İmajı',
  'kvCache.check.ok.perNode':
    'Kaynaklar yeterli; {count} işçi düğümün her birinde bir örnek çalışacak.',
  'kvCache.check.ok.singleton':
    'Kaynaklar yeterli; örnek {worker} işçi düğümünde çalışacak.',
  'kvCache.check.noWorkers': 'Seçiciyle eşleşen işçi düğüm yok.',
  'kvCache.check.ok.store':
    'Deployable: {replicas} store replica(s) x {size} GiB fit the matching workers',
  'kvCache.check.store.insufficientWorkers':
    'Only {count} worker(s) match the selector; {replicas} store replicas requested',
  'kvCache.check.store.exceedsFree':
    'Only {count} matching worker(s) have {size} GiB free memory; {replicas} replicas requested',
  'kvCache.form.worker.autoTips':
    'Optional - leave empty to let the scheduler place the instance',
  'kvCache.form.workerSelector.scopeTips':
    'Limits instance placement to workers matching all labels; leave empty to allow every worker.',
  'kvCache.form.env.componentTips': 'Applies to every component of the service',
  'kvCache.check.unsupportedAccel':
    '{total} hedef işçi düğümden {count} tanesi, bu sürümde imajı bulunmayan hızlandırıcılar ({backends}) kullanıyor; oradaki örnekler başlatılamayacak',
  'kvCache.form.ramSize.exceedsTotal':
    '{worker} işçi düğümünün bellek kapasitesini ({total} GiB) aşıyor.',
  'kvCache.form.ramSize.exceedsFree':
    '{worker} işçi düğümündeki boş belleği ({free} GiB boş) aşıyor; önbellek sunucusu bellek yetersizliğinden sonlandırılabilir.',
  'kvCache.form.workerSelector': 'İşçi Düğüm Etiket Seçici',
  'kvCache.form.workerSelector.tips':
    'Tüm etiketlerle eşleşen her işçi düğümde bir örnek çalıştırır; tüm işçi düğümleri kapsamak için boş bırakın.',
  'kvCache.form.managementUrl': "Yönetim URL'si",
  'kvCache.form.managementUrl.tips':
    'Motorun sağladığı yönetim arayüzüne bağlantı; hizmet adının yanında bağlantı olarak gösterilir',
  'kvCache.form.managementUrl.invalid': "Geçerli bir http(s) URL'si girin",
  'kvCache.button.management': "Yönetim URL'si",
  'kvCache.form.advanced': 'Advanced',
  'kvCache.form.parameters': 'Parameters',
  'kvCache.form.env': 'Ortam Değişkenleri',
  'kvCache.form.l2Backend': 'L2 Depolama Altyapısı',
  'kvCache.form.l2Backend.add': 'Altyapı Ekle',
  'kvCache.form.l2Backend.backend': 'Backend',
  'kvCache.form.l2Backend.type': 'Type',
  'kvCache.form.l2Backend.customOptions': 'Custom Options',
  'kvCache.form.l2Backend.tips':
    'KV önbelleğini daha büyük ikincil depolama katmanlarına taşırır. Girdiler sırayla önceliklendirilir: okumalar ilkini tercih eder, yazmalar hepsine gider.',
  'kvCache.detail.overview': 'Overview',
  'kvCache.detail.perWorker': 'işçi düğüm başına',
  'kvCache.detail.capacity': 'Capacity',
  'kvCache.detail.instances': 'Instances',
  'kvCache.edit.title': '{name} düzenle',
  'kvCache.instances.loadFailed': 'Örnekler yüklenemedi; yeniden deneniyor',
  'kvCache.instances.empty': 'Henüz örnek yok',
  'kvCache.detail.monitoring': 'Monitoring',
  'kvCache.detail.hitRate': 'İsabet Oranı',
  'kvCache.detail.usage': 'L1 Önbellek Kullanımı',
  'kvCache.detail.l2Usage': 'L2 Önbellek Kullanımı',
  'kvCache.detail.lookupTraffic': 'Arama Trafiği',
  'kvCache.detail.usageRatio': 'L1 Kullanım Oranı',
  'kvCache.detail.throughput': 'Throughput',
  'kvCache.detail.noMetrics': 'Metrik verisi yok',
  'kvCache.detail.metricsUnavailable': 'Metrikler kullanılamıyor',
  'kvCache.detail.aggregated': 'Aggregated',
  'kvCache.detail.perInstance': 'Örnek Başına',
  'kvCache.detail.hitTokens': 'İsabetli Token',
  'kvCache.detail.hitTokens.tips':
    'Çıkarım motorunun bildirdiği üzere, seçilen zaman aralığında paylaşılan önbellekten karşılanan token sayısı',
  'kvCache.detail.queriedTokens': 'Sorgulanan Token',
  'kvCache.detail.queriedTokens.tips':
    'Çıkarım motorunun bildirdiği üzere, seçilen zaman aralığında paylaşılan önbellekte aranan token sayısı',
  'kvCache.detail.hitRate.engineTips':
    'Seçilen zaman aralığında, çıkarım motorunun kendi harici önbellek isabet sayaçlarından alınır. Şu an yalnızca vLLM; diğer altyapılar - gösterir',
  'kvCache.detail.view': 'View',
  'kvCache.detail.modelInstances': 'Bağlı Model Örnekleri'
};
