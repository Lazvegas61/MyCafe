/*
  mc_finans_havuzu.js - MERKEZİ FİNANSAL VERİ DEPOSU
  ----------------------------------------------------
  MyCafe sistemindeki TÜM parasal hareketleri localStorage'da toplar.
  Tüm raporlar için TEK DOĞRULUK KAYNAĞI (Single Source of Truth).
  
  KULLANIM:
  localStorage'da "mc_finans_havuzu" key'i altında veri tutar.
  Tüm raporlar bu dosyadaki fonksiyonlarla bu veriyi okur/yazar.
*/

// 🔧 LOCALSTORAGE KEY
const FİNANS_HAVUZU_KEY = "mc_finans_havuzu";

/* ---------------------------------------------------------
   YARDIMCI FONKSİYONLAR
--------------------------------------------------------- */

// 📅 Tarihi YYYY-MM-DD formatına çevir
const tarihiGunIdYap = (tarihString) => {
  if (!tarihString) return null;
  try {
    const tarih = new Date(tarihString);
    if (isNaN(tarih.getTime())) return null;
    
    const yil = tarih.getFullYear();
    const ay = String(tarih.getMonth() + 1).padStart(2, '0');
    const gun = String(tarih.getDate()).padStart(2, '0');
    
    return `${yil}-${ay}-${gun}`;
  } catch {
    return null;
  }
};

// 💳 Ödeme türünü normalize et
const normalizeOdemeTuru = (tip) => {
  if (!tip) return "NAKIT";
  
  const tipUpper = tip.toUpperCase();
  
  const eslestirme = {
    // Nakit
    "NAKIT": "NAKIT",
    "NAKİT": "NAKIT",
    "CASH": "NAKIT",
    
    // Kart
    "KART": "KART",
    "KREDI": "KART",
    "KREDİ": "KART",
    "KREDI_KARTI": "KART",
    "KREDİ_KARTI": "KART",
    "CREDIT": "KART",
    "CREDIT_CARD": "KART",
    "DEBIT": "KART",
    "DEBIT_CARD": "KART",
    
    // Havale
    "HAVALE": "HAVALE",
    "EFT": "HAVALE",
    "TRANSFER": "HAVALE",
    "BANK_TRANSFER": "HAVALE",
    
    // Hesaba Yaz
    "HESABA_YAZ": "HESABA_YAZ",
    "HESABAYAZ": "HESABA_YAZ",
    "BORC": "HESABA_YAZ",
    "BORÇ": "HESABA_YAZ",
    "CARİ": "HESABA_YAZ",
    "CARİ HESAP": "HESABA_YAZ",
    "CREDIT_ACCOUNT": "HESABA_YAZ",
    
    // Bilardo
    "BILARDO": "BILARDO",
    "BİLARDO": "BILARDO",
    "POOL": "BILARDO",
    "BILLIARD": "BILARDO",
  };
  
  return eslestirme[tipUpper] || "NAKIT";
};

/* ---------------------------------------------------------
   TEMEL VERİ İŞLEME FONKSİYONLARI
--------------------------------------------------------- */

/**
 * 🔍 Finans havuzundaki tüm kayıtları getir
 * @returns {Array} Finans kayıtları dizisi
 */
export const getFinansHavuzu = () => {
  try {
    const havuz = localStorage.getItem(FİNANS_HAVUZU_KEY);
    return havuz ? JSON.parse(havuz) : [];
  } catch (error) {
    console.error("❌ Finans havuzu okuma hatası:", error);
    return [];
  }
};

/**
 * 💾 Finans havuzuna yeni kayıt ekle
 * @param {Object} kayit - Eklenecek finans kaydı
 * @returns {Object} Eklenen kayıt
 */
