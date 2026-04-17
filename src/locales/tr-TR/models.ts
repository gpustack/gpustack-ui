export default {
  'models.button.deploy': 'Model Dağıt',
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
  'models.form.manual.schedule': 'Manuel Zamanlama',
  'models.table.gpuindex': 'GPU İndeksi',
  'models.table.backend': 'Altyapılar',
  'models.table.acrossworker': 'İşçi Düğümler Arası Dağıtık',
  'models.table.cpuoffload': 'CPU Aktarımı',
  'models.table.layers': 'Katmanlar',
  'models.form.backend': 'Altyapı',
  'models.form.backend_parameters': 'Altyapı Parametreleri',
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
  'models.form.restart.onerror': 'Hata Durumunda Otomatik Yeniden Başlat',
  'models.form.restart.onerror.tips':
    'Hata oluştuğunda otomatik olarak yeniden başlatmayı dener.',
  'models.form.check.params': 'Yapılandırma kontrol ediliyor...',
  'models.form.check.passed': 'Uyumluluk Kontrolü Başarılı',
  'models.form.check.claims':
    'Model yaklaşık {vram} VRAM ve {ram} RAM tüketecektir.',
  'models.form.check.claims2': 'Model yaklaşık {vram} VRAM tüketecektir.',
  'models.form.check.claims3': 'Model yaklaşık {ram} RAM tüketecektir.',
  'models.form.update.tips':
    'Değişiklikler yalnızca örneği silip yeniden oluşturduğunuzda geçerli olur.',
  'models.table.download.progress': 'İlerleme',
  'models.table.button.apiAccessInfo': 'API Erişim Bilgisi',
  'models.table.button.apiAccessInfo.tips': `Bu modeli üçüncü taraf uygulamalarla entegre etmek için şu bilgileri kullanın: erişim URL'si, model adı ve API anahtarı. Bu kimlik bilgileri, model hizmetine düzgün bağlantı ve kullanım sağlamak için gereklidir.`,
  'models.table.apiAccessInfo.endpoint': "Erişim URL'si",
  'models.table.apiAccessInfo.modelName': 'Model Adı',
  'models.table.apiAccessInfo.apikey': 'API Anahtarı',
  'models.table.apiAccessInfo.openaiCompatible': 'OpenAI Uyumlu',
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
  'models.form.scheduling': 'Zamanlama',
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
  'models.table.modelView': 'Model List',
  'models.table.instanceView': 'Instance List',
  'models.table.category': 'Category',
  'models.instance.firstStart': 'First Deployment',
  'models.instance.lastStart': 'Last Startup',
  'models.instance.startHistory': 'Startup History'
};

// ========== To-Do: Translate Keys (Remove After Translation) ==========
// 1. 'models.table.modelView': 'Model List',
// 2. 'models.table.instanceView': 'Instance List',
// 3. 'models.table.category': 'Category'
// ========== End of To-Do List ==========
