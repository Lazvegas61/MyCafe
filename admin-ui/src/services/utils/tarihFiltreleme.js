/* ------------------------------------------------------------
   📅 tarihFiltreleme.js — Tarih İşlemleri ve Filtreleme
   📌 Tarih format dönüşümleri, validasyon, aralık hesaplamaları
------------------------------------------------------------ */

/**
 * Tarihi YYYY-MM-DD formatına çevir
 */
export const formatTarihInput = (tarih) => {
  if (!tarih) return '';
  
  // Eğer Date objesi ise
  if (tarih instanceof Date) {
    return tarih.toISOString().split('T')[0];
  }
  
  // Eğer string ise ve doğru formatta
  if (typeof tarih === 'string') {
    // Zaten YYYY-MM-DD formatında mı?
    if (/^\d{4}-\d{2}-\d{2}$/.test(tarih)) {
      return tarih;
    }
    
    // DD.MM.YYYY formatından dönüştür
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(tarih)) {
      const [gun, ay, yil] = tarih.split('.');
      return `${yil}-${ay.padStart(2, '0')}-${gun.padStart(2, '0')}`;
    }
    
    // ISO string'den dönüştür
    try {
      const date = new Date(tarih);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error('Tarih format hatası:', e);
    }
  }
  
  return '';
};

/**
 * Tarihi görüntüleme formatına çevir (DD.MM.YYYY)
 */
export const formatTarihGosterim = (tarih) => {
  if (!tarih) return '';
  
  const tarihStr = formatTarihInput(tarih);
  if (!tarihStr) return '';
  
  const [yil, ay, gun] = tarihStr.split('-');
  return `${gun}.${ay}.${yil}`;
};

/**
 * Tarihi görüntüleme formatına çevir (DD.MM.YYYY HH:mm)
 */
export const formatTarihSaatGosterim = (tarih) => {
  if (!tarih) return '';
  
  try {
    const date = new Date(tarih);
    if (isNaN(date.getTime())) return '';
    
    const gun = date.getDate().toString().padStart(2, '0');
    const ay = (date.getMonth() + 1).toString().padStart(2, '0');
    const yil = date.getFullYear();
    const saat = date.getHours().toString().padStart(2, '0');
    const dakika = date.getMinutes().toString().padStart(2, '0');
    
    return `${gun}.${ay}.${yil} ${saat}:${dakika}`;
  } catch (e) {
    console.error('Tarih saat format hatası:', e);
    return '';
  }
};

/**
 * Tarih aralığını valide et
 */
export const tarihAraligiValidasyon = (baslangicTarihi, bitisTarihi) => {
  const hatalar = [];
  
  if (!baslangicTarihi) {
    hatalar.push("Başlangıç tarihi gereklidir");
  }
  
  if (!bitisTarihi) {
    hatalar.push("Bitiş tarihi gereklidir");
  }
  
  if (baslangicTarihi && bitisTarihi) {
    const baslangic = new Date(baslangicTarihi);
    const bitis = new Date(bitisTarihi);
    
    if (baslangic > bitis) {
      hatalar.push("Başlangıç tarihi bitiş tarihinden sonra olamaz");
    }
    
    // Gelecek tarih kontrolü
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    
    if (baslangic > bugun) {
      hatalar.push("Başlangıç tarihi gelecekte olamaz");
    }
    
    if (bitis > bugun) {
      hatalar.push("Bitiş tarihi gelecekte olamaz");
    }
    
    // Çok uzun aralık kontrolü (1 yıl)
    const birYilMs = 365 * 24 * 60 * 60 * 1000;
    if ((bitis - baslangic) > birYilMs) {
      hatalar.push("Maksimum 1 yıllık rapor alabilirsiniz");
    }
  }
  
  return {
    gecerli: hatalar.length === 0,
    hatalar
  };
};

/**
 * Bugünün tarihini YYYY-MM-DD formatında getir
 */
export const bugununTarihi = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Dünün tarihini YYYY-MM-DD formatında getir
 */
export const dununTarihi = () => {
  const dun = new Date();
  dun.setDate(dun.getDate() - 1);
  return dun.toISOString().split('T')[0];
};

/**
 * Bu ayın başlangıç ve bitiş tarihlerini getir
 */
export const buAyTarihAraligi = () => {
  const simdi = new Date();
  const yil = simdi.getFullYear();
  const ay = simdi.getMonth();
  
  const baslangic = new Date(yil, ay, 1);
  const bitis = new Date(yil, ay + 1, 0); // Ayın son günü
  
  return {
    baslangic: baslangic.toISOString().split('T')[0],
    bitis: bitis.toISOString().split('T')[0]
  };
};

