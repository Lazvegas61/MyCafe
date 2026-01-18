// File: admin-ui/src/pages/Raporlar/RaporDetay/GiderDetay.jsx
import React, { useState, useEffect } from 'react';
import { useRaporFiltre } from '../../../context/RaporFiltreContext';
import localStorageService from '../../../services/localStorageService';
import TabloBilesenleri from '../components/TabloBilesenleri';
import GrafikBilesenleri from '../components/GrafikBilesenleri';
import './GiderDetay.css';

const GiderDetay = () => {
  const { filtreler, setFiltreler } = useRaporFiltre();
  const [giderVerisi, setGiderVerisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localFiltreler, setLocalFiltreler] = useState({
    baslangicTarihi: '',
    bitisTarihi: '',
    giderTipi: ''
  });
  const [sonGiderler, setSonGiderler] = useState([]);

  // Mevcut gider tiplerini al
  const [giderTipleri, setGiderTipleri] = useState([]);

  useEffect(() => {
    // LocalStorage'dan gider tiplerini al
    const giderler = localStorageService.get('mc_giderler') || [];
    const tipler = [...new Set(giderler.map(g => g.tip).filter(Boolean))];
    setGiderTipleri(tipler);
    
    // Son 5 gideri al
    const sonGiderlerSorted = [...giderler]
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih))
      .slice(0, 5);
    setSonGiderler(sonGiderlerSorted);
    
    setLocalFiltreler({
      baslangicTarihi: filtreler.baslangicTarihi || '',
      bitisTarihi: filtreler.bitisTarihi || '',
      giderTipi: filtreler.giderTipi || ''
    });
  }, [filtreler]);

  useEffect(() => {
    const verileriYukle = async () => {
      try {
        setLoading(true);
        
        // LocalStorage'dan giderleri çek
        const giderler = localStorageService.get('mc_giderler') || [];
        
        // Filtreleme uygula
        const filtrelenmisGiderler = giderler.filter(gider => {
          // Tarih filtresi
          if (filtreler.baslangicTarihi || filtreler.bitisTarihi) {
            const giderTarihi = new Date(gider.tarih);
            const baslangicTarihi = filtreler.baslangicTarihi ? new Date(filtreler.baslangicTarihi) : null;
            const bitisTarihi = filtreler.bitisTarihi ? new Date(filtreler.bitisTarihi) : null;
            
            let tarihUygun = true;
            if (baslangicTarihi) {
              const giderTarihiOnly = new Date(giderTarihi.getFullYear(), giderTarihi.getMonth(), giderTarihi.getDate());
              const baslangicTarihiOnly = new Date(baslangicTarihi.getFullYear(), baslangicTarihi.getMonth(), baslangicTarihi.getDate());
              tarihUygun = giderTarihiOnly >= baslangicTarihiOnly;
            }
            
            if (bitisTarihi) {
              const giderTarihiOnly = new Date(giderTarihi.getFullYear(), giderTarihi.getMonth(), giderTarihi.getDate());
              const bitisTarihiOnly = new Date(bitisTarihi.getFullYear(), bitisTarihi.getMonth(), bitisTarihi.getDate());
              tarihUygun = tarihUygun && giderTarihiOnly <= bitisTarihiOnly;
            }
            
            if (!tarihUygun) return false;
          }
          
          // Gider tipi filtresi
          if (filtreler.giderTipi && gider.tip !== filtreler.giderTipi) {
            return false;
          }
          
          return true;
        });

        // Gider raporunu hesapla
        const hesaplanmisRapor = window.raporMotoruV2.giderRaporuHesapla(filtrelenmisGiderler);
        
        setGiderVerisi(hesaplanmisRapor);
        setError(null);
      } catch (err) {
        setError('Gider raporu yüklenirken hata oluştu: ' + err.message);
        console.error('Gider raporu hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    verileriYukle();
  }, [filtreler]);

  const handleFiltreUygula = () => {
    setFiltreler({
      ...filtreler,
      baslangicTarihi: localFiltreler.baslangicTarihi,
      bitisTarihi: localFiltreler.bitisTarihi,
      giderTipi: localFiltreler.giderTipi
    });
  };

  const handleFiltreTemizle = () => {
    const temizlenmis = {
      baslangicTarihi: '',
      bitisTarihi: '',
      giderTipi: ''
    };
    setLocalFiltreler(temizlenmis);
    setFiltreler({
      ...filtreler,
      ...temizlenmis
    });
  };

  const handleExportPDF = () => {
    if (giderVerisi) {
      const raporTarihi = new Date().toLocaleDateString('tr-TR');
      const raporBaslik = `Gider Raporu - ${raporTarihi}`;
      alert(`${raporBaslik}\n\nPDF indirme özelliği yakında eklenecek!`);
    }
  };

  // Format currency
  const formatPara = (tutar) => {
    return tutar ? tutar.toFixed(2).replace('.', ',') + ' ₺' : '0,00 ₺';
  };

  // Format tarih
  const formatTarih = (tarih) => {
    if (!tarih) return '-';
    return new Date(tarih).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Gider raporu yükleniyor...</p>
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
    <div className="gider-detay">
      {/* HEADER - Üstte Tam Genişlik */}
      <div className="detay-header">
        <div className="header-info">
          <h1>Gider Raporu Detayı</h1>
          <p className="tarih-araligi">
            {filtreler.baslangicTarihi && filtreler.bitisTarihi 
              ? `${formatTarih(filtreler.baslangicTarihi)} - ${formatTarih(filtreler.bitisTarihi)}`
              : 'Tüm Zamanlar'}
          </p>
          {filtreler.giderTipi && (
            <p className="filtre-bilgi">
              Gider Tipi: {giderTipleri.find(t => t === filtreler.giderTipi) || filtreler.giderTipi}
            </p>
          )}
        </div>
      </div>

      {/* SOL SÜTUN - FİLTRELER */}
      <div className="filtre-section">
        <h2>Rapor Filtreleri</h2>
        <div className="filtre-grup">
          <label htmlFor="baslangicTarihi">Başlangıç Tarihi</label>
          <input 
            type="date" 
            id="baslangicTarihi"
            value={localFiltreler.baslangicTarihi}
            onChange={(e) => setLocalFiltreler({...localFiltreler, baslangicTarihi: e.target.value})}
            max={localFiltreler.bitisTarihi || undefined}
          />
        </div>
        
        <div className="filtre-grup">
          <label htmlFor="bitisTarihi">Bitiş Tarihi</label>
          <input 
            type="date" 
            id="bitisTarihi"
            value={localFiltreler.bitisTarihi}
            onChange={(e) => setLocalFiltreler({...localFiltreler, bitisTarihi: e.target.value})}
            min={localFiltreler.baslangicTarihi || undefined}
          />
        </div>
        
        <div className="filtre-grup">
          <label htmlFor="giderTipi">Gider Tipi</label>
          <select 
            id="giderTipi"
            value={localFiltreler.giderTipi}
            onChange={(e) => setLocalFiltreler({...localFiltreler, giderTipi: e.target.value})}
          >
            <option value="">Tüm Gider Tipleri</option>
            {giderTipleri.map((tip, index) => (
              <option key={index} value={tip}>{tip}</option>
            ))}
          </select>
        </div>
        
        <div className="filtre-actions">
          <button className="btn-filtre-uygula" onClick={handleFiltreUygula}>
            Filtreleri Uygula
          </button>
          <button className="btn-filtre-temizle" onClick={handleFiltreTemizle}>
            Filtreleri Temizle
          </button>
        </div>
      </div>

      {/* ORTA SÜTUN - ÖZET, GRAFİK, LİSTE */}
      <div className="orta-sutun">
        {/* ÖZET KARTLARI */}
        <div className="gider-ozet">
          <div className="ozet-grid">
            <div className="ozet-kart">
              <h3>TOPLAM GİDER</h3>
              <p className="deger">{formatPara(giderVerisi?.toplamGider || 0)}</p>
              <div className="ozet-detay">
                <span>{giderVerisi?.toplamKayit || 0} kayıt</span>
                <span>Ortalama: {formatPara(giderVerisi?.ortalamaGider || 0)}</span>
              </div>
            </div>
            
            <div className="ozet-kart">
              <h3>GÜNLÜK ORTALAMA</h3>
              <p className="deger">{formatPara(giderVerisi?.gunlukOrtalama || 0)}</p>
              <div className="ozet-detay">
                <span>{giderVerisi?.gunSayisi || 0} gün</span>
                <span>Günlük ortalama</span>
              </div>
            </div>
            
            <div className="ozet-kart">
              <h3>EN YÜKSEK GİDER</h3>
              <p className="deger">
                {giderVerisi?.enYuksekGider?.aciklama?.substring(0, 18) || '-'}
                {giderVerisi?.enYuksekGider?.aciklama?.length > 18 ? '...' : ''}
              </p>
              <div className="ozet-detay">
                <span>{formatPara(giderVerisi?.enYuksekGider?.tutar || 0)}</span>
                <span>{formatTarih(giderVerisi?.enYuksekGider?.tarih)}</span>
              </div>
            </div>
            
            <div className="ozet-kart">
              <h3>EN ÇOK GİDER TİPİ</h3>
              <p className="deger">
                {giderVerisi?.enCokGiderTipi?.tip?.substring(0, 15) || '-'}
                {giderVerisi?.enCokGiderTipi?.tip?.length > 15 ? '...' : ''}
              </p>
              <div className="ozet-detay">
                <span>{formatPara(giderVerisi?.enCokGiderTipi?.toplam || 0)}</span>
                <span>{giderVerisi?.enCokGiderTipi?.sayi || 0} kayıt</span>
              </div>
            </div>
          </div>
        </div>

        {/* GİDER TİPİ DAĞILIMI */}
        <div className="gider-tip-dagilim">
          <h2>Gider Tipi Dağılımı</h2>
          {giderVerisi?.giderTipleri && giderVerisi.giderTipleri.length > 0 ? (
            <div className="gider-tip-grid">
              {giderVerisi.giderTipleri.map((tip, index) => (
                <div key={index} className="gider-tip-kart">
                  <div className="tip-header">
                    <h3>{tip.ad}</h3>
                    <span className="tip-yuzde">
                      {giderVerisi.toplamGider > 0 
                        ? ((tip.toplam / giderVerisi.toplamGider) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="tip-detay">
                    <p className="tip-tutar">{formatPara(tip.toplam)}</p>
                    <p className="tip-sayi">{tip.sayi} kayıt</p>
                    <p className="tip-ortalama">{formatPara(tip.ortalama)}/kayıt</p>
                  </div>
                  <div className="tip-bar">
                    <div 
                      className="tip-dolum"
                      style={{ 
                        width: `${giderVerisi.toplamGider > 0 ? (tip.toplam / giderVerisi.toplamGider) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bos-veri">
              <div className="bos-veri-icon">📊</div>
              <p>Gider tipi verisi bulunamadı.</p>
            </div>
          )}
        </div>

        {/* GÜNLÜK GİDER GRAFİĞİ */}
        <div className="gunluk-gider-section">
          <h2>Günlük Gider Takibi</h2>
          {giderVerisi?.gunlukGiderler && giderVerisi.gunlukGiderler.length > 0 ? (
            <GrafikBilesenleri.GunlukGelirCizgi 
              data={giderVerisi.gunlukGiderler.map(g => ({ 
                tarih: g.tarih, 
                gelir: g.toplamGider 
              }))}
            />
          ) : (
            <div className="bos-veri">
              <div className="bos-veri-icon">📈</div>
              <p>Günlük gider verisi bulunamadı.</p>
            </div>
          )}
        </div>

        {/* GİDER LİSTESİ TABLOSU */}
        <div className="gider-liste-section">
          <h2>Gider Listesi</h2>
          {giderVerisi?.giderListesi && giderVerisi.giderListesi.length > 0 ? (
            <TabloBilesenleri.BasitTablosu
              columns={[
                { key: 'tarih', header: 'Tarih', type: 'date' },
                { key: 'tip', header: 'Gider Tipi', type: 'text' },
                { key: 'aciklama', header: 'Açıklama', type: 'text' },
                { key: 'tutar', header: 'Tutar', type: 'currency' },
                { key: 'odemeTipi', header: 'Ödeme Tipi', type: 'text' },
                { key: 'personel', header: 'Personel', type: 'text' }
              ]}
              data={giderVerisi.giderListesi}
              title=""
            />
          ) : (
            <div className="bos-veri">
              <div className="bos-veri-icon">📝</div>
              <p>Gider listesi bulunamadı.</p>
            </div>
          )}
        </div>
      </div>

      {/* SAĞ SÜTUN - DETAY */}
      <div className="sag-sutun">
        {/* DETAY ÖZET */}
        <div className="detay-ozet">
          <h2>Rapor Özeti</h2>
          <div className="detay-ozet-item">
            <span className="detay-ozet-label">Kayıt Sayısı</span>
            <span className="detay-ozet-deger">{giderVerisi?.toplamKayit || 0}</span>
          </div>
          <div className="detay-ozet-item">
            <span className="detay-ozet-label">Gün Sayısı</span>
            <span className="detay-ozet-deger">{giderVerisi?.gunSayisi || 0}</span>
          </div>
          <div className="detay-ozet-item">
            <span className="detay-ozet-label">Günlük Ortalama</span>
            <span className="detay-ozet-deger">{formatPara(giderVerisi?.gunlukOrtalama || 0)}</span>
          </div>
          <div className="detay-ozet-item">
            <span className="detay-ozet-label">Kayıt Ortalaması</span>
            <span className="detay-ozet-deger">{formatPara(giderVerisi?.ortalamaGider || 0)}</span>
          </div>
          <div className="detay-ozet-item">
            <span className="detay-ozet-label">Gider Tipleri</span>
            <span className="detay-ozet-deger">{giderVerisi?.giderTipleri?.length || 0}</span>
          </div>
        </div>

        {/* EN SON GİDERLER */}
        <div className="son-giderler">
          <h2>Son Giderler</h2>
          {sonGiderler.length > 0 ? (
            sonGiderler.map((gider, index) => (
              <div key={index} className="gider-item">
                <div className="gider-item-info">
                  <h4>{gider.aciklama?.substring(0, 20) || 'Gider'}</h4>
                  <p>
                    <span>{formatTarih(gider.tarih)}</span>
                    <span>•</span>
                    <span>{gider.tip}</span>
                  </p>
                </div>
                <div className="gider-item-tutar">{formatPara(gider.tutar)}</div>
              </div>
            ))
          ) : (
            <div className="bos-veri">
              <div className="bos-veri-icon">🕒</div>
              <p>Son gider bulunamadı.</p>
            </div>
          )}
        </div>

        {/* EXPORT BUTTONLARI */}
        <div className="export-section">
          <h2>Raporu Dışa Aktar</h2>
          <div className="export-buttons">
            <button className="btn-pdf" onClick={handleExportPDF}>
              📄 PDF İndir
            </button>
            <button className="btn-print" onClick={() => window.print()}>
              🖨️ Yazdır
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiderDetay;