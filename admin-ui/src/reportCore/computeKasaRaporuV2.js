// FAZ 2 – RAPOR MOTORU (V1)
// Marker bazlı – sözleşmeye %100 uyumlu

const KASA_KEY = "mc_kasa_hareketleri";

function normalize(dateStr) {
  if (!dateStr) return null;
  return dateStr.split("T")[0];
}

function isBetween(date, start, end) {
  const t = new Date(date).getTime();
  const s = new Date(start).getTime();
  if (!end) return t >= s;
  const e = new Date(end).getTime();
  return t >= s && t <= e;
}

export function computeKasaRaporuV2({ gun }) {
  const hareketlerAll = JSON.parse(
    localStorage.getItem(KASA_KEY) || "[]"
  );

  const markers = hareketlerAll
    .filter(
      h =>
        (h.tip === "GUN_BASI" || h.tip === "GUN_SONU") &&
        normalize(h.tarih) === gun
    )
    .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

  if (markers.length === 0) {
    return {
      gun,
      baslangic: null,
      bitis: null,
      hareketler: [],
      ozet: { toplamTahsilat: 0, toplamGider: 0, net: 0 },
      hata: "Bu gün başlatılmamış",
    };
  }

  const baslangic = markers.find(m => m.tip === "GUN_BASI")?.tarih;
  const bitis = markers.find(m => m.tip === "GUN_SONU")?.tarih || null;

  const gunIciHareketler = hareketlerAll
    .filter(h => {
      if (h.tip === "GUN_BASI" || h.tip === "GUN_SONU") return false;
      if (!h.tarih) return false;
      return isBetween(h.tarih, baslangic, bitis);
    })
    .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

  let toplamTahsilat = 0;
  let toplamGider = 0;

  gunIciHareketler.forEach(h => {
    const tutar = Number(h.tutar || 0);
    if (["TAHSILAT", "BILARDO"].includes(h.tip)) {
      toplamTahsilat += tutar;
    }
    if (h.tip === "GIDER") {
      toplamGider += tutar;
    }
  });

  return {
    gun,
    baslangic,
    bitis,
    hareketler: gunIciHareketler,
    ozet: {
      toplamTahsilat,
      toplamGider,
      net: toplamTahsilat - toplamGider,
    },
  };
}
