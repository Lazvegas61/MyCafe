/**
 * UI tarafı – Müşteri & Borç Import
 * localStorage hedeflidir
 */

import backup from "../src/data/mc_musteri_hesaba_yaz_backup.json";

export function importEskiBorclar() {
  if (!backup?.musteriler || !backup?.borclar) {
    console.error("❌ Yedek dosyası geçersiz");
    return;
  }

  console.log("▶ Eski müşteri & borç importu başlıyor");

  // 🔴 ÜZERİNE YAZAR (ürünlerde yaptığımız gibi)
  localStorage.setItem(
    "mc_musteriler",
    JSON.stringify(backup.musteriler)
  );

  localStorage.setItem(
    "mc_borclar",
    JSON.stringify(backup.borclar)
  );

  console.log("✅ Import tamamlandı");
  console.log("ℹ️ Kasa / finans / gün sonu etkilenmedi");
}
