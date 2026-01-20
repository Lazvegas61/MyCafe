// File: admin-ui/src/services/kasaService.js
/* ------------------------------------------------------------
   💰 kasaService.js — MyCafe Kasa Raporu Servisi
   📌 KASA VERİLERİNİ OKUMA ve RAPORLAMA (SADECE OKUMA)
   📌 YAZMA İŞLEMLERİ syncService ÜZERİNDEN YAPILIR
------------------------------------------------------------ */
const __KASA_DEPRECATED__ = true;

// LocalStorage Key'leri - syncService ile SENKRONİZE
const KASA_HAREKETLERI_KEY = "mc_kasa_hareketleri";
const GUN_BASI_KASA_KEY = "mc_gun_basi_kasa";
const GUN_SONU_KASA_KEY = "mc_gun_sonu_kasa";

// Kasa Hareket Tipleri
const KASA_TIPLERI = {
  GUN_BASI: "GUN_BASI",
  GUN_SONU: "GUN_SONU",
  TAHISILAT: "TAHSILAT",
  MANUEL_GIRIS: "MANUEL_GIRIS",
  MANUEL_CIKIS: "MANUEL_CIKIS",
  BORC_TAHSILATI: "BORC_TAHSILATI"
};

// Ödeme Tipleri
const ODEME_TIPLERI = {
  NAKIT: "NAKIT",
  KART: "KART",
  HAVALE: "HAVALE",
  HESABA_YAZ: "HESABA_YAZ",
  DIGER: "DIGER"
};

