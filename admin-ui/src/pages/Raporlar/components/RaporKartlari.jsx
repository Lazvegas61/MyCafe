// File: admin-ui/src/pages/Raporlar/components/RaporKartlari.jsx
import React, { useEffect, useState } from 'react';
import localStorageService from '../../../services/localStorageService';

const RaporKartlari = () => {
  const [istatistikler, setIstatistikler] = useState({
    bugunCiro: 0,
    buHaftaCiro: 0,
    buAyCiro: 0,
    aktifMasaSayisi: 0,
    ortalamaSiparisTutari: 0
  });

  useEffect(() => {
    const verileriYukle = () => {
      try {
        // Bugünün tarihi
        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);
        
        // Bu haftanın başlangıcı (Pazartesi)
        const haftaBaslangici = new Date(bugun);
        haftaBaslangici.setDate(bugun.getDate() - bugun.getDay() + 1);
        
        // Bu ayın başlangıcı
        const ayBaslangici = new Date(bugun.getFullYear(), bugun.getMonth(), 1);
        
        // Gün sonu raporlarını getir
        const raporlar = localStorageService.get('mc_gunsonu_raporlar') || [];
        
        // Bugünkü raporları filtrele
        const bugunRaporlar = raporlar.filter(rapor => {
          const raporTarihi = new Date(rapor.odemeTarihi || rapor.kapanisZamani);
          return raporTarihi >= bugun;
        });
        
        // Bu haftaki raporları filtrele
        const buHaftaRaporlar = raporlar.filter(rapor => {
          const raporTarihi = new Date(rapor.odemeTarihi || rapor.kapanisZamani);
          return raporTarihi >= haftaBaslangici;
        });
        
        // Bu aydaki raporları filtrele
        const buAyRaporlar = raporlar.filter(rapor => {
          const raporTarihi = new Date(rapor.odemeTarihi || rapor.kapanisZamani);
          return raporTarihi >= ayBaslangici;
        });
        
        // Masaları getir
        const masalar = localStorageService.get('masalar') || [];
        const aktifMasalar = masalar.filter(masa => masa.durum === 'dolu');
        
        // Rapor motoru ile hesaplamalar
        const bugunCiro = window.raporMotoruV2.toplamCiroHesapla(bugunRaporlar);
        const buHaftaCiro = window.raporMotoruV2.toplamCiroHesapla(buHaftaRaporlar);
        const buAyCiro = window.raporMotoruV2.toplamCiroHesapla(buAyRaporlar);
        
        setIstatistikler({
          bugunCiro,
          buHaftaCiro,
          buAyCiro,
          aktifMasaSayisi: aktifMasalar.length,
          ortalamaSiparisTutari: buAyRaporlar.length > 0 ? buAyCiro / buAyRaporlar.length : 0
        });
      } catch (error) {
        console.error('İstatistik yükleme hatası:', error);
      }
    };

    verileriYukle();
    
    // 30 saniyede bir güncelle
    const interval = setInterval(verileriYukle, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rapor-istatistik-kartlari">
      <div className="istatistik-grid">
        <div className="istatistik-kart">
          <div className="istatistik-icon" style={{ background: '#4CAF50' }}>
            📅
          </div>
          <div className="istatistik-bilgi">
            <h4>Bugünkü Ciro</h4>
            <p className="istatistik-deger">{istatistikler.bugunCiro.toFixed(2)} ₺</p>
          </div>
        </div>
        
        <div className="istatistik-kart">
          <div className="istatistik-icon" style={{ background: '#2196F3' }}>
            📆
          </div>
          <div className="istatistik-bilgi">
            <h4>Bu Hafta Ciro</h4>
            <p className="istatistik-deger">{istatistikler.buHaftaCiro.toFixed(2)} ₺</p>
          </div>
        </div>
        
        <div className="istatistik-kart">
          <div className="istatistik-icon" style={{ background: '#FF9800' }}>
            🗓️
          </div>
          <div className="istatistik-bilgi">
            <h4>Bu Ay Ciro</h4>
            <p className="istatistik-deger">{istatistikler.buAyCiro.toFixed(2)} ₺</p>
          </div>
        </div>
        
        <div className="istatistik-kart">
          <div className="istatistik-icon" style={{ background: '#9C27B0' }}>
            🪑
          </div>
          <div className="istatistik-bilgi">
            <h4>Aktif Masa</h4>
            <p className="istatistik-deger">{istatistikler.aktifMasaSayisi}</p>
          </div>
        </div>
        
        <div className="istatistik-kart">
          <div className="istatistik-icon" style={{ background: '#00BCD4' }}>
            💰
          </div>
          <div className="istatistik-bilgi">
            <h4>Ort. Sipariş</h4>
            <p className="istatistik-deger">{istatistikler.ortalamaSiparisTutari.toFixed(2)} ₺</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaporKartlari;