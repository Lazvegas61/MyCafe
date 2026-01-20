// reportCore/computeLiveDay.js
export function computeLiveDay(raw, gun) {
  if (!gun || gun.status !== "OPEN" || !gun.baslangicZamani) {
    return {
      isOpen: false,
      toplamSatis: 0,
      toplamBilardo: 0,
      toplamGider: 0,
      nakit: 0,
      kart: 0,
      hesabaYaz: 0,
      acikAdisyonSayisi: 0,
      acikAdisyonlar: [],
      kritikStoklar: [],
      kasaToplam: 0,
      satisToplam: 0,
      tutarUyumlu: true,
    };
  }

  const start = new Date(gun.baslangicZamani).getTime();
  const now = Date.now();

  const between = (iso) => {
    const t = new Date(iso).getTime();
    return t >= start && t <= now;
  };

  // --- Adisyonlar (NORMAL) ---
  const gunlukAdisyonlar = raw.adisyonlar.filter(
    (a) => a.kapanisZamani && between(a.kapanisZamani)
  );

  const toplamSatis = gunlukAdisyonlar.reduce(
    (sum, a) => sum + Number(a.toplamTutar || 0),
    0
  );

  // --- Bilardo ---
  const gunlukBilardo = raw.bilardoAdisyonlar.filter(
    (a) => a.kapanisZamani && between(a.kapanisZamani)
  );

  const toplamBilardo = gunlukBilardo.reduce(
    (sum, a) => sum + Number(a.toplamTutar || a.bilardoUcreti || 0),
    0
  );

  // --- Giderler ---
  const gunlukGiderler = raw.giderler.filter(
    (g) => g.tarih && between(g.tarih)
  );

  const toplamGider = gunlukGiderler.reduce(
    (sum, g) => sum + Number(g.tutar || 0),
    0
  );

  // --- Kasa Kırılımı ---
  const gunlukKasa = raw.kasaHareketleri.filter(
    (k) => k.zaman && between(k.zaman)
  );

  const nakit = gunlukKasa
    .filter((k) => k.tip === "NAKIT" || k.tip === "CASH")
    .reduce((s, k) => s + Number(k.tutar || 0), 0);

  const kart = gunlukKasa
    .filter((k) => k.tip === "KART" || k.tip === "CARD")
    .reduce((s, k) => s + Number(k.tutar || 0), 0);

  const hesabaYaz = gunlukKasa
    .filter((k) => k.tip === "HESABA_YAZ")
    .reduce((s, k) => s + Number(k.tutar || 0), 0);

  // --- Açık Adisyon Sayısı ---
  const acikAdisyonSayisi = raw.adisyonlar.filter(
    (a) => !a.kapali && a.durum !== "KAPALI"
  ).length;

  // --- Açık Adisyonlar (liste) ---
  const acikAdisyonlar = raw.adisyonlar
    .filter(a => !a.kapali && a.durum !== "KAPALI")
    .map(a => ({
      id: a.id,
      masaNo: a.masaNo || a.masaNum,
      toplam: Number(a.toplamTutar || 0)
    }));

  // --- Kritik Stoklar ---
  const kritikStoklar = raw.urunler
    .filter(u => Number(u.stock || 0) <= Number(u.critical || 0))
    .map(u => ({
      id: u.id,
      ad: u.name,
      stok: u.stock
    }));

  // --- Tutarlılık Kilidi ---
  const kasaToplam = nakit + kart + hesabaYaz;
  const satisToplam = toplamSatis + toplamBilardo;
  const tutarFarki = Math.abs(satisToplam - kasaToplam);
  const tutarUyumlu = tutarFarki < 0.01; // kuruş toleransı

  if (!tutarUyumlu && typeof console !== "undefined") {
    console.warn("[RAPOR KİLİDİ] Satış/Kasa uyumsuzluğu", {
      satisToplam,
      kasaToplam,
      fark: tutarFarki,
    });
  }

  return {
    isOpen: true,
    toplamSatis,
    toplamBilardo,
    toplamGider,
    
    // Kasa kırılımı
    nakit,
    kart,
    hesabaYaz,
    
    // Adım 6
    acikAdisyonSayisi,
    acikAdisyonlar,
    kritikStoklar,
    
    // Kilit durumu
    kasaToplam,
    satisToplam,
    tutarUyumlu,
  };
}