export const finansKaydiEkle = (kayit) => {
  try {
    const havuz = getFinansHavuzu();
    
    // Normalize et
    const normalizasyon = {
      id: kayit.id || `finans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tarih: kayit.tarih || new Date().toISOString(),
      tur: kayit.tur || "GIDER", // GELIR, GIDER, HESABA_YAZ_BORC
      aciklama: kayit.aciklama || "Finans Hareketi",
      tutar: Number(kayit.tutar) || 0,
      odemeTuru: normalizeOdemeTuru(kayit.odemeTuru || kayit.odemeTipi),
      gunId: kayit.gunId || tarihiGunIdYap(kayit.tarih) || tarihiGunIdYap(new Date()),
      kaynak: kayit.kaynak || "MANUEL", // ADISYON, BILARDO, GIDER, TAHSILAT
      referansId: kayit.referansId || kayit.adisyonId || null,
      masaId: kayit.masaId || kayit.masa || null,
      olusturulmaTarihi: new Date().toISOString(),
      normalizeEdildi: true
    };
    
    // Aynı kayıt var mı kontrol et
    const ayniKayitVar = havuz.some(h => 
      h.id === normalizasyon.id || 
      (h.referansId && h.referansId === normalizasyon.referansId && h.tur === normalizasyon.tur)
    );
    
    if (!ayniKayitVar) {
      havuz.push(normalizasyon);
      localStorage.setItem(FİNANS_HAVUZU_KEY, JSON.stringify(havuz));
      console.log("✅ Finans havuzuna kayıt eklendi:", normalizasyon);
      return normalizasyon;
    }
    
    console.log("ℹ️ Aynı kayıt zaten var, eklenmedi");
    return null;
    
  } catch (error) {
    console.error("❌ Finans kaydı ekleme hatası:", error);
    return null;
  }
};

/**
 * 🔄 Finans havuzunu temizle (SADECE GELİŞTİRME!)
 * DİKKAT: Bu fonksiyon tüm finans verilerini siler
 */
export const finansHavuzunuTemizle = () => {
  if (window.confirm("TÜM finans verileri silinecek. Emin misiniz?")) {
    localStorage.removeItem(FİNANS_HAVUZU_KEY);
    console.log("🗑️ Finans havuzu temizlendi");
    return true;
  }
  return false;
};

/* ---------------------------------------------------------
   OTOMATİK VERİ AKTARMA FONKSİYONLARI
--------------------------------------------------------- */

/**
 * 🔄 Tüm kapalı adisyonları finans havuzuna aktar (GÜNCELLENMİŞ)
 * @returns {number} Aktarılan kayıt sayısı
 */
export const tumAdisyonlariFinansHavuzunaAktar = () => {
  try {
    console.log("🔄 Tüm adisyonlar finans havuzuna aktarılıyor...");
    
    // 1. Tüm veri kaynaklarını oku
    const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
    const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    const giderler = JSON.parse(localStorage.getItem("mc_giderler") || "[]");
    
    let eklenenKayitSayisi = 0;
    
    // 2. KAPALI NORMAL ADİSYONLARI AKTAR
    const kapaliNormalAdisyonlar = adisyonlar.filter(a => a.kapali === true);
    console.log(`📋 ${kapaliNormalAdisyonlar.length} kapalı normal adisyon bulundu`);
    
    kapaliNormalAdisyonlar.forEach(adisyon => {
      // GÜNCELLEME: Ödeme türünü farklı kaynaklardan al
      const odemeTuru = normalizeOdemeTuru(
        adisyon.kapatmaOdemeTuru ||
        adisyon.odemeTuru ||
        adisyon.odemeTipi ||
        (adisyon.odemeler && adisyon.odemeler.length > 0 ? 
          adisyon.odemeler[0].odemeTuru : null) ||
        "NAKIT"
      );
      
      const toplamTutar = adisyon.toplamTutar || 
        (adisyon.kalemler ? adisyon.kalemler.reduce((sum, kalem) => 
          sum + (Number(kalem.birimFiyat || 0) * Number(kalem.adet || 1)), 0) : 0);
      
      console.log(`📝 Adisyon ${adisyon.id}: Ödeme Türü = ${odemeTuru}, Tutar = ${toplamTutar}`);
      
      // GELİR kaydı oluştur (HESABA_YAZ hariç)
      if (odemeTuru !== "HESABA_YAZ") {
        finansKaydiEkle({
          id: `gelir_${adisyon.id || adisyon.adisyonNo || Date.now()}`,
          tarih: adisyon.kapanisZamani || adisyon.tarih || new Date().toISOString(),
          tur: "GELIR",
          aciklama: `Adisyon #${adisyon.id || adisyon.adisyonNo} (${adisyon.masaNo || adisyon.masaAdi || 'Masa'})`,
          tutar: toplamTutar,
          odemeTuru: odemeTuru,
          gunId: adisyon.gunId || tarihiGunIdYap(adisyon.kapanisZamani) || tarihiGunIdYap(new Date()),
          kaynak: "ADISYON",
          referansId: adisyon.id || adisyon.adisyonNo,
          masaId: adisyon.masaId || adisyon.masaNum || adisyon.masaNo || adisyon.masa
        });
        eklenenKayitSayisi++;
      }
      
      // HESABA_YAZ için borç kaydı (BU KASAYA GİRMEZ!)
      if (odemeTuru === "HESABA_YAZ") {
        finansKaydiEkle({
          id: `hesaba_yaz_borc_${adisyon.id || Date.now()}`,
          tarih: adisyon.kapanisZamani || new Date().toISOString(),
          tur: "HESABA_YAZ_BORC",
          aciklama: `Hesaba Yaz - ${adisyon.masaNo || adisyon.masaAdi || 'Masa'} #${adisyon.id}`,
          tutar: toplamTutar,
          odemeTuru: "HESABA_YAZ",
          gunId: adisyon.gunId || tarihiGunIdYap(adisyon.kapanisZamani) || tarihiGunIdYap(new Date()),
          kaynak: "ADISYON",
          referansId: adisyon.id || adisyon.adisyonNo,
          masaId: adisyon.masaId || adisyon.masaNum || adisyon.masaNo || adisyon.masa
        });
        eklenenKayitSayisi++;
      }
    });
    
    // 3. KAPALI BİLARDO ADİSYONLARI AKTAR
    const kapaliBilardoAdisyonlar = bilardoAdisyonlar.filter(a => a.kapali === true);
    console.log(`🎱 ${kapaliBilardoAdisyonlar.length} kapalı bilardo adisyon bulundu`);
    
    kapaliBilardoAdisyonlar.forEach(adisyon => {
      const odemeTuru = normalizeOdemeTuru(
        adisyon.kapatmaOdemeTuru ||
        adisyon.odemeTuru ||
        adisyon.odemeTipi ||
        "NAKIT"
      );
      const toplamTutar = adisyon.toplamTutar || adisyon.tutar || 0;
      
      if (odemeTuru !== "HESABA_YAZ") {
        finansKaydiEkle({
          id: `bilardo_gelir_${adisyon.id || Date.now()}`,
          tarih: adisyon.kapanisZamani || adisyon.tarih || new Date().toISOString(),
          tur: "GELIR",
          aciklama: `Bilardo Adisyon #${adisyon.id} (${adisyon.masaNumarasi || 'Bilardo Masa'})`,
          tutar: toplamTutar,
          odemeTuru: odemeTuru,
          gunId: adisyon.gunId || tarihiGunIdYap(adisyon.kapanisZamani) || tarihiGunIdYap(new Date()),
          kaynak: "BİLARDO",
          referansId: adisyon.id,
          masaId: adisyon.masaId || adisyon.masaNumarasi
        });
        eklenenKayitSayisi++;
      }
    });
    
    // 4. GİDERLERİ AKTAR
    giderler.forEach(gider => {
      finansKaydiEkle({
        id: `gider_${gider.id || Date.now()}`,
        tarih: gider.tarih || new Date().toISOString(),
        tur: "GIDER",
        aciklama: gider.aciklama || "Gider",
        tutar: Number(gider.tutar || 0),
        odemeTuru: "NAKIT",
        gunId: gider.gunId || tarihiGunIdYap(gider.tarih) || tarihiGunIdYap(new Date()),
        kaynak: "GIDER",
        referansId: gider.id,
        kategori: gider.kategori || "GENEL"
      });
      eklenenKayitSayisi++;
    });
    
    console.log(`✅ Finans havuzuna ${eklenenKayitSayisi} kayıt aktarıldı.`);
    return eklenenKayitSayisi;
    
  } catch (error) {
    console.error("❌ Adisyon aktarma hatası:", error);
    return 0;
  }
};

