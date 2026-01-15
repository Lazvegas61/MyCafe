// File: admin-ui/src/pages/Raporlar/RaporDetay/UrunDetay.jsx
import React, { useState, useEffect } from 'react';
import { useRaporFiltre } from '../../../context/RaporFiltreContext';
import localStorageService from '../../../services/localStorageService';
import { raporMotoruV2 } from '../../../services/raporMotoruV2';
import TabloBilesenleri from '../components/TabloBilesenleri';
import GrafikBilesenleri from '../components/GrafikBilesenleri';
import './UrunDetay.css';

const UrunDetay = () => {
  const { filtreler, setFiltreler } = useRaporFiltre();
  const [urunVerisi, setUrunVerisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kategoriler, setKategoriler] = useState([]);
  const [urunler, setUrunler] = useState([]);

  // Kategorileri yükle
  useEffect(() => {
    const kategorileriYukle = () => {
      const kategoriListesi = localStorageService.get('mc_kategoriler') || [];
      setKategoriler(kategoriListesi);
    };

    // Ürünleri yükle
    const urunleriYukle = () => {
      const urunListesi = localStorageService.get('mc_urunler') || [];
      setUrunler(urunListesi);
    };

    kategorileriYukle();
    urunleriYukle();
  }, []);

  // Verileri yükle
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
          
          // Kategori filtresi
          const kategoriUygun = !filtreler.kategoriId || 
            rapor.urunler?.some(urun => urun.categoryId === filtreler.kategoriId);
          
          // Ürün filtresi
          const urunUygun = !filtreler.urunId || 
            rapor.urunler?.some(urun => urun.productId === filtreler.urunId);
          
          return tarihUygun && kategoriUygun && urunUygun;
        });

        // Ürün raporunu hesapla
        const hesaplanmisRapor = raporMotoruV2.urunRaporuHesapla(filtrelenmisRaporlar);
        
        setUrunVerisi(hesaplanmisRapor);
        setError(null);
      } catch (err) {
        setError('Ürün raporu yüklenirken hata oluştu: ' + err.message);
        console.error('Ürün raporu hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    verileriYukle();
  }, [filtreler]);

  // Tarih değişikliği
  const handleTarihDegisikligi = (e, tip) => {
    const yeniFiltreler = { ...filtreler };
    if (tip === 'baslangic') {
      yeniFiltreler.baslangicTarihi = e.target.value;
    } else {
      yeniFiltreler.bitisTarihi = e.target.value;
    }
    setFiltreler(yeniFiltreler);
  };

  // Kategori değişikliği
  const handleKategoriDegisikligi = (e) => {
    const yeniFiltreler = { ...filtreler };
    yeniFiltreler.kategoriId = e.target.value || null;
    // Kategori değiştiğinde ürün filtresini sıfırla
    yeniFiltreler.urunId = null;
    setFiltreler(yeniFiltreler);
  };

  // Ürün değişikliği
  const handleUrunDegisikligi = (e) => {
    const yeniFiltreler = { ...filtreler };
    yeniFiltreler.urunId = e.target.value || null;
    setFiltreler(yeniFiltreler);
  };

  // Filtreleri temizle
  const handleFiltreleriTemizle = () => {
    setFiltreler({
      baslangicTarihi: null,
      bitisTarihi: null,
      kategoriId: null,
      urunId: null
    });
  };

  const handleExportPDF = () => {
    if (urunVerisi) {
      // PDF export işlemi
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Ürün raporu yükleniyor...</p>
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
    <div className="urun-detay">
      <div className="detay-header">
        <div className="header-info">
          <h1>Ürün Raporu Detayı</h1>
          <p className="tarih-araligi">
            {filtreler.baslangicTarihi && filtreler.bitisTarihi 
              ? `${new Date(filtreler.baslangicTarihi).toLocaleDateString('tr-TR')} - ${new Date(filtreler.bitisTarihi).toLocaleDateString('tr-TR')}`
              : 'Tüm Zamanlar'}
          </p>
        </div>
      </div>

      {/* Filtre Bölümü */}
      <div className="filtre-section">
        <div className="filtre-grid">
          {/* Tarih Filtreleri */}
          <div className="filtre-grup">
            <label>Başlangıç Tarihi</label>
            <input
              type="date"
              value={filtreler.baslangicTarihi || ''}
              onChange={(e) => handleTarihDegisikligi(e, 'baslangic')}
              className="filtre-input"
            />
          </div>
          
          <div className="filtre-grup">
            <label>Bitiş Tarihi</label>
            <input
              type="date"
              value={filtreler.bitisTarihi || ''}
              onChange={(e) => handleTarihDegisikligi(e, 'bitis')}
              className="filtre-input"
            />
          </div>
          
          {/* Kategori Filtresi */}
          <div className="filtre-grup">
            <label>Kategori</label>
            <select
              value={filtreler.kategoriId || ''}
              onChange={handleKategoriDegisikligi}
              className="filtre-input"
            >
              <option value="">Tüm Kategoriler</option>
              {kategoriler.map((kategori) => (
                <option key={kategori.id} value={kategori.id}>
                  {kategori.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Ürün Filtresi */}
          <div className="filtre-grup">
            <label>Ürün</label>
            <select
              value={filtreler.urunId || ''}
              onChange={handleUrunDegisikligi}
              className="filtre-input"
              disabled={!urunler.length}
            >
              <option value="">Tüm Ürünler</option>
              {filtreler.kategoriId
                ? urunler
                    .filter(urun => urun.categoryId === filtreler.kategoriId)
                    .map((urun) => (
                      <option key={urun.id} value={urun.id}>
                        {urun.name}
                      </option>
                    ))
                : urunler.map((urun) => (
                    <option key={urun.id} value={urun.id}>
                      {urun.name}
                    </option>
                  ))}
            </select>
          </div>
          
          {/* Filtre Temizle Butonu */}
          <div className="filtre-grup">
            <label>&nbsp;</label>
            <button 
              onClick={handleFiltreleriTemizle}
              className="filtre-temizle-btn"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
        
        {/* Aktif Filtre Bilgisi */}
        <div className="aktif-filtreler">
          {filtreler.kategoriId && (
            <span className="filtre-etiket">
              Kategori: {kategoriler.find(k => k.id === filtreler.kategoriId)?.name || ''}
              <button onClick={() => handleKategoriDegisikligi({ target: { value: '' } })}>×</button>
            </span>
          )}
          
          {filtreler.urunId && (
            <span className="filtre-etiket">
              Ürün: {urunler.find(u => u.id === filtreler.urunId)?.name || ''}
              <button onClick={() => handleUrunDegisikligi({ target: { value: '' } })}>×</button>
            </span>
          )}
          
          {filtreler.baslangicTarihi && (
            <span className="filtre-etiket">
              Başlangıç: {new Date(filtreler.baslangicTarihi).toLocaleDateString('tr-TR')}
              <button onClick={() => handleTarihDegisikligi({ target: { value: '' } }, 'baslangic')}>×</button>
            </span>
          )}
          
          {filtreler.bitisTarihi && (
            <span className="filtre-etiket">
              Bitiş: {new Date(filtreler.bitisTarihi).toLocaleDateString('tr-TR')}
              <button onClick={() => handleTarihDegisikligi({ target: { value: '' } }, 'bitis')}>×</button>
            </span>
          )}
        </div>
      </div>

      {/* Ürün Özet Bilgileri */}
      <div className="urun-ozet">
        <div className="ozet-grid">
          <div className="ozet-kart">
            <h3>Toplam Satış</h3>
            <p className="deger">{urunVerisi?.toplamSatis?.toFixed(2)} ₺</p>
            <div className="ozet-detay">
              <span>{urunVerisi?.toplamUrunSayisi || 0} farklı ürün</span>
              <span>{urunVerisi?.toplamAdet || 0} toplam adet</span>
            </div>
          </div>
          
          <div className="ozet-kart">
            <h3>Ortalama Satış</h3>
            <p className="deger">{urunVerisi?.ortalamaSatis?.toFixed(2)} ₺</p>
            <div className="ozet-detay">
              <span>Ürün başı ortalama</span>
              <span>Günlük: {(urunVerisi?.ortalamaSatis || 0).toFixed(2)} ₺</span>
            </div>
          </div>
          
          <div className="ozet-kart">
            <h3>Toplam Kar</h3>
            <p className="deger">{urunVerisi?.toplamKar?.toFixed(2)} ₺</p>
            <div className="ozet-detay">
              <span>Kar Oranı: %{urunVerisi?.karOrani?.toFixed(1)}</span>
              <span>Ort. Kar: {(urunVerisi?.ortalamaKar || 0).toFixed(2)} ₺</span>
            </div>
          </div>
          
          <div className="ozet-kart">
            <h3>En Çok Satan</h3>
            <p className="deger">
              {urunVerisi?.enCokSatanUrun?.urunAdi?.substring(0, 20) || '-'}
              {urunVerisi?.enCokSatanUrun?.urunAdi?.length > 20 ? '...' : ''}
            </p>
            <div className="ozet-detay">
              <span>{urunVerisi?.enCokSatanUrun?.satisAdedi || 0} adet</span>
              <span>{urunVerisi?.enCokSatanUrun?.toplamTutar?.toFixed(2) || 0} ₺</span>
            </div>
          </div>
        </div>
      </div>

      {/* En Çok Satan Ürünler Tablosu */}
      <div className="urun-section">
        <h2>En Çok Satan Ürünler (İlk 20)</h2>
        {urunVerisi?.enCokSatanUrunler && urunVerisi.enCokSatanUrunler.length > 0 ? (
          <TabloBilesenleri.UrunListesiTablosu 
            data={urunVerisi.enCokSatanUrunler.slice(0, 20)}
            title=""
          />
        ) : (
          <div className="bos-veri">
            <p>Seçilen filtrelerle ilgili satış verisi bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Kar/Zarar Grafiği */}
      <div className="grafik-section">
        <h2>Ürün Bazlı Kar Analizi</h2>
        {urunVerisi?.urunKarListesi && urunVerisi.urunKarListesi.length > 0 ? (
          <GrafikBilesenleri.UrunSatisKar 
            data={urunVerisi.urunKarListesi.slice(0, 10)}
          />
        ) : (
          <div className="bos-veri">
            <p>Kar analizi verisi bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Kategori Bazlı Satışlar */}
      {urunVerisi?.kategoriSatislari && urunVerisi.kategoriSatislari.length > 0 && (
        <div className="kategori-section">
          <h2>Kategori Bazlı Satış Dağılımı</h2>
          <GrafikBilesenleri.KategoriDagilimYatay 
            data={urunVerisi.kategoriSatislari.slice(0, 10)}
          />
        </div>
      )}

      {/* PDF ve Yazdır Butonları - SAYFANIN ALT SAĞ KÖŞESİ */}
      <div className="action-buttons-bottom">
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

export default UrunDetay;