/* ------------------------------------------------------------
   💰 kasaService.js — MyCafe Kasa Raporu Servisi
   📌 SADECE KASA HAREKETLERİ ve ÖDEME TAKİBİ
   📌 SyncService event'lerini dinler, kasa verilerini yönetir
------------------------------------------------------------ */

import syncService from './syncService';

// LocalStorage Key'leri
const KASA_HAREKETLERI_KEY = "mc_kasa_hareketleri";
const GUN_BASI_KASA_KEY = "mc_gun_basi_kasa";
const GUN_SONU_KASA_KEY = "mc_gun_sonu_kasa";

// Kasa Hareket Tipleri
const KASA_TIPLERI = {
  GUN_BASI: "GUN_BASI",
  GUN_SONU: "GUN_SONU",
  TAHISILAT: "TAHSILAT",
  MANUEL_GIRIS: "MANUEL_GIRIS",
  MANUEL_CIKIS: "MANUEL_CIKIS"
};

// Ödeme Tipleri
const ODEME_TIPLERI = {
  NAKIT: "NAKIT",
  KART: "KART",
  HAVALE: "HAVALE",
  HESABA_YAZ: "HESABA_YAZ"
};

const kasaService = {
  // --------------------------------------------------
  // TEMEL LOCALSTORAGE FONKSİYONLARI
  // --------------------------------------------------
  oku: (key, defaultValue = []) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    } catch (error) {
      console.error(`❌ KASA: JSON parse hatası (${key}):`, error);
      return defaultValue;
    }
  },

  yaz: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`❌ KASA: LocalStorage yazma hatası (${key}):`, error);
      return false;
    }
  },

  // --------------------------------------------------
  // KASA HAREKETİ KAYIT FONKSİYONLARI
  // --------------------------------------------------
  
  /**
   * Yeni kasa hareketi ekle
   */
  hareketEkle: (hareketData) => {
    console.log('💰 KASA: Yeni hareket ekleniyor', hareketData);
    
    const hareketler = kasaService.oku(KASA_HAREKETLERI_KEY, []);
    
    const yeniHareket = {
      id: `kasa_${Date.now().toString()}`,
      tarih: new Date().toISOString(),
      ...hareketData,
      createdAt: new Date().toISOString(),
      userId: JSON.parse(localStorage.getItem("mc_user"))?.id || "unknown"
    };
    
    hareketler.push(yeniHareket);
    kasaService.yaz(KASA_HAREKETLERI_KEY, hareketler);
    
    // Event yayınla
    syncService.emitEvent('KASA_HAREKETI_EKLENDI', yeniHareket);
    
    console.log('✅ KASA: Hareket eklendi', yeniHareket.id);
    return yeniHareket;
  },

  /**
   * Ödeme kaydı oluştur (Adisyon kapatıldığında)
   */
  odemeKaydet: (odemeData) => {
    console.log('💰 KASA: Ödeme kaydediliyor', odemeData);
    
    const hareket = {
      tip: KASA_TIPLERI.TAHISILAT,
      altTip: odemeData.odemeTipi,
      tutar: odemeData.tutar,
      aciklama: `Adisyon #${odemeData.adisyonId} ödemesi`,
      adisyonId: odemeData.adisyonId,
      masaNo: odemeData.masaNo,
      musteriAdi: odemeData.musteriAdi,
      // KRİTİK: Ödeme tarihini kullan
      odemeTarihi: odemeData.odemeTarihi || new Date().toISOString()
    };
    
    // Hesaba yaz ise farklı kaydet
    if (odemeData.odemeTipi === ODEME_TIPLERI.HESABA_YAZ) {
      hareket.aciklama = `Hesaba yaz - Adisyon #${odemeData.adisyonId}`;
      hareket.kasaGirisi = false; // Kasaya giriş değil
    } else {
      hareket.kasaGirisi = true; // Kasaya giriş var
    }
    
    return kasaService.hareketEkle(hareket);
  },

  /**
   * Gün başı kasa girişi (Admin tarafından)
   */
  gunBasiKasaEkle: (tutar, tarih = new Date().toISOString().split('T')[0]) => {
    console.log('💰 KASA: Gün başı kasa ekleniyor', { tutar, tarih });
    
    const gunBasiKayitlari = kasaService.oku(GUN_BASI_KASA_KEY, []);
    
    // Aynı tarihte kayıt var mı kontrol et
    const tarihKaydi = gunBasiKayitlari.find(k => k.tarih === tarih);
    if (tarihKaydi) {
      console.warn('⚠️ KASA: Bu tarihte zaten gün başı kasa kaydı var');
      return null;
    }
    
    const kayit = {
      id: `gunbasi_${Date.now().toString()}`,
      tarih: tarih,
      tutar: tutar,
      tip: KASA_TIPLERI.GUN_BASI,
      createdAt: new Date().toISOString(),
      userId: JSON.parse(localStorage.getItem("mc_user"))?.id || "unknown"
    };
    
    gunBasiKayitlari.push(kayit);
    kasaService.yaz(GUN_BASI_KASA_KEY, gunBasiKayitlari);
    
    // Kasa hareketi olarak da kaydet
    kasaService.hareketEkle({
      tip: KASA_TIPLERI.GUN_BASI,
      tutar: tutar,
      aciklama: `Gün başı kasa - ${tarih}`,
      tarih: tarih + "T09:00:00" // Sabah 09:00
    });
    
    syncService.emitEvent('GUN_BASI_KASA_GIRILDI', kayit);
    
    console.log('✅ KASA: Gün başı kasa eklendi', kayit.id);
    return kayit;
  },

  /**
   * Gün sonu kasa girişi (Admin tarafından)
   */
  gunSonuKasaEkle: (tutar, tarih = new Date().toISOString().split('T')[0]) => {
    console.log('💰 KASA: Gün sonu kasa ekleniyor', { tutar, tarih });
    
    const gunSonuKayitlari = kasaService.oku(GUN_SONU_KASA_KEY, []);
    
    // Aynı tarihte kayıt var mı kontrol et
    const tarihKaydi = gunSonuKayitlari.find(k => k.tarih === tarih);
    if (tarihKaydi) {
      console.warn('⚠️ KASA: Bu tarihte zaten gün sonu kasa kaydı var');
      return null;
    }
    
    const kayit = {
      id: `gunsonu_${Date.now().toString()}`,
      tarih: tarih,
      tutar: tutar,
      tip: KASA_TIPLERI.GUN_SONU,
      createdAt: new Date().toISOString(),
      userId: JSON.parse(localStorage.getItem("mc_user"))?.id || "unknown"
    };
    
    gunSonuKayitlari.push(kayit);
    kasaService.yaz(GUN_SONU_KASA_KEY, gunSonuKayitlari);
    
    // Kasa hareketi olarak da kaydet
    kasaService.hareketEkle({
      tip: KASA_TIPLERI.GUN_SONU,
      tutar: tutar,
      aciklama: `Gün sonu kasa - ${tarih}`,
      tarih: tarih + "T23:00:00" // Akşam 23:00
    });
    
    syncService.emitEvent('GUN_SONU_KASA_GIRILDI', kayit);
    
    console.log('✅ KASA: Gün sonu kasa eklendi', kayit.id);
    return kayit;
  },

  // --------------------------------------------------
  // RAPOR ALMA FONKSİYONLARI
  // --------------------------------------------------
  
  /**
   * Tarih aralığına göre kasa raporu getir
   * KRİTİK: ÖDEME TARİHİNE göre filtreler
   */
  kasaRaporuGetir: (baslangicTarihi, bitisTarihi) => {
    console.log('💰 KASA: Rapor oluşturuluyor', { baslangicTarihi, bitisTarihi });
    
    if (!baslangicTarihi || !bitisTarihi) {
      console.error('❌ KASA: Tarih aralığı belirtilmeli');
      return null;
    }
    
    // Tüm hareketleri getir
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
      hesabaYaz: 0
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
        }
      });
    
    // Tahsilat türleri
    const tahsilatTurleri = {
      adisyonTahsilat: filtrelenmisHareketler
        .filter(h => h.tip === KASA_TIPLERI.TAHISILAT && h.kasaGirisi === true)
        .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0),
      
      hesabaYazTahsilat: filtrelenmisHareketler
        .filter(h => h.altTip === ODEME_TIPLERI.HESABA_YAZ)
        .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0),
      
      sonradanTahsilat: 0 // İleride eklenecek
    };
    
    // Kasa özeti
    const gunBasiKasa = filtrelenmisGunBasi.reduce((sum, k) => sum + (parseFloat(k.tutar) || 0), 0);
    const gunSonuKasa = filtrelenmisGunSonu.reduce((sum, k) => sum + (parseFloat(k.tutar) || 0), 0);
    const kasaFarki = (gunBasiKasa + toplamTahsilat) - gunSonuKasa;
    
    const rapor = {
      hareketler: filtrelenmisHareketler,
      kasaOzet: {
        gunBasiKasa,
        gunSonuKasa,
        toplamTahsilat,
        kasaFarki
      },
      odemeDagilimi,
      tahsilatTurleri,
      gunBasiKayitlari: filtrelenmisGunBasi,
      gunSonuKayitlari: filtrelenmisGunSonu,
      sorgu: {
        baslangicTarihi,
        bitisTarihi,
        hareketSayisi: filtrelenmisHareketler.length,
        olusturulmaTarihi: new Date().toISOString()
      }
    };
    
    console.log('✅ KASA: Rapor oluşturuldu', rapor.sorgu);
    return rapor;
  },

  // --------------------------------------------------
  // EVENT DİNLEYİCİ KURULUMU
  // --------------------------------------------------
  
  /**
   * SyncService event'lerini dinlemeye başla
   */
  initEventListeners: () => {
    console.log('💰 KASA: Event listener\'lar kuruluyor...');
    
    // Adisyon kapatıldığında ödemeyi kaydet
    syncService.on('ADİSYON_GUNCELLENDİ', (data) => {
      if (data.adisyon?.kapali === true && data.adisyon?.odemeler?.length > 0) {
        console.log('💰 KASA: Adisyon kapatıldı, ödemeler kaydediliyor', data.adisyonId);
        
        data.adisyon.odemeler.forEach(odeme => {
          kasaService.odemeKaydet({
            adisyonId: data.adisyonId,
            odemeTipi: odeme.tip,
            tutar: odeme.tutar,
            masaNo: data.adisyon?.masaNum || data.adisyon?.masaNo,
            musteriAdi: data.adisyon?.musteriAdi,
            // KRİTİK: Ödeme tarihi olarak şimdiki zamanı kullan
            odemeTarihi: new Date().toISOString()
          });
        });
      }
    });
    
    // Manuel ödeme alındığında (borç tahsilatı)
    syncService.on('ODEME_ALINDI', (data) => {
      console.log('💰 KASA: Manuel ödeme alındı', data);
      
      kasaService.odemeKaydet({
        adisyonId: data.adisyonId || 'manuel',
        odemeTipi: data.odemeTipi,
        tutar: data.tutar,
        masaNo: data.masaNo,
        musteriAdi: data.musteriAdi,
        odemeTarihi: data.odemeTarihi || new Date().toISOString()
      });
    });
    
    console.log('✅ KASA: Event listener\'lar kuruldu');
  },

  // --------------------------------------------------
  // YARDIMCI FONKSİYONLAR
  // --------------------------------------------------
  
  /**
   * Kasa hareketlerini temizle (sadece admin)
   */
  hareketleriTemizle: () => {
    const user = JSON.parse(localStorage.getItem("mc_user"));
    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      console.error('❌ KASA: Yetkisiz işlem');
      return false;
    }
    
    kasaService.yaz(KASA_HAREKETLERI_KEY, []);
    console.log('✅ KASA: Tüm hareketler temizlendi');
    return true;
  },
  
  /**
   * Bugünün kasa durumunu getir
   */
  bugununKasaDurumu: () => {
    const bugun = new Date().toISOString().split('T')[0];
    return kasaService.kasaRaporuGetir(bugun, bugun);
  },

  // --------------------------------------------------
  // SERVİS BAŞLATMA
  // --------------------------------------------------
  init: () => {
    console.log('🚀 KASA: KasaService başlatılıyor...');
    
    // LocalStorage key'lerini kontrol et, yoksa oluştur
    if (!localStorage.getItem(KASA_HAREKETLERI_KEY)) {
      kasaService.yaz(KASA_HAREKETLERI_KEY, []);
    }
    
    if (!localStorage.getItem(GUN_BASI_KASA_KEY)) {
      kasaService.yaz(GUN_BASI_KASA_KEY, []);
    }
    
    if (!localStorage.getItem(GUN_SONU_KASA_KEY)) {
      kasaService.yaz(GUN_SONU_KASA_KEY, []);
    }
    
    // Event listener'ları kur
    kasaService.initEventListeners();
    
    console.log('✅ KASA: KasaService başlatıldı');
    return true;
  }
};

// Otomatik başlat
if (typeof window !== 'undefined') {
  setTimeout(() => {
    kasaService.init();
  }, 1000);
}

export default kasaService;