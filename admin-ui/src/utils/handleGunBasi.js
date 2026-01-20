// =============================================
// FAZ 1 – ADIM 2 (FINAL)
// Gün Başı Tetikleyici
// - SADECE YAZAR
// - HİÇBİR KONTROL YAPMAZ
// =============================================

const KASA_KEY = "mc_kasa_hareketleri";

export function handleGunBasi() {
  const hareketler = JSON.parse(
    localStorage.getItem(KASA_KEY) || "[]"
  );

  const now = new Date();

  const kayit = {
    id: `hareket_gunbasi_${Date.now()}`,
    tip: "GUN_BASI",
    tarih: now.toISOString(),
    aciklama: "Gün başlatıldı",
    createdAt: now.toISOString()
  };

  hareketler.push(kayit);

  localStorage.setItem(
    KASA_KEY,
    JSON.stringify(hareketler)
  );

  return true;
}
