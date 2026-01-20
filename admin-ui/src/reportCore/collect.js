// reportCore/collect.js
export function collectRawData() {
  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };

  

  return {
    masalar: read("mc_masalar", []),
    adisyonlar: read("mc_adisyonlar", []),
    bilardoAdisyonlar: read("bilardo_adisyonlar", []),
    kasaHareketleri: read("mc_kasa_hareketleri", []),
    giderler: read("mc_giderler", []),
    musteriler: read("mc_musteriler", []),
    urunler: read("mc_urunler", []),

  };
}
export function isGunKapaliToday() {
  const data = JSON.parse(
    localStorage.getItem("mc_kasa_hareketleri") || "[]"
  );

  const today = new Date().toISOString().split("T")[0];

  const markers = data
    .filter(
      h =>
        (h.tip === "GUN_BASI" || h.tip === "GUN_SONU") &&
        h.tarih?.startsWith(today)
    )
    .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

  if (markers.length === 0) return false;

  return markers[markers.length - 1].tip === "GUN_SONU";
}

