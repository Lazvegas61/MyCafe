export function kasaHareketiEkle(hareket) {
  const KEY = "mc_kasa_hareketleri";

  const liste = JSON.parse(localStorage.getItem(KEY)) || [];

  // ÇİFTE YAZIM KORUMASI (aynı adisyon bir daha yazılamaz)
  if (
    hareket.tip === "ADISYON_KAPANIS" &&
    liste.some(
      h =>
        h.tip === "ADISYON_KAPANIS" &&
        h.adisyonId === hareket.adisyonId
    )
  ) {
    console.warn("Bu adisyon daha önce kasaya yazılmış:", hareket.adisyonId);
    return;
  }

  liste.push(hareket);
  localStorage.setItem(KEY, JSON.stringify(liste));
}