/* ---------------------------------------------------------
   FİLTRELEME VE SORGULAMA FONKSİYONLARI
--------------------------------------------------------- */

/**
 * 📅 Tarihe göre filtrele
 * @param {string} baslangicTarihi - Başlangıç tarihi (YYYY-MM-DD)
 * @param {string} bitisTarihi - Bitiş tarihi (YYYY-MM-DD)
 * @returns {Array} Filtrelenmiş kayıtlar
 */
export const tariheGoreFiltrele = (baslangicTarihi, bitisTarihi) => {
  const tumKayitlar = getFinansHavuzu();
  
  if (!baslangicTarihi && !bitisTarihi) {
    return tumKayitlar;
  }
  
  return tumKayitlar.filter(kayit => {
    const kayitTarihi = kayit.gunId || tarihiGunIdYap(kayit.tarih);
    if (!kayitTarihi) return false;
    
    if (baslangicTarihi && kayitTarihi < baslangicTarihi) return false;
    if (bitisTarihi && kayitTarihi > bitisTarihi) return false;
    
    return true;
  });
};

/**
 * 💰 Türüne göre filtrele
 * @param {string} tur - "GELIR", "GIDER", "HESABA_YAZ_BORC"
 * @returns {Array} Filtrelenmiş kayıtlar
 */
export const tureGoreFiltrele = (tur) => {
  const tumKayitlar = getFinansHavuzu();
  
  if (!tur) return tumKayitlar;
  
  return tumKayitlar.filter(kayit => kayit.tur === tur);
};

