// File: admin-ui/src/pages/Raporlar/RaporDetay/KategoriDetay.jsx
import React, { useState, useEffect } from 'react';
import { useRaporFiltre } from '../../../context/RaporFiltreContext';
import localStorageService from '../../../services/localStorageService';
import TabloBilesenleri from '../components/TabloBilesenleri';
import GrafikBilesenleri from '../components/GrafikBilesenleri';
import './KategoriDetay.css';

const KategoriDetay = () => {
  const { filtreler, setFiltreler } = useRaporFiltre();
  const [kategoriVerisi, setKategoriVerisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kategoriler, setKategoriler] = useState([]);
  const [localFiltreler, setLocalFiltreler] = useState({
    kategoriId: '',
    baslangicTarihi: filtreler.baslangicTarihi || '',
    bitisTarihi: filtreler.bitisTarihi || ''
  });

  // Kategorileri yükle
  useEffect(() => {
    const yukleKategoriler = () => {
      try {
        const kategorilerData = localStorageService.get('mc_kategoriler') || [];
        setKategoriler(kategorilerData);
      } catch (err) {
        console.error('Kategoriler yüklenirken hata:', err);
      }
    };

    yukleKategoriler();
  }, []);

  // Filtreleri uygula
  const filtreleriUygula = () => {
    setFiltreler(prev => ({
      ...prev,
      kategoriId: localFiltreler.kategoriId,
      baslangicTarihi: localFiltreler.baslangicTarihi,
      bitisTarihi: localFiltreler.bitisTarihi
    }));
  };

  // Filtreleri sıfırla
  const filtreleriSifirla = () => {
    const sifirFiltreler = {
      kategoriId: '',
      baslangicTarihi: '',
      bitisTarihi: ''
    };
    setLocalFiltreler(sifirFiltreler);
    setFiltreler(prev => ({
      ...prev,
      ...sifirFiltreler
    }));
  };

  // Verileri yükle
  useEffect(() => {
    const verileriYukle = async () => {
      try {
        setLoading(true);
        
        // LocalStorage'dan gün sonu raporlarını çek
        const gunSonuRaporlari = localStorageService.get('mc_gunsonu_raporlar') || [];
        
        // Filtreleme uygula
        const filtrelenmisRaporlar = gunSonuRaporlari.filter(rapor => {
          // Tarih filtresi
          let tarihUygun = true;
          if (filtreler.baslangicTarihi || filtreler.bitisTarihi) {
            const raporTarihi = new Date(rapor.odemeTarihi || rapor.kapanisZamani);
            
            if (filtreler.baslangicTarihi) {
              const baslangicTarihi = new Date(filtreler.baslangicTarihi);
              baslangicTarihi.setHours(0, 0, 0, 0);
              tarihUygun = raporTarihi >= baslangicTarihi;
            }
            
            if (filtreler.bitisTarihi) {
              const bitisTarihi = new Date(filtreler.bitisTarihi);
              bitisTarihi.setHours(23, 59, 59, 999);
              tarihUygun = tarihUygun && raporTarihi <= bitisTarihi;
            }
          }
          
          // Kategori filtresi
          let kategoriUygun = true;
          if (filtreler.kategoriId && rapor.satislar) {
            kategoriUygun = false;
            // Rapor içindeki satışlarda bu kategori var mı kontrol et
            for (const satis of rapor.satislar) {
              if (satis.kategoriId === filtreler.kategoriId) {
                kategoriUygun = true;
                break;
              }
            }
          }
          
          return tarihUygun && kategoriUygun;
        });

        // Kategori raporunu hesapla
        const hesaplanmisRapor = window.raporMotoruV2.kategoriRaporuHesapla(filtrelenmisRaporlar);
        
        // Eğer kategori filtresi varsa, sadece o kategoriyi göster
        if (filtreler.kategoriId) {
          const seciliKategori = kategoriler.find(k => k.id === filtreler.kategoriId);
          if (seciliKategori && hesaplanmisRapor.kategoriSatislari) {
            // Sadece seçili kategoriyi filtrele
            const filtrelenmisSatislar = hesaplanmisRapor.kategoriSatislari.filter(
              satis => satis.kategoriId === filtreler.kategoriId
            );
            
            // Alt kategori analizini güncelle
            const altKategoriAnaliz = hesaplanmisRapor.altKategoriAnaliz?.filter(
              analiz => analiz.anaKategoriId === filtreler.kategoriId
            );
            
            hesaplanmisRapor.kategoriSatislari = filtrelenmisSatislar;
            hesaplanmisRapor.altKategoriAnaliz = altKategoriAnaliz;
            hesaplanmisRapor.toplamKategori = 1;
          }
        }
        
        setKategoriVerisi(hesaplanmisRapor);
        setError(null);
      } catch (err) {
        setError('Kategori raporu yüklenirken hata oluştu: ' + err.message);
        console.error('Kategori raporu hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    verileriYukle();
  }, [filtreler, kategoriler]);

  const handleExportPDF = () => {
    if (kategoriVerisi) {
      // PDF export işlemleri buraya eklenecek
      console.log('PDF export başlatılıyor...', kategoriVerisi);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFiltreler(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Kategori raporu yükleniyor...</p>
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
    <div className="kategori-detay">
      {/* Filtre Bölümü */}
      <div className="filtre-panel">
        <h2>Filtreler</h2>
        <div className="filtre-grid">
          {/* Kategori Filtresi */}
          <div className="filtre-grup">
            <label htmlFor="kategoriId">Kategori Seçin:</label>
            <select
              id="kategoriId"
              name="kategoriId"
              value={localFiltreler.kategoriId}
              onChange={handleInputChange}
              className="filtre-select"
            >
              <option value="">Tüm Kategoriler</option>
              {kategoriler
                .filter(kategori => kategori.durum === true)
                .map(kategori => (
                  <option key={kategori.id} value={kategori.id}>
                    {kategori.ad}
                  </option>
                ))}
            </select>
          </div>

          {/* Tarih Filtresi - Başlangıç */}
          <div className="filtre-grup">
            <label htmlFor="baslangicTarihi">Başlangıç Tarihi:</label>
            <input
              type="date"
              id="baslangicTarihi"
              name="baslangicTarihi"
              value={localFiltreler.baslangicTarihi}
              onChange={handleInputChange}
              className="filtre-input"
            />
          </div>

          {/* Tarih Filtresi - Bitiş */}
          <div className="filtre-grup">
            <label htmlFor="bitisTarihi">Bitiş Tarihi:</label>
            <input
              type="date"
              id="bitisTarihi"
              name="bitisTarihi"
              value={localFiltreler.bitisTarihi}
              onChange={handleInputChange}
              className="filtre-input"
            />
          </div>

          {/* Filtre Butonları */}
          <div className="filtre-butonlar">
            <button className="btn-uygula" onClick={filtreleriUygula}>
              🔍 Filtrele
            </button>
            <button className="btn-sifirla" onClick={filtreleriSifirla}>
              ↻ Sıfırla
            </button>
          </div>
        </div>

        {/* Aktif Filtre Bilgisi */}
        {(filtreler.kategoriId || filtreler.baslangicTarihi || filtreler.bitisTarihi) && (
          <div className="aktif-filtre-bilgisi">
            <h4>Aktif Filtreler:</h4>
            <div className="aktif-filtreler">
              {filtreler.kategoriId && (
                <span className="filtre-etiket">
                  Kategori: {kategoriler.find(k => k.id === filtreler.kategoriId)?.ad || 'Seçili Kategori'}
                  <button onClick={() => {
                    setLocalFiltreler(prev => ({ ...prev, kategoriId: '' }));
                    setFiltreler(prev => ({ ...prev, kategoriId: '' }));
                  }}>×</button>
                </span>
              )}
              {filtreler.baslangicTarihi && (
                <span className="filtre-etiket">
                  Başlangıç: {new Date(filtreler.baslangicTarihi).toLocaleDateString('tr-TR')}
                  <button onClick={() => {
                    setLocalFiltreler(prev => ({ ...prev, baslangicTarihi: '' }));
                    setFiltreler(prev => ({ ...prev, baslangicTarihi: '' }));
                  }}>×</button>
                </span>
              )}
              {filtreler.bitisTarihi && (
                <span className="filtre-etiket">
                  Bitiş: {new Date(filtreler.bitisTarihi).toLocaleDateString('tr-TR')}
                  <button onClick={() => {
                    setLocalFiltreler(prev => ({ ...prev, bitisTarihi: '' }));
                    setFiltreler(prev => ({ ...prev, bitisTarihi: '' }));
                  }}>×</button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="detay-header">
        <div className="header-info">
          <h1>Kategori Raporu Detayı</h1>
          <p className="tarih-araligi">
            {filtreler.baslangicTarihi || filtreler.bitisTarihi 
              ? `${filtreler.baslangicTarihi ? new Date(filtreler.baslangicTarihi).toLocaleDateString('tr-TR') : 'Başlangıç'} - 
                 ${filtreler.bitisTarihi ? new Date(filtreler.bitisTarihi).toLocaleDateString('tr-TR') : 'Bitiş'}`
              : 'Tüm Zamanlar'}
            {filtreler.kategoriId && ` | Kategori: ${kategoriler.find(k => k.id === filtreler.kategoriId)?.ad || ''}`}
          </p>
        </div>
      </div>

      {/* Kategori Özet Bilgileri */}
      <div className="kategori-ozet">
        <div className="ozet-grid">
          <div className="ozet-kart">
            <h3>Toplam Kategori</h3>
            <p className="deger">{kategoriVerisi?.toplamKategori || 0}</p>
            <div className="ozet-detay">
              <span>{kategoriVerisi?.aktifKategori || 0} aktif</span>
              <span>{kategoriVerisi?.pasifKategori || 0} pasif</span>
            </div>
          </div>
          
          <div className="ozet-kart">
            <h3>Toplam Satış</h3>
            <p className="deger">{kategoriVerisi?.toplamSatis?.toFixed(2) || '0.00'} ₺</p>
            <div className="ozet-detay">
              <span>Ortalama: {(kategoriVerisi?.ortalamaKategoriSatis || 0).toFixed(2)} ₺</span>
            </div>
          </div>
          
          <div className="ozet-kart">
            <h3>En Çok Satan</h3>
            <p className="deger">
              {kategoriVerisi?.enCokSatanKategori?.kategoriAdi?.substring(0, 20) || '-'}
              {kategoriVerisi?.enCokSatanKategori?.kategoriAdi?.length > 20 ? '...' : ''}
            </p>
            <div className="ozet-detay">
              <span>{kategoriVerisi?.enCokSatanKategori?.satisAdedi || 0} adet</span>
              <span>{kategoriVerisi?.enCokSatanKategori?.toplamTutar?.toFixed(2) || '0.00'} ₺</span>
            </div>
          </div>
          
          <div className="ozet-kart">
            <h3>En Karlı</h3>
            <p className="deger">
              {kategoriVerisi?.enKarliKategori?.kategoriAdi?.substring(0, 20) || '-'}
              {kategoriVerisi?.enKarliKategori?.kategoriAdi?.length > 20 ? '...' : ''}
            </p>
            <div className="ozet-detay">
              <span>Kar: {(kategoriVerisi?.enKarliKategori?.kar || 0).toFixed(2)} ₺</span>
              <span>Oran: %{(kategoriVerisi?.enKarliKategori?.karOrani || 0).toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kategori Bazlı Satış Tablosu */}
      <div className="kategori-tablo-section">
        <h2>Kategori Bazlı Satış Performansı</h2>
        {kategoriVerisi?.kategoriSatislari && kategoriVerisi.kategoriSatislari.length > 0 ? (
          <TabloBilesenleri.BasitTablosu
            columns={[
              { key: 'kategoriAdi', header: 'Kategori Adı', type: 'text' },
              { key: 'satisAdedi', header: 'Satış Adedi', type: 'number' },
              { key: 'toplamTutar', header: 'Toplam Tutar', type: 'currency' },
              { key: 'ortalamaFiyat', header: 'Ort. Fiyat', type: 'currency' },
              { key: 'kar', header: 'Kar', type: 'currency' },
              { key: 'karOrani', header: 'Kar Oranı', type: 'percent' }
            ]}
            data={kategoriVerisi.kategoriSatislari}
            title=""
          />
        ) : (
          <div className="bos-veri">
            <p>Kategori satış verisi bulunamadı.</p>
            {filtreler.kategoriId && <p className="filtre-bilgi">Seçili kategori için satış kaydı bulunamadı.</p>}
          </div>
        )}
      </div>

      {/* Kategori Dağılım Grafiği */}
      <div className="grafik-section">
        <h2>Kategori Bazlı Satış Dağılımı</h2>
        {kategoriVerisi?.kategoriSatislari && kategoriVerisi.kategoriSatislari.length > 0 ? (
          <GrafikBilesenleri.KategoriDagilimYatay 
            data={kategoriVerisi.kategoriSatislari.slice(0, 15)}
          />
        ) : (
          <div className="bos-veri">
            <p>Kategori dağılım verisi bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Alt Kategori Analizi */}
      {kategoriVerisi?.altKategoriAnaliz && kategoriVerisi.altKategoriAnaliz.length > 0 && (
        <div className="alt-kategori-section">
          <h2>Alt Kategori Analizi</h2>
          <div className="alt-kategori-grid">
            {kategoriVerisi.altKategoriAnaliz.slice(0, 6).map((altKategori, index) => (
              <div key={index} className="alt-kategori-kart">
                <div className="alt-kategori-header">
                  <h3>{altKategori.anaKategori}</h3>
                  <span className="alt-sayi">{altKategori.altKategoriSayisi} alt kategori</span>
                </div>
                <div className="alt-kategori-detay">
                  <div className="alt-detay-item">
                    <span className="detay-label">Toplam Satış:</span>
                    <span className="detay-deger">{altKategori.toplamSatis.toFixed(2)} ₺</span>
                  </div>
                  <div className="alt-detay-item">
                    <span className="detay-label">Satış Adedi:</span>
                    <span className="detay-deger">{altKategori.satisAdedi} adet</span>
                  </div>
                  <div className="alt-detay-item">
                    <span className="detay-label">Ortalama:</span>
                    <span className="detay-deger">{altKategori.ortalamaSatis.toFixed(2)} ₺</span>
                  </div>
                </div>
                {altKategori.enCokSatanAlt && (
                  <div className="en-cok-satan-alt">
                    <span className="alt-label">En çok satan:</span>
                    <span className="alt-ad">{altKategori.enCokSatanAlt.kategoriAdi}</span>
                    <span className="alt-tutar">{altKategori.enCokSatanAlt.toplamTutar.toFixed(2)} ₺</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sabit Footer Butonları */}
      <div className="footer-fixed-buttons">
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

export default KategoriDetay;