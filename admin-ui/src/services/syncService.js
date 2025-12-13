// 📁 src/services/syncService.js
// GÜNCELLENMİŞ SENKRONİZASYON SERVİSİ - MASA BOSALT VE ANLIK FİYAT DÜZELTİLDİ

// LocalStorage key'leri
const KEYS = {
  MASALAR: 'mc_masalar',
  ADISYONLAR: 'mc_adisyonlar',
  URUNLER: 'mc_urunler',
  MUSTERILER: 'mc_musteriler',
  BORCLAR: 'mc_borclar'
};

// Event tipleri
export const SYNC_EVENTS = {
  MASA_GUNCELLENDI: 'MASA_GUNCELLENDI',
  ADISYON_GUNCELLENDI: 'ADISYON_GUNCELLENDI',
  URUN_GUNCELLENDI: 'URUN_GUNCELLENDI',
  MUSTERI_GUNCELLENDI: 'MUSTERI_GUNCELLENDI',
  BORC_GUNCELLENDI: 'BORC_GUNCELLENDI',
  SENKRONIZE_ET: 'SENKRONIZE_ET',
  FİYAT_GUNCELLENDI: 'FİYAT_GUNCELLENDI',
  KALEM_EKLENDI: 'KALEM_EKLENDI',
  KALEM_SILINDI: 'KALEM_SILINDI',
  TOPLAM_GUNCELLENDI: 'TOPLAM_GUNCELLENDI'
};

// Yardımcı fonksiyonlar - DÜZELTİLDİ!
const okuJSON = (key, defaultValue = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
};

const yazJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    
    // CRITICAL FIX: Storage event'ini tetikle
    window.dispatchEvent(new Event('storage'));
    
    return true;
  } catch {
    return false;
  }
};

const formatFiyat = (fiyat) => {
  return Number(fiyat || 0).toFixed(2);
};

