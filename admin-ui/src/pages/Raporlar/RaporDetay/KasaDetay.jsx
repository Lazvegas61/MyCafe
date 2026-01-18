// File: admin-ui/src/pages/Raporlar/RaporDetay/KasaDetay.jsx
import React, { useState, useEffect } from 'react';
import { useRaporFiltre } from '../../../context/RaporFiltreContext';
import localStorageService from '../../../services/localStorageService';
import TabloBilesenleri from '../components/TabloBilesenleri';
import GrafikBilesenleri from '../components/GrafikBilesenleri';
import './KasaDetay.css';

const KasaDetay = () => {
  const { filtreler } = useRaporFiltre();
  const [kasaVerisi, setKasaVerisi] = useState(null);
  const [hareketler, setHareketler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verileriYukle = async () => {
      try {
        setLoading(true);

        // ✅ ZORUNLU KORUMA — TAM OLARAK BURAYA EKLENDİ
        if (
          !window.raporMotoruV2 ||
          typeof window.raporMotoruV2.kasaRaporuHesapla !== 'function'
        ) {
          throw new Error('Rapor motoru hazır değil (kasa)');
        }

        // LocalStorage'dan gün sonu raporlarını çek
        const gunSonuRaporlari =
          localStorageService.get('mycafe_gun_sonu_raporlar') || [];

        // Filtreleme uygula
        const filtrelenmisRaporlari = gunSonuRaporlari.filter(rapor => {
          const raporTarihi = new Date(rapor.odemeTarihi || rapor.kapanisZamani || rapor.bitis);
          const baslangicTarihi = filtreler.baslangicTarihi
            ? new Date(filtreler.baslangicTarihi)
            : null;
          const bitisTarihi = filtreler.bitisTarihi
            ? new Date(filtreler.bitisTarihi)
            : null;

          let tarihUygun = true;
          if (baslangicTarihi) tarihUygun = raporTarihi >= baslangicTarihi;
          if (bitisTarihi) tarihUygun = tarihUygun && raporTarihi <= bitisTarihi;

          return tarihUygun;
        });

        // Kasa raporunu hesapla
        const hesaplanmisRapor =
          window.raporMotoruV2.kasaRaporuHesapla(filtrelenmisRaporlari);

        // ✅ GİDER HESAPLAMASI - TEK YERDE!
        // NOT: giderler ve filtrelenmisGiderler değişkenleri burada tanımlandı
        const giderlerListesi = localStorageService.get('mc_giderler') || [];
        const filtrelenmisGiderListesi = giderlerListesi.filter(gider => {
          const giderTarihi = new Date(gider.tarih);
          const baslangicTarihi = filtreler.baslangicTarihi ? new Date(filtreler.baslangicTarihi) : null;
          const bitisTarihi = filtreler.bitisTarihi ? new Date(filtreler.bitisTarihi) : null;
          
          let tarihUygun = true;
          if (baslangicTarihi) tarihUygun = giderTarihi >= baslangicTarihi;
          if (bitisTarihi) tarihUygun = tarihUygun && giderTarihi <= bitisTarihi;
          
          return tarihUygun;
        });

        // Gider toplamını hesapla ve rapora ekle
        const giderToplam = filtrelenmisGiderListesi.reduce((sum, gider) => 
          sum + parseFloat(gider.tutar || 0), 0);

        // Raporu güncelle
        hesaplanmisRapor.toplamGider = giderToplam;
        hesaplanmisRapor.giderSayisi = filtrelenmisGiderListesi.length;
        hesaplanmisRapor.netKasa = hesaplanmisRapor.toplamGelir - giderToplam;

        // ✅ Günlük gelirler güncellenmiş mi kontrol et
        if (!hesaplanmisRapor.gunlukGelirler || hesaplanmisRapor.gunlukGelirler.length === 0) {
          // Günlük gelirleri hesapla
          const gunlukGelirler = {};
          filtrelenmisRaporlari.forEach(rapor => {
            const tarih = rapor.tarih || new Date(rapor.bitis).toISOString().split('T')[0];
            const gunlukToplam = 
              parseFloat(rapor.kasa?.nakit || rapor.nakitOdeme || 0) +
              parseFloat(rapor.kasa?.kart || rapor.kartOdeme || 0) +
              parseFloat(rapor.kasa?.hesabaYaz || rapor.hesapOdeme || 0);
            
            gunlukGelirler[tarih] = (gunlukGelirler[tarih] || 0) + gunlukToplam;
          });

          hesaplanmisRapor.gunlukGelirler = Object.entries(gunlukGelirler)
            .map(([tarih, tutar]) => ({ tarih, tutar }))
            .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
        }

        // Kasa hareketlerini oluştur
        const kasaHareketleri = filtrelenmisRaporlari.flatMap(rapor => {
          const hareketler = [];

          // Nakit ödeme varsa
          const nakitOdeme = parseFloat(rapor.kasa?.nakit || rapor.nakitOdeme || 0);
          if (nakitOdeme > 0) {
            hareketler.push({
              id: `${rapor.id}-nakit`,
              tarih: rapor.odemeTarihi || rapor.kapanisZamani || rapor.bitis,
              tip: 'GELIR',
              aciklama: `Masa ${rapor.masaNo || rapor.masaNum || '?'} - Nakit Ödeme`,
              masaNo: rapor.masaNo || rapor.masaNum || '?',
              adisyonId: rapor.id,
              nakit: nakitOdeme,
              kart: 0,
              hesap: 0
            });
          }

          // Kart ödeme varsa
          const kartOdeme = parseFloat(rapor.kasa?.kart || rapor.kartOdeme || 0);
          if (kartOdeme > 0) {
            hareketler.push({
              id: `${rapor.id}-kart`,
              tarih: rapor.odemeTarihi || rapor.kapanisZamani || rapor.bitis,
              tip: 'GELIR',
              aciklama: `Masa ${rapor.masaNo || rapor.masaNum || '?'} - Kart Ödeme`,
              masaNo: rapor.masaNo || rapor.masaNum || '?',
              adisyonId: rapor.id,
              nakit: 0,
              kart: kartOdeme,
              hesap: 0
            });
          }

          // Hesap ödeme varsa
          const hesapOdeme = parseFloat(rapor.kasa?.hesabaYaz || rapor.hesapOdeme || 0);
          if (hesapOdeme > 0) {
            hareketler.push({
              id: `${rapor.id}-hesap`,
              tarih: rapor.odemeTarihi || rapor.kapanisZamani || rapor.bitis,
              tip: 'GELIR',
              aciklama: `Masa ${rapor.masaNo || rapor.masaNum || '?'} - Hesaba Yaz`,
              masaNo: rapor.masaNo || rapor.masaNum || '?',
              adisyonId: rapor.id,
              nakit: 0,
              kart: 0,
              hesap: hesapOdeme
            });
          }

          return hareketler;
        });

        // ✅ GİDER HAREKETLERİNİ OLUŞTUR
        const giderHareketleri = filtrelenmisGiderListesi.map(gider => ({
          id: `gider-${gider.id}`,
          tarih: gider.tarih,
          tip: 'GIDER',
          aciklama: gider.aciklama || 'Gider',
          nakit: parseFloat(gider.tutar || 0),
          kart: 0,
          hesap: 0
        }));

        const tumHareketler = [...kasaHareketleri, ...giderHareketleri]
          .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));

        setKasaVerisi(hesaplanmisRapor);
        setHareketler(tumHareketler);
        setError(null);
      } catch (err) {
        setError('Kasa raporu yüklenirken hata oluştu: ' + err.message);
        console.error('Kasa raporu hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    verileriYukle();
  }, [filtreler]);

  const handleExportPDF = () => {
    if (kasaVerisi && hareketler.length > 0) {
      // PDF export logic here
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Kasa raporu yükleniyor...</p>
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
    <div className="kasa-detay">
      <div className="detay-header">
        <div className="header-info">
          <h1>Kasa Raporu Detayı</h1>
          <p className="tarih-araligi">
            {filtreler.baslangicTarihi && filtreler.bitisTarihi 
              ? `${new Date(filtreler.baslangicTarihi).toLocaleDateString('tr-TR')} - ${new Date(filtreler.bitisTarihi).toLocaleDateString('tr-TR')}`
              : 'Tüm Zamanlar'}
          </p>
        </div>
        
        <div className="export-buttons">
          <button className="btn-pdf" onClick={handleExportPDF}>
            📄 PDF İndir
          </button>
          <button className="btn-print" onClick={() => window.print()}>
            🖨️ Yazdır
          </button>
        </div>
      </div>

      {/* Kasa Özet Bilgileri */}
      <div className="kasa-ozet">
        <div className="ozet-grid">
          <div className="ozet-kart gelir">
            <h3>Toplam Gelir</h3>
            <p className="deger">{kasaVerisi?.toplamGelir?.toFixed(2)} ₺</p>
            <div className="ozet-detay">
              <span>Nakit: {kasaVerisi?.nakitGelir?.toFixed(2)} ₺</span>
              <span>Kart: {kasaVerisi?.kartGelir?.toFixed(2)} ₺</span>
              <span>Hesap: {kasaVerisi?.hesapGelir?.toFixed(2)} ₺</span>
            </div>
          </div>
          
          <div className="ozet-kart gider">
            <h3>Toplam Gider</h3>
            <p className="deger">{kasaVerisi?.toplamGider?.toFixed(2)} ₺</p>
            <div className="ozet-detay">
              <span>{kasaVerisi?.giderSayisi || 0} gider kaydı</span>
            </div>
          </div>
          
          <div className="ozet-kart net">
            <h3>Net Kasa</h3>
            <p className="deger">{kasaVerisi?.netKasa?.toFixed(2)} ₺</p>
            <div className="ozet-detay">
              <span>Gelir - Gider</span>
            </div>
          </div>
          
          <div className="ozet-kart ortalama">
            <h3>Ortalama Gelir</h3>
            <p className="deger">{kasaVerisi?.ortalamaGelir?.toFixed(2)} ₺</p>
            <div className="ozet-detay">
              <span>{kasaVerisi?.gunSayisi || 0} günlük ortalama</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ödeme Dağılımı */}
      <div className="grafik-section">
        <h2>Ödeme Yöntemi Dağılımı</h2>
        {kasaVerisi?.odemeDagilimi && (
          <GrafikBilesenleri.OdemeDagilimDonut data={kasaVerisi.odemeDagilimi} />
        )}
      </div>

      {/* Günlük Gelir Grafiği */}
      <div className="grafik-section">
        <h2>Günlük Gelir Takibi</h2>
        {kasaVerisi?.gunlukGelirler && (
          <GrafikBilesenleri.GunlukGelirCizgi data={kasaVerisi.gunlukGelirler} />
        )}
      </div>

      {/* Kasa Hareketleri Tablosu */}
      <div className="hareketler-section">
        <div className="section-header">
          <h2>Kasa Hareketleri</h2>
          <span className="kayit-sayisi">
            {hareketler.length} kayıt
          </span>
        </div>
        <TabloBilesenleri.KasaHareketleriTablosu data={hareketler} />
      </div>

      {/* Ödeme Tipi Özeti */}
      <div className="odeme-ozet">
        <h2>Ödeme Tipi Özeti</h2>
        <div className="odeme-grid">
          <div className="odeme-kart nakit">
            <h3>Nakit</h3>
            <p className="tutar">{kasaVerisi?.nakitGelir?.toFixed(2)} ₺</p>
            <p className="yuzde">
              {kasaVerisi?.toplamGelir > 0 
                ? ((kasaVerisi.nakitGelir / kasaVerisi.toplamGelir) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
          <div className="odeme-kart kart">
            <h3>Kart</h3>
            <p className="tutar">{kasaVerisi?.kartGelir?.toFixed(2)} ₺</p>
            <p className="yuzde">
              {kasaVerisi?.toplamGelir > 0 
                ? ((kasaVerisi.kartGelir / kasaVerisi.toplamGelir) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
          <div className="odeme-kart hesap">
            <h3>Hesap</h3>
            <p className="tutar">{kasaVerisi?.hesapGelir?.toFixed(2)} ₺</p>
            <p className="yuzde">
              {kasaVerisi?.toplamGelir > 0 
                ? ((kasaVerisi.hesapGelir / kasaVerisi.toplamGelir) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KasaDetay;