/**
 * Geçen ayın başlangıç ve bitiş tarihlerini getir
 */
export const gecenAyTarihAraligi = () => {
  const simdi = new Date();
  const yil = simdi.getFullYear();
  const ay = simdi.getMonth();
  
  const baslangic = new Date(yil, ay - 1, 1);
  const bitis = new Date(yil, ay, 0); // Geçen ayın son günü
  
  return {
    baslangic: baslangic.toISOString().split('T')[0],
    bitis: bitis.toISOString().split('T')[0]
  };
};

/**
 * Bu haftanın başlangıç ve bitiş tarihlerini getir (Pazartesi-Pazar)
 */
export const buHaftaTarihAraligi = () => {
  const simdi = new Date();
  const gun = simdi.getDay(); // 0=Pazar, 1=Pazartesi, ...
  
  // Pazartesi'ye göre ayarla (Pazar=0 ise Pazartesi=1)
  const pazartesiFarki = gun === 0 ? -6 : 1 - gun;
  
  const baslangic = new Date(simdi);
  baslangic.setDate(simdi.getDate() + pazartesiFarki);
  
  const bitis = new Date(baslangic);
  bitis.setDate(baslangic.getDate() + 6);
  
  return {
    baslangic: baslangic.toISOString().split('T')[0],
    bitis: bitis.toISOString().split('T')[0]
  };
};

/**
 * İki tarih arasındaki günleri listele
 */
export const tarihAraligindakiGunler = (baslangicTarihi, bitisTarihi) => {
  if (!baslangicTarihi || !bitisTarihi) return [];
  
  const baslangic = new Date(baslangicTarihi);
  const bitis = new Date(bitisTarihi);
  
  if (baslangic > bitis) return [];
  
  const gunler = [];
  const current = new Date(baslangic);
  
  while (current <= bitis) {
    gunler.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return gunler;
};

/**
 * Tarihleri karşılaştır (sıralama için)
 */
export const tarihKarsilastir = (tarihA, tarihB) => {
  if (!tarihA || !tarihB) return 0;
  
  const dateA = new Date(tarihA).getTime();
  const dateB = new Date(tarihB).getTime();
  
  if (isNaN(dateA) || isNaN(dateB)) return 0;
  
  return dateA - dateB;
};

/**
 * Tarihin haftanın gününü getir
 */
export const haftaninGunu = (tarih) => {
  if (!tarih) return '';
  
  try {
    const date = new Date(tarih);
    if (isNaN(date.getTime())) return '';
    
    const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return gunler[date.getDay()];
  } catch (e) {
    console.error('Haftanın günü hesaplama hatası:', e);
    return '';
  }
};

/**
 * Tarih aralığı etiketi oluştur
 */
export const tarihAraligiEtiketi = (baslangicTarihi, bitisTarihi) => {
  if (!baslangicTarihi || !bitisTarihi) return '';
  
  const baslangicStr = formatTarihGosterim(baslangicTarihi);
  const bitisStr = formatTarihGosterim(bitisTarihi);
  
  if (baslangicStr === bitisStr) {
    return baslangicStr;
  }
  
  return `${baslangicStr} - ${bitisStr}`;
};

/**
 * Ödeme tarihi kontrolü (geçmiş tarih olmalı)
 */
export const odemeTarihiKontrol = (tarih) => {
  if (!tarih) return false;
  
  const odemeTarihi = new Date(tarih);
  const simdi = new Date();
  
  // Gelecek tarih olamaz
  if (odemeTarihi > simdi) {
    return false;
  }
  
  // Çok eski tarih olamaz (5 yıldan eski)
  const besYilOnce = new Date();
  besYilOnce.setFullYear(besYilOnce.getFullYear() - 5);
  
  if (odemeTarihi < besYilOnce) {
    return false;
  }
  
  return true;
};

export default {
  formatTarihInput,
  formatTarihGosterim,
  formatTarihSaatGosterim,
  tarihAraligiValidasyon,
  bugununTarihi,
  dununTarihi,
  buAyTarihAraligi,
  gecenAyTarihAraligi,
  buHaftaTarihAraligi,
  tarihAraligindakiGunler,
  tarihKarsilastir,
  haftaninGunu,
  tarihAraligiEtiketi,
  odemeTarihiKontrol
};