/**
 * 💳 Ödeme türüne göre filtrele
 * @param {string} odemeTuru - "NAKIT", "KART", "HAVALE", "HESABA_YAZ", "BILARDO"
 * @returns {Array} Filtrelenmiş kayıtlar
 */
export const odemeTuruGoreFiltrele = (odemeTuru) => {
  const tumKayitlar = getFinansHavuzu();
  
  if (!odemeTuru) return tumKayitlar;
  
  return tumKayitlar.filter(kayit => kayit.odemeTuru === odemeTuru);
};

/**
 * 📊 Ödeme türlerine göre toplamları hesapla
 * @param {string} baslangicTarihi - Başlangıç tarihi (opsiyonel)
 * @param {string} bitisTarihi - Bitiş tarihi (opsiyonel)
 * @returns {Object} Ödeme türü bazlı toplamlar
 */
export const odemeTuruBazliToplamlar = (baslangicTarihi, bitisTarihi) => {
  const kayitlar = baslangicTarihi || bitisTarihi 
    ? tariheGoreFiltrele(baslangicTarihi, bitisTarihi)
    : getFinansHavuzu();
  
  const gruplar = {
    NAKIT: { toplam: 0, sayi: 0, hareketler: [] },
    KART: { toplam: 0, sayi: 0, hareketler: [] },
    HAVALE: { toplam: 0, sayi: 0, hareketler: [] },
    HESABA_YAZ: { toplam: 0, sayi: 0, hareketler: [] },
    BILARDO: { toplam: 0, sayi: 0, hareketler: [] }
  };
  
  kayitlar.forEach(kayit => {
    const odemeTuru = kayit.odemeTuru || "NAKIT";
    
    if (gruplar[odemeTuru]) {
      if (kayit.tur === "GELIR") {
        gruplar[odemeTuru].toplam += Number(kayit.tutar || 0);
        gruplar[odemeTuru].sayi += 1;
        gruplar[odemeTuru].hareketler.push(kayit);
      } else if (kayit.tur === "HESABA_YAZ_BORC") {
        gruplar.HESABA_YAZ.toplam += Number(kayit.tutar || 0);
        gruplar.HESABA_YAZ.sayi += 1;
        gruplar.HESABA_YAZ.hareketler.push(kayit);
      }
    }
  });
  
  return gruplar;
};

/**
 * 📈 Toplam geliri hesapla
 * @param {string} baslangicTarihi - Başlangıç tarihi (opsiyonel)
 * @param {string} bitisTarihi - Bitiş tarihi (opsiyonel)
 * @returns {number} Toplam gelir
 */
export const toplamGelirHesapla = (baslangicTarihi, bitisTarihi) => {
  const kayitlar = baslangicTarihi || bitisTarihi 
    ? tariheGoreFiltrele(baslangicTarihi, bitisTarihi)
    : getFinansHavuzu();
  
  return kayitlar
    .filter(kayit => kayit.tur === "GELIR")
    .reduce((toplam, kayit) => toplam + Number(kayit.tutar || 0), 0);
};

/**
 * 📉 Toplam gideri hesapla
 * @param {string} baslangicTarihi - Başlangıç tarihi (opsiyonel)
 * @param {string} bitisTarihi - Bitiş tarihi (opsiyonel)
 * @returns {number} Toplam gider
 */
export const toplamGiderHesapla = (baslangicTarihi, bitisTarihi) => {
  const kayitlar = baslangicTarihi || bitisTarihi 
    ? tariheGoreFiltrele(baslangicTarihi, bitisTarihi)
    : getFinansHavuzu();
  
  return kayitlar
    .filter(kayit => kayit.tur === "GIDER")
    .reduce((toplam, kayit) => toplam + Number(kayit.tutar || 0), 0);
};

/**
 * 🧾 Hesaba yaz toplamını hesapla
 * @param {string} baslangicTarihi - Başlangıç tarihi (opsiyonel)
 * @param {string} bitisTarihi - Bitiş tarihi (opsiyonel)
 * @returns {number} Hesaba yaz toplamı (BU KASAYA GİRMEZ!)
 */
export const toplamHesabaYazHesapla = (baslangicTarihi, bitisTarihi) => {
  const kayitlar = baslangicTarihi || bitisTarihi 
    ? tariheGoreFiltrele(baslangicTarihi, bitisTarihi)
    : getFinansHavuzu();
  
  return kayitlar
    .filter(kayit => kayit.tur === "HESABA_YAZ_BORC")
    .reduce((toplam, kayit) => toplam + Number(kayit.tutar || 0), 0);
};

