// mc_finans_havuzu.js
// ⚠️ TEK GEÇERLİ FİNANS YOLU - TEK DOĞRULUK KAYNAĞI
// Bu modül sadece NORMALİZE EDİLMİŞ finans kayıtları alır

// 📌 FİNANS HAVUZU DOĞRULAMA KURALLARI
const FINANS_KURALLARI = {
    // Kabul edilen kayıt türleri
    KABUL_EDILEN_TURLER: ["GELIR", "GIDER", "INDIRIM", "ZAYIAT", "ODEME"],
    
    // Kabul edilen ödeme türleri (HESABA_YAZ eklendi - borç takibi için)
    KABUL_EDILEN_ODEME_TURLERI: ["NAKIT", "KART", "HAVALE", "INDIRIM", "HESABA_YAZ"],
    
    // Reddedilen ödeme türleri (finans havuzuna GELİR olarak girilmez)
    REDDEDILEN_ODEME_TURLERI: ["BORC", "VERESIYE"], // HESABA_YAZ çıkarıldı
    
    // Zorunlu alanlar
    ZORUNLU_ALANLAR: ["tur", "odemeTuru", "tutar", "kaynak", "tarih", "gunId"]
};

// 📌 LOCALSTORAGE KEY'LERİ
const FINANS_HAVUZU_KEY = "mc_finans_havuzu";
const AKTIF_GUN_KEY = "mc_aktif_gun";

// ============================================================
// YARDIMCI FONKSİYONLAR
// ============================================================

/**
 * Tarihten gunId alır (YYYY-MM-DD formatında)
 * @param {string|Date} tarih - Tarih
 * @returns {string} gunId (YYYY-MM-DD)
 */
const gunIdAl = (tarih) => {
    try {
        const dateObj = new Date(tarih);
        if (isNaN(dateObj.getTime())) {
            throw new Error('Geçersiz tarih');
        }
        
        const yil = dateObj.getFullYear();
        const ay = String(dateObj.getMonth() + 1).padStart(2, '0');
        const gun = String(dateObj.getDate()).padStart(2, '0');
        
        return `${yil}-${ay}-${gun}`;
    } catch (error) {
        console.error('❌ gunId alınamadı:', error);
        // Bugünün tarihini döndür
        const bugun = new Date();
        const yil = bugun.getFullYear();
        const ay = String(bugun.getMonth() + 1).padStart(2, '0');
        const gun = String(bugun.getDate()).padStart(2, '0');
        return `${yil}-${ay}-${gun}`;
    }
};

/**
 * Finans kaydını doğrular
 * @param {Object} kayit - Doğrulanacak finans kaydı
 * @returns {Object} { isValid: boolean, errors: Array }
 */
