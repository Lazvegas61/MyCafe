// File: admin-ui/src/services/localStorageService.js
/* ------------------------------------------------------------
   📦 localStorageService.js — MyCafe LocalStorage Yönetimi
   📌 TÜM localStorage key'lerini merkezi yönetir
   📌 STANDART KEY_MAP ile tutarlılık sağlar
------------------------------------------------------------ */

/**
 * MyCafe LocalStorage Rapor Servisi - GUNCELLENDI
 */
class LocalStorageService {
  constructor() {
    // STANDART KEY_MAP - Tüm uygulama burada tanımlı key'leri kullanmalı
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
      
      // Kasa ve rapor verileri - STANDARTLAŞTIRILDI
      kasa_hareketleri: 'mc_kasa_hareketleri',
      gun_basi_kasa: 'mc_gun_basi_kasa',
      gun_sonu_kasa: 'mc_gun_sonu_kasa',
      gun_sonu_listesi: 'mc_gun_sonu_listesi',
      gunsonu_raporlar: 'mc_gunsonu_raporlar',
      
      // Bilardo verileri - STANDARTLAŞTIRILDI
      bilardo_adisyonlar: 'bilardo_adisyonlar',
      bilardo: 'bilardo',
      bilardo_ucretleri: 'bilardo_ucretleri',
      
      // Borçlar
      borclar: 'mc_borclar',
      
      // Stok
      stok: 'mc_stok',
      
      // Diğer
      kasa: 'mc_kasalar',
      acik_bilardo_adisyonlar: 'acik_bilardo_adisyonlar'
    };

    // Global erişim için kendini window'a ekle
    if (typeof window !== 'undefined') {
      window.localStorageService = this;
      console.log('✅ localStorageService global olarak yüklendi');
    }
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

  // Veriyi kaydet
  set(key, value) {
    const storageKey = this.KEY_MAP[key] || key;
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`❌ localStorageService.set hatası (${key}):`, error);
      return false;
    }
  }

  // Key'e göre direkt get (alternatif kullanım)
  getByKey(storageKey) {
    return this.get(storageKey);
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

  // Key kontrolü
  hasKey(key) {
    return localStorage.getItem(key) !== null;
  }

  // Key silme
  remove(key) {
    const storageKey = this.KEY_MAP[key] || key;
    try {
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error(`❌ localStorageService.remove hatası (${key}):`, error);
      return false;
    }
  }

  // Tüm key'leri temizle (sadece mc_ ile başlayanlar)
  clearAllMcKeys() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mc_') || key.startsWith('bilardo')) {
        localStorage.removeItem(key);
      }
    });
    console.log('🧹 Tüm mc_ ve bilardo key\'leri temizlendi');
    return true;
  }

  // Key'den kategoriyi bul (ters arama)
  findCategoryByKey(storageKey) {
    for (const [category, key] of Object.entries(this.KEY_MAP)) {
      if (key === storageKey) {
        return category;
      }
    }
    return null;
  }

  // Veri boyutunu hesapla
  getDataSize(key) {
    const storageKey = this.KEY_MAP[key] || key;
    const data = localStorage.getItem(storageKey);
    if (!data) return 0;
    
    // Byte cinsinden boyut
    return new Blob([data]).size;
  }

  // Tüm verilerin toplam boyutu
  getTotalSize() {
    let total = 0;
    Object.keys(localStorage).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        total += new Blob([data]).size;
      }
    });
    return total;
  }

  // Backup al
  backup() {
    const backup = {};
    Object.keys(this.KEY_MAP).forEach(key => {
      backup[key] = this.get(key);
    });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `mc_backup_${timestamp}`;
    
    localStorage.setItem(backupKey, JSON.stringify(backup));
    console.log(`💾 Backup alındı: ${backupKey}`);
    return backupKey;
  }

  // Backup'dan geri yükle
  restore(backupKey) {
    try {
      const backupData = JSON.parse(localStorage.getItem(backupKey));
      if (!backupData) {
        console.error('❌ Backup bulunamadı:', backupKey);
        return false;
      }
      
      Object.keys(backupData).forEach(key => {
        if (this.KEY_MAP[key]) {
          this.set(key, backupData[key]);
        }
      });
      
      console.log(`🔙 Backup geri yüklendi: ${backupKey}`);
      return true;
    } catch (error) {
      console.error('❌ Backup geri yükleme hatası:', error);
      return false;
    }
  }
}

// Singleton instance oluştur
const localStorageService = new LocalStorageService();

export default localStorageService;