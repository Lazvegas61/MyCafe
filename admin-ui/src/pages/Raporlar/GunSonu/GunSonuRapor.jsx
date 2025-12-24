import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./GunSonuRapor.css";

const GunSonuRapor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gunDetay, setGunDetay] = useState(null);
  const [gunDurum, setGunDurum] = useState("devam");

  // Veriyi yükle
  useEffect(() => {
    const fetchGunSonuDetay = async () => {
      setYukleniyor(true);
      try {
        setTimeout(() => {
          const gunVerisi = {
            id: id || "GS20240420001",
            tarih: "20 Nisan 2024",
            gunNo: "Gün #145",
            acilis: "08:15",
            kapanis: "23:45",
            kapanisYapan: "Ahmet Yılmaz",
            durum: "tamamlandı",
            vardiya: "Sabah",
            masaHareketleri: [
              { masa: "5", acilis: "08:20", kapanis: "09:45", sure: "01:25", nakit: 80, kart: 20, hesabaYaz: 30 },
              { masa: "7", acilis: "10:00", kapanis: "11:30", sure: "01:30", nakit: 20, kart: 10, hesabaYaz: 10 },
              { masa: "12", acilis: "12:15", kapanis: "14:00", sure: "01:45", nakit: 10, kart: 15, hesabaYaz: 20 },
              { masa: "Bilardo 2", acilis: "15:30", kapanis: "17:00", sure: "01:30", nakit: 80, kart: 50, hesabaYaz: 10 },
              { masa: "3", acilis: "18:00", kapanis: "19:30", sure: "01:30", nakit: 45, kart: 25, hesabaYaz: 15 }
            ],
            giderler: [
              { ad: "Personel Yemek", tutar: 200, kategori: "personel" },
              { ad: "Temizlik Malzemesi", tutar: 75, kategori: "temizlik" },
              { ad: "Elektrik Faturası", tutar: 400, kategori: "fatura" },
              { ad: "Su Faturası", tutar: 120, kategori: "fatura" },
              { ad: "Doğalgaz", tutar: 350, kategori: "fatura" },
              { ad: "Kira", tutar: 5000, kategori: "kira" }
            ],
            urunSatislari: [
              { urun: "Çay", adet: 50, birim: 2, tutar: 100, maliyetsiz: true, kategori: "içecek" },
              { urun: "Oralet", adet: 30, birim: 3, tutar: 90, maliyetsiz: true, kategori: "içecek" },
              { urun: "Tost", adet: 12, birim: 15, tutar: 180, maliyetsiz: false, kategori: "yiyecek" },
              { urun: "Nescafe", adet: 25, birim: 8, tutar: 200, maliyetsiz: false, kategori: "içecek" },
              { urun: "Su", adet: 40, birim: 3, tutar: 120, maliyetsiz: true, kategori: "içecek" }
            ],
            kasalar: [
              { ad: "Ana Kasa", acilis: 1500, kapanis: 2500, fark: 1000 },
              { ad: "Yan Kasa", acilis: 500, kapanis: 800, fark: 300 }
            ],
            ozet: {
              toplamNakit: 645,
              toplamKart: 480,
              toplamHesap: 120,
              toplamGider: 675,
              netKar: 570,
              toplamCiro: 1245,
              brutKar: 1245,
              tahsilEdilmeyen: 120
            }
          };
          
          setGunDetay(gunVerisi);
          setGunDurum(gunVerisi.durum);
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
  const toplamKasaFark = gunDetay?.kasalar.reduce((sum, k) => sum + k.fark, 0) || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert('PDF raporu oluşturuluyor...');
  };

  const handleExportExcel = () => {
    const data = {
      gunDetay,
      hesaplamalar: {
        toplamMasaNakit,
        toplamMasaKart,
        toplamMasaHesap,
        toplamUrunSatis,
        toplamKasaFark
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gun-sonu-raporu-${gunDetay?.id || 'rapor'}.json`;
    a.click();
    
    alert('Excel dosyası indiriliyor...');
  };

  const handleBack = () => {
    navigate('/raporlar');
  };

  const handleGunSonlandir = () => {
    if (window.confirm('Günü sonlandırmak istediğinize emin misiniz?')) {
      alert('Gün sonlandırıldı! Rapor hazırlanıyor...');
      window.location.reload();
    }
  };

  const handleDetayliRapor = () => {
    navigate(`/raporlar/gun-sonu-detay/${id}`);
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
      {/* ÜST BİLGİ - GÜN DURUMU */}
      <div className="gun-durum-banner">
        <div className="durum-bilgisi">
          <span className={`durum-badge ${gunDurum}`}>
            <i className={`fas fa-${gunDurum === 'tamamlandı' ? 'check-circle' : 'play-circle'}`}></i>
            {gunDurum === 'tamamlandı' ? 'Gün Tamamlandı' : 'Gün Devam Ediyor'}
          </span>
          <span className="gun-bilgi">
            <i className="fas fa-calendar-day"></i> {gunDetay.gunNo}
          </span>
          <span className="gun-bilgi">
            <i className="fas fa-user-clock"></i> Vardiya: {gunDetay.vardiya}
          </span>
        </div>
        
        <div className="gun-aksiyonlar">
          {gunDurum !== 'tamamlandı' && (
            <button className="btn btn-warning" onClick={handleGunSonlandir}>
              <i className="fas fa-stop-circle"></i> Günü Sonlandır
            </button>
          )}
        </div>
      </div>

      {/* ANA BAŞLIK */}
      <div className="rapor-header">
        <div className="rapor-title-area">
          <h1>
            <i className="fas fa-file-invoice-dollar"></i>
            Gün Sonu Raporu
          </h1>
          <div className="rapor-meta">
            <div className="rapor-id">
              <i className="fas fa-hashtag"></i> Rapor ID: <strong>{gunDetay.id}</strong>
            </div>
            <div className="rapor-tarih">
              <i className="fas fa-calendar-alt"></i> {gunDetay.tarih}
            </div>
          </div>
        </div>

        <div className="rapor-aksiyonlar">
          <div className="btn-group">
            <button className="btn btn-secondary" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i> Geri
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <i className="fas fa-print"></i> Yazdır
            </button>
            <button className="btn btn-danger" onClick={handleExportPDF}>
              <i className="fas fa-file-pdf"></i> PDF
            </button>
            <button className="btn btn-success" onClick={handleExportExcel}>
              <i className="fas fa-file-excel"></i> Excel
            </button>
            <button className="btn btn-info" onClick={handleDetayliRapor}>
              <i className="fas fa-chart-line"></i> Detay
            </button>
          </div>
        </div>
      </div>

      {/* ANA İÇERİK */}
      <div className="rapor-ana-icerik">
        {/* SOL KOLON */}
        <div className="rapor-sol-kolon">
          {/* FİNANSAL ÖZET */}
          <div className="finansal-ozet-kart">
            <h3><i className="fas fa-chart-bar"></i> Finansal Özet</h3>
            <div className="finansal-grid">
              <div className="finansal-item gelir">
                <div className="finansal-label">Toplam Ciro</div>
                <div className="finansal-deger">{gunDetay.ozet.toplamCiro} TL</div>
                <div className="finansal-detay">Brüt Gelir</div>
              </div>
              
              <div className="finansal-item nakit">
                <div className="finansal-label">Nakit</div>
                <div className="finansal-deger">{gunDetay.ozet.toplamNakit} TL</div>
                <div className="finansal-detay">{((gunDetay.ozet.toplamNakit / gunDetay.ozet.toplamCiro) * 100).toFixed(1)}%</div>
              </div>
              
              <div className="finansal-item kart">
                <div className="finansal-label">Kart</div>
                <div className="finansal-deger">{gunDetay.ozet.toplamKart} TL</div>
                <div className="finansal-detay">{((gunDetay.ozet.toplamKart / gunDetay.ozet.toplamCiro) * 100).toFixed(1)}%</div>
              </div>
              
              <div className="finansal-item gider">
                <div className="finansal-label">Giderler</div>
                <div className="finansal-deger">-{gunDetay.ozet.toplamGider} TL</div>
                <div className="finansal-detay">Toplam Masraf</div>
              </div>
              
              <div className="finansal-item net">
                <div className="finansal-label">Net Kâr</div>
                <div className="finansal-deger">{gunDetay.ozet.netKar} TL</div>
                <div className="finansal-detay">
                  Kar Marjı: {((gunDetay.ozet.netKar / gunDetay.ozet.toplamCiro) * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="finansal-item tahsilat">
                <div className="finansal-label">Tahsil Edilmeyen</div>
                <div className="finansal-deger">{gunDetay.ozet.tahsilEdilmeyen} TL</div>
                <div className="finansal-detay">Hesaba Yazılan</div>
              </div>
            </div>
          </div>

          {/* MASA HAREKETLERİ */}
          <div className="rapor-bolum">
            <h3><i className="fas fa-chair"></i> Masa Hareketleri</h3>
            <div className="table-responsive">
              <table className="rapor-tablosu">
                <thead>
                  <tr>
                    <th>Masa</th>
                    <th>Süre</th>
                    <th>Nakit</th>
                    <th>Kart</th>
                    <th>Hesap</th>
                    <th>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {gunDetay.masaHareketleri.map((masa, index) => (
                    <tr key={index}>
                      <td>
                        <div className="masa-bilgi">
                          <div className="masa-no">{masa.masa}</div>
                          <div className="masa-saat">{masa.acilis} - {masa.kapanis}</div>
                        </div>
                      </td>
                      <td>{masa.sure}</td>
                      <td>{masa.nakit} TL</td>
                      <td>{masa.kart} TL</td>
                      <td>{masa.hesabaYaz} TL</td>
                      <td><strong>{masa.nakit + masa.kart + masa.hesabaYaz} TL</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="toplam-satir">
                    <td colSpan="2">TOPLAM</td>
                    <td><strong>{toplamMasaNakit} TL</strong></td>
                    <td><strong>{toplamMasaKart} TL</strong></td>
                    <td><strong>{toplamMasaHesap} TL</strong></td>
                    <td><strong>{toplamMasaNakit + toplamMasaKart + toplamMasaHesap} TL</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON */}
        <div className="rapor-sag-kolon">
          {/* KASA DURUMU */}
          <div className="kasa-durumu-kart">
            <h3><i className="fas fa-safe"></i> Kasa Durumu</h3>
            <div className="kasa-listesi">
              {gunDetay.kasalar.map((kasa, index) => (
                <div key={index} className="kasa-item">
                  <div className="kasa-ad">{kasa.ad}</div>
                  <div className="kasa-degerler">
                    <div className="kasa-deger">
                      <span className="label">Açılış:</span>
                      <span className="value">{kasa.acilis} TL</span>
                    </div>
                    <div className="kasa-deger">
                      <span className="label">Kapanış:</span>
                      <span className="value">{kasa.kapanis} TL</span>
                    </div>
                    <div className="kasa-deger">
                      <span className="label">Fark:</span>
                      <span className={`value ${kasa.fark >= 0 ? 'pozitif' : 'negatif'}`}>
                        {kasa.fark >= 0 ? '+' : ''}{kasa.fark} TL
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="kasa-toplam">
                <div className="kasa-ad">Toplam Kasa Farkı</div>
                <div className="kasa-fark-total">
                  <span className={toplamKasaFark >= 0 ? 'pozitif' : 'negatif'}>
                    {toplamKasaFark >= 0 ? '+' : ''}{toplamKasaFark} TL
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* GİDERLER */}
          <div className="rapor-bolum">
            <h3><i className="fas fa-receipt"></i> Giderler</h3>
            <div className="gider-listesi">
              {gunDetay.giderler.map((gider, index) => (
                <div key={index} className="gider-item">
                  <div className="gider-ad">
                    <i className="fas fa-minus-circle"></i>
                    {gider.ad}
                    <span className="gider-kategori">{gider.kategori}</span>
                  </div>
                  <div className="gider-tutar">-{gider.tutar} TL</div>
                </div>
              ))}
              <div className="gider-toplam">
                <div className="gider-ad">Toplam Gider</div>
                <div className="gider-tutar">-{gunDetay.ozet.toplamGider} TL</div>
              </div>
            </div>
          </div>

          {/* ÜRÜN SATIŞLARI */}
          <div className="rapor-bolum">
            <h3><i className="fas fa-shopping-cart"></i> Ürün Satışları</h3>
            <div className="urun-satis-listesi">
              {gunDetay.urunSatislari.map((urun, index) => (
                <div key={index} className="urun-item">
                  <div className="urun-bilgi">
                    <div className="urun-ad">
                      {urun.urun}
                      {urun.maliyetsiz && (
                        <span className="maliyetsiz-badge">M</span>
                      )}
                    </div>
                    <div className="urun-detay">
                      {urun.adet} adet × {urun.birim} TL
                    </div>
                  </div>
                  <div className="urun-tutar">{urun.tutar} TL</div>
                </div>
              ))}
              <div className="urun-toplam">
                <div className="urun-ad">Toplam Satış</div>
                <div className="urun-tutar">{toplamUrunSatis} TL</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALT BİLGİ */}
      <div className="rapor-alt-bilgi">
        <div className="rapor-notlar">
          <div className="not-item">
            <i className="fas fa-info-circle"></i>
            <span>Bu rapor otomatik olarak oluşturulmuştur.</span>
          </div>
          <div className="not-item">
            <i className="fas fa-shield-alt"></i>
            <span>Rapor ID: {gunDetay.id} • Kapanış Yapan: {gunDetay.kapanisYapan}</span>
          </div>
        </div>
        
        <div className="rapor-tarih">
          <div>
            <i className="fas fa-calendar"></i>
            Oluşturulma: {new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR')}
          </div>
        </div>
      </div>

      {/* AKSiYON BUTONLARI - ALT */}
      <div className="alt-aksiyonlar">
        <button className="btn btn-secondary" onClick={handleBack}>
          <i className="fas fa-list"></i> Rapor Listesi
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          <i className="fas fa-print"></i> Raporu Yazdır
        </button>
        <button className="btn btn-danger" onClick={handleExportPDF}>
          <i className="fas fa-download"></i> PDF Olarak İndir
        </button>
        <button className="btn btn-success" onClick={handleExportExcel}>
          <i className="fas fa-file-export"></i> Excel'e Aktar
        </button>
      </div>
    </div>
  );
};

export default GunSonuRapor;