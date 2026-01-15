// File: admin-ui/src/pages/Raporlar/RaporDetay/MasaDetay.jsx
import React, { useState, useEffect } from 'react';
import { useRaporFiltre } from '../../../context/RaporFiltreContext';
import localStorageService from '../../../services/localStorageService';
import { raporMotoruV2 } from '../../../services/raporMotoruV2';
import TabloBilesenleri from '../components/TabloBilesenleri';
import './MasaDetay.css';

const MasaDetayRapor = () => {
  const { filtreler } = useRaporFiltre();
  const [masaVerisi, setMasaVerisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verileriYukle = async () => {
      try {
        setLoading(true);
        
        // LocalStorage'dan gün sonu raporlarını çek
        const gunSonuRaporlari = localStorageService.get('mc_gunsonu_raporlar') || [];
        
        // Filtreleme uygula
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
          
          // Masa numarası filtresi - silinen masalar dahil
          const masaNoUygun = !filtreler.masaNo || 
            rapor.masaNo?.toString().includes(filtreler.masaNo.toString()) ||
            rapor.masaNum?.toString().includes(filtreler.masaNo.toString());

          return tarihUygun && masaTipiUygun && masaNoUygun;
        });

        // Masa raporunu hesapla
        let hesaplanmisRapor = raporMotoruV2.masaRaporuHesapla(filtrelenmisRaporlar);
        
        // Masa detaylarını toplam adisyona göre sırala (en çoktan en aza)
        if (hesaplanmisRapor.masaDetaylari) {
          hesaplanmisRapor.masaDetaylari.sort((a, b) => {
            const adisyonA = a.toplamAdisyon || 0;
            const adisyonB = b.toplamAdisyon || 0;
            return adisyonB - adisyonA;
          });
        }

        setMasaVerisi(hesaplanmisRapor);
        setError(null);
      } catch (err) {
        setError('Masa raporu yüklenirken hata oluştu: ' + err.message);
        console.error('Masa raporu hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    verileriYukle();
  }, [filtreler]);

  const handleExportPDF = () => {
    if (masaVerisi) {
      // PDF export işlemi
      console.log('PDF export işlemi başlatıldı');
    }
  };

  const handleMasaClick = (masa) => {
    console.log('Masa tıklandı:', masa);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Masa raporu yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">❌</div>
        <h3>Hata</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Tekrar Dene</button>
      </div>
    );
  }

  return (
    <div className="masa-detay-rapor">
      <div className="detay-header">
        <div className="header-info">
          <h1>Masa Raporu Detayı</h1>
          <p className="tarih-araligi">
            {filtreler.baslangicTarihi && filtreler.bitisTarihi 
              ? `${new Date(filtreler.baslangicTarihi).toLocaleDateString('tr-TR')} - ${new Date(filtreler.bitisTarihi).toLocaleDateString('tr-TR')}`
              : 'Tüm Zamanlar'}
          </p>
          {filtreler.masaTipi && (
            <p className="filtre-bilgi">
              Masa Tipi: {filtreler.masaTipi === 'bilardo' ? 'Bilardo Masaları' : 'Normal Masalar'}
            </p>
          )}
          {filtreler.masaNo && (
            <p className="filtre-bilgi">
              Masa No: {filtreler.masaNo}
            </p>
          )}
        </div>
      </div>

      {/* Masa Özet Bilgileri */}
      <div className="masa-ozet">
        <div className="ozet-grid">
          <div className="ozet-kart">
            <h3>Toplam Masa</h3>
            <p className="deger">{masaVerisi?.toplamMasa || 0}</p>
            <div className="ozet-detay">
              <span>{masaVerisi?.normalMasa || 0} normal</span>
              <span>{masaVerisi?.bilardoMasa || 0} bilardo</span>
            </div>
          </div>
          
          <div className="ozet-kart">
            <h3>Toplam Ciro</h3>
            <p className="deger">{masaVerisi?.toplamCiro?.toFixed(2)} ₺</p>
            <div className="ozet-detay">
              <span>Ortalama: {(masaVerisi?.ortalamaMasaCiro || 0).toFixed(2)} ₺</span>
            </div>
          </div>
          
          <div className="ozet-kart">
            <h3>Toplam Adisyon</h3>
            <p className="deger">{masaVerisi?.toplamAdisyon || 0}</p>
            <div className="ozet-detay">
              <span>Ortalama: {(masaVerisi?.ortalamaMasaAdisyon || 0).toFixed(1)}</span>
            </div>
          </div>
          
          <div className="ozet-kart">
            <h3>En Çok Adisyon</h3>
            <p className="deger">
              Masa {masaVerisi?.enCokAdisyonMasa?.masaNo || '-'}
            </p>
            <div className="ozet-detay">
              <span>{masaVerisi?.enCokAdisyonMasa?.toplamAdisyon || 0} adisyon</span>
              <span>{(masaVerisi?.enCokAdisyonMasa?.toplamTutar || 0).toFixed(2)} ₺</span>
            </div>
          </div>
        </div>
      </div>

      {/* Masa Bazlı Detay Tablosu */}
      <div className="masa-tablo-section">
        <h2>Masa Bazlı Detaylar</h2>
        {masaVerisi?.masaDetaylari && masaVerisi.masaDetaylari.length > 0 ? (
          <div className="masa-detay-not">
            <p>⚠️ Not: Tablo en çok toplam adisyona sahip masadan başlayarak sıralanmıştır.</p>
          </div>
        ) : null}
        {masaVerisi?.masaDetaylari && masaVerisi.masaDetaylari.length > 0 ? (
          <TabloBilesenleri.MasaDetayTablosu 
            data={masaVerisi.masaDetaylari}
            onMasaClick={handleMasaClick}
          />
        ) : (
          <div className="bos-veri">
            <p>Masa detay verisi bulunamadı.</p>
          </div>
        )}
      </div>

      {/* En Çok Kullanılan Masalar */}
      <div className="cok-kullanilan-section">
        <h2>En Çok Kullanılan Masalar</h2>
        <div className="cok-kullanilan-grid">
          {masaVerisi?.enCokKullanilanMasalar && masaVerisi.enCokKullanilanMasalar.length > 0 ? (
            masaVerisi.enCokKullanilanMasalar.slice(0, 6).map((masa, index) => (
              <div key={index} className="kullanilan-kart">
                <div className="kullanilan-header">
                  <h3>Masa {masa.masaNo}</h3>
                  <span className={`masa-tipi ${masa.masaTipi === 'BİLARDO' ? 'bilardo' : 'normal'}`}>
                    {masa.masaTipi === 'BİLARDO' ? 'Bilardo' : 'Normal'}
                  </span>
                </div>
                <div className="kullanilan-istatistik">
                  <div className="istatistik-item">
                    <span className="istatistik-label">Toplam Adisyon</span>
                    <span className="istatistik-deger">{masa.toplamAdisyon || 0} adisyon</span>
                  </div>
                  <div className="istatistik-item">
                    <span className="istatistik-label">Toplam Ciro</span>
                    <span className="istatistik-deger">{masa.toplamTutar.toFixed(2)} ₺</span>
                  </div>
                  <div className="istatistik-item">
                    <span className="istatistik-label">Kullanım Sayısı</span>
                    <span className="istatistik-deger">{masa.kullanimSayisi} kez</span>
                  </div>
                  <div className="istatistik-item">
                    <span className="istatistik-label">Ortalama Süre</span>
                    <span className="istatistik-deger">{masa.ortalamaSure.toFixed(0)} dk</span>
                  </div>
                </div>
                <div className="kullanilan-footer">
                  <span className="son-kullanma">
                    Son: {masa.sonKullanim ? new Date(masa.sonKullanim).toLocaleDateString('tr-TR') : '-'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bos-veri">
              <p>Kullanım verisi bulunamadı.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sabit PDF ve Yazdır Butonları */}
      <div className="fixed-export-buttons">
        <button className="btn-pdf" onClick={handleExportPDF}>
          📄 PDF İndir
        </button>
        <button className="btn-print" onClick={() => window.print()}>
          🖨️ Yazdır
        </button>
      </div>
    </div>
  );
};

export default MasaDetayRapor;