/**
 * 🏦 Net kasa bakiyesini hesapla
 * @param {string} baslangicTarihi - Başlangıç tarihi (opsiyonel)
 * @param {string} bitisTarihi - Bitiş tarihi (opsiyonel)
 * @returns {number} Net kasa (gelir - gider)
 */
export const netKasaHesapla = (baslangicTarihi, bitisTarihi) => {
  const gelir = toplamGelirHesapla(baslangicTarihi, bitisTarihi);
  const gider = toplamGiderHesapla(baslangicTarihi, bitisTarihi);
  
  return gelir - gider;
};

/* ---------------------------------------------------------
   OTOMATİK KAYIT FONKSİYONLARI (GÜNCELLENMİŞ)
--------------------------------------------------------- */

/**
 * 🪑 Adisyon kapandığında otomatik kaydet (GÜNCELLENMİŞ)
 * @param {Object} adisyon - Kapanan adisyon
 * @returns {Object|null} Eklenen kayıt
 */
export const adisyonKapandigindaKaydet = (adisyon) => {
  if (!adisyon || !adisyon.kapali) return null;
  
  // GÜNCELLEME: Ödeme türünü farklı kaynaklardan al
  const odemeTuru = normalizeOdemeTuru(
    adisyon.kapatmaOdemeTuru ||    // 1. Öncelik: kapatmaOdemeTuru
    adisyon.odemeTuru ||            // 2. odemeTuru
    adisyon.odemeTipi ||            // 3. odemeTipi
    (adisyon.odemeler && adisyon.odemeler.length > 0 ? 
      adisyon.odemeler[0].odemeTuru : null) ||  // 4. odemeler array'inden
    "NAKIT"                         // 5. Fallback
  );
  
  const toplamTutar = adisyon.toplamTutar || 0;
  const isBilardo = adisyon.tip === "BİLARDO";
  
  let kayit;
  
  if (odemeTuru !== "HESABA_YAZ") {
    // NORMAL GELİR KAYDI
    kayit = finansKaydiEkle({
      id: `${isBilardo ? 'bilardo_' : ''}gelir_${adisyon.id}_${Date.now()}`,
      tarih: adisyon.kapanisZamani || new Date().toISOString(),
      tur: "GELIR",
      aciklama: `${isBilardo ? 'Bilardo ' : ''}Adisyon #${adisyon.id} (${adisyon.masaNo || adisyon.masaAdi || adisyon.masaNumarasi || 'Masa'})`,
      tutar: toplamTutar,
      odemeTuru: odemeTuru,
      gunId: adisyon.gunId || tarihiGunIdYap(adisyon.kapanisZamani) || tarihiGunIdYap(new Date()),
      kaynak: isBilardo ? "BİLARDO" : "ADISYON",
      referansId: adisyon.id,
      masaId: adisyon.masaId || adisyon.masaNum || adisyon.masaNo || adisyon.masa || adisyon.masaNumarasi
    });
  } else {
    // HESABA YAZ BORÇ KAYDI (BU KASAYA GİRMEZ!)
    kayit = finansKaydiEkle({
      id: `hesaba_yaz_borc_${adisyon.id}_${Date.now()}`,
      tarih: adisyon.kapanisZamani || new Date().toISOString(),
      tur: "HESABA_YAZ_BORC",
      aciklama: `Hesaba Yaz - ${adisyon.masaNo || adisyon.masaAdi || 'Masa'} #${adisyon.id}`,
      tutar: toplamTutar,
      odemeTuru: "HESABA_YAZ",
      gunId: adisyon.gunId || tarihiGunIdYap(adisyon.kapanisZamani) || tarihiGunIdYap(new Date()),
      kaynak: "ADISYON",
      referansId: adisyon.id,
      masaId: adisyon.masaId || adisyon.masaNum || adisyon.masaNo || adisyon.masa
    });
  }
  
  console.log(`✅ Adisyon kaydedildi: ${adisyon.id}, Ödeme Türü: ${odemeTuru}, Tutar: ${toplamTutar}`);
  return kayit;
};

/**
 * 📝 Gider eklendiğinde otomatik kaydet
 * @param {Object} gider - Eklene gider
 * @returns {Object|null} Eklenen kayıt
 */
export const giderEklendigindeKaydet = (gider) => {
  if (!gider) return null;
  
  return finansKaydiEkle({
    id: `gider_${gider.id}_${Date.now()}`,
    tarih: gider.tarih || new Date().toISOString(),
    tur: "GIDER",
    aciklama: gider.aciklama || "Gider",
    tutar: Number(gider.tutar || 0),
    odemeTuru: "NAKIT",
    gunId: gider.gunId || tarihiGunIdYap(gider.tarih) || tarihiGunIdYap(new Date()),
    kaynak: "GIDER",
    referansId: gider.id,
    kategori: gider.kategori || "GENEL"
  });
};

