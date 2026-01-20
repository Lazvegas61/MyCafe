/* ------------------------------------------------------------
   📦 localStorageService.js — MyCafe LocalStorage Yönetimi
------------------------------------------------------------ */

class LocalStorageService {
  constructor() {
    this.KEY_MAP = {
      masalar: 'mc_masalar',
      adisyonlar: 'mc_adisyonlar',
      acik_adisyonlar: 'mc_acik_adisyonlar',
      kategoriler: 'mc_kategoriler',
      urunler: 'mc_urunler',
      personeller: 'mc_personeller',
      musteriler: 'mc_musteriler',
      giderler: 'mc_giderler',

      kasa_hareketleri: 'mc_kasa_hareketleri',
      gun_basi_kasa: 'mc_gun_basi_kasa',
      gun_sonu_kasa: 'mc_gun_sonu_kasa',
      gun_sonu_listesi: 'mc_gun_sonu_listesi',
      gunsonu_raporlar: 'mc_gunsonu_raporlar',

      bilardo_adisyonlar: 'bilardo_adisyonlar',
      bilardo: 'bilardo',
      bilardo_ucretleri: 'bilardo_ucretleri',

      borclar: 'mc_borclar',
      stok: 'mc_stok',
      kasa: 'mc_kasalar',
      acik_bilardo_adisyonlar: 'acik_bilardo_adisyonlar'
    };
  }

  // === OKUMA ===
  get(key) {
    const storageKey = this.KEY_MAP[key] || key;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.error(`❌ localStorageService.get (${key})`, err);
      return null;
    }
  }

  // === YAZMA ===
  set(key, value) {
    const storageKey = this.KEY_MAP[key] || key;
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`❌ localStorageService.set (${key})`, err);
      return false;
    }
  }

  remove(key) {
    const storageKey = this.KEY_MAP[key] || key;
    localStorage.removeItem(storageKey);
  }

  hasKey(key) {
    const storageKey = this.KEY_MAP[key] || key;
    return localStorage.getItem(storageKey) !== null;
  }

  clearAllMcKeys() {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('mc_') || k.startsWith('bilardo')) {
        localStorage.removeItem(k);
      }
    });
    console.log('🧹 mc_ ve bilardo keyleri temizlendi');
  }
}

// === SINGLETON ===
const localStorageService = new LocalStorageService();

// === GLOBAL REGISTER (SADECE BURASI!) ===
if (typeof window !== 'undefined') {
  window.localStorageService = localStorageService;
  console.log('✅ localStorageService global olarak hazır');
}

export default localStorageService;