const kasaService = {
  // --------------------------------------------------
  // TEMEL OKUMA FONKSİYONLARI (SADECE OKUMA)
  // --------------------------------------------------
  oku: (key, defaultValue = []) => {
    if (__KASA_DEPRECATED__) {
      console.warn("[DEPRECATED] kasaService.oku çağrıldı – AŞAMA 1 kilidi aktif");
      return defaultValue;
    }
    
    try {
      // ÖNCE localStorageService'den dene
      if (typeof window !== 'undefined' && window.localStorageService) {
        return window.localStorageService.getByKey(key) || defaultValue;
      }
      
      // Fallback: direkt localStorage
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (error) {
      console.error(`❌ KASA: JSON parse hatası (${key}):`, error);
      return defaultValue;
    }
  },

  // --------------------------------------------------
  // RAPOR ALMA FONKSİYONLARI (SADECE OKUMA)
  // --------------------------------------------------
  
  /**
   * Tarih aralığına göre kasa raporu getir
   * KRITIK: syncService tarafından oluşturulan verileri okur
   */
  kasaRaporuGetir: (baslangicTarihi, bitisTarihi) => {
    if (__KASA_DEPRECATED__) {
      console.warn("[DEPRECATED] kasaService.kasaRaporuGetir çağrıldı – AŞAMA 1 kilidi aktif");
      return null;
    }
    
    console.log('💰 KASA: Rapor oluşturuluyor', { baslangicTarihi, bitisTarihi });
    
    if (!baslangicTarihi || !bitisTarihi) {
      console.error('❌ KASA: Tarih aralığı belirtilmeli');
      return null;
    }
    
    // Tüm hareketleri getir (syncService'den)
    const tumHareketler = kasaService.oku(KASA_HAREKETLERI_KEY, []);
    
    // ÖDEME TARİHİNE göre filtrele
    const filtrelenmisHareketler = tumHareketler.filter(hareket => {
      // Hareket tarihini al (ödeme tarihi veya normal tarih)
      const hareketTarihi = hareket.odemeTarihi || hareket.tarih;
      if (!hareketTarihi) return false;
      
      // Tarih karşılaştırması yap
      const tarih = hareketTarihi.split('T')[0];
      return tarih >= baslangicTarihi && tarih <= bitisTarihi;
    });
    
    // Gün başı ve gün sonu kayıtlarını getir
    const gunBasiKayitlari = kasaService.oku(GUN_BASI_KASA_KEY, []);
    const gunSonuKayitlari = kasaService.oku(GUN_SONU_KASA_KEY, []);
    
    // Filtrelenmiş gün başı/sonu kayıtları
    const filtrelenmisGunBasi = gunBasiKayitlari.filter(k => 
      k.tarih >= baslangicTarihi && k.tarih <= bitisTarihi
    );
    
    const filtrelenmisGunSonu = gunSonuKayitlari.filter(k => 
      k.tarih >= baslangicTarihi && k.tarih <= bitisTarihi
    );
    
    // Hesaplamalar
    const toplamTahsilat = filtrelenmisHareketler
      .filter(h => h.tip === KASA_TIPLERI.TAHISILAT && h.kasaGirisi === true)
      .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0);
    
    // Ödeme türü dağılımı
    const odemeDagilimi = {
      nakit: 0,
      kart: 0,
      havale: 0,
      hesabaYaz: 0,
      diger: 0
    };
    
    filtrelenmisHareketler
      .filter(h => h.tip === KASA_TIPLERI.TAHISILAT)
      .forEach(h => {
        switch (h.altTip) {
          case ODEME_TIPLERI.NAKIT:
            odemeDagilimi.nakit += parseFloat(h.tutar) || 0;
            break;
          case ODEME_TIPLERI.KART:
            odemeDagilimi.kart += parseFloat(h.tutar) || 0;
            break;
          case ODEME_TIPLERI.HAVALE:
            odemeDagilimi.havale += parseFloat(h.tutar) || 0;
            break;
          case ODEME_TIPLERI.HESABA_YAZ:
            odemeDagilimi.hesabaYaz += parseFloat(h.tutar) || 0;
            break;
          default:
            odemeDagilimi.diger += parseFloat(h.tutar) || 0;
            break;
        }
      });
    
    // Tahsilat türleri
    const tahsilatTurleri = {
      adisyonTahsilat: filtrelenmisHareketler
        .filter(h => h.tip === KASA_TIPLERI.TAHISILAT && h.kasaGirisi === true && !h.sonradanTahsilat)
        .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0),
      
      hesabaYazTahsilat: filtrelenmisHareketler
        .filter(h => h.altTip === ODEME_TIPLERI.HESABA_YAZ)
        .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0),
      
      sonradanTahsilat: filtrelenmisHareketler
        .filter(h => h.sonradanTahsilat === true)
        .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0)
    };
    
    // Kasa özeti
    const gunBasiKasa = filtrelenmisGunBasi.reduce((sum, k) => sum + (parseFloat(k.tutar) || 0), 0);
    const gunSonuKasa = filtrelenmisGunSonu.reduce((sum, k) => sum + (parseFloat(k.tutar) || 0), 0);
    const kasaFarki = (gunBasiKasa + toplamTahsilat) - gunSonuKasa;
    
    // Hareket detayları
    const hareketDetaylari = filtrelenmisHareketler.map(h => ({
      id: h.id,
      tarih: h.odemeTarihi || h.tarih,
      tip: h.tip,
      altTip: h.altTip,
      tutar: parseFloat(h.tutar) || 0,
      aciklama: h.aciklama,
      masaNo: h.masaNo,
      adisyonId: h.adisyonId,
      musteriAdi: h.musteriAdi,
      kasaGirisi: h.kasaGirisi,
      sonradanTahsilat: h.sonradanTahsilat || false
    }));
    
    const rapor = {
      hareketler: hareketDetaylari,
      kasaOzet: {
        gunBasiKasa,
        gunSonuKasa,
        toplamTahsilat,
        kasaFarki,
        netKasa: gunBasiKasa + toplamTahsilat - gunSonuKasa
      },
      odemeDagilimi,
      tahsilatTurleri,
      gunBasiKayitlari: filtrelenmisGunBasi,
      gunSonuKayitlari: filtrelenmisGunSonu,
      istatistikler: {
        toplamHareket: filtrelenmisHareketler.length,
        tahsilatHareket: filtrelenmisHareketler.filter(h => h.tip === KASA_TIPLERI.TAHISILAT).length,
        gunBasiKayit: filtrelenmisGunBasi.length,
        gunSonuKayit: filtrelenmisGunSonu.length,
        ortalamaTahsilat: toplamTahsilat / (filtrelenmisHareketler.filter(h => h.tip === KASA_TIPLERI.TAHISILAT).length || 1)
      },
      sorgu: {
        baslangicTarihi,
        bitisTarihi,
        hareketSayisi: filtrelenmisHareketler.length,
        olusturulmaTarihi: new Date().toISOString()
      }
    };
    
    console.log('✅ KASA: Rapor oluşturuldu', {
      hareketSayisi: rapor.sorgu.hareketSayisi,
      toplamTahsilat: rapor.kasaOzet.toplamTahsilat,
      kasaFarki: rapor.kasaOzet.kasaFarki
    });
    
    return rapor;
  },

  // --------------------------------------------------
  // ÖZEL RAPORLAR
  // --------------------------------------------------
  
  /**
   * Günlük kasa raporu
   */
  gunlukKasaRaporu: (tarih = null) => {
    if (__KASA_DEPRECATED__) {
      console.warn("[DEPRECATED] kasaService.gunlukKasaRaporu çağrıldı – AŞAMA 1 kilidi aktif");
      return null;
    }
    
    const targetDate = tarih || new Date().toISOString().split('T')[0];
    return kasaService.kasaRaporuGetir(targetDate, targetDate);
  },

  /**
   * Haftalık kasa raporu
   */
  haftalikKasaRaporu: (baslangicTarihi = null) => {
    if (__KASA_DEPRECATED__) {
      console.warn("[DEPRECATED] kasaService.haftalikKasaRaporu çağrıldı – AŞAMA 1 kilidi aktif");
      return null;
    }
    
    const today = new Date();
    const startDate = baslangicTarihi ? new Date(baslangicTarihi) : new Date(today.setDate(today.getDate() - 7));
    const endDate = new Date();
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    return kasaService.kasaRaporuGetir(startStr, endStr);
  },

  /**
   * Aylık kasa raporu
   */
  aylikKasaRaporu: (yil = null, ay = null) => {
    if (__KASA_DEPRECATED__) {
      console.warn("[DEPRECATED] kasaService.aylikKasaRaporu çağrıldı – AŞAMA 1 kilidi aktif");
      return null;
    }
    
    const today = new Date();
    const targetYear = yil || today.getFullYear();
    const targetMonth = ay !== null ? ay : today.getMonth() + 1;
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    return kasaService.kasaRaporuGetir(startStr, endStr);
  },

  /**
   * Ödeme tipine göre rapor
   */
  odemeTipiRaporu: (odemeTipi, baslangicTarihi, bitisTarihi) => {
    if (__KASA_DEPRECATED__) {
      console.warn("[DEPRECATED] kasaService.odemeTipiRaporu çağrıldı – AŞAMA 1 kilidi aktif");
      return null;
    }
    
    const rapor = kasaService.kasaRaporuGetir(baslangicTarihi, bitisTarihi);
    if (!rapor) return null;
    
    const filtrelenmisHareketler = rapor.hareketler.filter(h => 
      h.altTip === odemeTipi
    );
    
    const toplamTutar = filtrelenmisHareketler.reduce((sum, h) => sum + h.tutar, 0);
    
    return {
      odemeTipi,
      baslangicTarihi,
      bitisTarihi,
      hareketler: filtrelenmisHareketler,
      toplamTutar,
      ortalamaTutar: toplamTutar / (filtrelenmisHareketler.length || 1),
      hareketSayisi: filtrelenmisHareketler.length,
      yuzde: rapor.kasaOzet.toplamTahsilat > 0 ? 
        (toplamTutar / rapor.kasaOzet.toplamTahsilat) * 100 : 0
    };
  },

  // --------------------------------------------------
  // İSTATİSTİK FONKSİYONLARI
  // --------------------------------------------------
  
  /**
   * En çok satış yapılan masalar
   */
  enCokSatisYapanMasalar: (baslangicTarihi, bitisTarihi, limit = 10) => {
    if (__KASA_DEPRECATED__) {
      console.warn("[DEPRECATED] kasaService.enCokSatisYapanMasalar çağrıldı – AŞAMA 1 kilidi aktif");
      return [];
    }
    
    const rapor = kasaService.kasaRaporuGetir(baslangicTarihi, bitisTarihi);
    if (!rapor) return [];
    
    const masaSatislari = {};
    
    rapor.hareketler.forEach(h => {
      if (h.masaNo && h.kasaGirisi === true) {
        if (!masaSatislari[h.masaNo]) {
          masaSatislari[h.masaNo] = {
            masaNo: h.masaNo,
            toplamTutar: 0,
            hareketSayisi: 0
          };
        }
        masaSatislari[h.masaNo].toplamTutar += h.tutar;
        masaSatislari[h.masaNo].hareketSayisi++;
      }
    });
    
    return Object.values(masaSatislari)
      .sort((a, b) => b.toplamTutar - a.toplamTutar)
      .slice(0, limit);
  },

  /**
   * En çok harcama yapan müşteriler
   */
  enCokHarcamaYapanMusteriler: (baslangicTarihi, bitisTarihi, limit = 10) => {
    if (__KASA_DEPRECATED__) {
      console.warn("[DEPRECATED] kasaService.enCokHarcamaYapanMusteriler çağrıldı – AŞAMA 1 kilidi aktif");
      return [];
    }
    
    const rapor = kasaService.kasaRaporuGetir(baslangicTarihi, bitisTarihi);
    if (!rapor) return [];
    
    const musteriHarcamalari = {};
    
    rapor.hareketler.forEach(h => {
      if (h.musteriAdi && h.kasaGirisi === true) {
        const musteriAdi = h.musteriAdi.trim();
        if (!musteriHarcamalari[musteriAdi]) {
          musteriHarcamalari[musteriAdi] = {
            musteriAdi: musteriAdi,
            toplamTutar: 0,
            hareketSayisi: 0
          };
        }
        musteriHarcamalari[musteriAdi].toplamTutar += h.tutar;
        musteriHarcamalari[musteriAdi].hareketSayisi++;
      }
    });
    
    return Object.values(musteriHarcamalari)
      .sort((a, b) => b.toplamTutar - a.toplamTutar)
      .slice(0, limit);
  },

  /**
   * Saatlik satış analizi
   */
  saatlikSatisAnalizi: (baslangicTarihi, bitisTarihi) => {
    if (__KASA_DEPRECATED__) {
      console.warn("[DEPRECATED] kasaService.saatlikSatisAnalizi çağrıldı – AŞAMA 1 kilidi aktif");
      return [];
    }
    
    const rapor = kasaService.kasaRaporuGetir(baslangicTarihi, bitisTarihi);
    if (!rapor) return [];
    
    const saatlikAnaliz = Array.from({ length: 24 }, (_, i) => ({
      saat: i,
      toplamTutar: 0,
      hareketSayisi: 0
    }));
    
    rapor.hareketler.forEach(h => {
      if (h.kasaGirisi === true && h.tarih) {
        const saat = new Date(h.tarih).getHours();
        if (saat >= 0 && saat < 24) {
          saatlikAnaliz[saat].toplamTutar += h.tutar;
          saatlikAnaliz[saat].hareketSayisi++;
        }
      }
    });
    
    return saatlikAnaliz.filter(s => s.hareketSayisi > 0);
  },

  // --------------------------------------------------
  // EVENT DİNLEYİCİ KURULUMU (SADECE LOGLAMA)
  // --------------------------------------------------
  
  /**
   * SyncService event'lerini dinlemeye başla (SADECE LOGLAMA)
   */
  initEventListeners: () => {
    console.log('💰 KASA: Event listener\'lar kuruluyor (sadece loglama)...');
    
    // SyncService'in gönderdiği kasa event'lerini dinle (SADECE LOGLAMA)
    if (typeof window !== 'undefined' && window.syncService) {
      // Kasa hareketi eklendiğinde logla
      window.syncService.on('KASA_HAREKETI_EKLENDI', (hareket) => {
        console.log('💰 KASA: SyncService kasa hareketi ekledi', {
          id: hareket.id,
          tip: hareket.tip,
          tutar: hareket.tutar,
          tarih: hareket.odemeTarihi || hareket.tarih
        });
      });
      
      // Ödeme alındığında logla
      window.syncService.on('ODEME_ALINDI', (odeme) => {
        console.log('💰 KASA: SyncService ödeme kaydetti', {
          id: odeme.id,
          adisyonId: odeme.adisyonId,
          tutar: odeme.tutar,
          tip: odeme.altTip
        });
      });
      
      console.log('✅ KASA: Event listener\'lar kuruldu (sadece loglama)');
    } else {
console.log('ℹ️ KASA: SyncService henüz hazır değil, daha sonra bağlanacak');
    }
  },

  // --------------------------------------------------
  // YARDIMCI FONKSİYONLAR
  // --------------------------------------------------
  
  /**
   * Bugünün kasa durumunu getir
   */
  bugununKasaDurumu: () => {
    if (__KASA_DEPRECATED__) {
      console.warn("[DEPRECATED] kasaService.bugununKasaDurumu çağrıldı – AŞAMA 1 kilidi aktif");
      return null;
    }
    
    const bugun = new Date().toISOString().split('T')[0];
    return kasaService.kasaRaporuGetir(bugun, bugun);
  },

  /**
   * Kasa bakiyesini hesapla
   */
  kasaBakiyesiHesapla: (tarih = null) => {
    if (__KASA_DEPRECATED__) {
      console.warn("[DEPRECATED] kasaService.kasaBakiyesiHesapla çağrıldı – AŞAMA 1 kilidi aktif");
      return {
        tarih: tarih || new Date().toISOString().split('T')[0],
        gunBasi: 0,
        tahsilat: 0,
        gunSonu: 0,
        beklenenKasa: 0,
        fark: 0,
        tamamlandi: false
      };
    }
    
    const targetDate = tarih || new Date().toISOString().split('T')[0];
    
    const gunBasiKayitlari = kasaService.oku(GUN_BASI_KASA_KEY, []);
    const gunSonuKayitlari = kasaService.oku(GUN_SONU_KASA_KEY, []);
    const kasaHareketleri = kasaService.oku(KASA_HAREKETLERI_KEY, []);
    
    // Bugünkü gün başı kasa
    const bugununGunBasi = gunBasiKayitlari.find(k => k.tarih === targetDate);
    const gunBasiTutar = bugununGunBasi ? parseFloat(bugununGunBasi.tutar) : 0;
    
    // Bugünkü tahsilatlar
    const bugununTahsilatlari = kasaHareketleri
      .filter(h => {
        const hareketTarihi = (h.odemeTarihi || h.tarih).split('T')[0];
        return hareketTarihi === targetDate && h.kasaGirisi === true;
      })
      .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0);
    
    // Bugünkü gün sonu kasa
    const bugununGunSonu = gunSonuKayitlari.find(k => k.tarih === targetDate);
    const gunSonuTutar = bugununGunSonu ? parseFloat(bugununGunSonu.tutar) : 0;
    
    return {
      tarih: targetDate,
      gunBasi: gunBasiTutar,
      tahsilat: bugununTahsilatlari,
      gunSonu: gunSonuTutar,
      beklenenKasa: gunBasiTutar + bugununTahsilatlari,
      fark: (gunBasiTutar + bugununTahsilatlari) - gunSonuTutar,
      tamamlandi: bugununGunSonu !== undefined
    };
  },

  /**
   * Eksik gün sonu kontrolleri
   */
  eksikGunSonuKontrolu: (baslangicTarihi = null, bitisTarihi = null) => {
    if (__KASA_DEPRECATED__) {
      console.warn("[DEPRECATED] kasaService.eksikGunSonuKontrolu çağrıldı – AŞAMA 1 kilidi aktif");
      return {
        baslangicTarihi: baslangicTarihi || new Date().toISOString().split('T')[0],
        bitisTarihi: bitisTarihi || new Date().toISOString().split('T')[0],
        toplamGun: 0,
        eksikGunSonu: [],
        eksikSayisi: 0,
        tamamGunSonu: 0
      };
    }
    
    const start = baslangicTarihi || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    const end = bitisTarihi || new Date().toISOString().split('T')[0];
    
    const gunBasiKayitlari = kasaService.oku(GUN_BASI_KASA_KEY, []);
    const gunSonuKayitlari = kasaService.oku(GUN_SONU_KASA_KEY, []);
    
    // Tarih aralığındaki tüm tarihler
    const tumTarihler = [];
    const currentDate = new Date(start);
    const endDate = new Date(end);
    
    while (currentDate <= endDate) {
      tumTarihler.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Eksik gün sonu bul
    const eksikGunSonu = tumTarihler.filter(tarih => {
      const gunBasiVar = gunBasiKayitlari.some(k => k.tarih === tarih);
      const gunSonuVar = gunSonuKayitlari.some(k => k.tarih === tarih);
      return gunBasiVar && !gunSonuVar;
    });
    
    return {
      baslangicTarihi: start,
      bitisTarihi: end,
      toplamGun: tumTarihler.length,
      eksikGunSonu: eksikGunSonu,
      eksikSayisi: eksikGunSonu.length,
      tamamGunSonu: tumTarihler.length - eksikGunSonu.length
    };
  },

  // --------------------------------------------------
  // SERVİS BAŞLATMA
  // --------------------------------------------------
  init: () => {
    console.log('🚀 KASA: KasaService başlatılıyor...');
    
    if (__KASA_DEPRECATED__) {
      console.warn("[DEPRECATED] kasaService.init çağrıldı – AŞAMA 1 kilidi aktif");
      return false;
    }
    
    // LocalStorage key'lerini kontrol et (syncService ile senkron)
    const requiredKeys = [
      KASA_HAREKETLERI_KEY,
      GUN_BASI_KASA_KEY,
      GUN_SONU_KASA_KEY
    ];
    
    requiredKeys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
        console.log(`📦 KASA: ${key} key oluşturuldu`);
      }
    });
    
    // Event listener'ları kur (sadece loglama için)
    kasaService.initEventListeners();
    
    // Global yap
    if (typeof window !== 'undefined') {
      window.kasaService = kasaService;
      console.log('✅ KASA: KasaService global olarak yüklendi');
    }
    
    console.log('✅ KASA: KasaService başlatıldı (SADECE OKUMA MODU)');
    return true;
  }
};

// Otomatik başlat
if (typeof window !== 'undefined') {
  setTimeout(() => {
    kasaService.init();
  }, 1500);
}

export default kasaService;
export { KASA_TIPLERI, ODEME_TIPLERI };