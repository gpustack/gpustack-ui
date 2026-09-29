export default {
  'routes.title': 'Yönlendirmeler',
  'routes.button.add': 'Yönlendirme Ekle',
  'routes.table.routeTargets': 'Yönlendirme Hedefleri',
  'routes.table.traffic': 'Trafik Payı',
  'routes.table.setAsFallback': 'Yedek Olarak Ayarla',
  'routes.form.target.title': 'Yönlendirme Hedefleri',
  'routes.form.target.add': 'Yönlendirme Hedefi Ekle',
  'routes.form.target.advanced': 'Gelişmiş',
  'routes.form.target.fallback': 'Yedek Yönlendirme Hedefi',
  'routes.form.target.weight': 'Ağırlık',
  'routes.form.target.remove': 'Kaldır',
  'routes.form.target.model': 'Model',
  'routes.form.metadata.title': 'Meta Veriler',
  'routes.form.metadata.add': 'Meta Veri Ekle',
  'routes.table.label.fallback': 'Yedek',
  'routes.form.metadata.size': 'Boyut',
  'routes.form.metadata.activeSize': 'Aktif Boyut',
  'routes.form.metadata.tags': 'Etiketler',
  'routes.form.metadata.maxTokens': 'Maks. Token',
  'routes.form.metadata.dimension': 'Boyutlar',
  'routes.form.metadata.license': 'Lisanslar',
  'routes.form.metadata.releaseDate': 'Yayınlanma Tarihi',
  'routes.form.metadata.languages': 'Diller',
  'routes.form.metadata.icons': 'Simge',
  'routes.form.metadata.uploadIcon': 'Simge Yükle',
  'routes.form.fallback.warning':
    'Yedek yönlendirme hedefi değişiklikleri bir dakika sonra geçerli olur.',
  'routes.form.weight.tips': 'Hedef trafik ağırlığı.',
  'routes.lb.routeBy': 'Yönlendirme Şekli',
  'routes.table.lbMode': 'Yönlendirme Şekli',
  'routes.lb.mode.weighted': 'Hedef Ağırlığı',
  'routes.lb.mode.policy': 'Politika',
  'routes.lb.form.mode.weighted': 'Hedef Ağırlığı',
  'routes.lb.form.mode.policy': 'Politika',
  'routes.lb.form.mode.weighted.tips':
    'Trafiği ağırlıklara göre hedefler arasında bölün; her hedefin ağırlığı 0 dan büyük olmalıdır.',
  'routes.lb.form.mode.policy.tips':
    'Hedefleri etkin politika eklentileri seçer (Politika); hiçbir eklenti etkin değilse round robin kullanılır.',
  'routes.lb.mode.invalid': 'Geçersiz',
  'routes.lb.mode.invalid.tooltip':
    'Karışık ağırlıklar algılandı: bu rota kullanılamaz — ağ geçidi ona hizmet vermeyi reddediyor. Tüm hedef ağırlıklarını >0 ya da tümünü 0 yapın.',
  'routes.lb.sessionAffinity': 'Oturum Benzeşimi',
  'routes.lb.sessionAffinity.tips':
    'Aynı oturumun isteklerini aynı hedefe yönlendirir; oturumlar sıralı bir anahtar zinciri (header veya body anahtarı) ile tanımlanır.',
  'routes.lb.sessionKeys': 'Oturum anahtarları (sıralı, ilk eşleşme)',
  'routes.lb.sessionKeys.source.header': 'Header',
  'routes.lb.sessionKeys.source.bodyKey': 'Body anahtarı',
  'routes.lb.sessionKeys.keyPlaceholder': 'Anahtar adı, örn. session-id',
  'routes.lb.sessionKeys.add': 'Oturum anahtarı ekle',
  'routes.lb.sessionKeys.required':
    'Oturum benzeşimi etkinleştirildiğinde en az bir anahtar gerekli',
  'routes.lb.sessionKeys.keyRequired': 'Anahtar adı girin',
  'routes.lb.leastLoad': 'En Az Bekleyen İstek',
  'routes.lb.leastLoad.tips':
    'Hedefleri uçuştaki istek sayısına göre puanlar ve en az bekleyen isteğe sahip olanı tercih eder.',
  'routes.lb.influence': 'Ağırlık',
  'routes.lb.weight.mixed':
    'Ağırlıklı modda her hedefin ağırlığı 0 dan büyük olmalıdır. Politika yönlendirme için LB modunu değiştirin.',
  'routes.form.target.maxRunningRequests': 'Örnek Başına Maks. Bekleyen İstek',
  'routes.lb.systemone': 'Karar Servisi Yönlendirmesi',
  'routes.lb.systemone.tips':
    'Hedefleri görev zorluğuna göre puanlar: her istek (kısaltılmış) model seçim sorusuyla birlikte Jev uyumlu bir karar servisine gönderilir ve yanıt ağırlıklı bir oya dönüşür. Karar hatası, zaman aşımı veya 2xx olmayan yanıt durumunda diğer eklentilere sessizce geri dönülür.',
  'routes.lb.systemone.provider': 'Karar Servisi',
  'routes.lb.systemone.provider.tips':
    'Bir TypeSafe karar servisi sağlayıcısı seçin.',
  'routes.lb.systemone.provider.required': 'Lütfen bir karar servisi seçin',
  'routes.lb.systemone.decisionModel': 'Karar Modeli',
  'routes.lb.systemone.decisionModel.tips':
    'Rota düzeyinde karar modeli; seçenekler seçilen sağlayıcının önbelleğindeki motorlardan okunur. Öncelik: bu alan > sağlayıcının modeli > servis varsayılanı.',
  'routes.lb.systemone.decisionModel.required': 'Lütfen bir karar modeli seçin',
  'routes.lb.systemone.instructions': 'Talimatlar',
  'routes.lb.systemone.instructions.tips':
    'Karar servisine gönderilen model seçim sorusu için ek yönlendirmedir.',
  'routes.lb.systemone.instructions.required': 'Lütfen talimatları girin',
  'routes.lb.systemone.criteria': 'Model Kriterleri',
  'routes.lb.systemone.criteria.add': 'Kriter ekle',
  'routes.lb.systemone.criteria.tips':
    'Model adı → yetenek açıklaması: karar servisinin her istek için model seçme dayanağıdır.',
  'routes.lb.systemone.criteria.generate': 'Hedeflerden oluştur',
  'routes.lb.systemone.criteria.modelPlaceholder': 'Model adı',
  'routes.lb.systemone.criteria.descPlaceholder':
    'Yetenek açıklaması, örn. en güçlü akıl yürütme / ucuz ve hızlı',
  'routes.lb.systemone.criteria.required':
    'Akıllı yönlendirme etkinleştirildiğinde en az bir model kriteri gereklidir',
  'routes.lb.systemone.criteria.nameRequired':
    'Her kriter için model adını girin',
  'routes.lb.systemone.criteria.valueRequired':
    'Her model kriteri için açıklamayı doldurun',
  'routes.lb.systemone.criteria.duplicate':
    'Kriterlerdeki model adları benzersiz olmalıdır'
};
