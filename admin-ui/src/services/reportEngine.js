/* ============================================================
   📄 DOSYA: reportEngine.js
   📌 AMAÇ:
   MODEL C – TEK RAPOR MOTORU
   - Tüm raporlar buradan beslenir
   - Tek veri kaynağı: mc_kasa_hareketleri
   - Başlangıç parası YOK
============================================================ */

const KASA_KEY = "mc_kasa_hareketleri";

/* ------------------------------------------------------------
   Yardımcılar
------------------------------------------------------------ */
const toDay = (iso) => iso.split("T")[0];

const loadHareketler = () =>
  JSON.parse(localStorage.getItem(KASA_KEY) || "[]");

/* ------------------------------------------------------------
   Tarih Filtresi
------------------------------------------------------------ */
export function filterByDate({ from, to }) {
  const hareketler = loadHareketler();

  return hareketler.filter((h) => {
    if (!h.tarih) return false;
    const gun = toDay(h.tarih);
    if (from && gun < from) return false;
    if (to && gun > to) return false;
    return true;
  });
}

/* ------------------------------------------------------------
   Temel Hesaplar (TÜM RAPORLAR BUNU KULLANIR)
------------------------------------------------------------ */
export function computeSummary({ from, to }) {
  const list = filterByDate({ from, to });

  let gelir = 0;
  let gider = 0;
  let adisyonSayisi = 0;

  list.forEach((h) => {
    const t = Number(h.tutar || 0);
    if (t > 0) {
      gelir += t;
      if (h.tip === "ADISYON_KAPANIS") adisyonSayisi++;
    } else if (t < 0) {
      gider += Math.abs(t);
    }
  });

  return {
    gelir,
    gider,
    net: gelir - gider,
    adisyonSayisi,
    islemSayisi: list.length,
  };
}

/* ------------------------------------------------------------
   Gider Raporu (tutar < 0)
------------------------------------------------------------ */
export function computeGiderRaporu({ from, to }) {
  return filterByDate({ from, to })
    .filter((h) => Number(h.tutar) < 0)
    .map((h) => ({
      tarih: h.tarih,
      aciklama: h.aciklama || "",
      tutar: Math.abs(h.tutar),
    }));
}

/* ------------------------------------------------------------
   Masa Bazlı Rapor
------------------------------------------------------------ */
export function computeMasaRaporu({ from, to }) {
  const map = {};

  filterByDate({ from, to }).forEach((h) => {
    if (h.tip !== "ADISYON_KAPANIS") return;
    const masa = h.masaNo || "Bilinmiyor";

    if (!map[masa]) {
      map[masa] = { masa, adisyon: 0, ciro: 0 };
    }

    map[masa].adisyon += 1;
    map[masa].ciro += Number(h.tutar || 0);
  });

  return Object.values(map).map((m) => ({
    ...m,
    ortalama: m.adisyon > 0 ? m.ciro / m.adisyon : 0,
  }));
}

/* ------------------------------------------------------------
   Not:
   Kategori / Ürün / Bilardo raporları
   ancak kasa hareketlerinde ilgili snapshot varsa yapılır.
------------------------------------------------------------ */