/**
 * 🎱 Bilardo adisyonu kapandığında otomatik kaydet
 * @param {Object} bilardoAdisyonu - Kapanan bilardo adisyonu
 * @returns {Object|null} Eklenen kayıt
 */
export const bilardoAdisyonuKapandigindaKaydet = (bilardoAdisyonu) => {
  if (!bilardoAdisyonu || !bilardoAdisyonu.kapali) return null;
  
  const odemeTuru = normalizeOdemeTuru(
    bilardoAdisyonu.kapatmaOdemeTuru ||
    bilardoAdisyonu.odemeTuru ||
    bilardoAdisyonu.odemeTipi ||
    "NAKIT"
  );
  const toplamTutar = bilardoAdisyonu.toplamTutar || bilardoAdisyonu.tutar || 0;
  
  if (odemeTuru !== "HESABA_YAZ") {
    return finansKaydiEkle({
      id: `bilardo_gelir_${bilardoAdisyonu.id}_${Date.now()}`,
      tarih: bilardoAdisyonu.kapanisZamani || bilardoAdisyonu.tarih || new Date().toISOString(),
      tur: "GELIR",
      aciklama: `Bilardo Adisyon #${bilardoAdisyonu.id} (${bilardoAdisyonu.masaNumarasi || 'Bilardo Masa'})`,
      tutar: toplamTutar,
      odemeTuru: odemeTuru,
      gunId: bilardoAdisyonu.gunId || tarihiGunIdYap(bilardoAdisyonu.kapanisZamani) || tarihiGunIdYap(new Date()),
      kaynak: "BİLARDO",
      referansId: bilardoAdisyonu.id,
      masaId: bilardoAdisyonu.masaId || bilardoAdisyonu.masaNumarasi
    });
  }
  
  return null;
};

/* ---------------------------------------------------------
   DEBUG VE KONTROL FONKSİYONLARI
--------------------------------------------------------- */

/**
 * 📋 Finans havuzunda veri var mı kontrol et
 */
export const finansHavuzuKontrol = () => {
  const havuz = getFinansHavuzu();
  console.group("🔍 FİNANS HAVUZU KONTROL");
  console.log("Havuzda kayıt sayısı:", havuz.length);
  console.log("Havuz verisi:", havuz);
  console.groupEnd();
  
  return havuz.length > 0;
};

/**
 * 📝 Manuel olarak test kaydı ekle
 */
export const testKaydiEkle = () => {
  const testKayit = {
    tarih: new Date().toISOString(),
    tur: "GELIR",
    aciklama: "TEST - Finans Havuzu Çalışıyor",
    tutar: 100,
    odemeTuru: "NAKIT",
    kaynak: "TEST"
  };
  
  const sonuc = finansKaydiEkle(testKayit);
  console.log("✅ Test kaydı eklendi:", sonuc);
  return sonuc;
};

/**
 * 🔄 Tüm veri kaynaklarını kontrol et
 */
export const veriKaynaklariniKontrol = () => {
  const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
  const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
  const giderler = JSON.parse(localStorage.getItem("mc_giderler") || "[]");
  const musteriTahsilatlari = JSON.parse(localStorage.getItem("mc_musteri_tahsilatlar") || "[]");
  
  console.group("📊 VERİ KAYNAKLARI KONTROL");
  console.log("Normal Adisyonlar:", adisyonlar.length);
  console.log("Bilardo Adisyonlar:", bilardoAdisyonlar.length);
  console.log("Giderler:", giderler.length);
  console.log("Müşteri Tahsilatları:", musteriTahsilatlari.length);
  
  // Detaylı bilgi
  console.log("Normal Adisyonlar (kapalı olanlar):", 
    adisyonlar.filter(a => a.kapali === true).length
  );
  console.log("Bilardo Adisyonlar (kapalı olanlar):", 
    bilardoAdisyonlar.filter(a => a.kapali === true).length
  );
  console.groupEnd();
  
  return { adisyonlar, bilardoAdisyonlar, giderler, musteriTahsilatlari };
};

/**
 * 🔄 Mevcut finans kayıtlarındaki ödeme türlerini düzelt
 */
