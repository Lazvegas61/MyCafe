/* ------------------------------------------------------------
   🧮 kasaHesaplamalar.js — Kasa Matematik İşlemleri
   📌 Saf fonksiyonlar, hesaplamalar, filtrelemeler
------------------------------------------------------------ */

import { 
  KASA_TIPLERI, 
  ODEME_TIPLERI,
  KASA_FARK_ESIKLERI,
  KASA_FARK_DURUMLARI 
} from '../constants/kasaTipleri';

/**
 * Tarihe göre hareketleri filtrele
 * KRITIK: Ödeme tarihine göre filtreler
 */
export const tariheGoreFiltrele = (hareketler, baslangicTarihi, bitisTarihi) => {
  if (!baslangicTarihi || !bitisTarihi) return [];
  
  return hareketler.filter(hareket => {
    // Ödeme tarihi varsa onu kullan, yoksa normal tarihi
    const hareketTarihi = hareket.odemeTarihi || hareket.tarih;
    if (!hareketTarihi) return false;
    
    // Sadece tarih kısmını al (YYYY-MM-DD)
    const tarih = hareketTarihi.split('T')[0];
    return tarih >= baslangicTarihi && tarih <= bitisTarihi;
  });
};

/**
 * Kasa özetini hesapla
 */
export const kasaOzetiHesapla = (hareketler, gunBasiKayitlari, gunSonuKayitlari) => {
  // Tahsilatları hesapla (kasaya giren para)
  const toplamTahsilat = hareketler
    .filter(h => h.tip === KASA_TIPLERI.TAHISILAT && h.kasaGirisi === true)
    .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0);
  
  // Gün başı kasa toplamı
  const gunBasiKasa = gunBasiKayitlari
    .reduce((sum, k) => sum + (parseFloat(k.tutar) || 0), 0);
  
  // Gün sonu kasa toplamı
  const gunSonuKasa = gunSonuKayitlari
    .reduce((sum, k) => sum + (parseFloat(k.tutar) || 0), 0);
  
  // Kasa farkı = (Gün Başı + Tahsilatlar) - Gün Sonu
  const kasaFarki = (gunBasiKasa + toplamTahsilat) - gunSonuKasa;
  
  return {
    gunBasiKasa,
    gunSonuKasa,
    toplamTahsilat,
    kasaFarki
  };
};

/**
 * Ödeme türü dağılımını hesapla
 */
export const odemeDagilimiHesapla = (hareketler) => {
  const dagilim = {
    nakit: 0,
    kart: 0,
    havale: 0,
    hesabaYaz: 0
  };
  
  hareketler
    .filter(h => h.tip === KASA_TIPLERI.TAHISILAT)
    .forEach(h => {
      const tutar = parseFloat(h.tutar) || 0;
      
      switch (h.altTip) {
        case ODEME_TIPLERI.NAKIT:
          dagilim.nakit += tutar;
          break;
        case ODEME_TIPLERI.KART:
          dagilim.kart += tutar;
          break;
        case ODEME_TIPLERI.HAVALE:
          dagilim.havale += tutar;
          break;
        case ODEME_TIPLERI.HESABA_YAZ:
          dagilim.hesabaYaz += tutar;
          break;
      }
    });
  
  return dagilim;
};

/**
 * Tahsilat türlerini hesapla
 */
export const tahsilatTurleriHesapla = (hareketler) => {
  // Adisyon tahsilatı (kasaya giren)
  const adisyonTahsilat = hareketler
    .filter(h => h.tip === KASA_TIPLERI.TAHISILAT && h.kasaGirisi === true)
    .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0);
  
  // Hesaba yaz tahsilatı (kasaya girmeyen)
  const hesabaYazTahsilat = hareketler
    .filter(h => h.altTip === ODEME_TIPLERI.HESABA_YAZ)
    .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0);
  
  // Sonradan tahsilat (borç ödemeleri)
  const sonradanTahsilat = hareketler
    .filter(h => h.aciklama?.includes('borç') || h.aciklama?.includes('tahsilat'))
    .reduce((sum, h) => sum + (parseFloat(h.tutar) || 0), 0);
  
  return {
    adisyonTahsilat,
    hesabaYazTahsilat,
    sonradanTahsilat
  };
};

/**
 * Kasa farkı durumunu belirle
 */
