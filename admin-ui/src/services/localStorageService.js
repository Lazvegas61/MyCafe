/**
 * MyCafe LocalStorage Rapor Servisi
 */
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
        gun_bilgileri: 'mc_gun_bilgileri',
        gun_sonu_listesi: 'mc_gun_sonu_listesi',
        bilardo_adisyonlar: 'mc_bilardo_adisyonlar'
      };
    }
  
    // Ham veriyi getir
    get(key) {
      const storageKey = this.KEY_MAP[key] || key;
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    }
  
    // Tüm verileri getir
    getAll() {
      const data = {};
      Object.keys(this.KEY_MAP).forEach(key => {
        data[key] = this.get(key);
      });
      return data;
    }
  
    // Tarih filtresi
    filterByDate(data, startDate, endDate) {
      if (!data || !Array.isArray(data)) return [];
      
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      return data.filter(item => {
        if (!item.tarih && !item.olusturmaTarihi) return true;
        
        const itemDate = new Date(item.tarih || item.olusturmaTarihi);
        
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        
        return true;
      });
    }
  }
  
  export default new LocalStorageService();