export const mevcutOdemeTurleriniDuzenle = () => {
  try {
    console.log("🔄 Mevcut finans kayıtlarındaki ödeme türleri düzeltiliyor...");
    
    const havuz = getFinansHavuzu();
    const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
    const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    
    let guncellenenKayitSayisi = 0;
    
    havuz.forEach((kayit, index) => {
      if ((kayit.kaynak === "ADISYON" || kayit.kaynak === "BİLARDO") && kayit.tur === "GELIR") {
        // İlgili adisyonu bul
        let adisyon = null;
        
        if (kayit.kaynak === "ADISYON") {
          adisyon = adisyonlar.find(a => a.id === kayit.referansId);
        } else if (kayit.kaynak === "BİLARDO") {
          adisyon = bilardoAdisyonlar.find(a => a.id === kayit.referansId);
        }
        
        if (adisyon && adisyon.kapali === true) {
          // Ödeme türünü güncelle
          let yeniOdemeTuru = "NAKIT";
          
          if (kayit.kaynak === "ADISYON") {
            yeniOdemeTuru = normalizeOdemeTuru(
              adisyon.kapatmaOdemeTuru ||
              adisyon.odemeTuru ||
              adisyon.odemeTipi ||
              (adisyon.odemeler && adisyon.odemeler.length > 0 ? 
                adisyon.odemeler[0].odemeTuru : null) ||
              "NAKIT"
            );
          } else if (kayit.kaynak === "BİLARDO") {
            yeniOdemeTuru = normalizeOdemeTuru(
              adisyon.kapatmaOdemeTuru ||
              adisyon.odemeTuru ||
              adisyon.odemeTipi ||
              "NAKIT"
            );
          }
          
          if (yeniOdemeTuru !== kayit.odemeTuru) {
            havuz[index].odemeTuru = yeniOdemeTuru;
            console.log(`📝 Kayıt ${kayit.id}: ${kayit.odemeTuru} → ${yeniOdemeTuru}`);
            guncellenenKayitSayisi++;
          }
        }
      }
    });
    
    if (guncellenenKayitSayisi > 0) {
      localStorage.setItem(FİNANS_HAVUZU_KEY, JSON.stringify(havuz));
      console.log(`✅ ${guncellenenKayitSayisi} kayıt güncellendi`);
    } else {
      console.log("ℹ️ Güncellenecek kayıt bulunamadı");
    }
    
    return guncellenenKayitSayisi;
  } catch (error) {
    console.error("❌ Ödeme türü düzenleme hatası:", error);
    return 0;
  }
};

/**
 * 🔍 Adisyon verilerindeki ödeme türlerini kontrol et
 */
export const odemeTuruDebug = () => {
  const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
  const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
  
  console.group("🔍 ÖDEME TÜRÜ DEBUG");
  
  // Normal adisyonlardaki ödeme türleri
  console.log("📋 NORMAL ADİSYON ÖDEME TÜRLERİ:");
  const kapaliNormalAdisyonlar = adisyonlar.filter(a => a.kapali === true);
  kapaliNormalAdisyonlar.forEach((ad, index) => {
    console.log(`Adisyon ${index + 1}:`, {
      id: ad.id,
      kapatmaOdemeTuru: ad.kapatmaOdemeTuru,
      odemeTuru: ad.odemeTuru,
      odemeTipi: ad.odemeTipi,
      odemeler: ad.odemeler,
      toplamTutar: ad.toplamTutar,
      masaNo: ad.masaNo
    });
  });
  
  // Bilardo adisyonlarındaki ödeme türleri
  console.log("🎱 BİLARDO ADİSYON ÖDEME TÜRLERİ:");
  const kapaliBilardoAdisyonlar = bilardoAdisyonlar.filter(a => a.kapali === true);
  kapaliBilardoAdisyonlar.forEach((ad, index) => {
    console.log(`Bilardo Adisyon ${index + 1}:`, {
      id: ad.id,
      kapatmaOdemeTuru: ad.kapatmaOdemeTuru,
      odemeTuru: ad.odemeTuru,
      odemeTipi: ad.odemeTipi,
      toplamTutar: ad.toplamTutar,
      masaNumarasi: ad.masaNumarasi
    });
  });
  
  console.groupEnd();
  
  return {
    normalAdisyonlar: kapaliNormalAdisyonlar,
    bilardoAdisyonlar: kapaliBilardoAdisyonlar
  };
};

/**
 * 📊 Finans havuzu istatistiklerini getir
 * @returns {Object} Havuz istatistikleri
 */
export const getFinansHavuzuIstatistikleri = () => {
  const tumKayitlar = getFinansHavuzu();
  
  return {
    toplamKayit: tumKayitlar.length,
    gelirKayit: tumKayitlar.filter(k => k.tur === "GELIR").length,
    giderKayit: tumKayitlar.filter(k => k.tur === "GIDER").length,
    hesabaYazKayit: tumKayitlar.filter(k => k.tur === "HESABA_YAZ_BORC").length,
    toplamGelir: toplamGelirHesapla(),
    toplamGider: toplamGiderHesapla(),
    toplamHesabaYaz: toplamHesabaYazHesapla(),
    netKasa: netKasaHesapla(),
    kaynaklar: {
      ADISYON: tumKayitlar.filter(k => k.kaynak === "ADISYON").length,
      BİLARDO: tumKayitlar.filter(k => k.kaynak === "BİLARDO").length,
      GİDER: tumKayitlar.filter(k => k.kaynak === "GİDER").length,
      MANUEL: tumKayitlar.filter(k => k.kaynak === "MANUEL").length,
      TAHSILAT: tumKayitlar.filter(k => k.kaynak === "TAHSILAT").length
    }
  };
};

