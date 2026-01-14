/* ------------------------------------------------------------
   🔧 syncService.js — MyCafe Senkronizasyon Servisi
   📌 TÜM MASA, ADİSYON ve VERİ SENKRONİZASYONU
   📌 KASA RAPORU EVENT'LERİ EKLENDİ
------------------------------------------------------------ */

const SYNC_EVENTS = {
  MASA_GUNCELLENDI: 'MASA_GUNCELLENDI',
  ADİSYON_GUNCELLENDİ: 'ADİSYON_GUNCELLENDİ',
  FİYAT_GUNCELLENDİ: 'FİYAT_GUNCELLENDİ',
  KALEM_EKLENDİ: 'KALEM_EKLENDİ',
  SENKRONIZE_ET: 'SENKRONIZE_ET',
  MASA_TEMİZLENDİ: 'MASA_TEMİZLENDİ',
  // YENİ EVENT'LER
  PANEL_GUNCELLENDİ: 'PANEL_GUNCELLENDİ',
  DASHBOARD_GUNCELLENDİ: 'DASHBOARD_GUNCELLENDİ',
  // KASA RAPORU EVENT'LERİ
  ODEME_ALINDI: 'ODEME_ALINDI',
  KASA_HAREKETI_EKLENDI: 'KASA_HAREKETI_EKLENDI',
  GUN_BASI_KASA_GIRILDI: 'GUN_BASI_KASA_GIRILDI',
  GUN_SONU_KASA_GIRILDI: 'GUN_SONU_KASA_GIRILDI',
  BORC_TAHSILATI_YAPILDI: 'BORC_TAHSILATI_YAPILDI'
};

// LocalStorage key'leri
const MASA_KEY = "mc_masalar";
const ADİSYON_KEY = "mc_adisyonlar";
const URUN_KEY = "mc_urunler";
const MUSTERI_KEY = "mc_musteriler";
const BORC_KEY = "mc_borclar";
const ACIK_ADISYON_KEY = "mc_acik_adisyonlar";
// KASA RAPORU KEY'LERİ
const KASA_HAREKETLERI_KEY = "mc_kasa_hareketleri";
const GUN_BASI_KASA_KEY = "mc_gun_basi_kasa";
const GUN_SONU_KASA_KEY = "mc_gun_sonu_kasa";

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
  // KASA RAPORU ÖZEL FONKSİYONLARI
  // --------------------------------------------------
  
  /**
   * Ödeme alındığında çağrılacak fonksiyon (Adisyon kapatma)
   */
  odemeAlindi: (odemeData) => {
    console.log('💰 SYNC: Ödeme alındı', odemeData);
    
    // Ödeme bilgilerini kasa hareketleri kaydına ekle
    const kasaHareketleri = syncService.oku(KASA_HAREKETLERI_KEY, []);
    
    const yeniHareket = {
      id: `kasa_${Date.now().toString()}`,
      tip: 'TAHSILAT',
      altTip: odemeData.odemeTipi,
      tutar: odemeData.tutar,
      aciklama: odemeData.aciklama || `Adisyon #${odemeData.adisyonId} ödemesi`,
      adisyonId: odemeData.adisyonId,
      masaNo: odemeData.masaNo,
      musteriAdi: odemeData.musteriAdi,
      // KRİTİK: Ödeme tarihini kullan
      odemeTarihi: odemeData.odemeTarihi || new Date().toISOString(),
      tarih: new Date().toISOString(),
      kasaGirisi: odemeData.odemeTipi !== 'HESABA_YAZ', // Hesaba yaz kasaya girmez
      createdAt: new Date().toISOString(),
      userId: JSON.parse(localStorage.getItem("mc_user"))?.id || "unknown"
    };
    
    kasaHareketleri.push(yeniHareket);
    syncService.yaz(KASA_HAREKETLERI_KEY, kasaHareketleri);
    
    // Event yayınla
    syncService.emitEvent(SYNC_EVENTS.ODEME_ALINDI, yeniHareket);
    syncService.emitEvent(SYNC_EVENTS.KASA_HAREKETI_EKLENDI, yeniHareket);
    
    console.log('✅ SYNC: Ödeme kasa hareketi olarak kaydedildi', yeniHareket.id);
    return yeniHareket;
  },

  /**
   * Borç tahsilatı yapıldığında çağrılacak fonksiyon
   */
  borcTahsilatiYap: (tahsilatData) => {
    console.log('💰 SYNC: Borç tahsilatı yapıldı', tahsilatData);
    
    const kasaHareketleri = syncService.oku(KASA_HAREKETLERI_KEY, []);
    
    const yeniHareket = {
      id: `borc_tahsil_${Date.now().toString()}`,
      tip: 'TAHSILAT',
      altTip: tahsilatData.odemeTipi,
      tutar: tahsilatData.tutar,
      aciklama: tahsilatData.aciklama || `Borç tahsilatı - ${tahsilatData.musteriAdi}`,
      borcId: tahsilatData.borcId,
      musteriAdi: tahsilatData.musteriAdi,
      odemeTarihi: tahsilatData.odemeTarihi || new Date().toISOString(),
      tarih: new Date().toISOString(),
      kasaGirisi: true, // Borç tahsilatı kasaya girer
      sonradanTahsilat: true, // Borçtan sonra yapılan tahsilat
      createdAt: new Date().toISOString(),
      userId: JSON.parse(localStorage.getItem("mc_user"))?.id || "unknown"
    };
    
    kasaHareketleri.push(yeniHareket);
    syncService.yaz(KASA_HAREKETLERI_KEY, kasaHareketleri);
    
    // Event yayınla
    syncService.emitEvent(SYNC_EVENTS.ODEME_ALINDI, yeniHareket);
    syncService.emitEvent(SYNC_EVENTS.KASA_HAREKETI_EKLENDI, yeniHareket);
    syncService.emitEvent(SYNC_EVENTS.BORC_TAHSILATI_YAPILDI, yeniHareket);
    
    console.log('✅ SYNC: Borç tahsilatı kaydedildi', yeniHareket.id);
    return yeniHareket;
  },

  /**
   * Gün başı kasa girişi (Admin)
   */
  gunBasiKasaGir: (tutar, tarih = null) => {
    console.log('💰 SYNC: Gün başı kasa giriliyor', { tutar, tarih });
    
    const gunBasiKayitlari = syncService.oku(GUN_BASI_KASA_KEY, []);
    const kullanici = JSON.parse(localStorage.getItem("mc_user"));
    
    const kayitTarih = tarih || new Date().toISOString().split('T')[0];
    
    // Aynı tarihte kayıt var mı kontrol et
    const tarihKaydi = gunBasiKayitlari.find(k => k.tarih === kayitTarih);
    if (tarihKaydi) {
      console.warn('⚠️ SYNC: Bu tarihte zaten gün başı kasa kaydı var');
      return null;
    }
    
    const kayit = {
      id: `gunbasi_${Date.now().toString()}`,
      tarih: kayitTarih,
      tutar: tutar,
      tip: 'GUN_BASI',
      createdAt: new Date().toISOString(),
      userId: kullanici?.id || "unknown",
      userName: kullanici?.name || "Bilinmeyen"
    };
    
    gunBasiKayitlari.push(kayit);
    syncService.yaz(GUN_BASI_KASA_KEY, gunBasiKayitlari);
    
    // Kasa hareketi olarak da kaydet
    const kasaHareketleri = syncService.oku(KASA_HAREKETLERI_KEY, []);
    kasaHareketleri.push({
      id: `hareket_gunbasi_${Date.now().toString()}`,
      tip: 'GUN_BASI',
      tutar: tutar,
      aciklama: `Gün başı kasa - ${kayitTarih}`,
      tarih: kayitTarih + "T09:00:00", // Sabah 09:00
      createdAt: new Date().toISOString(),
      userId: kullanici?.id || "unknown"
    });
    syncService.yaz(KASA_HAREKETLERI_KEY, kasaHareketleri);
    
    // Event yayınla
    syncService.emitEvent(SYNC_EVENTS.GUN_BASI_KASA_GIRILDI, kayit);
    syncService.emitEvent(SYNC_EVENTS.KASA_HAREKETI_EKLENDI, kayit);
    
    console.log('✅ SYNC: Gün başı kasa kaydedildi', kayit.id);
    return kayit;
  },

  /**
   * Gün sonu kasa girişi (Admin)
   */
  gunSonuKasaGir: (tutar, tarih = null) => {
    console.log('💰 SYNC: Gün sonu kasa giriliyor', { tutar, tarih });
    
    const gunSonuKayitlari = syncService.oku(GUN_SONU_KASA_KEY, []);
    const kullanici = JSON.parse(localStorage.getItem("mc_user"));
    
    const kayitTarih = tarih || new Date().toISOString().split('T')[0];
    
    // Aynı tarihte kayıt var mı kontrol et
    const tarihKaydi = gunSonuKayitlari.find(k => k.tarih === kayitTarih);
    if (tarihKaydi) {
      console.warn('⚠️ SYNC: Bu tarihte zaten gün sonu kasa kaydı var');
      return null;
    }
    
    const kayit = {
      id: `gunsonu_${Date.now().toString()}`,
      tarih: kayitTarih,
      tutar: tutar,
      tip: 'GUN_SONU',
      createdAt: new Date().toISOString(),
      userId: kullanici?.id || "unknown",
      userName: kullanici?.name || "Bilinmeyen"
    };
    
    gunSonuKayitlari.push(kayit);
    syncService.yaz(GUN_SONU_KASA_KEY, gunSonuKayitlari);
    
    // Kasa hareketi olarak da kaydet
    const kasaHareketleri = syncService.oku(KASA_HAREKETLERI_KEY, []);
    kasaHareketleri.push({
      id: `hareket_gunsonu_${Date.now().toString()}`,
      tip: 'GUN_SONU',
      tutar: tutar,
      aciklama: `Gün sonu kasa - ${kayitTarih}`,
      tarih: kayitTarih + "T23:00:00", // Akşam 23:00
      createdAt: new Date().toISOString(),
      userId: kullanici?.id || "unknown"
    });
    syncService.yaz(KASA_HAREKETLERI_KEY, kasaHareketleri);
    
    // Event yayınla
    syncService.emitEvent(SYNC_EVENTS.GUN_SONU_KASA_GIRILDI, kayit);
    syncService.emitEvent(SYNC_EVENTS.KASA_HAREKETI_EKLENDI, kayit);
    
    console.log('✅ SYNC: Gün sonu kasa kaydedildi', kayit.id);
    return kayit;
  },

  // --------------------------------------------------
  // DASHBOARD PANEL GÜNCELLEME FONKSİYONU
  // --------------------------------------------------
  dashboardGuncelle: () => {
    console.log('📊 SYNC: Dashboard verileri güncelleniyor...');
    
    try {
      // Tüm dashboard verilerini hesapla
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Adisyonları oku
      const adisyonlar = syncService.oku(ADİSYON_KEY, []);
      const borclar = syncService.oku(BORC_KEY, []);
      const kasaHareketleri = syncService.oku(KASA_HAREKETLERI_KEY, []);
      
      // Bugünkü satışları hesapla
      const todayNormalSales = adisyonlar
        .filter(a => {
          if (!a.acilisZamani) return false;
          const tarih = new Date(a.acilisZamani).toISOString().split('T')[0];
          return tarih === todayStr && a.kapali === true;
        })
        .reduce((sum, a) => sum + (parseFloat(a.toplamTutar || 0) || 0), 0);
      
      const todayDebts = borclar
        .filter(b => {
          if (!b.acilisZamani) return false;
          const tarih = new Date(b.acilisZamani).toISOString().split('T')[0];
          return tarih === todayStr;
        })
        .reduce((sum, b) => sum + (parseFloat(b.tutar || 0) || 0), 0);
      
      // Bugünkü kasa girişlerini hesapla
      const todayKasaGiris = kasaHareketleri
        .filter(h => {
          if (!h.odemeTarihi && !h.tarih) return false;
          const hareketTarih = (h.odemeTarihi || h.tarih).split('T')[0];
          return hareketTarih === todayStr && h.kasaGirisi === true;
        })
        .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0);
      
      // Açık adisyonları hesapla - SADECE ADİSYONU OLAN (TUTARI 0'DAN BÜYÜK) MASALAR
      const acikAdisyonlar = adisyonlar.filter(a => a.kapali === false);
      let todayBilardoSales = 0;
      const openTables = [];
      
      acikAdisyonlar.forEach(ad => {
        const isBilardo = ad.tur === "BİLARDO";
        
        if (isBilardo) {
          // Bilardo satışını hesapla
          const adisyonTarih = new Date(ad.acilisZamani).toISOString().split('T')[0];
          if (adisyonTarih === todayStr) {
            const bilardoUcret = parseFloat(ad.bilardoUcret || 0);
            const ekUrunToplam = parseFloat(ad.ekUrunToplam || 0);
            todayBilardoSales += (isNaN(bilardoUcret) ? 0 : bilardoUcret) + 
                                (isNaN(ekUrunToplam) ? 0 : ekUrunToplam);
          }
          
          // Bilardo açık adisyonu - SADECE TUTARI 0'DAN BÜYÜKSE EKLE
          const bilardoUcret = parseFloat(ad.bilardoUcret || 0);
          const ekUrunToplam = parseFloat(ad.ekUrunToplam || 0);
          const toplamTutar = (isNaN(bilardoUcret) ? 0 : bilardoUcret) + 
                             (isNaN(ekUrunToplam) ? 0 : ekUrunToplam);
          
          if (toplamTutar > 0) {
            openTables.push({
              id: ad.id || `bilardo_${ad.masaNo}`,
              no: ad.masaNo,
              masaNo: `BİLARDO ${ad.masaNo}`,
              toplamTutar: toplamTutar,
              tur: "BİLARDO",
              urunSayisi: ad.ekUrunler?.length || 0,
              adisyonData: ad
            });
          }
        } else {
          // Normal masa açık adisyonu - SADECE TUTARI 0'DAN BÜYÜKSE EKLE
          const masaNo = ad.masaNo || `MASA ${ad.masaNum}`;
          let toplamTutar = 0;
          
          if (ad.kalemler && ad.kalemler.length > 0) {
            toplamTutar = ad.kalemler.reduce((sum, kalem) => {
              const birimFiyat = parseFloat(kalem.birimFiyat || kalem.fiyat || 0);
              const miktar = parseFloat(kalem.miktar || kalem.adet || 1);
              return sum + (birimFiyat * miktar);
            }, 0);
          }
          
          if (ad.toplamTutar && parseFloat(ad.toplamTutar) > 0) {
            toplamTutar = parseFloat(ad.toplamTutar);
          }
          
          // SADECE TUTARI 0'DAN BÜYÜKSE EKLE
          if (toplamTutar > 0) {
            openTables.push({
              id: ad.id || `normal_${ad.masaNo || ad.masaNum}`,
              no: ad.masaNum || ad.masaNo || "1",
              masaNo: masaNo,
              toplamTutar: toplamTutar,
              tur: "NORMAL",
              urunSayisi: ad.kalemler?.length || 0,
              adisyonData: ad
            });
          }
        }
      });
      
      // Kritik stokları hesapla
      const urunler = syncService.oku(URUN_KEY, []);
      const criticalProducts = urunler
        .filter(u => {
          const stockTakip = u.stockTakip === true || u.stockTakip === "true";
          const stock = parseInt(u.stock || 0);
          const critical = parseInt(u.critical || 10);
          return stockTakip && stock <= critical;
        })
        .slice(0, 5);
      
      // Dashboard verilerini oluştur
      const dashboardData = {
        dailySales: {
          total: todayNormalSales + todayDebts + todayBilardoSales,
          normal: todayNormalSales,
          bilardo: todayBilardoSales,
          debt: todayDebts
        },
        dailyKasa: todayKasaGiris,
        criticalProducts: criticalProducts,
        openTables: openTables.sort((a, b) => {
          if (a.tur === "NORMAL" && b.tur === "BİLARDO") return -1;
          if (a.tur === "BİLARDO" && b.tur === "NORMAL") return 1;
          return parseInt(a.no.replace('B', '')) - parseInt(b.no.replace('B', ''));
        })
      };
      
      // EVENT YAYINLA - Dashboard güncellendi
      syncService.emitEvent(SYNC_EVENTS.DASHBOARD_GUNCELLENDİ, {
        dashboardData: dashboardData,
        zaman: new Date().toISOString()
      });
      
      console.log('✅ SYNC: Dashboard verileri güncellendi', dashboardData);
      return dashboardData;
      
    } catch (error) {
      console.error('❌ SYNC: Dashboard güncelleme hatası:', error);
      return null;
    }
  },

  // --------------------------------------------------
  // MASA İŞLEMLERİ
  // --------------------------------------------------
  normalizeMasaNo: (masaNo) => {
    if (masaNo === null || masaNo === undefined) return "1";
    
    if (typeof masaNo === 'string') {
      const cleaned = masaNo.replace(/MASA\s*/i, '').trim();
      const numbers = cleaned.match(/\d+/);
      return numbers ? numbers[0] : "1";
    }
    
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
    
    const toplamTutar = masalar[masaIdx].toplamTutar || "0.00";
    
    masalar[masaIdx] = {
      ...masalar[masaIdx],
      adisyonId: null,
      ayirId: null,
      ayirToplam: null,
      toplamTutar: "0.00",
      acilisZamani: null,
      kapanisZamani: new Date().toISOString(),
      durum: "BOŞ",
      renk: "gri",
      musteriAdi: null,
      kisiSayisi: null,
      guncellemeZamani: new Date().toISOString(),
      sonAdisyonToplam: toplamTutar
    };
    
    syncService.yaz(MASA_KEY, masalar);
    
    // Dashboard'u güncelle
    setTimeout(() => {
      syncService.dashboardGuncelle();
    }, 100);
    
    syncService.emitEvent(SYNC_EVENTS.MASA_TEMİZLENDİ, {
      masaNo: normalizedMasaNo,
      masaNum: normalizedMasaNo,
      toplamTutar: toplamTutar
    });
    
    syncService.emitEvent(SYNC_EVENTS.PANEL_GUNCELLENDİ, {
      masaNo: normalizedMasaNo,
      islem: 'temizleme'
    });
    
    console.log('✅ SYNC: Masa temizlendi - Masa', normalizedMasaNo);
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
    
    // Dashboard'u güncelle
    setTimeout(() => {
      syncService.dashboardGuncelle();
    }, 100);
    
    syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
      masaNo: normalizedMasaNo,
      masaNum: normalizedMasaNo,
      masa: masalar[masaIdx],
      toplamTutar: "0.00"
    });
    
    syncService.emitEvent(SYNC_EVENTS.PANEL_GUNCELLENDİ, {
      masaNo: normalizedMasaNo,
      islem: 'acma'
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
    
    let ayirToplam = null;
    if (splitAdisyonObj && splitAdisyonObj.kalemler) {
      ayirToplam = Number(
        splitAdisyonObj.kalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0)
      ).toFixed(2);
    }
    
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
    
    // Dashboard'u güncelle
    setTimeout(() => {
      syncService.dashboardGuncelle();
    }, 100);
    
    syncService.emitEvent(SYNC_EVENTS.MASA_GUNCELLENDI, {
      masaNo: normalizedMasaNo,
      masaNum: normalizedMasaNo,
      masa: masalar[masaIdx],
      toplamTutar: toplamTutar
    });
    
    syncService.emitEvent(SYNC_EVENTS.PANEL_GUNCELLENDİ, {
      masaNo: normalizedMasaNo,
      toplamTutar: toplamTutar,
      islem: 'guncelleme'
    });
    
    console.log('✅ SYNC: Masa güncellendi - Masa', normalizedMasaNo);
    return true;
  },

  // --------------------------------------------------
  // ADİSYON İŞLEMLERİ (GÜNCELLENDİ - KASA ENTEGRASYONLU)
  // --------------------------------------------------
  guncelAdisyon: (adisyonId, guncelAdisyon) => {
    console.log('📝 SYNC: Adisyon güncelleniyor', adisyonId);
    
    let adisyonlar = syncService.oku(ADİSYON_KEY, []);
    const adisyonIdx = adisyonlar.findIndex(a => a.id === adisyonId);
    
    if (adisyonIdx === -1) {
      console.error('❌ SYNC: Adisyon bulunamadı', adisyonId);
      return false;
    }
    
    const eskiAdisyon = adisyonlar[adisyonIdx];
    const yeniAdisyon = {
      ...adisyonlar[adisyonIdx],
      ...guncelAdisyon,
      guncellemeZamani: new Date().toISOString()
    };
    
    adisyonlar[adisyonIdx] = yeniAdisyon;
    syncService.yaz(ADİSYON_KEY, adisyonlar);
    
    // Dashboard'u güncelle
    setTimeout(() => {
      syncService.dashboardGuncelle();
    }, 100);
    
    // KASA ENTEGRASYONU: Eğer adisyon kapatıldıysa ve ödeme varsa, kasa hareketi oluştur
    if (eskiAdisyon.kapali === false && yeniAdisyon.kapali === true) {
      console.log('💰 SYNC: Adisyon kapatıldı, kasa hareketleri kontrol ediliyor...');
      
      if (yeniAdisyon.odemeler && yeniAdisyon.odemeler.length > 0) {
        yeniAdisyon.odemeler.forEach(odeme => {
          syncService.odemeAlindi({
            adisyonId: adisyonId,
            odemeTipi: odeme.tip,
            tutar: odeme.tutar,
            masaNo: yeniAdisyon.masaNum || yeniAdisyon.masaNo,
            musteriAdi: yeniAdisyon.musteriAdi,
            aciklama: `Adisyon #${adisyonId} kapatıldı - ${odeme.tip}`,
            odemeTarihi: new Date().toISOString()
          });
        });
      }
    }
    
    syncService.emitEvent(SYNC_EVENTS.ADİSYON_GUNCELLENDİ, {
      adisyonId: adisyonId,
      adisyon: yeniAdisyon,
      eskiAdisyon: eskiAdisyon,
      kapandiMi: eskiAdisyon.kapali === false && yeniAdisyon.kapali === true
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
    
    // Dashboard'u güncelle
    setTimeout(() => {
      syncService.dashboardGuncelle();
    }, 100);
    
    syncService.emitEvent(SYNC_EVENTS.ADİSYON_GUNCELLENDİ, {
      adisyonId: yeniAdisyon.id,
      adisyon: yeniAdisyon,
      isNew: true
    });
    
    syncService.emitEvent(SYNC_EVENTS.PANEL_GUNCELLENDİ, {
      masaNo: normalizedMasaNo,
      islem: 'yeni_adisyon'
    });
    
    console.log('✅ SYNC: Yeni adisyon oluşturuldu', yeniAdisyon.id);
    return yeniAdisyon.id;
  },

  kapatAdisyonVeMasayiTemizle: (masaNum, adisyonId, toplamTutar = "0.00", odemeler = []) => {
    console.log('🔴 SYNC: Adisyon kapatılıyor ve masa temizleniyor', { 
      masaNum, 
      adisyonId, 
      toplamTutar,
      odemeSayisi: odemeler.length
    });
    
    let adisyonlar = syncService.oku(ADİSYON_KEY, []);
    const adisyonIdx = adisyonlar.findIndex(a => a.id === adisyonId);
    
    if (adisyonIdx !== -1) {
      adisyonlar[adisyonIdx] = {
        ...adisyonlar[adisyonIdx],
        kapali: true,
        kapanisZamani: new Date().toISOString(),
        odemeler: odemeler,
        durum: "KAPALI",
        toplamTutar: toplamTutar,
        guncellemeZamani: new Date().toISOString()
      };
      syncService.yaz(ADİSYON_KEY, adisyonlar);
      console.log('✅ SYNC: Adisyon kapatıldı', adisyonId);
      
      // KASA HAREKETLERİ: Ödemeleri kaydet
      odemeler.forEach(odeme => {
        syncService.odemeAlindi({
          adisyonId: adisyonId,
          odemeTipi: odeme.tip,
          tutar: odeme.tutar,
          masaNo: masaNum,
          musteriAdi: adisyonlar[adisyonIdx].musteriAdi,
          aciklama: `Adisyon kapatıldı - ${odeme.tip}`,
          odemeTarihi: new Date().toISOString()
        });
      });
    }
    
    const masaSuccess = syncService.masaBosalt(masaNum);
    
    if (masaSuccess) {
      // Dashboard'u güncelle
      setTimeout(() => {
        syncService.dashboardGuncelle();
      }, 100);
      
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
    
    let adisyonlar = syncService.oku(ADİSYON_KEY, []);
    const adisyonIdx = adisyonlar.findIndex(a => a.id === adisyonId);
    
    if (adisyonIdx === -1) {
      console.error('❌ SYNC: Adisyon bulunamadı', adisyonId);
      return false;
    }
    
    const adisyon = adisyonlar[adisyonIdx];
    
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
    
    const mevcutKalemler = [...(adisyon.kalemler || [])];
    
    const mevcutKalemIdx = mevcutKalemler.findIndex(
      k => k.urunId === kalemData.urunId && 
           Number(k.birimFiyat) === Number(kalemData.birimFiyat || 0)
    );
    
    if (mevcutKalemIdx === -1) {
      mevcutKalemler.push(yeniKalem);
    } else {
      const kalem = { ...mevcutKalemler[mevcutKalemIdx] };
      kalem.adet += (kalemData.miktar || 1);
      kalem.toplam = kalem.adet * kalem.birimFiyat;
      mevcutKalemler[mevcutKalemIdx] = kalem;
    }
    
    let toplamTutar = "0.00";
    if (yeniToplam !== null) {
      toplamTutar = Number(yeniToplam).toFixed(2);
    } else {
      toplamTutar = Number(
        mevcutKalemler.reduce((sum, k) => sum + (Number(k.toplam) || 0), 0)
      ).toFixed(2);
    }
    
    adisyonlar[adisyonIdx] = {
      ...adisyon,
      kalemler: mevcutKalemler,
      toplamTutar: toplamTutar,
      guncellemeZamani: new Date().toISOString()
    };
    
    syncService.yaz(ADİSYON_KEY, adisyonlar);
    
    if (adisyon.masaNum || adisyon.masaNo) {
      const masaNum = adisyon.masaNum || syncService.normalizeMasaNo(adisyon.masaNo);
      syncService.guncelMasa(masaNum, adisyonId, null, toplamTutar);
    }
    
    // Dashboard'u güncelle
    setTimeout(() => {
      syncService.dashboardGuncelle();
    }, 100);
    
    syncService.emitEvent(SYNC_EVENTS.KALEM_EKLENDİ, {
      adisyonId: adisyonId,
      kalem: yeniKalem,
      toplamTutar: toplamTutar
    });
    
    syncService.emitEvent(SYNC_EVENTS.FİYAT_GUNCELLENDİ, {
      adisyonId: adisyonId,
      toplamTutar: toplamTutar
    });
    
    syncService.emitEvent(SYNC_EVENTS.PANEL_GUNCELLENDİ, {
      adisyonId: adisyonId,
      toplamTutar: toplamTutar,
      islem: 'kalem_ekleme'
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
      
      const guncellenenMasalar = masalar.map(masa => {
        if (masa.durum === "BOŞ" || !masa.adisyonId) {
          return masa;
        }
        
        const adisyon = adisyonlar.find(a => a.id === masa.adisyonId);
        if (!adisyon) {
          console.warn(`⚠️ SYNC: Adisyon bulunamadı (Masa ${masa.no})`, masa.adisyonId);
          return masa;
        }
        
        const yeniToplam = (adisyon.kalemler || []).reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
        
        let splitToplam = 0;
        if (masa.ayirId) {
          const splitAdisyon = adisyonlar.find(a => a.id === masa.ayirId);
          if (splitAdisyon) {
            splitToplam = (splitAdisyon.kalemler || []).reduce((sum, k) => sum + (Number(k.toplam) || 0), 0);
          }
        }
        
        const toplamTutar = (yeniToplam + splitToplam).toFixed(2);
        
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
      
      const degisiklikVar = JSON.stringify(masalar) !== JSON.stringify(guncellenenMasalar);
      if (degisiklikVar) {
        syncService.yaz(MASA_KEY, guncellenenMasalar);
        console.log('✅ SYNC: Masalar güncellendi');
      }
      
      // Dashboard'u güncelle
      setTimeout(() => {
        syncService.dashboardGuncelle();
      }, 100);
      
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

  // Kasa raporu için yardımcı fonksiyonlar
  kasaHareketleriGetir: (baslangicTarihi, bitisTarihi) => {
    const tumHareketler = syncService.oku(KASA_HAREKETLERI_KEY, []);
    
    return tumHareketler.filter(hareket => {
      const hareketTarihi = (hareket.odemeTarihi || hareket.tarih);
      if (!hareketTarihi) return false;
      
      const tarih = hareketTarihi.split('T')[0];
      return tarih >= baslangicTarihi && tarih <= bitisTarihi;
    });
  },

  gunBasiKayitlariGetir: (tarih = null) => {
    const tumKayitlar = syncService.oku(GUN_BASI_KASA_KEY, []);
    
    if (!tarih) return tumKayitlar;
    
    return tumKayitlar.filter(k => k.tarih === tarih);
  },

  gunSonuKayitlariGetir: (tarih = null) => {
    const tumKayitlar = syncService.oku(GUN_SONU_KASA_KEY, []);
    
    if (!tarih) return tumKayitlar;
    
    return tumKayitlar.filter(k => k.tarih === tarih);
  },

  // --------------------------------------------------
  // BAŞLANGIÇ KONTROLÜ (GÜNCELLENDİ - KASA KEY'LERİ EKLENDİ)
  // --------------------------------------------------
  init: () => {
    console.log('🚀 SYNC: SyncService başlatılıyor...');
    
    // LocalStorage key'lerini kontrol et, yoksa oluştur
    if (!localStorage.getItem(KASA_HAREKETLERI_KEY)) {
      syncService.yaz(KASA_HAREKETLERI_KEY, []);
      console.log('💰 SYNC: Kasa hareketleri key oluşturuldu');
    }
    
    if (!localStorage.getItem(GUN_BASI_KASA_KEY)) {
      syncService.yaz(GUN_BASI_KASA_KEY, []);
      console.log('💰 SYNC: Gün başı kasa key oluşturuldu');
    }
    
    if (!localStorage.getItem(GUN_SONU_KASA_KEY)) {
      syncService.yaz(GUN_SONU_KASA_KEY, []);
      console.log('💰 SYNC: Gün sonu kasa key oluşturuldu');
    }
    
    // Global event listener'ları kur
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('mc_')) {
          console.log('💾 SYNC: Storage değişti:', event.key);
          
          if (event.key === MASA_KEY || event.key === ADİSYON_KEY || 
              event.key === KASA_HAREKETLERI_KEY) {
            setTimeout(() => {
              syncService.senkronizeMasalar();
            }, 300);
          }
        }
      });
      
      Object.values(SYNC_EVENTS).forEach(eventName => {
        window.addEventListener(`sync:${eventName.toLowerCase()}`, (event) => {
          console.log(`🌐 SYNC: Global event alındı: ${eventName}`, event.detail);
        });
      });
    }
    
    console.log('✅ SYNC: SyncService başlatıldı (Kasa entegrasyonu ile)');
    return true;
  }
};

// Otomatik başlat
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncService.init();
    setTimeout(() => {
      syncService.senkronizeMasalar();
      syncService.dashboardGuncelle();
    }, 1000);
  }, 500);
}

export default syncService;