export const kasaFarkiDurumuBelirle = (kasaFarki) => {
  const fark = Math.abs(kasaFarki);
  
  if (fark === 0) {
    return {
      durum: KASA_FARK_DURUMLARI.NORMAL,
      mesaj: "Kasa tamam",
      renk: "#10B981", // Yeşil
      ikon: "✅"
    };
  } else if (fark <= KASA_FARK_ESIKLERI.UYARI) {
    return {
      durum: KASA_FARK_DURUMLARI.UYARI,
      mesaj: `Küçük fark: ${fark.toFixed(2)} TL`,
      renk: "#F59E0B", // Turuncu
      ikon: "⚠️"
    };
  } else {
    return {
      durum: KASA_FARK_DURUMLARI.KRITIK,
      mesaj: `KRITIK: ${fark.toFixed(2)} TL fark`,
      renk: "#EF4444", // Kırmızı
      ikon: "🚨"
    };
  }
};

/**
 * Tarih aralığı için varsayılan tarihleri oluştur
 * @param {number} gunSayisi - Kaç günlük rapor (varsayılan: 7)
 */
export const varsayilanTarihAraligiOlustur = (gunSayisi = 7) => {
  const bitis = new Date();
  const baslangic = new Date();
  baslangic.setDate(bitis.getDate() - gunSayisi + 1);
  
  return {
    baslangic: baslangic.toISOString().split('T')[0], // YYYY-MM-DD
    bitis: bitis.toISOString().split('T')[0]
  };
};

/**
 * Para formatı (TL)
 */
export const paraFormati = (tutar) => {
  if (tutar === null || tutar === undefined) return "₺ 0.00";
  
  const sayi = parseFloat(tutar);
  if (isNaN(sayi)) return "₺ 0.00";
  
  return `₺ ${sayi.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

/**
 * Hareketleri tarihe göre grupla (günlük)
 */
export const hareketleriGunlereGoreGrupla = (hareketler) => {
  const gruplar = {};
  
  hareketler.forEach(hareket => {
    const tarih = (hareket.odemeTarihi || hareket.tarih).split('T')[0];
    
    if (!gruplar[tarih]) {
      gruplar[tarih] = {
        tarih,
        hareketler: [],
        toplamTahsilat: 0,
        toplamCiro: 0
      };
    }
    
    gruplar[tarih].hareketler.push(hareket);
    
    // Kasaya giriş ise tahsilata ekle
    if (hareket.kasaGirisi === true) {
      gruplar[tarih].toplamTahsilat += parseFloat(hareket.tutar) || 0;
    }
    
    // Tüm hareketler ciroya eklenir
    gruplar[tarih].toplamCiro += parseFloat(hareket.tutar) || 0;
  });
  
  // Tarihe göre sırala (yeniden eskiye)
  return Object.values(gruplar).sort((a, b) => b.tarih.localeCompare(a.tarih));
};

/**
 * En çok kullanılan ödeme türünü bul
 */
export const enCokKullanilanOdemeTipi = (odemeDagilimi) => {
  const dagilim = { ...odemeDagilimi };
  delete dagilim.hesabaYaz; // Hesaba yaz hariç
  
  const enYuksek = Object.entries(dagilim).reduce((max, [tip, tutar]) => {
    return tutar > max.tutar ? { tip, tutar } : max;
  }, { tip: 'nakit', tutar: 0 });
  
  return enYuksek.tip;
};

/**
 * Kasa hareketi validasyonu
 */
export const hareketValidasyonu = (hareket) => {
  const hatalar = [];
  
  if (!hareket.tip) hatalar.push("Hareket tipi gereklidir");
  if (!hareket.tutar || parseFloat(hareket.tutar) <= 0) hatalar.push("Geçerli tutar gereklidir");
  if (!hareket.aciklama) hatalar.push("Açıklama gereklidir");
  
  // Ödeme tipi kontrolü
  if (hareket.tip === KASA_TIPLERI.TAHISILAT && !hareket.altTip) {
    hatalar.push("Ödeme tipi gereklidir");
  }
  
  return {
    gecerli: hatalar.length === 0,
    hatalar
  };
};

export default {
  tariheGoreFiltrele,
  kasaOzetiHesapla,
  odemeDagilimiHesapla,
  tahsilatTurleriHesapla,
  kasaFarkiDurumuBelirle,
  varsayilanTarihAraligiOlustur,
  paraFormati,
  hareketleriGunlereGoreGrupla,
  enCokKullanilanOdemeTipi,
  hareketValidasyonu
};