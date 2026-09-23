export default {
  'models.button.deploy': 'Model Dağıt',
  'models.button.exportYaml': 'YAML Dışa Aktar',
  'models.button.importYaml': 'YAML İçe Aktar',
  'models.form.yamlFile': 'YAML Dosyası',
  'models.import.checking': 'Denetleniyor…',
  'models.import.hint.nothing': 'İçe aktarılacak bir şey yok',
  'models.import.pickFile': 'Dosya seç',
  'models.import.empty.title': 'YAML dosyası içe aktar',
  'models.import.empty.description':
    'Dağıtımları tanımlayan bir dosya seçin. İçe aktarmadan önce denetlenir ve yazılacak her şey farkta eksiksiz gösterilir.',
  'models.import.cluster.follow': 'Dosyadaki gibi',
  'models.import.loaded':
    '{count} dağıtım · {cluster} kümesinin şu anki hâliyle aynı',
  'models.import.loaded.hint':
    'Bu belge {cluster} kümesinin şu anki hâliyle aynı, yazılacak bir şey yok.',
  'models.import.counts':
    '{count} dağıtım · {cluster} kümesine · {changes} değişiklik',
  'models.import.parsed': '{count} dağıtım',
  'models.import.parsed.invalid': '{count} tanesi içe aktarılamıyor',
  'models.import.fieldsDoc': 'Alan başvurusu',
  'models.import.nav.invalid': 'İçe aktarılamıyor',
  'models.import.scope.all': 'Tüm dağıtımlar ({count})',
  'models.import.scope.whole': 'Tüm belge',
  'models.import.scope.wholeShort': 'Tümü',
  'models.import.pane.current': 'Kümedeki hali · salt okunur',
  'models.import.pane.draft': 'İçe aktarılacak · düzenlenebilir',
  'models.import.pane.absent': 'Bu adda bir dağıtım yok',
  'models.import.pane.none': 'Bu kümede eşleşen dağıtım yok',
  'models.import.pane.allNew':
    'Buradaki dağıtımların hepsi yeni — hiçbiri değiştirilmiyor',
  'models.import.pane.waiting': 'Henüz karşılaştırılacak bir şey yok',
  'models.import.entry': '{index}. dağıtım',
  'models.import.entry.invalid': '{index}. dağıtım içe aktarılamıyor',
  'models.import.summary':
    '{create} oluşturulacak, {update} güncellenecek, {unchanged} değişmedi.',
  'models.import.summary.replaces':
    'Güncelleme, dağıtımı dosyadaki içerikle değiştirir.',
  'models.import.action.create': 'Oluştur',
  'models.import.action.update': 'Güncelle',
  'models.import.action.unchanged': 'Değişmedi',
  'models.import.changes': '{count} değişiklik',
  'models.import.blocked':
    '{count} dağıtım içe aktarılamıyor. Devam etmek için bunları düzeltin.',
  'models.import.overwrite.title': 'İçe aktarmayı onayla',
  'models.import.overwrite.confirm':
    'Aşağıdaki {count} mevcut dağıtım dosyadaki içerikle tümüyle değiştirilecek. Dosyada yer almayan ayarlar varsayılan değerlerine döner.',
  'models.import.overwrite.rest':
    'Ayrıca {create} tane oluşturulacak, {unchanged} tanesi değişmeyecek.',
  'models.import.invalid':
    'Dosya içe aktarılamıyor. Aşağıdaki sorunları düzeltin, yeniden denetlenir.',
  'models.title': 'Modeller',
  'models.title.edit': 'Modeli Düzenle',
  'models.title.duplicate': 'Modeli Klonla',
  'models.table.models': 'modeller',
  'models.table.name': 'Model Adı',
  'models.form.source': 'Kaynak',
  'models.form.repoid': 'Depo Kimliği',
  'models.form.repoid.desc': 'Yalnızca .gguf formatı desteklenir',
  'models.form.filename': 'Dosya Adı',
  'models.form.replicas': 'Kopyalar',
  'models.form.selector': 'Seçici',
  'models.form.env': 'Ortam Değişkenleri',
  'models.form.configurations': 'Yapılandırmalar',
  'models.form.s3address': 'S3 Adresi',
  'models.form.partialoffload.tips': `CPU aktarımı etkinleştirildiğinde, GPU kaynakları yetersiz olduğunda GPUStack CPU belleği ayırır. Hibrit CPU+GPU veya tam CPU çıkarımı kullanmak için çıkarım altyapısını doğru şekilde yapılandırmanız gerekir.`,
  'models.form.distribution.tips': `Bir işçi düğümün kaynakları yetersiz olduğunda, modelin katmanlarının bir kısmının tekli veya çoklu uzak işçi düğümlere aktarılmasına olanak tanır.`,
  'models.openinplayground': 'Deneme Alanında Aç',
  'models.instances': 'örnekler',
  'models.table.replicas.edit': 'Kopyaları Düzenle',
  'model.form.ollama.model': 'Ollama Modeli',
  'model.form.ollamaholder': 'Lütfen model adını seçin veya girin',
  'model.deploy.sort': 'Sırala',
  'model.deploy.search.placeholder': 'Modelleri aramak için <kbd>/</kbd> yazın',
  'model.form.ollamatips':
    "İpucu: Aşağıdakiler GPUStack'te önceden yapılandırılmış Ollama modelleridir. İstediğiniz modeli seçin veya dağıtmak istediğiniz modeli doğrudan sağdaki 【{name}】 giriş kutusuna yazın.",
  'models.sort.name': 'Ad',
  'models.sort.size': 'Boyut',
  'models.sort.likes': 'Beğeniler',
  'models.sort.trending': 'Trend',
  'models.sort.downloads': 'İndirmeler',
  'models.sort.updated': 'Güncellenme',
  'models.search.result': '{count} sonuç',
  'models.data.card': 'Model Kartı',
  'models.available.files': 'Mevcut Dosyalar',
  'models.viewin.hf': "Hugging Face'de Görüntüle",
  'models.viewin.modelscope': "ModelScope'da Görüntüle",
  'models.architecture': 'Mimari',
  'models.search.noresult': 'İlgili model bulunamadı',
  'models.search.nofiles': 'Mevcut dosya yok',
  'models.search.networkerror': 'Ağ bağlantı hatası!',
  'models.search.hfvisit': 'Lütfen şu adrese erişebildiğinizden emin olun',
  'models.search.unsupport':
    'Bu model desteklenmiyor ve dağıtımdan sonra kullanılamayabilir.',
  'models.form.scheduletype': 'Zamanlama Modu',
  'models.form.categories': 'Model Kategorisi',
  'models.form.scheduletype.auto': 'Otomatik',
  'models.form.scheduletype.manual': 'Manuel',
  'models.form.scheduletype.gpu': 'GPU Belirle',
  'models.form.scheduletype.gpuType': 'GPU Türü Belirle',
  'models.form.scheduletype.auto.tips':
    "Mevcut kaynak koşullarına göre model örneklerini uygun GPU'lara otomatik olarak dağıtır.",
  'models.form.scheduletype.manual.tips':
    "Model örneklerinin dağıtılacağı GPU'ları manuel olarak belirlemenize olanak tanır.",
  'models.form.gpuallocation': 'GPU Tahsisi',
  'models.form.gpumode.full': 'Tam',
  'models.form.gpumode.slicing': 'Dilimleme',
  'models.form.gpuType.noSlicedCapacity':
    'Bu GPU türünde dilimlenebilir kapasite yok, lütfen başka bir GPU türü seçin.',
  'models.form.gpuType.noPartitionProfile':
    'Bu GPU türünde kullanılabilir bölüm profili yok, lütfen başka bir GPU türü seçin.',
  'models.form.manual.schedule': 'Manuel Zamanlama',
  'models.table.gpuindex': 'GPU İndeksi',
  'models.table.vgpu': 'vGPU',
  'models.table.vgpu.slice': '{memory}% VRAM / {cores}% İşlem',
  'models.table.backend': 'Altyapılar',
  'models.table.acrossworker': 'İşçi Düğümler Arası Dağıtık',
  'models.table.cpuoffload': 'CPU Aktarımı',
  'models.table.layers': 'Katmanlar',
  'models.form.backend': 'Altyapı',
  'models.form.backend_parameters': 'Altyapı Parametreleri',
  'models.instance.params.configured': 'Kullanıcı Tarafından Yapılandırıldı',
  'models.instance.params.autoInjected': 'Otomatik Enjekte Edilen Parametreler',
  'models.search.gguf.tips':
    'GGUF modelleri llama-box kullanır (Linux, macOS ve Windows destekler).',
  'models.search.vllm.tips':
    'GGUF olmayan modeller ses için vox-box, diğerleri için vLLM (yalnızca x86 Linux) kullanır.',
  'models.search.voxbox.tips':
    'Bir ses modeli dağıtmak için onay kutusunun işaretini kaldırın.',
  'models.form.ollamalink':
    'Daha fazlasını <a href="https://www.ollama.com/library" target="_blank">Ollama Kütüphanesi</a>\'nde bulabilirsiniz.',
  'models.form.backend_parameters.llamabox.placeholder':
    'örn., --ctx-size=8192 (ad ve değeri ayırmak için = veya boşluk kullanın)',
  'models.form.backend_parameters.vllm.placeholder':
    'örn., --max-model-len=8192 (ad ve değeri ayırmak için = veya boşluk kullanın)',
  'models.form.backend_parameters.sglang.placeholder':
    'örn., --context-length=8192 (ad ve değeri ayırmak için = veya boşluk kullanın)',
  'models.form.backend_parameters.vllm.tips':
    '{backend} parametreleri hakkında daha fazla bilgi için <a href={link} target="_blank">buraya tıklayın</a>.',
  'models.logs.pagination.prev': 'Önceki {lines} Satır',
  'models.logs.pagination.next': 'Sonraki {lines} Satır',
  'models.logs.pagination.last': 'Son Sayfa',
  'models.logs.pagination.first': 'İlk Sayfa',
  'models.logs.pagination.jump': 'Sayfaya Git',
  'models.form.localPath': 'Yerel Yol',
  'models.form.filePath': 'Model Yolu',
  'models.form.backendVersion': 'Altyapı Sürümü',
  'models.form.backendVersion.tips':
    '{backend}{version} sürümünü kullanmak için sistem, ilgili sürümü yüklemek üzere çevrimiçi ortamda otomatik olarak sanal ortam oluşturur. GPUStack yükseltmesinden sonra altyapı sürümü sabit kalır. {link}',
  'models.form.gpuselector': 'GPU Seçici',
  'models.form.backend.llamabox':
    'GGUF format modeller için, Linux, macOS ve Windows destekler.',
  'models.form.backend.vllm':
    'NVIDIA, AMD, Ascend, Hygon, Moore Threads, Iluvatar, MetaX, T-Head PPU cihazları için yerleşik destek.',
  'models.form.backend.voxbox':
    "Yalnızca NVIDIA GPU'ları ve CPU'ları destekler.",
  'models.form.backend.mindie': "Yalnızca Ascend NPU'ları destekler.",
  'models.form.backend.sglang':
    'NVIDIA, AMD, Ascend, Moore Threads, MetaX, T-Head PPU cihazları için yerleşik destek.',
  'models.form.search.gguftips':
    "İşçi düğüm olarak macOS veya Windows kullanılıyorsa GGUF'u işaretleyin (ses modelleri için işareti kaldırın).",
  'models.form.button.addlabel': 'Etiket Ekle',
  'models.filter.category': 'Kategoriye göre filtrele',
  'models.list.more.logs': 'Daha Fazla Göster',
  'models.catalog.release.date': 'Yayınlanma Tarihi',
  'models.localpath.gguf.tips.title': 'GGUF biçiminde model',
  'models.localpat.safe.tips.title': 'Safetensors biçiminde model',
  'models.localpath.shared.tips.title': 'Parçalı GGUF format model',
  'models.localpath.gguf.tips':
    ' Model dosyasını belirtin, örn., /data/models/model.gguf.',
  'models.localpath.safe.tips':
    '.safetensors ve config.json dosyaları içeren model dizinini belirtin, örn., /data/models/model.',
  'models.localpath.chunks.tips': `Modelin ilk parça dosyasını belirtin, örn., /data/models/model-00001-of-00004.gguf.`,
  'models.form.replicas.tips':
    'Birden fazla kopya, { api } çıkarım istekleri için yük dengelemeyi etkinleştirir.',
  'models.table.list.empty': 'Henüz model yok!',
  'models.table.list.getStart':
    '<span style="margin-right: 5px;font-size: 13px;">Başlamak için</span> <span style="font-size: 14px;font-weight: 700">DeepSeek-R1-Distill-Qwen-1.5B</span>',
  'models.table.llamaAcrossworker': 'Llama-box İşçi Düğümler Arası',
  'models.table.vllmAcrossworker': 'vLLM İşçi Düğümler Arası',
  'models.form.releases': 'Sürümler',
  'models.form.moreparameters': 'Parametre Açıklaması',
  'models.table.vram.allocated': 'Ayrılan VRAM',
  'models.table.vram.workers': '{n} işçi düğüm',
  'models.instance.workergpu': '{n} düğüm / {m} GPU',
  'models.instance.mainworker': 'Ana İşçi Düğüm (Main)',
  'models.instance.worker': 'İşçi Düğüm',
  'models.instance.workerip': 'İşçi Düğüm IP:Port',
  'models.form.backend.warning':
    'Seçilen altyapı GGUF modellerini desteklemiyor. Lütfen Çıkarım Altyapısına GGUF desteği olan bir altyapı ekleyin.',
  'models.form.backend.warning.gguf':
    'Lütfen seçilen özel altyapının GGUF modellerini desteklediğinden emin olun.',
  'models.form.ollama.warning':
    'Ollama model altyapısını llama-box kullanarak dağıtın.',
  'models.form.backend.warning.llamabox':
    'llama-box altyapısını kullanmak için model dosyasının tam yolunu belirtin (örn., <span style="font-weight: 700">/data/models/model.gguf</span>). Parçalı modeller için ilk parçanın yolunu verin (örn., <span style="font-weight: 700">/data/models/model-00001-of-00004.gguf</span>).',
  'models.form.keyvalue.paste':
    'Birden fazla satır metin yapıştırın, her satırda bir anahtar-değer çifti olmalıdır. Anahtar ve değer = işareti ile ayrılır, farklı anahtar-değer çiftleri satır sonları ile ayrılır.',
  'models.form.files': 'dosyalar',
  'models.table.status': 'Durum',
  'models.form.submit.anyway': 'Yine de Gönder',
  'models.form.evaluating': 'Model Uyumluluğu Değerlendiriliyor',
  'models.form.incompatible': 'Uyumsuzluk Tespit Edildi',
  'models.form.nativeAnthropicApi': 'Yerel Anthropic API',
  'models.form.nativeAnthropicApi.tips':
    'Çıkarım sunucusu Anthropic Messages API’sini kendisi uyguluyorsa (örneğin yeni vLLM sürümleri) etkinleştirin; /v1/messages istekleri olduğu gibi iletilir. Kapalıyken de /v1/messages çalışır, ancak önce /v1/chat/completions biçimine dönüştürülür.',
  'models.form.restart.onerror': 'Hata Durumunda Otomatik Yeniden Başlat',
  'models.form.restart.onerror.tips':
    'Hata oluştuğunda otomatik olarak yeniden başlatmayı dener.',
  'models.form.check.params': 'Yapılandırma kontrol ediliyor...',
  'models.form.check.passed': 'Uyumluluk Kontrolü Başarılı',
  'models.form.check.claims':
    'Model yaklaşık {vram} VRAM ve {ram} RAM tüketecektir.',
  'models.form.check.claims2': 'Model yaklaşık {vram} VRAM tüketecektir.',
  'models.form.check.claims3': 'Model yaklaşık {ram} RAM tüketecektir.',
  'models.form.check.claims.group':
    'Grup toplamda yaklaşık {vram} VRAM ve {ram} RAM tüketecektir.',
  'models.form.check.claims.role':
    '{role} × {replicas}: replika başına yaklaşık {vram} VRAM',
  'models.form.check.claims.role.total':
    '{role} × {replicas}: toplamda yaklaşık {vram} VRAM',
  'models.form.check.claims.role.ram':
    '{role} × {replicas}: toplamda yaklaşık {ram} RAM',
  'models.form.update.tips':
    'Değişiklikler yalnızca örneği silip yeniden oluşturduğunuzda geçerli olur.',
  'models.table.download.progress': 'İlerleme',
  'models.table.button.apiAccessInfo': 'API Erişim Bilgisi',
  'models.table.button.apiAccessInfo.tips': `Bu modeli üçüncü taraf uygulamalarla entegre etmek için şu bilgileri kullanın: erişim URL'si, model adı ve API anahtarı. Bu kimlik bilgileri, model hizmetine düzgün bağlantı ve kullanım sağlamak için gereklidir.`,
  'models.table.apiAccessInfo.endpoint': "Erişim URL'si",
  'models.table.apiAccessInfo.modelName': 'Model Adı',
  'models.table.apiAccessInfo.apikey': 'API Anahtarı',
  'models.table.apiAccessInfo.openaiCompatible': 'OpenAI Uyumlu',
  'models.table.apiAccessInfo.anthropicCompatible': 'Anthropic Uyumlu',
  'models.table.apiAccessInfo.jinaCompatible': 'Jina Uyumlu',
  'models.table.apiAccessInfo.gotoCreate': 'Oluşturmaya Git',
  'models.search.parts': '{n} parça',
  'models.search.evaluate.error': 'Değerlendirme sırasında bir hata oluştu: ',
  'models.ollama.deprecated.title': 'Kullanımdan Kaldırma Bildirimi',
  'models.ollama.deprecated.current':
    '<span class="bold-text">Mevcut Sürüm (v0.6.1): </span>Ollama modelleri şu anda kullanılabilir.',
  'models.ollama.deprecated.upcoming':
    '<span class="bold-text">Gelecek Sürüm (v0.7.0): </span>Ollama model kaynağı arayüzden kaldırılacaktır.',
  'models.ollama.deprecated.following':
    '<span class="bold-text">v0.7.0 güncellemesinin ardından,</span> daha önce dağıtılmış tüm modeller beklendiği gibi çalışmaya devam edecektir.',
  'models.ollama.deprecated.issue':
    'İlgili soruna bakın: <a href="https://github.com/gpustack/gpustack/issues/1979" target="_blank">GitHub\'da #1979</a>.',
  'models.ollama.deprecated.notice': `Ollama model kaynağı v0.6.1 itibarıyla kullanımdan kaldırılmıştır. Daha fazla bilgi için <a href="https://github.com/gpustack/gpustack/issues/1979" target="_blank">ilgili GitHub sorununa</a> bakın.`,
  'models.backend.mindie.310p':
    'Ascend 310P yalnızca FP16 destekler, bu nedenle --dtype=float16 ayarlamanız gerekir.',
  'models.form.gpuCount': 'Kopya Başına GPU',
  'models.form.gpuType': 'GPU Türü',
  'models.form.optimizeLongPrompt': 'Uzun İstemi Optimize Et',
  'models.form.enableSpeculativeDecoding': 'Spekülatif Çözümlemeyi Etkinleştir',
  'models.form.check.clusterUnavailable': 'Mevcut küme kullanılamıyor',
  'models.form.check.otherClustersAvailable':
    'Kullanılabilir kümeler: {clusters}. Lütfen küme değiştirin.',
  'models.button.accessSettings': 'Erişim Ayarları',
  'models.table.accessScope': 'Erişim Kapsamı',
  'models.table.accessScope.all': 'Tüm kullanıcılar',
  'models.table.userSelection': 'Kullanıcı Seçimi',
  'models.button.accessSettings.tips':
    'Erişim ayarlarındaki değişiklikler bir dakika sonra geçerli olur.',
  'models.table.userSelection.tips':
    'Yönetici kullanıcılar varsayılan olarak tüm modellere erişebilir.',
  'models.table.filterByName': 'Kullanıcı adına göre filtrele',
  'models.table.admin': 'Yönetici',
  'models.table.noselected': 'Kullanıcı seçilmedi',
  'models.table.users.all': 'Tüm Kullanıcılar',
  'models.table.users.selected': 'Seçili Kullanıcılar',
  'models.table.nouserFound': 'Kullanıcı bulunamadı',
  'models.form.performance': 'Performans',
  'models.form.gpus.notfound': 'GPU bulunamadı',
  'models.form.extendedkvcache': 'Genişletilmiş KV Önbelleğini Etkinleştir',
  'models.form.chunkSize': 'Önbellek Parça Boyutu',
  'models.form.maxCPUSize': 'Maksimum CPU Önbellek Boyutu (GiB)',
  'models.form.remoteURL': "Uzak Depolama URL'si",
  'models.form.remoteURL.tips':
    'Ayrıntılar için <a href="https://docs.lmcache.ai/api_reference/configurations.html" target="_blank">yapılandırma dokümantasyonuna</a> bakın.',
  'models.form.runCommandPlaceholder':
    'örn., vllm serve Qwen/Qwen2.5-1.5B-Instruct',
  'models.accessSettings.public': 'Herkese Açık',
  'models.accessSettings.authed': 'Kimlik Doğrulamalı',
  'models.accessSettings.allowedUsers': 'İzin verilen kullanıcılar',
  'models.accessSettings.public.tips':
    'Herkese açık olarak ayarlandığında, herkes kimlik doğrulaması olmadan bu modele erişebilir, bu da veri ifşa risklerine yol açabilir.',
  'models.table.button.deploy': 'Şimdi Dağıt',
  'models.form.backendVersion.holder': 'Sürüm girin veya seçin',
  'models.form.gpusperreplica': 'Kopya Başına GPU',
  'models.form.gpusAllocationType': 'GPU Tahsis Türü',
  'models.form.gpusAllocationType.auto': 'Otomatik',
  'models.form.gpusAllocationType.custom': 'Özel',
  'models.form.gpusAllocationType.auto.tips':
    "Sistem kopya başına GPU sayısını otomatik hesaplar, varsayılan olarak ikinin kuvvetlerini kullanır ve seçilen GPU'larla sınırlandırılır.",
  'models.form.gpusAllocationType.custom.tips':
    'Kopya başına tam GPU sayısını belirleyebilirsiniz.',
  'models.mymodels.status.inactive': 'Durduruldu',
  'models.mymodels.status.degrade': 'Hazır Değil',
  'models.mymodels.status.active': 'Hazır',
  'models.form.kvCache.tips':
    'Genişletilmiş KV önbellek ve spekülatif çözümleme yalnızca yerleşik altyapılarda (vLLM / SGLang) kullanılabilir. Etkinleştirmek için lütfen altyapıyı değiştirin.',
  'models.form.kvCache.tips2':
    'Yalnızca yerleşik çıkarım altyapıları (vLLM veya SGLang) kullanılırken desteklenir.',
  'models.form.kvCache.backend': 'Önbellek Altyapısı',
  'models.form.kvCache.local': 'Süreç İçi Önbellek',
  'models.form.kvCache.service.tips':
    'Yalnızca aynı kümede bulunan ve seçilen altyapıyla uyumlu önbellek hizmetleri listelenir.',
  'models.form.kvCache.shared.builtinBackends':
    'Önbellek Hizmeti yalnızca yerleşik vLLM ve SGLang arka uçlarıyla desteklenir.',
  'models.kvCache.degraded.tips':
    'Bu örnek için paylaşılan KV önbelleği etkin değil',
  'models.kvCache.endpointDead.tips':
    'Bu örneğin bağlandığı paylaşılan önbellek artık kullanılamıyor; kurtarmak için örneği yeniden başlatın',
  'models.kvCache.service': 'Önbellek Hizmeti',
  'models.kvCache.hitRate': 'Harici Önbellek İsabet Oranı ({window})',
  'models.kvCache.hitRate.window': '1h',
  'models.form.scheduling': 'Zamanlama',
  'models.form.scaling': 'Zamanlanmış Ölçekleme',
  'models.form.scaling.enable': 'Zamanlanmış ölçeklemeyi etkinleştir',
  'models.form.scaling.enable.tips':
    'Kopya sayısını yinelenen zaman pencerelerinde ölçekleyin (ör. gündüz daha fazla, gece daha az). Hiçbir pencerede değilken model, yapılandırılan kopya sayısını taban değer olarak kullanır.',
  'models.form.scaling.tz.note':
    'Zamanlama saatleri sunucu genelindeki saat dilimini kullanır (GPUSTACK_TIMEZONE, varsayılan olarak sunucunun saat dilimi).',
  'models.form.scaling.rules': 'Kurallar',
  'models.form.scaling.cron': 'Cron İfadesi',
  'models.form.scaling.useCron': 'CRON ifadesi kullan',
  'models.form.scaling.repeat': 'Tekrar',
  'models.form.scaling.repeat.daily': 'Her gün',
  'models.form.scaling.repeat.weekdays': 'Hafta içi (Pzt–Cum)',
  'models.form.scaling.repeat.weekends': 'Hafta sonu (Cmt–Paz)',
  'models.form.scaling.repeat.weekly': 'Her hafta',
  'models.form.scaling.repeat.monthly': 'Her ay',
  'models.form.scaling.repeat.cron': 'CRON',
  'models.form.scaling.weekdaysLabel': 'Haftanın günleri',
  'models.form.scaling.monthdaysLabel': 'Ayın günleri',
  'models.form.scaling.startTime': 'Başlangıç saati',
  'models.form.scaling.endTime': 'Bitiş saati',
  'models.form.scaling.crossDay': 'Ertesi gün biter',
  'models.form.scaling.nextDayBadge': '+1 gün',
  'models.form.scaling.timezone': 'Saat dilimi',
  'models.form.scaling.tz.all': 'Tüm zamanlamalar {tz} saat dilimini kullanır',
  'models.form.scaling.duration': 'Süre',
  'models.form.scaling.durationUnit': 'Zaman birimi',
  'models.form.scaling.windowReplicas': 'Penceredeki kopyalar',
  'models.form.scaling.unit.minutes': 'Dakika',
  'models.form.scaling.unit.hours': 'Saat',
  'models.form.scaling.unit.days': 'Gün',
  'models.form.scaling.startCron': 'Pencere Başlangıcı',
  'models.form.scaling.endCron': 'Pencere Bitişi',
  'models.form.scaling.baseline': 'Taban Kopya Sayısı',
  'models.form.scaling.baseline.tips':
    'Geçerli saat hiçbir pencerede değilken kullanılan kopya sayısı.',
  'models.form.scaling.baselineNote':
    'Yukarıda ayarlanan Replicas değeri temel (baseline) olarak kullanılır — geçerli saat hiçbir pencerede değilken uygulanan kopya sayısı.',
  'models.form.scaling.cron.invalid': 'Geçersiz cron ifadesi',
  'models.form.scaling.meaning': 'Özet',
  'models.form.scaling.summary.monthDays': 'Gün {days}',
  'models.form.scaling.freq.minute': 'Her dakika',
  'models.form.scaling.freq.hour': 'Saatte bir',
  'models.form.scaling.freq.day': 'Günde bir',
  'models.form.scaling.freq.week': 'Haftada bir',
  'models.form.scaling.freq.month': 'Ayda bir',
  'models.form.scaling.freq.year': 'Yılda bir',
  'models.form.scaling.next': 'Sonraki pencere:',
  'models.form.scaling.current': 'Geçerli pencere:',
  'models.form.scaling.addRule': 'Kural ekle',
  'models.form.scaling.removeRule': 'Kuralı kaldır',
  'models.form.scaling.rules.required':
    'En az bir kural ekleyin veya zamanlanmış ölçeklemeyi kapatın.',
  'models.form.scaling.hint':
    'Her kural, başlangıç saatinde belirtilen süre boyunca bir pencere açar ve o sırada kendi kopya sayısını çalıştırır. Hiçbir pencerede değilken model, yukarıdaki taban kopya sayısını kullanır. Pencereler çakıştığında en son başlayan pencere geçerli olur.',
  'models.form.scaling.conflict':
    'Çakışma: aynı başlangıç saatine ({times}) sahip kuralların kopya sayıları farklı. Aynı kopya sayısını veya farklı başlangıç saatleri kullanın.',
  'models.form.scaling.overlap':
    'Örtüşme: pencereler ({times}) örtüşüyor; örtüşen yerlerde sonra başlayan kural geçerli olur.',
  'models.form.ramRatio': 'RAM-VRAM Oranı',
  'models.form.ramSize': 'Maksimum RAM Boyutu (GiB)',
  'models.form.ramRatio.tips':
    "KV önbellek için kullanılan sistem RAM'in GPU VRAM'e oranı. Örneğin, 2.0 RAM'deki önbelleğin GPU VRAM'in iki katı olabileceği anlamına gelir.",
  'models.form.ramSize.tips': `Sistem belleğinde depolanan KV önbelleğin maksimum boyutu (GiB). Ayarlanırsa, bu değer "{content}" değerini geçersiz kılar.`,
  'models.form.chunkSize.tips': 'KV önbellek parçası başına token sayısı.',
  'models.form.mode': 'Mod',
  'models.form.algorithm': 'Algoritma',
  'models.form.draftModel': 'Taslak Model',
  'models.form.numDraftTokens': 'Taslak Token Sayısı',
  'models.form.ngramMinMatchLength': 'N-gram Minimum Eşleme Uzunluğu',
  'models.form.ngramMaxMatchLength': 'N-gram Maksimum Eşleme Uzunluğu',
  'models.form.mode.throughput': 'Verim',
  'models.form.mode.latency': 'Gecikme',
  'models.form.mode.baseline': 'Standart',
  'models.form.mode.throughput.tips':
    'Yüksek istek eşzamanlılığı altında yüksek verim için optimize edilmiştir.',
  'models.form.mode.latency.tips':
    'Düşük istek eşzamanlılığı altında düşük gecikme için optimize edilmiştir.',
  'models.form.mode.baseline.tips':
    'Tam (orijinal) hassasiyette çalışır ve uyumluluğu ön planda tutar.',
  'models.form.draftModel.placeholder':
    'Lütfen bir taslak model seçin veya girin',
  'models.form.draftModel.tips':
    "Yerel yol (örn., /path/to/model) girebilir veya Hugging Face ya da ModelScope'dan bir model seçebilirsiniz (örn., Tengyunw/qwen3_8b_eagle3). Sistem birincil model kaynağına göre otomatik eşleme yapar.",
  'models.form.quantization': 'Niceleme',
  'models.form.backend.custom': 'Kullanıcı tanımlı',
  'models.form.rules.name':
    'En fazla 63 karakter; yalnızca harf, rakam, nokta (.), alt çizgi (_) ve tire (-); alfanümerik karakterle başlamalı ve bitmelidir.',
  'models.catalog.button.explore': 'Daha Fazla Model Keşfet',
  'models.catalog.precision': 'Hassasiyet',
  'models.form.gpuPerReplica.tips': 'Özel bir sayı girin',
  'models.form.generic_proxy': "Genel Proxy'yi Etkinleştir",
  'models.form.enableModelRoute': 'Model Yönlendirmesini Etkinleştir',
  'models.form.enableModelRoute.tips': 'Model Yönlendirmesini Etkinleştir',
  'models.form.generic_proxy.tips':
    'Genel proxy etkinleştirildikten sonra OpenAI API standardına uymayan URI yollarına erişebilirsiniz.',
  'models.form.generic_proxy.button': 'Genel Proxy',
  'models.accessControlModal.includeusers': 'Dahil Edilen Kullanıcılar',
  'models.table.genericProxy':
    'Aşağıdaki yol önekini kullanın ve model adını <span class="bold-text">X-GPUStack-Model</span> istek başlığında veya istek gövdesindeki model alanında ayarlayın. Bu yol öneki altındaki tüm istekler çıkarım altyapısına yönlendirilir.',
  'models.form.backendVersion.deprecated': 'Kullanımdan Kaldırıldı',
  'models.accessSettings.public.desc':
    'Kimlik doğrulaması olmadan herkes tarafından erişilebilir.',
  'models.accessSettings.authed.tips':
    'Tüm kimliği doğrulanmış platform kullanıcıları tarafından erişilebilir.',
  'models.accessSettings.allowedUsers.tips':
    'Yalnızca belirlenen kullanıcılar modele erişebilir.',
  'models.form.backendVersions.tips': `Daha fazla sürüm kullanmak için {link} sayfasına gidin ve sürüm eklemek üzere altyapıyı düzenleyin.`,
  'models.catalog.nogpus.tips':
    'Seçili kümede bu model için uyumlu GPU bulunmuyor.',
  'models.form.modelfile.notfound': `Belirttiğiniz model dosyası yolu GPUStack sunucusunda mevcut değil. Model dosyasını hem GPUStack sunucusunda hem de GPUStack işçi düğümlerinde aynı yola yerleştirmeniz önerilir. Bu, GPUStack'in daha iyi kararlar almasına yardımcı olur.`,
  'models.form.readyWorkers': 'hazır işçi düğüm',
  'models.form.maxContextLength': 'Maksimum Bağlam Uzunluğu',
  'models.form.backend.helperText':
    'Henüz etkinleştirilmedi. Dağıtımdan sonra etkinleştirilecektir. ',
  'models.table.instance.benchmark': 'Kıyaslama Çalıştır',
  'models.table.modelView': 'Model Listesi',
  'models.table.instanceView': 'Örnek Listesi',
  'models.table.category': 'Kategori',
  'models.instance.currentRun': 'Geçerli Çalıştırma',
  'models.instance.previousRun': 'Önceki Çalıştırma',
  'models.instance.startHistory': 'Çalıştırma Geçmişi',
  'models.instance.startHistory.tips':
    'Hata kaynaklı son yeniden başlatmadan önceki çalıştırmanın günlüklerini gösterir.',
  'models.instance.logs.downloading': 'İndiriliyor… {size}',
  'models.instance.logs.downloadingPercent': 'İndiriliyor… {percent}%',
  'models.form.lora.label': 'LoRA Adaptörleri',
  'models.form.lora.add': 'LoRA Adaptörü Ekle',
  'models.form.lora.select': 'LoRA Seç',
  'models.form.lora.name': 'LoRA adı',
  'models.form.lora.rule.empty': 'Girdi boş olamaz',
  'models.form.lora.rule.duplicate': 'LoRA adı yinelenemez',
  // Model catalog source configuration
  'models.catalog.source.title': 'Katalog Kaynağı',
  'models.catalog.source.official':
    "Bu sürümle paketlenenin yanı sıra GPUStack'in yayınladığı kataloğu izler.",

  // --- Prefill/decode disaggregation ---
  'models.form.pd.section': 'PD Ayrıştırma Ayarları',
  'models.form.pd.enable': 'Etkinleştir',
  // Why the server derived no transport. Keyed by `PDModeUnresolvedCode`;
  // the server also sends English prose, which is rendered only when this
  // catalog has no entry for the code it sent.
  'models.form.pd.unresolved.vendor_not_in_cluster':
    'Bu kümede {vendor} hızlandırıcı yok (mevcut: {vendors}).',
  'models.form.pd.unresolved.vendors_unknown':
    'Kümenin hızlandırıcıları henüz bilinmiyor, bu nedenle aktarım şeması türetilemiyor.',
  'models.form.pd.unresolved.no_built_in_recipe':
    '{backend} için {vendors} üzerinde yerleşik bir reçete yok. Bağlantı parametrelerini kendiniz vermek üzere «Özel» aktarım şemasını seçin.',
  'models.form.pd.unresolved.multiple_vendors':
    'Bu kümede grubu barındırabilecek birden fazla hızlandırıcı üreticisi var ({vendors}) ve bir PD grubu üreticiler arasında bölünemez. Birini seçin.',
  'models.form.pd.unresolved.no_preferred_recipe':
    'Birden fazla reçete uyuyor ancak hiçbiri tercih edilen olarak işaretlenmemiş.',
  'models.form.pd.unresolved.thisEngine': 'bu motor',
  'models.form.pd.enable.off': 'Kapalı',
  'models.form.pd.enable.on': 'PD Ayrıştırma',
  'models.form.pd.enable.tips':
    'Ön dolgu (prefill) ile kod çözmeyi (decode) ayrı örneklere böler; bedeli bir ek ağ atlaması ve bir KV aktarımıdır. Düşük eşzamanlılıkta, kısa istemlerde veya yüksek önek önbelleği isabetinde toplu dağıtım genellikle daha hızlıdır. Önce bir kıyaslama çalıştırın.',
  'models.form.pd.shape.mono': 'Birleşik dağıtım',
  'models.form.pd.shape.mono.tips':
    'Tek bir örnek hem prefill hem decode işlemini yürütür.',
  'models.form.pd.shape.pd': 'PD Ayrıştırma',
  'models.form.pd.shape.pd.tips':
    'Prefill ve decode ayrı roller olarak çalışır; her birinin motoru, parametreleri ve kopya sayısı bağımsızdır.',
  'models.form.pd.shape.current': 'Mevcut',
  'models.form.pd.mode': 'Taşıma',
  'models.form.pd.mode.holder': 'Bir taşıma seçin',
  'models.form.pd.mode.tips':
    'Bağlantı durumu parametrelerinin tümü - connector, portlar, karşı taraf adresleri - seçilen moddan türetilir; elle ayarlanmaz.',
  'models.form.pd.mode.custom.tips':
    'Özel modda hiçbir bağlantı parametresi eklenmez: --kv-transfer-config, portlar ve karşı taraf adreslerini kendiniz vermelisiniz.',
  'models.form.pd.mode.backend.mismatch':
    '{targets} gerekiyor; seçili motor {backend}. Roller arasında motor karıştırmak için Özel modu kullanın.',
  'models.form.pd.mode.runtime.mismatch':
    '{runtime} hızlandırıcı gerekiyor; {scope, select, partition{seçilen bölümde} other{bu kümede}} yalnızca {vendors} var.',
  'models.form.pd.mode.only.custom':
    'Bu motor ve hızlandırıcı bileşimi için yerleşik bir reçete yok. Özel mod hâlâ kullanılabilir: bağlayıcı, portlar ve el sıkışma değişkenlerini kendiniz girersiniz.',
  'models.form.pd.vendor': 'Hızlandırıcı üreticisi',
  'models.form.pd.vendor.tips':
    'Bu kümede grubu barındırabilecek birden fazla üretici var ve bir PD grubu üreticiler arasına yayılamaz — KV taşıma yolu farklıdır. Dağıtılacak bölümü seçin.',
  'models.form.pd.replicas.moved':
    'PD dağıtımında replika sayıları her rol için ayrı ayarlanır.',
  'models.form.pd.disabled.gguf':
    'PD ayrıştırma yalnızca vLLM / SGLang motorlarını destekler; bu model GGUF biçiminde.',
  'models.form.pd.disabled.backend':
    'PD ayrıştırma yalnızca vLLM / SGLang motorlarını destekler. Diğer motorlar Özel mod ile kullanılabilir.',
  'models.form.pd.disabled.schedule':
    'PD dağıtımı için zamanlanmış ölçekleme kullanılamaz. Rol başına replika sayısıyla ölçekleyin.',
  'models.form.pd.cache.cleared':
    'PD dağıtımında KV önbelleği rol başına ayarlanır; model düzeyindeki ayar temizlendi. Gereken roller için tek tek seçin.',
  'models.form.roles': 'Roller',
  'models.form.roles.prefill': 'Prefill',
  'models.form.roles.decode': 'Decode',
  'models.form.roles.router': 'Router',
  'models.form.roles.override': 'Özel',
  'models.form.roles.inherited': 'Devralınan',
  'models.form.roles.group.backend': 'Motor ve imaj',
  'models.form.roles.group.parameters': 'Parametreler ve ortam değişkenleri',
  'models.form.roles.group.scheduling': 'Kaynaklar ve zamanlama',
  'models.form.roles.group.backend.tips':
    'Değiştirilmezse rol, modelin kendi motorunu ve imajını kullanır.',
  'models.form.roles.group.scheduling.tips':
    'Değiştirilmezse zamanlayıcı, yukarıda ayarlanan topoloji yakınlığına göre hangi kartlara yerleşeceğine karar verir.',
  'models.form.roles.group.cache': 'Paylaşılan KV önbelleği',
  'models.form.roles.group.settings': 'Grup ayarları',
  'models.form.roles.group.settings.tips': 'Tüm rollere uygulanır',
  'models.form.roles.replicas': 'Replikalar',
  'models.form.roles.router.routeArgs': 'Yönlendirme argümanları',
  'models.form.roles.router.routeArgs.tips':
    'Router sürecinin başlatıldığı komut satırı argümanları. Kilitli satırları GPUStack, grubun yerleştiği yere göre üretir ve düzenlenemez.',
  'models.form.roles.router.locality':
    'Yalnızca CPU; bu grubun prefill ve decode üyelerine olabildiğince yakın bir Worker’a otomatik yerleştirilir',
  'models.form.roles.router.workerAllocation': 'Worker ataması',
  'models.form.roles.router.workerSelect': 'Worker seçici',
  'models.form.roles.router.scheduletype.tips':
    'Otomatik: seçicinin izin verdiği makineler arasında, bu grubun prefill veya decode’unu zaten çalıştıran biri tercih edilir. Elle: doğrudan bir Worker belirtin.',
  'models.form.roles.router.workerSelector.tips':
    'Adayları etikete göre daraltır. Eşleşenler arasında yine bu grubun prefill ve decode’una en yakın olan tercih edilir.',
  'models.form.roles.router.order.tips':
    'Router, Prefill ve Decode hazır olduktan sonra oluşturulur.',
  'models.form.roles.router.custom.forced':
    'Özel PD modu Router türetmez. İmajını ve başlatma komutunu verin.',
  'models.form.roles.router.peers':
    'Prefill / Decode örnek adresleri dağıtımdan sonra sistem tarafından eklenir.',
  'models.form.roles.cache.holder': 'Kullanılmıyor',
  'models.form.roles.cache.tips':
    'Bağlantı yöntemi ve öncelik sırası sistem tarafından türetilir; ayar gerekmez.',
  'models.form.roles.cache.custom.conflict':
    'Özel PD modunda motor parametrelerinde --kv-transfer-config gerekir; bu nedenle önbellek servisi de seçilemez.',
  'models.form.roles.cache.param.conflict':
    'Seçili PD modu ile çakışıyor. Özel moda geçin veya --kv-transfer-config parametresini kaldırın.',
  'models.state.pending': 'Bekliyor',
  'models.state.partial': 'Kısmen hazır',
  'models.state.running': 'Çalışıyor',
  'models.state.error': 'Hata',
  'models.form.speculativeDecoding': 'Spekülatif Kod Çözme',
  'models.pd.tag': 'PD',
  'models.pd.roles.detail': 'Rol başına durum',
  'models.pd.degraded.cache':
    'Bazı üyeler paylaşılan KV önbelleği olmadan çalışıyor; nedeni için örneği açın.',
  'models.pd.degraded.ratio':
    'Hazır üye sayısı istenenden az; dağıtım düşük kapasiteyle hizmet veriyor.',
  'models.form.roles.override.empty':
    'Bu grupta hiçbir değer yok, bu nedenle model düzeyindeki yapılandırmayı devralacak şekilde kaydedilecek. Özel kalması için en az bir alan doldurun.',
  'models.form.pd.mode.cleared':
    'PD ayrıştırma kapatıldığında PD modu temizlendi. Lütfen yeniden seçin.',
  'models.form.pd.engineVersion.below':
    'Seçilen PD reçetesi {range} motor sürümleri için destek bildiriyor, bu dağıtım ise {version} sürümünü sabitliyor. Yine de dağıtılabilir — kendi derlediğiniz bir imaj özel bir sürüm numarası taşıyor olabilir — ancak sürüm gerçekten alt sınırın altındaysa, reçetenin varsaydığı davranışlar eksik olabilir; örneğin küçültülen bir üyenin kaydının silinmesi.',
  'models.pd.degraded.pairing':
    'Hiçbir prefill üyesi herhangi bir decode üyesiyle aynı sunucuyu paylaşmıyor; bu yüzden her KV aktarımı ağ üzerinden gidiyor. RDMA’sız bir bağlantıda bu, genellikle hiç ayrıştırmamaktan bile yavaştır. En az bir çifti aynı sunucuya yerleştirin ya da her iki rol için aynı sunucudaki GPU’ları seçin.',
  'models.pd.degraded.gather':
    'Topoloji hedefinin altında: üyeler istenenden daha uzakta',
  'models.pd.degraded.scaleOut':
    'Grup, katı kipte tek bir topoloji alanına sabitlenmiş durumda ve eklenmesi istenen bir üye henüz yerleştirilemedi. Hâlihazırda çalışan üyeler normal biçimde hizmet vermeyi sürdürüyor — duran şey yalnızca ölçek büyütme. Neyin engellediğini o üyenin durum mesajı söyler; buradan hareketle alan içinde kapasite açın, topoloji kısıtını gevşetin ya da kopya sayısını eski değerine döndürün.',
  'models.pd.degraded.engineVersion':
    'Sabitlenen motor sürümü, seçilen PD reçetesinin desteklediğini bildirdiği aralığın altında. Buna izin verilir — kendiniz derlediğiniz bir imaj özel bir sürüm numarası taşıyabilir — ancak reçetenin varsaydığı davranış eksik olabilir: örneğin 0.5.7 altındaki SGLang sürümlerinde, ölçek küçültmeyle çıkarılan bir üyenin kaydı silinemez ve trafik almayı sürdürür.',
  'models.pd.degraded.ineffective':
    'Grup hizmet veriyor ancak hiç KV aktarımı olmuyor — ayrıştırma sessizce toplu çıkarıma geriledi. Eşleştirmeyi ve KV bağlayıcı yapılandırmasını denetleyin.',
  'models.pd.degraded.pairingUnverified':
    'Eşleştirme parametresi rollerden yalnızca birinde açıkça belirtilmiş, diğerinde motorun varsayılanına bırakılmış; bu yüzden GPUStack ikisinin uyuştuğunu doğrulayamadı — tipik olarak --max-model-len, --block-size, --kv-cache-layout ya da bir tarafta auto, diğerinde belirli bir dtype. Bu, eşleştirmenin yanlış olduğu anlamına gelmez; yalnızca doğrulanmadığı anlamına gelir. Doğrulanması için parametreyi iki rolde de yazın.',
  'models.pd.degraded.pairingTP':
    'Üyelerin gerçekte aldığı kartlardan yeniden hesaplanan etkin tensör paralelliği, bu PD reçetesinin bildirdiği yönü ihlal ediyor: NIXL, decode’un prefill’den dar olmamasını; Ascend Mooncake ise prefill’in decode’dan dar olmamasını gerektirir. Kart sabitlemeyen ve --tensor-parallel-size yazmayan bir rolün yerleşimden önce denetlenecek bir sayısı olmadığı için bu, kabul aşamasında yakalanamaz. --tensor-parallel-size değerini iki rolde de ayarlayın veya reçetenin izin verdiği GPU sayılarını verin.',
  'models.pd.admission.infeasible':
    'Mevcut kapasite bu grubu barındıramıyor (gereken {required}, mevcut {available}). Replika sayısını azaltın, dilimlenmiş kart türü kullanın veya düğüm ekleyin.',
  'models.pd.ratio.waiting':
    'Oran {configured} (şu an {current}, {role} bekleniyor)',
  'models.instance.draining.tips':
    'Ölçek küçültüldü. Yeni istek almıyor; KV önbelleğini hâlâ çeken decode örnekleri bitene kadar çalışmaya devam ediyor, ardından siliniyor.',
  'models.pd.group.restarting.brief': 'Yeniden başlatılıyor…',
  'models.pd.group.restarting.progress':
    'Grup yeniden başlatılıyor: üyeleri bilerek durduruldu ve yeniden oluşturuluyor, şu ana kadar {ready}/{total} hazır. Kopya sayılarının düşük görünmesi bu yüzdendir, grup arızalandığı için değil.',
  'models.pd.group.restart.confirm':
    'Bu değişiklik tüm PD grubunun yeniden başlatılmasını gerektirir: önce {total} örneğin tümü durdurulur, sonra yeni yapılandırmayla yeniden oluşturulur; bu sürede model kullanılamaz.',
  'models.pd.instance.stale':
    'Bu örnek eski bir yapılandırmayla çalışıyor; değişikliği uygulamak için grubu yeniden başlatın.',
  'models.pd.stale':
    'Yapılandırma değişti; uygulamak için dağıtımı yeniden başlatın.',
  'models.restart': 'Yeniden başlat',
  'models.restart.inflight': 'Yeniden başlatılıyor…',
  'models.restart.confirm':
    '{name} modelinin tüm örnekleri durdurulur ve geçerli yapılandırmayla yeniden oluşturulur. Bu sırada model kullanılamaz.',
  'models.restart.done':
    'Yeniden başlatılıyor: örnekler durduruldu ve geçerli yapılandırmayla yeniden oluşturulacak.',
  'models.restart.uptodate':
    'Yeniden başlatılacak bir şey yok: bu dağıtımda çalışan örnek bulunmuyor.',
  'models.restart.failed': 'Model yeniden başlatılamadı.',
  'models.restart.inprogress':
    'Zaten bir yeniden başlatma sürüyor. Tamamlanmasını bekleyip yeniden deneyin.',
  'models.stale.tag': 'Eski',
  'models.pd.group.id': 'Grup',
  'models.form.pd.disabled.gpus':
    'PD ayrıştırma en az 2 kullanılabilir GPU gerektirir (bir Prefill, bir Decode); seçili kümede {count} adet var.',
  'models.pd.ratio': 'Oran',
  'models.form.roles.router.entrypoint': 'Çalıştırma komutu',
  'models.form.roles.router.connectionArgs':
    'Bağlantı parametreleri (GPUStack tarafından verilir)',
  'models.form.roles.managed': 'Sistem tarafından yönetilir',
  'models.form.roles.managed.tips':
    'GPUStack tarafından PD moduna ve grubun zamanlandığı yere göre doldurulur. Salt okunurdur ve bunların hiçbirini yeniden belirtmeniz gerekmez. Çift süslü parantez içindeki değerler yer tutucudur; dağıtım sırasında gerçek adresler, portlar ve ağ arayüzü ile değiştirilir.',
  'models.form.roles.managed.mounts': 'Ana makine bağlamaları',
  'models.form.roles.managed.locked':
    'Kilitli satırlar sistem tarafından eklenir ve düzenlenemez',
  'models.form.roles.engine': 'Motor',
  'models.form.roles.scheduling.managed':
    'Yukarıda ayarlanan topoloji yakınlığına göre sistem tarafından yerleştirilir; ayrıca düğüm kısıtı uygulanmaz',
  'models.form.roles.managed.params.tips':
    'Bu rolün motorunun başlatıldığı argümanlar. Kilitli olanları GPUStack, PD moduna göre ekler; sizinkiler bunların ardına eklenir.',
  'models.form.roles.managed.env.tips':
    'Bu rolün kapsayıcısına ayarlanan ortam değişkenleri. Kilitli olanları GPUStack ekler; çoğu denetim düzlemi adresleri ve kullanılacak ağ arayüzüdür.',
  'models.form.roles.managed.mounts.tips':
    'Ana makineden kapsayıcıya bağlanan yollar. Yalnızca GPUStack ekleyebilir: bunlar aktarımın okuması gereken, hızlandırıcı çalışma zamanının kendiliğinden getirmediği ana makine dosyalarıdır.',
  'models.form.roles.resources': 'Kaynaklar',
  'models.form.roles.resources.cpu': 'CPU (çekirdek)',
  'models.form.roles.resources.memory': 'Bellek (GiB)',
  'models.form.roles.resources.tips':
    'Router konteynerinin istediği kaynaklar. Varsayılan 2 çekirdek ve 2 GiB.',
  'models.form.roles.router.health': 'Sağlık kontrolü',
  'models.form.roles.router.peerslabel': 'Karşı taraflar',
  'models.form.roles.router.image.tips':
    'Seçilen PD modundan türetilen görüntüyü kullanmak için boş bırakın. Yalnızca o görüntüde router çalıştırılabiliri yoksa doldurun — başlatma komutu yine türetilir.',
  'models.form.roles.cpuonly': 'Yalnızca CPU',

  'models.form.gather.title': 'Topoloji Yakınlığı',
  'models.form.gather.target.auto': 'Otomatik',
  'models.form.gather.target.auto.tips': 'Sığan en hızlı aktarım yolu',
  'models.form.gather.target.host': 'Aynı Worker',
  'models.form.gather.target.host.tips':
    'Prefill ve Decode aynı Worker üzerinde',
  'models.form.gather.target.layer': 'Aynı {layer}',
  'models.form.gather.target.tips':
    'Bu grubun üyeleri arasında istediğiniz aktarım kalitesi. Tek bir hızlandırıcı alanı içindeki aktarım aynı kabin içindekinden hızlıdır; bu yüzden kabinleri aşan bir alan da karşılanmış sayılır. Router hızlandırıcı kullanmaz ve bu kısıta dahil değildir.',
  'models.form.gather.unmet': 'Sığmazsa',
  'models.form.gather.unmet.prefer': 'Yine de dağıt',
  'models.form.gather.unmet.prefer.tips':
    'Bir sonraki en iyi yerleşime düş ve modeli topoloji hedefinin altında olarak işaretle',
  'models.form.gather.unmet.must': 'Dağıtma',
  'models.form.gather.unmet.must.tips': 'Daha yavaş bir dağıtım vermektense',
  'models.form.gather.fits': 'sığıyor',
  'models.form.gather.fits.domain': '{domain} içine sığıyor',
  'models.form.gather.short':
    'en geniş {domain} {needed} taneden {available} tanesini alıyor',
  'models.form.gather.noRoom': 'bu katmanda yer olan hiçbir alan yok',
  'models.form.gather.unknown':
    '{count} worker üzerinde kapasite okunamıyor, bu nedenle bu katman denetlenemiyor',
  'models.form.gather.declare':
    'Kümenin “Topoloji” bölümünde kabinleri doldurarak daha kaba düzeyleri açın.',
  'models.form.gather.largeGroup':
    'Bu boyutta, topolojiden bağımsız olarak isteklerin en az yaklaşık %{percent} kadarı aynı sunucuda eşleşir. Bu, kopya sayısından türetilen bir alt sınırdır — gerçek oran grubun sonunda kaç makineye yayıldığına bağlıdır ve dağıtımdan sonra grup özetinde görünür. KV aktarım yerelliği için bunun yerine birkaç daha küçük ayrıştırılmış grup düşünün.',
  'models.form.gather.spanning':
    '{role} {gpus} GPU gerektiriyor ve bu kümedeki en geniş makinede {widest} tane var, bu yüzden her üye makineleri bütün olarak alıyor: prefill ile decode asla aynı makineyi paylaşmıyor ve sunucu içi eşleşme 0. KV her zaman makineler arasında geçiyor — önemli olan, yukarıdaki hangi katmanın onu kendi içinde tuttuğu.',
  'models.form.gather.checking': 'Neyin sığdığı denetleniyor…',
  'models.form.gather.unavailable':
    'Şu anda neyin sığdığı denetlenemedi, bu nedenle yalnızca varsayılan sunuluyor.',
  'models.form.gather.retry': 'Yeniden dene',
  'models.form.groupSettings': 'Grup Ayarları',
  'models.form.groupSettings.tips':
    'Bunlar roller arasında farklılaşamaz: tek bir değer hem Prefill hem Decode için uygulanır.',
  // Topology-aware gather tiers. One chain, root to leaf: the option list is
  // flat in chain order and the retreat line says what happens when a rung
  // does not fit. The `chain.*` group headings are gone with the second chain.
  'models.form.gather.goFill': 'Doldur',
  'models.form.gather.infeasible.warning':
    'Mevcut kapasiteyle bu grup yerleştirilemez; kaydedildikten sonra yer açılana kadar bekler. Seçenekler: “olabildiğince yakın” seçeneğine geçin (sunuculara yayılabilir, KV aktarımı yavaşlar) · kopya sayısını veya kopya başına GPU sayısını azaltın'
};
