export default {
  'kvCache.title': 'Önbellek Hizmeti',
  'kvCache.source.manage': 'Sağlayıcıları Yönet',
  'kvCache.source.builtin':
    'bu sürümün getirdiği önbellek sağlayıcıları ve kurulu eklentilerin eklediği sağlayıcılar',
  'kvCache.button.add': 'Önbellek Hizmeti Ekle',
  'kvCache.providerSelect.title': 'Sağlayıcı Seç',
  'kvCache.provider.source.builtin': 'Yerleşik',
  'kvCache.provider.source.community': 'Topluluk',
  'kvCache.provider.source.partner': 'GPUStack Sertifikalı İş Ortağı',
  'kvCache.button.viewLogs': 'Günlükleri Görüntüle',
  'kvCache.edit.recreate.tips':
    'Değişiklikler, örnekler silinip yeniden oluşturulduktan sonra etkili olur.',
  'kvCache.table.provider': 'Sağlayıcı',
  'kvCache.table.worker': 'İşçi Düğüm',
  'kvCache.form.provider': 'Sağlayıcı',
  'kvCache.form.version': 'Sürüm',
  'kvCache.form.version.custom': 'Özel',
  'kvCache.form.image': 'Konteyner İmajı',
  'kvCache.check.ok.perNode':
    'Kaynaklar yeterli; {count} işçi düğümün her birinde bir örnek çalışacak.',
  'kvCache.check.ok.singleton':
    'Kaynaklar yeterli; örnek {worker} işçi düğümünde çalışacak.',
  'kvCache.check.noWorkers': 'Seçiciyle eşleşen işçi düğüm yok.',
  'kvCache.check.ok.store':
    'Dağıtılabilir: {replicas} depolama kopyası x {size} GiB eşleşen işçi düğümlere sığıyor',
  'kvCache.check.store.insufficientWorkers':
    'Seçiciyle yalnızca {count} işçi düğüm eşleşiyor; {replicas} depolama kopyası istendi',
  'kvCache.check.store.exceedsFree':
    'Eşleşen işçi düğümlerden yalnızca {count} tanesinde {size} GiB boş bellek var; {replicas} kopya istendi',
  'kvCache.form.worker.autoTips':
    'İsteğe bağlı — örneği zamanlayıcının yerleştirmesi için boş bırakın',
  'kvCache.form.workerSelector.scopeTips':
    'Örnek yerleşimini tüm etiketlerle eşleşen işçi düğümlerle sınırlar; her işçi düğüme izin vermek için boş bırakın.',
  'kvCache.form.env.componentTips': 'Hizmetin her bileşenine uygulanır',
  'kvCache.check.unsupportedAccel':
    '{total} hedef işçi düğümden {count} tanesi, bu sürümde imajı bulunmayan hızlandırıcılar ({backends}) kullanıyor; oradaki örnekler başlatılamayacak',
  'kvCache.check.noCpuImage':
    '{total} hedef işçi düğümden {count} tanesinde hızlandırıcı yok ve bu sürümün hızlandırıcı olmadan çalışan bir imajı yok; bu düğümlerdeki örnekler başlatılamayacak',
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
  'kvCache.form.advanced': 'Gelişmiş',
  'kvCache.form.parameters': 'Parametreler',
  'kvCache.form.parameters.noComponent':
    'Yukarıdaki ayarlar bu sağlayıcının tüm bileşenlerini kapattı; parametre geçirilecek bir şey yok.',
  'kvCache.form.env': 'Ortam Değişkenleri',
  'kvCache.form.l2Backend': 'L2 Depolama Altyapısı',
  'kvCache.form.l2Backend.add': 'Altyapı Ekle',
  'kvCache.form.l2Backend.backend': 'Altyapı',
  'kvCache.form.l2Backend.type': 'Tür',
  'kvCache.form.l2Backend.customOptions': 'Özel Seçenekler',
  'kvCache.form.l2Backend.tips':
    'KV önbelleğini daha büyük ikincil depolama katmanlarına taşırır. Girdiler sırayla önceliklendirilir: okumalar ilkini tercih eder, yazmalar hepsine gider.',
  'kvCache.detail.overview': 'Genel Bakış',
  'kvCache.detail.perWorker': 'işçi düğüm başına',
  'kvCache.detail.capacity': 'Kapasite',
  'kvCache.detail.instances': 'Örnekler',
  'kvCache.edit.title': '{name} düzenle',
  'kvCache.instances.loadFailed': 'Örnekler yüklenemedi; yeniden deneniyor',
  'kvCache.instances.empty': 'Henüz örnek yok',
  'kvCache.detail.monitoring': 'İzleme',
  'kvCache.detail.hitRate': 'İsabet Oranı',
  'kvCache.detail.externalHitRate': 'Harici Önbellek İsabet Oranı',
  'kvCache.detail.usage': 'L1 Önbellek Kullanımı',
  'kvCache.detail.l2Usage': 'L2 Önbellek Kullanımı',
  'kvCache.detail.lookupTraffic': 'Arama Trafiği',
  'kvCache.detail.usageRatio': 'L1 Kullanım Oranı',
  'kvCache.detail.throughput': 'Verim',
  'kvCache.detail.noMetrics': 'Metrik verisi yok',
  'kvCache.detail.metricsUnavailable': 'Metrikler kullanılamıyor',
  'kvCache.detail.aggregated': 'Toplu',
  'kvCache.detail.perInstance': 'Örnek Başına',
  'kvCache.detail.hitTokens': 'İsabetli Token',
  'kvCache.detail.hitTokens.tips':
    'Çıkarım motorunun bildirdiği üzere, seçilen zaman aralığında paylaşılan önbellekten karşılanan token sayısı',
  'kvCache.detail.queriedTokens': 'Sorgulanan Token',
  'kvCache.detail.queriedTokens.tips':
    'Çıkarım motorunun bildirdiği üzere, seçilen zaman aralığında paylaşılan önbellekte aranan token sayısı',
  'kvCache.detail.hitRate.engineTips':
    'Seçilen zaman aralığında, çıkarım motorunun kendi harici önbellek isabet sayaçlarından alınır. Şu an yalnızca vLLM; diğer altyapılar - gösterir',
  'kvCache.detail.view': 'Görünüm',
  'kvCache.detail.modelInstances': 'Bağlı Model Örnekleri'
};
