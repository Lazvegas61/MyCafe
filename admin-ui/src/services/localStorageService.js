/**
 * MyCafe LocalStorage Rapor Servisi - GÜNCELLENDİ
 */
class LocalStorageService {
  constructor() {
    this.KEY_MAP = {
      // Temel veriler
      masalar: 'mc_masalar',
      adisyonlar: 'mc_adisyonlar',
      acik_adisyonlar: 'mc_acik_adisyonlar',
      kategoriler: 'mc_kategoriler',
      urunler: 'mc_urunler',
      personeller: 'mc_personeller',
      musteriler: 'mc_musteriler',
      giderler: 'mc_giderler',
      
      // Kasa ve rapor verileri
      kasa_hareketleri: 'mc_kasa_hareketleri',
      kasa_hareketleri_key: 'mc_kasa_hareketleri', // syncService uyumu için
      gun_sonu_listesi: 'mc_gun_sonu_listesi',
      gunsonu_raporlar: 'mc_gunsonu_raporlar',
      bilardo_adisyonlar: 'mc_bilardo_adisyonlar',
      borclar: 'mc_borclar',
      
      // Gün başı/sonu kasaları
      gun_basi_kasa: 'mc_gun_basi_kasa',
      gun_sonu_kasa: 'mc_gun_sonu_kasa'
    };
  }

  // Ham veriyi getir
  get(key) {
    const storageKey = this.KEY_MAP[key] || key;
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`❌ localStorageService.get hatası (${key}):`, error);
      return [];
    }
  }

  // Tüm verileri getir
  getAll() {
    const data = {};
    Object.keys(this.KEY_MAP).forEach(key => {
      data[key] = this.get(key);
    });
    return data;
  }

  // Tarih filtresi - GELİŞTİRİLMİŞ VERSİYON
  filterByDate(data, startDate, endDate) {
    if (!data || !Array.isArray(data)) return [];
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    return data.filter(item => {
      if (!item) return false;
      
      // Farklı tarih alanlarını kontrol et
      let itemDate;
      if (item.odemeTarihi) {
        itemDate = new Date(item.odemeTarihi);
      } else if (item.tarih) {
        itemDate = new Date(item.tarih);
      } else if (item.acilisZamani) {
        itemDate = new Date(item.acilisZamani);
      } else if (item.createdAt) {
        itemDate = new Date(item.createdAt);
      } else if (item.guncellemeZamani) {
        itemDate = new Date(item.guncellemeZamani);
      } else {
        return true; // Tarihi yoksa dahil et
      }
      
      if (isNaN(itemDate.getTime())) return false;
      
      if (start && itemDate < start) return false;
      if (end && itemDate > end) return false;
      
      return true;
    });
  }

  // DEBUG: Tüm localStorage'ı göster
  debugAllStorage() {
    console.group('🔍 localStorage DEBUG');
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`📦 ${key}:`, Array.isArray(data) ? `${data.length} kayıt` : data);
      } catch {
        console.log(`📦 ${key}: (parse edilemedi)`);
      }
    });
    console.groupEnd();
  }
}

export default new LocalStorageService();