// Ana senkronizasyon servisi
export const syncService = {
  // =============== OKUMA/YAZMA ===============
  oku: (key) => okuJSON(key),
  
  yaz: (key, value) => {
    const result = yazJSON(key, value);
    
    // İlgili event'i tetikle
    const eventMap = {
      'mc_masalar': SYNC_EVENTS.MASA_GUNCELLENDI,
      'mc_adisyonlar': SYNC_EVENTS.ADISYON_GUNCELLENDI,
      'mc_urunler': SYNC_EVENTS.URUN_GUNCELLENDI,
      'mc_musteriler': SYNC_EVENTS.MUSTERI_GUNCELLENDI,
      'mc_borclar': SYNC_EVENTS.BORC_GUNCELLENDI
    };
    
    if (eventMap[key]) {
      syncService.emitEvent(eventMap[key], { key, value });
    }
    
    return result;
  },

  // =============== MASA İŞLEMLERİ - DÜZELTİLDİ! ===============
  
  // MASAYI TEMİZLE (KAPAT) - EN KRİTİK DÜZELTME!
  masaBosalt: (masaNum) => {
    console.log('🧹 SYNC: Masa temizleniyor', masaNum);
    
    try {
      let masalar = okuJSON(KEYS.MASALAR);
      
      // Masa numarasını parse et
      let masaNoNum;
      
      if (typeof masaNum === 'string') {
        if (masaNum.startsWith("MASA ")) {
          masaNoNum = Number(masaNum.replace("MASA ", ""));
        } else if (masaNum.startsWith("MASA")) {
          masaNoNum = Number(masaNum.replace("MASA", ""));
        } else {
          masaNoNum = Number(masaNum);
        }
      } else {
        masaNoNum = Number(masaNum);
      }
      
      console.log('🔍 Aranan masa no:', masaNoNum);
      
      const masaIdx = masalar.findIndex((m) => Number(m.no) === masaNoNum);

      if (masaIdx !== -1) {
        console.log('✅ Masa bulundu, indeks:', masaIdx);
        
        const bosMasa = {
          ...masalar[masaIdx],
          adisyonId: null,
          ayirId: null,
          ayirToplam: null,
          toplamTutar: "0.00",
          acilisZamani: null,
          durum: "BOŞ",
          renk: "gri",
          musteriAdi: null,
          kisiSayisi: null,
          guncellemeZamani: new Date().toISOString()
        };
        
        masalar[masaIdx] = bosMasa;
        
        // Kaydet ve storage event'ini tetikle
        yazJSON(KEYS.MASALAR, masalar);
        
        // Event'i hemen tetikle (setTimeout'a gerek yok)
        syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
          masaNo: masaNoNum,
          masa: bosMasa,
          toplamTutar: "0.00",
          durum: "BOŞ"
        });
        
        console.log('✅ SYNC: Masa temizlendi', bosMasa);
        return true;
      } else {
        console.error('❌ SYNC: Masa bulunamadı', masaNoNum);
        return false;
      }
    } catch (error) {
      console.error('❌ SYNC: Masa temizleme hatası', error);
      return false;
    }
  },

  // MASA AÇ (Yeni müşteri için)
  masaAc: (masaNum, musteriAdi = null, kisiSayisi = null) => {
    try {
      let masalar = okuJSON(KEYS.MASALAR);
      const masaNoNum = Number(masaNum.toString().replace("MASA ", ""));
      const masaIdx = masalar.findIndex((m) => Number(m.no) === masaNoNum);

      if (masaIdx !== -1) {
        const acikMasa = {
          ...masalar[masaIdx],
          musteriAdi: musteriAdi,
          kisiSayisi: kisiSayisi,
          acilisZamani: new Date().toISOString(),
          guncellemeZamani: new Date().toISOString()
        };
        
        masalar[masaIdx] = acikMasa;
        yazJSON(KEYS.MASALAR, masalar);
        
        syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
          masaNo: masaNoNum,
          masa: acikMasa
        });
        
        console.log('🚪 SYNC: Masa açıldı', masaNoNum);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ SYNC: Masa açma hatası', error);
      return false;
    }
  },

  // GÜNCEL MASA
  guncelMasa: (masaNum, anaAdisyonId, splitAdisyonObj = null) => {
    console.log('🔄 SYNC: Masa güncelleniyor', { masaNum, anaAdisyonId, splitAdisyonObj: splitAdisyonObj ? 'VAR' : 'YOK' });
    
    try {
      let masalar = okuJSON(KEYS.MASALAR);
      const adisyonlar = okuJSON(KEYS.ADISYONLAR);
      
      // Masa numarasını parse et
      const masaNoNum = Number(masaNum.toString().replace("MASA ", ""));
      const masaIdx = masalar.findIndex((m) => Number(m.no) === masaNoNum);
      
      if (masaIdx === -1) {
        console.error('❌ SYNC: Masa bulunamadı', masaNoNum);
        return false;
      }
      
      // 1. Ana adisyon toplamını hesapla
      let anaAdisyonToplam = 0;
      let acilisZamani = null;
      const anaAdisyon = adisyonlar.find(a => a.id === anaAdisyonId && !a.kapali);
      
      if (anaAdisyon) {
        if (anaAdisyon.kalemler) {
          anaAdisyonToplam = anaAdisyon.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
        }
        acilisZamani = anaAdisyon.acilisZamani;
      }
      
      // 2. Split adisyon toplamını hesapla
      let ayirToplam = null;
      if (splitAdisyonObj && splitAdisyonObj.kalemler && splitAdisyonObj.kalemler.length > 0) {
        ayirToplam = splitAdisyonObj.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
      }
      
      // 3. Toplam tutarı hesapla (ana + split)
      const toplamTutar = anaAdisyonToplam + (ayirToplam ? Number(ayirToplam) : 0);
      
      // 4. Masa kaydını güncelle
      const guncelMasa = {
        ...masalar[masaIdx],
        adisyonId: anaAdisyonId,
        ayirId: splitAdisyonObj ? splitAdisyonObj.id : null,
        ayirToplam: ayirToplam ? formatFiyat(ayirToplam) : null,
        toplamTutar: formatFiyat(toplamTutar),
        acilisZamani: acilisZamani || masalar[masaIdx].acilisZamani,
        durum: toplamTutar > 0 ? "DOLU" : "BOŞ",
        renk: toplamTutar > 0 ? "kırmızı" : "gri",
        guncellemeZamani: new Date().toISOString()
      };
      
      masalar[masaIdx] = guncelMasa;
      
      // 5. Kaydet
      yazJSON(KEYS.MASALAR, masalar);
      
      // 6. Event yayınla
      syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
        masaNo: masaNoNum,
        masa: guncelMasa,
        toplamTutar: formatFiyat(toplamTutar)
      });
      
      console.log('✅ SYNC: Masa güncellendi', guncelMasa);
      return true;
      
    } catch (error) {
      console.error('❌ SYNC: Masa güncelleme hatası', error);
      return false;
    }
  },

  // =============== ADİSYON İŞLEMLERİ ===============
  guncelAdisyon: (adisyonData) => {
    if (!adisyonData || !adisyonData.id) {
      console.error('❌ SYNC: Geçersiz adisyon data');
      return;
    }
    
    try {
      const adisyonlar = okuJSON(KEYS.ADISYONLAR);
      const idx = adisyonlar.findIndex((a) => a.id === adisyonData.id);
      
      if (idx === -1) {
        adisyonlar.push(adisyonData);
      } else {
        adisyonlar[idx] = adisyonData;
      }
      
      yazJSON(KEYS.ADISYONLAR, adisyonlar);
      
      // Event yayınla
      syncService.emitEvent(SYNC_EVENTS.ADISYON_GUNCELLENDI, {
        adisyonId: adisyonData.id,
        adisyon: adisyonData
      });
      
      console.log('✅ SYNC: Adisyon güncellendi', adisyonData.id);
      return adisyonData;
      
    } catch (error) {
      console.error('❌ SYNC: Adisyon güncelleme hatası', error);
      return null;
    }
  },

  // YENİ ADİSYON OLUŞTUR
  yeniAdisyon: (masaNo, musteriAdi = null) => {
    try {
      const yeniAdisyon = {
        id: Date.now().toString(),
        masaNo: masaNo,
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
      };
      
      const adisyonlar = okuJSON(KEYS.ADISYONLAR);
      adisyonlar.push(yeniAdisyon);
      yazJSON(KEYS.ADISYONLAR, adisyonlar);
      
      // Masa açılış zamanını güncelle
      syncService.masaAc(masaNo, musteriAdi, null);
      
      console.log('📄 SYNC: Yeni adisyon oluşturuldu', yeniAdisyon.id);
      return yeniAdisyon;
    } catch (error) {
      console.error('❌ SYNC: Yeni adisyon hatası', error);
      return null;
    }
  },

  // ADİSYONU KAPAT VE MASAYI TEMİZLE - GERİ EKLENDİ!
  kapatAdisyonVeMasayiTemizle: (adisyonId, masaNum) => {
    try {
      console.log('🔄 SYNC: Adisyon kapatılıyor ve masa temizleniyor', { adisyonId, masaNum });
      
      // 1. Adisyonu kapat
      const adisyonlar = okuJSON(KEYS.ADISYONLAR);
      const adisyonIdx = adisyonlar.findIndex(a => a.id === adisyonId);
      
      if (adisyonIdx !== -1) {
        adisyonlar[adisyonIdx] = {
          ...adisyonlar[adisyonIdx],
          kapali: true,
          kapanisZamani: new Date().toISOString(),
          durum: "KAPALI"
        };
        yazJSON(KEYS.ADISYONLAR, adisyonlar);
        console.log('✅ Adisyon kapatıldı:', adisyonId);
      }
      
      // 2. Masayı temizle (yukarıdaki düzeltilmiş fonksiyonu kullan)
      const success = syncService.masaBosalt(masaNum);
      
      return success;
    } catch (error) {
      console.error('❌ SYNC: Adisyon kapatma ve masa temizleme hatası', error);
      return false;
    }
  },

  // =============== ANLIK FİYAT GÜNCELLEME - BASİT VERSİYON ===============
  
  // KALEM EKLE VE MASA TOPLAMINI GÜNCELLE
  kalemEkleVeToplamGuncelle: (adisyonId, kalemData) => {
    console.log('➕ SYNC: Kalem ekleniyor ve toplam güncelleniyor...', { adisyonId, kalemData });
    
    try {
      // 1. Adisyonu bul
      const adisyonlar = okuJSON(KEYS.ADISYONLAR);
      const adisyonIndex = adisyonlar.findIndex(a => a.id === adisyonId);
      
      if (adisyonIndex === -1) {
        console.error('❌ SYNC: Adisyon bulunamadı');
        return false;
      }
      
      // 2. Yeni kalem
      const yeniKalem = {
        id: `kalem_${Date.now()}`,
        urunId: kalemData.urunId,
        urunAdi: kalemData.urunAdi,
        birimFiyat: formatFiyat(kalemData.birimFiyat),
        miktar: Number(kalemData.miktar) || 1,
        toplam: formatFiyat(kalemData.birimFiyat * (kalemData.miktar || 1)),
        tarih: new Date().toISOString()
      };
      
      // 3. Kalemi ekle
      if (!adisyonlar[adisyonIndex].kalemler) {
        adisyonlar[adisyonIndex].kalemler = [];
      }
      adisyonlar[adisyonIndex].kalemler.push(yeniKalem);
      
      // 4. Adisyon toplamını güncelle
      const toplamTutar = adisyonlar[adisyonIndex].kalemler.reduce(
        (sum, k) => sum + Number(k.toplam || 0), 
        0
      );
      
      adisyonlar[adisyonIndex].toplamTutar = formatFiyat(toplamTutar);
      adisyonlar[adisyonIndex].guncellemeZamani = new Date().toISOString();
      
      // 5. Kaydet
      yazJSON(KEYS.ADISYONLAR, adisyonlar);
      
      // 6. Masayı güncelle (masaNo'yu adisyondan al)
      const masaNo = adisyonlar[adisyonIndex].masaNo;
      if (masaNo) {
        syncService.guncelMasa(masaNo, adisyonId);
      }
      
      // 7. Event'leri tetikle
      syncService.emitEvent(SYNC_EVENTS.KALEM_EKLENDI, {
        adisyonId: adisyonId,
        kalem: yeniKalem
      });
      
      syncService.emitEvent(SYNC_EVENTS.FİYAT_GUNCELLENDI, {
        adisyonId: adisyonId,
        toplamTutar: formatFiyat(toplamTutar)
      });
      
      console.log('✅ SYNC: Kalem eklendi ve toplam güncellendi');
      return true;
      
    } catch (error) {
      console.error('❌ SYNC: Kalem ekleme hatası:', error);
      return false;
    }
  },

  // =============== EVENT SİSTEMİ ===============
  eventListeners: new Map(),
  
  on: (event, callback) => {
    if (!syncService.eventListeners.has(event)) {
      syncService.eventListeners.set(event, []);
    }
    syncService.eventListeners.get(event).push(callback);
  },
  
  off: (event, callback) => {
    if (syncService.eventListeners.has(event)) {
      const listeners = syncService.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  },
  
  emitEvent: (event, data) => {
    console.log(`📢 SYNC: Event yayınlandı - ${event}`, data);
    
    // Local event listeners
    if (syncService.eventListeners.has(event)) {
      syncService.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ SYNC: Event listener hatası (${event})`, error);
        }
      });
    }
    
    // Window event
    window.dispatchEvent(new CustomEvent(event.toLowerCase(), { detail: data }));
    
    // Storage event
    window.dispatchEvent(new Event('storage'));
  },

  // =============== SENKRONİZASYON İŞLEMLERİ ===============
  senkronizeMasalar: () => {
    console.log('🔄 SYNC: Tüm masalar senkronize ediliyor...');
    
    try {
      const masalar = okuJSON(KEYS.MASALAR);
      const adisyonlar = okuJSON(KEYS.ADISYONLAR);
      
      masalar.forEach((masa, index) => {
        // Toplam tutarı hesapla
        let toplamTutar = 0;
        
        // Ana adisyon toplamı
        if (masa.adisyonId) {
          const anaAdisyon = adisyonlar.find(a => a.id === masa.adisyonId && !a.kapali);
          if (anaAdisyon && anaAdisyon.kalemler) {
            toplamTutar += anaAdisyon.kalemler.reduce((sum, k) => sum + Number(k.toplam || 0), 0);
          }
        }
        
        // Split adisyon toplamı
        if (masa.ayirId) {
          const splitAdisyon = adisyonlar.find(a => a.id === masa.ayirId && !a.kapali);
          if (splitAdisyon && splitAdisyon.kalemler) {
            toplamTutar += splitAdisyon.kalemler.reduce((sum, k) => sum + Number(k.toplam || 0), 0);
          }
        }
        
        // Masa durumunu güncelle
        masalar[index] = {
          ...masa,
          toplamTutar: formatFiyat(toplamTutar),
          durum: toplamTutar > 0 ? "DOLU" : "BOŞ",
          renk: toplamTutar > 0 ? "kırmızı" : "gri",
          guncellemeZamani: new Date().toISOString()
        };
      });
      
      yazJSON(KEYS.MASALAR, masalar);
      
      syncService.emitEvent(SYNC_EVENTS.SENKRONIZE_ET, {
        masalar: masalar,
        zaman: new Date().toISOString()
      });
      
      console.log('✅ SYNC: Tüm masalar senkronize edildi');
      return masalar;
      
    } catch (error) {
      console.error('❌ SYNC: Senkronizasyon hatası', error);
      return [];
    }
  },

  // =============== BASİT TEST FONKSİYONU ===============
  testMasaGuncelleme: (masaNo) => {
    console.log('🧪 SYNC: Masa güncelleme testi...');
    
    const masalar = okuJSON(KEYS.MASALAR);
    const masa = masalar.find(m => Number(m.no) === Number(masaNo));
    
    if (masa && masa.adisyonId) {
      // Rastgele bir ürün ekle
      const testKalem = {
        urunId: 'test-' + Date.now(),
        urunAdi: 'Test Ürün',
        birimFiyat: Math.random() * 50 + 10,
        miktar: Math.floor(Math.random() * 3) + 1
      };
      
      return syncService.kalemEkleVeToplamGuncelle(masa.adisyonId, testKalem);
    }
    
    return false;
  }
};

// Global olarak kullanılabilir yap
if (typeof window !== 'undefined') {
  window.syncService = syncService;
}

export default syncService;