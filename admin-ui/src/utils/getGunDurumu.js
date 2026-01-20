// src/utils/getGunDurumu.js
// =============================================
// FAZ 1 – FINAL
// Gün durumu = bugünün SON marker’ı
// =============================================

const KASA_KEY = "mc_kasa_hareketleri";

function getTodayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalize(dateStr) {
  if (!dateStr) return null;
  return dateStr.split("T")[0];
}

export function getGunDurumu() {
  const today = getTodayLocal();

  const hareketler = JSON.parse(
    localStorage.getItem(KASA_KEY) || "[]"
  );

  // sadece bugünün marker’larını al
  const bugun = hareketler
    .filter(
      h =>
        (h.tip === "GUN_BASI" || h.tip === "GUN_SONU") &&
        normalize(h.tarih) === today
    )
    // zamana göre sırala
    .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

  if (bugun.length === 0) {
    return { durum: "KAPALI" };
  }

  const son = bugun[bugun.length - 1];

  if (son.tip === "GUN_BASI") {
    return { durum: "ACIK" };
  }

  return { durum: "KAPALI" };
}
