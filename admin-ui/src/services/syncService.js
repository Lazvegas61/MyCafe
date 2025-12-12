// 📁 src/services/syncService.js
// SENKRONİZASYON SERVİSİ - Tüm veri işlemleri burada

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
  SENKRONIZE_ET: 'SENKRONIZE_ET'
};

// Yardımcı fonksiyonlar
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
  localStorage.setItem(key, JSON.stringify(value));
};

// Ana senkronizasyon servisi
export const syncService = {
  // =============== OKUMA/YAZMA ===============
  oku: (key) => okuJSON(key),
  
  yaz: (key, value) => {
    yazJSON(key, value);
    
    // Her yazma işleminde storage event tetikle
    window.dispatchEvent(new Event('storage'));
    
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
    
    return value;
  },

  // =============== MASA İŞLEMLERİ ===============
  guncelMasa: (masaNum, anaAdisyonId, splitAdisyonObj = null) => {
    console.log('🔄 SYNC: Masa güncelleniyor', { masaNum, anaAdisyonId, splitAdisyonObj: splitAdisyonObj ? 'VAR' : 'YOK' });
    
    try {
      let masalar = okuJSON(KEYS.MASALAR);
      
      // Masa numarasını parse et
      const masaNoNum = masaNum.toString().startsWith("MASA ") 
        ? Number(masaNum.toString().replace("MASA ", ""))
        : Number(masaNum);
      
      const masaIdx = masalar.findIndex((m) => Number(m.no) === masaNoNum);
      
      if (masaIdx === -1) {
        console.error('❌ SYNC: Masa bulunamadı', masaNoNum);
        return false;
      }
      
      // Adisyonları oku
      const adisyonlar = okuJSON(KEYS.ADISYONLAR);
      
      // 1. Ana adisyon toplamını hesapla
      let anaAdisyonToplam = 0;
      let acilisZamani = null;
      const anaAdisyon = adisyonlar.find(a => a.id === anaAdisyonId && !a.kapali);
      
      if (anaAdisyon) {
        if (anaAdisyon.kalemler) {
          anaAdisyonToplam = anaAdisyon.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
        }
        // AÇILIŞ ZAMANI: İlk adisyonun açılış zamanını al
        acilisZamani = anaAdisyon.acilisZamani;
      }
      
      // 2. Split adisyon toplamını hesapla
      let ayirToplam = null;
      if (splitAdisyonObj && splitAdisyonObj.kalemler && splitAdisyonObj.kalemler.length > 0) {
        ayirToplam = splitAdisyonObj.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
        ayirToplam = Number(ayirToplam).toFixed(2);
      }
      
      // 3. Toplam tutarı hesapla (ana + split)
      const toplamTutar = anaAdisyonToplam + (ayirToplam ? Number(ayirToplam) : 0);
      
      // 4. Masa kaydını güncelle - AÇILIŞ ZAMANI EKLENDİ
      const guncelMasa = {
        ...masalar[masaIdx],
        adisyonId: anaAdisyonId,
        ayirId: splitAdisyonObj ? splitAdisyonObj.id : null,
        ayirToplam: ayirToplam,
        toplamTutar: Number(toplamTutar).toFixed(2),
        acilisZamani: acilisZamani || masalar[masaIdx].acilisZamani, // AÇILIŞ ZAMANI KORU
        durum: toplamTutar > 0 ? "DOLU" : "BOŞ",
        renk: toplamTutar > 0 ? "kırmızı" : "gri",
        guncellemeZamani: new Date().toISOString()
      };
      
      masalar[masaIdx] = guncelMasa;
      
      // 5. Kaydet
      yazJSON(KEYS.MASALAR, masalar);
      console.log('✅ SYNC: Masa güncellendi', guncelMasa);
      
      // 6. Event yayınla
      syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
        masaNo: masaNoNum,
        masa: guncelMasa
      });
      
      return true;
    } catch (error) {
      console.error('❌ SYNC: Masa güncelleme hatası', error);
      return false;
    }
  },

  // MASAYI TEMİZLE (KAPAT)
  masaBosalt: (masaNum) => {
    try {
      let masalar = okuJSON(KEYS.MASALAR);
      const masaNoNum = Number(masaNum.replace("MASA ", ""));
      const masaIdx = masalar.findIndex((m) => Number(m.no) === masaNoNum);

      if (masaIdx !== -1) {
        const bosMasa = {
          ...masalar[masaIdx],
          adisyonId: null,
          ayirId: null,
          ayirToplam: null,
          toplamTutar: null,
          acilisZamani: null, // AÇILIŞ ZAMANI SIFIRLA
          durum: "BOŞ",
          renk: "gri",
          musteriAdi: null,
          kisiSayisi: null,
          guncellemeZamani: new Date().toISOString()
        };
        
        masalar[masaIdx] = bosMasa;
        yazJSON(KEYS.MASALAR, masalar);
        
        syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
          masaNo: masaNoNum,
          masa: bosMasa
        });
        
        console.log('🧹 SYNC: Masa temizlendi', masaNoNum);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ SYNC: Masa temizleme hatası', error);
      return false;
    }
  },

  // MASA AÇ (Yeni müşteri için)
  masaAc: (masaNum, musteriAdi = null, kisiSayisi = null) => {
    try {
      let masalar = okuJSON(KEYS.MASALAR);
      const masaNoNum = Number(masaNum.replace("MASA ", ""));
      const masaIdx = masalar.findIndex((m) => Number(m.no) === masaNoNum);

      if (masaIdx !== -1) {
        const acikMasa = {
          ...masalar[masaIdx],
          musteriAdi: musteriAdi,
          kisiSayisi: kisiSayisi,
          acilisZamani: new Date().toISOString(), // YENİ AÇILIŞ ZAMANI
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
    
    // Window event (mevcut sisteme uyumluluk)
    window.dispatchEvent(new CustomEvent(event.toLowerCase(), { detail: data }));
    
    // BroadcastChannel (multi-tab sync)
    try {
      const channel = new BroadcastChannel('mycafe_sync');
      channel.postMessage({ type: event, data });
      setTimeout(() => channel.close(), 100);
    } catch (e) {
      console.log('📡 SYNC: BroadcastChannel desteklenmiyor');
    }
  },

  // =============== SENKRONİZASYON İŞLEMLERİ ===============
  senkronizeMasalar: () => {
    console.log('🔄 SYNC: Tüm masalar senkronize ediliyor...');
    
    try {
      const masalar = okuJSON(KEYS.MASALAR);
      const adisyonlar = okuJSON(KEYS.ADISYONLAR);
      
      masalar.forEach((masa, index) => {
        // Masa için açık adisyonları bul
        const anaAdisyon = adisyonlar.find(a => a.id === masa.adisyonId && !a.kapali);
        const splitAdisyon = masa.ayirId 
          ? adisyonlar.find(a => a.id === masa.ayirId && !a.kapali)
          : null;
        
        // Toplamı hesapla
        let toplamTutar = 0;
        let acilisZamani = masa.acilisZamani;
        
        if (anaAdisyon) {
          if (anaAdisyon.kalemler) {
            toplamTutar += anaAdisyon.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
          }
          // AÇILIŞ ZAMANI: Ana adisyondan al
          if (anaAdisyon.acilisZamani && !acilisZamani) {
            acilisZamani = anaAdisyon.acilisZamani;
          }
        }
        
        if (splitAdisyon && splitAdisyon.kalemler) {
          toplamTutar += splitAdisyon.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
        }
        
        // Masa durumunu güncelle
        masalar[index] = {
          ...masa,
          toplamTutar: Number(toplamTutar).toFixed(2),
          acilisZamani: acilisZamani, // AÇILIŞ ZAMANI KORU
          durum: toplamTutar > 0 ? "DOLU" : "BOŞ",
          renk: toplamTutar > 0 ? "kırmızı" : "gri",
          guncellemeZamani: new Date().toISOString()
        };
      });
      
      yazJSON(KEYS.MASALAR, masalar);
      console.log('✅ SYNC: Tüm masalar senkronize edildi');
      
      return masalar;
    } catch (error) {
      console.error('❌ SYNC: Senkronizasyon hatası', error);
      return [];
    }
  },

  // =============== SİSTEM SAĞLIĞI ===============
  sistemSaglikKontrol: () => {
    console.log('🏥 SYNC: Sistem sağlık kontrolü başlatılıyor...');
    
    const results = {
      masalar: { count: 0, acilisZamaniEksik: [] },
      adisyonlar: { count: 0, acilisZamaniEksik: [] },
      senkronizasyon: { errors: [] }
    };
    
    try {
      // Masaları kontrol et
      const masalar = okuJSON(KEYS.MASALAR);
      results.masalar.count = masalar.length;
      
      // Açılış zamanı eksik masalar
      results.masalar.acilisZamaniEksik = masalar
        .filter(m => m.durum === 'DOLU' && !m.acilisZamani)
        .map(m => `Masa ${m.no}`);
      
      // Adisyonları kontrol et
      const adisyonlar = okuJSON(KEYS.ADISYONLAR);
      results.adisyonlar.count = adisyonlar.length;
      
      // Açılış zamanı eksik adisyonlar
      results.adisyonlar.acilisZamaniEksik = adisyonlar
        .filter(a => !a.kapali && !a.acilisZamani)
        .map(a => `Adisyon ${a.id} - ${a.masaNo}`);
      
      // Boş adisyonları temizle
      const bosAdisyonlar = adisyonlar.filter(a => 
        (!a.kalemler || a.kalemler.length === 0) && 
        (!a.odemeler || a.odemeler.length === 0) &&
        !a.kapali
      );
      
      if (bosAdisyonlar.length > 0) {
        results.senkronizasyon.errors.push(`${bosAdisyonlar.length} boş adisyon bulundu`);
      }
      
      // Açılış zamanı eksik olanları otomatik düzelt
      if (results.masalar.acilisZamaniEksik.length > 0) {
        results.senkronizasyon.errors.push(
          `${results.masalar.acilisZamaniEksik.length} masa için açılış zamanı eksik`
        );
      }
      
      console.log('✅ SYNC: Sistem sağlık kontrolü tamamlandı', results);
      return results;
      
    } catch (error) {
      console.error('❌ SYNC: Sistem sağlık kontrolü hatası', error);
      return { error: error.message };
    }
  },

  // =============== GEÇEN SÜRE HESAPLAMA ===============
  hesaplaGecenSure: (masaNo) => {
    try {
      const masalar = okuJSON(KEYS.MASALAR);
      const masaNoNum = Number(masaNo.replace("MASA ", ""));
      const masa = masalar.find((m) => Number(m.no) === masaNoNum);
      
      if (!masa || !masa.acilisZamani) {
        return "00:00";
      }
      
      const acilis = new Date(masa.acilisZamani);
      const simdi = new Date();
      const diffMs = simdi - acilis;
      const dakika = Math.floor(diffMs / 60000);
      const saat = Math.floor(dakika / 60);
      const kalanDakika = dakika % 60;
      const sSaat = String(saat).padStart(2, "0");
      const sDakika = String(kalanDakika).padStart(2, "0");
      
      return `${sSaat}:${sDakika}`;
    } catch (error) {
      console.error('❌ SYNC: Geçen süre hesaplama hatası', error);
      return "00:00";
    }
  },

  // =============== MASA BİLGİLERİ ===============
  getMasa: (masaNo) => {
    try {
      const masalar = okuJSON(KEYS.MASALAR);
      const masaNoNum = Number(masaNo.replace("MASA ", ""));
      const masa = masalar.find((m) => Number(m.no) === masaNoNum);
      
      if (masa) {
        // Geçen süreyi hesapla ve ekle
        return {
          ...masa,
          gecenSure: syncService.hesaplaGecenSure(masaNo)
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ SYNC: Masa bilgisi alma hatası', error);
      return null;
    }
  },

  // =============== DEBUG / LOG ===============
  log: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data || '');
  }
};

// Global olarak kullanılabilir yap
if (typeof window !== 'undefined') {
  window.syncService = syncService;
}

export default syncService;