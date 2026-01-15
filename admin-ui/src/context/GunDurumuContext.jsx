// File: admin-ui/src/context/GunDurumuContext.jsx
import React, { createContext, useState, useCallback, useEffect, useContext } from "react";

const GunDurumuContext = createContext();

export const useGunDurumu = () => {
  const context = useContext(GunDurumuContext);
  if (!context) {
    throw new Error('useGunDurumu must be used within a GunDurumuProvider');
  }
  return context;
};

export const GunDurumuProvider = ({ children }) => {
  const [gunAktif, setGunAktif] = useState(() => {
    // TEK MERKEZİ KONTROL NOKTASI
    const gunDurumu = localStorage.getItem('mycafe_gun_durumu');
    return gunDurumu === 'aktif';
  });

  const [gunBilgileri, setGunBilgileri] = useState(() => {
    const saved = localStorage.getItem('mycafe_gun_bilgileri');
    return saved ? JSON.parse(saved) : {
      baslangicKasa: 0,
      nakitGiris: 0,
      krediKarti: 0,
      toplamAdisyon: 0,
      acikAdisyon: 0,
      gunlukSatis: 0,
      baslangicTarih: null
    };
  });

  // Gün başlatma fonksiyonu - TEK MERKEZİ FONKSİYON
  const gunBaslat = useCallback(() => {
    const baslangicZamani = new Date();
    const baslangicKasa = 0;
    
    // TEK ANAHTAR: mycafe_gun_durumu
    localStorage.setItem('mycafe_gun_durumu', 'aktif');
    localStorage.setItem('mycafe_gun_baslangic', baslangicZamani.toISOString());
    localStorage.setItem('mycafe_gun_baslangic_kasa', baslangicKasa.toString());
    
    const yeniGunBilgileri = {
      baslangicKasa: baslangicKasa,
      nakitGiris: 0,
      krediKarti: 0,
      toplamAdisyon: 0,
      acikAdisyon: 0,
      gunlukSatis: 0,
      baslangicTarih: baslangicZamani.toISOString(),
      sonGuncelleme: new Date().toISOString()
    };
    
    localStorage.setItem('mycafe_gun_bilgileri', JSON.stringify(yeniGunBilgileri));
    
    setGunAktif(true);
    setGunBilgileri(yeniGunBilgileri);
    
    // GLOBAL EVENT - Tüm uygulama dinlesin
    if (window.dispatchGlobalEvent) {
      window.dispatchGlobalEvent('gunDurumuDegisti', { aktif: true });
      window.dispatchGlobalEvent('gunBaslatildi', { 
        zaman: baslangicZamani,
        kasa: baslangicKasa 
      });
    }
    
    console.log('✅ Gün başlatıldı (Merkezi):', baslangicZamani);
    
    return true;
  }, []);

  // Gün sonu fonksiyonu
  const gunSonuYap = useCallback(() => {
    localStorage.setItem('mycafe_gun_durumu', 'kapali');
    setGunAktif(false);
    
    if (window.dispatchGlobalEvent) {
      window.dispatchGlobalEvent('gunDurumuDegisti', { aktif: false });
    }
    
    console.log('✅ Gün sonu yapıldı (Merkezi)');
    return true;
  }, []);

  // Gün durumunu kontrol et - TEK MERKEZİ KONTROL
  const gunDurumunuKontrolEt = useCallback(() => {
    const gunDurumu = localStorage.getItem('mycafe_gun_durumu');
    const isAktif = gunDurumu === 'aktif';
    
    console.log('🔄 Gün durumu kontrol ediliyor (Merkezi):', { gunDurumu, isAktif });
    
    if (gunAktif !== isAktif) {
      setGunAktif(isAktif);
    }
    
    return isAktif;
  }, [gunAktif]);

  // Storage değişikliklerini dinle
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'mycafe_gun_durumu') {
        console.log('📦 Gün durumu storage değişti:', e.newValue);
        gunDurumunuKontrolEt();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [gunDurumunuKontrolEt]);

  // Global event'leri dinle
  useEffect(() => {
    const handleGunDurumuDegisti = (event) => {
      if (event.detail && typeof event.detail.aktif !== 'undefined') {
        console.log('🎯 Gün durumu eventi alındı:', event.detail.aktif);
        setGunAktif(event.detail.aktif);
        
        // Storage'a da yaz (tutarlılık için)
        localStorage.setItem('mycafe_gun_durumu', event.detail.aktif ? 'aktif' : 'kapali');
      }
    };
    
    window.addEventListener('gunDurumuDegisti', handleGunDurumuDegisti);
    
    return () => {
      window.removeEventListener('gunDurumuDegisti', handleGunDurumuDegisti);
    };
  }, []);

  // Periyodik kontrol
  useEffect(() => {
    const interval = setInterval(gunDurumunuKontrolEt, 3000);
    return () => clearInterval(interval);
  }, [gunDurumunuKontrolEt]);

  // Gün durumunu resetleme (debug için)
  const gunDurumunuResetle = useCallback(() => {
    localStorage.removeItem('mycafe_gun_durumu');
    localStorage.removeItem('mycafe_gun_baslangic');
    localStorage.removeItem('mycafe_gun_bilgileri');
    setGunAktif(false);
    setGunBilgileri({
      baslangicKasa: 0,
      nakitGiris: 0,
      krediKarti: 0,
      toplamAdisyon: 0,
      acikAdisyon: 0,
      gunlukSatis: 0,
      baslangicTarih: null
    });
    
    console.log('🔄 Gün durumu resetlendi');
    return true;
  }, []);

  const value = {
    gunAktif,
    gunBilgileri,
    gunBaslat,
    gunSonuYap,
    gunDurumunuKontrolEt,
    gunDurumunuResetle
  };

  return (
    <GunDurumuContext.Provider value={value}>
      {children}
    </GunDurumuContext.Provider>
  );
};

export default GunDurumuContext;