/* ------------------------------------------------------------
   🔧 syncService.js — MyCafe Senkronizasyon Servisi
   📌 TÜM MASA, ADİSYON ve VERİ SENKRONİZASYONU
------------------------------------------------------------ */

const SYNC_EVENTS = {
  MASA_GUNCELLENDI: 'MASA_GUNCELLENDI',
  ADİSYON_GUNCELLENDİ: 'ADİSYON_GUNCELLENDİ',
  FİYAT_GUNCELLENDİ: 'FİYAT_GUNCELLENDİ',
  KALEM_EKLENDİ: 'KALEM_EKLENDİ',
  SENKRONIZE_ET: 'SENKRONIZE_ET',
  MASA_TEMİZLENDİ: 'MASA_TEMİZLENDİ'
};

// LocalStorage key'leri
const MASA_KEY = "mc_masalar";
const ADİSYON_KEY = "mc_adisyonlar";
const URUN_KEY = "mc_urunler";
const MUSTERI_KEY = "mc_musteriler";
const BORC_KEY = "mc_borclar";

const syncService = {
  // Event listener'lar
  _listeners: {},
  
  // --------------------------------------------------
  // TEMEL FONKSİYONLAR
  // --------------------------------------------------
  oku: (key, defaultValue = []) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    } catch (error) {
      console.error(`❌ JSON parse hatası (${key}):`, error);
      return defaultValue;
    }
  },

  yaz: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`❌ LocalStorage yazma hatası (${key}):`, error);
      return false;
    }
  },

  // --------------------------------------------------
  // EVENT SİSTEMİ
  // --------------------------------------------------
  on: (eventName, callback) => {
    if (!syncService._listeners[eventName]) {
      syncService._listeners[eventName] = [];
    }
    syncService._listeners[eventName].push(callback);
    console.log(`📢 Event listener eklendi: ${eventName}`);
  },

  off: (eventName, callback) => {
    if (!syncService._listeners[eventName]) return;
    const index = syncService._listeners[eventName].indexOf(callback);
    if (index !== -1) {
      syncService._listeners[eventName].splice(index, 1);
    }
  },

  emitEvent: (eventName, data = {}) => {
    console.log(`📢 SYNC: Event yayınlandı - ${eventName}`, data);
    
    // Global event yayınla (diğer sayfalar için)
    if (typeof window !== 'undefined') {
      const event = new CustomEvent(`sync:${eventName.toLowerCase()}`, { detail: data });
      window.dispatchEvent(event);
    }
    
    // Local listener'ları çağır
    if (syncService._listeners[eventName]) {
      syncService._listeners[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Event callback hatası (${eventName}):`, error);
        }
      });
    }
  },

  // --------------------------------------------------
  // MASA İŞLEMLERİ - DÜZELTİLDİ
  // --------------------------------------------------
  normalizeMasaNo: (masaNo) => {
    if (masaNo === null || masaNo === undefined) return "1";
    
    // String ise
    if (typeof masaNo === 'string') {
      // "MASA " ön ekini kaldır ve sadece sayıyı al
      const cleaned = masaNo.replace(/MASA\s*/i, '').trim();
      const numbers = cleaned.match(/\d+/);
      return numbers ? numbers[0] : "1";
    }
    
    // Number ise
    if (typeof masaNo === 'number') {
      return String(masaNo);
    }
    
    return "1";
  },

  masaBosalt: (masaNum) => {
    console.log('🧹 SYNC: Masa temizleniyor', masaNum);
    
    const normalizedMasaNo = syncService.normalizeMasaNo(masaNum);
    let masalar = syncService.oku(MASA_KEY, []);
    
    const masaIdx = masalar.findIndex(m => 
      m.no === normalizedMasaNo || 
      m.id === Number(normalizedMasaNo) ||
      m.masaNo === `MASA ${normalizedMasaNo}` ||
      m.masaNum === normalizedMasaNo
    );
    
    if (masaIdx === -1) {
      console.error('❌ SYNC: Masa bulunamadı', { aranan: normalizedMasaNo, masalar });
      return false;
    }
    
    // Toplam tutarı kaydet (rapor için)
    const toplamTutar = masalar[masaIdx].toplamTutar || "0.00";
    
    // MASAYI TEMİZLE
    masalar[masaIdx] = {
      ...masalar[masaIdx],
      adisyonId: null,
      ayirId: null,
      ayirToplam: null,
      toplamTutar: "0.00", // Sıfırla
      acilisZamani: null,
      kapanisZamani: new Date().toISOString(), // Kapanış zamanı
      durum: "BOŞ",
      renk: "gri",
      musteriAdi: null,
      kisiSayisi: null,
      guncellemeZamani: new Date().toISOString(),
      sonAdisyonToplam: toplamTutar // Son adisyon tutarını kaydet
    };
    
    syncService.yaz(MASA_KEY, masalar);
    
    // EVENT YAYINLA
    syncService.emitEvent(SYNC_EVENTS.MASA_TEMİZLENDİ, {
      masaNo: normalizedMasaNo,
      masaNum: normalizedMasaNo,
      toplamTutar: toplamTutar
    });
    
    console.log('✅ SYNC: Masa temizlendi - Masa', normalizedMasaNo, 'Son Tutar:', toplamTutar);
    return true;
  },

  masaAc: (masaNum, adisyonId, musteriAdi = null) => {
    console.log('🔄 SYNC: Masa açılıyor', { masaNum, adisyonId, musteriAdi });
    
    const normalizedMasaNo = syncService.normalizeMasaNo(masaNum);
    let masalar = syncService.oku(MASA_KEY, []);
    
    const masaIdx = masalar.findIndex(m => 
      m.no === normalizedMasaNo || 
      m.id === Number(normalizedMasaNo) ||
      m.masaNo === `MASA ${normalizedMasaNo}` ||
      m.masaNum === normalizedMasaNo
    );
    
    if (masaIdx === -1) {
      console.error('❌ SYNC: Masa bulunamadı', normalizedMasaNo);
      return false;
    }
    
    // MASAYI AÇ
    masalar[masaIdx] = {
      ...masalar[masaIdx],
      adisyonId: adisyonId,
      ayirId: null,
      ayirToplam: null,
      toplamTutar: "0.00",
      acilisZamani: new Date().toISOString(),
      kapanisZamani: null,
      durum: "DOLU",
      renk: "red",
      musteriAdi: musteriAdi,
      kisiSayisi: musteriAdi ? 1 : null,
      guncellemeZamani: new Date().toISOString()
    };
    
    syncService.yaz(MASA_KEY, masalar);
    
    // EVENT YAYINLA
    syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
      masaNo: normalizedMasaNo,
      masaNum: normalizedMasaNo,
      masa: masalar[masaIdx],
      toplamTutar: "0.00"
    });
    
    console.log('✅ SYNC: Masa açıldı - Masa', normalizedMasaNo);
    return true;
  },

  guncelMasa: (masaNum, anaAdisyonId, splitAdisyonObj, toplamTutar = "0.00") => {
    console.log('🔄 SYNC: Masa güncelleniyor', { 
      masaNum, 
      anaAdisyonId, 
      hasSplit: splitAdisyonObj ? 'VAR' : 'YOK', 
      toplamTutar 
    });
    
    const normalizedMasaNo = syncService.normalizeMasaNo(masaNum);
    let masalar = syncService.oku(MASA_KEY, []);
    
    const masaIdx = masalar.findIndex(m => 
      m.no === normalizedMasaNo || 
      m.id === Number(normalizedMasaNo) ||
      m.masaNo === `MASA ${normalizedMasaNo}` ||
      m.masaNum === normalizedMasaNo
    );
    
    if (masaIdx === -1) {
      console.error('❌ SYNC: Masa bulunamadı', { aranan: normalizedMasaNo, masalar });
      return false;
    }
    
    // Ayırma toplamını hesapla
    let ayirToplam = null;
    if (splitAdisyonObj && splitAdisyonObj.kalemler) {
      ayirToplam = Number(
        splitAdisyonObj.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0)
      ).toFixed(2);
    }
    
    // MASAYI GÜNCELLE
    masalar[masaIdx] = {
      ...masalar[masaIdx],
      adisyonId: anaAdisyonId,
      ayirId: splitAdisyonObj ? splitAdisyonObj.id : null,
      ayirToplam: ayirToplam,
      toplamTutar: toplamTutar,
      durum: "DOLU",
      renk: "red",
      guncellemeZamani: new Date().toISOString()
    };
    
    syncService.yaz(MASA_KEY, masalar);
    
    // EVENT YAYINLA
    syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
      masaNo: normalizedMasaNo,
      masaNum: normalizedMasaNo,
      masa: masalar[masaIdx],
      toplamTutar: toplamTutar
    });
    
    console.log('✅ SYNC: Masa güncellendi - Masa', normalizedMasaNo, 'Toplam:', toplamTutar);
    return true;
  },

  // --------------------------------------------------
  // ADİSYON İŞLEMLERİ
  // --------------------------------------------------
  guncelAdisyon: (adisyonId, guncelAdisyon) => {
    console.log('📝 SYNC: Adisyon güncelleniyor', adisyonId);
    
    let adisyonlar = syncService.oku(ADİSYON_KEY, []);
    const adisyonIdx = adisyonlar.findIndex(a => a.id === adisyonId);
    
    if (adisyonIdx === -1) {
      console.error('❌ SYNC: Adisyon bulunamadı', adisyonId);
      return false;
    }
    
    adisyonlar[adisyonIdx] = {
      ...adisyonlar[adisyonIdx],
      ...guncelAdisyon,
      guncellemeZamani: new Date().toISOString()
    };
    
    syncService.yaz(ADİSYON_KEY, adisyonlar);
    
    // EVENT YAYINLA
    syncService.emitEvent(SYNC_EVENTS.ADİSYON_GUNCELLENDİ, {
      adisyonId: adisyonId,
      adisyon: adisyonlar[adisyonIdx]
    });
    
    console.log('✅ SYNC: Adisyon güncellendi', adisyonId);
    return true;
  },

  yeniAdisyon: (masaNum, musteriAdi = null) => {
    console.log('🆕 SYNC: Yeni adisyon oluşturuluyor', { masaNum, musteriAdi });
    
    const normalizedMasaNo = syncService.normalizeMasaNo(masaNum);
    const yeniAdisyon = {
      id: `ad_${Date.now().toString()}`,
      masaNo: `MASA ${normalizedMasaNo}`,
      masaNum: normalizedMasaNo,
      acilisZamani: new Date().toISOString(),
      kapanisZamani: null,
      kalemler: [],
      odemeler: [],
      indirim: 0,
      hesabaYazKayitlari: [],
      kapali: false,
      isSplit: false,
      parentAdisyonId: null,
      durum: "AÇIK",
      toplamTutar: "0.00",
      musteriAdi: musteriAdi,
      guncellemeZamani: new Date().toISOString()
    };
    
    let adisyonlar = syncService.oku(ADİSYON_KEY, []);
    adisyonlar.push(yeniAdisyon);
    syncService.yaz(ADİSYON_KEY, adisyonlar);
    
    // EVENT YAYINLA
    syncService.emitEvent(SYNC_EVENTS.ADİSYON_GUNCELLENDİ, {
      adisyonId: yeniAdisyon.id,
      adisyon: yeniAdisyon,
      isNew: true
    });
    
    console.log('✅ SYNC: Yeni adisyon oluşturuldu', yeniAdisyon.id);
    return yeniAdisyon.id;
  },

  kapatAdisyonVeMasayiTemizle: (masaNum, adisyonId, toplamTutar = "0.00") => {
    console.log('🔴 SYNC: Adisyon kapatılıyor ve masa temizleniyor', { 
      masaNum, 
      adisyonId, 
      toplamTutar 
    });
    
    // 1. ADİSYONU KAPAT
    let adisyonlar = syncService.oku(ADİSYON_KEY, []);
    const adisyonIdx = adisyonlar.findIndex(a => a.id === adisyonId);
    
    if (adisyonIdx !== -1) {
      adisyonlar[adisyonIdx] = {
        ...adisyonlar[adisyonIdx],
        kapali: true,
        kapanisZamani: new Date().toISOString(),
        durum: "KAPALI",
        toplamTutar: toplamTutar,
        guncellemeZamani: new Date().toISOString()
      };
      syncService.yaz(ADİSYON_KEY, adisyonlar);
      console.log('✅ SYNC: Adisyon kapatıldı', adisyonId);
    }
    
    // 2. MASAYI TEMİZLE
    const masaSuccess = syncService.masaBosalt(masaNum);
    
    if (masaSuccess) {
      console.log('✅ SYNC: Adisyon kapatıldı ve masa temizlendi', { masaNum, adisyonId });
      return true;
    }
    
    return false;
  },

  // --------------------------------------------------
  // KALEM İŞLEMLERİ
  // --------------------------------------------------
  kalemEkleVeToplamGuncelle: (adisyonId, kalemData, yeniToplam = null) => {
    console.log('➕ SYNC: Kalem ekleniyor ve toplam güncelleniyor...', { adisyonId, kalemData });
    
    // 1. ADİSYONU BUL
    let adisyonlar = syncService.oku(ADİSYON_KEY, []);
    const adisyonIdx = adisyonlar.findIndex(a => a.id === adisyonId);
    
    if (adisyonIdx === -1) {
      console.error('❌ SYNC: Adisyon bulunamadı', adisyonId);
      return false;
    }
    
    const adisyon = adisyonlar[adisyonIdx];
    
    // 2. KALEMİ EKLE
    const yeniKalem = {
      id: `kalem_${Date.now().toString()}`,
      urunId: kalemData.urunId,
      urunAd: kalemData.urunAdi,
      urunAdi: kalemData.urunAdi,
      adet: kalemData.miktar || 1,
      birimFiyat: Number(kalemData.birimFiyat || 0),
      toplam: Number(kalemData.birimFiyat || 0) * (kalemData.miktar || 1),
      eklenmeZamani: new Date().toISOString()
    };
    
    // Mevcut kalemleri al
    const mevcutKalemler = [...(adisyon.kalemler || [])];
    
    // Aynı ürün var mı kontrol et
    const mevcutKalemIdx = mevcutKalemler.findIndex(
      k => k.urunId === kalemData.urunId && 
           Number(k.birimFiyat) === Number(kalemData.birimFiyat || 0)
    );
    
    if (mevcutKalemIdx === -1) {
      // Yeni kalem ekle
      mevcutKalemler.push(yeniKalem);
    } else {
      // Mevcut kalemi güncelle
      const kalem = { ...mevcutKalemler[mevcutKalemIdx] };
      kalem.adet += (kalemData.miktar || 1);
      kalem.toplam = kalem.adet * kalem.birimFiyat;
      mevcutKalemler[mevcutKalemIdx] = kalem;
    }
    
    // 3. TOPLAM TUTARI HESAPLA
    let toplamTutar = "0.00";
    if (yeniToplam !== null) {
      toplamTutar = Number(yeniToplam).toFixed(2);
    } else {
      toplamTutar = Number(
        mevcutKalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0)
      ).toFixed(2);
    }
    
    // 4. ADİSYONU GÜNCELLE
    adisyonlar[adisyonIdx] = {
      ...adisyon,
      kalemler: mevcutKalemler,
      toplamTutar: toplamTutar,
      guncellemeZamani: new Date().toISOString()
    };
    
    syncService.yaz(ADİSYON_KEY, adisyonlar);
    
    // 5. MASAYI GÜNCELLE (Eğer masaNo varsa)
    if (adisyon.masaNum || adisyon.masaNo) {
      const masaNum = adisyon.masaNum || syncService.normalizeMasaNo(adisyon.masaNo);
      syncService.guncelMasa(masaNum, adisyonId, null, toplamTutar);
    }
    
    // 6. EVENT'LERİ YAYINLA
    syncService.emitEvent(SYNC_EVENTS.KALEM_EKLENDİ, {
      adisyonId: adisyonId,
      kalem: yeniKalem,
      toplamTutar: toplamTutar
    });
    
    syncService.emitEvent(SYNC_EVENTS.FİYAT_GUNCELLENDİ, {
      adisyonId: adisyonId,
      toplamTutar: toplamTutar
    });
    
    console.log('✅ SYNC: Kalem eklendi ve toplam güncellendi', { 
      adisyonId, 
      toplamTutar,
      kalemSayisi: mevcutKalemler.length 
    });
    
    return true;
  },

  // --------------------------------------------------
  // SENKRONİZASYON İŞLEMLERİ
  // --------------------------------------------------
  senkronizeMasalar: () => {
    console.log('🔄 SYNC: Tüm masalar senkronize ediliyor...');
    
    try {
      const masalar = syncService.oku(MASA_KEY, []);
      const adisyonlar = syncService.oku(ADİSYON_KEY, []);
      
      // Her masa için güncelle
      const guncellenenMasalar = masalar.map(masa => {
        // Masa boşsa, hiçbir şey yapma
        if (masa.durum === "BOŞ" || !masa.adisyonId) {
          return masa;
        }
        
        // Adisyonu bul
        const adisyon = adisyonlar.find(a => a.id === masa.adisyonId);
        if (!adisyon) {
          console.warn(`⚠️ SYNC: Adisyon bulunamadı (Masa ${masa.no})`, masa.adisyonId);
          return masa;
        }
        
        // Yeni adisyon toplamını hesapla
        const yeniToplam = (adisyon.kalemler || []).reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
        
        // Eğer split adisyon varsa, onun toplamını da ekle
        let splitToplam = 0;
        if (masa.ayirId) {
          const splitAdisyon = adisyonlar.find(a => a.id === masa.ayirId);
          if (splitAdisyon) {
            splitToplam = (splitAdisyon.kalemler || []).reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
          }
        }
        
        const toplamTutar = (yeniToplam + splitToplam).toFixed(2);
        
        // Eğer toplam değiştiyse güncelle
        if (masa.toplamTutar !== toplamTutar) {
          console.log(`🔄 SYNC: Masa ${masa.no} toplamı güncelleniyor: ${masa.toplamTutar} -> ${toplamTutar}`);
          
          return {
            ...masa,
            toplamTutar: toplamTutar,
            guncellemeZamani: new Date().toISOString()
          };
        }
        
        return masa;
      });
      
      // Değişiklik varsa kaydet
      const degisiklikVar = JSON.stringify(masalar) !== JSON.stringify(guncellenenMasalar);
      if (degisiklikVar) {
        syncService.yaz(MASA_KEY, guncellenenMasalar);
        console.log('✅ SYNC: Masalar güncellendi');
      }
      
      // EVENT YAYINLA
      syncService.emitEvent(SYNC_EVENTS.SENKRONIZE_ET, {
        masalar: guncellenenMasalar,
        zaman: new Date().toISOString(),
        degisiklikVar: degisiklikVar
      });
      
      console.log('✅ SYNC: Tüm masalar senkronize edildi');
      return true;
      
    } catch (error) {
      console.error('❌ SYNC: Senkronizasyon hatası:', error);
      return false;
    }
  },

  // --------------------------------------------------
  // YARDIMCI FONKSİYONLAR
  // --------------------------------------------------
  masaBul: (masaNum) => {
    const normalizedMasaNo = syncService.normalizeMasaNo(masaNum);
    const masalar = syncService.oku(MASA_KEY, []);
    
    const masa = masalar.find(m => 
      m.no === normalizedMasaNo || 
      m.id === Number(normalizedMasaNo) ||
      m.masaNo === `MASA ${normalizedMasaNo}` ||
      m.masaNum === normalizedMasaNo
    );
    
    return masa || null;
  },

  adisyonBul: (adisyonId) => {
    const adisyonlar = syncService.oku(ADİSYON_KEY, []);
    return adisyonlar.find(a => a.id === adisyonId) || null;
  },

  // --------------------------------------------------
  // BAŞLANGIÇ KONTROLÜ
  // --------------------------------------------------
  init: () => {
    console.log('🚀 SYNC: SyncService başlatılıyor...');
    
    // Global event listener'ları kur
    if (typeof window !== 'undefined') {
      // Storage değişikliklerini dinle
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('mc_')) {
          console.log('💾 SYNC: Storage değişti:', event.key);
          
          // Eğer masalar değiştiyse, senkronizasyon yap
          if (event.key === MASA_KEY || event.key === ADİSYON_KEY) {
            setTimeout(() => {
              syncService.senkronizeMasalar();
            }, 300);
          }
        }
      });
      
      // Global event listener'ları kur
      Object.values(SYNC_EVENTS).forEach(eventName => {
        window.addEventListener(`sync:${eventName.toLowerCase()}`, (event) => {
          console.log(`🌐 SYNC: Global event alındı: ${eventName}`, event.detail);
        });
      });
    }
    
    console.log('✅ SYNC: SyncService başlatıldı');
    return true;
  }
};

// Otomatik başlat
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncService.init();
    // Başlangıç senkronizasyonu
    setTimeout(() => {
      syncService.senkronizeMasalar();
    }, 1000);
  }, 500);
}

export default syncService;