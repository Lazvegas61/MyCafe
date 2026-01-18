// File: admin-ui/src/pages/Raporlar/utils/raporHooks.js (DÜZELTİLMİŞ)
import { useState, useEffect, useCallback } from 'react';
import localStorageService from '../../../services/localStorageService';


export const useGunSonuRaporu = (filtreler) => {
  const [raporVerisi, setRaporVerisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const verileriYukle = useCallback(async () => {
    try {
      setLoading(true);
      
      const gunSonuRaporlari = localStorageService.get('mc_gunsonu_raporlar') || [];
      
      // Filtreleme
      const filtrelenmisRaporlar = gunSonuRaporlari.filter(rapor => {
        const raporTarihi = new Date(rapor.odemeTarihi || rapor.kapanisZamani);
        const baslangicTarihi = filtreler.baslangicTarihi ? new Date(filtreler.baslangicTarihi) : null;
        const bitisTarihi = filtreler.bitisTarihi ? new Date(filtreler.bitisTarihi) : null;
        
        let tarihUygun = true;
        if (baslangicTarihi) tarihUygun = raporTarihi >= baslangicTarihi;
        if (bitisTarihi) tarihUygun = tarihUygun && raporTarihi <= bitisTarihi;
        
        const masaTipiUygun = !filtreler.masaTipi || 
          (filtreler.masaTipi === 'bilardo' ? rapor.masaTipi === 'bilardo' : rapor.masaTipi !== 'bilardo');
        
        return tarihUygun && masaTipiUygun;
      });

      // DÜZELTME: filtrelenmisRaporlari → filtrelenmisRaporlar
      const hesaplanmisRapor = window.raporMotoruV2.gunSonuRaporuHesapla(filtrelenmisRaporlar);
      
      setRaporVerisi(hesaplanmisRapor);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Gün sonu raporu yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [filtreler]);

  useEffect(() => {
    verileriYukle();
  }, [verileriYukle]);

  return { raporVerisi, loading, error, refresh: verileriYukle };
};

export const useKasaRaporu = (filtreler) => {
  const [raporVerisi, setRaporVerisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const verileriYukle = useCallback(async () => {
    try {
      setLoading(true);
      
      const gunSonuRaporlari = localStorageService.get('mc_gunsonu_raporlar') || [];
      
      // Filtreleme
      const filtrelenmisRaporlar = gunSonuRaporlari.filter(rapor => {
        const raporTarihi = new Date(rapor.odemeTarihi || rapor.kapanisZamani);
        const baslangicTarihi = filtreler.baslangicTarihi ? new Date(filtreler.baslangicTarihi) : null;
        const bitisTarihi = filtreler.bitisTarihi ? new Date(filtreler.bitisTarihi) : null;
        
        let tarihUygun = true;
        if (baslangicTarihi) tarihUygun = raporTarihi >= baslangicTarihi;
        if (bitisTarihi) tarihUygun = tarihUygun && raporTarihi <= bitisTarihi;
        
        return tarihUygun;
      });

      const hesaplanmisRapor = window.raporMotoruV2.kasaRaporuHesapla(filtrelenmisRaporlari);
      
      setRaporVerisi(hesaplanmisRapor);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Kasa raporu yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [filtreler]);

  useEffect(() => {
    verileriYukle();
  }, [verileriYukle]);

  return { raporVerisi, loading, error, refresh: verileriYukle };
};

export const useUrunRaporu = (filtreler) => {
  const [raporVerisi, setRaporVerisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const verileriYukle = useCallback(async () => {
    try {
      setLoading(true);
      
      const gunSonuRaporlari = localStorageService.get('mc_gunsonu_raporlar') || [];
      
      // Filtreleme
      const filtrelenmisRaporlar = gunSonuRaporlari.filter(rapor => {
        const raporTarihi = new Date(rapor.odemeTarihi || rapor.kapanisZamani);
        const baslangicTarihi = filtreler.baslangicTarihi ? new Date(filtreler.baslangicTarihi) : null;
        const bitisTarihi = filtreler.bitisTarihi ? new Date(filtreler.bitisTarihi) : null;
        
        let tarihUygun = true;
        if (baslangicTarihi) tarihUygun = raporTarihi >= baslangicTarihi;
        if (bitisTarihi) tarihUygun = tarihUygun && raporTarihi <= bitisTarihi;
        
        // Kategori filtresi
        const kategoriUygun = !filtreler.kategoriId || 
          rapor.urunler?.some(urun => urun.categoryId === filtreler.kategoriId);
        
        return tarihUygun && kategoriUygun;
      });

      const hesaplanmisRapor = window.raporMotoruV2.urunRaporuHesapla(filtrelenmisRaporlari);
      
      setRaporVerisi(hesaplanmisRapor);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Ürün raporu yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [filtreler]);

  useEffect(() => {
    verileriYukle();
  }, [verileriYukle]);

  return { raporVerisi, loading, error, refresh: verileriYukle };
};

export const useKategoriRaporu = (filtreler) => {
  const [raporVerisi, setRaporVerisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const verileriYukle = useCallback(async () => {
    try {
      setLoading(true);
      
      const gunSonuRaporlari = localStorageService.get('mc_gunsonu_raporlar') || [];
      
      // Filtreleme
      const filtrelenmisRaporlar = gunSonuRaporlari.filter(rapor => {
        const raporTarihi = new Date(rapor.odemeTarihi || rapor.kapanisZamani);
        const baslangicTarihi = filtreler.baslangicTarihi ? new Date(filtreler.baslangicTarihi) : null;
        const bitisTarihi = filtreler.bitisTarihi ? new Date(filtreler.bitisTarihi) : null;
        
        let tarihUygun = true;
        if (baslangicTarihi) tarihUygun = raporTarihi >= baslangicTarihi;
        if (bitisTarihi) tarihUygun = tarihUygun && raporTarihi <= bitisTarihi;
        
        return tarihUygun;
      });

      const hesaplanmisRapor = window.raporMotoruV2.kategoriRaporuHesapla(filtrelenmisRaporlari);
      
      setRaporVerisi(hesaplanmisRapor);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Kategori raporu yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [filtreler]);

  useEffect(() => {
    verileriYukle();
  }, [verileriYukle]);

  return { raporVerisi, loading, error, refresh: verileriYukle };
};

export const useMasaRaporu = (filtreler) => {
  const [raporVerisi, setRaporVerisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const verileriYukle = useCallback(async () => {
    try {
      setLoading(true);
      
      const gunSonuRaporlari = localStorageService.get('mc_gunsonu_raporlar') || [];
      
      // Filtreleme
      const filtrelenmisRaporlar = gunSonuRaporlari.filter(rapor => {
        const raporTarihi = new Date(rapor.odemeTarihi || rapor.kapanisZamani);
        const baslangicTarihi = filtreler.baslangicTarihi ? new Date(filtreler.baslangicTarihi) : null;
        const bitisTarihi = filtreler.bitisTarihi ? new Date(filtreler.bitisTarihi) : null;
        
        let tarihUygun = true;
        if (baslangicTarihi) tarihUygun = raporTarihi >= baslangicTarihi;
        if (bitisTarihi) tarihUygun = tarihUygun && raporTarihi <= bitisTarihi;
        
        // Masa tipi filtresi
        const masaTipiUygun = !filtreler.masaTipi || 
          (filtreler.masaTipi === 'bilardo' ? rapor.masaTipi === 'bilardo' : rapor.masaTipi !== 'bilardo');
        
        // Masa numarası filtresi
        const masaNoUygun = !filtreler.masaNo || 
          rapor.masaNo?.toString().includes(filtreler.masaNo.toString()) ||
          rapor.masaNum?.toString().includes(filtreler.masaNo.toString());
        
        return tarihUygun && masaTipiUygun && masaNoUygun;
      });

      const hesaplanmisRapor = window.raporMotoruV2.masaRaporuHesapla(filtrelenmisRaporlari);
      
      setRaporVerisi(hesaplanmisRapor);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Masa raporu yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [filtreler]);

  useEffect(() => {
    verileriYukle();
  }, [verileriYukle]);

  return { raporVerisi, loading, error, refresh: verileriYukle };
};

export const useBilardoRaporu = (filtreler) => {
  const [raporVerisi, setRaporVerisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const verileriYukle = useCallback(async () => {
    try {
      setLoading(true);
      
      const gunSonuRaporlari = localStorageService.get('mc_gunsonu_raporlar') || [];
      const bilardoAdisyonlar = localStorageService.get('bilardo_adisyonlar') || [];
      
      // Sadece bilardo masalarını filtrele
      const bilardoRaporlari = gunSonuRaporlari.filter(rapor => 
        rapor.masaTipi === 'bilardo' || rapor.tur === 'BİLARDO'
      );
      
      // Filtreleme
      const filtrelenmisRaporlar = bilardoRaporlari.filter(rapor => {
        const raporTarihi = new Date(rapor.odemeTarihi || rapor.kapanisZamani);
        const baslangicTarihi = filtreler.baslangicTarihi ? new Date(filtreler.baslangicTarihi) : null;
        const bitisTarihi = filtreler.bitisTarihi ? new Date(filtreler.bitisTarihi) : null;
        
        let tarihUygun = true;
        if (baslangicTarihi) tarihUygun = raporTarihi >= baslangicTarihi;
        if (bitisTarihi) tarihUygun = tarihUygun && raporTarihi <= bitisTarihi;
        
        return tarihUygun;
      });

      const hesaplanmisRapor = window.raporMotoruV2.bilardoRaporuHesapla(filtrelenmisRaporlar, bilardoAdisyonlar);
      
      setRaporVerisi(hesaplanmisRapor);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Bilardo raporu yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [filtreler]);

  useEffect(() => {
    verileriYukle();
  }, [verileriYukle]);

  return { raporVerisi, loading, error, refresh: verileriYukle };
};

export const useGiderRaporu = (filtreler) => {
  const [raporVerisi, setRaporVerisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const verileriYukle = useCallback(async () => {
    try {
      setLoading(true);
      
      const giderler = localStorageService.get('mc_giderler') || [];
      
      // Filtreleme
      const filtrelenmisGiderler = giderler.filter(gider => {
        const giderTarihi = new Date(gider.tarih);
        const baslangicTarihi = filtreler.baslangicTarihi ? new Date(filtreler.baslangicTarihi) : null;
        const bitisTarihi = filtreler.bitisTarihi ? new Date(filtreler.bitisTarihi) : null;
        
        let tarihUygun = true;
        if (baslangicTarihi) tarihUygun = giderTarihi >= baslangicTarihi;
        if (bitisTarihi) tarihUygun = tarihUygun && giderTarihi <= bitisTarihi;
        
        // Gider tipi filtresi
        const tipUygun = !filtreler.giderTipi || gider.tip === filtreler.giderTipi;
        
        return tarihUygun && tipUygun;
      });

      const hesaplanmisRapor = window.raporMotoruV2.giderRaporuHesapla(filtrelenmisGiderler);
      
      setRaporVerisi(hesaplanmisRapor);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Gider raporu yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [filtreler]);

  useEffect(() => {
    verileriYukle();
  }, [verileriYukle]);

  return { raporVerisi, loading, error, refresh: verileriYukle };
};

export default {
  useGunSonuRaporu,
  useKasaRaporu,
  useUrunRaporu,
  useKategoriRaporu,
  useMasaRaporu,
  useBilardoRaporu,
  useGiderRaporu
};