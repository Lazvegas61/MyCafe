export function getAcikAdisyon() {
  const adisyonlar = JSON.parse(
    localStorage.getItem("adisyonlar") || "[]"
  );

  // açık = kapanış tarihi yok
  return adisyonlar.find(a => !a.kapanisTarihi) || null;
}