/**
 * 🐛 Finans havuzunu debug et (console'a yazdır)
 */
export const debugFinansHavuzu = () => {
  const istatistikler = getFinansHavuzuIstatistikleri();
  const son5Kayit = getFinansHavuzu().slice(-5);
  
  console.group("🔍 FİNANS HAVUZU DEBUG");
  console.log("📊 İstatistikler:", istatistikler);
  console.log("📝 Son 5 kayıt:", son5Kayit);
  
  // LocalStorage'da mc_finans_havuzu key'i var mı kontrol et
  const havuzData = localStorage.getItem(FİNANS_HAVUZU_KEY);
  console.log("🗝️ LocalStorage Key:", FİNANS_HAVUZU_KEY);
  console.log("💾 Raw LocalStorage Data:", havuzData);
  console.groupEnd();
};

/**
 * 🔍 Finans havuzunu manuel olarak kontrol et (UI için)
 */
export const manuelFinansHavuzuKontrol = () => {
  const havuz = getFinansHavuzu();
  const istatistikler = getFinansHavuzuIstatistikleri();
  
  const mesaj = `
🔍 FİNANS HAVUZU MANUEL KONTROL:

📊 İSTATİSTİKLER:
- Toplam Kayıt: ${istatistikler.toplamKayit}
- Gelir Kayıtları: ${istatistikler.gelirKayit}
- Gider Kayıtları: ${istatistikler.giderKayit}
- Hesaba Yaz Kayıtları: ${istatistikler.hesabaYazKayit}

💰 TOPLAMLAR:
- Toplam Gelir: ${istatistikler.toplamGelir.toLocaleString("tr-TR")} ₺
- Toplam Gider: ${istatistikler.toplamGider.toLocaleString("tr-TR")} ₺
- Toplam Hesaba Yaz: ${istatistikler.toplamHesabaYaz.toLocaleString("tr-TR")} ₺
- Net Kasa: ${istatistikler.netKasa.toLocaleString("tr-TR")} ₺

📁 KAYNAKLAR:
- Adisyon: ${istatistikler.kaynaklar.ADISYON}
- Bilardo: ${istatistikler.kaynaklar.BİLARDO}
- Gider: ${istatistikler.kaynaklar.GİDER}
- Tahsilat: ${istatistikler.kaynaklar.TAHSILAT}
- Manuel: ${istatistikler.kaynaklar.MANUEL}

💾 LOCALSTORAGE DURUMU:
- Key: "${FİNANS_HAVUZU_KEY}"
- Veri Uzunluğu: ${havuz.length}
- Son kayıt: ${havuz.length > 0 ? havuz[havuz.length - 1]?.aciklama || "N/A" : "BOŞ"}
  `;
  
  console.log(mesaj);
  return mesaj;
};

/* ---------------------------------------------------------
   DEFAULT EXPORT
--------------------------------------------------------- */

// Tüm fonksiyonları içeren bir nesne olarak export edelim
const mcFinansHavuzu = {
  // Temel fonksiyonlar
  getFinansHavuzu,
  finansKaydiEkle,
  finansHavuzunuTemizle,
  
  // Otomatik aktarma
  tumAdisyonlariFinansHavuzunaAktar,
  
  // Filtreleme ve sorgulama
  tariheGoreFiltrele,
  tureGoreFiltrele,
  odemeTuruGoreFiltrele,
  odemeTuruBazliToplamlar,
  toplamGelirHesapla,
  toplamGiderHesapla,
  toplamHesabaYazHesapla,
  netKasaHesapla,
  
  // Otomatik kayıt (GÜNCELLENMİŞ)
  adisyonKapandigindaKaydet,
  giderEklendigindeKaydet,
  bilardoAdisyonuKapandigindaKaydet,
  
  // Debug ve kontrol (GÜNCELLENMİŞ)
  getFinansHavuzuIstatistikleri,
  debugFinansHavuzu,
  finansHavuzuKontrol,
  testKaydiEkle,
  veriKaynaklariniKontrol,
  manuelFinansHavuzuKontrol,
  odemeTuruDebug,
  mevcutOdemeTurleriniDuzenle
};

export default mcFinansHavuzu;