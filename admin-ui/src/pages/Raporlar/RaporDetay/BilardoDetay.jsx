// File: admin-ui/src/pages/Raporlar/RaporDetay/BilardoDetay.jsx
import React, { useState, useEffect } from 'react';
import { useRaporFiltre } from '../../../context/RaporFiltreContext';
import localStorageService from '../../../services/localStorageService';
import TabloBilesenleri from '../components/TabloBilesenleri';
import GrafikBilesenleri from '../components/GrafikBilesenleri';
import './BilardoDetay.css';

const BilardoDetay = () => {
  const { filtreler, setFiltreler } = useRaporFiltre();
  const [bilardoVerisi, setBilardoVerisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tumBilardoMasalari, setTumBilardoMasalari] = useState([]);
  const [seciliMasa, setSeciliMasa] = useState('');

  useEffect(() => {
    const verileriYukle = async () => {
      try {
        setLoading(true);

        // Tüm bilardo masalarını al (silinenler dahil)
        const bilardoMasalari = localStorageService.get('bilardo_masalari') || [];
        const mevcutMasalar = bilardoMasalari.filter(m => m.aktif !== false);
        const silinenMasalar = bilardoMasalari.filter(m => m.aktif === false);
        
        const tumMasalar = [...mevcutMasalar, ...silinenMasalar].map(m => ({
          id: m.id,
          masaNo: m.masaNo,
          aktif: m.aktif !== false
        }));
        
        setTumBilardoMasalari(tumMasalar);

        // LocalStorage'dan gün sonu ve bilardo raporlarını çek
        const gunSonuRaporlari = localStorageService.get('mc_gunsonu_raporlar') || [];
        const bilardoAdisyonlar = localStorageService.get('bilardo_adisyonlar') || [];

        // Sadece bilardo masalarını filtrele
        const bilardoRaporlari = gunSonuRaporlari.filter(rapor =>
          rapor.masaTipi === 'bilardo' || rapor.tur === 'BİLARDO'
        );

        // Filtreleme uygula
        const filtrelenmisRaporlar = bilardoRaporlari.filter(rapor => {
          const raporTarihi = new Date(rapor.odemeTarihi || rapor.kapanisZamani);
          const baslangicTarihi = filtreler.baslangicTarihi ? new Date(filtreler.baslangicTarihi) : null;
          const bitisTarihi = filtreler.bitisTarihi ? new Date(filtreler.bitisTarihi) : null;

          let tarihUygun = true;
          if (baslangicTarihi) tarihUygun = raporTarihi >= baslangicTarihi;
          if (bitisTarihi) tarihUygun = tarihUygun && raporTarihi <= bitisTarihi;

          // Masa numarası filtresi
          if (seciliMasa && seciliMasa !== '') {
            const masaNoMatch = rapor.masaNo?.toString() === seciliMasa ||
                               rapor.masaId?.toString() === seciliMasa;
            tarihUygun = tarihUygun && masaNoMatch;
          }

          return tarihUygun;
        });

        // Bilardo raporunu hesapla
        const hesaplanmisRapor = window.raporMotoruV2.bilardoRaporuHesapla(filtrelenmisRaporlar, bilardoAdisyonlar);
        
        // Silinen masaları da dahil et
        hesaplanmisRapor.masaDurumlari = tumMasalar.map(masa => {
          const mevcutDurum = hesaplanmisRapor.masaDurumlari?.find(m => m.masaNo === masa.masaNo) || {};
          return {
            masaNo: masa.masaNo,
            durum: mevcutDurum.durum || 'BOŞ',
            acilisZamani: mevcutDurum.acilisZamani,
            gecenSure: mevcutDurum.gecenSure,
            tahminiUcret: mevcutDurum.tahminiUcret,
            sonKullanim: mevcutDurum.sonKullanim,
            aktif: masa.aktif
          };
        });

        setBilardoVerisi(hesaplanmisRapor);
        setError(null);
      } catch (err) {
        setError('Bilardo raporu yüklenirken hata oluştu: ' + err.message);
        console.error('Bilardo raporu hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    verileriYukle();
  }, [filtreler, seciliMasa]);

  const handleExportPDF = () => {
    if (bilardoVerisi) {
      // PDF export işlemi buraya gelecek
      console.log('PDF export ediliyor...');
    }
  };

  const handleMasaClick = (masa) => {
    console.log('Bilardo masa tıklandı:', masa);
  };

  const handleTarihDegis = (e) => {
    const { name, value } = e.target;
    setFiltreler(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMasaSec = (e) => {
    setSeciliMasa(e.target.value);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Bilardo raporu yükleniyor...</p>
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
    <div className="bilardo-detay">
      {/* Bilardo Raporu Başlığı */}
      <div className="detay-header">
        <div className="header-info">
          <h1>Bilardo Raporu Detayı</h1>
          <p className="tarih-araligi">
            {filtreler.baslangicTarihi && filtreler.bitisTarihi 
              ? `${new Date(filtreler.baslangicTarihi).toLocaleDateString('tr-TR')} - ${new Date(filtreler.bitisTarihi).toLocaleDateString('tr-TR')}`
              : 'Tüm Zamanlar'}
            {seciliMasa && ` • Masa ${seciliMasa}`}
          </p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="filtreler-section">
        <h2>Filtreler</h2>
        <div className="filtre-grid">
          <div className="filtre-item">
            <label htmlFor="baslangicTarihi">Başlangıç Tarihi</label>
            <input
              type="date"
              id="baslangicTarihi"
              name="baslangicTarihi"
              value={filtreler.baslangicTarihi || ''}
              onChange={handleTarihDegis}
            />
          </div>
          
          <div className="filtre-item">
            <label htmlFor="bitisTarihi">Bitiş Tarihi</label>
            <input
              type="date"
              id="bitisTarihi"
              name="bitisTarihi"
              value={filtreler.bitisTarihi || ''}
              onChange={handleTarihDegis}
            />
          </div>
          
          <div className="filtre-item">
            <label htmlFor="masaSec">Masa Seç</label>
            <select
              id="masaSec"
              value={seciliMasa}
              onChange={handleMasaSec}
            >
              <option value="">Tüm Masalar</option>
              {tumBilardoMasalari.map(masa => (
                <option key={masa.id} value={masa.masaNo}>
                  Masa {masa.masaNo} {!masa.aktif && '(Silinmiş)'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filtre-item">
            <button 
              className="btn-temizle"
              onClick={() => {
                setFiltreler({ baslangicTarihi: '', bitisTarihi: '' });
                setSeciliMasa('');
              }}
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Bilardo Özet Bilgileri */}
      <div className="bilardo-ozet">
        <div className="ozet-grid">
          <div className="ozet-kart">
            <h3>Toplam Gelir</h3>
            <p className="deger">{bilardoVerisi?.toplamGelir?.toFixed(2)} ₺</p>
            <div className="ozet-detay">
              <span>Ortalama: {(bilardoVerisi?.ortalamaGelir || 0).toFixed(2)} ₺</span>
              <span>Günlük: {(bilardoVerisi?.gunlukOrtalama || 0).toFixed(2)} ₺</span>
            </div>
          </div>
          
          <div className="ozet-kart">
            <h3>Toplam Süre</h3>
            <p className="deger">{bilardoVerisi?.toplamSaat || 0} saat</p>
            <div className="ozet-detay">
              <span>{bilardoVerisi?.toplamDakika || 0} dakika</span>
              <span>Ortalama: {(bilardoVerisi?.ortalamaSaat || 0).toFixed(1)} saat</span>
            </div>
          </div>
          
          <div className="ozet-kart">
            <h3>En Çok Gelir</h3>
            <p className="deger">
              Masa {bilardoVerisi?.enCokGelirMasa?.masaNo || '-'}
              {bilardoVerisi?.enCokGelirMasa && !bilardoVerisi.enCokGelirMasa.aktif && ' (Silinmiş)'}
            </p>
            <div className="ozet-detay">
              <span>{(bilardoVerisi?.enCokGelirMasa?.toplamGelir || 0).toFixed(2)} ₺</span>
              <span>{bilardoVerisi?.enCokGelirMasa?.kullanimSayisi || 0} kez</span>
            </div>
          </div>
          
          <div className="ozet-kart">
            <h3>En Aktif Masa</h3>
            <p className="deger">
              Masa {bilardoVerisi?.enAktifMasa?.masaNo || '-'}
              {bilardoVerisi?.enAktifMasa && !bilardoVerisi.enAktifMasa.aktif && ' (Silinmiş)'}
            </p>
            <div className="ozet-detay">
              <span>{bilardoVerisi?.enAktifMasa?.toplamSaat || 0} saat</span>
              <span>{bilardoVerisi?.enAktifMasa?.kullanimSayisi || 0} kez</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bilardo Masa Durumu */}
      <div className="masa-durum-section">
        <h2>Bilardo Masa Durumları</h2>
        <div className="masa-durum-grid">
          {bilardoVerisi?.masaDurumlari && bilardoVerisi.masaDurumlari.length > 0 ? (
            bilardoVerisi.masaDurumlari.map((masa, index) => (
              <div key={index} className={`masa-durum-kart ${masa.durum.toLowerCase()} ${!masa.aktif ? 'silinmis' : ''}`}>
                <div className="masa-durum-header">
                  <h3>Masa {masa.masaNo} {!masa.aktif && <span className="silinmis-badge">Silinmiş</span>}</h3>
                  <span className="durum-badge">{masa.durum}</span>
                </div>
                <div className="masa-durum-detay">
                  {masa.durum === 'DOLU' ? (
                    <>
                      <div className="durum-item">
                        <span className="durum-label">Başlangıç:</span>
                        <span className="durum-deger">
                          {masa.acilisZamani ? new Date(masa.acilisZamani).toLocaleTimeString('tr-TR') : '-'}
                        </span>
                      </div>
                      <div className="durum-item">
                        <span className="durum-label">Geçen Süre:</span>
                        <span className="durum-deger">{masa.gecenSure || 0} dk</span>
                      </div>
                      <div className="durum-item">
                        <span className="durum-label">Tahmini Ücret:</span>
                        <span className="durum-deger">{(masa.tahminiUcret || 0).toFixed(2)} ₺</span>
                      </div>
                    </>
                  ) : (
                    <div className="bos-masa">
                      <span className="bos-text">Masa boşta</span>
                      <span className="bos-saat">
                        Son kullanım: {masa.sonKullanim ? new Date(masa.sonKullanim).toLocaleDateString('tr-TR') : '-'}
                      </span>
                    </div>
                  )}
                </div>
                {masa.durum === 'DOLU' && (
                  <div className="masa-action">
                    <button 
                      className="action-btn"
                      onClick={() => handleMasaClick(masa)}
                    >
                      Detay Göster
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bos-veri">
              <p>Bilardo masa verisi bulunamadı.</p>
            </div>
          )}
        </div>
      </div>

      {/* Süre Tipi Dağılımı */}
      <div className="sure-dagilim-section">
        <h2>Süre Tipi Dağılımı</h2>
        <div className="sure-dagilim-grid">
          <div className="sure-kart">
            <div className="sure-header">
              <h3>30 Dakika</h3>
              <span className="sure-icon">⏱️</span>
            </div>
            <div className="sure-detay">
              <p className="sure-sayi">{bilardoVerisi?.sure30dkSayisi || 0}</p>
              <p className="sure-yuzde">
                %{bilardoVerisi?.sure30dkYuzde || 0}
              </p>
              <p className="sure-tutar">
                {(bilardoVerisi?.sure30dkGelir || 0).toFixed(2)} ₺
              </p>
            </div>
          </div>
          
          <div className="sure-kart">
            <div className="sure-header">
              <h3>1 Saat</h3>
              <span className="sure-icon">⏰</span>
            </div>
            <div className="sure-detay">
              <p className="sure-sayi">{bilardoVerisi?.sure1saatSayisi || 0}</p>
              <p className="sure-yuzde">
                %{bilardoVerisi?.sure1saatYuzde || 0}
              </p>
              <p className="sure-tutar">
                {(bilardoVerisi?.sure1saatGelir || 0).toFixed(2)} ₺
              </p>
            </div>
          </div>
          
          <div className="sure-kart">
            <div className="sure-header">
              <h3>Süresiz</h3>
              <span className="sure-icon">∞</span>
            </div>
            <div className="sure-detay">
              <p className="sure-sayi">{bilardoVerisi?.sureDakikaSayisi || 0}</p>
              <p className="sure-yuzde">
                %{bilardoVerisi?.sureDakikaYuzde || 0}
              </p>
              <p className="sure-tutar">
                {(bilardoVerisi?.sureDakikaGelir || 0).toFixed(2)} ₺
              </p>
            </div>
          </div>
          
          <div className="sure-kart">
            <div className="sure-header">
              <h3>Toplam</h3>
              <span className="sure-icon">💰</span>
            </div>
            <div className="sure-detay">
              <p className="sure-sayi">{bilardoVerisi?.toplamOyun || 0}</p>
              <p className="sure-yuzde">100%</p>
              <p className="sure-tutar">
                {(bilardoVerisi?.toplamGelir || 0).toFixed(2)} ₺
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Günlük Bilardo Geliri */}
      <div className="gunluk-gelir-section">
        <h2>Günlük Bilardo Geliri</h2>
        {bilardoVerisi?.gunlukGelirler && bilardoVerisi.gunlukGelirler.length > 0 ? (
          <GrafikBilesenleri.GunlukGelirCizgi data={bilardoVerisi.gunlukGelirler} />
        ) : (
          <div className="bos-veri">
            <p>Günlük gelir verisi bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Bilardo Masa Performans Tablosu */}
      <div className="masa-performans-section">
        <h2>Bilardo Masa Performansı</h2>
        {bilardoVerisi?.masaPerformanslari && bilardoVerisi.masaPerformanslari.length > 0 ? (
          <TabloBilesenleri.BasitTablosu
            columns={[
              { key: 'masaNo', header: 'Masa No', type: 'text' },
              { key: 'kullanimSayisi', header: 'Kullanım Sayısı', type: 'number' },
              { key: 'toplamSaat', header: 'Toplam Süre', type: 'text' },
              { key: 'toplamGelir', header: 'Toplam Gelir', type: 'currency' },
              { key: 'ortalamaSaat', header: 'Ort. Süre', type: 'text' },
              { key: 'ortalamaGelir', header: 'Ort. Gelir', type: 'currency' },
              { key: 'sonKullanim', header: 'Son Kullanım', type: 'datetime' }
            ]}
            data={bilardoVerisi.masaPerformanslari}
            title=""
          />
        ) : (
          <div className="bos-veri">
            <p>Masa performans verisi bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Saatlik Kullanım Analizi */}
      <div className="saatlik-analiz-section">
        <h2>Saatlik Kullanım Analizi</h2>
        <div className="saatlik-grid">
          {bilardoVerisi?.saatlikKullanim && bilardoVerisi.saatlikKullanim.length > 0 ? (
            bilardoVerisi.saatlikKullanim.map((saat, index) => (
              <div key={index} className="saatlik-kart">
                <div className="saatlik-header">
                  <h3>{saat.saat}:00 - {saat.saat}:59</h3>
                </div>
                <div className="saatlik-detay">
                  <div className="saatlik-item">
                    <span className="saatlik-label">Kullanım</span>
                    <span className="saatlik-deger">{saat.kullanimSayisi} kez</span>
                  </div>
                  <div className="saatlik-item">
                    <span className="saatlik-label">Gelir</span>
                    <span className="saatlik-deger">{saat.toplamGelir.toFixed(2)} ₺</span>
                  </div>
                  <div className="saatlik-item">
                    <span className="saatlik-label">Ortalama</span>
                    <span className="saatlik-deger">{saat.ortalamaGelir.toFixed(2)} ₺</span>
                  </div>
                </div>
                <div className="saatlik-bar">
                  <div 
                    className="saatlik-dolum"
                    style={{ 
                      width: `${bilardoVerisi.maxKullanim > 0 ? (saat.kullanimSayisi / bilardoVerisi.maxKullanim) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <div className="bos-veri">
              <p>Saatlik kullanım verisi bulunamadı.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sabit PDF ve Yazdır Butonları */}
      <div className="sabit-butonlar">
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

export default BilardoDetay;