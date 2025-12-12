// ===============================
// MyCafe LOCALSTORAGE STORE v1
// ===============================

// ---- KEY'LER ----
export const KEY_MASALAR = "mc_masalar";
export const KEY_ADISYONLAR = "mc_adisyonlar";
export const KEY_KATEGORILER = "mc_kategoriler";
export const KEY_URUNLER = "mc_urunler";
export const KEY_PERSONELLER = "mc_personeller";
export const KEY_MUSTERI = "mc_musteriler";
export const KEY_STOK = "mc_stok";

// ---- YARDIMCI FONKSIYONLAR ----
export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// -------------------------
// MASALAR
// -------------------------
export function defaultMasalar() {
  return Array.from({ length: 12 }, (_, i) => ({
    no: (i + 1).toString(),
    adisyonId: null
  }));
}

export function getMasalar() {
  let m = readJSON(KEY_MASALAR, null);
  if (!m) {
    m = defaultMasalar();
    saveJSON(KEY_MASALAR, m);
  }
  return m;
}

export function saveMasalar(list) {
  saveJSON(KEY_MASALAR, list);
}

// -------------------------
// KATEGORİLER
// -------------------------
export function getKategoriler() {
  return readJSON(KEY_KATEGORILER, []);
}

export function saveKategoriler(list) {
  saveJSON(KEY_KATEGORILER, list);
}

// -------------------------
// ÜRÜNLER
// -------------------------
export function getUrunler() {
  return readJSON(KEY_URUNLER, []);
}

export function saveUrunler(list) {
  saveJSON(KEY_URUNLER, list);
}

// -------------------------
// PERSONELLER
// -------------------------
export function getPersoneller() {
  return readJSON(KEY_PERSONELLER, []);
}

export function savePersoneller(list) {
  saveJSON(KEY_PERSONELLER, list);
}

// -------------------------
// MÜŞTERİLER
// -------------------------
export function getMusteriler() {
  return readJSON(KEY_MUSTERI, []);
}

export function saveMusteriler(list) {
  saveJSON(KEY_MUSTERI, list);
}

// -------------------------
// ADİSYONLAR
// -------------------------
export function getAdisyonlar() {
  return readJSON(KEY_ADISYONLAR, []);
}

export function saveAdisyonlar(list) {
  saveJSON(KEY_ADISYONLAR, list);
}

export function createAdisyon(masaNo) {
  const all = getAdisyonlar();
  const yeni = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    masaNo,
    openedAt: new Date().toISOString(),
    closedAt: null,
    status: "OPEN",
    items: [],
    discount: 0,
    payments: [],
    total: 0,
  };
  all.push(yeni);
  saveAdisyonlar(all);
  return yeni;
}

export function getOpenAdisyonByMasa(masaNo) {
  const list = getAdisyonlar();
  return list.find((a) => a.masaNo === masaNo && a.status === "OPEN") || null;
}

export function openOrCreateAdisyon(masaNo) {
  return getOpenAdisyonByMasa(masaNo) || createAdisyon(masaNo);
}

// -------------------------
// STOK
// -------------------------
export function getStok() {
  return readJSON(KEY_STOK, []);
}

export function saveStok(list) {
  saveJSON(KEY_STOK, list);
}
