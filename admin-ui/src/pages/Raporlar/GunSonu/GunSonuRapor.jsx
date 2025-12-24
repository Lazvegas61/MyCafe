import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./GunSonuRapor.css";

const GunSonuRapor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gunDetay, setGunDetay] = useState(null);

  // Veriyi yükle
  useEffect(() => {
    const fetchGunSonuDetay = async () => {
      setYukleniyor(true);
      try {
        setTimeout(() => {
          setGunDetay({
            id: id || 1,
            tarih: "20 Nisan 2024",
            acilis: "08:15",
            kapanis: "23:45",
            kapanisYapan: "Admin",
            masaHareketleri: [
              { masa: "5", acilis: "08:20", kapanis: "09:45", sure: "01:25", nakit: 80, kart: 20, hesabaYaz: 30 },
              { masa: "7", acilis: "10:00", kapanis: "11:30", sure: "01:30", nakit: 20, kart: 10, hesabaYaz: 10 },
              { masa: "12", acilis: "12:15", kapanis: "14:00", sure: "01:45", nakit: 10, kart: 15, hesabaYaz: 20 },
              { masa: "Bilardo 2", acilis: "15:30", kapanis: "17:00", sure: "01:30", nakit: 80, kart: 50, hesabaYaz: 10 },
              { masa: "3", acilis: "18:00", kapanis: "19:30", sure: "01:30", nakit: 45, kart: 25, hesabaYaz: 15 },
              { masa: "8", acilis: "20:15", kapanis: "21:45", sure: "01:30", nakit: 60, kart: 40, hesabaYaz: 5 },
              { masa: "Bilardo 5", acilis: "16:30", kapanis: "18:00", sure: "01:30", nakit: 120, kart: 0, hesabaYaz: 0 },
              { masa: "10", acilis: "14:45", kapanis: "16:15", sure: "01:30", nakit: 35, kart: 25, hesabaYaz: 8 },
              { masa: "15", acilis: "11:00", kapanis: "12:30", sure: "01:30", nakit: 28, kart: 12, hesabaYaz: 7 },
              { masa: "22", acilis: "19:00", kapanis: "20:30", sure: "01:30", nakit: 95, kart: 55, hesabaYaz: 25 }
            ],
            giderler: [
              { ad: "Personel Yemek", tutar: 200 },
              { ad: "Temizlik Malzemesi", tutar: 75 },
              { ad: "Elektrik Faturası", tutar: 400 },
              { ad: "Su Faturası", tutar: 120 },
              { ad: "Doğalgaz", tutar: 350 },
              { ad: "Kira", tutar: 5000 }
            ],
            urunSatislari: [
              { urun: "Çay", adet: 50, birim: 2, tutar: 100, maliyetsiz: true },
              { urun: "Oralet", adet: 30, birim: 3, tutar: 90, maliyetsiz: true },
              { urun: "Tost", adet: 12, birim: 15, tutar: 180, maliyetsiz: false },
              { urun: "Nescafe", adet: 25, birim: 8, tutar: 200, maliyetsiz: false },
              { urun: "Su", adet: 40, birim: 3, tutar: 120, maliyetsiz: true },
              { urun: "Kola", adet: 18, birim: 7, tutar: 126, maliyetsiz: false },
              { urun: "Ayran", adet: 22, birim: 5, tutar: 110, maliyetsiz: false },
              { urun: "Limonata", adet: 15, birim: 10, tutar: 150, maliyetsiz: false }
            ],
            ozet: {
              toplamNakit: 645,
              toplamKart: 480,
              toplamHesap: 120,
              toplamGider: 675,
              netKar: 570,
              toplamCiro: 1245
            }
          });
          setYukleniyor(false);
        }, 800);
      } catch (error) {
        console.error('Gün sonu detayı yüklenemedi:', error);
        setYukleniyor(false);
      }
    };

    fetchGunSonuDetay();
  }, [id]);

  // Hesaplamalar
  const toplamMasaNakit = gunDetay?.masaHareketleri.reduce((sum, m) => sum + m.nakit, 0) || 0;
  const toplamMasaKart = gunDetay?.masaHareketleri.reduce((sum, m) => sum + m.kart, 0) || 0;
  const toplamMasaHesap = gunDetay?.masaHareketleri.reduce((sum, m) => sum + m.hesabaYaz, 0) || 0;
  const toplamUrunSatis = gunDetay?.urunSatislari.reduce((sum, u) => sum + u.tutar, 0) || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert('PDF indiriliyor...');
  };

  const handleExportExcel = () => {
    alert('Excel dosyası indiriliyor...');
  };

  const handleBack = () => {
    navigate('/raporlar/gun-sonu');
  };

  const handleDetayliRapor = () => {
    navigate('/raporlar/gun-sonu-detay');
  };

  if (yukleniyor) {
    return (
      <div className="gun-sonu-rapor-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Gün sonu raporu yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!gunDetay) {
    return (
      <div className="gun-sonu-rapor-container">
        <div className="error-state">
          <div className="error-icon">📊</div>
          <div className="error-text">Gün sonu raporu bulunamadı</div>
          <button 
            onClick={handleBack}
            className="btn btn-primary"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gun-sonu-rapor-container">
      {/* HEADER - TAM GENİŞLİK */}
      <div className="rapor-header">
        <div className="rapor-title">
          <h1>
            Gün Sonu Raporu
            <span className="tarih">| {gunDetay.tarih}</span>
          </h1>
          
          <div className="btn-group">
            <button className="btn btn-tertiary" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i> Geri Dön
            </button>
            <button className="btn btn-secondary" onClick={handlePrint}>
              <i className="fas fa-print"></i> Yazdır
            </button>
          </div>
        </div>

        <div className="gun-bilgisi">
          <i className="fas fa-clock"></i>
          <span>Gün Başlangıcı: <strong>{gunDetay.acilis}</strong></span>
          <span>Gün Sonu: <strong>{gunDetay.kapanis}</strong></span>
          <span>Kapanışı Yapan: <strong>{gunDetay.kapanisYapan}</strong></span>
        </div>

        <div className="btn-group">
          <button className="btn btn-primary" onClick={handleExportPDF}>
            <i className="fas fa-file-pdf"></i> PDF İndir
          </button>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            <i className="fas fa-file-excel"></i> Excel Çıkart
          </button>
          <button className="btn btn-tertiary" onClick={handleDetayliRapor}>
            <i className="fas fa-chart-bar"></i> Detaylı Rapor
          </button>
        </div>
      </div>

      {/* ANA İÇERİK - GRID LAYOUT */}
      <div className="rapor-ana-container">
        {/* SOL TARAF - GENİŞ ALAN */}
        <div className="rapor-sol-taraf">
          {/* MASA HAREKETLERİ */}
          <div className="rapor-section">
            <h2><i className="fas fa-chair"></i> Masa Hareketleri</h2>
            <table className="rapor-table">
              <thead>
                <tr>
                  <th>Masa No</th>
                  <th>Açılış</th>
                  <th>Kapanış</th>
                  <th>Süre</th>
                  <th>Nakit</th>
                  <th>Kart</th>
                  <th>Hesaba Yaz</th>
                </tr>
              </thead>
              <tbody>
                {gunDetay.masaHareketleri.map((masa, index) => (
                  <tr key={index}>
                    <td><strong>{masa.masa}</strong></td>
                    <td>{masa.acilis}</td>
                    <td>{masa.kapanis}</td>
                    <td>{masa.sure}</td>
                    <td>{masa.nakit} TL</td>
                    <td>{masa.kart} TL</td>
                    <td>{masa.hesabaYaz} TL</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan="4"><strong>TOPLAM</strong></td>
                  <td><strong>{toplamMasaNakit} TL</strong></td>
                  <td><strong>{toplamMasaKart} TL</strong></td>
                  <td><strong>{toplamMasaHesap} TL</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* GİDERLER */}
          <div className="rapor-section">
            <h2><i className="fas fa-receipt"></i> Günlük Giderler</h2>
            <ul className="gider-listesi">
              {gunDetay.giderler.map((gider, index) => (
                <li key={index} className="gider-item">
                  <span className="gider-adi">
                    <i className="fas fa-minus-circle" style={{ color: '#e74c3c' }}></i>
                    {gider.ad}
                  </span>
                  <span className="gider-tutar">-{gider.tutar} TL</span>
                </li>
              ))}
              <li className="gider-total">
                <span>Genel Toplam:</span>
                <span className="gider-tutar">-{gunDetay.ozet.toplamGider} TL</span>
              </li>
            </ul>
          </div>

          {/* ÜRÜN SATIŞLARI */}
          <div className="rapor-section">
            <h2><i className="fas fa-shopping-cart"></i> Ürün Satışları</h2>
            
            {/* TABLO GÖRÜNÜMÜ */}
            <table className="rapor-table" style={{ marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Adet</th>
                  <th>Birim Fiyat</th>
                  <th>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {gunDetay.urunSatislari.map((urun, index) => (
                  <tr key={index} className={urun.maliyetsiz ? 'highlight' : ''}>
                    <td>
                      {urun.urun}
                      {urun.maliyetsiz && (
                        <span className="maliyetsiz-badge">
                          Maliyetsiz
                        </span>
                      )}
                    </td>
                    <td>{urun.adet}</td>
                    <td>{urun.birim} TL</td>
                    <td><strong>{urun.tutar} TL</strong></td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan="3"><strong>Toplam Satış:</strong></td>
                  <td><strong>{toplamUrunSatis} TL</strong></td>
                </tr>
              </tbody>
            </table>

            {/* KART GÖRÜNÜMÜ */}
            <div className="urun-grid">
              {gunDetay.urunSatislari.map((urun, index) => (
                <div key={index} className="urun-kart">
                  <h3>
                    {urun.urun}
                    {urun.maliyetsiz && (
                      <span className="maliyetsiz-badge">
                        Maliyetsiz
                      </span>
                    )}
                  </h3>
                  <div className="urun-detay">
                    <span className="label">Satılan Adet:</span>
                    <span className="deger">{urun.adet} adet</span>
                  </div>
                  <div className="urun-detay">
                    <span className="label">Birim Fiyat:</span>
                    <span className="deger">{urun.birim} TL</span>
                  </div>
                  <div className="toplam">
                    Toplam: {urun.tutar} TL
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ TARAF - SABİT ÖZET PANELİ */}
        <div className="rapor-sag-taraf">
          <div className="ozet-kart">
            <h2><i className="fas fa-chart-pie"></i> Günlük Özet</h2>
            
            <div className="ozet-row nakit">
              <span className="label">
                <i className="fas fa-money-bill-wave"></i> Nakit
              </span>
              <span className="value">{gunDetay.ozet.toplamNakit} TL</span>
            </div>
            
            <div className="ozet-row kart">
              <span className="label">
                <i className="fas fa-credit-card"></i> Kredi Kartı
              </span>
              <span className="value">{gunDetay.ozet.toplamKart} TL</span>
            </div>
            
            <div className="ozet-row hesap">
              <span className="label">
                <i className="fas fa-file-invoice-dollar"></i> Hesaba Yaz
                <small className="hesap-not">Tahsil edilmemiş</small>
              </span>
              <span className="value">{gunDetay.ozet.toplamHesap} TL</span>
            </div>
            
            <div className="ozet-row toplam-ciro">
              <span className="label">
                <i className="fas fa-cash-register"></i> Toplam Ciro
              </span>
              <span className="value">{gunDetay.ozet.toplamCiro} TL</span>
            </div>
            
            <div className="ozet-row gider">
              <span className="label">
                <i className="fas fa-receipt"></i> Giderler
              </span>
              <span className="value">-{gunDetay.ozet.toplamGider} TL</span>
            </div>
            
            <div className="ozet-row net-kar">
              <span className="label">Net Kâr</span>
              <span className="value">{gunDetay.ozet.netKar} TL</span>
            </div>

            {/* HIZLI İSTATİSTİKLER */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px',
                marginTop: '16px'
              }}>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  padding: '12px', 
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '800', 
                    color: '#d4af37',
                    marginBottom: '4px'
                  }}>
                    {gunDetay.masaHareketleri.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#c9b699' }}>
                    Aktif Masa
                  </div>
                </div>
                
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  padding: '12px', 
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '800', 
                    color: gunDetay.ozet.netKar > 0 ? '#2ecc71' : '#e74c3c',
                    marginBottom: '4px'
                  }}>
                    {gunDetay.ozet.netKar > 0 ? '👍' : '👎'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#c9b699' }}>
                    Kar Durumu
                  </div>
                </div>
                
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  padding: '12px', 
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '800', 
                    color: '#3498db',
                    marginBottom: '4px'
                  }}>
                    {gunDetay.urunSatislari.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#c9b699' }}>
                    Ürün Çeşidi
                  </div>
                </div>
                
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  padding: '12px', 
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '800', 
                    color: '#9b59b6',
                    marginBottom: '4px'
                  }}>
                    {gunDetay.giderler.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#c9b699' }}>
                    Gider Kalemi
                  </div>
                </div>
              </div>
            </div>

            {/* ORTALAMA DEĞERLER */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <h3 style={{ fontSize: '16px', color: '#f5e6d3', marginBottom: '12px' }}>
                <i className="fas fa-calculator"></i> Ortalamalar
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', 
                gap: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <span style={{ fontSize: '13px', color: '#c9b699' }}>Masa Başı Ort.</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#f5e6d3' }}>
                    {(gunDetay.ozet.toplamCiro / gunDetay.masaHareketleri.length).toFixed(0)} TL
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <span style={{ fontSize: '13px', color: '#c9b699' }}>Ürün Başı Ort.</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#f5e6d3' }}>
                    {(gunDetay.ozet.toplamCiro / toplamUrunSatis * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0'
                }}>
                  <span style={{ fontSize: '13px', color: '#c9b699' }}>Kar Marjı</span>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    color: gunDetay.ozet.netKar > 0 ? '#2ecc71' : '#e74c3c'
                  }}>
                    {((gunDetay.ozet.netKar / gunDetay.ozet.toplamCiro) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALT BİLGİ - TAM GENİŞLİK */}
      <div className="alt-bilgi">
        <div className="guvenlik-bilgisi">
          <i className="fas fa-shield-alt"></i>
          <span>Bu rapor güvenli bir şekilde saklanmaktadır.</span>
        </div>
        <div className="rapor-bilgisi">
          <div style={{ marginBottom: '4px' }}>
            <i className="fas fa-hashtag"></i> Rapor ID: <strong>{gunDetay.id}</strong>
          </div>
          <div>
            <i className="fas fa-calendar-check"></i> Oluşturulma: {new Date().toLocaleDateString('tr-TR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })} • {new Date().toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GunSonuRapor;