const finansKaydiDogrula = (kayit) => {
    const errors = [];

    // 1. Zorunlu alan kontrolü
    FINANS_KURALLARI.ZORUNLU_ALANLAR.forEach(alan => {
        if (!kayit[alan]) {
            errors.push(`Zorunlu alan eksik: ${alan}`);
        }
    });

    // 2. Tür kontrolü
    if (!FINANS_KURALLARI.KABUL_EDILEN_TURLER.includes(kayit.tur)) {
        errors.push(`Geçersiz tür: ${kayit.tur}. Kabul edilen türler: ${FINANS_KURALLARI.KABUL_EDILEN_TURLER.join(', ')}`);
    }

    // 3. Ödeme türü kontrolü - TÜR'e göre özel kurallar
    if (kayit.tur === "GELIR") {
        // GELİR için: BORC, VERESIYE reddedilir, HESABA_YAZ kabul edilir (borç takibi için)
        if (["BORC", "VERESIYE"].includes(kayit.odemeTuru)) {
            errors.push(`Reddedilen ödeme türü: ${kayit.odemeTuru}. Bu tür finans havuzuna GELİR olarak kaydedilmez.`);
        }
        
        if (kayit.odemeTuru === "INDIRIM") {
            errors.push("GELIR kaydı INDIRIM ödeme türü ile oluşturulamaz.");
        }
        
        // HESABA_YAZ artık kabul ediliyor, diğer geçerli türler
        if (!["NAKIT", "KART", "HAVALE", "HESABA_YAZ"].includes(kayit.odemeTuru)) {
            errors.push(`Geçersiz GELIR ödeme türü: ${kayit.odemeTuru}. Kabul edilen türler: NAKIT, KART, HAVALE, HESABA_YAZ`);
        }
    } else if (kayit.tur === "INDIRIM") {
        // İNDİRİM için: ödeme türü sadece INDIRIM olabilir
        if (kayit.odemeTuru !== "INDIRIM") {
            errors.push(`INDIRIM kaydının ödeme türü sadece "INDIRIM" olabilir. Verilen: ${kayit.odemeTuru}`);
        }
    } else if (kayit.tur === "GIDER") {
        // GİDER için: tüm ödeme türleri geçerli (NAKIT, KART, HAVALE)
        if (!["NAKIT", "KART", "HAVALE", "INDIRIM"].includes(kayit.odemeTuru)) {
            errors.push(`Geçersiz GIDER ödeme türü: ${kayit.odemeTuru}`);
        }
    }

    // 4. Tutar kontrolü
    if (typeof kayit.tutar !== 'number' || kayit.tutar < 0) {
        errors.push(`Geçersiz tutar: ${kayit.tutar}. Tutar pozitif bir sayı olmalıdır.`);
    }

    // 5. Tarih kontrolü
    if (!kayit.tarih || !Date.parse(kayit.tarih)) {
        errors.push(`Geçersiz tarih: ${kayit.tarih}`);
    }

    // 6. gunId kontrolü ve tarih-gunId tutarlılığı
    if (!kayit.gunId || !/^\d{4}-\d{2}-\d{2}$/.test(kayit.gunId)) {
        errors.push(`Geçersiz gunId formatı: ${kayit.gunId}. Format: YYYY-MM-DD olmalıdır.`);
    } else {
        // Tarih ile gunId tutarlılık kontrolü
        try {
            const tarihGunId = gunIdAl(kayit.tarih);
            if (kayit.gunId !== tarihGunId) {
                errors.push(`gunId (${kayit.gunId}) tarih (${tarihGunId}) ile uyumsuz. Tarihe göre gunId: ${tarihGunId}`);
            }
        } catch (e) {
            errors.push(`Tarih-gunId karşılaştırması yapılamadı: ${e.message}`);
        }
    }

    // 7. HESABA_YAZ için özel kontroller
    if (kayit.odemeTuru === "HESABA_YAZ") {
        if (!kayit.adisyonId && !kayit.referansId) {
            errors.push("HESABA_YAZ kaydı için adisyonId veya referansId gereklidir.");
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Finans kaydını normalize eder
 * @param {Object} kayit - Normalize edilecek kayıt
 * @returns {Object} Normalize edilmiş kayıt
 */
const finansKaydiNormalizeEt = (kayit) => {
    const normalized = { ...kayit };

    // 1. ID kontrolü
    if (!normalized.id) {
        normalized.id = `finans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 2. Tarih normalizasyonu
    if (!normalized.tarih) {
        normalized.tarih = new Date().toISOString();
    }

    // 3. gunId normalizasyonu (tarihe göre otomatik)
    if (!normalized.gunId) {
        try {
            normalized.gunId = gunIdAl(normalized.tarih);
        } catch (error) {
            console.warn('⚠️ gunId alınamadı, bugünün tarihi kullanılıyor:', error);
            normalized.gunId = gunIdAl(new Date());
        }
    } else {
        // Mevcut gunId ile tarih tutarlılığını sağla
        try {
            const tarihGunId = gunIdAl(normalized.tarih);
            if (normalized.gunId !== tarihGunId) {
                console.warn(`⚠️ gunId (${normalized.gunId}) tarih (${tarihGunId}) ile uyumsuz, gunId tarihe göre güncelleniyor`);
                normalized.gunId = tarihGunId;
            }
        } catch (e) {
            // Hata durumunda pas geç
        }
    }

    // 4. Kullanıcı normalizasyonu
    if (!normalized.kullanici) {
        const aktifKullanici = localStorage.getItem('mc_aktif_kullanici') || 'ADMIN';
        normalized.kullanici = aktifKullanici;
    }

    // 5. Tutar normalizasyonu
    if (typeof normalized.tutar === 'string') {
        normalized.tutar = Number.parseFloat(normalized.tutar) || 0;
    }

    // 6. Decimal kontrolü (2 ondalık basamak)
    normalized.tutar = Math.round(normalized.tutar * 100) / 100;

    // 7. Kaynak normalizasyonu (HESABA_YAZ için özel)
    if (!normalized.kaynak) {
        if (normalized.odemeTuru === "HESABA_YAZ") {
            normalized.kaynak = "HESABA_YAZ";
        } else {
            normalized.kaynak = "SISTEM";
        }
    }
    
    // 8. Ödeme türüne göre özel alanlar (HESABA_YAZ için)
    if (normalized.odemeTuru === "HESABA_YAZ") {
        // HESABA_YAZ kayıtları için adisyonId kontrolü
        if (!normalized.adisyonId && normalized.referansId) {
            normalized.adisyonId = normalized.referansId;
        }
        
        // Borç işlemi olduğunu belirt
        normalized.borcIslemi = true;
        
        // Hesaba yaz işlemleri için özel açıklama
        if (!normalized.aciklama) {
            normalized.aciklama = "Müşteri hesabına yazıldı";
        }
    }

    // 9. Oluşturma zamanı
    if (!normalized.created_at) {
        normalized.created_at = new Date().toISOString();
    }

    // 10. Güncelleme zamanı
    normalized.updated_at = new Date().toISOString();

    return normalized;
};

/**
 * Aktif günü kontrol eder ve gerekirse oluşturur
 * @returns {string} Aktif gunId
 */
const aktifGunuKontrolEt = () => {
    try {
        const aktifGun = JSON.parse(localStorage.getItem(AKTIF_GUN_KEY)) || {};
        
        if (!aktifGun.aktifGunId) {
            const bugun = gunIdAl(new Date());
            const yeniAktifGun = {
                aktifGunId: bugun,
                baslangic: new Date().toISOString(),
                kullanici: localStorage.getItem('mc_aktif_kullanici') || 'ADMIN',
                durum: "ACIK"
            };
            
            localStorage.setItem(AKTIF_GUN_KEY, JSON.stringify(yeniAktifGun));
            console.log('✅ Yeni aktif gün oluşturuldu:', bugun);
            return bugun;
        }
        
        return aktifGun.aktifGunId;
    } catch (error) {
        console.error('❌ Aktif gün kontrolünde hata:', error);
        return gunIdAl(new Date());
    }
};

/**
 * Finans kaydına otomatik alanlar ekler
 * @param {Object} kayit - Temel finans kaydı
 * @returns {Object} Tamamlanmış finans kaydı
 */
const finansKaydiniTamamla = (kayit) => {
    const tamamlanmis = { ...kayit };

    // Aktif gunId ekle (tarihe göre otomatik)
    if (!tamamlanmis.gunId) {
        tamamlanmis.gunId = aktifGunuKontrolEt();
    }

    // Benzersiz ID ekle
    if (!tamamlanmis.id) {
        tamamlanmis.id = `finans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Oluşturma zamanı
    if (!tamamlanmis.created_at) {
        tamamlanmis.created_at = new Date().toISOString();
    }

    // Güncelleme zamanı
    tamamlanmis.updated_at = new Date().toISOString();

    // Varsayılan kullanıcı
    if (!tamamlanmis.kullanici) {
        tamamlanmis.kullanici = localStorage.getItem('mc_aktif_kullanici') || 'ADMIN';
    }

    return tamamlanmis;
};

// ============================================================
// ANA FONKSİYONLAR
// ============================================================

/**
 * TEK DOĞRU FİNANS YOLU - Finans kayıtlarını ekler
 * @param {Array|Object} kayitlar - Normalize edilmiş finans kayıtları (dizi veya tek kayıt)
 * @returns {Object} { success: boolean, eklenen: number, hatalar: Array, kayitIds: Array }
 */
const finansKayitlariEkle = (kayitlar) => {
    console.log('💰 [FINANS-HAVUZU] finansKayitlariEkle çağrıldı');

    try {
        // Giriş normalizasyonu
        const kayitListesi = Array.isArray(kayitlar) ? kayitlar : [kayitlar];
        
        if (kayitListesi.length === 0) {
            console.warn('⚠️ [FINANS-HAVUZU] Boş kayıt listesi gönderildi');
            return {
                success: false,
                eklenen: 0,
                hatalar: ['Boş kayıt listesi gönderildi'],
                kayitIds: []
            };
        }

        console.log(`💰 [FINANS-HAVUZU] ${kayitListesi.length} adet finans kaydı işleniyor...`);

        // Mevcut finans havuzunu al
        const mevcutHavuz = JSON.parse(localStorage.getItem(FINANS_HAVUZU_KEY) || "[]");
        const hatalar = [];
        const basariliKayitlar = [];
        const eklenenKayitIds = [];

        // Her kaydı işle
        kayitListesi.forEach((kayit, index) => {
            try {
                console.log(`📝 [FINANS-HAVUZU] Kayıt ${index + 1}/${kayitListesi.length} işleniyor:`, {
                    tur: kayit.tur,
                    odemeTuru: kayit.odemeTuru,
                    tutar: kayit.tutar
                });

                // 1. NORMALİZE ET
                const normalizedKayit = finansKaydiNormalizeEt(kayit);

                // 2. DOĞRULA
                const dogrulama = finansKaydiDogrula(normalizedKayit);
                
                if (!dogrulama.isValid) {
                    hatalar.push({
                        kayitIndex: index,
                        kayitId: normalizedKayit.id,
                        hatalar: dogrulama.errors,
                        orijinal: kayit
                    });
                    console.error(`❌ [FINANS-HAVUZU] Kayıt ${index + 1} doğrulama başarısız:`, dogrulama.errors);
                    return; // Bu kaydı atla
                }

                // 3. TAMAMLA
                const tamamlanmisKayit = finansKaydiniTamamla(normalizedKayit);

                // 4. TEKRAR KONTROLÜ (ID çakışması)
                const mevcutKayit = mevcutHavuz.find(k => k.id === tamamlanmisKayit.id);
                if (mevcutKayit) {
                    console.warn(`⚠️ [FINANS-HAVUZU] Kayıt ID çakışması: ${tamamlanmisKayit.id}, yeni ID oluşturuluyor...`);
                    tamamlanmisKayit.id = `finans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                }

                // 5. EKLE
                mevcutHavuz.push(tamamlanmisKayit);
                basariliKayitlar.push(tamamlanmisKayit);
                eklenenKayitIds.push(tamamlanmisKayit.id);

                console.log(`✅ [FINANS-HAVUZU] Kayıt ${index + 1} başarıyla eklendi:`, {
                    id: tamamlanmisKayit.id,
                    tur: tamamlanmisKayit.tur,
                    odemeTuru: tamamlanmisKayit.odemeTuru,
                    tutar: tamamlanmisKayit.tutar.toFixed(2),
                    gunId: tamamlanmisKayit.gunId
                });

            } catch (kayitHatasi) {
                console.error(`❌ [FINANS-HAVUZU] Kayıt ${index + 1} işlenirken hata:`, kayitHatasi);
                hatalar.push({
                    kayitIndex: index,
                    hata: kayitHatasi.message,
                    orijinal: kayit
                });
            }
        });

        // 6. HAVUZU KAYDET
        if (basariliKayitlar.length > 0) {
            localStorage.setItem(FINANS_HAVUZU_KEY, JSON.stringify(mevcutHavuz));
            
            // Storage event'ini tetikle
            window.dispatchEvent(new StorageEvent('storage', {
                key: FINANS_HAVUZU_KEY,
                newValue: JSON.stringify(mevcutHavuz)
            }));

            console.log(`💰 [FINANS-HAVUZU] ${basariliKayitlar.length} adet finans kaydı başarıyla eklendi. Yeni toplam: ${mevcutHavuz.length}`);
        }

        // 7. RAPOR OLUŞTUR
        const toplamGelir = basariliKayitlar
            .filter(k => k.tur === "GELIR" && k.odemeTuru !== "HESABA_YAZ")
            .reduce((sum, k) => sum + k.tutar, 0);
        
        const toplamIndirim = basariliKayitlar
            .filter(k => k.tur === "INDIRIM")
            .reduce((sum, k) => sum + k.tutar, 0);

        console.log('📊 [FINANS-HAVUZU] İşlem raporu:', {
            toplamIslenen: kayitListesi.length,
            basarili: basariliKayitlar.length,
            basarisiz: hatalar.length,
            toplamGelir: toplamGelir.toFixed(2),
            toplamIndirim: toplamIndirim.toFixed(2),
            eklenenKayitIds: eklenenKayitIds
        });

        return {
            success: basariliKayitlar.length > 0,
            eklenen: basariliKayitlar.length,
            hatalar: hatalar,
            kayitIds: eklenenKayitIds,
            rapor: {
                toplamGelir,
                toplamIndirim,
                gunId: aktifGunuKontrolEt()
            }
        };

    } catch (error) {
        console.error('❌ [FINANS-HAVUZU] finansKayitlariEkle fonksiyonunda beklenmeyen hata:', error);
        
        return {
            success: false,
            eklenen: 0,
            hatalar: [{
                hata: error.message,
                stack: error.stack
            }],
            kayitIds: [],
            rapor: null
        };
    }
};

/**
 * Tek bir finans kaydı ekler (finansKayitlariEkle wrapper'ı)
 * @param {Object} kayit - Normalize edilmiş finans kaydı
 * @returns {Object} { success: boolean, kayitId: string, hatalar: Array }
 */
const kayitEkle = (kayit) => {
    console.log('💰 [FINANS-HAVUZU] kayitEkle çağrıldı (tek kayıt)');
    
    const sonuc = finansKayitlariEkle(kayit);
    
    return {
        success: sonuc.success,
        kayitId: sonuc.kayitIds.length > 0 ? sonuc.kayitIds[0] : null,
        hatalar: sonuc.hatalar
    };
};

// ============================================================
// RAPORLAMA FONKSİYONLARI
// ============================================================

/**
 * Belirli bir gün için finans raporu oluşturur
 * @param {string} gunId - Rapor alınacak gün ID (YYYY-MM-DD)
 * @returns {Object} Günlük finans raporu
 */
const gunlukFinansRaporuAl = (gunId = null) => {
    try {
        const hedefGunId = gunId || aktifGunuKontrolEt();
        const havuz = JSON.parse(localStorage.getItem(FINANS_HAVUZU_KEY) || "[]");
        
        const gunKayitlari = havuz.filter(k => k.gunId === hedefGunId);
        
        // Gelirleri ödeme türüne göre grupla
        const gelirGruplari = {};
        const gelirler = gunKayitlari.filter(k => k.tur === "GELIR");
        
        gelirler.forEach(gelir => {
            const tip = gelir.odemeTuru || "DIGER";
            if (!gelirGruplari[tip]) {
                gelirGruplari[tip] = {
                    toplam: 0,
                    kayitlar: []
                };
            }
            gelirGruplari[tip].toplam += gelir.tutar;
            gelirGruplari[tip].kayitlar.push(gelir);
        });
        
        // Diğer türleri grupla
        const digerTurler = {};
        gunKayitlari
            .filter(k => k.tur !== "GELIR")
            .forEach(kayit => {
                const tur = kayit.tur;
                if (!digerTurler[tur]) {
                    digerTurler[tur] = {
                        toplam: 0,
                        kayitlar: []
                    };
                }
                digerTurler[tur].toplam += kayit.tutar;
                digerTurler[tur].kayitlar.push(kayit);
            });
        
        // Toplamlar
        const toplamGelir = gelirler.reduce((sum, g) => sum + g.tutar, 0);
        const toplamIndirim = gunKayitlari
            .filter(k => k.tur === "INDIRIM")
            .reduce((sum, k) => sum + k.tutar, 0);
        
        const netGelir = toplamGelir - toplamIndirim;
        
        const rapor = {
            gunId: hedefGunId,
            toplamKayit: gunKayitlari.length,
            toplamGelir,
            toplamIndirim,
            netGelir,
            gelirGruplari,
            digerTurler,
            kayitlar: gunKayitlari,
            olusturulmaZamani: new Date().toISOString()
        };
        
        console.log(`📊 [FINANS-HAVUZU] ${hedefGunId} günlük rapor oluşturuldu:`, {
            toplamKayit: rapor.toplamKayit,
            toplamGelir: rapor.toplamGelir.toFixed(2),
            toplamIndirim: rapor.toplamIndirim.toFixed(2),
            netGelir: rapor.netGelir.toFixed(2)
        });
        
        return rapor;
        
    } catch (error) {
        console.error('❌ [FINANS-HAVUZU] Günlük finans raporu alınırken hata:', error);
        return null;
    }
};

/**
 * Tarih aralığı için finans raporu oluşturur
 * @param {string} baslangicTarihi - Başlangıç tarihi (YYYY-MM-DD)
 * @param {string} bitisTarihi - Bitiş tarihi (YYYY-MM-DD)
 * @returns {Object} Tarih aralığı finans raporu
 */
const tarihAraligiFinansRaporuAl = (baslangicTarihi, bitisTarihi) => {
    try {
        const havuz = JSON.parse(localStorage.getItem(FINANS_HAVUZU_KEY) || "[]");
        
        const baslangic = new Date(baslangicTarihi);
        const bitis = new Date(bitisTarihi);
        
        const aralikKayitlari = havuz.filter(k => {
            const kayitTarihi = new Date(k.gunId);
            return kayitTarihi >= baslangic && kayitTarihi <= bitis;
        });
        
        // Günlere göre grupla
        const gunlukRaporlar = {};
        aralikKayitlari.forEach(kayit => {
            if (!gunlukRaporlar[kayit.gunId]) {
                gunlukRaporlar[kayit.gunId] = {
                    toplamGelir: 0,
                    toplamIndirim: 0,
                    kayitlar: []
                };
            }
            
            if (kayit.tur === "GELIR") {
                gunlukRaporlar[kayit.gunId].toplamGelir += kayit.tutar;
            } else if (kayit.tur === "INDIRIM") {
                gunlukRaporlar[kayit.gunId].toplamIndirim += kayit.tutar;
            }
            
            gunlukRaporlar[kayit.gunId].kayitlar.push(kayit);
        });
        
        // Toplamlar
        const toplamGelir = aralikKayitlari
            .filter(k => k.tur === "GELIR")
            .reduce((sum, k) => sum + k.tutar, 0);
        
        const toplamIndirim = aralikKayitlari
            .filter(k => k.tur === "INDIRIM")
            .reduce((sum, k) => sum + k.tutar, 0);
        
        const netGelir = toplamGelir - toplamIndirim;
        
        const rapor = {
            baslangicTarihi,
            bitisTarihi,
            toplamKayit: aralikKayitlari.length,
            toplamGelir,
            toplamIndirim,
            netGelir,
            gunlukRaporlar,
            kayitlar: aralikKayitlari,
            olusturulmaZamani: new Date().toISOString()
        };
        
        console.log(`📊 [FINANS-HAVUZU] ${baslangicTarihi} - ${bitisTarihi} aralığı raporu:`, {
            toplamKayit: rapor.toplamKayit,
            toplamGelir: rapor.toplamGelir.toFixed(2),
            toplamIndirim: rapor.toplamIndirim.toFixed(2),
            netGelir: rapor.netGelir.toFixed(2),
            gunSayisi: Object.keys(rapor.gunlukRaporlar).length
        });
        
        return rapor;
        
    } catch (error) {
        console.error('❌ [FINANS-HAVUZU] Tarih aralığı finans raporu alınırken hata:', error);
        return null;
    }
};

// ============================================================
// YARDIMCI FONKSİYONLAR
// ============================================================

/**
 * Finans havuzunu temizler (PRODUCTION'DA KAPALI)
 * @returns {boolean} Başarı durumu (her zaman false - production'da kapalı)
 */
const finansHavuzunuTemizle = () => {
    console.error('❌ [FINANS-HAVUZU] Finans havuzu temizleme production ve demo ortamlarında KAPALIDIR');
    console.error('❌ Temizlik gerekiyorsa manuel script kullanın veya yöneticiye başvurun.');
    return false;
};

/**
 * Finans havuzu durumunu kontrol eder
 * @returns {Object} Havuz durumu
 */
const finansHavuzuDurumu = () => {
    try {
        const havuz = JSON.parse(localStorage.getItem(FINANS_HAVUZU_KEY) || "[]");
        const aktifGunId = aktifGunuKontrolEt();
        
        const gunKayitlari = havuz.filter(k => k.gunId === aktifGunId);
        const toplamGelir = gunKayitlari
            .filter(k => k.tur === "GELIR" && k.odemeTuru !== "HESABA_YAZ")
            .reduce((sum, k) => sum + k.tutar, 0);
        
        return {
            aktifGunId,
            toplamKayit: havuz.length,
            bugunkuKayit: gunKayitlari.length,
            bugunkuGelir: toplamGelir,
            sonGuncelleme: havuz.length > 0 ? havuz[havuz.length - 1].updated_at : null,
            durum: "AKTIF"
        };
    } catch (error) {
        console.error('❌ [FINANS-HAVUZU] Havuz durumu alınırken hata:', error);
        return {
            durum: "HATA",
            hata: error.message
        };
    }
};

// ============================================================
// ESKİ FONKSİYONLAR - KULLANIMDAN KALDIRILDI
// ============================================================

/**
 * @deprecated KULLANIMDAN KALDIRILDI - Ham adisyon almayacak
 * Yerine: finansKayitlariEkle kullanın
 */
const adisyonKapandigindaKaydet = () => {
    console.error('❌ [FINANS-HAVUZU] adisyonKapandigindaKaydet KULLANIMDAN KALDIRILDI!');
    console.error('❌ Yerine finansKayitlariEkle kullanın.');
    throw new Error('adisyonKapandigindaKaydet kullanımdan kaldırıldı. finansKayitlariEkle kullanın.');
};

/**
 * @deprecated KULLANIMDAN KALDIRILDI - Ham veri almayacak
 * Yerine: finansKayitlariEkle kullanın
 */
const finansHavuzunaEkle = () => {
    console.error('❌ [FINANS-HAVUZU] finansHavuzunaEkle KULLANIMDAN KALDIRILDI!');
    console.error('❌ Yerine finansKayitlariEkle kullanın.');
    throw new Error('finansHavuzunaEkle kullanımdan kaldırıldı. finansKayitlariEkle kullanın.');
};

// ============================================================
// MODÜL İHRACI
// ============================================================

const mcFinansHavuzu = {
    // ANA FONKSİYONLAR
    finansKayitlariEkle,
    kayitEkle,
    
    // RAPORLAMA
    gunlukFinansRaporuAl,
    tarihAraligiFinansRaporuAl,
    
    // YARDIMCI FONKSİYONLAR
    finansHavuzuDurumu,
    finansHavuzunuTemizle,
    
    // TARİH FONKSİYONLARI
    gunIdAl,
    
    // KURALLAR (salt okunur)
    KURALLAR: Object.freeze({ ...FINANS_KURALLARI }),
    
    // KEY'LER
    KEYLER: {
        FINANS_HAVUZU_KEY,
        AKTIF_GUN_KEY
    },
    
    // DOĞRULAMA FONKSİYONLARI (geliştirme için)
    _finansKaydiDogrula: finansKaydiDogrula,
    _finansKaydiNormalizeEt: finansKaydiNormalizeEt
};

export default mcFinansHavuzu;