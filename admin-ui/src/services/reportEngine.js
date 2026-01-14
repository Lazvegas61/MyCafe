/**
 * reportEngine.js
 * MyCafe Merkezi Raporlama Motoru
 * -------------------------------------------
 * - UI'dan bağımsızdır
 * - localStorage okur
 * - Gün sonu detaylarını TEK formatta üretir
 */

const STORAGE_KEYS = {
  GUN_SONU_PREFIX: "mycafe_gun_sonu_",
  KASA_HAREKETLERI: "mycafe_kasa_hareketleri",
};

// ------------------------------
// Yardımcılar
// ------------------------------
const safeJSON = (value, fallback = []) => {
  try {
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
};

const getAllGunSonuRaporlari = () => {
  return Object.keys(localStorage)
    .filter((k) => k.startsWith(STORAGE_KEYS.GUN_SONU_PREFIX))
    .map((k) => safeJSON(localStorage.getItem(k), null))
    .filter(Boolean);
};

// ------------------------------
// ANA MOTOR
// ------------------------------
const buildReport = (options = {}) => {
  const { tarih = new Date().toISOString().split("T")[0] } = options;

  const gunSonuRaporlari = getAllGunSonuRaporlari().filter(
    (r) => r.tarih === tarih
  );

  const kasaHareketleri = safeJSON(
    localStorage.getItem(STORAGE_KEYS.KASA_HAREKETLERI),
    []
  ).filter((h) => h.tarih?.startsWith(tarih));

  // ------------------------------
  // DETAY SATIRLARI
  // ------------------------------
  const detaySatirlari = [];

  gunSonuRaporlari.forEach((rapor) => {
    (rapor.islemler || []).forEach((islem) => {
      detaySatirlari.push({
        saat: islem.saat || "--:--",
        masa: islem.masa || "-",
        islemTuru: islem.tip === "HESABA_YAZ" ? "Hesaba Yaz" : "Tahsilat",
        odemeTuru: islem.odemeTuru || "-",
        tutar: Number(islem.tutar || 0),
        aciklama:
          islem.tip === "HESABA_YAZ"
            ? `Müşteri: ${islem.musteri || "-"}`
            : "Adisyon Kapatıldı",
      });
    });
  });

  // ------------------------------
  // ÖZET
  // ------------------------------
  const toplamTahsilat = detaySatirlari
    .filter((d) => d.islemTuru === "Tahsilat")
    .reduce((t, i) => t + i.tutar, 0);

  const toplamHesabaYaz = detaySatirlari
    .filter((d) => d.islemTuru === "Hesaba Yaz")
    .reduce((t, i) => t + i.tutar, 0);

  const odemeKirilimi = {};
  detaySatirlari
    .filter((d) => d.islemTuru === "Tahsilat")
    .forEach((d) => {
      odemeKirilimi[d.odemeTuru] =
        (odemeKirilimi[d.odemeTuru] || 0) + d.tutar;
    });

  return {
    meta: {
      tarih,
      olusturmaZamani: new Date().toISOString(),
    },
    ozet: {
      toplamTahsilat,
      toplamHesabaYaz,
      odemeKirilimi,
    },
    detay: {
      satirlar: detaySatirlari,
    },
    kaynaklar: {
      gunSonuRaporSayisi: gunSonuRaporlari.length,
      kasaHareketSayisi: kasaHareketleri.length,
    },
  };
};

export default {
  buildReport,
};
