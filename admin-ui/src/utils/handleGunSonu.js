// =============================================
// FAZ 1 – ADIM 3 (FINAL)
// Gün Sonu Tetikleyici
// - SADECE YAZAR
// - HİÇBİR KONTROL YAPMAZ
// =============================================

const KASA_KEY = "mc_kasa_hareketleri";

export function handleGunSonu() {
  const hareketler = JSON.parse(
    localStorage.getItem(KASA_KEY) || "[]"
  );

  const now = new Date();

  const kayit = {
    id: `hareket_gunsonu_${Date.now()}`,
    tip: "GUN_SONU",
    tarih: now.toISOString(),
    aciklama: "Gün kapatıldı",
    createdAt: now.toISOString()
  };

  hareketler.push(kayit);

  localStorage.setItem(
    KASA_KEY,
    JSON.stringify(hareketler)
  );

  return true;
}
